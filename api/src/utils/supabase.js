// ============================================================
// SUPABASE CLIENT HELPER
// ============================================================
// Resolves credentials fresh each call. getSecret already caches
// at the secrets layer — no module-level cache here to avoid
// stale credentials persisting across Worker isolate reuses.

import { getSecret } from "./secrets.js";

function parseQualifiedName(name) {
  if (!name.includes(".")) {
    return { schema: null, localName: name };
  }

  const [schema, ...rest] = name.split(".");
  return {
    schema,
    localName: rest.join("."),
  };
}

function buildHeaders(key, schema, includeReturnRepresentation = true) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  if (includeReturnRepresentation) {
    headers.Prefer = "return=representation";
  }

  if (schema && schema !== "public") {
    headers["Accept-Profile"] = schema;
    headers["Content-Profile"] = schema;
  }

  return headers;
}

async function parseResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Get Supabase credentials (resolved fresh each call)
 * @param {object} env - Worker environment
 * @returns {Promise<{url: string, key: string}>}
 */
export async function getSupabaseCredentials(env) {
  const url = await getSecret(env.SUPABASE_URL);
  const key = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!url || !key) {
    throw new Error(
      "Supabase credentials are missing. Configure SUPABASE_URL and SUPABASE_SERVICE_KEY for local development.",
    );
  }

  return { url, key };
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
      const { schema, localName: tableName } = parseQualifiedName(table);

      const baseUrl = `${url}/rest/v1/${tableName}`;
      const headers = buildHeaders(key, schema);

      return {
        async select(columns = "*", options = {}) {
          let queryUrl = `${baseUrl}?select=${encodeURIComponent(columns)}`;
          if (options.filter) queryUrl += `&${options.filter}`;
          if (options.order) queryUrl += `&order=${options.order}`;
          if (options.limit !== undefined) queryUrl += `&limit=${options.limit}`;
          if (options.offset !== undefined) queryUrl += `&offset=${options.offset}`;

          const res = await fetch(queryUrl, { headers });
          if (!res.ok) {
            const error = await parseResponseBody(res);
            return {
              data: null,
              error: { message: typeof error === "string" ? error : JSON.stringify(error), status: res.status },
            };
          }
          return { data: (await parseResponseBody(res)) || [], error: null };
        },

        async insert(data) {
          const res = await fetch(baseUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const error = await parseResponseBody(res);
            return {
              data: null,
              error: { message: typeof error === "string" ? error : JSON.stringify(error), status: res.status },
            };
          }
          const result = await parseResponseBody(res);
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
            const error = await parseResponseBody(res);
            return {
              data: null,
              error: { message: typeof error === "string" ? error : JSON.stringify(error), status: res.status },
            };
          }
          const result = await parseResponseBody(res);
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
            const error = await parseResponseBody(res);
            return {
              data: null,
              error: { message: typeof error === "string" ? error : JSON.stringify(error), status: res.status },
            };
          }
          return { data: null, error: null };
        },
      };
    },

    async rpc(functionName, params = {}) {
      const { schema, localName } = parseQualifiedName(functionName);
      const response = await fetch(`${url}/rest/v1/rpc/${localName}`, {
        method: "POST",
        headers: buildHeaders(key, schema, false),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await parseResponseBody(response);
        return {
          data: null,
          error: { message: typeof error === "string" ? error : JSON.stringify(error), status: response.status },
        };
      }

      const result = await parseResponseBody(response);
      return {
        data: Array.isArray(result) ? (result[0] ?? null) : result,
        error: null,
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
  const { schema, localName } = parseQualifiedName(functionName);

  const response = await fetch(`${url}/rest/v1/rpc/${localName}`, {
    method: "POST",
    headers: buildHeaders(key, schema, false),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await parseResponseBody(response);
    throw new Error(
      `RPC ${functionName} failed: ${response.status} - ${
        typeof error === "string" ? error : JSON.stringify(error)
      }`,
    );
  }

  const result = await parseResponseBody(response);
  return Array.isArray(result) ? (result[0] ?? null) : result;
}
