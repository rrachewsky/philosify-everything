// ============================================================
// LYRICS - GENIUS API (PRIMARY SOURCE WITH ARTIST VALIDATION)
// ============================================================

import { extractLyricsFromHTML } from './parser.js';
import { getSecret } from '../utils/secrets.js';

export async function getLyricsFromGenius(song, simplifiedArtist, artist, env) {
  try {
    const geniusToken = await getSecret(env.GENIUS_ACCESS_TOKEN) || env.GENIUS_API_KEY || env.GENIUS_TOKEN;
    if (!geniusToken) {
      console.log('[Genius] API token not configured');
      return null;
    }

    // Search strategies (most specific to most generic)
    const searchStrategies = [];

    if (artist) {
      // ALWAYS validate artist when provided
      const validateArtist = true;

      // 1. Clean name + simplified artist (BEST)
      searchStrategies.push({ query: `${song} ${simplifiedArtist}`, priority: 1, validateArtist });

      // 2. Clean name + full artist
      searchStrategies.push({ query: `${song} ${artist}`, priority: 2, validateArtist });

      // 3. Song only (with artist validation)
      searchStrategies.push({ query: song, priority: 3, validateArtist });
    } else {
      // If no artist, search by song only (no validation)
      searchStrategies.push({ query: song, priority: 1, validateArtist: false });
    }

    // Try each strategy
    for (const strategy of searchStrategies) {
      const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(strategy.query)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${geniusToken}` }
      });

      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const hits = searchData.response?.hits || [];

      // Try first 3 results
      for (let j = 0; j < Math.min(3, hits.length); j++) {
        const result = hits[j].result;
        const foundArtist = result.primary_artist?.name || '';

        // Validate artist if necessary (RIGOROUS)
        if (strategy.validateArtist && artist) {
          const normalizeArtist = (a) => a.toLowerCase().replace(/[^a-z0-9]/g, '');
          const foundNormalized = normalizeArtist(foundArtist);
          const searchNormalized = normalizeArtist(simplifiedArtist);

          const artistMatches = foundNormalized.includes(searchNormalized) ||
                               searchNormalized.includes(foundNormalized);

          if (!artistMatches) continue; // Skip - wrong artist
        }

        // Scrape the page
        const pageUrl = `https://genius.com${result.path}`;
        const pageRes = await fetch(pageUrl);
        const html = await pageRes.text();
        const lyrics = extractLyricsFromHTML(html);

        if (lyrics && lyrics.length > 100) {
          console.log(`[Genius] ✓ Found (${lyrics.length} chars)`);
          return lyrics;
        }
      }
    }

    return null;

  } catch (error) {
    console.error('[Genius] Error:', error.message);
    return null;
  }
}
