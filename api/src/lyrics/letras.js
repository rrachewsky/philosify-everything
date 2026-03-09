// ============================================================
// LYRICS - LETRAS.MUS.BR FALLBACK
// ============================================================

import { createSlug } from './normalizer.js';

// Fetch lyrics from Letras.mus.br
export async function getFromLetrasMusicasBr(song, artist) {
  try {
    const artistSlug = createSlug(artist);
    const songSlug = createSlug(song);

    if (!artistSlug || !songSlug) return null;

    const url = `https://www.letras.mus.br/${artistSlug}/${songSlug}.html`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const html = await response.text();

    // Extract lyrics (element with class="lyric-original")
    const lyricMatch = html.match(/<div[^>]*class="[^"]*lyric-original[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (!lyricMatch) return null;

    const lyrics = lyricMatch[1]
      .replace(/<p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();

    if (lyrics.length > 100) {
      console.log(`[Letras] ✓ Found (${lyrics.length} chars)`);
      return lyrics;
    }

    return null;
  } catch (error) {
    console.error(`[Letras.mus.br] Error:`, error.message);
    return null;
  }
}
