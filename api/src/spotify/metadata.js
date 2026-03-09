// ============================================================
// SPOTIFY - METADATA FETCHING
// ============================================================

import { getSpotifyToken } from './token.js';
import { getSecret } from '../utils/secrets.js';

/**
 * Fetch artist image from Spotify API
 * @param {string} artistId - Spotify artist ID
 * @param {string} token - Spotify access token
 * @returns {Promise<string|null>} - Artist image URL or null
 */
async function fetchArtistImage(artistId, token) {
  try {
    const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const artist = await res.json();
    // Get the medium-sized image (300x300) or first available
    return artist.images?.[1]?.url || artist.images?.[0]?.url || null;
  } catch (err) {
    console.warn(`[Spotify] Failed to fetch artist image: ${err.message}`);
    return null;
  }
}

// Get Spotify metadata by search
export async function getSpotifyMetadata(song, artist, env) {
  try {
    const clientId = await getSecret(env.SPOTIFY_CLIENT_ID);
    const clientSecret = await getSecret(env.SPOTIFY_CLIENT_SECRET);

    if (!clientId || !clientSecret) {
      console.warn('[Spotify] Credentials not configured, skipping metadata');
      return null;
    }

    // 1. Get access token (with cache)
    const token = await getSpotifyToken(clientId, clientSecret);

    // 2. Search track - search more results to filter
    // 2. Search Strategy: "Defense in Depth"

    // Strategy A: Strict Search (High Precision)
    let query = encodeURIComponent(`track:${song} artist:${artist}`);
    let searchUrl = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`;

    let searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!searchRes.ok) {
      console.warn(`[Spotify] Strict search API error: ${searchRes.status}`);
      // Don't throw yet, try fallback
    } else {
      const data = await searchRes.json();
      let tracks = data.tracks?.items || [];

      if (tracks.length > 0) {
        // Found with strict search!
        // Filter to confirm artist match (Spotify strict search is usually good but verify)
        const normalizeString = (str) => {
          return str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
        };
        const artistNormalized = normalizeString(artist);

        let track = tracks.find(t => {
          const trackArtists = t.artists.map(a => normalizeString(a.name));
          return trackArtists.some(a => a.includes(artistNormalized) || artistNormalized.includes(a));
        });

        if (track) {
          console.log(`[Spotify] ✓ Found via Strict Search: ${track.name} (${track.id})`);
          const primaryArtist = track.artists[0];
          // Fetch artist details for image
          const artistImage = await fetchArtistImage(primaryArtist.id, token);
          return {
            spotify_id: track.id,
            spotify_artist_id: primaryArtist.id,
            artist: primaryArtist.name,
            artist_image_url: artistImage,
            release_year: track.album.release_date?.substring(0, 4),
            genre: track.album.genres?.[0] || 'Unknown',
            popularity: track.popularity
          };
        }
      }
    }

    // Strategy B: Fuzzy/Broad Search (High Recall)
    console.log(`[Spotify] Strict search failed for "${song}" by "${artist}", trying Fuzzy Search...`);
    query = encodeURIComponent(`${song} ${artist}`); // Just space-separated
    searchUrl = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=20`; // Fetch more results

    searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!searchRes.ok) {
      throw new Error(`Spotify fuzzy search failed: ${searchRes.status}`);
    }

    const data = await searchRes.json();
    const tracks = data.tracks?.items || [];

    if (tracks.length === 0) {
      console.warn(`[Spotify] No results found even with Fuzzy Search`);
      return null;
    }

    // 3. Filter Fuzzy Results
    const normalizeString = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
    };

    const artistNormalized = normalizeString(artist);

    // Looser match for fuzzy results
    let track = tracks.find(t => {
      const trackArtists = t.artists.map(a => normalizeString(a.name));
      // Check if ANY artist matches loosely
      return trackArtists.some(a => a.includes(artistNormalized) || artistNormalized.includes(a));
    });

    if (track) {
      console.log(`[Spotify] ✓ Found via Fuzzy Search: ${track.name} (${track.id})`);
      const primaryArtist = track.artists[0];
      // Fetch artist details for image
      const artistImage = await fetchArtistImage(primaryArtist.id, token);
      return {
        spotify_id: track.id,
        spotify_artist_id: primaryArtist.id,
        artist: primaryArtist.name,
        artist_image_url: artistImage,
        release_year: track.album.release_date?.substring(0, 4),
        genre: track.album.genres?.[0] || 'Unknown',
        popularity: track.popularity
      };
    }

    // If still no specific artist match, return FIRST result but warn
    // (Better to have a slightly wrong version than nothing?)
    // No, for analysis accuracy, maybe safer to return null if artist completely mismatches.
    // BUT the user complains about "Not Found". Let's stick to Artist matching to avoid analyzing covers.

    console.warn(`[Spotify] Fuzzy search found tracks, but Artist mismatch. Top result: ${tracks[0].artists[0].name}`);
    return null;

  } catch (error) {
    console.error('[Spotify] Error:', error);
    return null;
  }
}

// Get Spotify metadata by ID (when already selected from dropdown)
export async function getSpotifyMetadataById(spotifyId, env) {
  try {
    const clientId = await getSecret(env.SPOTIFY_CLIENT_ID);
    const clientSecret = await getSecret(env.SPOTIFY_CLIENT_SECRET);

    if (!clientId || !clientSecret) {
      console.warn('[Spotify] Credentials not configured');
      return null;
    }

    const token = await getSpotifyToken(clientId, clientSecret);

    // Fetch track by ID
    const trackUrl = `https://api.spotify.com/v1/tracks/${spotifyId}`;

    const trackRes = await fetch(trackUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!trackRes.ok) {
      throw new Error(`Spotify track fetch failed: ${trackRes.status}`);
    }

    const track = await trackRes.json();
    const primaryArtist = track.artists[0];
    // Fetch artist details for image
    const artistImage = await fetchArtistImage(primaryArtist.id, token);

    return {
      spotify_id: track.id,
      spotify_artist_id: primaryArtist.id,
      artist: primaryArtist.name,
      artist_image_url: artistImage,
      release_year: track.album.release_date?.substring(0, 4),
      genre: track.album.genres?.[0] || 'Unknown',
      popularity: track.popularity
    };

  } catch (error) {
    console.error('[Spotify] Error:', error);
    return null;
  }
}
