// ============================================================
// HANDLER - Share link PREVIEW metadata (read-only)
// GET /api/share-preview/a/:slug
// ============================================================
// Feeds the Open Graph card for philosify.org/a/:slug.
//
// Deliberately does NOT go through get_shared_analysis: that RPC counts a
// view, and a link is previewed by WhatsApp, Telegram, Slack and every
// crawler that touches it. Counting those would burn a link's view cap
// before a human ever opened it. This reads the row directly and never
// writes.
//
// The description is the analysis's OWN opening text, so it is already in the
// analysis language — a Portuguese analysis yields a Portuguese card with no
// translation layer. That is the fix for the English card on a PT analysis.

import { jsonResponse } from '../utils/response.js';
import { getSupabaseCredentials } from '../utils/supabase.js';

const MAX_DESCRIPTION = 200;

function stripMarkup(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
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

export async function handleSharePreview(request, env, origin, slug) {
  const empty = { ok: false };

  if (!slug || !/^[A-Za-z0-9_-]{4,64}$/.test(slug)) {
    return jsonResponse(empty, 200, origin, env);
  }

  try {
    const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
    const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

    // /a/:slug carries a share token; /shared/:id may carry the analysis UUID
    // directly. Both are permalinks and both deserve a localized card.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let analysisId = isUuid ? slug : null;

    if (!analysisId) {
      const tokenRes = await fetch(
        `${sbUrl}/rest/v1/share_tokens?slug=eq.${encodeURIComponent(slug)}&select=analysis_id&limit=1`,
        { headers }
      );
      if (!tokenRes.ok) return jsonResponse(empty, 200, origin, env);

      const tokens = await tokenRes.json().catch(() => []);
      analysisId = tokens?.[0]?.analysis_id;
    }
    if (!analysisId) return jsonResponse(empty, 200, origin, env);

    const select =
      'select=language,classification,summary,philosophical_analysis,metadata,songs(title,artist)';
    const aRes = await fetch(`${sbUrl}/rest/v1/analyses?id=eq.${analysisId}&${select}&limit=1`, {
      headers,
    });
    if (!aRes.ok) return jsonResponse(empty, 200, origin, env);

    const rows = await aRes.json().catch(() => []);
    const a = rows?.[0];
    if (!a) return jsonResponse(empty, 200, origin, env);

    const meta = (a.metadata && typeof a.metadata === 'object' && a.metadata) || {};
    const work = a.songs?.title || '';
    const by = a.songs?.artist || '';

    // News stores its opening section in metadata; everything else uses the
    // integrated analysis. Either way the text is in the analysis language.
    const body = stripMarkup(meta.the_facts || a.summary || a.philosophical_analysis || '');

    return jsonResponse(
      {
        ok: true,
        lang: (a.language || 'en').split(/[-_]/)[0].toLowerCase(),
        title: [work, by].filter(Boolean).join(' — '),
        description: truncate(body),
        classification: a.classification || null,
      },
      200,
      origin,
      env
    );
  } catch (err) {
    console.error('[SharePreview] Failed:', err.message);
    return jsonResponse(empty, 200, origin, env);
  }
}
