// ============================================================
// HANDLER - TOP 10 SPOTIFY (Automático)
// ============================================================
// Busca Top 10 Global do Spotify, analisa com GPT-4.1, e cacheia

import { getSecret } from "../utils/secrets.js";
import { safeEq } from "../payments/crypto.js";
import { getSpotifyToken } from "../spotify/index.js";
import { getCorsHeaders } from "../utils/cors.js";
import { handleAnalyze } from "./analyze.js";

// Philosify's own playlist (copy of Top 50 Global)
const TOP_50_GLOBAL_PLAYLIST = "3gkmUxBX2zrKL0eQv6mwN4"; // Philosify Top 50 Global

// Get current week start (Sunday)
function getWeekStart() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = now.getUTCDate() - day;
  const sunday = new Date(now.setUTCDate(diff));
  return sunday.toISOString().split("T")[0]; // YYYY-MM-DD
}

// Fetch Top 10 from Spotify
async function fetchSpotifyTop10(env) {
  const clientId = await getSecret(env.SPOTIFY_CLIENT_ID);
  const clientSecret = await getSecret(env.SPOTIFY_CLIENT_SECRET);

  console.log(
    `[Top10] Client ID present: ${!!clientId}, length: ${clientId?.length || 0}`,
  );
  console.log(
    `[Top10] Client Secret present: ${!!clientSecret}, length: ${clientSecret?.length || 0}`,
  );

  const accessToken = await getSpotifyToken(clientId, clientSecret);
  console.log(
    `[Top10] Access token obtained: ${!!accessToken}, length: ${accessToken?.length || 0}`,
  );

  const playlistUrl = `https://api.spotify.com/v1/playlists/${TOP_50_GLOBAL_PLAYLIST}/tracks?limit=50&fields=items(track(id,name,artists))`;
  console.log(`[Top10] Fetching playlist: ${playlistUrl}`);

  const response = await fetch(playlistUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log(`[Top10] Playlist response status: ${response.status}`);

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Top10] Playlist API error response: ${error}`);
    throw new Error(`Spotify API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`[Top10] Got ${data.items?.length || 0} tracks from playlist`);

  return data.items
    .filter((item) => item.track && item.track.id)
    .map((item, index) => ({
      position: index + 1,
      song_title: item.track.name,
      artist: item.track.artists.map((a) => a.name).join(", "),
      spotify_id: item.track.id,
      is_free: index < 2, // First 2 are free
    }));
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
      model: "openai", // GPT-4.1
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

  // Deactivate previous week's entries
  await fetch(
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
      `${supabaseUrl}/rest/v1/featured_songs?is_active=eq.true&order=position.asc&select=position,song_title,artist,spotify_id,score,classification,is_free,analysis_id`,
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

    const tracks = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        week_start: getWeekStart(),
        tracks: tracks,
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

    // 1. Fetch tracks from Spotify playlist
    console.log("[Top10] Fetching from Spotify...");
    const tracks = await fetchSpotifyTop10(env);
    console.log(`[Top10] ✓ Got ${tracks.length} tracks from Spotify`);

    // 2. Save to database (no analysis needed - analysis happens when user clicks)
    await saveFeaturedSongs(env, tracks, weekStart);

    console.log(`[Top10] ✓ Refresh complete! ${tracks.length} tracks saved`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Top ${tracks.length} refreshed for week ${weekStart}`,
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
    console.error("[Top10] Refresh error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to refresh top songs",
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

  return handleRefreshTop10(mockRequest, env, "https://everything.philosify.org", true);
}
