// ============================================================
// HANDLER - PANEL ANALYSIS HISTORY
// ============================================================
// GET /api/panel-history — Returns user's philosopher panel analyses
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSupabaseCredentials } from "../utils/supabase.js";

export async function handlePanelHistory(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);

    const res = await fetch(
      `${sbUrl}/rest/v1/panel_analyses?user_id=eq.${user.userId}&order=created_at.desc&limit=50`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Supabase: ${res.status}`);
    }

    const rows = await res.json();

    return jsonResponse(
      {
        success: true,
        items: rows.map((r) => ({
          analysisId: r.panel_id,
          mediaType: r.media_type,
          title: r.title,
          artist: r.artist,
          philosophers: r.philosophers,
          lang: r.lang,
          requestedAt: r.created_at,
        })),
      },
      200,
      origin,
      env,
    );
  } catch (err) {
    console.error("[PanelHistory]", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}
