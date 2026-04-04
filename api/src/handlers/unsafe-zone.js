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
import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../utils/index.js';
import { getServiceSupabase } from '../utils/supabase.js';
import { getUserFromAuth } from '../auth/index.js';
import { getSecret } from '../utils/secrets.js';
import { callRpc } from '../utils/supabase.js';

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
// Reserve multiple credits (using official Supabase client)
// ============================================================
async function reserveCredits(env, userId, amount) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseServiceKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  
  // Check balance first
  const { data: row, error: balanceError } = await supabase
    .from('credits')
    .select('free_remaining, purchased, total')
    .eq('user_id', userId)
    .single();
  
  if (balanceError) {
    console.error('[UnsafeZone] Error fetching balance:', balanceError.message);
    return { success: false, error: 'Failed to check balance' };
  }
  
  if (!row) {
    console.error('[UnsafeZone] No credits row found for user:', userId);
    return { success: false, error: 'No credits found' };
  }
  
  const total = row.total || 0;
  
  console.log('[UnsafeZone] Balance check:', { 
    userId, 
    amount, 
    free: row.free_remaining, 
    purchased: row.purchased, 
    total 
  });
  
  if (total < amount) {
    console.log('[UnsafeZone] Insufficient credits:', { required: amount, available: total });
    return { success: false, error: 'Insufficient credits' };
  }
  
  // Deduct credits (free first, then purchased)
  let remaining = amount;
  let freeToDeduct = Math.min(row.free_remaining || 0, remaining);
  remaining -= freeToDeduct;
  let purchasedToDeduct = remaining;
  
  const { error: updateError } = await supabase
    .from('credits')
    .update({
      free_remaining: (row.free_remaining || 0) - freeToDeduct,
      purchased: (row.purchased || 0) - purchasedToDeduct,
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('[UnsafeZone] Error deducting credits:', updateError.message);
    return { success: false, error: 'Failed to deduct credits' };
  }
  
  console.log(`[UnsafeZone] Deducted ${amount} credits (${freeToDeduct} free, ${purchasedToDeduct} purchased)`);
  return { success: true, amount };
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

    const body = await request.json();
    const { messages, lang, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'Messages array is required' }, 400, origin, env);
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        return jsonResponse({ error: 'Invalid message format' }, 400, origin, env);
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

    // Handle billing
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
      console.log(`[UnsafeZone] Charged ${turnInfo.cost} credits for ${turnInfo.isFirstTurn ? 'new session' : 'extension'}`);
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
      return jsonResponse({ error: 'Service configuration error' }, 500, origin, env);
    }

    const client = new Anthropic({ apiKey });

    console.log(`[UnsafeZone] Turn ${turnInfo.currentTurn}: Calling ${model} with ${messages.length} messages`);

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    // Extract text reply
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      return jsonResponse({ error: 'No response from AI' }, 500, origin, env);
    }

    const reply = textContent.text;

    const u = response.usage;
    console.log(`[UnsafeZone] ${model} — ${u.input_tokens + u.output_tokens} tokens (${u.input_tokens} in, ${u.output_tokens} out)`);

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

    // Check for content filtering
    const errMsg = err.message || err.error?.message || '';
    if (errMsg.includes('content') || errMsg.includes('blocked') || errMsg.includes('safety')) {
      return jsonResponse({
        error: 'The response was filtered. Please rephrase your question.',
      }, 400, origin, env);
    }

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
