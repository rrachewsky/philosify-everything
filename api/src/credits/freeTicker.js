// ============================================================
// CREDITS - FREE TICKER VALIDATION (SERVER-SIDE)
// ============================================================
// Validates if a song is in the free ticker list.
// SECURITY: Never trust client-side is_free flag!

import { getSecret } from '../utils/secrets.js';

/**
 * Normalize string for comparison (lowercase, remove accents, trim)
 */
function normalizeForComparison(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Only alphanumeric and spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Check if a song is in the current free ticker list.
 * Matches by spotify_id (preferred) OR normalized song+artist (fallback).
 * 
 * @param {Object} env - Cloudflare Worker env bindings
 * @param {string} song - Song title from request
 * @param {string} artist - Artist name from request
 * @param {string|null} spotifyId - Spotify ID from request (optional)
 * @returns {Promise<boolean>} - true if song is free, false otherwise
 */
export async function isInFreeTicker(env, song, artist, spotifyId = null) {
  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    // Query active free ticker songs
    const response = await fetch(
      `${supabaseUrl}/rest/v1/featured_songs?is_active=eq.true&is_free=eq.true&select=song_title,artist,spotify_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!response.ok) {
      console.error('[FreeTicker] Failed to fetch free songs:', response.status);
      return false; // Fail closed - if we can't verify, assume not free
    }

    const freeSongs = await response.json();
    
    if (!freeSongs || freeSongs.length === 0) {
      console.log('[FreeTicker] No free songs in ticker');
      return false;
    }

    // Priority 1: Match by Spotify ID (most reliable)
    if (spotifyId) {
      const matchById = freeSongs.some(fs => fs.spotify_id === spotifyId);
      if (matchById) {
        console.log(`[FreeTicker] ✓ Match by spotify_id: ${spotifyId}`);
        return true;
      }
    }

    // Priority 2: Match by normalized song + artist
    const normalizedSong = normalizeForComparison(song);
    const normalizedArtist = normalizeForComparison(artist);

    const matchByName = freeSongs.some(fs => {
      const fsNormalizedSong = normalizeForComparison(fs.song_title);
      const fsNormalizedArtist = normalizeForComparison(fs.artist);
      
      // Exact match on song title
      const songMatch = fsNormalizedSong === normalizedSong;
      
      // Artist can be partial match (e.g., "Queen" matches "Queen, David Bowie")
      const artistMatch = fsNormalizedArtist.includes(normalizedArtist) || 
                          normalizedArtist.includes(fsNormalizedArtist);
      
      return songMatch && artistMatch;
    });

    if (matchByName) {
      console.log(`[FreeTicker] ✓ Match by name: "${song}" by "${artist}"`);
      return true;
    }

    console.log(`[FreeTicker] ✗ Not in free ticker: "${song}" by "${artist}"`);
    return false;

  } catch (error) {
    console.error('[FreeTicker] Error checking free ticker:', error.message);
    return false; // Fail closed - if error, assume not free
  }
}
