// ============================================================
// LYRICS - SONG NAME & ARTIST NORMALIZATION
// ============================================================

// Clean song name (remove remaster/version suffixes)
export function cleanSongName(song) {
  return song
    // Remove versões remasterizadas
    .replace(/\s*-\s*Remastered\s+\d{4}/gi, '')
    .replace(/\s*\(\s*Remastered\s+\d{4}\s*\)/gi, '')
    .replace(/\s*-\s*\d{4}\s+Remaster/gi, '')
    .replace(/\s*\(\s*\d{4}\s+Remaster\s*\)/gi, '')
    // Remove outras versões
    .replace(/\s*-\s*(Live|Acoustic|Radio Edit|Album Version|Single Version|Explicit)/gi, '')
    .replace(/\s*\(\s*(Live|Acoustic|Radio Edit|Album Version|Single Version|Explicit)\s*\)/gi, '')
    .replace(/\s*\[\s*(Live|Acoustic|Radio Edit|Album Version|Single Version|Explicit)\s*\]/gi, '')
    // Remove feat./featuring
    .replace(/\s*[\(\[]?\s*feat\.?\s+.*?[\)\]]?/gi, '')
    .replace(/\s*[\(\[]?\s*featuring\s+.*?[\)\]]?/gi, '')
    .replace(/\s*[\(\[]?\s*ft\.?\s+.*?[\)\]]?/gi, '')
    .trim();
}

// Simplify artist name (extract primary artist)
export function simplifyArtist(artist) {
  if (!artist) return '';
  return artist
    .split(/[,&]/)[0]  // Get first artist only
    .replace(/\s*(feat|featuring|ft)\.?.*/gi, '')
    .trim();
}

// Create URL-safe slug
export function createSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')  // Decompose accents
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')  // Only letters, numbers, spaces, hyphens
    .replace(/\s+/g, '-')  // Spaces → hyphens
    .replace(/-+/g, '-')  // Multiple hyphens → one
    .replace(/^-|-$/g, '');  // Remove leading/trailing hyphens
}
