// ============================================================
// HANDLER - PHILOSOPHER PANEL ANALYSIS
// ============================================================
// Multi-philosopher analysis of a song, book, or news event.
// 3 philosophers: 1 Objectivist (auto) + 2 user-chosen.
// Cost: 3 credits. Output: markdown text (not JSON scorecard).
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getDebateAestheticGuide } from "../guides/index.js";
import { reserveCredit, confirmReservation, releaseReservation } from "../credits/index.js";
import { buildPhilosopherPanelPrompt } from "../ai/prompts/philosopher-panel-template.js";
import { buildNewsPanelPrompt } from "../ai/prompts/news-panel-template.js";
import { callGrok } from "../ai/models/index.js";
import { PHILOSOPHERS } from "../handlers/colloquium.js";

// The two Objectivist philosophers that Philosify auto-assigns
const OBJECTIVIST_PICKS = ["Ayn Rand", "Leonard Peikoff"];

const PANEL_COST = 3; // credits

/**
 * POST /api/philosopher-panel
 *
 * Body: {
 *   mediaType: "music" | "literature",
 *   title: string,
 *   artist: string,          // artist (music) or author (books)
 *   lyrics?: string,         // music only
 *   description?: string,    // books only
 *   categories?: string,     // books only
 *   philosophers: [string, string],  // 2 user-chosen philosopher names
 *   lang?: string
 * }
 */
export async function handlePhilosopherPanel(
  request,
  env,
  origin = "https://philosify.org",
  ctx = null,
) {
  try {
    const body = await request.json();
    const {
      mediaType,
      title,
      artist,
      lyrics,
      description,
      categories,
      philosophers: userPicks,
      lang = "en",
    } = body;

    // ── Auth ──
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }
    const userId = user.userId;

    // ── Validate inputs ──
    if (!title) {
      return jsonResponse({ error: "Title is required" }, 400, origin, env);
    }
    if (mediaType !== "news" && !artist) {
      return jsonResponse({ error: "Artist/author is required" }, 400, origin, env);
    }
    if (!mediaType || !["music", "literature", "news"].includes(mediaType)) {
      return jsonResponse({ error: "mediaType must be 'music', 'literature', or 'news'" }, 400, origin, env);
    }
    if (!Array.isArray(userPicks) || userPicks.length !== 2) {
      return jsonResponse({ error: "Exactly 2 philosophers must be chosen" }, 400, origin, env);
    }

    // ── Resolve philosopher profiles ──
    // Auto-assign 1 Objectivist (random between Ayn Rand and Leonard Peikoff)
    const objectivistName = OBJECTIVIST_PICKS[Math.random() < 0.5 ? 0 : 1];

    // Validate user picks exist in roster and are not duplicates
    const allNames = [objectivistName, ...userPicks];
    const uniqueNames = [...new Set(allNames)];
    if (uniqueNames.length < 3) {
      // User picked the same philosopher that was auto-assigned, or duplicates
      // Replace the objectivist pick with the other one
      const altObjectivist = objectivistName === "Ayn Rand" ? "Leonard Peikoff" : "Ayn Rand";
      uniqueNames[0] = altObjectivist;
      allNames[0] = altObjectivist;
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

    console.log(
      `[PhilosopherPanel] ${mediaType}: "${title}" by ${artist}. Panel: ${uniqueNames.join(", ")}`,
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

    // ── Reserve 3 credits ──
    const reservations = [];
    for (let i = 0; i < PANEL_COST; i++) {
      const reservation = await reserveCredit(env, userId);
      if (!reservation.success) {
        // Rollback any successful reservations
        for (const prev of reservations) {
          try {
            await releaseReservation(env, prev.reservationId, "failed");
          } catch (releaseErr) {
            console.error(`[PhilosopherPanel] Rollback release failed: ${releaseErr.message}`);
          }
        }
        return jsonResponse(
          {
            error: "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            needed: PANEL_COST,
          },
          402,
          origin,
          env,
        );
      }
      reservations.push(reservation);
    }

    try {
      // ── Load guide ──
      const guide = await getDebateAestheticGuide(env);

      // ── Build prompt (news uses a different prompt template) ──
      const prompt = mediaType === "news"
        ? buildNewsPanelPrompt({
            title,
            description: description || null,
            source: body.source || null,
            publishedAt: body.publishedAt || null,
            philosophers: philosopherProfiles,
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
            philosophers: philosopherProfiles,
            guide,
            lang,
          });

      // ── Call AI (Grok) — generate in user's language ──
      console.log(`[PhilosopherPanel] Calling Grok for ${mediaType} panel analysis in "${lang}"...`);
      const panelText = await callGrok(prompt, lang, env, {
        maxTokens: mediaType === "news" ? 5000 : 4000,
        temperature: 0.7,
      });

      if (!panelText || panelText.length < 100) {
        throw new Error("AI returned empty or insufficient panel analysis");
      }

      console.log(`[PhilosopherPanel] Generated ${panelText.length} chars of panel analysis`);

      // ── Generate a unique panel ID for TTS caching ──
      const panelId = crypto.randomUUID();

      // ── Build panel data object ──
      const panelData = {
        id: panelId,
        mediaType,
        title,
        artist,
        philosophers: uniqueNames,
        objectivist: uniqueNames[0],
        analysis: panelText,
        lang,
        createdAt: new Date().toISOString(),
      };

      // ── Store in KV: both deterministic key (for dedup) and UUID key (for TTS) ──
      const kvTtl = 7 * 24 * 60 * 60; // 7 days
      await Promise.all([
        env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(panelData), { expirationTtl: kvTtl }),
        env.PHILOSIFY_KV.put(`panel:${panelId}`, JSON.stringify(panelData), { expirationTtl: kvTtl }),
      ]);

      // ── Confirm all credits ──
      let lastConfirm;
      for (const res of reservations) {
        lastConfirm = await confirmReservation(
          env,
          res.reservationId,
          `philosopher-panel:${mediaType}:${title.substring(0, 50)}`,
        );
      }

      // ── Return result ──
      return jsonResponse(
        {
          success: true,
          cached: false,
          panel: panelData,
          credits: lastConfirm?.credits ?? null,
          remaining: lastConfirm?.newTotal ?? null,
        },
        200,
        origin,
        env,
      );
    } catch (err) {
      // Release all credits on failure
      console.error(`[PhilosopherPanel] Analysis failed: ${err.message}`);
      for (const res of reservations) {
        try {
          await releaseReservation(env, res.reservationId, "failed");
        } catch (releaseErr) {
          console.error(`[PhilosopherPanel] Release on failure failed: ${releaseErr.message}`);
        }
      }
      return jsonResponse(
        { error: `Panel analysis failed: ${err.message}` },
        500,
        origin,
        env,
      );
    }
  } catch (err) {
    console.error(`[PhilosopherPanel] Request error: ${err.message}`);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}
