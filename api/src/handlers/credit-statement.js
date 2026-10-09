// ============================================================
// HANDLER - CREDIT STATEMENT (extrato do usuário)
// ============================================================
// GET /api/credits/history?limit=30&before=<iso>&before_id=<uuid>
//
// One source of truth: credit_history. Every row the DB writes (confirm v2,
// release, reapers, Stripe payment/refund, signup bonus, admin grants) becomes
// a statement item with a derived `kind`, the origin recorded by confirm v2
// (metadata.source / description / batch_id) and a running `balance_after`.
//
// Invariants this handler relies on (CREDITOS_ETAPA3_EXTRATO_2026-10-07.md §0):
//   * reserve_credit debits the balance WITHOUT a statement row; the row is
//     born on confirm (-1) or release (+1). Hence, at any instant:
//       credits.total = Σ amount(credit_history) − pending reservations
//     so the running balance starts at `total + pending` on the first page and
//     at `total + pending − Σ amount(rows newer than the cursor)` afterwards.
//   * N confirms of one multi-credit action share metadata.batch_id and are
//     written back to back; consecutive rows with the same batch_id are one
//     item. If a batch is cut by the page edge the worker extends the page
//     until the batch closes, so the client never sees a split batch.
//   * The cursor is always the LAST RAW ROW consumed (created_at + id).
//
// Pure helpers (deriveKind, deriveLink, toItem, groupBatches,
// withRunningBalance, dropCursorRow, buildPage) are exported for vitest.

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { pg } from "../utils/pg.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// PostgREST timestamptz text: 2026-10-07T19:12:03.118374+00:00 (or trailing Z)
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const THREAD_RE = /thread:([0-9a-f-]{36})/i;

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;
const PAGE_SLACK = 10; // extra raw rows per page so a cut batch rarely needs a 2nd fetch
const BATCH_EXTEND = 5; // rows per extra fetch when a batch is cut at the page edge
const MAX_EXTENDS = 20; // hard stop (100 rows): no batch is this long

const SOURCES_WITH_ANALYSIS = new Set(["book", "cinema", "news"]);
const DEBATE_SOURCES = new Set([
  "colloquium_access",
  "colloquium_participate",
  "colloquium_philosopher",
  "colloquium_propose",
  "open_debate",
]);
// Panel descriptions end with "(mediaType)" — mediaType ∈ music|literature|news|cinema.
// NavAccount.viewAnalysis speaks book/cinema/news/music, so literature → book.
const PANEL_MEDIA = { music: "music", literature: "book", news: "news", cinema: "cinema" };

// ------------------------------------------------------------
// Pure derivations
// ------------------------------------------------------------

export function deriveKind(row) {
  const amount = Number(row.amount || 0);
  switch (row.type) {
    case "analysis":
    case "consume":
      return "charge";
    case "refund":
      return amount < 0 ? "chargeback" : "refund";
    case "purchase":
      return "purchase";
    case "signup_bonus":
      return "bonus";
    default:
      return "adjustment";
  }
}

export function deriveLink(row) {
  if (deriveKind(row) !== "charge") return null;
  const meta = row.metadata || {};
  const source = meta.source || null;
  const metaId = typeof meta.analysis_id === "string" ? meta.analysis_id : null;

  if (source === "panel") {
    const media = (String(meta.description || "").match(/\(([a-z]+)\)\s*$/) || [])[1];
    return metaId ? { kind: "panel", mediaType: PANEL_MEDIA[media] || "music", id: metaId } : null;
  }
  if (source && DEBATE_SOURCES.has(source)) {
    const threadId = (String(meta.description || "").match(THREAD_RE) || [])[1];
    return threadId ? { kind: "debate", id: threadId } : null;
  }
  if (row.analysis_id && UUID_RE.test(row.analysis_id)) {
    return { kind: "analysis", mediaType: "music", id: row.analysis_id };
  }
  if (source === "music" && metaId && UUID_RE.test(metaId)) {
    return { kind: "analysis", mediaType: "music", id: metaId };
  }
  if (source && SOURCES_WITH_ANALYSIS.has(source) && metaId && UUID_RE.test(metaId)) {
    return { kind: "analysis", mediaType: source, id: metaId };
  }
  return null;
}

export function toItem(row) {
  const meta = row.metadata || {};
  const kind = deriveKind(row);
  const item = {
    id: row.id,
    at: row.created_at,
    kind,
    source: meta.source || null,
    description: meta.description || null,
    amount: Number(row.amount || 0),
    count: 1,
    batch_id: meta.batch_id || null,
    link: deriveLink(row),
  };
  if (kind === "refund") item.reason = meta.reason || null;
  if (kind === "purchase" && meta.receipt_url) item.receipt_url = meta.receipt_url;
  return item;
}

/** Appends a raw row to `items`, merging it into the open batch when it continues one. */
function appendRow(items, row) {
  const item = toItem(row);
  const last = items[items.length - 1];
  if (item.batch_id && last && last.batch_id === item.batch_id) {
    last.amount += item.amount;
    last.count += 1;
    return;
  }
  items.push(item);
}

/**
 * Consecutive raw rows (already newest-first) with the same metadata.batch_id
 * collapse into one item: amount summed, count = rows, `at`/`id`/link from the
 * most recent row. Rows without batch_id are one item each.
 */
export function groupBatches(rows) {
  const items = [];
  for (const row of rows) appendRow(items, row);
  return items;
}

/** Walk newest → oldest: balance_after(item) = running before its amount is removed. */
export function withRunningBalance(items, start) {
  let running = Number(start || 0);
  return items.map((item) => {
    const out = { ...item, balance_after: running };
    running -= item.amount;
    return out;
  });
}

/** Cursor dedupe for the composite (created_at, id) without PostgREST `or(`. */
export function dropCursorRow(rows, before, beforeId) {
  if (!before) return rows;
  return rows.filter((r) => !(r.created_at === before && r.id >= beforeId));
}

/**
 * Builds one page of items from raw rows, extending the fetch while the last
 * consumed row's batch may continue past the rows in hand.
 *
 * @param {(before: string|null, limit: number) => Promise<object[]>} fetchPage
 *   newest-first rows with created_at <= before (inclusive), `limit` of them
 * @returns {{ items: object[], last: object|null, exhausted: boolean }}
 *   `last` is the last raw row consumed (the next cursor); `exhausted` is true
 *   when the table is known to have no rows beyond `last`.
 */
export async function buildPage(fetchPage, limit, before, beforeId) {
  const firstAsk = limit + PAGE_SLACK;
  const firstRaw = await fetchPage(before, firstAsk);
  let raw = dropCursorRow(firstRaw, before, beforeId);
  let mayHaveMore = firstRaw.length >= firstAsk;
  let consumed = 0;
  const items = [];
  let extendsDone = 0;

  for (;;) {
    while (consumed < raw.length) {
      const row = raw[consumed];
      const lastItem = items[items.length - 1];
      const continuesBatch =
        !!lastItem?.batch_id && row.metadata?.batch_id === lastItem.batch_id;
      if (items.length >= limit && !continuesBatch) break;
      appendRow(items, row);
      consumed += 1;
    }
    const ranOut = consumed === raw.length;
    const lastItem = items[items.length - 1];
    // Only an open batch at the very end of the rows in hand can be cut.
    if (!ranOut || !mayHaveMore || !lastItem?.batch_id || extendsDone >= MAX_EXTENDS) break;

    const tail = raw[raw.length - 1];
    const ask = BATCH_EXTEND + 1; // +1: the cursor row itself comes back (lte)
    const moreRaw = await fetchPage(tail.created_at, ask);
    const more = dropCursorRow(moreRaw, tail.created_at, tail.id);
    extendsDone += 1;
    mayHaveMore = moreRaw.length >= ask;
    if (more.length === 0) break;
    raw = raw.concat(more);
  }

  const last = consumed ? raw[consumed - 1] : null;
  const exhausted = consumed === raw.length && !mayHaveMore;
  return { items, last, exhausted };
}

// ------------------------------------------------------------
// Data access
// ------------------------------------------------------------

const SELECT = "id,type,amount,created_at,analysis_id,metadata";

async function fetchRows(env, userId, before, limit) {
  const parts = [`user_id=eq.${userId}`];
  if (before) parts.push(`created_at=lte.${encodeURIComponent(before)}`);
  const rows = await pg(env, "GET", "credit_history", {
    select: SELECT,
    filter: parts.join("&"),
    order: "created_at.desc,id.desc",
    limit,
  });
  if (!Array.isArray(rows)) throw new Error("credit_history query failed");
  return rows;
}

/** Σ amount of raw rows already consumed by earlier pages: newer than the cursor OR the cursor row itself (page 2+ only). */
async function sumNewerThan(env, userId, before, beforeId) {
  const rows = await pg(env, "GET", "credit_history", {
    select: "id,amount,created_at",
    filter: `user_id=eq.${userId}&created_at=gte.${encodeURIComponent(before)}`,
  });
  if (!Array.isArray(rows)) throw new Error("credit_history sum query failed");
  return rows
    .filter((r) => r.created_at > before || (r.created_at === before && r.id >= beforeId))
    .reduce((acc, r) => acc + Number(r.amount || 0), 0);
}

// ------------------------------------------------------------
// Route
// ------------------------------------------------------------

export async function handleCreditStatement(request, env, origin) {
  const user = await getUserFromAuth(request, env);
  if (!user?.userId) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401, origin, env);
  }
  const userId = user.userId;

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  let limit = DEFAULT_LIMIT;
  if (limitRaw !== null) {
    limit = Number(limitRaw);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return jsonResponse({ success: false, error: "Invalid limit" }, 400, origin, env);
    }
  }
  const before = url.searchParams.get("before");
  const beforeId = url.searchParams.get("before_id");
  if ((before && !beforeId) || (!before && beforeId)) {
    return jsonResponse({ success: false, error: "Invalid cursor" }, 400, origin, env);
  }
  if (
    before &&
    (!ISO_RE.test(before) || Number.isNaN(Date.parse(before)) || !UUID_RE.test(beforeId))
  ) {
    return jsonResponse({ success: false, error: "Invalid cursor" }, 400, origin, env);
  }

  try {
    const [creditsRow, pendingRows, page] = await Promise.all([
      pg(env, "GET", "credits", {
        select: "purchased,free_remaining,total",
        filter: `user_id=eq.${userId}`,
        single: true,
      }),
      pg(env, "GET", "credit_reservations", {
        select: "id",
        filter: `user_id=eq.${userId}&status=eq.pending`,
      }),
      buildPage((b, l) => fetchRows(env, userId, b, l), limit, before, beforeId),
    ]);

    const balance = {
      total: Number(creditsRow?.total || 0),
      purchased: Number(creditsRow?.purchased || 0),
      free_remaining: Number(creditsRow?.free_remaining || 0),
      pending: Array.isArray(pendingRows) ? pendingRows.length : 0,
    };

    const newer = before ? await sumNewerThan(env, userId, before, beforeId) : 0;
    const start = balance.total + balance.pending - newer;
    const items = withRunningBalance(page.items, start);

    const next =
      page.last && !page.exhausted
        ? { before: page.last.created_at, before_id: page.last.id }
        : null;

    return jsonResponse({ success: true, balance, items, next }, 200, origin, env);
  } catch (e) {
    console.error(`[CreditStatement] ${e.message}`);
    return jsonResponse(
      { success: false, error: "Failed to load statement" },
      500,
      origin,
      env,
    );
  }
}
