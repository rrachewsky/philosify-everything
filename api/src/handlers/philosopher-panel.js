// ============================================================
// HANDLER - PHILOSOPHER PANEL ANALYSIS
// ============================================================
// Multi-philosopher analysis of a song, book, or news event.
// 3 philosophers: all user-chosen from the full roster.
// Cost: 3 credits. Output: markdown text (not JSON scorecard).
// ============================================================

import { jsonResponse, sanitizeErrorMessage } from "../utils/index.js";
import { errorResponse } from "../utils/errorResponse.js";
import { getLocalizedError } from "../utils/i18n-errors.js";
import { getUserFromAuth } from "../auth/index.js";
import { checkRateLimit } from "../rate-limit/index.js";
import { getDebateAestheticGuide } from "../guides/index.js";
import { reserveCredit, confirmReservation, releaseReservation } from "../credits/index.js";
import { buildPhilosopherPanelPrompt, PANEL_MEDIA_TYPES } from "../ai/prompts/philosopher-panel-template.js";
import { buildNewsPanelPrompt } from "../ai/prompts/news-panel-template.js";
import { callClaude, callGrok, callGemini } from "../ai/models/index.js";
import { PHILOSOPHERS } from "../handlers/colloquium.js";
import { getSupabaseCredentials } from "../utils/supabase.js";

const PANEL_COST = 3; // credits

// API whitelist derived from the template's MEDIA table — the template is
// the single source of truth. "news" is the one addition: it routes to
// news-panel-template.js in the same if/else that consumes this list.
export const SUPPORTED_MEDIA_TYPES = ["news", ...PANEL_MEDIA_TYPES];

/**
 * POST /api/philosopher-panel
 *
 * Body: {
 *   mediaType: "music" | "literature" | "news" | "cinema",
 *   title: string,
 *   artist: string,          // artist (music) or author (books)
 *   lyrics?: string,         // music only
 *   description?: string,    // books only
 *   categories?: string,     // books only
 *   philosophers: [string, string, string],  // 3 user-chosen philosopher names
 *   lang?: string
 * }
 */
export async function handlePhilosopherPanel(
  request,
  env,
  origin = "https://philosify.org",
  ctx = null,
) {
  let lang = "en"; // Hoist for error handling
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(env, origin, 'INVALID_JSON', lang);
    }
    const {
      mediaType,
      title,
      artist,
      lyrics,
      description,
      categories,
      philosophers: userPicks,
    } = body;
    lang = body.lang || "en";

    // ── Auth ──
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse(env, origin, 'AUTHENTICATION_REQUIRED', lang);
    }
    const userId = user.userId;

    // ── Rate limit - FAIL CLOSED for expensive AI calls ──
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitOk = await checkRateLimit(env, `philosopher-panel:${userId}:${ip}`, true);
    if (!rateLimitOk) {
      return errorResponse(env, origin, 'RATE_LIMIT_EXCEEDED', lang);
    }

    // ── Validate inputs ──
    if (!title) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang, { message: "Title is required" });
    }
    if (mediaType !== "news" && mediaType !== "cinema" && !artist) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang, { message: "Artist/author is required" });
    }
    if (!mediaType || !SUPPORTED_MEDIA_TYPES.includes(mediaType)) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang, {
        message: `mediaType must be one of: ${SUPPORTED_MEDIA_TYPES.map((t) => `'${t}'`).join(", ")}`,
      });
    }
    if (!Array.isArray(userPicks) || userPicks.length !== 3) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang, { message: "Exactly 3 philosophers must be chosen" });
    }

    // ── Resolve philosopher profiles ──
    // Validate user picks exist in roster and are not duplicates
    const uniqueNames = [...new Set(userPicks)];
    if (uniqueNames.length < 3) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang, { message: "Duplicate philosophers are not allowed" });
    }

    const philosopherProfiles = [];
    for (const name of uniqueNames) {
      const profile = PHILOSOPHERS.find(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
      if (!profile) {
        return jsonResponse(
          { error: `Philosopher not found: ${name}` },
          400,
          origin,
          env,
        );
      }
      philosopherProfiles.push(profile);
    }

    // Sort for panel presentation order
    const { sortPhilosophersForPanel } = await import("../ai/philosopher-sort.js");
    const sortedProfiles = sortPhilosophersForPanel(philosopherProfiles);

    console.log(
      `[PhilosopherPanel] ${mediaType}: "${title}" by ${artist}. Panel: ${sortedProfiles.map((p) => p.name).join(", ")}`,
    );

    // ── Build deterministic cache key (prevents double-charging for same request) ──
    const sortedPhilosophers = [...uniqueNames].sort().join(",").toLowerCase();
    const normalizedTitle = (title || "").trim().toLowerCase().substring(0, 100);
    const normalizedArtist = (artist || "").trim().toLowerCase().substring(0, 50);
    const cacheKey = `panelcache:${mediaType}:${normalizedTitle}:${normalizedArtist}:${sortedPhilosophers}:${lang}`;

    // ── Check cache BEFORE reserving credits ──
    const cachedRaw = await env.PHILOSIFY_KV.get(cacheKey);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      console.log(`[PhilosopherPanel] Cache HIT for "${cacheKey}" → returning free`);
      return jsonResponse(
        {
          success: true,
          cached: true,
          panel: cached,
          credits: 0,
          remaining: null,
        },
        200,
        origin,
        env,
      );
    }

    console.log(`[PhilosopherPanel] Cache MISS for "${cacheKey}" → generating new analysis`);

    // ── In-flight duplicate guard ──
    // A client retry after the ~100s edge cutoff used to start a SECOND full
    // generation in parallel — and both reserved and confirmed 3 credits each.
    // The lock makes the second request wait on the first one's cache entry
    // instead: it returns as a free cache HIT, or times out with no charge.
    // KV get/put is not atomic across PoPs, but the retry that matters comes
    // from the same client seconds later — same PoP, lock visible.
    const lockKey = `panellock:${cacheKey}`;
    const inFlight = await env.PHILOSIFY_KV.get(lockKey);
    if (inFlight) {
      console.log(
        `[PhilosopherPanel] Generation already in flight (since ${inFlight}) — polling cache instead of double-generating`,
      );
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const ready = await env.PHILOSIFY_KV.get(cacheKey);
        if (ready) {
          const cached = JSON.parse(ready);
          console.log(`[PhilosopherPanel] In-flight generation finished — returning as cache HIT (no charge)`);
          return jsonResponse(
            { success: true, cached: true, panel: cached, credits: 0, remaining: null },
            200,
            origin,
            env,
          );
        }
      }
      console.warn(`[PhilosopherPanel] Poll timed out waiting for in-flight generation of "${cacheKey}"`);
      // 409 + own i18n key: the app displays the `error` field, so the user
      // reads "still being generated, try again" instead of a fake failure.
      return errorResponse(env, origin, 'PANEL_IN_PROGRESS', lang);
    }
    // TTL covers a worst-case generation (Claude timeout + Grok fallback);
    // if this invocation crashes, the lock self-clears.
    await env.PHILOSIFY_KV.put(lockKey, new Date().toISOString(), { expirationTtl: 240 });

    // ── Reserve 3 credits (in parallel — the RPC serializes on the balance
    // row, so concurrent reserves stay atomic; ~1s saved vs sequential) ──
    const settled = await Promise.allSettled(
      Array.from({ length: PANEL_COST }, () => reserveCredit(env, userId)),
    );
    const reservations = settled
      .filter((s) => s.status === "fulfilled" && s.value?.success)
      .map((s) => s.value);

    if (reservations.length < PANEL_COST) {
      // Rollback any successful reservations
      for (const prev of reservations) {
        try {
          await releaseReservation(env, prev.reservationId, "failed");
        } catch (releaseErr) {
          console.error(`[PhilosopherPanel] Rollback release failed: ${releaseErr.message}`);
        }
      }
      try {
        await env.PHILOSIFY_KV.delete(lockKey);
      } catch { /* TTL clears it */ }
      const hadError = settled.some((s) => s.status === "rejected");
      if (hadError) {
        console.error(
          `[PhilosopherPanel] Reserve failed with errors: ${settled
            .filter((s) => s.status === "rejected")
            .map((s) => s.reason?.message)
            .join("; ")}`,
        );
        return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
      }
      return errorResponse(env, origin, 'INSUFFICIENT_CREDITS', lang, {
        needed: PANEL_COST,
      });
    }

    // The whole generate → cache → persist → confirm sequence is one job so
    // it can ride on ctx.waitUntil below: if the client disconnects
    // mid-generation (25 Aug incident: mobile drop at ~2 min), the job still
    // finishes in the background — cache written, the 3 credits confirmed
    // exactly once, lock released — and the user's retry lands in the
    // in-flight poller above as a free cache HIT instead of a second charged
    // generation with 3 reservations stranded for the reaper.
    async function generatePanel() {
      // ── Load guide ──
      const guide = await getDebateAestheticGuide(env);

      // ── Build prompt (news uses a different prompt template) ──
      const prompt = mediaType === "news"
        ? buildNewsPanelPrompt({
            title,
            description: description || null,
            source: body.source || null,
            publishedAt: body.publishedAt || null,
            philosophers: sortedProfiles,
            guide,
            lang,
          })
        : buildPhilosopherPanelPrompt({
            mediaType,
            title,
            artist,
            lyrics: lyrics || null,
            description: description || null,
            categories: categories || null,
            philosophers: sortedProfiles,
            guide,
            lang,
          });

      // ── Call AI with fallback chain: Claude → Grok → OpenAI ──
      let panelText = null;
      let usedModel = "claude";
      
      const models = [
        { name: "claude", call: () => callClaude(prompt, lang, env) },
        { name: "grok", call: () => callGrok(prompt, lang, env, { maxTokens: mediaType === "news" ? 5000 : 4000, temperature: 0.7 }) },
        { name: "gemini", call: () => callGemini(prompt, lang, env) },
      ];
      
      for (const model of models) {
        try {
          console.log(`[PhilosopherPanel] Calling ${model.name} for ${mediaType} panel analysis in "${lang}"...`);
          panelText = await model.call();
          usedModel = model.name;
          if (panelText && panelText.length >= 100) break;
        } catch (err) {
          const errMsg = err.message || JSON.stringify(err);
          console.warn(`[PhilosopherPanel] ${model.name} failed: ${errMsg}`);
          // If content blocked, try next model
          if (err.type === 'content_filtered' || errMsg.includes('blocked') || errMsg.includes('safety')) {
            console.log(`[PhilosopherPanel] Content filtered by ${model.name}, trying next model...`);
            continue;
          }
        }
      }

      if (!panelText || panelText.length < 100) {
        throw new Error("All AI models failed to generate panel analysis");
      }
      
      console.log(`[PhilosopherPanel] Generated ${panelText.length} chars using ${usedModel}`);

      // ── Generate a unique panel ID for TTS caching ──
      const panelId = crypto.randomUUID();

      // ── Build panel data object ──
      // `model` records which model actually generated this panel (the
      // fallback chain makes it request-dependent). New panels only —
      // pre-existing blobs don't carry it and are never backfilled.
      const panelData = {
        id: panelId,
        mediaType,
        title,
        artist,
        philosophers: uniqueNames,
        objectivist: uniqueNames[0],
        analysis: panelText,
        lang,
        model: usedModel,
        createdAt: new Date().toISOString(),
      };

      // ── Store in KV: both deterministic key (for dedup) and UUID key (for history/TTS) ──
      // No TTL — user paid credits, analysis must be permanent
      await Promise.all([
        env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(panelData)),
        env.PHILOSIFY_KV.put(`panel:${panelId}`, JSON.stringify(panelData)),
      ]);

      // ── Save to DB for history ──
      // Non-fatal either way — KV has the data, history just won't show this
      // one. But never silent: fetch does not throw on 4xx/5xx, and a CHECK
      // constraint violation used to be logged as a save.
      try {
        const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
        const dbRes = await fetch(`${sbUrl}/rest/v1/panel_analyses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            panel_id: panelId,
            user_id: userId,
            media_type: mediaType,
            title,
            artist: artist || null,
            philosophers: uniqueNames,
            lang,
          }),
        });
        if (dbRes.ok) {
          console.log(`[PhilosopherPanel] Saved to panel_analyses: ${panelId}`);
        } else {
          const dbBody = await dbRes.text().catch(() => "");
          console.error(
            `[PhilosopherPanel] panel_analyses INSERT FAILED (non-fatal): ${dbRes.status} ${dbBody.slice(0, 300)} — panel ${panelId} (${mediaType}) lives in KV only`,
          );
        }
      } catch (dbErr) {
        console.error(`[PhilosopherPanel] DB save failed (non-fatal): ${dbErr.message}`);
      }

      // ── Confirm all credits ──
      let lastConfirm;
      const panelDesc = `Panel: ${title.substring(0, 60)} (${mediaType})`;
      for (const res of reservations) {
        lastConfirm = await confirmReservation(
          env,
          res.reservationId,
          panelDesc,
          userId,
        );
      }

      return { panelData, lastConfirm };
    }

    // The job resolves to an outcome and never rejects: a rejection inside
    // waitUntil after the response is gone would be an unhandled rejection
    // with nobody left to release the credits — so failure handling (release
    // all 3 reservations) lives INSIDE the job and runs in background too.
    const generationJob = (async () => {
      try {
        const { panelData, lastConfirm } = await generatePanel();
        return { ok: true, panelData, lastConfirm };
      } catch (err) {
        console.error(`[PhilosopherPanel] Analysis failed: ${err.message}`);
        for (const res of reservations) {
          try {
            await releaseReservation(env, res.reservationId, "failed");
          } catch (releaseErr) {
            console.error(`[PhilosopherPanel] Release on failure failed: ${releaseErr.message}`);
          }
        }
        return { ok: false, message: err.message };
      } finally {
        // Pollers read the cache entry, not the lock — this is just hygiene
        // so a follow-up request doesn't wait on a finished generation.
        try {
          await env.PHILOSIFY_KV.delete(lockKey);
        } catch { /* TTL clears it */ }
      }
    })();

    // Registered BEFORE the await: if the client disconnects while we wait,
    // the runtime keeps the job alive to completion. With ctx null (legacy
    // caller) the await below is the same inline wait as before.
    if (ctx?.waitUntil) ctx.waitUntil(generationJob);

    const outcome = await generationJob;

    if (!outcome.ok) {
      // Sanitize error message to prevent leaking internal details
      return errorResponse(env, origin, 'ANALYSIS_FAILED', lang, {
        message: sanitizeErrorMessage(outcome.message, getLocalizedError('ANALYSIS_FAILED', lang))
      });
    }

    // ── Return result ──
    return jsonResponse(
      {
        success: true,
        cached: false,
        panel: outcome.panelData,
        credits: outcome.lastConfirm?.credits ?? null,
        remaining: outcome.lastConfirm?.newTotal ?? null,
      },
      200,
      origin,
      env,
    );
  } catch (err) {
    console.error(`[PhilosopherPanel] Request error: ${err.message}`);
    // Sanitize error message to prevent leaking internal details
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang, {
      message: sanitizeErrorMessage(err.message, getLocalizedError('INTERNAL_ERROR', lang))
    });
  }
}
