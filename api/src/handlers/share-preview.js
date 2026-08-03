// ============================================================
// HANDLER - Share card metadata (read-only)
// GET /api/share-card/a/:slug      → shared analysis  (also /api/share-preview/a/:slug)
// GET /api/share-card/panel/:id    → philosopher panel
// GET /api/share-card/debate/:id   → debate thread
// ============================================================
// Feeds the Open Graph card for philosify.org/a/:slug, /panel/:id and /debate/:id.
//
// Deliberately does NOT go through get_shared_analysis: that RPC counts a
// view, and a link is previewed by WhatsApp, Telegram, Slack and every
// crawler that touches it. Counting those would burn a link's view cap
// before a human ever opened it. This reads the row directly and never
// writes.
//
// Everything the card says is taken from the shared item itself, so it is
// already in that item's language — a Portuguese analysis yields a Portuguese
// card with no translation layer in between to drift. The one thing that is
// looked up, the verdict, comes from the same locale files the UI uses.

import { jsonResponse } from '../utils/response.js';
import { getSupabaseCredentials } from '../utils/supabase.js';
import { verdictLabel, panelLabel, debateLabel } from '../config/share-labels.js';
import { findAnalysisById, enrichAnalysis } from '../sharing/analysis-lookup.js';

const MAX_DESCRIPTION = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function stripMarkup(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_`#]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, limit = MAX_DESCRIPTION) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

const join = (parts) => parts.filter(Boolean).join(' · ');

function baseLang(lang) {
  return String(lang || 'en')
    .toLowerCase()
    .split(/[-_]/)[0];
}

// ---------------------------------------------------------------- analysis

async function analysisCard(env, id) {
  const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
  const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

  // /a/:slug carries a share token; /shared/:id may carry the analysis UUID
  // directly. Both are permalinks and both deserve a localized card.
  let analysisId = UUID_RE.test(id) ? id : null;

  if (!analysisId) {
    const tokenRes = await fetch(
      `${sbUrl}/rest/v1/share_tokens?slug=eq.${encodeURIComponent(id)}&select=analysis_id&limit=1`,
      { headers }
    );
    if (!tokenRes.ok) return null;
    const tokens = await tokenRes.json().catch(() => []);
    analysisId = tokens?.[0]?.analysis_id;
  }
  if (!analysisId) return null;

  // Music and News live in `analyses`, Cinema in `film_analyses`, Literature in
  // `book_analyses`. Looking only in the first is what made a shared film fall
  // through to the site's generic English card.
  const found = await findAnalysisById(sbUrl, sbKey, analysisId, [
    'language',
    'classification',
    'summary',
    'philosophical_analysis',
    'metadata',
  ]);
  if (!found) return null;

  const a = enrichAnalysis(found.row, found.source);

  const lang = baseLang(a.language);
  const meta = (a.metadata && typeof a.metadata === 'object' && a.metadata) || {};
  const verdict = verdictLabel(a.classification, lang);

  // News stores its opening section in metadata; everything else leads with the
  // summary, which is the verdict's rationale in short form.
  const body = stripMarkup(meta.the_facts || a.summary || a.philosophical_analysis || '');

  return {
    lang,
    title: join([[a.title, a.artist].filter(Boolean).join(' — '), verdict]),
    description: truncate(join([verdict, body])),
    classification: a.classification || null,
  };
}

// ------------------------------------------------------------------- panel

async function panelCard(env, id) {
  const raw = await env.PHILOSIFY_KV.get(`panel:${id}`);
  if (!raw) return null;

  let panel;
  try {
    panel = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!panel) return null;

  const lang = baseLang(panel.lang);
  const work = [panel.title, panel.artist].filter(Boolean).join(' — ');
  const philosophers = Array.isArray(panel.philosophers) ? panel.philosophers.join(', ') : '';

  return {
    lang,
    title: join([work, panelLabel(lang)]),
    description: truncate(join([philosophers, stripMarkup(panel.analysis)])),
    classification: null,
  };
}

// ------------------------------------------------------------------ debate

async function debateCard(env, id, requestedLang) {
  if (!UUID_RE.test(id)) return null;

  const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
  const res = await fetch(
    `${sbUrl}/rest/v1/forum_threads?id=eq.${id}&select=title,content,metadata&limit=1`,
    { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
  );
  if (!res.ok) return null;

  const rows = await res.json().catch(() => []);
  const thread = rows?.[0];
  if (!thread) return null;

  // A debate is written once and translated on demand, so unlike an analysis it
  // has no single language of its own: honour the language asked for, and fall
  // back to the language it was written in.
  const meta = (thread.metadata && typeof thread.metadata === 'object' && thread.metadata) || {};
  const lang = baseLang(requestedLang || meta.lang || 'en');
  const trans = meta.translations || {};

  const title = trans.title?.[lang] || thread.title || '';
  const content = trans.content?.[lang] || thread.content || '';

  return {
    lang,
    title: join([stripMarkup(title), debateLabel(lang)]),
    description: truncate(stripMarkup(content)),
    classification: null,
  };
}

// --------------------------------------------------------------- dispatch

/**
 * The single source of truth for what a shared link says about itself.
 *
 * Exported so the legacy HTML endpoints can render from the same data instead
 * of composing their own titles: two generators drift, and the ones in
 * index.js had drifted into hardcoded English.
 *
 * @returns {Promise<{lang, title, description, classification}|null>}
 */
export async function resolveShareCard(env, type, id, lang = null) {
  if (!id || !/^[A-Za-z0-9_-]{4,80}$/.test(id)) return null;

  try {
    let card = null;
    if (type === 'panel') card = await panelCard(env, id);
    else if (type === 'debate') card = await debateCard(env, id, lang);
    else card = await analysisCard(env, id);

    return card && card.title ? card : null;
  } catch (err) {
    console.error(`[ShareCard] ${type} failed:`, err.message);
    return null;
  }
}

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const OG_IMAGE = 'https://philosify.org/brand/philosify-og-card.png';

/**
 * Crawler-facing HTML for the legacy API-host endpoints, built from a resolved
 * card. Humans who land here are sent on to the real permalink.
 */
export function shareCardHtml(card, canonical) {
  const title = escapeHtml(`${card.title} · Philosify`);
  const description = escapeHtml(card.description || '');
  const url = escapeHtml(canonical);
  const lang = escapeHtml(card.lang || 'en');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">

    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${OG_IMAGE}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Philosify">
    <meta property="og:locale" content="${lang}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${OG_IMAGE}">

    <link rel="canonical" href="${url}">
    <meta http-equiv="refresh" content="1;url=${url}">
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <p><a href="${url}">${url}</a></p>
</body>
</html>`;
}

export function shareCardHtmlResponse(card, canonical, extraHeaders = {}) {
  return new Response(shareCardHtml(card, canonical), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      ...extraHeaders,
    },
  });
}

export const SOCIAL_BOT_RE = /WhatsApp|Telegram|facebook|Twitter|LinkedIn|Slack|Discordbot/i;

export async function handleShareCard(request, env, origin, type, id) {
  const lang = new URL(request.url).searchParams.get('lang');
  const card = await resolveShareCard(env, type, id, lang);
  if (!card) return jsonResponse({ ok: false }, 200, origin, env);
  return jsonResponse({ ok: true, ...card }, 200, origin, env);
}

// Kept under its original name: the protected rollback deployment still calls
// /api/share-preview/a/:slug.
export function handleSharePreview(request, env, origin, slug) {
  return handleShareCard(request, env, origin, 'a', slug);
}
