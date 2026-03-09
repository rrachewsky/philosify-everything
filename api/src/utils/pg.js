// ============================================================
// PostgREST helper (service role, bypasses RLS)
// ============================================================
// Shared utility for direct PostgREST queries using the service role key.
// Used by DM handler, forum invite handler, and any module that needs
// to query/mutate tables outside of user-scoped Supabase clients.

import { getSupabaseCredentials } from "./supabase.js";

/**
 * Execute a PostgREST query against a Supabase table using the service role.
 *
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {string} table - Table name (e.g. 'direct_messages', 'dm_conversations')
 * @param {object} [options]
 * @param {string} [options.filter] - PostgREST filter query string
 * @param {string} [options.select] - Columns to select
 * @param {string} [options.order] - Order clause
 * @param {number} [options.limit] - Row limit
 * @param {*} [options.body] - Request body (for POST/PATCH)
 * @param {boolean} [options.single] - Expect a single object response
 * @param {string} [options.prefer] - Prefer header override
 * @returns {Promise<*>} Parsed JSON response, or null on error
 */
export async function pg(
  env,
  method,
  table,
  { filter, select, order, limit, body, single, prefer } = {},
) {
  const { url, key } = await getSupabaseCredentials(env);
  const params = [];
  if (select) params.push(`select=${encodeURIComponent(select)}`);
  if (filter) params.push(filter);
  if (order) params.push(`order=${order}`);
  if (limit) params.push(`limit=${limit}`);
  const qs = params.length ? `?${params.join("&")}` : "";

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers["Prefer"] = prefer;
  else if (method === "POST" || method === "PATCH")
    headers["Prefer"] = "return=representation";
  if (single) headers["Accept"] = "application/vnd.pgrst.object+json";

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${url}/rest/v1/${table}${qs}`, opts);
  if (!res.ok) {
    if (single && res.status === 406) return null;
    const err = await res.text();
    console.error(`[DB] ${method} ${table}: ${res.status} - ${err}`);
    return null;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : method === "DELETE" ? true : null;
}

/**
 * Call a Supabase RPC function using the service role.
 *
 * @param {object} env - Cloudflare Worker env bindings
 * @param {string} fn - RPC function name
 * @param {object} [params] - Function parameters
 * @returns {Promise<*>} Parsed JSON response, or null on error
 */
export async function rpc(env, fn, params = {}) {
  const { url, key } = await getSupabaseCredentials(env);
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
