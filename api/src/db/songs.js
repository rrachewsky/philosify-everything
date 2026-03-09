// ============================================================
// DATABASE - SONG MANAGEMENT
// ============================================================

import { getSecret } from '../utils/secrets.js';

// Get or create song in database
export async function getOrCreateSong(env, title, artist, spotifyId = null, lyrics = null) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  // Check if song exists by spotify_id (unique identifier)
  if (spotifyId) {
    const searchUrl = `${supabaseUrl}/rest/v1/songs?spotify_id=eq.${encodeURIComponent(spotifyId)}&select=id`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const existing = await searchRes.json();
    if (existing && existing.length > 0) {
      return existing[0].id; // Return existing song ID
    }
  } else if (title && artist) {
    // Fallback: look up by (title, artist) when spotifyId is missing.
    // This prevents duplicate song rows which break caching.
    const searchUrl =
      `${supabaseUrl}/rest/v1/songs` +
      `?title=ilike.${encodeURIComponent(title)}` +
      `&artist=ilike.${encodeURIComponent(artist)}` +
      `&select=id` +
      `&limit=1`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (searchRes.ok) {
      const existing = await searchRes.json().catch(() => []);
      if (Array.isArray(existing) && existing.length > 0) {
        return existing[0].id;
      }
    }
  }

  // Create new song
  const createUrl = `${supabaseUrl}/rest/v1/songs`;
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      title: title,
      artist: artist,
      spotify_id: spotifyId,
      lyrics: lyrics,
      status: 'published'
    })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();

    // If 409 conflict (song already exists), retrieve it by spotify_id
    if (createRes.status === 409 && spotifyId) {
      const retrievalUrl = `${supabaseUrl}/rest/v1/songs?spotify_id=eq.${encodeURIComponent(spotifyId)}&select=id`;
      const existingRes = await fetch(retrievalUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const existingSongs = await existingRes.json();
      if (existingSongs && existingSongs.length > 0) {
        return existingSongs[0].id;
      }
    }

    // If 409 conflict but spotifyId is missing, fall back to (title, artist).
    if (createRes.status === 409 && title && artist) {
      const retrievalUrl =
        `${supabaseUrl}/rest/v1/songs` +
        `?title=ilike.${encodeURIComponent(title)}` +
        `&artist=ilike.${encodeURIComponent(artist)}` +
        `&select=id` +
        `&limit=1`;
      const existingRes = await fetch(retrievalUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (existingRes.ok) {
        const existingSongs = await existingRes.json().catch(() => []);
        if (Array.isArray(existingSongs) && existingSongs.length > 0) {
          return existingSongs[0].id;
        }
      }
    }

    throw new Error(`Failed to create song: ${createRes.status}`);
  }

  const newSong = await createRes.json();

  if (!newSong || !newSong[0] || !newSong[0].id) {
    throw new Error('Failed to create song - invalid response');
  }

  console.log(`[DB] Song created: ${title} by ${artist} (${newSong[0].id})`);
  return newSong[0].id;
}
