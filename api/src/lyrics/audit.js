// ============================================================
// LYRICS - RETROACTIVE CONTAMINATION AUDIT
// ============================================================
// Replays BOTH matching algorithms over the same ranked Genius result list:
//
//   OLD (pre-31 Jul): first hit whose ARTIST matches. Title never checked.
//   NEW (in production since 31 Jul): first hit whose artist AND title match.
//
// When the two disagree, the analysis stored for that song was written about
// whatever the old rule picked — a different track. This is a replay, not a
// recording: Genius's index and ranking move over time, so a verdict is
// evidence for review, never an automatic deletion. Case `no_title_match` is
// the strongest signal (Genius has the artist but not the song at all, which
// is exactly the Joana shape).
//
// Read-only. Nothing here writes to the database.

import { getSecret } from '../utils/secrets.js';
import { titleMatches, artistMatches } from './genius.js';
import { cleanSongName, simplifyArtist } from './normalizer.js';

const HITS_SCANNED = 10; // same window production scans

async function searchGenius(query, token) {
  const res = await fetch(
    `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.response?.hits || [];
}

/**
 * Replay both rules for one song.
 * @returns {{verdict:string, detail:string, oldPick:object|null, newPick:object|null}}
 *   verdict is one of:
 *     ok                  - both rules land on the same Genius track
 *     no_title_match      - artist found, requested title absent -> old rule fed another track
 *     wrong_pick          - both found something, but different tracks
 *     no_artist_hit       - nothing matched the artist; cannot judge from Genius alone
 *     search_failed       - Genius unreachable or rate-limited on this pass
 */
export async function auditSongLyrics(title, artist, token) {
  const song = cleanSongName(title);
  const simplified = simplifyArtist(artist);

  // Production's strategy ladder, minus the redundant middle rung.
  const queries = artist ? [`${song} ${simplified}`, song] : [song];

  let sawAnyResponse = false;

  for (const query of queries) {
    const hits = await searchGenius(query, token);
    if (hits === null) continue; // transport failure on this rung
    sawAnyResponse = true;
    if (!hits.length) continue;

    const window = hits.slice(0, HITS_SCANNED).map((h) => h.result).filter(Boolean);

    const artistOk = artist
      ? window.filter((r) => artistMatches(simplified, r.primary_artist?.name || ''))
      : window;

    if (!artistOk.length) continue;

    const describe = (r) => ({ id: r.id, title: r.title, artist: r.primary_artist?.name || '' });

    const oldPick = artistOk[0];                                    // pre-fix behaviour
    const newPick = artistOk.find((r) => titleMatches(song, r.title)); // current behaviour

    if (!newPick) {
      return {
        verdict: 'no_title_match',
        detail: `Genius has this artist but not "${song}". The old rule would have used "${oldPick.title}".`,
        oldPick: describe(oldPick),
        newPick: null,
      };
    }
    if (newPick.id !== oldPick.id) {
      return {
        verdict: 'wrong_pick',
        detail: `Old rule took "${oldPick.title}"; the requested song is "${newPick.title}".`,
        oldPick: describe(oldPick),
        newPick: describe(newPick),
      };
    }
    return {
      verdict: 'ok',
      detail: `Both rules land on "${newPick.title}".`,
      oldPick: describe(oldPick),
      newPick: describe(newPick),
    };
  }

  return {
    verdict: sawAnyResponse ? 'no_artist_hit' : 'search_failed',
    detail: sawAnyResponse
      ? 'No Genius result matched this artist; lyrics may have come from the Letras fallback.'
      : 'Genius search did not respond on this pass.',
    oldPick: null,
    newPick: null,
  };
}

export async function getGeniusToken(env) {
  return (
    (await getSecret(env.GENIUS_ACCESS_TOKEN)) || env.GENIUS_API_KEY || env.GENIUS_TOKEN || null
  );
}
