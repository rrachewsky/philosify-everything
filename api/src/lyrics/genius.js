// ============================================================
// LYRICS - GENIUS API (PRIMARY SOURCE WITH ARTIST + TITLE VALIDATION)
// ============================================================

import { extractLyricsFromHTML } from './parser.js';
import { getSecret } from '../utils/secrets.js';

// Comparable form: accent-free lowercase words, version/feature suffixes and
// punctuation dropped. "Joana (Ao Vivo)" and "joana" compare equal.
function normalizeTitle(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/\s-\s.*$/, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// A hit is the requested song only when the titles are equal once normalized,
// or one is the other plus a trailing qualifier ("Joana" vs "Joana Ao Vivo").
// Containment must land on a word boundary, so "Eu" never matches "Eu Sei".
function titleMatches(requested, found) {
  const a = normalizeTitle(requested);
  const b = normalizeTitle(found);
  if (!a || !b) return false;
  if (a === b) return true;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (shorter.length < 4) return false;
  return longer.startsWith(`${shorter} `);
}

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

      // Genius ranks by artist relevance, so a query for a track it does not
      // index returns the artist's OTHER songs. Scan the top hits and take the
      // one whose TITLE is the requested song — never merely the first match.
      for (let j = 0; j < Math.min(10, hits.length); j++) {
        const result = hits[j].result;
        const foundArtist = result.primary_artist?.name || '';
        const foundTitle = result.title || '';

        // Validate artist if necessary (RIGOROUS)
        if (strategy.validateArtist && artist) {
          const normalizeArtist = (a) => a.toLowerCase().replace(/[^a-z0-9]/g, '');
          const foundNormalized = normalizeArtist(foundArtist);
          const searchNormalized = normalizeArtist(simplifiedArtist);

          const artistMatches = foundNormalized.includes(searchNormalized) ||
                               searchNormalized.includes(foundNormalized);

          if (!artistMatches) continue; // Skip - wrong artist
        }

        // Validate title — without this the artist check alone lets a
        // different track by the same artist through, and the analysis is
        // written about the wrong song.
        if (!titleMatches(song, foundTitle)) {
          console.log(`[Genius] Skipped "${foundTitle}" — not "${song}"`);
          continue;
        }

        // Scrape the page
        const pageUrl = `https://genius.com${result.path}`;
        const pageRes = await fetch(pageUrl);
        const html = await pageRes.text();
        const lyrics = extractLyricsFromHTML(html);

        if (lyrics && lyrics.length > 100) {
          console.log(`[Genius] ✓ Found "${foundTitle}" by ${foundArtist} (${lyrics.length} chars)`);
          return lyrics;
        }
      }
    }

    console.log(`[Genius] No title match for "${song}" by ${artist || 'unknown'}`);
    return null;

  } catch (error) {
    console.error('[Genius] Error:', error.message);
    return null;
  }
}
