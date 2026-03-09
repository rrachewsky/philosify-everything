// ============================================================
// LYRICS - HTML PARSING
// ============================================================

// Extract lyrics from Genius HTML
export function extractLyricsFromHTML(html) {
  const regex = /<div[^>]*data-lyrics-container[^>]*>([\s\S]*?)<\/div>/g;
  let lyrics = '';
  let match;

  while ((match = regex.exec(html)) !== null) {
    const content = match[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    lyrics += content + '\n\n';
  }

  return lyrics.trim();
}
