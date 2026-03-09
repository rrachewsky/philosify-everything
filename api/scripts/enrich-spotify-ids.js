// ============================================================
// ENRICH SPOTIFY IDs - Add spotify_id to existing songs
// ============================================================
// Usage: node scripts/enrich-spotify-ids.js
// ============================================================

import { createClient } from "@supabase/supabase-js";

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
};

const missing = Object.entries(CONFIG)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Get Spotify access token
let spotifyToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < tokenExpiry) {
    return spotifyToken;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${CONFIG.SPOTIFY_CLIENT_ID}:${CONFIG.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  spotifyToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return spotifyToken;
}

// Search Spotify for a song
async function searchSpotify(title, artist) {
  const token = await getSpotifyToken();
  const query = encodeURIComponent(`track:${title} artist:${artist}`);

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    console.error(`   ⚠️ Spotify search failed: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data.tracks?.items?.[0]?.id || null;
}

// Main function
async function main() {
  console.log("\n========================================");
  console.log("ENRICH SPOTIFY IDs");
  console.log("========================================\n");

  // Get songs without spotify_id
  const { data: songs, error } = await supabase
    .from("songs")
    .select("id, title, artist")
    .is("spotify_id", null);

  if (error) {
    console.error("Error fetching songs:", error);
    return;
  }

  console.log(`Found ${songs.length} songs without spotify_id\n`);

  if (songs.length === 0) {
    console.log("✅ All songs already have spotify_id!");
    return;
  }

  let updated = 0;
  let notFound = 0;
  let failed = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const progress = `[${i + 1}/${songs.length}]`;

    console.log(`${progress} "${song.title}" - ${song.artist}`);

    try {
      const spotifyId = await searchSpotify(song.title, song.artist);

      if (spotifyId) {
        const { error: updateError } = await supabase
          .from("songs")
          .update({ spotify_id: spotifyId })
          .eq("id", song.id);

        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          failed++;
        } else {
          console.log(`   ✅ ${spotifyId}`);
          updated++;
        }
      } else {
        console.log(`   ⚠️ Not found on Spotify`);
        notFound++;
      }

      // Rate limit: 3 requests per second
      await sleep(350);
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      failed++;
    }
  }

  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Failed: ${failed}`);
  console.log("========================================\n");
}

main().catch(console.error);
