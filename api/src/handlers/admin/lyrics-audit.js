// ============================================================
// ADMIN - LYRICS CONTAMINATION AUDIT (read) + CACHE PURGE (write)
// ============================================================
// Background: until 31 Jul 2026 the Genius lookup validated the ARTIST of a
// search hit but never its TITLE. Genius ranks by artist relevance, so asking
// for a track it does not index returns the artist's OTHER songs — and the
// analysis was written about those lyrics while the interface showed the
// requested song (the "Joana -> Realize" defect).
//
// GET  /api/admin/lyrics-audit          - replay both rules, REPORT ONLY
// POST /api/admin/lyrics-audit/purge    - supersede an EXPLICIT list of ids
//
// The audit never writes. The purge never guesses: it acts only on ids handed
// to it, after Roberto has reviewed the list.

import { jsonResponse } from '../../utils/response.js';
import { getSupabaseCredentials } from '../../utils/supabase.js';
import { auditSongLyrics, getGeniusToken } from '../../lyrics/audit.js';

const DEFAULT_PAGE = 25;
const MAX_PAGE = 60;
const MAX_PURGE = 200;
const SPACING_MS = 120; // courtesy gap between Genius searches

const SUSPECT = new Set(['no_title_match', 'wrong_pick']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Music analyses live in `analyses` joined to `songs`. News shares those
// tables, so it is filtered out: news rows carry metadata.media_type = 'news'
// and are written with an empty lyrics field. Cinema and Literature have their
// own tables entirely and are out of scope here.
function isMusicRow(row) {
  if (row.media_type === 'news') return false;
  if ((row.classification || '').toLowerCase() === 'news') return false;
  const lyrics = row.songs?.lyrics;
  return typeof lyrics === 'string' && lyrics.trim().length > 0;
}

export async function handleLyricsAudit(request, env, origin) {
  const url = new URL(request.url);
  const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
  const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

  const select =
    'select=id,model,language,song_id,classification,media_type:metadata->>media_type,songs(title,artist,lyrics)';
  const base = `${sbUrl}/rest/v1/analyses?${select}&status=eq.published`;

  // ---- count mode: how big is the job -------------------------------------
  if (url.searchParams.get('count')) {
    const res = await fetch(`${base}&order=song_id.asc&limit=1`, {
      headers: { ...headers, Prefer: 'count=exact', Range: '0-0' },
    });
    const range = res.headers.get('content-range') || '';
    return jsonResponse(
      {
        totalPublishedAnalyses: Number(range.split('/')[1]) || null,
        note: 'Includes news rows, which the audit skips. Page through with offset/limit.',
        suggestedLimit: DEFAULT_PAGE,
      },
      200,
      origin,
      env
    );
  }

  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const limit = Math.min(MAX_PAGE, Math.max(1, Number(url.searchParams.get('limit')) || DEFAULT_PAGE));

  const token = await getGeniusToken(env);
  if (!token) {
    return jsonResponse({ error: 'GENIUS_ACCESS_TOKEN not configured' }, 500, origin, env);
  }

  const res = await fetch(`${base}&order=song_id.asc&offset=${offset}&limit=${limit}`, { headers });
  if (!res.ok) {
    return jsonResponse(
      { error: 'Supabase query failed', status: res.status, body: (await res.text()).slice(0, 400) },
      502,
      origin,
      env
    );
  }

  const rows = await res.json();
  const music = rows.filter(isMusicRow);

  // One Genius replay per unique song, not per analysis.
  const bySong = new Map();
  for (const row of music) {
    if (!bySong.has(row.song_id)) bySong.set(row.song_id, { song: row.songs, rows: [] });
    bySong.get(row.song_id).rows.push(row);
  }

  const suspects = [];
  const clean = [];
  const inconclusive = [];
  let first = true;

  for (const [songId, entry] of bySong) {
    const title = entry.song?.title || '';
    const artist = entry.song?.artist || '';
    if (!title) continue;

    if (!first) await sleep(SPACING_MS);
    first = false;

    let result;
    try {
      result = await auditSongLyrics(title, artist, token);
    } catch (err) {
      result = { verdict: 'search_failed', detail: err.message, oldPick: null, newPick: null };
    }

    const record = {
      songId,
      song: title,
      artist,
      verdict: result.verdict,
      detail: result.detail,
      analysedAs: result.oldPick ? `${result.oldPick.title} — ${result.oldPick.artist}` : null,
      shouldBe: result.newPick ? `${result.newPick.title} — ${result.newPick.artist}` : null,
      analyses: entry.rows.map((r) => ({ id: r.id, model: r.model, language: r.language })),
    };

    if (SUSPECT.has(result.verdict)) suspects.push(record);
    else if (result.verdict === 'ok') clean.push({ song: title, artist });
    else inconclusive.push(record);
  }

  return jsonResponse(
    {
      window: { offset, limit, rowsReturned: rows.length, musicRows: music.length, songsChecked: bySong.size },
      nextOffset: rows.length === limit ? offset + limit : null,
      counts: { suspect: suspects.length, clean: clean.length, inconclusive: inconclusive.length },
      suspects,
      inconclusive,
      legend: {
        no_title_match: 'Genius has the artist but not this song — the old rule fed another track. Strongest signal.',
        wrong_pick: 'Both rules found something, but the old rule picked a different track.',
        no_artist_hit: 'No Genius hit for this artist; lyrics may have come from the Letras fallback. Judge by hand.',
        search_failed: 'Genius did not answer on this pass. Re-run this window.',
      },
      caveat:
        'This is a replay against the CURRENT Genius index, not a recording of what happened then. Review before purging.',
    },
    200,
    origin,
    env
  );
}

export async function handleLyricsPurge(request, env, origin) {
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.analysisIds) ? body.analysisIds.filter(Boolean) : [];

  if (!ids.length) {
    return jsonResponse(
      { error: 'analysisIds required — this endpoint never selects its own targets' },
      400,
      origin,
      env
    );
  }
  if (ids.length > MAX_PURGE) {
    return jsonResponse({ error: `At most ${MAX_PURGE} ids per call` }, 400, origin, env);
  }

  const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
  const headers = {
    apikey: sbKey,
    Authorization: `Bearer ${sbKey}`,
    'Content-Type': 'application/json',
  };

  // Immutability is honoured: the row is not destroyed, it is dethroned. The
  // cache lookup requires status = 'published', so a superseded analysis stops
  // being served and the next request generates a fresh, correct one.
  const list = ids.map((id) => `"${id}"`).join(',');
  const patchRes = await fetch(`${sbUrl}/rest/v1/analyses?id=in.(${list})`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'superseded' }),
  });

  if (!patchRes.ok) {
    return jsonResponse(
      { error: 'Supersede failed', status: patchRes.status, body: (await patchRes.text()).slice(0, 400) },
      502,
      origin,
      env
    );
  }

  const updated = await patchRes.json().catch(() => []);
  const songIds = [...new Set(updated.map((r) => r.song_id).filter(Boolean))];
  let lyricsCleared = 0;

  // The stored lyrics on those songs are the contaminated text itself. Clearing
  // them is opt-in: it keeps the record from asserting something false.
  if (body?.clearLyrics && songIds.length) {
    const songList = songIds.map((id) => `"${id}"`).join(',');
    const clearRes = await fetch(`${sbUrl}/rest/v1/songs?id=in.(${songList})`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ lyrics: null }),
    });
    if (clearRes.ok) lyricsCleared = (await clearRes.json().catch(() => [])).length;
  }

  console.log(`[LyricsPurge] Superseded ${updated.length} analyses, cleared ${lyricsCleared} lyric rows`);

  return jsonResponse(
    {
      requested: ids.length,
      superseded: updated.length,
      songsTouched: songIds.length,
      lyricsCleared,
      note: 'Rows were marked superseded, not deleted. A fresh analysis generates on the next request.',
    },
    200,
    origin,
    env
  );
}
