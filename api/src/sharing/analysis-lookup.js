// Where an analysis actually lives.
//
// There is no unified analyses row and no dual write: Music and News are stored
// in `analyses`, Cinema in `film_analyses`, Literature in `book_analyses`, each
// with its own parent table for the work and its author. Anything that resolves
// an analysis by id therefore has to try all three.
//
// Everything that resolved by id used to query `analyses` alone, so a shared
// film was invisible twice over: the Open Graph card fell back to the site's
// generic English slogan, and the permalink page answered "analysis not found".
// One shared lookup keeps the card and the page from disagreeing again.

// `work` is the embedded parent row; PostgREST needs the FK-aliased form for
// film/book because the column is not named after the table.
const SOURCES = [
  {
    table: 'analyses',
    embed: 'songs(title,artist,spotify_id)',
    work: 'songs',
    titleKey: 'title',
    byKey: 'artist',
  },
  {
    table: 'film_analyses',
    embed: 'films:film_id(title,director)',
    work: 'films',
    titleKey: 'title',
    byKey: 'director',
  },
  {
    table: 'book_analyses',
    embed: 'books:book_id(title,author)',
    work: 'books',
    titleKey: 'title',
    byKey: 'author',
  },
];

/**
 * Find an analysis by primary key across all three media tables.
 *
 * @param {string} sbUrl    Supabase REST base URL
 * @param {string} sbKey    service key
 * @param {string} id       analysis UUID
 * @param {string[]} columns  columns to select besides the embedded work; '*' for all
 * @returns {Promise<{row: object, source: object}|null>}
 */
export async function findAnalysisById(sbUrl, sbKey, id, columns = ['*']) {
  const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

  for (const source of SOURCES) {
    const select = [...columns, source.embed].join(',');
    let res;
    try {
      res = await fetch(
        `${sbUrl}/rest/v1/${source.table}?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(select)}&limit=1`,
        { headers }
      );
    } catch (err) {
      console.error(`[analysisLookup] ${source.table} unreachable:`, err.message);
      continue;
    }
    if (!res.ok) continue;

    const rows = await res.json().catch(() => []);
    if (rows?.length) return { row: rows[0], source };
  }

  return null;
}

/**
 * Flatten the embedded work onto the analysis under the field names the
 * frontend reads, so a film or a book arrives shaped like a song.
 */
export function enrichAnalysis(row, source) {
  const work = row?.[source.work] || {};
  const title = work[source.titleKey];
  const by = work[source.byKey];

  return {
    ...row,
    song: title,
    song_name: title,
    title,
    artist: by,
    // Only songs carry one; leaving it undefined elsewhere is correct.
    spotify_id: work.spotify_id || row.spotify_id,
  };
}

export { SOURCES as ANALYSIS_SOURCES };
