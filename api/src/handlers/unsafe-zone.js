// ============================================================
// HANDLER - Unsafe Zone: Philosophical Socratic Dialogue
// POST /api/unsafe-zone — multi-turn conversation with Claude
//
// Uses guide-unsafe-zone from KV as system prompt.
// Escalates from Sonnet to Opus when crisis signals detected.
// Client-side history only — no Supabase storage during session.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { jsonResponse } from '../utils/index.js';
import { getServiceSupabase } from '../utils/supabase.js';
import { getUserFromAuth } from '../auth/index.js';
import { reserveCredit, confirmReservation, releaseReservation } from '../credits/index.js';
import { getSecret } from '../utils/secrets.js';

// ============================================================
// Crisis-signal escalation detection
// Switches to Opus when 3+ recent user messages contain crisis language
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
    const { messages, lang } = body;

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

    // Reserve 1 credit per turn
    let reservation;
    try {
      reservation = await reserveCredit(env, user.userId);
    } catch (reserveErr) {
      console.error('[UnsafeZone] Reserve credit error:', reserveErr.message);
      return jsonResponse(
        { error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' },
        402, origin, env
      );
    }
    if (!reservation.success) {
      return jsonResponse(
        { error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' },
        402, origin, env
      );
    }

    const supabase = await getServiceSupabase(env);

    // Fetch guide from KV
    let guide = null;
    if (env.PHILOSIFY_KV) {
      guide = await env.PHILOSIFY_KV.get('guide-unsafe-zone');
    }
    if (!guide) {
      console.error('[UnsafeZone] guide-unsafe-zone not found in KV');
      await releaseReservation(env, reservation.reservationId, 'guide-missing');
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
      await releaseReservation(env, reservation.reservationId, 'api-key-missing');
      return jsonResponse({ error: 'Service configuration error' }, 500, origin, env);
    }

    const client = new Anthropic({ apiKey });

    console.log(`[UnsafeZone] Calling ${model} with ${messages.length} messages`);

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    // Extract text reply
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      await releaseReservation(env, reservation.reservationId, 'empty-response');
      return jsonResponse({ error: 'No response from AI' }, 500, origin, env);
    }

    const reply = textContent.text;

    // Confirm credit
    await confirmReservation(env, reservation.reservationId, `unsafe-zone:${user.userId}`);

    const u = response.usage;
    console.log(`[UnsafeZone] ${model} — ${u.input_tokens + u.output_tokens} tokens (${u.input_tokens} in, ${u.output_tokens} out)`);

    // Save full conversation to Supabase (messages + assistant reply)
    const fullConversation = [...messages, { role: 'assistant', content: reply }];
    try {
      const { data: existing } = await supabase
        .from('unsafe_zone_conversations')
        .select('user_id', { filter: `user_id=eq.${user.userId}`, limit: 1 });

      if (existing && (Array.isArray(existing) ? existing.length > 0 : !!existing)) {
        await supabase.from('unsafe_zone_conversations').update(
          { messages: fullConversation, updated_at: new Date().toISOString() },
          `user_id=eq.${user.userId}`
        );
      } else {
        await supabase.from('unsafe_zone_conversations').insert({
          user_id: user.userId,
          messages: fullConversation,
        });
      }
    } catch (saveErr) {
      console.error('[UnsafeZone] Failed to save conversation:', saveErr.message);
      // Non-blocking — still return the reply
    }

    // Return with no-cache headers — private conversation data must never be cached
    const resp = jsonResponse({ reply }, 200, origin, env);
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
// LOAD CONVERSATION — GET /api/unsafe-zone/conversation
// Returns the user's saved conversation from Supabase.
// ============================================================
export async function handleUnsafeZoneLoad(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    const { data: rows } = await supabase
      .from('unsafe_zone_conversations')
      .select('messages,updated_at', { filter: `user_id=eq.${user.userId}`, limit: 1 });

    const row = Array.isArray(rows) ? rows[0] : rows;
    const messages = row?.messages || [];

    const resp = jsonResponse({ messages }, 200, origin, env);
    resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return resp;

  } catch (err) {
    console.error('[UnsafeZone] Load error:', err);
    return jsonResponse({ error: 'Failed to load conversation' }, 500, origin, env);
  }
}

// ============================================================
// CLEAR CONVERSATION — DELETE /api/unsafe-zone/conversation
// Deletes the user's conversation from Supabase.
// ============================================================
export async function handleUnsafeZoneClear(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    await supabase
      .from('unsafe_zone_conversations')
      .delete(`user_id=eq.${user.userId}`);

    return jsonResponse({ success: true }, 200, origin, env);

  } catch (err) {
    console.error('[UnsafeZone] Clear error:', err);
    return jsonResponse({ error: 'Failed to clear conversation' }, 500, origin, env);
  }
}
