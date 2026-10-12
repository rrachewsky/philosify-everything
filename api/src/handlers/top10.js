// ============================================================
// HANDLER - TOP 50 (ticker de música)
// ============================================================
// Weekly refresh of the 50 tracks the music ticker shows.
//
// Source (10 Oct 2026, TOP50_SPOTIFY_DIAGNOSTICO_2026-10-09.md): the public
// Spotify Global Daily chart as published by kworb.net. The Spotify Web API
// stopped serving Spotify-owned editorial playlists (Top 50 Global included)
// to apps without extended quota mode on 27 Nov 2024; the previous source was
// a hand-made copy playlist that froze on 22 Jan 2026. The chart page carries
// position, artist(s), title and the Spotify track id, which is all the ticker
// needs. When extended quota mode is granted, the official playlist becomes
// the primary source and this parser the fallback.
//
// Defensive contract: the parser must yield exactly 50 valid rows (positions
// 1..50, 22-char Spotify ids, non-empty title/artist, no duplicate ids) or the
// refresh throws and the previous week stays active. A failed week is loud in
// the logs and never overwrites good data.

import { getSecret } from "../utils/secrets.js";
import { safeEq } from "../payments/crypto.js";
import { getCorsHeaders } from "../utils/cors.js";
import { handleAnalyze } from "./analyze.js";

const CHART_URL = "https://kworb.net/spotify/country/global_daily.html";
const CHART_FETCH_TIMEOUT_MS = 20000;
const TRACKS_WANTED = 50;
// featured_songs keeps this many weeks of history; older weeks are purged on refresh.
export const KEEP_WEEKS = 8;

// Get current week start (Sunday)
function getWeekStart() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = now.getUTCDate() - day;
  const sunday = new Date(now.setUTCDate(diff));
  return sunday.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ------------------------------------------------------------
// Chart parsing (pure, exported for vitest)
// ------------------------------------------------------------

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Parses the kworb "Spotify Daily Chart - Global" page.
 * Row shape (one <tr> per track):
 *   <td class="np">1</td> … <td class="text mp"><div>
 *     <a href="../artist/ID.html">KAROL G</a> - <a href="../track/ID.html">BbY WOW</a>
 *     (w/ <a href="../artist/ID.html">Judeline</a>, <a …>rusowsky</a>)</div></td> …
 * Returns { chartDate, tracks } where tracks are the first `wanted` rows in chart
 * order, each { position, song_title, artist, spotify_id }. Throws on any
 * structural surprise: that is the signal to keep the previous week.
 */
export function parseChartPage(html, wanted = TRACKS_WANTED) {
  if (typeof html !== "string" || html.length < 1000) {
    throw new Error("chart page empty or too short");
  }
  const tableStart = html.indexOf('id="spotifydaily"');
  if (tableStart < 0) throw new Error("chart table #spotifydaily not found");
  const chartDate = (html.match(/\b(\d{4}\/\d{2}\/\d{2})\b/) || [])[1] || null;

  const rows = html.slice(tableStart).match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  const tracks = [];
  const seen = new Set();
  for (const row of rows) {
    if (tracks.length >= wanted) break;
    const pos = (row.match(/<td class="np">\s*(\d+)\s*<\/td>/) || [])[1];
    if (!pos) continue; // header row or layout row
    const position = Number(pos);
    if (position !== tracks.length + 1) {
      throw new Error(`chart rows out of order: expected ${tracks.length + 1}, got ${position}`);
    }
    const cell = (row.match(/<td class="text mp">\s*<div>([\s\S]*?)<\/div>\s*<\/td>/) || [])[1];
    if (!cell) throw new Error(`row ${position}: title cell not found`);
    const track = cell.match(/<a href="\.\.\/track\/([A-Za-z0-9]+)\.html">([\s\S]*?)<\/a>/);
    if (!track) throw new Error(`row ${position}: track link not found`);
    const spotify_id = track[1];
    const song_title = decodeEntities(track[2].replace(/<[^>]+>/g, ""));
    const artists = [...cell.matchAll(/<a href="\.\.\/artist\/[A-Za-z0-9]+\.html">([\s\S]*?)<\/a>/g)]
      .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, "")))
      .filter(Boolean);
    const artist = [...new Set(artists)].join(", ");
    if (!SPOTIFY_ID_RE.test(spotify_id)) throw new Error(`row ${position}: bad spotify id ${spotify_id}`);
    if (!song_title) throw new Error(`row ${position}: empty title`);
    if (!artist) throw new Error(`row ${position}: empty artist`);
    if (seen.has(spotify_id)) throw new Error(`row ${position}: duplicate spotify id ${spotify_id}`);
    seen.add(spotify_id);
    tracks.push({ position, song_title, artist, spotify_id, is_free: position <= 2 });
  }
  if (tracks.length !== wanted) {
    throw new Error(`chart yielded ${tracks.length} valid rows, wanted ${wanted}`);
  }
  return { chartDate, tracks };
}

// Fetch the chart page and parse it. Throws on HTTP/parse failure so the
// caller keeps the previous week active.
async function fetchChartTop50() {
  console.log(`[Top10] Fetching chart: ${CHART_URL}`);
  const response = await fetch(CHART_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PhilosifyTicker/1.0; +https://philosify.org)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(CHART_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`chart page HTTP ${response.status}`);
  }
  const html = await response.text();
  const { chartDate, tracks } = parseChartPage(html);
  console.log(`[Top10] Chart ${chartDate ?? "(date not found)"}: ${tracks.length} valid rows`);
  return { chartDate, tracks };
}

// Check if analysis exists in cache
async function getExistingAnalysis(env, spotifyId) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  // Find song by spotify_id
  const songResponse = await fetch(
    `${supabaseUrl}/rest/v1/songs?spotify_id=eq.${spotifyId}&select=id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );

  if (!songResponse.ok) return null;
  const songs = await songResponse.json();
  if (!songs || songs.length === 0) return null;

  const songId = songs[0].id;

  // Find analysis for this song in English with openai model
  const analysisResponse = await fetch(
    `${supabaseUrl}/rest/v1/analyses?song_id=eq.${songId}&language=eq.en&model=eq.openai&select=id,final_score,classification&order=created_at.desc&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );

  if (!analysisResponse.ok) return null;
  const analyses = await analysisResponse.json();
  if (!analyses || analyses.length === 0) return null;

  return {
    analysis_id: analyses[0].id,
    song_id: songId,
    score: analyses[0].final_score,
    classification: analyses[0].classification,
  };
}

// Analyze a song (creates new analysis)
async function analyzeTrack(env, track, origin) {
  console.log(`[Top10] Analyzing: ${track.song_title} by ${track.artist}`);

  // Create a mock request for handleAnalyze
  const mockRequest = {
    json: async () => ({
      song: track.song_title,
      artist: track.artist,
      spotify_id: track.spotify_id,
      model: "grok", // platform default; ~4x cheaper than openai for the same scorecard
      lang: "en", // English
    }),
  };

  try {
    const response = await handleAnalyze(mockRequest, env, origin);

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Top10] Analysis failed for ${track.song_title}:`, error);
      return null;
    }

    const result = await response.json();

    return {
      analysis_id: result.id,
      song_id: result.song_id,
      score: result.final_score || result.scorecard?.final_score,
      classification: result.classification,
    };
  } catch (error) {
    console.error(
      `[Top10] Error analyzing ${track.song_title}:`,
      error.message,
    );
    return null;
  }
}

// Save featured songs to database (batch insert)
async function saveFeaturedSongs(env, tracks, weekStart) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  // Delete all current week entries first
  const deleteRes = await fetch(
    `${supabaseUrl}/rest/v1/featured_songs?week_start=eq.${weekStart}`,
    {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );
  if (!deleteRes.ok) {
    const err = await deleteRes.text();
    console.error(
      `[Top10] Failed to delete current week entries: ${deleteRes.status} - ${err}`,
    );
    throw new Error(
      `Failed to delete current week entries: ${deleteRes.status}`,
    );
  }

  // Deactivate previous week's entries
  const deactivateRes = await fetch(
    `${supabaseUrl}/rest/v1/featured_songs?week_start=neq.${weekStart}`,
    {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ is_active: false }),
    },
  );
  if (!deactivateRes.ok) {
    const err = await deactivateRes.text();
    console.error(
      `[Top10] Failed to deactivate old entries: ${deactivateRes.status} - ${err}`,
    );
    throw new Error(
      `Failed to deactivate old entries: ${deactivateRes.status}`,
    );
  }

  // Prepare all tracks for batch insert
  const batchData = tracks.map((track) => ({
    position: track.position,
    song_title: track.song_title,
    artist: track.artist,
    spotify_id: track.spotify_id,
    is_free: track.is_free,
    week_start: weekStart,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));

  // Single batch insert
  const response = await fetch(`${supabaseUrl}/rest/v1/featured_songs`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(batchData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Top10] Batch save failed:`, error);
    throw new Error(`Failed to save tracks: ${error}`);
  }

  console.log(
    `[Top10] ✓ Saved ${tracks.length} featured songs for week ${weekStart}`,
  );
}

// Cutoff (YYYY-MM-DD) for the history purge: weeks older than KEEP_WEEKS go.
export function purgeCutoff(weekStart, keepWeeks = KEEP_WEEKS) {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - keepWeeks * 7);
  return d.toISOString().split("T")[0];
}

// Purge featured_songs history older than KEEP_WEEKS. Best effort: a failure
// is logged and never fails the refresh (the active week is already saved).
async function purgeOldWeeks(env, weekStart) {
  const cutoff = purgeCutoff(weekStart);
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  const res = await fetch(
    `${supabaseUrl}/rest/v1/featured_songs?week_start=lt.${cutoff}&is_active=eq.false`,
    {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "count=exact",
      },
    },
  );
  if (!res.ok) {
    console.error(`[Top10] Purge failed: ${res.status} - ${(await res.text()).slice(0, 200)}`);
    return;
  }
  console.log(`[Top10] Purged weeks before ${cutoff}: ${res.headers.get("content-range") ?? "?"}`);
}

// ============================================================
// HANDLERS
// ============================================================

// GET /api/top10 - Return current Top 10 for ticker
export async function handleGetTop10(request, env, origin) {
  const corsHeaders = getCorsHeaders(origin, env);

  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/featured_songs?is_active=eq.true&order=position.asc&select=position,song_title,artist,spotify_id,score,classification,is_free,analysis_id,week_start,updated_at`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Database error: ${response.status}`);
    }

    const rows = await response.json();
    // week_start/updated_at come FROM THE TABLE: the age of the list is visible.
    // (Until 10 Oct 2026 week_start was computed at request time and a frozen
    // list looked current for 37 weeks.)
    const week_start = rows[0]?.week_start ?? null;
    const updated_at = rows[0]?.updated_at ?? null;
    const tracks = rows.map(({ week_start: _w, updated_at: _u, ...t }) => t);

    return new Response(
      JSON.stringify({
        success: true,
        week_start,
        updated_at,
        tracks,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600", // Cache 1 hour
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error("[Top10] Error fetching:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch top songs",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
}

// POST /api/top10/refresh - Refresh Top 10 (admin only or cron)
export async function handleRefreshTop10(
  request,
  env,
  origin,
  isScheduled = false,
) {
  try {
    // Verify admin secret (unless called from scheduled trigger)
    if (!isScheduled) {
      const authHeader = request.headers.get("Authorization");
      const adminSecret = await getSecret(env.ADMIN_SECRET);

      if (
        !authHeader ||
        !adminSecret ||
        !safeEq(authHeader, `Bearer ${adminSecret}`)
      ) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(origin, env),
          },
        });
      }
    }

    console.log("[Top10] Starting refresh...");
    const weekStart = getWeekStart();

    // 1. Fetch + validate the chart. Throws → catch below → previous week stays.
    const { chartDate, tracks } = await fetchChartTop50();

    // 2. Save to database (no analysis needed - analysis happens when user clicks)
    await saveFeaturedSongs(env, tracks, weekStart);

    // 3. Purge history older than KEEP_WEEKS (best effort)
    await purgeOldWeeks(env, weekStart).catch((err) =>
      console.error(`[Top10] Purge threw: ${err.message}`),
    );

    console.log(`[Top10] ✓ Refresh complete! ${tracks.length} tracks saved (chart ${chartDate})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Top ${tracks.length} refreshed for week ${weekStart}`,
        chart_date: chartDate,
        tracks_processed: tracks.length,
        tracks: tracks.map((t) => ({
          position: t.position,
          song: t.song_title,
          artist: t.artist,
        })),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(origin, env),
        },
      },
    );
  } catch (error) {
    // LOUD on purpose: nothing was written, the previous week stays active.
    console.error(
      `[Top10] REFRESH FAILED — previous week kept active. ${error.message}`,
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to refresh top songs",
        detail: String(error.message).slice(0, 200),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(origin, env),
        },
      },
    );
  }
}

// Scheduled handler (called by Cloudflare Cron)
export async function handleScheduledTop10(env) {
  console.log("[Top10] Scheduled refresh triggered");

  // Create a mock request
  const mockRequest = {
    headers: new Map(),
  };

  return handleRefreshTop10(mockRequest, env, "https://philosify.org", true);
}
