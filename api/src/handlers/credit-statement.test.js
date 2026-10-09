// ============================================================
// CREDIT STATEMENT TESTS — pure derivations + page building
// ============================================================
// Fixtures mirror the rows the DB actually writes (confirm v2, release,
// reapers, Stripe payment/refund, signup bonus, admin grants). No network:
// buildPage receives a fake fetchPage over an in-memory, newest-first table.

import { describe, it, expect } from 'vitest';
import {
  deriveKind,
  deriveLink,
  toItem,
  groupBatches,
  withRunningBalance,
  dropCursorRow,
  buildPage,
} from './credit-statement.js';

const U = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const T = (n) => `2026-10-07T19:${String(n).padStart(2, '0')}:00.000000+00:00`;

const row = (over) => ({
  id: U(1),
  type: 'analysis',
  amount: -1,
  created_at: T(0),
  analysis_id: null,
  metadata: {},
  ...over,
});

// --- deriveKind -------------------------------------------------------
describe('deriveKind', () => {
  it('maps every DB writer to a statement kind', () => {
    expect(deriveKind(row({ type: 'analysis', amount: -1 }))).toBe('charge');
    expect(deriveKind(row({ type: 'consume', amount: -1 }))).toBe('charge');
    expect(deriveKind(row({ type: 'refund', amount: 1 }))).toBe('refund');
    expect(deriveKind(row({ type: 'refund', amount: -40 }))).toBe('chargeback');
    expect(deriveKind(row({ type: 'purchase', amount: 40 }))).toBe('purchase');
    expect(deriveKind(row({ type: 'signup_bonus', amount: 2 }))).toBe('bonus');
    expect(deriveKind(row({ type: 'admin_grant_credits', amount: 5 }))).toBe('adjustment');
    expect(deriveKind(row({ type: 'promo', amount: 3 }))).toBe('adjustment');
  });
});

// --- deriveLink -------------------------------------------------------
describe('deriveLink', () => {
  it('legacy charge without source: no link; with analyses FK: music link', () => {
    expect(deriveLink(row({ metadata: null }))).toBeNull();
    expect(deriveLink(row({ analysis_id: U(9) }))).toEqual({
      kind: 'analysis',
      mediaType: 'music',
      id: U(9),
    });
  });

  it('book/cinema/news link through metadata.analysis_id + source', () => {
    for (const source of ['book', 'cinema', 'news']) {
      expect(deriveLink(row({ metadata: { source, analysis_id: U(7) } }))).toEqual({
        kind: 'analysis',
        mediaType: source,
        id: U(7),
      });
    }
    // non-uuid raw id (e.g. "cached-news-123") → no link
    expect(deriveLink(row({ metadata: { source: 'news', analysis_id: 'news-123' } }))).toBeNull();
  });

  it('panel links with the media parsed from the description', () => {
    expect(
      deriveLink(
        row({ metadata: { source: 'panel', analysis_id: U(5), description: 'Oppenheimer (cinema)' } }),
      ),
    ).toEqual({ kind: 'panel', mediaType: 'cinema', id: U(5) });
    expect(
      deriveLink(
        row({ metadata: { source: 'panel', analysis_id: U(5), description: 'Atlas Shrugged (literature)' } }),
      ),
    ).toEqual({ kind: 'panel', mediaType: 'book', id: U(5) });
  });

  it('colloquium/debate sources link to the thread in the description', () => {
    expect(
      deriveLink(row({ metadata: { source: 'colloquium_philosopher', description: `Aristotle · thread:${U(3)}` } })),
    ).toEqual({ kind: 'debate', id: U(3) });
    expect(deriveLink(row({ metadata: { source: 'open_debate', description: `thread:${U(4)}` } }))).toEqual({
      kind: 'debate',
      id: U(4),
    });
  });

  it('quiz, space, unsafe zone, refunds and purchases never link', () => {
    expect(deriveLink(row({ metadata: { source: 'quiz', description: `start:${U(1)}` } }))).toBeNull();
    expect(deriveLink(row({ metadata: { source: 'space', description: 'agora' } }))).toBeNull();
    expect(deriveLink(row({ metadata: { source: 'unsafe_zone', description: 'x' } }))).toBeNull();
    // release_reservation writes analysis_id on refund rows too — still no link
    expect(deriveLink(row({ type: 'refund', amount: 1, analysis_id: U(9) }))).toBeNull();
    expect(deriveLink(row({ type: 'purchase', amount: 40 }))).toBeNull();
  });
});

// --- toItem -----------------------------------------------------------
describe('toItem', () => {
  it('reaper refund carries reason; release refund idem', () => {
    const a = toItem(row({ type: 'refund', amount: 1, metadata: { reason: 'timeout' } }));
    expect(a).toMatchObject({ kind: 'refund', reason: 'timeout', amount: 1, link: null });
    const b = toItem(row({ type: 'refund', amount: 1, metadata: { reason: 'cached_review', mapped_reason: 'cached' } }));
    expect(b.reason).toBe('cached_review');
  });

  it('Stripe purchase propagates receipt_url; chargeback has none', () => {
    const p = toItem(
      row({ type: 'purchase', amount: 40, metadata: { receipt_url: 'https://pay.stripe.com/receipts/x' } }),
    );
    expect(p).toMatchObject({ kind: 'purchase', receipt_url: 'https://pay.stripe.com/receipts/x' });
    const c = toItem(row({ type: 'refund', amount: -40, metadata: { partial: false } }));
    expect(c).toMatchObject({ kind: 'chargeback', amount: -40 });
    expect(c.receipt_url).toBeUndefined();
    expect(c.reason).toBeUndefined();
  });

  it('legacy charge (pre 07/10) has null source and description', () => {
    expect(toItem(row({ metadata: { reservation_id: U(2), credit_type: 'paid' } }))).toMatchObject({
      kind: 'charge',
      source: null,
      description: null,
      batch_id: null,
      link: null,
    });
  });
});

// --- groupBatches -----------------------------------------------------
describe('groupBatches', () => {
  const batch = U(77);
  const panelRows = [1, 2, 3].map((i) =>
    row({
      id: U(10 + i),
      created_at: T(10 - i), // newest first: 09, 08, 07
      metadata: { source: 'panel', description: 'Oppenheimer (cinema)', batch_id: batch, analysis_id: U(5) },
    }),
  );

  it('3 panel rows with one batch_id become one item of -3', () => {
    const items = groupBatches(panelRows);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: U(11), at: T(9), amount: -3, count: 3, batch_id: batch });
    expect(items[0].link).toEqual({ kind: 'panel', mediaType: 'cinema', id: U(5) });
  });

  it('rows without batch_id stay separate; a different batch starts a new item', () => {
    const other = row({ id: U(20), created_at: T(5), metadata: { source: 'cinema', batch_id: U(88) } });
    const single = row({ id: U(21), created_at: T(4), metadata: { source: 'quiz' } });
    const items = groupBatches([...panelRows, other, single]);
    expect(items.map((i) => i.count)).toEqual([3, 1, 1]);
  });
});

// --- withRunningBalance ----------------------------------------------
describe('withRunningBalance', () => {
  const items = [
    { amount: -3 },
    { amount: -1 },
    { amount: 1 },
    { amount: 40 },
    { amount: -1 },
    { amount: 2 },
  ];
  it('matches the §1 example sequence from total=41, pending=0', () => {
    expect(withRunningBalance(items, 41).map((i) => i.balance_after)).toEqual([41, 44, 45, 44, 4, 5]);
  });
  it('a pending reservation lifts every balance by one', () => {
    expect(withRunningBalance(items, 42).map((i) => i.balance_after)).toEqual([42, 45, 46, 45, 5, 6]);
  });
});

// --- dropCursorRow ----------------------------------------------------
describe('dropCursorRow', () => {
  it('drops the cursor row and same-timestamp rows with a greater id', () => {
    const rows = [
      row({ id: U(30), created_at: T(1) }),
      row({ id: U(29), created_at: T(1) }),
      row({ id: U(28), created_at: T(1) }),
      row({ id: U(27), created_at: T(0) }),
    ];
    expect(dropCursorRow(rows, T(1), U(29)).map((r) => r.id)).toEqual([U(28), U(27)]);
    expect(dropCursorRow(rows, null, null)).toHaveLength(4);
  });
});

// --- buildPage --------------------------------------------------------
// In-memory table + a fetchPage that behaves like PostgREST with
// `created_at=lte.before&order=created_at.desc,id.desc&limit=N`.
function makeFetch(table) {
  const calls = [];
  const fetchPage = async (before, limit) => {
    calls.push({ before, limit });
    const rows = table.filter((r) => !before || r.created_at <= before);
    return rows.slice(0, limit);
  };
  return { fetchPage, calls };
}

// 60 rows newest-first; rows 20..22 (0-based) share one batch; rows 38..41 share another.
function bigTable() {
  const rows = [];
  for (let i = 0; i < 60; i += 1) {
    const meta = { source: 'music' };
    if (i >= 20 && i <= 22) Object.assign(meta, { source: 'panel', batch_id: U(500), description: 'X (music)', analysis_id: U(5) });
    if (i >= 38 && i <= 41) Object.assign(meta, { source: 'unsafe_zone', batch_id: U(600), description: 'talk' });
    rows.push(
      row({
        id: U(1000 - i),
        created_at: `2026-10-07T${String(23 - Math.floor(i / 60)).padStart(2, '0')}:${String(59 - i).padStart(2, '0')}:00.000000+00:00`,
        metadata: meta,
      }),
    );
  }
  return rows;
}

describe('buildPage', () => {
  it('first page: `limit` whole items, cursor = last raw row consumed', async () => {
    const table = bigTable();
    const { fetchPage, calls } = makeFetch(table);
    const page = await buildPage(fetchPage, 10, null, null);
    expect(page.items).toHaveLength(10);
    expect(page.last.id).toBe(table[9].id);
    expect(page.exhausted).toBe(false);
    expect(calls).toEqual([{ before: null, limit: 20 }]);
  });

  it('a batch straddling the item limit is returned whole (buffer rows)', async () => {
    const table = bigTable();
    const { fetchPage } = makeFetch(table);
    // 21 items: rows 0..19 are 20 singles, item 21 is the batch 20..22
    const page = await buildPage(fetchPage, 21, null, null);
    expect(page.items).toHaveLength(21);
    expect(page.items[20]).toMatchObject({ amount: -3, count: 3, batch_id: U(500) });
    expect(page.last.id).toBe(table[22].id);
  });

  it('page full with a new batch opening on the next row: that batch is left whole for the next page', async () => {
    const table = bigTable();
    const { fetchPage, calls } = makeFetch(table);
    // 36 items = 20 singles + batch(20..22) + 15 singles(23..37); row 38 opens batch 600.
    const page = await buildPage(fetchPage, 36, null, null);
    expect(page.items).toHaveLength(36);
    expect(page.last.id).toBe(table[37].id);
    expect(page.exhausted).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it('open batch at the end of a short (last) fetch is complete by definition: no extension', async () => {
    const truncated = bigTable().slice(0, 40); // table ends inside batch 600 (rows 38,39 only)
    const { fetchPage, calls } = makeFetch(truncated);
    const page = await buildPage(fetchPage, 18, truncated[20].created_at, truncated[20].id);
    // after the cursor: batch tail(21,22) + 15 singles(23..37) + batch(38,39) = 17 items;
    // the fetch returned 19 < 28 asked → the table is exhausted, nothing to extend into.
    expect(page.items).toHaveLength(17);
    expect(page.items[16]).toMatchObject({ count: 2, batch_id: U(600) });
    expect(page.exhausted).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it('extension: fetch edge lands inside a batch → extra fetch, batch closes, cursor on its last row', async () => {
    // The slack (10 rows) is only beaten by a batch longer than it: 12 rows.
    const rows = [];
    let n = 0;
    const push = (meta) => {
      rows.push(row({ id: U(900 - n), created_at: T(59 - n), metadata: meta }));
      n += 1;
    };
    push({ source: 'music' });
    push({ source: 'music' });
    for (let i = 0; i < 12; i += 1) push({ source: 'unsafe_zone', batch_id: U(700), description: 'talk' });
    push({ source: 'quiz' });
    push({ source: 'quiz' });
    const { fetchPage, calls } = makeFetch(rows);

    // limit 3 → first ask 13 rows (0..12): 2 singles + 11 batch rows → cut.
    const page = await buildPage(fetchPage, 3, null, null);
    expect(page.items).toHaveLength(3);
    expect(page.items[2]).toMatchObject({ amount: -12, count: 12, batch_id: U(700) });
    expect(page.last.id).toBe(rows[13].id); // last row of the batch
    expect(page.exhausted).toBe(false);
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[1].before).toBe(rows[12].created_at); // extension cursor = last row in hand

    // next page continues after the batch
    const p2 = await buildPage(fetchPage, 3, page.last.created_at, page.last.id);
    expect(p2.items.map((i) => i.source)).toEqual(['quiz', 'quiz']);
    expect(p2.exhausted).toBe(true);
  });

  it('last page: fewer rows than asked → exhausted, no cursor needed', async () => {
    const table = bigTable().slice(0, 5);
    const { fetchPage } = makeFetch(table);
    const page = await buildPage(fetchPage, 10, null, null);
    expect(page.items).toHaveLength(5);
    expect(page.exhausted).toBe(true);
  });

  it('page 2 running balance: start = total + pending − Σ(newer) continues page 1 without a jump', async () => {
    const table = bigTable();
    const { fetchPage } = makeFetch(table);
    const total = 41;
    const p1 = await buildPage(fetchPage, 10, null, null);
    const i1 = withRunningBalance(p1.items, total);
    const lastOfP1 = i1[i1.length - 1];
    const newer = table
      .filter((r) => r.created_at > p1.last.created_at || (r.created_at === p1.last.created_at && r.id >= p1.last.id))
      .reduce((a, r) => a + r.amount, 0);
    const p2 = await buildPage(fetchPage, 10, p1.last.created_at, p1.last.id);
    const i2 = withRunningBalance(p2.items, total - newer);
    expect(i2[0].balance_after).toBe(lastOfP1.balance_after - lastOfP1.amount);
  });
});
