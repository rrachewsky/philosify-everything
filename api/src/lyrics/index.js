// ============================================================
// LYRICS - MAIN ORCHESTRATOR
// ============================================================

import { cleanSongName, simplifyArtist } from './normalizer.js';
import { getLyricsFromGenius } from './genius.js';
import { getFromLetrasMusicasBr } from './letras.js';

export async function getLyrics(song, artist, env) {
  const cleanedSong = cleanSongName(song);
  const simplifiedArtist = simplifyArtist(artist);

  // Try Genius first
  const geniusLyrics = await getLyricsFromGenius(cleanedSong, simplifiedArtist, artist, env);
  if (geniusLyrics) return geniusLyrics;

  // Fallback to Letras.mus.br
  const letrasLyrics = await getFromLetrasMusicasBr(cleanedSong, simplifiedArtist);
  if (letrasLyrics) return letrasLyrics;

  return null;
}

// Re-export utilities
export { cleanSongName, simplifyArtist, createSlug } from './normalizer.js';
export { extractLyricsFromHTML } from './parser.js';
