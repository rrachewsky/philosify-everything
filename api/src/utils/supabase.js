// ============================================================
// SUPABASE CLIENT HELPER
// ============================================================
// Resolves credentials fresh each call. getSecret already caches
// at the secrets layer — no module-level cache here to avoid
// stale credentials persisting across Worker isolate reuses.

import { getSecret } from "./secrets.js";

/**
 * Get Supabase credentials (resolved fresh each call)
 * @param {object} env - Worker environment
 * @returns {Promise<{url: string, key: string}>}
 */
export async function getSupabaseCredentials(env) {
  return {
    url: await getSecret(env.SUPABASE_URL),
    key: await getSecret(env.SUPABASE_SERVICE_KEY),
  };
}

/**
 * Get Supabase service client (for REST API calls)
 * Returns an object with from() method for table queries
 * @param {object} env - Worker environment
 * @returns {Promise<{url: string, key: string, from: function}>}
 */
export async function getServiceSupabase(env) {
  const { url, key } = await getSupabaseCredentials(env);

  return {
    url,
    key,
    /**
     * Query a table - returns chainable query builder
     * @param {string} table - Table name
     */
    from(table) {
      const baseUrl = `${url}/rest/v1/${table}`;
      const headers = {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      return {
        async select(columns = "*", options = {}) {
          let queryUrl = `${baseUrl}?select=${encodeURIComponent(columns)}`;
          if (options.filter) queryUrl += `&${options.filter}`;
          if (options.order) queryUrl += `&order=${options.order}`;
          if (options.limit) queryUrl += `&limit=${options.limit}`;
          if (options.offset) queryUrl += `&offset=${options.offset}`;

          const res = await fetch(queryUrl, { headers });
          if (!res.ok) {
            const error = await res.text();
            return {
              data: null,
              error: { message: error, status: res.status },
            };
          }
          return { data: await res.json(), error: null };
        },

        async insert(data) {
          const res = await fetch(baseUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const error = await res.text();
            return {
              data: null,
              error: { message: error, status: res.status },
            };
          }
          const result = await res.json();
          return {
            data: Array.isArray(result) ? result[0] : result,
            error: null,
          };
        },

        async update(data, filter) {
          const res = await fetch(`${baseUrl}?${filter}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const error = await res.text();
            return {
              data: null,
              error: { message: error, status: res.status },
            };
          }
          const result = await res.json();
          return {
            data: Array.isArray(result) ? result[0] : result,
            error: null,
          };
        },

        async delete(filter) {
          const res = await fetch(`${baseUrl}?${filter}`, {
            method: "DELETE",
            headers,
          });
          if (!res.ok) {
            const error = await res.text();
            return {
              data: null,
              error: { message: error, status: res.status },
            };
          }
          return { data: null, error: null };
        },
      };
    },
  };
}

/**
 * Call Supabase RPC function
 * @param {object} env - Worker environment
 * @param {string} functionName - RPC function name
 * @param {object} params - Function parameters
 * @returns {Promise<object>} - RPC result
 */
export async function callRpc(env, functionName, params = {}) {
  const { url, key } = await getSupabaseCredentials(env);

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `RPC ${functionName} failed: ${response.status} - ${error}`,
    );
  }

  const result = await response.json();
  return result?.[0] || result;
}
