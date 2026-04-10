// ============================================================
// HANDLER - Unsafe Zone: Philosophical Socratic Dialogue
// POST /api/unsafe-zone — multi-turn conversation with Claude
//
// Uses guide-unsafe-zone from KV as system prompt.
// Escalates from Sonnet to Opus when crisis signals detected.
//
// BILLING MODEL:
// - Start: 10 credits (covers turns 1-20)
// - Extension: 5 credits per 10 additional turns
// - Warning at turns 15, 25, 35... (5 turns before payment gate)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { jsonResponse } from '../utils/index.js';
import { getServiceSupabase } from '../utils/supabase.js';
import { getUserFromAuth } from '../auth/index.js';
import { getSecret } from '../utils/secrets.js';
import { reserveCredit, confirmReservation, releaseReservation } from '../credits/index.js';

// ============================================================
// Constants
// ============================================================
const INITIAL_TURNS = 20;       // Turns included in initial 10-credit payment
const EXTENSION_TURNS = 10;     // Turns per 5-credit extension
const INITIAL_COST = 10;        // Credits for starting a session
const EXTENSION_COST = 5;       // Credits per extension
const WARNING_BEFORE = 5;       // Warn this many turns before payment gate

// ============================================================
// Crisis-signal escalation detection
// Switches to Opus when 2+ recent user messages contain crisis language
// ============================================================
const CRISIS_SIGNALS = [
  'no point', 'end it', "can't go on", "don't want to be here",
  'worthless', 'hopeless', 'hurt myself', 'kill myself', 'suicide',
  'want to die', 'better off dead', 'no reason to live',
];

function requiresEscalation(messages) {
  const recentUserMessages = messages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content.toLowerCase());

  let matchCount = 0;
  for (const msg of recentUserMessages) {
    if (CRISIS_SIGNALS.some(signal => msg.includes(signal))) {
      matchCount++;
    }
  }
  return matchCount >= 2;
}

// ============================================================
// Calculate turn limits and warnings
// ============================================================
function getTurnInfo(turnCount) {
  // turnCount is the number of user turns BEFORE this one
  const currentTurn = turnCount + 1;
  
  // Calculate which "block" we're in
  // Block 0: turns 1-20 (initial)
  // Block 1: turns 21-30 (first extension)
  // Block 2: turns 31-40 (second extension)
  // etc.
  
  let blockEnd, blockStart;
  if (currentTurn <= INITIAL_TURNS) {
    blockStart = 1;
    blockEnd = INITIAL_TURNS;
  } else {
    // Which extension block are we in?
    const turnsAfterInitial = currentTurn - INITIAL_TURNS;
    const extensionBlock = Math.ceil(turnsAfterInitial / EXTENSION_TURNS);
    blockStart = INITIAL_TURNS + (extensionBlock - 1) * EXTENSION_TURNS + 1;
    blockEnd = INITIAL_TURNS + extensionBlock * EXTENSION_TURNS;
  }
  
  const turnsRemaining = blockEnd - currentTurn + 1;
  const needsWarning = turnsRemaining === WARNING_BEFORE;
  const needsPayment = currentTurn > INITIAL_TURNS && 
    ((currentTurn - INITIAL_TURNS - 1) % EXTENSION_TURNS === 0);
  const isFirstTurn = currentTurn === 1;
  
  return {
    currentTurn,
    turnsRemaining,
    blockEnd,
    needsWarning,
    needsPayment,
    isFirstTurn,
    cost: isFirstTurn ? INITIAL_COST : (needsPayment ? EXTENSION_COST : 0),
  };
}

// ============================================================
// Reserve multiple credits atomically via reserve_credit RPC
// ============================================================
// Calls the atomic reserve_credit RPC N times (once per credit).
// If any reservation fails mid-loop, all prior reservations are
// released so the user is never charged for a failed attempt.
// ============================================================
async function reserveCredits(env, userId, amount) {
  const reservationIds = [];

  for (let i = 0; i < amount; i++) {
    try {
      const result = await reserveCredit(env, userId);

      if (!result.success) {
        console.log(`[UnsafeZone] Reservation ${i + 1}/${amount} failed: ${result.error}`);
        // Release all reservations made so far
        await releaseAllReservations(env, reservationIds);
        return { success: false, error: result.error || 'Insufficient credits' };
      }

      reservationIds.push(result.reservationId);
      console.log(`[UnsafeZone] Reserved credit ${i + 1}/${amount}: ${result.reservationId}`);
    } catch (error) {
      console.error(`[UnsafeZone] Reservation ${i + 1}/${amount} threw:`, error.message);
      // Release all reservations made so far
      await releaseAllReservations(env, reservationIds);
      return { success: false, error: 'Credit reservation failed' };
    }
  }

  console.log(`[UnsafeZone] All ${amount} credits reserved: [${reservationIds.join(', ')}]`);
  return { success: true, reservationIds };
}

// ============================================================
// Confirm all reservations (on successful AI response)
// ============================================================
async function confirmAllReservations(env, reservationIds, description) {
  for (const id of reservationIds) {
    try {
      await confirmReservation(env, id, description);
    } catch (error) {
      console.error(`[UnsafeZone] Failed to confirm reservation ${id}:`, error.message);
    }
  }
}

// ============================================================
// Release all reservations (on failure / rollback)
// ============================================================
async function releaseAllReservations(env, reservationIds) {
  for (const id of reservationIds) {
    try {
      await releaseReservation(env, id, 'failed');
    } catch (error) {
      console.error(`[UnsafeZone] Failed to release reservation ${id}:`, error.message);
    }
  }
}

// ============================================================
// Main handler
// ============================================================
export async function handleUnsafeZone(request, env, origin) {
  try {
    // Auth
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return jsonResponse({ error: 'Invalid request body' }, 400, origin, env);
    }
    const { messages, lang, sessionId } = body;

    // SECURITY: Validate language code against allowlist
    const VALID_LANGS = ["en","pt","es","fr","de","it","ru","hu","he","zh","ja","ko","ar","hi","fa","nl","pl","tr"];
    if (lang && !VALID_LANGS.includes(lang.split('-')[0].toLowerCase())) {
      return jsonResponse({ error: 'Invalid language' }, 400, origin, env);
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'Messages array is required' }, 400, origin, env);
    }

    // Input size limits
    if (messages.length > 50) {
      return jsonResponse({ error: 'Too many messages (max 50)' }, 400, origin, env);
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        return jsonResponse({ error: 'Invalid message format' }, 400, origin, env);
      }
      if (typeof msg.content === 'string' && msg.content.length > 5000) {
        return jsonResponse({ error: 'Message content too long (max 5000 chars)' }, 400, origin, env);
      }
    }

    // Last message must be from user
    if (messages[messages.length - 1].role !== 'user') {
      return jsonResponse({ error: 'Last message must be from user' }, 400, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Find or create session
    let session = null;
    
    if (sessionId) {
      // Resume existing session
      const { data: sessions } = await supabase
        .from('unsafe_zone_sessions')
        .select('*', { 
          filter: `id=eq.${sessionId}&user_id=eq.${user.userId}`, 
          limit: 1 
        });
      session = Array.isArray(sessions) ? sessions[0] : sessions;
      
      if (!session) {
        return jsonResponse({ error: 'Session not found' }, 404, origin, env);
      }
      if (session.status !== 'active') {
        return jsonResponse({ error: 'Session is no longer active' }, 400, origin, env);
      }
    } else {
      // Check for existing active session
      const { data: activeSessions } = await supabase
        .from('unsafe_zone_sessions')
        .select('*', { 
          filter: `user_id=eq.${user.userId}&status=eq.active`, 
          limit: 1 
        });
      session = Array.isArray(activeSessions) ? activeSessions[0] : activeSessions;
    }

    // Calculate turn info
    const turnCount = session?.turn_count || 0;
    const turnInfo = getTurnInfo(turnCount);

    // Handle billing — atomic reserve/confirm/release pattern
    let reservationIds = [];
    if (turnInfo.cost > 0) {
      const reservation = await reserveCredits(env, user.userId, turnInfo.cost);
      if (!reservation.success) {
        return jsonResponse({
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: turnInfo.cost,
          isExtension: !turnInfo.isFirstTurn,
        }, 402, origin, env);
      }
      reservationIds = reservation.reservationIds;
      console.log(`[UnsafeZone] Reserved ${turnInfo.cost} credits for ${turnInfo.isFirstTurn ? 'new session' : 'extension'}`);
    }

    // Create session if new
    if (!session) {
      const { data: newSession, error: createError } = await supabase
        .from('unsafe_zone_sessions')
        .insert({
          user_id: user.userId,
          messages: [],
          turn_count: 0,
          status: 'active',
        });
      
      if (createError) {
        console.error('[UnsafeZone] Failed to create session:', createError);
        return jsonResponse({ error: 'Failed to create session' }, 500, origin, env);
      }
      
      // Fetch the created session
      const { data: created } = await supabase
        .from('unsafe_zone_sessions')
        .select('*', { 
          filter: `user_id=eq.${user.userId}&status=eq.active`, 
          limit: 1 
        });
      session = Array.isArray(created) ? created[0] : created;
    }

    // Fetch guide from KV
    let guide = null;
    if (env.PHILOSIFY_KV) {
      guide = await env.PHILOSIFY_KV.get('guide-unsafe-zone');
    }
    if (!guide) {
      console.error('[UnsafeZone] guide-unsafe-zone not found in KV');
      return jsonResponse({ error: 'Service configuration error' }, 500, origin, env);
    }

    // Determine model based on crisis escalation
    const escalate = requiresEscalation(messages);
    const model = escalate ? 'claude-opus-4-6' : 'claude-sonnet-4-6';

    if (escalate) {
      console.log('[UnsafeZone] Crisis signals detected — escalating to Opus');
    }

    // Inject language instruction into system prompt if not English
    const targetLang = lang || 'en';
    let systemPrompt = guide;
    if (targetLang !== 'en') {
      systemPrompt += `\n\n🚨 CRITICAL: Respond ENTIRELY in the language with ISO code "${targetLang}". Every word must be in ${targetLang}. Do not use English unless quoting a specific term.`;
    }

    // Call Anthropic
    const apiKey = await getSecret(env.ANTHROPIC_API_KEY);
    if (!apiKey) {
      await releaseAllReservations(env, reservationIds);
      return jsonResponse({ error: 'Service configuration error' }, 500, origin, env);
    }

    const client = new Anthropic({ apiKey });

    let response;
    try {
      console.log(`[UnsafeZone] Turn ${turnInfo.currentTurn}: Calling ${model} with ${messages.length} messages`);

      response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });
    } catch (aiError) {
      console.error('[UnsafeZone] AI call failed:', aiError.message);
      // Release all reservations — user is not charged for AI failures
      await releaseAllReservations(env, reservationIds);

      const FILTERED_MSG = {
        en: 'The response was filtered. Please rephrase your question.',
        pt: 'A resposta foi filtrada. Reformule sua pergunta.',
        es: 'La respuesta fue filtrada. Reformula tu pregunta.',
        fr: 'La reponse a ete filtree. Veuillez reformuler votre question.',
        de: 'Die Antwort wurde gefiltert. Bitte formulieren Sie Ihre Frage um.',
        it: 'La risposta e stata filtrata. Riformula la tua domanda.',
        ru: 'Ответ был отфильтрован. Пожалуйста, переформулируйте ваш вопрос.',
        hu: 'A valasz szuresre kerult. Kerlek, fogalmazd ujra a kerdesed.',
        he: 'התשובה סוננה. אנא נסח מחדש את שאלתך.',
        zh: '回复已被过滤。请重新表述您的问题。',
        ja: '回答がフィルタリングされました。質問を言い換えてください。',
        ko: '응답이 필터링되었습니다. 질문을 다시 표현해 주세요.',
        ar: 'تمت تصفية الرد. يرجى إعادة صياغة سؤالك.',
        hi: 'जवाब फ़िल्टर कर दिया गया। कृपया अपना प्रश्न दोबारा लिखें।',
        fa: 'پاسخ فیلتر شد. لطفاً سوال خود را دوباره بنویسید.',
        nl: 'Het antwoord is gefilterd. Herformuleer uw vraag.',
        pl: 'Odpowiedz zostala przefiltrowana. Prosze przeformulowac pytanie.',
        tr: 'Yanit filtrelendi. Lutfen sorunuzu yeniden ifade edin.',
      };
      const FAILED_MSG = {
        en: 'Failed to process your question. Please try again.',
        pt: 'Falha ao processar sua pergunta. Tente novamente.',
        es: 'Error al procesar tu pregunta. Intentalo de nuevo.',
        fr: 'Echec du traitement de votre question. Veuillez reessayer.',
        de: 'Fehler bei der Verarbeitung Ihrer Frage. Bitte versuchen Sie es erneut.',
        it: 'Impossibile elaborare la tua domanda. Riprova.',
        ru: 'Не удалось обработать ваш вопрос. Пожалуйста, попробуйте снова.',
        hu: 'Nem sikerult feldolgozni a kerdesed. Probald ujra.',
        he: 'עיבוד השאלה נכשל. אנא נסה שוב.',
        zh: '处理您的问题失败。请重试。',
        ja: '質問の処理に失敗しました。もう一度お試しください。',
        ko: '질문 처리에 실패했습니다. 다시 시도해 주세요.',
        ar: 'فشل في معالجة سؤالك. يرجى المحاولة مرة أخرى.',
        hi: 'आपके प्रश्न को संसाधित करने में विफल। कृपया पुनः प्रयास करें।',
        fa: 'پردازش سوال شما ناموفق بود. لطفاً دوباره تلاش کنید.',
        nl: 'Kan uw vraag niet verwerken. Probeer het opnieuw.',
        pl: 'Nie udalo sie przetworzyc pytania. Sprobuj ponownie.',
        tr: 'Sorunuz islenemedi. Lutfen tekrar deneyin.',
      };
      const targetLang = (lang || 'en').split('-')[0];

      const errMsg = aiError.message || aiError.error?.message || '';
      if (errMsg.includes('content') || errMsg.includes('blocked') || errMsg.includes('safety')) {
        return jsonResponse({
          error: FILTERED_MSG[targetLang] || FILTERED_MSG.en,
        }, 400, origin, env);
      }

      return jsonResponse(
        { error: FAILED_MSG[targetLang] || FAILED_MSG.en },
        500, origin, env
      );
    }

    // Extract text reply
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      await releaseAllReservations(env, reservationIds);
      return jsonResponse({ error: 'No response from AI' }, 500, origin, env);
    }

    const reply = textContent.text;

    const u = response.usage;
    console.log(`[UnsafeZone] ${model} — ${u.input_tokens + u.output_tokens} tokens (${u.input_tokens} in, ${u.output_tokens} out)`);

    // AI succeeded — confirm all reservations
    const description = `unsafe-zone:${turnInfo.isFirstTurn ? 'start' : 'extension'}:${session.id}`;
    await confirmAllReservations(env, reservationIds, description);
    console.log(`[UnsafeZone] Confirmed ${reservationIds.length} reservations for ${turnInfo.isFirstTurn ? 'new session' : 'extension'}`);

    // Save conversation to session
    const fullConversation = [...messages, { role: 'assistant', content: reply }];
    const newTurnCount = turnCount + 1;

    await supabase
      .from('unsafe_zone_sessions')
      .update({
        messages: fullConversation,
        turn_count: newTurnCount,
        updated_at: new Date().toISOString(),
      }, `id=eq.${session.id}`);

    // Build response
    const responseData = {
      reply,
      sessionId: session.id,
      turn: turnInfo.currentTurn,
      turnsRemaining: turnInfo.turnsRemaining - 1, // After this turn
    };

    // Add warning if approaching payment gate
    if (turnInfo.needsWarning) {
      responseData.warning = {
        turnsRemaining: WARNING_BEFORE,
        extensionCost: EXTENSION_COST,
        extensionTurns: EXTENSION_TURNS,
      };
    }

    // Return with no-cache headers
    const resp = jsonResponse(responseData, 200, origin, env);
    resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    resp.headers.set('Pragma', 'no-cache');
    resp.headers.set('Expires', '0');
    return resp;

  } catch (err) {
    console.error('[UnsafeZone] Error:', err);

    return jsonResponse(
      { error: 'Failed to process your question. Please try again.' },
      500, origin, env
    );
  }
}

// ============================================================
// LOAD ACTIVE SESSION — GET /api/unsafe-zone/conversation
// Returns the user's active session.
// ============================================================
export async function handleUnsafeZoneLoad(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    const { data: sessions } = await supabase
      .from('unsafe_zone_sessions')
      .select('id,messages,turn_count,status,updated_at', { 
        filter: `user_id=eq.${user.userId}&status=eq.active`, 
        limit: 1 
      });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;
    
    if (!session) {
      return jsonResponse({ messages: [], sessionId: null, turn: 0 }, 200, origin, env);
    }

    const turnInfo = getTurnInfo(session.turn_count);

    const resp = jsonResponse({
      messages: session.messages || [],
      sessionId: session.id,
      turn: session.turn_count,
      turnsRemaining: turnInfo.turnsRemaining,
    }, 200, origin, env);
    resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return resp;

  } catch (err) {
    console.error('[UnsafeZone] Load error:', err);
    return jsonResponse({ error: 'Failed to load conversation' }, 500, origin, env);
  }
}

// ============================================================
// HISTORY — GET /api/unsafe-zone/history
// Returns all user's past sessions (completed and active).
// ============================================================
export async function handleUnsafeZoneHistory(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Get all sessions, most recent first
    const { data: sessions } = await supabase
      .from('unsafe_zone_sessions')
      .select('id,turn_count,status,created_at,updated_at,messages', { 
        filter: `user_id=eq.${user.userId}`,
        order: 'created_at.desc',
        limit: 50 
      });

    // Transform to summary format (don't send full messages in list)
    const history = (sessions || []).map(s => {
      // Get first user message as preview
      const firstUserMsg = (s.messages || []).find(m => m.role === 'user');
      const preview = firstUserMsg?.content?.substring(0, 100) || '';
      
      return {
        id: s.id,
        preview: preview + (preview.length >= 100 ? '...' : ''),
        turnCount: s.turn_count,
        status: s.status,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });

    return jsonResponse({ history }, 200, origin, env);

  } catch (err) {
    console.error('[UnsafeZone] History error:', err);
    return jsonResponse({ error: 'Failed to load history' }, 500, origin, env);
  }
}

// ============================================================
// GET SESSION — GET /api/unsafe-zone/session/:id
// Returns a specific session's full conversation.
// ============================================================
export async function handleUnsafeZoneGetSession(request, env, origin, sessionId) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    const { data: sessions } = await supabase
      .from('unsafe_zone_sessions')
      .select('*', { 
        filter: `id=eq.${sessionId}&user_id=eq.${user.userId}`, 
        limit: 1 
      });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;
    
    if (!session) {
      return jsonResponse({ error: 'Session not found' }, 404, origin, env);
    }

    const turnInfo = getTurnInfo(session.turn_count);

    const resp = jsonResponse({
      id: session.id,
      messages: session.messages || [],
      turnCount: session.turn_count,
      turnsRemaining: session.status === 'active' ? turnInfo.turnsRemaining : 0,
      status: session.status,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }, 200, origin, env);
    resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return resp;

  } catch (err) {
    console.error('[UnsafeZone] Get session error:', err);
    return jsonResponse({ error: 'Failed to load session' }, 500, origin, env);
  }
}

// ============================================================
// END SESSION — POST /api/unsafe-zone/end
// Marks the active session as completed.
// ============================================================
export async function handleUnsafeZoneEnd(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    await supabase
      .from('unsafe_zone_sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      }, `user_id=eq.${user.userId}&status=eq.active`);

    return jsonResponse({ success: true }, 200, origin, env);

  } catch (err) {
    console.error('[UnsafeZone] End session error:', err);
    return jsonResponse({ error: 'Failed to end session' }, 500, origin, env);
  }
}

// ============================================================
// CLEAR/DELETE SESSION — DELETE /api/unsafe-zone/conversation
// Deletes the user's active session (start fresh).
// ============================================================
export async function handleUnsafeZoneClear(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Delete active session
    await supabase
      .from('unsafe_zone_sessions')
      .delete(`user_id=eq.${user.userId}&status=eq.active`);

    return jsonResponse({ success: true }, 200, origin, env);

  } catch (err) {
    console.error('[UnsafeZone] Clear error:', err);
    return jsonResponse({ error: 'Failed to clear conversation' }, 500, origin, env);
  }
}
