// ============================================================
// TOP 50 TESTS — chart parser contract + purge cutoff
// ============================================================
// The parser is the only thing standing between a third-party HTML page and
// the ticker's table. Its contract: 50 valid rows or throw (the refresh then
// keeps the previous week). Fixture: kworb Global Daily of 2026/10/08, head
// + first 60 rows, captured 10 Oct 2026.

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

vi.mock('./analyze.js', () => ({ handleAnalyze: vi.fn() }));
vi.mock('../utils/secrets.js', () => ({ getSecret: vi.fn(async (x) => x) }));

const { parseChartPage, purgeCutoff, KEEP_WEEKS } = await import('./top10.js');

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = readFileSync(join(here, '__fixtures__', 'kworb_global_daily_2026-10-08.html'), 'utf8');

describe('parseChartPage', () => {
  it('yields exactly 50 rows in chart order with Spotify ids, titles and all artists', () => {
    const { chartDate, tracks } = parseChartPage(FIXTURE);
    expect(chartDate).toBe('2026/10/08');
    expect(tracks).toHaveLength(50);
    expect(tracks.map((t) => t.position)).toEqual([...Array(50)].map((_, i) => i + 1));
    expect(tracks[0]).toEqual({
      position: 1,
      song_title: 'BbY WOW',
      artist: 'KAROL G, Judeline, rusowsky', // main + "(w/ …)" featured artists
      spotify_id: '3h5T5JypYU7huFiVYhv1dr',
      is_free: true,
    });
    expect(tracks[1]).toMatchObject({ song_title: 'Nicole Kidman', artist: 'ADÉLA', is_free: true });
    expect(tracks[2].is_free).toBe(false);
    for (const t of tracks) {
      expect(t.spotify_id).toMatch(/^[A-Za-z0-9]{22}$/);
      expect(t.song_title.length).toBeGreaterThan(0);
      expect(t.artist.length).toBeGreaterThan(0);
    }
    expect(new Set(tracks.map((t) => t.spotify_id)).size).toBe(50);
  });

  it('stops at `wanted` even though the page has more rows', () => {
    expect(parseChartPage(FIXTURE, 10).tracks).toHaveLength(10);
  });

  it('throws when the page is empty, has no chart table, or is a different page', () => {
    expect(() => parseChartPage('')).toThrow(/empty/);
    expect(() => parseChartPage('<html>' + 'x'.repeat(2000) + '</html>')).toThrow(/spotifydaily/);
  });

  it('throws when fewer than 50 valid rows exist (truncated page)', () => {
    const cut = FIXTURE.slice(0, FIXTURE.indexOf('<td class="np">31</td>'));
    expect(() => parseChartPage(cut)).toThrow(/30 valid rows, wanted 50/);
  });

  it('throws on a row without a track link or with a malformed id', () => {
    const broken = FIXTURE.replace('../track/70cHKK8bHAfJrOGVnfRG9J.html', '../track/SHORT.html');
    expect(() => parseChartPage(broken)).toThrow(/row 2: bad spotify id/);
    const noLink = FIXTURE.replace(
      /<a href="\.\.\/track\/70cHKK8bHAfJrOGVnfRG9J\.html">Nicole Kidman<\/a>/,
      'Nicole Kidman',
    );
    expect(() => parseChartPage(noLink)).toThrow(/row 2: track link not found/);
  });

  it('throws on a duplicate id (page glitch) and on rows out of order', () => {
    const dup = FIXTURE.replace('../track/70cHKK8bHAfJrOGVnfRG9J.html', '../track/3h5T5JypYU7huFiVYhv1dr.html');
    expect(() => parseChartPage(dup)).toThrow(/duplicate spotify id/);
    const reordered = FIXTURE.replace('<td class="np">2</td>', '<td class="np">7</td>');
    expect(() => parseChartPage(reordered)).toThrow(/out of order/);
  });

  it('decodes HTML entities in titles and artists', () => {
    const withEntities = FIXTURE.replace('>BbY WOW<', '>Rock &amp; Roll &#39;26<');
    expect(parseChartPage(withEntities).tracks[0].song_title).toBe("Rock & Roll '26");
  });
});

describe('purgeCutoff', () => {
  it(`keeps ${KEEP_WEEKS} weeks: cutoff is week_start minus ${KEEP_WEEKS * 7} days`, () => {
    expect(KEEP_WEEKS).toBe(8);
    expect(purgeCutoff('2026-10-04')).toBe('2026-08-09');
    expect(purgeCutoff('2026-01-04', 1)).toBe('2025-12-28');
  });
});
