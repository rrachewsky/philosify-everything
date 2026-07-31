// ============================================================
// LYRICS - LETRAS.MUS.BR FALLBACK (WITH SONG VERIFICATION)
// ============================================================
// 31 Jul 2026: this source was believed safe because it addresses a song by
// exact URL. It is NOT. letras.mus.br REDIRECTS an unknown song slug to some
// other song by the same artist and answers 200 with real lyrics:
//
//   /bob-rach/joana.html                    -> /bob-rach/realize-feat-the-galt-sisters/
//   /bob-rach/musica-que-nao-existe-xyz.html -> /bob-rach/realize-feat-the-galt-sisters/
//
// That is the same defect the Genius lookup had, by a different mechanism, and
// it produces the same wrong-song analysis. The page reached after redirects is
// therefore verified against the requested title before its lyrics are used.

import { createSlug } from './normalizer.js';
import { titleMatches } from './genius.js';

// "/bob-rach/realize-feat-the-galt-sisters/" -> "realize feat the galt sisters"
function songFromUrl(finalUrl) {
  try {
    const segments = new URL(finalUrl).pathname.split('/').filter(Boolean);
    if (segments.length < 2) return ''; // redirected to the artist page
    return segments[segments.length - 1].replace(/\.html$/i, '').replace(/-/g, ' ');
  } catch {
    return '';
  }
}

// "<title>Realize (feat. X) - Bob Rach - LETRAS.MUS.BR</title>" -> "Realize (feat. X)"
function songFromTitleTag(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  if (!match) return '';
  return match[1].split(' - ')[0].trim();
}

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

    // Verify we landed on the requested song, not wherever we were redirected.
    // The canonical URL and the page title are independent witnesses; either
    // one matching is enough, neither matching is a refusal.
    const urlSong = songFromUrl(response.url || url);
    const titleSong = songFromTitleTag(html);
    const verified =
      (urlSong && titleMatches(song, urlSong)) || (titleSong && titleMatches(song, titleSong));

    if (!verified) {
      console.log(
        `[Letras] Refused — asked for "${song}", page is "${titleSong || urlSong || 'unidentified'}"`,
      );
      return null;
    }

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
      console.log(`[Letras] ✓ Found "${titleSong || song}" (${lyrics.length} chars)`);
      return lyrics;
    }

    return null;
  } catch (error) {
    console.error(`[Letras.mus.br] Error:`, error.message);
    return null;
  }
}
