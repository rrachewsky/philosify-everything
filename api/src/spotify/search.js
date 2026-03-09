// ============================================================
// SPOTIFY - SEARCH WITH INTELLIGENT PARSING
// ============================================================

import { getSpotifyToken } from './token.js';
import { getSecret } from '../utils/secrets.js';

// Parse search query - intelligent artist/song detection
export function parseQuery(query) {
  // Remove extra spaces
  query = query.trim();

  // Pattern 1: "Song - Artist" (explicit separator)
  if (query.includes(' - ')) {
    const [song, artist] = query.split(' - ').map(s => s.trim());
    return { song, artist };
  }

  // Pattern 2: "Song by Artist" (explicit keyword)
  if (query.toLowerCase().includes(' by ')) {
    const parts = query.split(/\s+by\s+/i);
    return { song: parts[0].trim(), artist: parts[1]?.trim() || '' };
  }

  // Default: Search broadly (no field restrictions)
  // Let Spotify's relevance ranking decide what matches best
  // This handles both artist names and song titles naturally
  return { song: query, artist: '' };
}

// Spotify search endpoint handler
export async function handleSpotifySearch(query, env) {
  // Parse intelligently
  const { song, artist } = parseQuery(query);

  console.log(`[Search] Query: "${query}" -> Song: "${song}", Artist: "${artist}"`);

  // Search on Spotify
  const clientId = await getSecret(env.SPOTIFY_CLIENT_ID);
  const clientSecret = await getSecret(env.SPOTIFY_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    throw new Error('Spotify not configured');
  }

  const token = await getSpotifyToken(clientId, clientSecret);

  // Build search query based on what we have
  let searchQuery;
  if (song && artist) {
    // Both song and artist specified: "Imagine - John Lennon"
    searchQuery = encodeURIComponent(`track:${song} artist:${artist}`);
  } else if (artist && !song) {
    // Artist only: "Beatles" -> get all their songs
    searchQuery = encodeURIComponent(`artist:${artist}`);
  } else {
    // Song only: "Imagine" -> search in all songs
    searchQuery = encodeURIComponent(song);
  }

  const searchUrl = `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=50`;

  const searchRes = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    throw new Error(`Spotify search failed: ${searchRes.status}`);
  }

  const data = await searchRes.json();
  const tracks = data.tracks?.items || [];

  // Helper function to clean song title (remove version/remaster info)
  const cleanSongTitle = (title) => {
    return title
      .replace(/\s*[-–—]\s*(.*?(Remaster|Version|Edit|Mix|Live|Recording|Take|Demo)).*$/i, '')
      .replace(/\s*\(.*?(Remaster|Version|Edit|Mix|Live|Recording|Take|Demo).*?\)/gi, '')
      .replace(/\s*\[.*?(Remaster|Version|Edit|Mix|Live|Recording|Take|Demo).*?\]/gi, '')
      .trim();
  };

  // Format options for frontend
  const options = tracks.map(track => ({
    spotify_id: track.id,  // Spotify track ID - critical for caching!
    song: cleanSongTitle(track.name),
    artist: track.artists.map(a => a.name).join(', ')
  }));

  // Deduplicate: Remove duplicate song+artist combinations
  const seen = new Set();
  const uniqueOptions = options.filter(track => {
    const key = `${track.song.toLowerCase()}|${track.artist.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  // Filter to match user's actual query (realtime search funneling)
  const searchLower = (song || query).toLowerCase();
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);

  const filteredOptions = uniqueOptions.filter(track => {
    const songLower = track.song.toLowerCase();
    const artistLower = track.artist.toLowerCase();
    const combined = `${songLower} ${artistLower}`;

    // Match if ALL search words appear somewhere in song+artist combined
    return searchWords.every(word => combined.includes(word));
  });

  // Smart sorting: Prioritize exact song title matches, then keep Spotify's relevance
  filteredOptions.sort((a, b) => {
    // Exact song title match gets highest priority
    const aExactMatch = a.song.toLowerCase() === searchLower;
    const bExactMatch = b.song.toLowerCase() === searchLower;

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    // Keep Spotify's relevance order for the rest
    return 0;
  });

  console.log(`[Search] Found ${filteredOptions.length} filtered tracks (${uniqueOptions.length} unique, ${options.length} total), first: "${filteredOptions[0]?.song}" by ${filteredOptions[0]?.artist}`);

  // Return top 50 results (originals prioritized, Spotify's max limit)
  const topResults = filteredOptions.slice(0, 50);

  return {
    query,
    parsed: { song, artist },
    options: topResults,
    count: topResults.length
  };
}
