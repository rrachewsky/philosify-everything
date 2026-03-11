// ============================================================
// AUTH - PROXY HANDLER
// ============================================================
// Backend proxy for Supabase authentication using HttpOnly cookies
// This eliminates localStorage token storage, preventing XSS theft
//
// Endpoints:
// POST /auth/signin        - Email/password sign in
// POST /auth/signup        - Email/password sign up
// POST /auth/signout       - Sign out (clear cookie)
// POST /auth/refresh       - Refresh tokens
// GET  /auth/session       - Get current session (from cookie)
// POST /auth/google        - Initiate Google OAuth (PKCE)
// GET  /auth/callback      - OAuth callback handler (server-side PKCE exchange)
// POST /auth/exchange      - Exchange tokens from OAuth fragment (implicit fallback)
// POST /auth/exchange-code - Exchange PKCE code from frontend (frontend fallback)
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { getSecret } from "../utils/secrets.js";
import { jsonResponse, getCorsHeaders } from "../utils/index.js";
import {
  getSessionFromCookie,
  parseCookies,
  buildAuthCookie,
  buildClearAuthCookie,
  isProduction,
} from "./cookies.js";
import { handleAuthEmail } from "./email.js";

// ============================================================
// PKCE HELPERS (Web Crypto API - available in Cloudflare Workers)
// ============================================================

/**
 * Base64URL encode a Uint8Array (no padding, URL-safe)
 */
function base64UrlEncode(buffer) {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate a cryptographically random PKCE code_verifier (43-128 chars, URL-safe)
 */
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Compute PKCE code_challenge = Base64URL(SHA-256(code_verifier))
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Build Set-Cookie header for PKCE session ID (short-lived, HttpOnly)
 */
function buildPkceCookie(pkceId, isProd) {
  const attrs = [
    `pkce_id=${pkceId}`,
    "Max-Age=300",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd) {
    attrs.push("Secure");
    attrs.push("Domain=.philosify.org");
  }
  return attrs.join("; ");
}

/**
 * Build Set-Cookie header to clear PKCE session cookie
 */
function buildClearPkceCookie(isProd) {
  const attrs = ["pkce_id=", "Max-Age=0", "Path=/", "HttpOnly", "SameSite=Lax"];
  if (isProd) {
    attrs.push("Secure");
    attrs.push("Domain=.philosify.org");
  }
  return attrs.join("; ");
}

/**
 * Exchange a PKCE authorization code for tokens via Supabase's token endpoint.
 * Returns { session, user } on success, or throws on failure.
 */
async function exchangePkceCode(env, code, codeVerifier) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseAnonKey = await getSecret(env.SUPABASE_ANON_KEY);

  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text().catch(() => "");
    throw new Error(
      `Supabase PKCE token exchange failed: ${tokenRes.status} ${errBody}`,
    );
  }

  const tokenData = await tokenRes.json();

  return {
    session: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at || Math.floor(Date.now() / 1000) + 3600,
    },
    user: tokenData.user,
  };
}

/**
 * Get Supabase client with anon key (for auth operations)
 */
async function getSupabaseAuthClient(env) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseAnonKey = await getSecret(env.SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We handle persistence via cookies
      autoRefreshToken: false,
    },
  });
}

/**
 * Handle all auth proxy routes
 * @param {Request} request
 * @param {Object} env
 * @param {string} origin
 * @returns {Response}
 */
export async function handleAuthProxy(request, env, origin) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/auth/, "");
  const isProd = isProduction(env);
  const corsHeaders = getCorsHeaders(origin, env);

  try {
    switch (path) {
      case "/signin":
        return handleSignIn(request, env, origin, isProd);

      case "/signup":
        return handleSignUp(request, env, origin, isProd);

      case "/signout":
        return handleSignOut(request, env, origin, isProd);

      case "/refresh":
        return handleRefresh(request, env, origin, isProd);

      case "/session":
        return handleGetSession(request, env, origin);

      case "/realtime-token":
        return handleGetRealtimeToken(request, env, origin);

      case "/google":
        return handleGoogleOAuth(request, env, origin);

      case "/callback":
        return handleOAuthCallback(request, env, origin, isProd);

      case "/exchange":
        return handleTokenExchange(request, env, origin, isProd);

      case "/exchange-code":
        return handleCodeExchange(request, env, origin, isProd);

      case "/update-password":
        return handleUpdatePassword(request, env, origin);

      case "/reset-password":
        return handleResetPassword(request, env, origin);

      case "/send-email":
        return handleAuthEmail(request, env, origin);

      default:
        return jsonResponse({ error: "Not found" }, 404, origin, env);
    }
  } catch (error) {
    console.error("[Auth Proxy] Error:", error.message);
    return jsonResponse({ error: "Authentication error" }, 500, origin, env);
  }
}

/**
 * POST /auth/signin - Email/password sign in
 */
async function handleSignIn(request, env, origin, isProd) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return jsonResponse(
      { error: "Email and password required" },
      400,
      origin,
      env,
    );
  }

  const supabase = await getSupabaseAuthClient(env);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[Auth Proxy] Sign in failed:", error.message);
    return jsonResponse({ error: error.message }, 401, origin, env);
  }

  // Build response with HttpOnly cookie
  const response = jsonResponse(
    {
      user: sanitizeUser(data.user),
      expires_at: data.session.expires_at,
    },
    200,
    origin,
    env,
  );

  response.headers.set("Set-Cookie", buildAuthCookie(data.session, isProd));

  console.log(`[Auth Proxy] ✅ Sign in successful: ${email}`);
  return response;
}

/**
 * POST /auth/signup - Email/password sign up
 */
async function handleSignUp(request, env, origin, isProd) {
  const body = await request.json();
  const { email, password, language, fullName } = body;

  if (!email || !password) {
    return jsonResponse(
      { error: "Email and password required" },
      400,
      origin,
      env,
    );
  }

  if (password.length < 8) {
    return jsonResponse(
      {
        error:
          "Password must be at least 8 characters with one uppercase letter and one number",
      },
      400,
      origin,
      env,
    );
  }
  if (!/[A-Z]/.test(password)) {
    return jsonResponse(
      { error: "Password must contain at least one uppercase letter" },
      400,
      origin,
      env,
    );
  }
  if (!/[0-9]/.test(password)) {
    return jsonResponse(
      { error: "Password must contain at least one number" },
      400,
      origin,
      env,
    );
  }

  const supabase = await getSupabaseAuthClient(env);

  // Include language and full_name in user_metadata
  // full_name is used for display across the app (Agora, DMs, Collectives)
  // Google OAuth users already get full_name from their Google profile
  const metadata = {
    language: language || "en",
  };
  if (fullName && fullName.trim()) {
    metadata.full_name = fullName.trim();
  }

  const signUpOptions = {
    email,
    password,
    options: {
      data: metadata,
    },
  };

  const { data, error } = await supabase.auth.signUp(signUpOptions);

  if (error) {
    console.error("[Auth Proxy] Sign up failed:", error.message);
    return jsonResponse({ error: error.message }, 400, origin, env);
  }

  // If email confirmation is required, session might be null
  if (!data.session) {
    return jsonResponse(
      {
        user: sanitizeUser(data.user),
        message: "Check your email for confirmation link",
      },
      200,
      origin,
      env,
    );
  }

  // Build response with HttpOnly cookie
  const response = jsonResponse(
    {
      user: sanitizeUser(data.user),
      expires_at: data.session.expires_at,
    },
    200,
    origin,
    env,
  );

  response.headers.set("Set-Cookie", buildAuthCookie(data.session, isProd));

  console.log(
    `[Auth Proxy] ✅ Sign up successful: ${email} (lang: ${language || "en"})`,
  );
  return response;
}

/**
 * POST /auth/signout - Sign out
 * SECURITY: Revokes server-side refresh token in addition to clearing cookie
 */
async function handleSignOut(request, env, origin, isProd) {
  // Attempt server-side token revocation before clearing the cookie
  try {
    const session = getSessionFromCookie(request);
    if (session?.access_token) {
      const supabase = await getSupabaseAuthClient(env);
      // Use the user's token to revoke the session on Supabase's side
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token || "",
      });
      await supabase.auth.signOut();
    }
  } catch (err) {
    // Don't block signout if server-side revocation fails
    console.warn(
      "[Auth Proxy] Server-side token revocation failed:",
      err.message,
    );
  }

  const response = jsonResponse({ success: true }, 200, origin, env);
  response.headers.set("Set-Cookie", buildClearAuthCookie(isProd));

  console.log(
    "[Auth Proxy] ✅ Sign out successful (cookie cleared + server-side revocation)",
  );
  return response;
}

/**
 * POST /auth/refresh - Refresh tokens
 */
async function handleRefresh(request, env, origin, isProd) {
  const session = getSessionFromCookie(request);

  if (!session || !session.refresh_token) {
    return jsonResponse({ error: "No session" }, 401, origin, env);
  }

  const supabase = await getSupabaseAuthClient(env);
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: session.refresh_token,
  });

  if (error) {
    console.error("[Auth Proxy] Refresh failed:", error.message);
    // Clear invalid session
    const response = jsonResponse(
      { error: "Session expired" },
      401,
      origin,
      env,
    );
    response.headers.set("Set-Cookie", buildClearAuthCookie(isProd));
    return response;
  }

  // Update cookie with new tokens
  const response = jsonResponse(
    {
      user: sanitizeUser(data.user),
      expires_at: data.session.expires_at,
    },
    200,
    origin,
    env,
  );

  response.headers.set("Set-Cookie", buildAuthCookie(data.session, isProd));

  console.log("[Auth Proxy] ✅ Token refreshed");
  return response;
}

/**
 * GET /auth/session - Get current session from cookie
 * Also returns user's credit balance for immediate UI display
 */
async function handleGetSession(request, env, origin) {
  const session = getSessionFromCookie(request);

  if (!session) {
    return jsonResponse(
      { session: null, user: null, balance: null },
      200,
      origin,
      env,
    );
  }

  // Check if access token is expired (30s buffer) and refresh if needed
  let accessToken = session.access_token;
  let setCookieHeader = null;
  let expiresAt = session.expires_at;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = expiresAt > 0 && expiresAt - 30 < now;

  if (isExpired && session.refresh_token) {
    console.log("[Auth Proxy] Session token expired, refreshing...");
    try {
      const supabaseUrl = await getSecret(env.SUPABASE_URL);
      const supabaseAnonKey = await getSecret(env.SUPABASE_ANON_KEY);
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: refreshData, error: refreshError } =
        await tempClient.auth.refreshSession({
          refresh_token: session.refresh_token,
        });

      if (refreshError || !refreshData.session) {
        console.error(
          "[Auth Proxy] Token refresh failed:",
          refreshError?.message,
        );
        return jsonResponse(
          { session: null, user: null, balance: null },
          200,
          origin,
          env,
        );
      }

      accessToken = refreshData.session.access_token;
      expiresAt = refreshData.session.expires_at;
      setCookieHeader = buildAuthCookie(refreshData.session, isProduction(env));
      console.log("[Auth Proxy] Token refreshed successfully");
    } catch (e) {
      console.error("[Auth Proxy] Token refresh error:", e.message);
      return jsonResponse(
        { session: null, user: null, balance: null },
        200,
        origin,
        env,
      );
    }
  }

  // Verify token is still valid by calling Supabase
  const supabase = await getSupabaseAuthClient(env);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return jsonResponse(
      { session: null, user: null, balance: null },
      200,
      origin,
      env,
    );
  }

  // Fetch user's credit balance using the valid token (RLS enforced)
  let balance = { total: 0, credits: 0, freeRemaining: 0 };
  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseAnonKey = await getSecret(env.SUPABASE_ANON_KEY);

    // Create client with valid (potentially refreshed) token for RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: balanceData, error: balanceError } = await userClient
      .from("credits")
      .select("purchased, free_remaining, total")
      .single();

    if (!balanceError && balanceData) {
      balance = {
        total: balanceData.total || 0,
        credits: balanceData.purchased || 0,
        freeRemaining: balanceData.free_remaining || 0,
      };
    }
  } catch (e) {
    console.error(
      "[Auth Proxy] Failed to fetch balance in session:",
      e.message,
    );
    // Continue without balance - it's not critical for auth
  }

  let response = jsonResponse(
    {
      user: sanitizeUser(data.user),
      expires_at: expiresAt,
      balance,
    },
    200,
    origin,
    env,
  );

  // If token was refreshed, update the cookie so subsequent requests use the new token
  if (setCookieHeader) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Set-Cookie", setCookieHeader);
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
}

/**
 * GET /auth/realtime-token - Get short-lived JWT for Supabase Realtime
 * Dedicated endpoint to minimize access token exposure surface.
 * Returns token only if session cookie exists and hasn't expired.
 * No getUser() call — lightweight, server-side expiry check only.
 */
async function handleGetRealtimeToken(request, env, origin) {
  const session = getSessionFromCookie(request);

  if (!session || !session.access_token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        ...getCorsHeaders(origin, env),
      },
    });
  }

  // Check expiry server-side (lightweight, no Supabase API call)
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at <= nowSeconds) {
    return new Response(JSON.stringify({ error: "Token expired" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        ...getCorsHeaders(origin, env),
      },
    });
  }

  return new Response(
    JSON.stringify({
      token: session.access_token,
      expiresAt: session.expires_at,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains; preload",
        ...getCorsHeaders(origin, env),
      },
    },
  );
}

/**
 * POST /auth/google - Initiate Google OAuth (PKCE flow)
 *
 * Builds the Supabase authorize URL manually with PKCE code_challenge.
 * Stores code_verifier in KV (survives across stateless Worker requests).
 * Sets a short-lived pkce_id cookie to link the callback back to the verifier.
 */
async function handleGoogleOAuth(request, env, origin) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const isProd = isProduction(env);

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const pkceId = crypto.randomUUID();

  // Store code_verifier in KV (5-minute TTL)
  await env.PHILOSIFY_KV.put(`pkce:${pkceId}`, codeVerifier, {
    expirationTtl: 300,
  });

  // Redirect back to frontend after OAuth — Site URL is always allowed by Supabase
  // With PKCE (code_challenge present), Supabase sends ?code= in query params, not hash tokens
  const redirectTo = isProd ? "https://everything.philosify.org" : "http://localhost:3000";

  // Build Supabase authorize URL with PKCE
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectTo,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;

  // Return OAuth URL + set pkce_id cookie (links callback to code_verifier)
  const response = jsonResponse({ url: oauthUrl }, 200, origin, env);
  response.headers.append("Set-Cookie", buildPkceCookie(pkceId, isProd));

  console.log(`[Auth Proxy] Google OAuth initiated (PKCE), pkce_id: ${pkceId}`);
  return response;
}

/**
 * GET /auth/callback - OAuth callback handler
 *
 * Handles two flows:
 * 1. PKCE: ?code=xxx → read pkce_id cookie → get code_verifier from KV → exchange at Supabase
 * 2. Implicit fallback: #access_token=xxx → serve HTML that extracts and posts to /auth/exchange
 */
async function handleOAuthCallback(request, env, origin, isProd) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    console.error(
      "[Auth Proxy] OAuth callback error:",
      error,
      errorDescription,
    );
    return redirectToFrontend(
      isProd,
      `?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (code) {
    // PKCE flow: exchange code using stored code_verifier from KV
    const cookies = parseCookies(request);
    const pkceId = cookies["pkce_id"];

    if (pkceId) {
      const codeVerifier = await env.PHILOSIFY_KV.get(`pkce:${pkceId}`);

      if (codeVerifier) {
        try {
          // Delete from KV (one-time use)
          await env.PHILOSIFY_KV.delete(`pkce:${pkceId}`);

          const { session, user } = await exchangePkceCode(
            env,
            code,
            codeVerifier,
          );

          // Redirect to frontend with session cookie set
          const frontendUrl = isProd
            ? "https://everything.philosify.org"
            : "http://localhost:3000";
          const response = new Response(null, {
            status: 302,
            headers: { Location: frontendUrl },
          });
          response.headers.append(
            "Set-Cookie",
            buildAuthCookie(session, isProd),
          );
          response.headers.append("Set-Cookie", buildClearPkceCookie(isProd));

          console.log(
            `[Auth Proxy] ✅ PKCE callback successful: ${user?.email}`,
          );
          return response;
        } catch (err) {
          console.error("[Auth Proxy] PKCE exchange failed:", err.message);
          return redirectToFrontend(
            isProd,
            `?error=${encodeURIComponent("Code exchange failed")}`,
          );
        }
      }
    }

    // Fallback: pkce_id cookie missing or KV expired — redirect to frontend with error
    console.error(
      "[Auth Proxy] PKCE callback but no code_verifier found (pkce_id cookie or KV expired)",
    );
    return redirectToFrontend(
      isProd,
      `?error=${encodeURIComponent("Session expired, please try again")}`,
    );
  }

  // No code: implicit flow fallback — serve HTML that extracts tokens from hash fragment
  const frontendUrl = isProd
    ? "https://everything.philosify.org"
    : "http://localhost:3000";
  return new Response(getOAuthCallbackHTML(frontendUrl), {
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * POST /auth/exchange - Exchange tokens from OAuth URL fragment
 * Used as fallback when OAuth returns tokens in fragment (implicit flow)
 * instead of authorization code (PKCE flow)
 */
async function handleTokenExchange(request, env, origin, isProd) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin, env);
  }

  const body = await request.json();
  const { access_token, refresh_token } = body;

  if (!access_token || !refresh_token) {
    return jsonResponse({ error: "Missing tokens" }, 400, origin, env);
  }

  // Verify the access token is valid by getting user info
  const supabase = await getSupabaseAuthClient(env);
  const { data, error } = await supabase.auth.getUser(access_token);

  if (error || !data.user) {
    console.error(
      "[Auth Proxy] Token exchange failed - invalid token:",
      error?.message,
    );
    return jsonResponse({ error: "Invalid token" }, 401, origin, env);
  }

  // Build session object for cookie
  // Note: We don't have expires_at from implicit flow, estimate ~1 hour
  const session = {
    access_token,
    refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  // Set HttpOnly cookie and return user
  const response = jsonResponse(
    {
      user: sanitizeUser(data.user),
      expires_at: session.expires_at,
    },
    200,
    origin,
    env,
  );

  response.headers.set("Set-Cookie", buildAuthCookie(session, isProd));

  console.log(`[Auth Proxy] ✅ Token exchange successful: ${data.user.email}`);
  return response;
}

/**
 * POST /auth/exchange-code - Exchange PKCE authorization code from frontend
 *
 * Used when Supabase redirects to the frontend (not the API callback) with ?code=xxx.
 * Frontend sends the code here; backend retrieves code_verifier from KV via pkce_id cookie.
 * Tokens never appear in the browser URL or JavaScript — only the one-time code does.
 */
async function handleCodeExchange(request, env, origin, isProd) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin, env);
  }

  const body = await request.json();
  const { code } = body;

  if (!code) {
    return jsonResponse({ error: "Missing code" }, 400, origin, env);
  }

  // Read pkce_id from cookie
  const cookies = parseCookies(request);
  const pkceId = cookies["pkce_id"];

  if (!pkceId) {
    console.error("[Auth Proxy] exchange-code: no pkce_id cookie");
    return jsonResponse({ error: "Missing PKCE session" }, 400, origin, env);
  }

  // Retrieve code_verifier from KV
  const codeVerifier = await env.PHILOSIFY_KV.get(`pkce:${pkceId}`);

  if (!codeVerifier) {
    console.error(
      "[Auth Proxy] exchange-code: code_verifier not found in KV (expired?)",
    );
    return jsonResponse(
      { error: "PKCE session expired, please try again" },
      400,
      origin,
      env,
    );
  }

  // Delete from KV (one-time use)
  await env.PHILOSIFY_KV.delete(`pkce:${pkceId}`);

  try {
    const { session, user } = await exchangePkceCode(env, code, codeVerifier);

    // Set session cookie + clear pkce_id cookie
    const response = jsonResponse(
      {
        user: sanitizeUser(user),
        expires_at: session.expires_at,
      },
      200,
      origin,
      env,
    );

    response.headers.append("Set-Cookie", buildAuthCookie(session, isProd));
    response.headers.append("Set-Cookie", buildClearPkceCookie(isProd));

    console.log(
      `[Auth Proxy] ✅ PKCE code exchange successful: ${user?.email}`,
    );
    return response;
  } catch (err) {
    console.error("[Auth Proxy] PKCE code exchange failed:", err.message);
    return jsonResponse({ error: "Code exchange failed" }, 401, origin, env);
  }
}

/**
 * Redirect to frontend with optional query params
 */
function redirectToFrontend(isProd, queryString = "") {
  const frontendUrl = isProd
    ? "https://everything.philosify.org"
    : "http://localhost:3000";
  return new Response(null, {
    status: 302,
    headers: { Location: `${frontendUrl}${queryString}` },
  });
}

/**
 * HTML page to handle OAuth tokens from URL fragment
 * This is needed because server can't access URL fragments
 */
function getOAuthCallbackHTML(frontendUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Completing sign in...</title>
</head>
<body>
  <p>Completing sign in...</p>
  <script>
    (function() {
      var FRONTEND = ${JSON.stringify(frontendUrl)};
      var hash = window.location.hash.substring(1);
      var params = new URLSearchParams(hash);
      var accessToken = params.get('access_token');
      var refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken) {
        fetch('/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
          credentials: 'include'
        })
        .then(function(res) { return res.json(); })
        .then(function() {
          window.location.href = FRONTEND;
        })
        .catch(function() {
          window.location.href = FRONTEND + '?error=' + encodeURIComponent('Authentication failed');
        });
      } else {
        var error = params.get('error_description') || params.get('error') || 'Authentication failed';
        window.location.href = FRONTEND + '?error=' + encodeURIComponent(error);
      }
    })();
  </script>
</body>
</html>
`;
}

/**
 * POST /auth/update-password - Update password (when logged in)
 */
async function handleUpdatePassword(request, env, origin) {
  const body = await request.json();
  const { password } = body;

  if (!password) {
    return jsonResponse(
      { error: "New password is required" },
      400,
      origin,
      env,
    );
  }

  if (password.length < 8) {
    return jsonResponse(
      { error: "Password must be at least 8 characters" },
      400,
      origin,
      env,
    );
  }
  if (!/[A-Z]/.test(password)) {
    return jsonResponse(
      { error: "Password must contain at least one uppercase letter" },
      400,
      origin,
      env,
    );
  }
  if (!/[0-9]/.test(password)) {
    return jsonResponse(
      { error: "Password must contain at least one number" },
      400,
      origin,
      env,
    );
  }

  // Get the session from cookie to authenticate
  const session = await getSessionFromCookie(request, env);
  if (!session) {
    return jsonResponse({ error: "Not authenticated" }, 401, origin, env);
  }

  const supabase = await getSupabaseAuthClient(env);
  // Set the session so supabase knows who the user is
  await supabase.auth.setSession(session);

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[Auth Proxy] Update password failed:", error.message);
    return jsonResponse({ error: error.message }, 400, origin, env);
  }

  console.log(`[Auth Proxy] ✅ Password updated for user: ${data.user?.email}`);
  return jsonResponse(
    { success: true, message: "Password updated successfully" },
    200,
    origin,
    env,
  );
}

/**
 * POST /auth/reset-password - Request password reset email
 */
async function handleResetPassword(request, env, origin) {
  const body = await request.json();
  const { email } = body;

  if (!email) {
    return jsonResponse({ error: "Email is required" }, 400, origin, env);
  }

  const supabase = await getSupabaseAuthClient(env);
  const isProd = isProduction(env);
  const redirectUrl = isProd
    ? "https://everything.philosify.org/reset-password"
    : "http://localhost:3000/reset-password";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error("[Auth Proxy] Reset password failed:", error.message);
    // Don't reveal if email exists or not
    return jsonResponse(
      {
        success: true,
        message: "If an account exists, a reset link has been sent",
      },
      200,
      origin,
      env,
    );
  }

  console.log(`[Auth Proxy] ✅ Password reset email sent to: ${email}`);
  return jsonResponse(
    {
      success: true,
      message: "If an account exists, a reset link has been sent",
    },
    200,
    origin,
    env,
  );
}

/**
 * Remove sensitive data from user object
 * Only return safe, non-sensitive fields
 */
function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    // Include minimal metadata for display
    user_metadata: {
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url,
    },
  };
}
