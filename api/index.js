// PHILOSIFY API - Cloudflare Worker (REFACTORED)
// Sistema de Análise Filosófica Musical Objetivista
// Modular architecture with proper separation of concerns

import { getCorsHeaders, jsonResponse, sanitizeErrorMessage } from "./src/utils/index.js";
import { getUserFromAuth } from "./src/auth/index.js";
import {
  reserveCredit,
  confirmReservation,
  releaseReservation,
  cleanupStaleReservations,
  cleanupUserStaleReservations,
  isInFreeTicker,
} from "./src/credits/index.js";
import { checkRateLimit } from "./src/rate-limit/index.js";
import {
  pickPriceIdFromRequest,
  createStripeCheckout,
  verifyStripeWebhook,
} from "./src/payments/index.js";
import { safeEq } from "./src/payments/crypto.js";
import {
  handleSearch,
  handleAnalyze,
  handleBookSearch,
  handleBookAnalyze,
  handleAssignOrbitalCoordinates,
  handleSetOrbitalCoordinates,
  handleCheckOrbitalPosition,
  handleGetOccupiedPositions,
  handleBatchAssignOrbitalCoordinates,
} from "./src/handlers/index.js";
import { handleBookAnalysisHistory } from "./src/handlers/book-analysis-history.js";
import { handleBookAnalysisDetail } from "./src/handlers/book-analysis-detail.js";
import { handlePhilosopherPanel } from "./src/handlers/philosopher-panel.js";
import { handleNewsSearch, handleBreakingNews } from "./src/handlers/news-headlines.js";
import { handleNewsTranslate } from "./src/handlers/news-translate.js";
import { handleNewsTTS } from "./src/handlers/news-tts.js";
import {
  handleGetNewsPreferences,
  handleUnlockNewsPreferences,
  handleUpdateNewsPreferences,
} from "./src/handlers/news-preferences.js";
import { handlePanelHistory } from "./src/handlers/panel-history.js";
import { handleUserHistory } from "./src/handlers/user-history.js";
import { handleHistoryGraph, handleHistoryExtract, refreshGraphCache } from "./src/handlers/history-graph.js";
import { refreshBreakingNews } from "./src/news/index.js";
import { handleTTS } from "./src/handlers/tts.js";
import { handleGeminiTTS, handleClearTTSCache } from "./src/tts/gemini.js";
import {
  handleGetTop10,
  handleRefreshTop10,
  handleScheduledTop10,
} from "./src/handlers/top10.js";
import { handleBooksTop, fetchTopBooks } from "./src/handlers/books-top.js";
import { handleCinemaTop, handleCinemaDiagnose, fetchTopFilms } from "./src/handlers/cinema-top.js";
import { generateDailyQuestion } from "./src/handlers/daily-question.js";
import {
  handleColloquiumCron,
  checkPendingUserProposedReplies,
  checkExpiredAutoVerdicts,
} from "./src/handlers/colloquium.js";
import {
  handleGetColloquiums,
  handleGetColloquium,
  handleColloquiumAccess,
  handleColloquiumParticipate,
  handleAddPhilosopher,
  handleProposeColloquium,
  handleProposeOpenDebate,
  handleColloquiumInvite,
  handleGetRoster,
  handleColloquiumVerdict,
  handleColloquiumVerdictAudio,
  handleDeleteColloquium,
  handleRetryGeneration,
  handlePollVote,
} from "./src/handlers/colloquium-user.js";
import { handleAnalysisHistory } from "./src/handlers/analysis-history.js";
import { handleAnalysisDetail } from "./src/handlers/analysis-detail.js";
import { handleTransactions } from "./src/handlers/transactions.js";
import {
  handleGetMessages,
  handleSendMessage,
  handleDeleteChatMessage,
  handleEditChatMessage,
} from "./src/handlers/chat.js";
import {
  handleCreateGroup,
  handleListGroups,
  handleJoinGroup,
  handleGetGroupDetail,
  handleGetGroupChat,
  handleSendGroupMessage,
  handleLeaveGroup,
  handleKickMember,
} from "./src/handlers/groups.js";
import {
  handleListCollectives,
  handleBrowseCollectives,
  handleJoinCollective,
  handleGetCollectiveDetail,
  handleGetCollectiveAnalyses,
  handleLeaveCollective,
} from "./src/handlers/collective.js";
import {
  handleGetComments,
  handleAddComment,
  handleDeleteComment,
} from "./src/handlers/collective-comments.js";
import {
  handleGetProfile,
  handleUpdateProfile,
} from "./src/handlers/profile.js";
import {
  handleGetPublicKey,
  handleRegisterPublicKey,
  handleGetPublicKeysBulk,
  handleGetCollectiveKey,
  handleSetCollectiveKeys,
} from "./src/handlers/crypto.js";
import {
  handleGetUndergroundPosts,
  handleCreateUndergroundPost,
  handleUndergroundReaction,
  handleDeleteUndergroundPost,
  handleEditUndergroundPost,
  handleSetUndergroundNickname,
} from "./src/handlers/underground.js";
import {
  handleGetSpaceStatus,
  handleUnlockSpace,
} from "./src/handlers/spaces.js";
import {
  handleGetForumThreads,
  handleGetForumThread,
  handleCreateForumThread,
  handleDeleteForumThread,
  handleCreateForumReply,
  handleDeleteForumReply,
  handleEditForumReply,
  handleForumVote,
  handleDebateWrapup,
  handleWrapupAudio,
  handleDebateInvite,
} from "./src/handlers/forum.js";
import {
  handleGetConversations,
  handleCreateConversation,
  handleGetConversationMessages,
  handleSendConversationMessage,
  handleAddMembers,
  handleRemoveMember,
  handleUpdateConversation,
  handleLeaveConversation,
  handleDeleteConversationMessage,
  handleEditConversationMessage,
  handleMarkRead,
  handleGetUserProfile,
  handleGetConversationKey,
  handleSetConversationKeys,
  handleToggleReaction,
  handleShareAnalysis,
} from "./src/handlers/dm.js";
import {
  handleBlockUser,
  handleUnblockUser,
  handleGetBlockedUsers,
} from "./src/handlers/block.js";
import { handleGetPeople } from "./src/handlers/people.js";
import { handleMatchContacts } from "./src/handlers/contacts.js";
import { handleTranslate } from "./src/handlers/translate.js";
import {
  handleGetVapidKey,
  handleSubscribe,
  handleUnsubscribe,
  handleGetPreferences,
  handleUpdatePreferences,
  handleTestPush,
  handlePushDiagnose,
  handleGetPending,
  handleAckNotifications,
} from "./src/handlers/push.js";
import { cleanupPushQueue } from "./src/push/sender.js";
import { handleAuthProxy } from "./src/auth/proxy.js";
import { handleAuthEmail } from "./src/auth/email.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "./src/utils/supabase-user.js";
import {
  createShareToken,
  getSharedAnalysis,
  trackReferral,
} from "./src/sharing/index.js";
import { getSecret } from "./src/utils/secrets.js";
import { callRpc } from "./src/utils/supabase.js";
import { captureException, captureMessage } from "./src/utils/sentry.js";
import {
  sendSecurityAlertEmail,
  sendNewSubscriberEmail,
  sendPaymentReceiptEmail,
  sendNewAnalysisRequestEmail,
} from "./src/utils/security-alerts.js";

// Ads Platform
import {
  handleAdsSignup,
  handleAdsLogin,
  handleAdsLogout,
  handleAdsMe,
  handleAdsRefresh,
  handleListCampaigns as handleAdsListCampaigns,
  handleGetCampaign as handleAdsGetCampaign,
  handleCreateCampaign as handleAdsCreateCampaign,
  handleUpdateCampaign as handleAdsUpdateCampaign,
  handleDeleteCampaign as handleAdsDeleteCampaign,
  handleGetBalance as handleAdsGetBalance,
  handleGetTransactions as handleAdsGetTransactions,
  handleCreateCheckout as handleAdsCreateCheckout,
  handleBillingWebhook as handleAdsBillingWebhook,
  handleUpdateProfile as handleAdsUpdateProfile,
  handleChangePassword as handleAdsChangePassword,
  handleDeleteAccount as handleAdsDeleteAccount,
  handleStatsOverview as handleAdsStatsOverview,
  handleUploadCreative as handleAdsUploadCreative,
  handleServeAd,
  handleServeAdBatch,
  handleRecordImpression,
  handleRecordClick,
  // Inventory
  handleGetInventory,
  handleCheckAvailability,
  handleGetPricing,
  handleGetQuote,
  handleCalculateCart,
  // Orders
  handleListOrders,
  handleGetOrder,
  handleCreateOrder,
  handleOrderCheckout,
  handlePauseOrder,
  handleResumeOrder,
  handleCancelOrder,
  handleOrderPaymentWebhook,
  // Planner
  handleGeneratePlan,
  handleCreateFromPlan,
  handleListPlans,
  handleGetPlan,
  handlePlanCheckout,
  handlePlanPaymentWebhook,
  handleApprovePlanCreative,
  handleRequestPlanRevision,
  // Targeting
  handleGetTargetingOptions,
  handleEstimateReach,
  handleGetSuggestions as handleTargetingSuggestions,
  handleValidateTargeting,
  handleListPending as handleAdsListPending,
  handleApproveAdvertiser,
  handleRejectAdvertiser,
  handleSuspendAdvertiser,
  handleAdminStats as handleAdsAdminStats,
  handleAdminOverview as handleAdsAdminOverview,
  handleAdminListPlans as handleAdsAdminListPlans,
  handleAdminListCreativeRequests as handleAdsAdminListCreativeRequests,
  handleAdminSubmitCreativeDraft as handleAdsAdminSubmitCreativeDraft,
  handleAdminApprovePlan as handleAdsAdminApprovePlan,
  // Agency
  handleAgencySignup,
  handleAgencyLogin,
  handleAgencyLogout,
  handleAgencyMe,
  handleListClients,
  handleCreateClient,
  handleUpdateClientCommission,
  handleAgencyEarnings,
  handleAgencyPayout,
  handleAgencyListClientCampaigns,
  handleAgencyCreateClientCampaign,
  handleAgencyUpdateClientCampaign,
  handleAgencyDeleteClientCampaign,
} from "./src/handlers/ads/index.js";

// Request body size limit (1 MB)
const MAX_BODY_SIZE = 1024 * 1024;

// Daily AI spend cap per user (prevents runaway abuse)
const DAILY_AI_CAP = 100;

/**
 * Check if a user has exceeded their daily AI call cap.
 * Uses KV with TTL for automatic expiry — no cleanup needed.
 * @returns {boolean} true if under cap (allowed), false if over cap (blocked)
 */
async function checkDailyAICap(env, userId, endpoint) {
  if (!env.PHILOSIFY_KV || !userId) return true; // fail open if KV unavailable
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `ai_cap:${userId}:${today}`;
    const raw = await env.PHILOSIFY_KV.get(key);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= DAILY_AI_CAP) {
      console.log(`[AICap] User ${userId} exceeded daily cap (${count}/${DAILY_AI_CAP}) on ${endpoint}`);
      return false;
    }
    // Increment count with 24h TTL
    await env.PHILOSIFY_KV.put(key, String(count + 1), { expirationTtl: 86400 });
    return true;
  } catch (err) {
    console.error('[AICap] Error checking daily cap:', err.message);
    return true; // fail open — don't block users due to KV errors
  }
}

// HTML escape helper for Open Graph meta tags (prevents XSS/injection)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ============================================================
// MAIN WORKER
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = getCorsHeaders(origin, env);

    // Debug logging for CORS
    if (request.method === "OPTIONS" || url.pathname === "/api/search") {
      console.log("[CORS Debug]", {
        method: request.method,
        pathname: url.pathname,
        origin,
        corsHeaders: Object.keys(corsHeaders),
      });
    }

    // Top-level error handler to catch all unhandled exceptions
    try {
      // Request size limit
      const contentLength = parseInt(
        request.headers.get("content-length") || "0",
        10,
      );
      if (contentLength > MAX_BODY_SIZE) {
        return jsonResponse(
          {
            error: "Request too large",
            message: "Request body must be less than 1MB",
          },
          413,
          origin,
          env,
        );
      }

      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        console.log(
          "[CORS] Returning preflight response with headers:",
          corsHeaders,
        );
        return new Response(null, {
          headers: {
            "Strict-Transport-Security":
              "max-age=31536000; includeSubDomains; preload",
            ...corsHeaders,
          },
        });
      }

      // ========================================
      // LIGHTWEIGHT INTRUSION DETECTION (block + report obvious probes)
      // ========================================
      try {
        const pathname = url.pathname || "";
        const ua = request.headers.get("user-agent") || "";
        const ip = request.headers.get("cf-connecting-ip") || "unknown";

        const suspiciousPathPatterns = [
          /\.env/i,
          /wp-admin/i,
          /wp-login/i,
          /phpmyadmin/i,
          /pma/i,
          /adminer/i,
          /sqlite/i,
          /config\.php/i,
          /xmlrpc\.php/i,
          /cgi-bin/i,
          /\/\.git/i,
        ];

        const isSuspicious =
          suspiciousPathPatterns.some((re) => re.test(pathname)) ||
          pathname.includes("..") ||
          pathname.includes("%2e%2e") ||
          pathname.includes("%00");

        if (isSuspicious) {
          // Report (best-effort) and return a bland 404 to avoid giving hints
          ctx?.waitUntil?.(
            captureMessage(
              "Security: blocked suspicious request",
              "warning",
              { ip, ua, pathname, method: request.method, url: request.url },
              env,
            ),
          );
          ctx?.waitUntil?.(
            sendSecurityAlertEmail(env, {
              ip,
              ua,
              pathname,
              method: request.method,
              url: request.url,
              ray: request.headers.get("cf-ray") || "",
            }),
          );
          return jsonResponse({ error: "Not found" }, 404, origin, env);
        }
      } catch {
        // never block legitimate traffic due to IDS errors
      }

      // ========================================
      // CONTENT-TYPE VALIDATION FOR MUTATION REQUESTS
      // ========================================
      // Reject POST/PUT/PATCH requests that don't send application/json,
      // except for webhook endpoints that receive non-JSON payloads.
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const contentType = request.headers.get("content-type") || "";
        const hasBody =
          parseInt(request.headers.get("content-length") || "0", 10) > 0;
        const isJsonContent = contentType.includes("application/json");
        const excludedPaths = [
          "/api/stripe-webhook",
          "/api/supabase-webhook",
          "/auth/send-email",
          "/api/ads/creatives/upload",
          "/api/ads/billing/webhook",
        ];
        const isExcluded = excludedPaths.includes(url.pathname);

        // Only enforce Content-Type on requests that carry a body
        if (hasBody && !isJsonContent && !isExcluded) {
          return jsonResponse(
            { error: "Content-Type must be application/json" },
            415,
            origin,
            env,
          );
        }
      }

      // ========================================
      // SUPABASE AUTH EMAIL HOOK
      // ========================================
      // Handle Supabase Send Email Hook for localized auth emails
      if (url.pathname === "/auth/send-email" && request.method === "POST") {
        return handleAuthEmail(request, env, origin);
      }

      // ========================================
      // AUTH PROXY (HttpOnly cookie-based authentication)
      // ========================================
      // All /auth/* routes handled by auth proxy
      // Endpoints: signin, signup, signout, refresh, session, google, callback, exchange
      if (url.pathname.startsWith("/auth/")) {
        // Rate limit critical auth endpoints - FAIL CLOSED for security
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const authPath = url.pathname.replace("/auth/", "");
        const criticalPaths = [
          "signin",
          "signup",
          "reset-password",
          "google",
          "exchange-code",
          "refresh",
        ];
        const isCritical = criticalPaths.some((p) => authPath.startsWith(p));

        if (isCritical && request.method === "POST") {
          const rateLimitOk = await checkRateLimit(
            env,
            `auth:${authPath}:${ip}`,
            true,
          );
          if (!rateLimitOk) {
            console.log(
              `[Auth] Rate limit exceeded for ${authPath} from ${ip}`,
            );
            return jsonResponse(
              { error: "Too many requests. Please try again later." },
              429,
              origin,
              env,
            );
          }
        }

        return handleAuthProxy(request, env, origin);
      }

      // ========================================
      // PUBLIC ENDPOINTS
      // ========================================

      // Health check
      if (url.pathname === "/health" || url.pathname === "/api/health") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `health:${ip}`);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        return jsonResponse(
          { status: "ok", timestamp: new Date().toISOString() },
          200,
          origin,
          env,
        );
      }

      // Top 10 Spotify - Public (for ticker)
      if (url.pathname === "/api/top10" && request.method === "GET") {
        return handleGetTop10(request, env, origin);
      }

      // Top 10 Refresh - Admin only
      if (url.pathname === "/api/top10/refresh" && request.method === "POST") {
        return handleRefreshTop10(request, env, origin);
      }

      // Top Books Feed - Public (for literature ticker)
      if (url.pathname === "/api/books/top" && request.method === "GET") {
        return handleBooksTop(request, env, origin, ctx);
      }

      // Top Cinema Feed - Public (for cinema ticker)
      if (url.pathname === "/api/cinema/top" && request.method === "GET") {
        return handleCinemaTop(request, env, origin, ctx);
      }

      // Cinema diagnostic (admin only)
      if (url.pathname === "/api/cinema/diagnose" && request.method === "GET") {
        return handleCinemaDiagnose(request, env, origin);
      }

      // [REMOVED] Stripe diagnostic endpoint - removed per security audit (LOW-4)
      // Was leaking partial Stripe key prefix and price IDs

      // Public config endpoint
      if (url.pathname === "/api/config" && request.method === "GET") {
        // SECURITY: Returning the Supabase ANON key is acceptable: it is a public client key by design.
        // Real security must come from Supabase RLS + revoked grants. This endpoint is rate-limited.
        // This also removes a brittle dependency on build-time injection for auth to work.
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `config:${ip}`);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        const requestOrigin = request.headers.get("Origin") || "";
        const requestReferer = request.headers.get("Referer") || "";
        try {
          const checkUrl = new URL(requestOrigin || requestReferer);
          if (!checkUrl.hostname.endsWith('philosify.org') && !checkUrl.hostname.endsWith('pages.dev')) {
            return jsonResponse({ error: "Forbidden" }, 403, origin, env);
          }
        } catch {
          return jsonResponse({ error: "Forbidden" }, 403, origin, env);
        }
        return jsonResponse(
          {
            supabaseUrl: await getSecret(env.SUPABASE_URL),
            supabaseAnonKey: await getSecret(env.SUPABASE_ANON_KEY),
          },
          200,
          origin,
          env,
        );
      }

      // Search route (public - no auth required, but rate limited by IP)
      if (url.pathname === "/api/search" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `search:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        return handleSearch(request, env);
      }

      // ========================================
      // BOOK (LITERATURE) ROUTES
      // ========================================

      // Book search route (public - rate limited by IP)
      if (url.pathname === "/api/book-search" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `book-search:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        return handleBookSearch(request, env);
      }

      // Cinema full analysis (1 credit)
      if (url.pathname === "/api/cinema-analyze" && request.method === "POST") {
        // Daily AI spend cap (auth checked inside handler)
        const cinemaUser = await getUserFromAuth(request, env);
        if (cinemaUser) {
          const capOk = await checkDailyAICap(env, cinemaUser.userId, "cinema-analyze");
          if (!capOk) {
            return jsonResponse(
              { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
              429, origin, env,
            );
          }
        }
        const { handleCinemaAnalyze } = await import("./src/handlers/cinema-analyze.js");
        return handleCinemaAnalyze(request, env, origin, ctx);
      }

      // News full analysis (1 credit)
      if (url.pathname === "/api/news-analyze" && request.method === "POST") {
        // Daily AI spend cap (auth checked inside handler)
        const newsUser = await getUserFromAuth(request, env);
        if (newsUser) {
          const capOk = await checkDailyAICap(env, newsUser.userId, "news-analyze");
          if (!capOk) {
            return jsonResponse(
              { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
              429, origin, env,
            );
          }
        }
        const { handleNewsAnalyze } = await import("./src/handlers/news-analyze.js");
        return handleNewsAnalyze(request, env, origin, ctx);
      }

      // Film search (TMDB)
      if (url.pathname === "/api/film-search" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `film-search:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        const { handleFilmSearch } = await import("./src/handlers/film-search.js");
        return handleFilmSearch(request, env, origin);
      }

      // Book analysis history
      if (url.pathname === "/api/book-analysis-history" && request.method === "GET") {
        return handleBookAnalysisHistory(request, env, origin);
      }

      // Book analysis detail
      const bookAnalysisDetailMatch = url.pathname.match(/^\/api\/book-analysis\/([0-9a-f-]+)$/i);
      if (bookAnalysisDetailMatch && request.method === "GET") {
        return handleBookAnalysisDetail(request, env, origin, bookAnalysisDetailMatch[1]);
      }

      // Cinema analysis detail
      const cinemaAnalysisDetailMatch = url.pathname.match(/^\/api\/cinema-analysis\/([0-9a-f-]+)$/i);
      if (cinemaAnalysisDetailMatch && request.method === "GET") {
        const { handleCinemaAnalysisDetail } = await import("./src/handlers/cinema-analysis-detail.js");
        return handleCinemaAnalysisDetail(request, env, origin, cinemaAnalysisDetailMatch[1]);
      }

      // Cancel book analysis - release lock + credit reservation
      if (url.pathname === "/api/cancel-book-analysis" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }
        try {
          const body = await request.json();
          const { title, author, model, lang } = body;
          const normalizeForKey = (str) =>
            (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").substring(0, 50);
          const dedupKey = `book:${user.userId}:${normalizeForKey(title)}:${normalizeForKey(author)}:${model}:${lang}`;
          try {
            await callRpc(env, "release_analysis_lock", { p_lock_key: dedupKey });
          } catch (lockErr) {
            // Lock may already be released
          }
          const result = await cleanupUserStaleReservations(env, user.userId, 0);
          return jsonResponse({ success: true, releasedCount: result.releasedCount }, 200, origin, env);
        } catch (error) {
          return jsonResponse({ success: true }, 200, origin, env);
        }
      }

      // Text-to-Speech with Gemini 2.5 Flash TTS Preview (authenticated)
      // Supports language selection and on-the-fly translation
      if (url.pathname === "/api/tts" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(
          env,
          `tts:${user.userId}:${ip}`,
          true,
        );
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }

        return handleGeminiTTS(request, env, origin);
      }

      // Legacy OpenAI TTS endpoint (kept for backward compatibility)
      if (url.pathname === "/api/tts-legacy" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(
          env,
          `tts:${user.userId}:${ip}`,
        );
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }

        return handleTTS(request, env, origin);
      }

      // Admin: Clear TTS cache (requires X-Admin-Secret header)
      if (
        url.pathname === "/api/admin/clear-tts-cache" &&
        request.method === "DELETE"
      ) {
        return handleClearTTSCache(request, env, origin);
      }

      // Admin: Verify guide proof for a thread or analysis (requires X-Admin-Secret header)
      if (
        url.pathname === "/api/admin/verify-guide-proof" &&
        request.method === "POST"
      ) {
        const adminSecret = request.headers.get("X-Admin-Secret");
        const expectedSecret = await getSecret(env.ADMIN_SECRET);
        if (
          !adminSecret ||
          !expectedSecret ||
          !safeEq(adminSecret, expectedSecret)
        ) {
          return jsonResponse({ error: "Forbidden" }, 403, origin, env);
        }
        try {
          const body = await request.json();
          const { type, id } = body; // type: "thread" | "analysis", id: UUID

          if (!type || !id) {
            return jsonResponse(
              { error: 'Required: { type: "thread"|"analysis", id: "uuid" }' },
              400,
              origin,
              env,
            );
          }

          const proofSecret = await getSecret(env.GUIDE_PROOF_SECRET);
          if (!proofSecret) {
            return jsonResponse(
              { error: "GUIDE_PROOF_SECRET not configured" },
              500,
              origin,
              env,
            );
          }

          // Load current guides for hash comparison
          const {
            getGuide: loadGuide,
            getDebateAestheticGuide: loadAesthetic,
          } = await import("./src/guides/index.js");
          const { generateGuideProofWithSignature } =
            await import("./src/guides/loader.js");

          if (type === "thread") {
            // Verify a colloquium/debate thread's guide proof
            const { pg: pgQuery } = await import("./src/utils/pg.js");
            const threads = await pgQuery(env, "GET", "forum_threads", {
              filter: `id=eq.${id}`,
              select: "id,metadata",
              limit: 1,
            });
            const thread = threads?.[0];

            if (!thread) {
              return jsonResponse(
                { error: "Thread not found" },
                404,
                origin,
                env,
              );
            }

            const stored = thread.metadata?.guide_proof;
            if (!stored) {
              return jsonResponse(
                {
                  verified: false,
                  reason:
                    "No guide_proof in thread metadata (verdict generated before proof system)",
                },
                200,
                origin,
                env,
              );
            }

            // Recompute proofs using current guides
            const [currentGuide, currentAesthetic] = await Promise.all([
              loadGuide(env).catch(() => ""),
              loadAesthetic(env).catch(() => ""),
            ]);

            const [recomputedGuide, recomputedAesthetic] = await Promise.all([
              generateGuideProofWithSignature(
                currentGuide,
                id,
                proofSecret,
                "grok",
                env,
              ),
              generateGuideProofWithSignature(
                currentAesthetic,
                id,
                proofSecret,
                "grok",
                env,
              ),
            ]);

            const guideMatch =
              stored.guide_sha256 === recomputedGuide.sha256 &&
              stored.guide_signature === recomputedGuide.signature;
            const aestheticMatch =
              stored.aesthetic_sha256 === recomputedAesthetic.sha256 &&
              stored.aesthetic_signature === recomputedAesthetic.signature;

            return jsonResponse(
              {
                verified: guideMatch && aestheticMatch,
                thread_id: id,
                guide: {
                  stored_sha256: stored.guide_sha256,
                  current_sha256: recomputedGuide.sha256,
                  signature_valid: guideMatch,
                  version: stored.guide_version,
                },
                aesthetic: {
                  stored_sha256: stored.aesthetic_sha256,
                  current_sha256: recomputedAesthetic.sha256,
                  signature_valid: aestheticMatch,
                },
                source_of_truth_present: stored.source_of_truth_present,
                modelo: stored.modelo,
                generated_at: stored.generated_at,
                guide_changed_since:
                  stored.guide_sha256 !== recomputedGuide.sha256,
                aesthetic_changed_since:
                  stored.aesthetic_sha256 !== recomputedAesthetic.sha256,
              },
              200,
              origin,
              env,
            );
          } else if (type === "analysis") {
            // Verify a song analysis guide proof
            const { pg: pgQuery } = await import("./src/utils/pg.js");
            const analyses = await pgQuery(env, "GET", "analyses", {
              filter: `id=eq.${id}`,
              select: "id,metadata",
              limit: 1,
            });
            const analysis = analyses?.[0];

            if (!analysis) {
              return jsonResponse(
                { error: "Analysis not found" },
                404,
                origin,
                env,
              );
            }

            const meta = analysis.metadata || {};
            if (!meta.guide_sha256) {
              return jsonResponse(
                {
                  verified: false,
                  reason: "No guide_sha256 in analysis metadata",
                },
                200,
                origin,
                env,
              );
            }

            const currentGuide = await loadGuide(env).catch(() => "");
            const recomputed = await generateGuideProofWithSignature(
              currentGuide,
              id,
              proofSecret,
              meta.guide_modelo || "unknown",
              env,
            );

            const signatureValid =
              meta.guide_sha256 === recomputed.sha256 &&
              meta.guide_signature === recomputed.signature;

            return jsonResponse(
              {
                verified: signatureValid,
                analysis_id: id,
                stored_sha256: meta.guide_sha256,
                current_sha256: recomputed.sha256,
                signature_valid: signatureValid,
                version: meta.guide_version,
                modelo: meta.guide_modelo,
                guide_changed_since: meta.guide_sha256 !== recomputed.sha256,
              },
              200,
              origin,
              env,
            );
          } else {
            return jsonResponse(
              { error: 'type must be "thread" or "analysis"' },
              400,
              origin,
              env,
            );
          }
        } catch (err) {
          console.error("[Admin] Verify guide proof error:", err.message);
          return jsonResponse({ error: sanitizeErrorMessage(err.message) || "Internal error" }, 500, origin, env);
        }
      }

      // Admin: Trigger colloquium manually (requires X-Admin-Secret header)
      if (
        url.pathname === "/api/admin/colloquium/trigger" &&
        request.method === "POST"
      ) {
        const adminSecret = request.headers.get("X-Admin-Secret");
        const expectedSecret = await getSecret(env.ADMIN_SECRET);
        if (
          !adminSecret ||
          !expectedSecret ||
          !safeEq(adminSecret, expectedSecret)
        ) {
          return jsonResponse({ error: "Forbidden" }, 403, origin, env);
        }
        try {
          const body = await request.json().catch(() => ({}));
          const hour = body.hour ?? 8;
          const result = await handleColloquiumCron(env, hour);
          return jsonResponse(result, 200, origin, env);
        } catch (err) {
          console.error("[Admin] Colloquium trigger error:", err.message);
          return jsonResponse({ error: sanitizeErrorMessage(err.message) || "Internal error" }, 500, origin, env);
        }
      }

      // ========================================
      // PROTECTED ENDPOINTS (REQUIRE AUTH)
      // ========================================

      // Global chat (authenticated)
      if (url.pathname === "/api/chat" && request.method === "GET") {
        return handleGetMessages(request, env, origin);
      }
      if (url.pathname === "/api/chat" && request.method === "POST") {
        return handleSendMessage(request, env, origin);
      }
      const chatMsgMatch = url.pathname.match(/^\/api\/chat\/([0-9a-f-]+)$/i);
      if (chatMsgMatch && request.method === "DELETE") {
        return handleDeleteChatMessage(request, env, origin, chatMsgMatch[1]);
      }
      if (chatMsgMatch && request.method === "PATCH") {
        return handleEditChatMessage(request, env, origin, chatMsgMatch[1]);
      }

      // Group analysis (authenticated)
      if (url.pathname === "/api/groups" && request.method === "POST") {
        return handleCreateGroup(request, env, origin);
      }
      if (url.pathname === "/api/groups" && request.method === "GET") {
        return handleListGroups(request, env, origin);
      }
      if (url.pathname === "/api/groups/join" && request.method === "POST") {
        return handleJoinGroup(request, env, origin);
      }

      // Group detail + chat routes: /api/groups/:id, /api/groups/:id/chat, etc.
      const groupDetailMatch = url.pathname.match(
        /^\/api\/groups\/([0-9a-f-]+)$/i,
      );
      if (groupDetailMatch && request.method === "GET") {
        return handleGetGroupDetail(request, env, origin, groupDetailMatch[1]);
      }

      const groupChatMatch = url.pathname.match(
        /^\/api\/groups\/([0-9a-f-]+)\/chat$/i,
      );
      if (groupChatMatch && request.method === "GET") {
        return handleGetGroupChat(request, env, origin, groupChatMatch[1]);
      }
      if (groupChatMatch && request.method === "POST") {
        return handleSendGroupMessage(request, env, origin, groupChatMatch[1]);
      }

      const groupLeaveMatch = url.pathname.match(
        /^\/api\/groups\/([0-9a-f-]+)\/leave$/i,
      );
      if (groupLeaveMatch && request.method === "POST") {
        return handleLeaveGroup(request, env, origin, groupLeaveMatch[1]);
      }

      const groupKickMatch = url.pathname.match(
        /^\/api\/groups\/([0-9a-f-]+)\/members\/([0-9a-f-]+)$/i,
      );
      if (groupKickMatch && request.method === "DELETE") {
        return handleKickMember(
          request,
          env,
          origin,
          groupKickMatch[1],
          groupKickMatch[2],
        );
      }

      // ========================================
      // USER PROFILE (authenticated)
      // ========================================
      if (url.pathname === "/api/profile" && request.method === "GET") {
        return handleGetProfile(request, env, origin);
      }
      if (url.pathname === "/api/profile" && request.method === "PATCH") {
        return handleUpdateProfile(request, env, origin);
      }

      // ========================================
      // BLOCK/UNBLOCK USERS (authenticated)
      // ========================================
      if (url.pathname === "/api/users/block" && request.method === "POST") {
        return handleBlockUser(request, env, origin);
      }
      if (url.pathname === "/api/users/blocked" && request.method === "GET") {
        return handleGetBlockedUsers(request, env, origin);
      }

      const unblockMatch = url.pathname.match(
        /^\/api\/users\/block\/([0-9a-f-]+)$/i,
      );
      if (unblockMatch && request.method === "DELETE") {
        return handleUnblockUser(request, env, origin, unblockMatch[1]);
      }

      // ========================================
      // PEOPLE - Community Members Directory (authenticated)
      // ========================================
      if (url.pathname === "/api/people" && request.method === "GET") {
        return handleGetPeople(request, env, origin);
      }

      // ========================================
      // CONTACTS - Phone matching for "Find Friends" (authenticated)
      // ========================================
      if (url.pathname === "/api/contacts/match" && request.method === "POST") {
        return handleMatchContacts(request, env, origin);
      }

      // ========================================
      // TRANSLATE - On-demand message translation (authenticated)
      // ========================================
      if (url.pathname === "/api/translate" && request.method === "POST") {
        return handleTranslate(request, env, origin);
      }

      // ========================================
      // E2E ENCRYPTION - Public Key Management (authenticated)
      // ========================================
      if (url.pathname === "/api/crypto/keys" && request.method === "POST") {
        return handleRegisterPublicKey(request, env, origin);
      }
      if (
        url.pathname === "/api/crypto/keys/bulk" &&
        request.method === "POST"
      ) {
        return handleGetPublicKeysBulk(request, env, origin);
      }

      const cryptoKeyMatch = url.pathname.match(
        /^\/api\/crypto\/keys\/([0-9a-f-]+)$/i,
      );
      if (cryptoKeyMatch && request.method === "GET") {
        return handleGetPublicKey(request, env, origin, cryptoKeyMatch[1]);
      }

      const collectiveKeyMatch = url.pathname.match(
        /^\/api\/crypto\/collective\/([0-9a-f-]+)\/key$/i,
      );
      if (collectiveKeyMatch && request.method === "GET") {
        return handleGetCollectiveKey(
          request,
          env,
          origin,
          collectiveKeyMatch[1],
        );
      }
      if (collectiveKeyMatch && request.method === "POST") {
        return handleSetCollectiveKeys(
          request,
          env,
          origin,
          collectiveKeyMatch[1],
        );
      }

      // ========================================
      // THE COLLECTIVE - Artist Fan Clubs (authenticated)
      // ========================================
      if (url.pathname === "/api/collective" && request.method === "GET") {
        return handleListCollectives(request, env, origin);
      }
      if (
        url.pathname === "/api/collective/browse" &&
        request.method === "GET"
      ) {
        return handleBrowseCollectives(request, env, origin);
      }
      if (
        url.pathname === "/api/collective/join" &&
        request.method === "POST"
      ) {
        return handleJoinCollective(request, env, origin);
      }

      const collectiveDetailMatch = url.pathname.match(
        /^\/api\/collective\/([0-9a-f-]+)$/i,
      );
      if (collectiveDetailMatch && request.method === "GET") {
        return handleGetCollectiveDetail(
          request,
          env,
          origin,
          collectiveDetailMatch[1],
        );
      }

      const collectiveAnalysesMatch = url.pathname.match(
        /^\/api\/collective\/([0-9a-f-]+)\/analyses$/i,
      );
      if (collectiveAnalysesMatch && request.method === "GET") {
        return handleGetCollectiveAnalyses(
          request,
          env,
          origin,
          collectiveAnalysesMatch[1],
        );
      }

      const collectiveLeaveMatch = url.pathname.match(
        /^\/api\/collective\/([0-9a-f-]+)\/leave$/i,
      );
      if (collectiveLeaveMatch && request.method === "POST") {
        return handleLeaveCollective(
          request,
          env,
          origin,
          collectiveLeaveMatch[1],
        );
      }

      // Collective comments
      const analysisCommentsMatch = url.pathname.match(
        /^\/api\/collective\/analyses\/([0-9a-f-]+)\/comments$/i,
      );
      if (analysisCommentsMatch && request.method === "GET") {
        return handleGetComments(
          request,
          env,
          origin,
          analysisCommentsMatch[1],
        );
      }
      if (analysisCommentsMatch && request.method === "POST") {
        return handleAddComment(request, env, origin, analysisCommentsMatch[1]);
      }

      const deleteCommentMatch = url.pathname.match(
        /^\/api\/collective\/comments\/([0-9a-f-]+)$/i,
      );
      if (deleteCommentMatch && request.method === "DELETE") {
        return handleDeleteComment(request, env, origin, deleteCommentMatch[1]);
      }

      // ========================================
      // THE UNDERGROUND - Anonymous Confessions (authenticated)
      // ========================================
      if (url.pathname === "/api/underground" && request.method === "GET") {
        return handleGetUndergroundPosts(request, env, origin);
      }
      if (url.pathname === "/api/underground" && request.method === "POST") {
        return handleCreateUndergroundPost(request, env, origin);
      }
      if (
        url.pathname === "/api/underground/nickname" &&
        request.method === "POST"
      ) {
        return handleSetUndergroundNickname(request, env, origin);
      }

      const undergroundReactMatch = url.pathname.match(
        /^\/api\/underground\/([0-9a-f-]+)\/react$/i,
      );
      if (undergroundReactMatch && request.method === "POST") {
        return handleUndergroundReaction(
          request,
          env,
          origin,
          undergroundReactMatch[1],
        );
      }

      const undergroundIdMatch = url.pathname.match(
        /^\/api\/underground\/([0-9a-f-]+)$/i,
      );
      if (undergroundIdMatch && request.method === "DELETE") {
        return handleDeleteUndergroundPost(
          request,
          env,
          origin,
          undergroundIdMatch[1],
        );
      }
      if (undergroundIdMatch && request.method === "PATCH") {
        return handleEditUndergroundPost(
          request,
          env,
          origin,
          undergroundIdMatch[1],
        );
      }

      // ========================================
      // SPACE ACCESS - Premium space unlocking (authenticated)
      // ========================================
      const spaceStatusMatch = url.pathname.match(
        /^\/api\/spaces\/(underground|forum)\/status$/i,
      );
      if (spaceStatusMatch && request.method === "GET") {
        return handleGetSpaceStatus(request, env, origin, spaceStatusMatch[1]);
      }

      const spaceUnlockMatch = url.pathname.match(
        /^\/api\/spaces\/(underground|forum)\/unlock$/i,
      );
      if (spaceUnlockMatch && request.method === "POST") {
        return handleUnlockSpace(request, env, origin, spaceUnlockMatch[1]);
      }

      // ========================================
      // THE FORUM - Public Debates & Threads (authenticated)
      // ========================================
      if (url.pathname === "/api/forum/threads" && request.method === "GET") {
        return handleGetForumThreads(request, env, origin);
      }
      if (url.pathname === "/api/forum/threads" && request.method === "POST") {
        return handleCreateForumThread(request, env, origin);
      }

      const forumThreadMatch = url.pathname.match(
        /^\/api\/forum\/threads\/([0-9a-f-]+)$/i,
      );
      if (forumThreadMatch && request.method === "GET") {
        return handleGetForumThread(request, env, origin, forumThreadMatch[1]);
      }
      if (forumThreadMatch && request.method === "DELETE") {
        return handleDeleteForumThread(
          request,
          env,
          origin,
          forumThreadMatch[1],
        );
      }

      const forumReplyMatch = url.pathname.match(
        /^\/api\/forum\/threads\/([0-9a-f-]+)\/replies$/i,
      );
      if (forumReplyMatch && request.method === "POST") {
        return handleCreateForumReply(request, env, origin, forumReplyMatch[1]);
      }

      const forumReplyByIdMatch = url.pathname.match(
        /^\/api\/forum\/replies\/([0-9a-f-]+)$/i,
      );
      if (forumReplyByIdMatch && request.method === "DELETE") {
        return handleDeleteForumReply(
          request,
          env,
          origin,
          forumReplyByIdMatch[1],
        );
      }
      if (forumReplyByIdMatch && request.method === "PUT") {
        return handleEditForumReply(
          request,
          env,
          origin,
          forumReplyByIdMatch[1],
        );
      }

      const forumVoteMatch = url.pathname.match(
        /^\/api\/forum\/replies\/([0-9a-f-]+)\/vote$/i,
      );
      if (forumVoteMatch && request.method === "POST") {
        return handleForumVote(request, env, origin, forumVoteMatch[1]);
      }

      const forumInviteMatch = url.pathname.match(
        /^\/api\/forum\/threads\/([0-9a-f-]+)\/invite$/i,
      );
      if (forumInviteMatch && request.method === "POST") {
        return handleDebateInvite(request, env, origin, forumInviteMatch[1]);
      }

      const forumWrapupMatch = url.pathname.match(
        /^\/api\/forum\/threads\/([0-9a-f-]+)\/wrapup$/i,
      );
      if (forumWrapupMatch && request.method === "POST") {
        return handleDebateWrapup(request, env, origin, forumWrapupMatch[1]);
      }

      const forumWrapupAudioMatch = url.pathname.match(
        /^\/api\/forum\/threads\/([0-9a-f-]+)\/wrapup-audio$/i,
      );
      if (forumWrapupAudioMatch && request.method === "GET") {
        return handleWrapupAudio(
          request,
          env,
          origin,
          forumWrapupAudioMatch[1],
        );
      }

      // ========================================
      // ACADEMIC COLLOQUIUM - User-facing endpoints
      // ========================================
      if (url.pathname === "/api/colloquium" && request.method === "GET") {
        return handleGetColloquiums(request, env, origin);
      }
      if (
        url.pathname === "/api/colloquium/propose" &&
        request.method === "POST"
      ) {
        return handleProposeColloquium(request, env, origin, ctx);
      }
      if (
        url.pathname === "/api/colloquium/open-debate" &&
        request.method === "POST"
      ) {
        return handleProposeOpenDebate(request, env, origin, ctx);
      }
      if (
        url.pathname === "/api/colloquium/roster" &&
        request.method === "GET"
      ) {
        return handleGetRoster(request, env, origin);
      }

      const colloquiumIdMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)$/i,
      );
      if (colloquiumIdMatch && request.method === "GET") {
        return handleGetColloquium(request, env, origin, colloquiumIdMatch[1]);
      }
      if (colloquiumIdMatch && request.method === "DELETE") {
        return handleDeleteColloquium(
          request,
          env,
          origin,
          colloquiumIdMatch[1],
        );
      }

      const colloquiumAccessMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/access$/i,
      );
      if (colloquiumAccessMatch && request.method === "POST") {
        return handleColloquiumAccess(
          request,
          env,
          origin,
          colloquiumAccessMatch[1],
        );
      }

      const colloquiumParticipateMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/participate$/i,
      );
      if (colloquiumParticipateMatch && request.method === "POST") {
        return handleColloquiumParticipate(
          request,
          env,
          origin,
          colloquiumParticipateMatch[1],
        );
      }

      const colloquiumPhilosopherMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/add-philosopher$/i,
      );
      if (colloquiumPhilosopherMatch && request.method === "POST") {
        return handleAddPhilosopher(
          request,
          env,
          origin,
          colloquiumPhilosopherMatch[1],
          ctx,
        );
      }

      const colloquiumRetryMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/retry$/i,
      );
      if (colloquiumRetryMatch && request.method === "POST") {
        return handleRetryGeneration(
          request,
          env,
          origin,
          colloquiumRetryMatch[1],
          ctx,
        );
      }

      const colloquiumPollVoteMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/poll-vote$/i,
      );
      if (colloquiumPollVoteMatch && request.method === "POST") {
        return handlePollVote(request, env, origin, colloquiumPollVoteMatch[1]);
      }

      const colloquiumInviteMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/invite$/i,
      );
      if (colloquiumInviteMatch && request.method === "POST") {
        return handleColloquiumInvite(
          request,
          env,
          origin,
          colloquiumInviteMatch[1],
        );
      }

      const colloquiumVerdictMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/verdict$/i,
      );
      if (colloquiumVerdictMatch && request.method === "POST") {
        return handleColloquiumVerdict(
          request,
          env,
          origin,
          colloquiumVerdictMatch[1],
          ctx,
        );
      }

      const colloquiumVerdictAudioMatch = url.pathname.match(
        /^\/api\/colloquium\/([0-9a-f-]+)\/verdict-audio$/i,
      );
      if (colloquiumVerdictAudioMatch && request.method === "GET") {
        return handleColloquiumVerdictAudio(
          request,
          env,
          origin,
          colloquiumVerdictAudioMatch[1],
        );
      }

      // ========================================
      // DIRECT MESSAGES (DMs) - Conversation-based
      // ========================================
      if (
        url.pathname === "/api/dm/conversations" &&
        request.method === "GET"
      ) {
        return handleGetConversations(request, env, origin);
      }
      if (
        url.pathname === "/api/dm/conversations" &&
        request.method === "POST"
      ) {
        return handleCreateConversation(request, env, origin);
      }

      const dmUserProfileMatch = url.pathname.match(
        /^\/api\/dm\/user\/([0-9a-f-]+)$/i,
      );
      if (dmUserProfileMatch && request.method === "GET") {
        return handleGetUserProfile(
          request,
          env,
          origin,
          dmUserProfileMatch[1],
        );
      }

      // Conversation sub-routes (order matters: specific before generic)
      const convReactionMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/messages\/([0-9a-f-]+)\/reactions$/i,
      );
      if (convReactionMatch && request.method === "POST") {
        return handleToggleReaction(
          request,
          env,
          origin,
          convReactionMatch[1],
          convReactionMatch[2],
        );
      }

      const convShareAnalysisMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/share-analysis$/i,
      );
      if (convShareAnalysisMatch && request.method === "POST") {
        return handleShareAnalysis(
          request,
          env,
          origin,
          convShareAnalysisMatch[1],
        );
      }

      const convMsgMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/messages\/([0-9a-f-]+)$/i,
      );
      if (convMsgMatch && request.method === "DELETE") {
        return handleDeleteConversationMessage(
          request,
          env,
          origin,
          convMsgMatch[1],
          convMsgMatch[2],
        );
      }
      if (convMsgMatch && request.method === "PATCH") {
        return handleEditConversationMessage(
          request,
          env,
          origin,
          convMsgMatch[1],
          convMsgMatch[2],
        );
      }

      const convMessagesMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/messages$/i,
      );
      if (convMessagesMatch && request.method === "GET") {
        return handleGetConversationMessages(
          request,
          env,
          origin,
          convMessagesMatch[1],
        );
      }
      if (convMessagesMatch && request.method === "POST") {
        return handleSendConversationMessage(
          request,
          env,
          origin,
          convMessagesMatch[1],
        );
      }

      const convMemberMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/members\/([0-9a-f-]+)$/i,
      );
      if (convMemberMatch && request.method === "DELETE") {
        return handleRemoveMember(
          request,
          env,
          origin,
          convMemberMatch[1],
          convMemberMatch[2],
        );
      }

      const convMembersMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/members$/i,
      );
      if (convMembersMatch && request.method === "POST") {
        return handleAddMembers(request, env, origin, convMembersMatch[1]);
      }

      const convReadMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/read$/i,
      );
      if (convReadMatch && request.method === "POST") {
        return handleMarkRead(request, env, origin, convReadMatch[1]);
      }

      const convKeyMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)\/key$/i,
      );
      if (convKeyMatch && request.method === "GET") {
        return handleGetConversationKey(request, env, origin, convKeyMatch[1]);
      }
      if (convKeyMatch && request.method === "POST") {
        return handleSetConversationKeys(request, env, origin, convKeyMatch[1]);
      }

      const convMatch = url.pathname.match(
        /^\/api\/dm\/conversations\/([0-9a-f-]+)$/i,
      );
      if (convMatch && request.method === "PATCH") {
        return handleUpdateConversation(request, env, origin, convMatch[1]);
      }
      if (convMatch && request.method === "DELETE") {
        return handleLeaveConversation(request, env, origin, convMatch[1]);
      }

      // ========================================
      // PUSH NOTIFICATIONS (authenticated except vapid-key)
      // ========================================
      if (url.pathname === "/api/push/vapid-key" && request.method === "GET") {
        return handleGetVapidKey(request, env, origin);
      }
      if (url.pathname === "/api/push/subscribe" && request.method === "POST") {
        // SECURITY: Rate limit push subscribe to prevent subscription spam
        const pushSubIp = request.headers.get("cf-connecting-ip") || "unknown";
        const pushSubOk = await checkRateLimit(env, `push-sub:${pushSubIp}`, true);
        if (!pushSubOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        return handleSubscribe(request, env, origin);
      }
      if (
        url.pathname === "/api/push/unsubscribe" &&
        request.method === "POST"
      ) {
        // SECURITY: Rate limit push unsubscribe
        const pushUnsubIp = request.headers.get("cf-connecting-ip") || "unknown";
        const pushUnsubOk = await checkRateLimit(env, `push-unsub:${pushUnsubIp}`, true);
        if (!pushUnsubOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        return handleUnsubscribe(request, env, origin);
      }
      if (
        url.pathname === "/api/push/preferences" &&
        request.method === "GET"
      ) {
        return handleGetPreferences(request, env, origin);
      }
      if (
        url.pathname === "/api/push/preferences" &&
        request.method === "PATCH"
      ) {
        return handleUpdatePreferences(request, env, origin);
      }
      // REMOVED: /api/push/test route disabled per security audit
      // Handler kept in push.js for internal use only
      // Admin-only push diagnostic (curl-friendly, no cookies needed)
      const pushDiagnoseMatch = url.pathname.match(
        /^\/api\/push\/diagnose\/([0-9a-f-]+)$/i,
      );
      if (
        pushDiagnoseMatch &&
        (request.method === "GET" || request.method === "POST")
      ) {
        return handlePushDiagnose(request, env, origin, pushDiagnoseMatch[1]);
      }
      // Service worker endpoints (no auth needed - identified by endpoint URL)
      // Rate limited with general limiter (10/min) since SW needs more headroom
      if (url.pathname === "/api/push/pending" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `push-pending:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        return handleGetPending(request, env, origin);
      }
      if (url.pathname === "/api/push/ack" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `push-ack:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }
        return handleAckNotifications(request, env, origin);
      }

      // Analysis history (authenticated): user's analyzed songs
      // Supports both Authorization header and HttpOnly cookie auth
      if (
        url.pathname === "/api/analysis-history" &&
        request.method === "GET"
      ) {
        return handleAnalysisHistory(request, env, origin);
      }

      // Analysis detail (authenticated): full analysis by ID
      // Security: user must have entry in user_analysis_requests for this analysis
      const analysisDetailMatch = url.pathname.match(
        /^\/api\/analysis\/([0-9a-f-]+)$/i,
      );
      if (analysisDetailMatch && request.method === "GET") {
        const analysisId = analysisDetailMatch[1];
        return handleAnalysisDetail(request, env, origin, analysisId);
      }

      // Transactions (authenticated): credit history with linked analysis details
      // Enhanced version of /api/history with song info for consume transactions
      if (url.pathname === "/api/transactions" && request.method === "GET") {
        return handleTransactions(request, env, origin);
      }

      // Account history (authenticated): purchases/refunds + other credit events
      // Uses user's token so RLS is enforced (defense in depth)
      if (url.pathname === "/api/history" && request.method === "GET") {
        const auth = await getSupabaseForUser(request, env);
        if (!auth) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        try {
          const { client: supabase, userId, setCookieHeader } = auth;

          // Query credit_history - RLS filters to user's records
          const { data: creditHistory, error } = await supabase
            .from("credit_history")
            .select(
              "id, type, amount, created_at, status, stripe_session_id, metadata",
            )
            .order("created_at", { ascending: false })
            .limit(50);

          if (error) {
            console.error("[History] credit_history query failed:", error);
            return jsonResponse(
              { error: "Failed to load history" },
              500,
              origin,
              env,
            );
          }

          let response = jsonResponse(
            {
              success: true,
              credits: creditHistory || [],
            },
            200,
            origin,
            env,
          );
          return addRefreshedCookieToResponse(response, setCookieHeader);
        } catch (e) {
          console.error("[History] Exception:", e.message);
          return jsonResponse(
            { error: "Failed to load history" },
            500,
            origin,
            env,
          );
        }
      }

      // Check balance - uses user's token so RLS is enforced
      if (url.pathname === "/api/balance" && request.method === "GET") {
        const auth = await getSupabaseForUser(request, env);
        if (!auth) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        const { client: supabase, userId, setCookieHeader } = auth;

        // Rate limit
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `${userId}:${ip}`;
        const rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, origin, env);
        }

        // Get balance from credits table - RLS filters to user's record
        const { data: balanceData, error } = await supabase
          .from("credits")
          .select("purchased, free_remaining, total")
          .single();

        let credits = 0;
        let freeRemaining = 0;
        let total = 0;

        if (error) {
          if (error.code === "PGRST116") {
            // No record found - should have been created by handle_new_user() trigger
            console.error(
              `[Balance] CRITICAL: No credits record for user ${userId} - trigger may have failed`,
            );
          } else {
            console.error(`[Balance] Error fetching balance:`, error);
          }
        } else if (balanceData) {
          credits = balanceData.purchased || 0;
          freeRemaining = balanceData.free_remaining || 0;
          total = balanceData.total || 0;
        }

        console.log(
          `[Balance] User: ${userId}, Credits: ${credits}, Free: ${freeRemaining}, Total: ${total}`,
        );

        let response = jsonResponse(
          {
            userId: userId,
            credits: credits,
            freeRemaining: freeRemaining,
            total: total,
          },
          200,
          origin,
          env,
        );
        return addRefreshedCookieToResponse(response, setCookieHeader);
      }

      // Cleanup after timeout - called by frontend when 504/524 detected
      if (
        url.pathname === "/api/cleanup-timeout" &&
        request.method === "POST"
      ) {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        // SECURITY: Only release reservations older than 2 minutes to prevent
        // the exploit where a user calls cleanup-timeout during an in-flight
        // analysis to get a free analysis (reservation released but result still returned).
        // 2 minutes is short enough to clean up genuine timeouts but long enough
        // that in-flight analyses (typically 10-60s) are protected.
        const result = await cleanupUserStaleReservations(env, user.userId, 2);

        console.log(
          `[Cleanup] Timeout cleanup for user ${user.userId}: released ${result.releasedCount}, new total: ${result.newTotal}`,
        );

        return jsonResponse(
          {
            success: true,
            releasedCount: result.releasedCount,
            newTotal: result.newTotal,
          },
          200,
          origin,
          env,
        );
      }

      // Cancel analysis - release lock + credit reservation when user cancels
      if (
        url.pathname === "/api/cancel-analysis" &&
        request.method === "POST"
      ) {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        try {
          const body = await request.json();
          const { song, artist, model, lang } = body;

          // Reconstruct the same lock key the analysis endpoint uses
          const normalizeForKey = (str) =>
            (str || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]/g, "")
              .substring(0, 50);
          const dedupKey = `${user.userId}:${normalizeForKey(song)}:${normalizeForKey(artist)}:${model}:${lang}`;

          // Release the analysis lock so user can retry immediately
          try {
            await callRpc(env, "release_analysis_lock", {
              p_lock_key: dedupKey,
            });
            console.log(
              `[Cancel] Analysis lock released for ${user.userId}: ${song} by ${artist}`,
            );
          } catch (lockErr) {
            // Lock may already be released by the finishing backend request - that's fine
            console.log(
              `[Cancel] Lock release skipped (may already be released): ${lockErr.message}`,
            );
          }

          // Also clean up any pending credit reservations
          const result = await cleanupUserStaleReservations(
            env,
            user.userId,
            0,
          );

          console.log(
            `[Cancel] Cleanup for user ${user.userId}: released ${result.releasedCount} reservations`,
          );

          return jsonResponse(
            {
              success: true,
              releasedCount: result.releasedCount,
            },
            200,
            origin,
            env,
          );
        } catch (error) {
          console.error("[Cancel] Error during cancel-analysis:", error);
          // Return success anyway - don't block the user from retrying
          return jsonResponse({ success: true }, 200, origin, env);
        }
      }

      // Create Stripe checkout
      if (
        url.pathname === "/api/create-checkout" &&
        request.method === "POST"
      ) {
        console.log("[Stripe] /api/create-checkout called");
        try {
          const user = await getUserFromAuth(request, env);
          console.log(
            "[Stripe] Auth result:",
            user ? `User ${user.userId}` : "No user",
          );
          if (!user) {
            return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
          }

          const body = await request.json();
          console.log("[Stripe] Request body:", JSON.stringify(body));
          const priceId = await pickPriceIdFromRequest(env, body);
          const tier = String(body?.tier || "").trim();
          console.log(
            "[Stripe] Tier:",
            tier,
            "PriceId:",
            priceId ? priceId.substring(0, 15) + "..." : "null",
          );

          if (!priceId) {
            console.log("[Stripe] Invalid tier or priceId");
            return jsonResponse(
              { error: "Invalid tier or priceId" },
              400,
              origin,
              env,
            );
          }

          // Add tier and session ID placeholder to success URL
          const baseSuccessUrl =
            env.CHECKOUT_SUCCESS_URL || "https://philosify.org/payment/success";
          const successUrl = tier
            ? `${baseSuccessUrl}?credits=${tier}&session_id={CHECKOUT_SESSION_ID}`
            : `${baseSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`;
          const cancelUrl =
            env.CHECKOUT_CANCEL_URL || "https://philosify.org/payment/cancel";

          console.log("[Stripe] Calling createStripeCheckout with:", {
            userId: user.userId,
            email: user.email,
            priceId: priceId ? priceId.substring(0, 15) + "..." : "null",
            successUrl,
            cancelUrl,
          });

          const session = await createStripeCheckout(
            env,
            user.userId,
            user.email,
            priceId,
            successUrl,
            cancelUrl,
          );

          console.log(
            `[Stripe] Created checkout session ${session.id} for user ${user.userId} (tier: ${tier})`,
          );

          return jsonResponse(
            { sessionUrl: session.url, sessionId: session.id },
            200,
            origin,
            env,
          );
        } catch (error) {
          console.error("[Stripe] Checkout error:", error.message);
          console.error("[Stripe] Error stack:", error.stack);
          await captureException(
            error,
            { context: "stripe_checkout", userId: user?.userId },
            env,
          );
          return jsonResponse(
            { error: "Checkout session creation failed" },
            500,
            origin,
            env,
          );
        }
      }

      // Manual payment verification endpoint (for local dev and fallback)
      if (url.pathname === "/api/verify-payment" && request.method === "POST") {
        try {
          const user = await getUserFromAuth(request, env);
          if (!user) {
            return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
          }

          const body = await request.json();
          const { sessionId } = body;

          if (!sessionId) {
            return jsonResponse(
              { error: "Missing sessionId" },
              400,
              origin,
              env,
            );
          }

          console.log(`[Stripe] Manual verification for session: ${sessionId}`);

          // Retrieve session from Stripe (with line_items and payment_intent expanded for receipt URL)
          const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);
          const sessionRes = await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=line_items&expand[]=payment_intent.latest_charge`,
            {
              headers: {
                Authorization: `Bearer ${stripeKey}`,
              },
            },
          );

          if (!sessionRes.ok) {
            throw new Error(`Failed to retrieve session: ${sessionRes.status}`);
          }

          const session = await sessionRes.json();

          // Extract receipt URL from payment_intent's latest charge
          const receiptUrl =
            session.payment_intent?.latest_charge?.receipt_url || null;
          if (receiptUrl) {
            console.log(`[Stripe] Receipt URL: ${receiptUrl}`);
          }

          // Verify session belongs to authenticated user
          const sessionUserId =
            session.client_reference_id || session.metadata?.user_id;
          if (sessionUserId !== user.userId) {
            return jsonResponse(
              { error: "Session does not belong to user" },
              403,
              origin,
              env,
            );
          }

          // Only process if payment was successful
          // Check BOTH status and payment_status to prevent processing cancelled/expired sessions
          if (
            session.status !== "complete" ||
            session.payment_status !== "paid"
          ) {
            return jsonResponse(
              {
                error: "Payment not completed",
                status: session.status,
                payment_status: session.payment_status,
              },
              400,
              origin,
              env,
            );
          }

          // Extract tier from priceId (SECURITY: unknown priceIds grant 0 credits)
          const priceId = session.line_items?.data?.[0]?.price?.id;
          let tier = null;

          if (priceId) {
            const priceId10 = await getSecret(env.STRIPE_PRICE_ID_10);
            const priceId20 = await getSecret(env.STRIPE_PRICE_ID_20);
            const priceId50 = await getSecret(env.STRIPE_PRICE_ID_50);

            if (priceId === priceId10) tier = "10";
            else if (priceId === priceId20) tier = "20";
            else if (priceId === priceId50) tier = "50";
            else {
              console.error(
                `[Stripe] SECURITY: Unknown priceId in verify-payment: ${priceId}`,
              );
            }
          }

          const creditMap = { 10: 10, 20: 20, 50: 50 };
          const credits = tier ? creditMap[tier] || 0 : 0;

          if (credits === 0) {
            console.error(
              `[Stripe] ALERT: Zero credits resolved for session ${sessionId}, priceId=${priceId}, tier=${tier}`,
            );
          }

          // Credit account using idempotent RPC (same as webhook)
          const supabaseUrl = await getSecret(env.SUPABASE_URL);
          const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

          const rpcUrl = `${supabaseUrl}/rest/v1/rpc/process_stripe_payment`;
          const rpcRes = await fetch(rpcUrl, {
            method: "POST",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              p_stripe_session_id: session.id,
              p_stripe_price_id: priceId,
              p_user_id: user.userId,
              p_credits: credits,
              p_event_type: "manual_verification",
              p_metadata: {
                tier: tier,
                verified_by: "client",
                stripe_customer_id: session.customer || null,
                receipt_url: receiptUrl,
              },
            }),
          });

          if (!rpcRes.ok) {
            const error = await rpcRes.text();
            throw new Error(
              `Failed to credit account: ${rpcRes.status} - ${error}`,
            );
          }

          const result = await rpcRes.json();
          const paymentResult = result?.[0];

          if (paymentResult?.already_processed) {
            console.log(`[Stripe] Session ${session.id} already processed`);
            return jsonResponse(
              {
                success: true,
                alreadyProcessed: true,
                credits: credits,
                newBalance: paymentResult.new_balance,
              },
              200,
              origin,
              env,
            );
          } else if (paymentResult?.success) {
            console.log(
              `[Stripe] ✓ Credited ${credits} credits to user ${user.userId}, new balance: ${paymentResult.new_balance}`,
            );

            // Send payment receipt email to user (best effort, don't block response)
            sendPaymentReceiptEmail(env, {
              userEmail: user.email,
              credits: credits,
              newBalance: paymentResult.new_balance,
              sessionId: session.id,
              receiptUrl: receiptUrl,
            }).catch((err) =>
              console.error("[Stripe] Receipt email failed:", err.message),
            );

            return jsonResponse(
              {
                success: true,
                alreadyProcessed: false,
                credits: credits,
                newBalance: paymentResult.new_balance,
              },
              200,
              origin,
              env,
            );
          } else {
            throw new Error(
              paymentResult?.error_message || "Failed to process payment",
            );
          }
        } catch (error) {
          console.error("[Stripe] Manual verification error:", error);
          return jsonResponse(
            { error: "Payment verification failed" },
            500,
            origin,
            env,
          );
        }
      }

      // Stripe webhook
      if (url.pathname === "/api/stripe-webhook" && request.method === "POST") {
        try {
          const event = await verifyStripeWebhook(env, request);

          console.log(
            `[Stripe] Webhook event: ${event.type} (ID: ${event.id})`,
          );

          if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            // SECURITY: Verify payment is actually completed (not pending for async payment methods)
            if (session.payment_status !== "paid") {
              console.warn(`[Stripe] Payment not completed (status: ${session.payment_status}), skipping credit grant`);
              return jsonResponse({ received: true, skipped: true }, 200, origin, env);
            }

            const userId =
              session.client_reference_id || session.metadata?.user_id;

            if (!userId) {
              console.error("[Stripe] No userId in webhook");
              return jsonResponse({ error: "No userId" }, 400, origin, env);
            }

            // Fetch receipt URL from payment_intent
            let receiptUrl = null;
            if (session.payment_intent) {
              const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);
              const piRes = await fetch(
                `https://api.stripe.com/v1/payment_intents/${session.payment_intent}?expand[]=latest_charge`,
                { headers: { Authorization: `Bearer ${stripeKey}` } },
              );
              if (piRes.ok) {
                const pi = await piRes.json();
                receiptUrl = pi.latest_charge?.receipt_url || null;
                if (receiptUrl)
                  console.log(`[Stripe] Receipt URL: ${receiptUrl}`);
              }
            }

            // Extract priceId.
            // NOTE: checkout.session.completed payload usually does NOT include expanded line_items.
            // We first try metadata (set during checkout creation), then fallback to fetching the session expanded.
            let priceId =
              session.metadata?.price_id ||
              session.line_items?.data?.[0]?.price?.id ||
              null;
            if (!priceId) {
              try {
                const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);
                const sRes = await fetch(
                  `https://api.stripe.com/v1/checkout/sessions/${session.id}?expand[]=line_items`,
                  { headers: { Authorization: `Bearer ${stripeKey}` } },
                );
                if (sRes.ok) {
                  const expanded = await sRes.json();
                  priceId = expanded?.line_items?.data?.[0]?.price?.id || null;
                }
              } catch (e) {
                console.error(
                  "[Stripe] Failed to fetch expanded session for priceId:",
                  e?.message || e,
                );
              }
            }

            if (!priceId) {
              // This is a configuration/data issue; return 500 so Stripe retries and we can recover once fixed.
              throw new Error(
                "Missing priceId for checkout session (no metadata.price_id and no line_items)",
              );
            }

            // Extract tier from priceId (SECURITY: unknown priceIds grant 0 credits)
            let tier = null;

            if (priceId) {
              const priceId10 = await getSecret(env.STRIPE_PRICE_ID_10);
              const priceId20 = await getSecret(env.STRIPE_PRICE_ID_20);
              const priceId50 = await getSecret(env.STRIPE_PRICE_ID_50);

              if (priceId === priceId10) tier = "10";
              else if (priceId === priceId20) tier = "20";
              else if (priceId === priceId50) tier = "50";
              else {
                console.error(
                  `[Stripe] SECURITY: Unknown priceId in webhook: ${priceId}`,
                );
              }
            }

            const creditMap = { 10: 10, 20: 20, 50: 50 };
            const credits = tier ? creditMap[tier] || 0 : 0;

            if (credits === 0) {
              console.error(
                `[Stripe] ALERT: Zero credits resolved for webhook, priceId=${priceId}, tier=${tier}`,
              );
            }

            // Credit account using idempotent RPC
            const supabaseUrl = await getSecret(env.SUPABASE_URL);
            const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

            const rpcUrl = `${supabaseUrl}/rest/v1/rpc/process_stripe_payment`;
            const rpcRes = await fetch(rpcUrl, {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                p_stripe_session_id: session.id,
                p_stripe_price_id: priceId,
                p_user_id: userId,
                p_credits: credits,
                p_event_type: event.type,
                p_metadata: {
                  tier: tier,
                  event_id: event.id,
                  stripe_customer_id: session.customer || null,
                  receipt_url: receiptUrl,
                },
              }),
            });

            if (!rpcRes.ok) {
              const error = await rpcRes.text();
              throw new Error(
                `Failed to credit account: ${rpcRes.status} - ${error}`,
              );
            }

            const result = await rpcRes.json();

            // Result is an array with one row
            const paymentResult = result?.[0];

            if (paymentResult?.already_processed) {
              console.log(
                `[Stripe] ⚠️  Session ${session.id} already processed (idempotency check)`,
              );
              // Don't send receipt - already sent by manual verification or previous webhook
            } else if (paymentResult?.success) {
              console.log(
                `[Stripe] ✓ Credited ${credits} credits to user ${userId}, new balance: ${paymentResult.new_balance}`,
              );

              // Send payment receipt email (best effort, use waitUntil to not block response)
              const customerEmail =
                session.customer_email || session.customer_details?.email;
              if (customerEmail) {
                ctx.waitUntil(
                  sendPaymentReceiptEmail(env, {
                    userEmail: customerEmail,
                    credits: credits,
                    newBalance: paymentResult.new_balance,
                    sessionId: session.id,
                    receiptUrl: receiptUrl,
                  }).catch((err) =>
                    console.error(
                      "[Stripe] Webhook receipt email failed:",
                      err.message,
                    ),
                  ),
                );
              }
            } else {
              throw new Error(
                paymentResult?.error_message || "Failed to process payment",
              );
            }
          }

          return jsonResponse({ received: true }, 200, origin, env);
        } catch (error) {
          const msg = error?.message || String(error);
          console.error("[Stripe] Webhook error:", msg);
          // Invalid signature -> 400 (do not retry). Everything else -> 500 (retry).
          const isSigError =
            msg.includes("Stripe-Signature") ||
            msg.includes("Invalid Stripe signature") ||
            msg.includes("timestamp outside tolerance") ||
            msg.includes("Invalid Stripe-Signature");

          return jsonResponse(
            { error: isSigError ? msg : "Webhook processing failed" },
            isSigError ? 400 : 500,
            origin,
            env,
          );
        }
      }

      // Supabase webhook: new user signup notification
      if (
        url.pathname === "/api/supabase-webhook" &&
        request.method === "POST"
      ) {
        try {
          // Verify webhook secret
          const webhookSecret = request.headers.get(
            "x-supabase-webhook-secret",
          );
          const expectedSecret = await getSecret(env.ADMIN_SECRET);

          if (
            !webhookSecret ||
            !expectedSecret ||
            !safeEq(webhookSecret, expectedSecret)
          ) {
            console.error("[Supabase Webhook] Invalid or missing secret");
            return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
          }

          const payload = await request.json();
          const eventType = payload.type;
          const record = payload.record;

          console.log(`[Supabase Webhook] Event: ${eventType}`);

          if (eventType === "INSERT" && record?.email) {
            // New user signed up - send notification
            ctx.waitUntil(sendNewSubscriberEmail(env, record.email));
            console.log(
              `[Supabase Webhook] ✅ New subscriber: ${record.email}`,
            );
          }

          return jsonResponse({ received: true }, 200, origin, env);
        } catch (error) {
          console.error("[Supabase Webhook] Error:", error);
          return jsonResponse(
            { error: "Webhook processing failed" },
            400,
            origin,
            env,
          );
        }
      }

      // ========================================
      // SHARING ENDPOINTS
      // ========================================

      // Create share token
      if (url.pathname === "/api/share" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        try {
          const body = await request.json();
          const { analysisId } = body;

          if (!analysisId) {
            return jsonResponse(
              { error: "Missing analysisId" },
              400,
              origin,
              env,
            );
          }

          const result = await createShareToken(
            env,
            analysisId,
            user.userId,
            origin,
          );

          if (!result.success) {
            return jsonResponse({ error: result.error }, 400, origin, env);
          }

          return jsonResponse(
            {
              success: true,
              slug: result.slug,
              url: result.url,
            },
            200,
            origin,
            env,
          );
        } catch (error) {
          console.error("[Share] Error creating share token:", error);
          return jsonResponse(
            { error: "Failed to create share link" },
            500,
            origin,
            env,
          );
        }
      }

      // Get shared analysis (simple direct sharing with Open Graph tags)
      if (url.pathname.startsWith("/shared/") && request.method === "GET") {
        const analysisId = url.pathname.split("/shared/")[1];

        if (
          !analysisId ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            analysisId,
          )
        ) {
          return jsonResponse(
            { error: "Invalid analysis ID" },
            400,
            origin,
            env,
          );
        }

        try {
          // Fetch analysis directly from database
          const supabaseUrl = await getSecret(env.SUPABASE_URL);
          const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

          const analysisUrl = `${supabaseUrl}/rest/v1/analyses?id=eq.${analysisId}&select=*,songs(title,artist,spotify_id)`;
          const analysisResponse = await fetch(analysisUrl, {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          });

          if (!analysisResponse.ok) {
            console.error("[Share] Failed to fetch analysis");
            return jsonResponse(
              { error: "Analysis not found" },
              404,
              origin,
              env,
            );
          }

          const analyses = await analysisResponse.json();

          if (!analyses || analyses.length === 0) {
            return jsonResponse(
              { error: "Analysis not found" },
              404,
              origin,
              env,
            );
          }

          // Prepare analysis data
          const analysis = analyses[0];
          const songData = analysis.songs;
          const enrichedAnalysis = {
            ...analysis,
            song: songData?.title,
            song_name: songData?.title,
            title: songData?.title,
            artist: songData?.artist,
            spotify_id: songData?.spotify_id || analysis.spotify_id,
          };

          // Check if request is from social media bot (WhatsApp, Telegram, etc)
          const userAgent = request.headers.get("user-agent") || "";
          const isSocialBot =
            /WhatsApp|Telegram|facebook|Twitter|LinkedIn|Slack|Discordbot/i.test(
              userAgent,
            );

          // If social bot, return HTML with Open Graph meta tags for rich preview
          if (isSocialBot) {
            const shareUrl = `https://philosify.org/shared/${analysisId}`;
            const logoUrl = "https://philosify.org/logo.png";
            // Escape user-supplied values to prevent HTML/XSS injection
            const songEsc = escapeHtml(enrichedAnalysis.song);
            const artistEsc = escapeHtml(enrichedAnalysis.artist);
            const classificationEsc = escapeHtml(
              enrichedAnalysis.classification,
            );
            const title = `${songEsc} - ${artistEsc}`;
            const description = `Philosophical analysis: ${classificationEsc || "View on Philosify"}`;

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Philosify</title>

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${logoUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Philosify">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${shareUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${logoUrl}">

    <script>
      // Redirect to main app
      setTimeout(function() {
        window.location.href = 'https://philosify.org?analysis=${analysisId}';
      }, 100);
    </script>
</head>
<body>
    <h1>${songEsc}</h1>
    <h2>${artistEsc}</h2>
    <p>Redirecting to Philosify...</p>
</body>
</html>`;

            return new Response(html, {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
                "Strict-Transport-Security":
                  "max-age=31536000; includeSubDomains; preload",
                ...corsHeaders,
              },
            });
          }

          // For normal requests: require authentication
          let shareUser = null;
          try {
            shareUser = await getUserFromAuth(request, env);
          } catch {
            // Not authenticated
          }

          if (!shareUser?.userId) {
            // Return 401 with a teaser (song + artist only, no analysis content)
            return jsonResponse(
              {
                error: "Authentication required",
                requiresAuth: true,
                teaser: {
                  song: enrichedAnalysis.song || enrichedAnalysis.title,
                  artist: enrichedAnalysis.artist,
                },
              },
              401,
              origin,
              env,
            );
          }

          return jsonResponse(
            { success: true, analysis: enrichedAnalysis },
            200,
            origin,
            env,
          );
        } catch (error) {
          console.error("[Share] Error fetching shared analysis:", error);
          return jsonResponse(
            { error: "Failed to fetch shared analysis" },
            500,
            origin,
            env,
          );
        }
      }

      // Legacy endpoint for old share token system (deprecated)
      if (url.pathname.startsWith("/api/shared/") && request.method === "GET") {
        const slug = url.pathname.split("/api/shared/")[1];

        if (!slug) {
          return jsonResponse({ error: "Missing slug" }, 400, origin, env);
        }

        // Compatibility: allow UUIDs here (some frontend builds call /api/shared/:id even for /shared/:id routes)
        // If slug is actually an analysis UUID, return the analysis directly (no share token / referral tracking).
        const isUuid =
          typeof slug === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            slug,
          );

        if (isUuid) {
          try {
            const supabaseUrl = await getSecret(env.SUPABASE_URL);
            const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

            const analysisUrl = `${supabaseUrl}/rest/v1/analyses?id=eq.${slug}&select=*,songs(title,artist,spotify_id)`;
            const analysisResponse = await fetch(analysisUrl, {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            });

            if (!analysisResponse.ok) {
              console.error(
                "[Share] Failed to fetch analysis (uuid via /api/shared)",
              );
              return jsonResponse(
                { error: "Analysis not found" },
                404,
                origin,
                env,
              );
            }

            const analyses = await analysisResponse.json();
            if (!analyses || analyses.length === 0) {
              return jsonResponse(
                { error: "Analysis not found" },
                404,
                origin,
                env,
              );
            }

            const analysis = analyses[0];
            const songData = analysis.songs;
            const enrichedAnalysis = {
              ...analysis,
              song: songData?.title,
              song_name: songData?.title,
              title: songData?.title,
              artist: songData?.artist,
              spotify_id: songData?.spotify_id || analysis.spotify_id,
            };

            // Require authentication for full analysis content
            let shareUser2 = null;
            try {
              shareUser2 = await getUserFromAuth(request, env);
            } catch {
              // Not authenticated
            }

            if (!shareUser2?.userId) {
              return jsonResponse(
                {
                  error: "Authentication required",
                  requiresAuth: true,
                  teaser: {
                    song: enrichedAnalysis.song || enrichedAnalysis.title,
                    artist: enrichedAnalysis.artist,
                  },
                },
                401,
                origin,
                env,
              );
            }

            return jsonResponse(
              { success: true, analysis: enrichedAnalysis },
              200,
              origin,
              env,
            );
          } catch (error) {
            console.error(
              "[Share] Error fetching shared analysis by uuid (via /api/shared):",
              error,
            );
            return jsonResponse(
              { error: "Failed to fetch shared analysis" },
              500,
              origin,
              env,
            );
          }
        }

        // Optional: get viewer user ID if authenticated
        let viewerUserId = null;
        try {
          const user = await getUserFromAuth(request, env);
          viewerUserId = user?.userId || null;
        } catch {
          // Not authenticated, continue as anonymous
        }

        try {
          const result = await getSharedAnalysis(env, slug, viewerUserId);

          if (!result.success) {
            return jsonResponse(
              {
                error: result.error,
                expired: result.expired,
                maxViewsReached: result.maxViewsReached,
              },
              404,
              origin,
              env,
            );
          }

          // Check if request is from WhatsApp, Telegram, or other social media bots
          const userAgent = request.headers.get("user-agent") || "";
          const isSocialBot =
            /WhatsApp|Telegram|facebook|Twitter|LinkedIn|Slack|Discordbot/i.test(
              userAgent,
            );

          // If social bot, return HTML with Open Graph meta tags for rich preview
          if (isSocialBot) {
            const analysis = result.analysis;
            const shareUrl = `https://philosify.org/api/shared/${slug}`;
            const logoUrl = "https://philosify.org/logo.png";
            // Escape user-supplied values to prevent HTML/XSS injection
            const songEsc = escapeHtml(analysis.song);
            const artistEsc = escapeHtml(analysis.artist);
            const classificationEsc = escapeHtml(analysis.classification);
            const title = `${songEsc} - ${artistEsc}`;
            const description = `Philosophical analysis: ${classificationEsc || "View on Philosify"}`;

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Philosify</title>

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${logoUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Philosify">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${shareUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${logoUrl}">

    <script>
      // Redirect to main app after meta tags are scraped
      setTimeout(function() {
        window.location.href = 'https://philosify.org?share=${slug}';
      }, 100);
    </script>
</head>
<body>
    <h1>${songEsc}</h1>
    <h2>${artistEsc}</h2>
    <p>Redirecting to Philosify...</p>
</body>
</html>`;

            return new Response(html, {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
                "Strict-Transport-Security":
                  "max-age=31536000; includeSubDomains; preload",
                ...corsHeaders,
              },
            });
          }

          // For normal requests (from the app), return JSON
          return jsonResponse(
            {
              success: true,
              analysis: result.analysis,
            },
            200,
            origin,
            env,
          );
        } catch (error) {
          console.error("[Share] Error getting shared analysis:", error);
          return jsonResponse(
            { error: "Failed to get shared analysis" },
            500,
            origin,
            env,
          );
        }
      }

      // Track referral (called after new user signs up)
      if (url.pathname === "/api/track-referral" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }

        try {
          const body = await request.json();
          const { slug } = body;

          if (!slug) {
            return jsonResponse({ error: "Missing slug" }, 400, origin, env);
          }

          const result = await trackReferral(env, slug, user.userId, 2);

          if (!result.success) {
            return jsonResponse({ error: result.error }, 400, origin, env);
          }

          return jsonResponse(
            {
              success: true,
              alreadyReferred: result.alreadyReferred,
              referrerUserId: result.referrerUserId,
            },
            200,
            origin,
            env,
          );
        } catch (error) {
          console.error("[Share] Error tracking referral:", error);
          return jsonResponse(
            { error: "Failed to track referral" },
            500,
            origin,
            env,
          );
        }
      }

      // ========================================
      // ANALYSIS ENDPOINT
      // ========================================

      // Philosophical analysis
      if (url.pathname === "/api/analyze" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse(
            { error: "Unauthorized", message: "Authentication required" },
            401,
            origin,
            env,
          );
        }

        // Daily AI spend cap
        const capOk = await checkDailyAICap(env, user.userId, "analyze");
        if (!capOk) {
          return jsonResponse(
            { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
            429, origin, env,
          );
        }

        // Parse request body early
        let requestBody;
        try {
          const requestText = await request.text();
          requestBody = JSON.parse(requestText);
          // Recreate request with body
          request = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: requestText,
          });
        } catch (error) {
          return jsonResponse({ error: "Invalid JSON" }, 400, origin, env);
        }

        const {
          song = "Song",
          artist = "Artist",
          model = "claude",
          lang = "en",
          spotify_id = null,
          // SECURITY: is_free from client is IGNORED - validated server-side only
        } = requestBody;

        // Rate limit - FAIL CLOSED for expensive AI calls
        // Uses stricter ANALYZE_RATE_LIMITER (3 req/min) instead of general limiter (10 req/min)
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `analyze:${user.userId}:${ip}`;
        let rateLimitOk = true;
        if (env.ANALYZE_RATE_LIMITER) {
          try {
            const { success } = await env.ANALYZE_RATE_LIMITER.limit({
              key: rateLimitKey,
            });
            rateLimitOk = success;
            if (!success) {
              console.log(
                "[RateLimit] Analyze rate limit exceeded for:",
                rateLimitKey,
              );
            }
          } catch (error) {
            console.error("[RateLimit] ANALYZE_RATE_LIMITER error:", error);
            rateLimitOk = false; // Fail closed for expensive operations
          }
        } else {
          // Fallback to general rate limiter if analyze-specific one not configured
          rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        }
        if (!rateLimitOk) {
          return jsonResponse(
            {
              error: "Too many requests",
              message: "Rate limit exceeded. Please wait.",
            },
            429,
            origin,
            env,
          );
        }

        // Cleanup ALL pending reservations for THIS user (handles cancel-and-retry)
        // Using 0 minutes ensures cancelled request reservations are freed immediately
        // so the user isn't double-charged on retry
        await cleanupUserStaleReservations(env, user.userId, 0);

        // SECURITY: Atomic deduplication lock to prevent race conditions
        // Uses Supabase INSERT ON CONFLICT for true atomicity (KV is eventually consistent)
        const normalizeForKey = (str) =>
          (str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "")
            .substring(0, 50);
        const dedupKey = `${user.userId}:${normalizeForKey(song)}:${normalizeForKey(artist)}:${model}:${lang}`;

        // Force-release any stale lock left by a cancelled request
        // Safe: UI disables Analyze button while isAnalyzing is true
        try {
          await callRpc(env, "release_analysis_lock", {
            p_lock_key: dedupKey,
          });
        } catch (e) {
          // No-op if no lock exists
        }

        // Atomic lock acquisition - only one concurrent request wins
        const lockAcquired = await callRpc(env, "acquire_analysis_lock", {
          p_lock_key: dedupKey,
          p_user_id: user.userId,
        });

        if (!lockAcquired) {
          console.log(
            `[Security] Duplicate request blocked for ${user.userId}: ${song} by ${artist} (${model}/${lang})`,
          );
          return jsonResponse(
            {
              error: "Analysis in progress",
              message:
                "This song is already being analyzed. Please wait for the current analysis to complete.",
            },
            409,
            origin,
            env,
          );
        }

        console.log(`[Security] Analysis lock acquired: ${dedupKey}`);

        // SECURITY: Validate FREE status SERVER-SIDE only
        // Never trust client-provided is_free flag!
        const isFree = await isInFreeTicker(env, song, artist, spotify_id);

        // For FREE ticker songs, skip credit reservation entirely
        let reservation = null;
        if (!isFree) {
          // RESERVE credit (minimal lock - song/model info goes to credit_history on confirm/release)
          reservation = await reserveCredit(env, user.userId);

          if (!reservation.success) {
            return jsonResponse(
              {
                error: "Insufficient credits",
                message: "You have no credits remaining. Please purchase more.",
                credits: 0,
                freeRemaining: reservation.remaining,
              },
              402,
              origin,
              env,
            );
          }

          console.log(
            `[Credits] Reserved 1 ${reservation.type} credit for ${user.userId}. Reservation: ${reservation.reservationId}`,
          );
        } else {
          console.log(
            `[Credits] FREE analysis requested for ${user.userId} - no credit reservation`,
          );
        }

        // Perform analysis (wrapped in try-finally to ensure lock cleanup)
        try {
          const result = await handleAnalyze(request, env, origin, ctx);

          // Check if analysis succeeded
          if (result.ok) {
            const resultData = await result.json();

            // For FREE analyses, skip all credit handling
            if (isFree) {
              console.log(
                "[Credits] FREE analysis completed - no credit consumed",
              );
              resultData.balance = { free: true };
              return jsonResponse(resultData, 200, origin, env);
            }

            // Check if result indicates timeout
            if (resultData.timeout) {
              // RELEASE reservation - timeout means analysis didn't complete, refund credit
              const releaseResult = await releaseReservation(
                env,
                reservation.reservationId,
                "timeout",
              );
              console.log(
                "[Credits] Reservation released - timeout, credit refunded",
              );
              return jsonResponse(
                {
                  error: "Analysis timeout",
                  message:
                    "Analysis took too long. Your credit has been refunded. Please try again.",
                  timeout: true,
                  balance: releaseResult?.success
                    ? {
                        total: releaseResult.newTotal,
                        credits: releaseResult.credits,
                        freeRemaining: releaseResult.freeRemaining,
                      }
                    : {
                        total: reservation.remaining,
                        credits: reservation.credits,
                        freeRemaining: 0,
                      },
                },
                504,
                origin,
                env,
              );
            }

            // Track balance result from confirm/release operations
            let balanceResult = null;
            let charged = false;

            if (resultData.cached && resultData.isReview) {
              // Re-viewing cached analysis (same user) - no charge
              balanceResult = await releaseReservation(
                env,
                reservation.reservationId,
                "cached_review",
                resultData.id,
              );
              console.log(
                "[Credits] Reservation released - re-view of cached analysis, no charge",
              );
              charged = false;
            } else if (resultData.cached && !resultData.isReview) {
              // First view of cached analysis (new user or first time) - charge credit
              balanceResult = await confirmReservation(
                env,
                reservation.reservationId,
                resultData.id,
              );
              console.log(
                "[Credits] Reservation confirmed - first view of cached analysis, credit consumed",
              );
              charged = true;
            } else if (resultData.saveFailed) {
              // RELEASE reservation - don't charge if save failed (can't cache for next time)
              balanceResult = await releaseReservation(
                env,
                reservation.reservationId,
                "failed",
              );
              console.log(
                "[Credits] Reservation released - save failed, no charge",
              );
              charged = false;
            } else {
              // CONFIRM reservation (new analysis succeeded - write to credit_history with analysis_id)
              balanceResult = await confirmReservation(
                env,
                reservation.reservationId,
                resultData.id,
              );
              console.log(
                "[Credits] Reservation confirmed - credit consumed, logged to history",
              );
              charged = true;

              // Admin notification (best-effort): email bob@philosify.org when a fresh analysis is generated
              ctx?.waitUntil?.(
                sendNewAnalysisRequestEmail(env, {
                  userEmail: user.email,
                  userId: user.userId,
                  ip,
                  song,
                  artist,
                  model,
                  language: lang,
                  analysisId: resultData.id,
                }),
              );
            }

            // Use balance from confirm/release result if successful, otherwise fall back to reservation values
            resultData.balance = {
              total: balanceResult?.success
                ? balanceResult.newTotal
                : reservation.remaining,
              credits: balanceResult?.success
                ? balanceResult.credits
                : reservation.credits,
              freeRemaining: balanceResult?.success
                ? balanceResult.freeRemaining
                : 0,
              charged: charged,
            };
            return jsonResponse(resultData, 200, origin, env);
          }

          console.log("[Analysis] Result not OK, status:", result.status);

          // RELEASE reservation (analysis failed - return credit) - only if not free
          if (reservation) {
            try {
              console.log(
                "[Analysis] Releasing reservation due to failed analysis",
              );
              await releaseReservation(
                env,
                reservation.reservationId,
                "failed",
              );
              console.log("[Credits] Reservation released - credit returned");
            } catch (releaseErr) {
              console.error(
                "[Credits] Release failed in error path:",
                releaseErr.message,
              );
            }
          }

          return result;
        } catch (error) {
          // RELEASE reservation on error - only if not free
          console.error("[Analysis] Error, releasing reservation:", error);

          // Check if it's a timeout error
          const errorMessage = error.message || "";
          const isTimeout =
            errorMessage.includes("timeout") ||
            errorMessage.includes("Timeout") ||
            errorMessage.includes("took too long") ||
            error.name === "AbortError";

          // Use 'timeout' reason for timeout errors, 'failed' for others
          let releaseResult = null;
          if (reservation) {
            try {
              const releaseReason = isTimeout ? "timeout" : "failed";
              releaseResult = await releaseReservation(
                env,
                reservation.reservationId,
                releaseReason,
              );
              console.log(
                `[Credits] Reservation released - ${releaseReason}, credit refunded`,
              );
            } catch (releaseErr) {
              console.error(
                "[Credits] Release failed in catch path:",
                releaseErr.message,
              );
            }
          }

          // Check if it's a content filtering error
          const isContentFiltered =
            errorMessage.includes("content filtering") ||
            errorMessage.includes("Content blocked") ||
            errorMessage.includes("All AI models failed");

          return jsonResponse(
            {
              error: isTimeout
                ? "Analysis timeout"
                : isContentFiltered
                  ? "Content blocked"
                  : "Analysis failed",
              message: isTimeout
                ? "Analysis took too long. Your credit has been refunded. Please try again."
                : isContentFiltered
                  ? "This song's content was blocked by AI safety filters. Please try a different song or contact support if this persists."
                  : "An error occurred during analysis. Your credit has been refunded.",
              timeout: isTimeout,
              balance: releaseResult?.success
                ? {
                    total: releaseResult.newTotal,
                    credits: releaseResult.credits,
                    freeRemaining: releaseResult.freeRemaining,
                  }
                : { free: true },
            },
            isTimeout ? 504 : 500,
            origin,
            env,
          );
        } finally {
          // SECURITY: Always release the deduplication lock, regardless of outcome
          try {
            await callRpc(env, "release_analysis_lock", {
              p_lock_key: dedupKey,
            });
            console.log(`[Security] Analysis lock released: ${dedupKey}`);
          } catch (lockError) {
            console.error(
              `[Security] Failed to release analysis lock:`,
              lockError,
            );
          }
        }
      }

      // ========================================
      // BOOK ANALYSIS ENDPOINT
      // ========================================

      if (url.pathname === "/api/book-analyze" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse(
            { error: "Unauthorized", message: "Authentication required" },
            401, origin, env,
          );
        }

        // Daily AI spend cap
        const capOk = await checkDailyAICap(env, user.userId, "book-analyze");
        if (!capOk) {
          return jsonResponse(
            { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
            429, origin, env,
          );
        }

        // Parse request body early
        let requestBody;
        try {
          const requestText = await request.text();
          requestBody = JSON.parse(requestText);
          request = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: requestText,
          });
        } catch (error) {
          return jsonResponse({ error: "Invalid JSON" }, 400, origin, env);
        }

        const {
          title = "Book",
          author = "Author",
          model = "claude",
          lang = "en",
          google_books_id = null,
        } = requestBody;

        // Rate limit (uses same ANALYZE_RATE_LIMITER — expensive AI calls)
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `book-analyze:${user.userId}:${ip}`;
        let rateLimitOk = true;
        if (env.ANALYZE_RATE_LIMITER) {
          try {
            const { success } = await env.ANALYZE_RATE_LIMITER.limit({ key: rateLimitKey });
            rateLimitOk = success;
            if (!success) console.log("[RateLimit] Book analyze rate limit exceeded for:", rateLimitKey);
          } catch (error) {
            console.error("[RateLimit] ANALYZE_RATE_LIMITER error:", error);
            rateLimitOk = false;
          }
        } else {
          rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        }
        if (!rateLimitOk) {
          return jsonResponse(
            { error: "Too many requests", message: "Rate limit exceeded. Please wait." },
            429, origin, env,
          );
        }

        // Cleanup pending reservations
        await cleanupUserStaleReservations(env, user.userId, 0);

        // Atomic deduplication lock
        const normalizeForKey = (str) =>
          (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").substring(0, 50);
        const dedupKey = `book:${user.userId}:${normalizeForKey(title)}:${normalizeForKey(author)}:${model}:${lang}`;

        try {
          await callRpc(env, "release_analysis_lock", { p_lock_key: dedupKey });
        } catch (e) {
          // No-op if no lock exists
        }

        const lockAcquired = await callRpc(env, "acquire_analysis_lock", {
          p_lock_key: dedupKey,
          p_user_id: user.userId,
        });

        if (!lockAcquired) {
          return jsonResponse(
            { error: "Analysis in progress", message: "This book is already being analyzed. Please wait." },
            409, origin, env,
          );
        }

        // Reserve credit (books are never free — no free ticker for books)
        let reservation = await reserveCredit(env, user.userId);

        if (!reservation.success) {
          return jsonResponse(
            { error: "Insufficient credits", message: "You have no credits remaining. Please purchase more.", credits: 0, freeRemaining: reservation.remaining },
            402, origin, env,
          );
        }

        console.log(`[Credits] Reserved 1 ${reservation.type} credit for book analysis. Reservation: ${reservation.reservationId}`);

        // Perform analysis
        try {
          const result = await handleBookAnalyze(request, env, origin, ctx);

          if (result.ok) {
            const resultData = await result.json();

            if (resultData.timeout) {
              const releaseResult = await releaseReservation(env, reservation.reservationId, "timeout");
              return jsonResponse(
                { error: "Analysis timeout", message: "Analysis took too long. Your credit has been refunded.", timeout: true, balance: releaseResult?.success ? { total: releaseResult.newTotal, credits: releaseResult.credits, freeRemaining: releaseResult.freeRemaining } : { total: reservation.remaining } },
                504, origin, env,
              );
            }

            let balanceResult = null;
            let charged = false;

            if (resultData.cached && resultData.isReview) {
              balanceResult = await releaseReservation(env, reservation.reservationId, "cached_review", resultData.id);
              charged = false;
            } else if (resultData.cached && !resultData.isReview) {
              balanceResult = await confirmReservation(env, reservation.reservationId, resultData.id);
              charged = true;
            } else if (resultData.saveFailed) {
              balanceResult = await releaseReservation(env, reservation.reservationId, "failed");
              charged = false;
            } else {
              balanceResult = await confirmReservation(env, reservation.reservationId, resultData.id);
              charged = true;
            }

            resultData.balance = {
              total: balanceResult?.success ? balanceResult.newTotal : reservation.remaining,
              credits: balanceResult?.success ? balanceResult.credits : reservation.credits,
              freeRemaining: balanceResult?.success ? balanceResult.freeRemaining : 0,
              charged: charged,
            };
            return jsonResponse(resultData, 200, origin, env);
          }

          // Analysis failed — release credit
          if (reservation) {
            try {
              await releaseReservation(env, reservation.reservationId, "failed");
            } catch (releaseErr) {
              console.error("[Credits] Release failed:", releaseErr.message);
            }
          }
          return result;
        } catch (error) {
          console.error("[BookAnalysis] Error, releasing reservation:", error);
          let releaseResult = null;
          if (reservation) {
            try {
              const isTimeout = error.message?.includes("timeout") || error.name === "AbortError";
              releaseResult = await releaseReservation(env, reservation.reservationId, isTimeout ? "timeout" : "failed");
            } catch (releaseErr) {
              console.error("[Credits] Release failed:", releaseErr.message);
            }
          }
          const isTimeout = error.message?.includes("timeout") || error.name === "AbortError";
          return jsonResponse(
            {
              error: isTimeout ? "Analysis timeout" : "Analysis failed",
              message: isTimeout ? "Analysis took too long. Your credit has been refunded." : "An error occurred. Your credit has been refunded.",
              timeout: isTimeout,
              balance: releaseResult?.success ? { total: releaseResult.newTotal, credits: releaseResult.credits, freeRemaining: releaseResult.freeRemaining } : { free: true },
            },
            isTimeout ? 504 : 500, origin, env,
          );
        } finally {
          try {
            await callRpc(env, "release_analysis_lock", { p_lock_key: dedupKey });
          } catch (lockError) {
            console.error("[Security] Failed to release book analysis lock:", lockError);
          }
        }
      }

      // ============================================================
      // PHILOSOPHER PANEL — Multi-philosopher analysis (music + literature + news)
      // ============================================================
      if (url.pathname === "/api/philosopher-panel" && request.method === "POST") {
        // Daily AI spend cap (auth checked inside handler)
        const panelUser = await getUserFromAuth(request, env);
        if (panelUser) {
          const capOk = await checkDailyAICap(env, panelUser.userId, "philosopher-panel");
          if (!capOk) {
            return jsonResponse(
              { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
              429, origin, env,
            );
          }
        }
        return handlePhilosopherPanel(request, env, origin, ctx);
      }

      // ============================================================
      // NEWS — Search + Breaking News + TTS + Translate
      // ============================================================
      if (url.pathname === "/api/news/search" && request.method === "GET") {
        return handleNewsSearch(request, env, origin, ctx);
      }

      if (url.pathname === "/api/news/breaking" && request.method === "GET") {
        return handleBreakingNews(request, env, origin, ctx);
      }

      if (url.pathname === "/api/news/translate" && request.method === "POST") {
        // Daily AI spend cap (auth checked inside handler)
        const ntUser = await getUserFromAuth(request, env);
        if (ntUser) {
          const capOk = await checkDailyAICap(env, ntUser.userId, "news-translate");
          if (!capOk) {
            return jsonResponse(
              { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
              429, origin, env,
            );
          }
        }
        // Rate limit - FAIL CLOSED for expensive Gemini API calls
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `news-translate:${ip}`;
        let rateLimitOk = true;
        if (env.ANALYZE_RATE_LIMITER) {
          try {
            const { success } = await env.ANALYZE_RATE_LIMITER.limit({ key: rateLimitKey });
            rateLimitOk = success;
            if (!success) console.log("[RateLimit] News translate rate limit exceeded for:", rateLimitKey);
          } catch (error) {
            console.error("[RateLimit] ANALYZE_RATE_LIMITER error:", error);
            rateLimitOk = false;
          }
        } else {
          rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        }
        if (!rateLimitOk) {
          return jsonResponse(
            { error: "Too many requests", message: "Rate limit exceeded. Please wait." },
            429, origin, env,
          );
        }
        return handleNewsTranslate(request, env, origin);
      }

      if (url.pathname === "/api/news/tts" && request.method === "POST") {
        // Daily AI spend cap (auth checked inside handler)
        const ttsUser = await getUserFromAuth(request, env);
        if (ttsUser) {
          const capOk = await checkDailyAICap(env, ttsUser.userId, "news-tts");
          if (!capOk) {
            return jsonResponse(
              { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
              429, origin, env,
            );
          }
        }
        // Rate limit - FAIL CLOSED for expensive Gemini TTS API calls
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `news-tts:${ip}`;
        let rateLimitOk = true;
        if (env.ANALYZE_RATE_LIMITER) {
          try {
            const { success } = await env.ANALYZE_RATE_LIMITER.limit({ key: rateLimitKey });
            rateLimitOk = success;
            if (!success) console.log("[RateLimit] News TTS rate limit exceeded for:", rateLimitKey);
          } catch (error) {
            console.error("[RateLimit] ANALYZE_RATE_LIMITER error:", error);
            rateLimitOk = false;
          }
        } else {
          rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        }
        if (!rateLimitOk) {
          return jsonResponse(
            { error: "Too many requests", message: "Rate limit exceeded. Please wait." },
            429, origin, env,
          );
        }
        return handleNewsTTS(request, env, origin);
      }

      // ============================================================
      // NEWS PREFERENCES — User source customization (1 credit to unlock)
      // ============================================================
      if (url.pathname === "/api/user/news-preferences" && request.method === "GET") {
        return handleGetNewsPreferences(request, env, origin);
      }

      if (url.pathname === "/api/user/news-preferences/unlock" && request.method === "POST") {
        return handleUnlockNewsPreferences(request, env, origin);
      }

      if (url.pathname === "/api/user/news-preferences" && request.method === "PUT") {
        return handleUpdateNewsPreferences(request, env, origin);
      }

      if (url.pathname === "/api/panel-history" && request.method === "GET") {
        return handlePanelHistory(request, env, origin);
      }

      // GET /api/panel/:id — fetch a single panel analysis from KV
      const panelMatch = url.pathname.match(/^\/api\/panel\/([a-f0-9-]+)$/);
      if (panelMatch && request.method === "GET") {
        try {
          const panelId = panelMatch[1];
          const raw = await env.PHILOSIFY_KV.get(`panel:${panelId}`);
          if (!raw) return jsonResponse({ error: "Panel not found or expired" }, 404, origin, env);
          return jsonResponse({ success: true, panel: JSON.parse(raw) }, 200, origin, env);
        } catch (e) {
          console.error("[Panel] KV fetch error:", e.message);
          return jsonResponse({ error: "Failed to load panel" }, 500, origin, env);
        }
      }

      // ── Share preview pages (serve OG tags for WhatsApp/Telegram link previews) ──

      // ── Share preview i18n labels ──
      const SHARE_LABELS = {
        debate: { en: "Philosophical Debate", pt: "Debate Filosófico", es: "Debate Filosófico", fr: "Débat Philosophique", de: "Philosophische Debatte", it: "Dibattito Filosofico", nl: "Filosofisch Debat", ru: "Философская дискуссия", zh: "哲学辩论", ja: "哲学的討論", ko: "철학적 토론", ar: "نقاش فلسفي", he: "דיון פילוסופי", hi: "दार्शनिक बहस", fa: "بحث فلسفی", tr: "Felsefi Tartışma", pl: "Debata Filozoficzna", hu: "Filozófiai Vita" },
        panel: { en: "Philosopher's Panel", pt: "Painel dos Filósofos", es: "Panel de Filósofos", fr: "Panel des Philosophes", de: "Philosophen-Panel", it: "Panel dei Filosofi", nl: "Filosofenpanel", ru: "Панель Философов", zh: "哲学家论坛", ja: "哲学者パネル", ko: "철학자 패널", ar: "لجنة الفلاسفة", he: "פאנל הפילוסופים", hi: "दार्शनिक पैनल", fa: "پنل فیلسوفان", tr: "Filozof Paneli", pl: "Panel Filozofów", hu: "Filozófusok Panele" },
        tagline: { en: "Algorithmic Philosophical System for Cultural Analysis", pt: "Sistema Filosófico Algorítmico de Análise Cultural", es: "Sistema Filosófico Algorítmico de Análisis Cultural", fr: "Système Philosophique Algorithmique d'Analyse Culturelle", de: "Algorithmisches Philosophisches System für Kulturanalyse", it: "Sistema Filosofico Algoritmico di Analisi Culturale" },
      };
      const getLabel = (type, lang) => SHARE_LABELS[type]?.[lang] || SHARE_LABELS[type]?.en || "";

      // GET /api/share-preview/debate/:threadId?lang=xx
      const debateShareMatch = url.pathname.match(/^\/api\/share-preview\/debate\/([a-f0-9-]+)$/);
      if (debateShareMatch && request.method === "GET") {
        try {
          const threadId = debateShareMatch[1];
          const lang = url.searchParams.get("lang") || "en";
          const { pg: pgQuery } = await import("./src/utils/pg.js");
          const threads = await pgQuery(env, "GET", "forum_threads", {
            filter: `id=eq.${threadId}`,
            select: "id,title,content,metadata",
          });
          const thread = threads?.[0];
          // Translations stored as metadata.translations.title.{lang} and metadata.translations.content.{lang}
          const trans = thread?.metadata?.translations || {};
          const rawTitle = trans.title?.[lang] || thread?.title || getLabel("debate", lang);
          const rawContent = trans.content?.[lang] || thread?.content || "";
          const title = escapeHtml(rawTitle);
          const excerpt = escapeHtml(rawContent.length > 160 ? rawContent.slice(0, 160) + "..." : rawContent);
          const philosophers = (thread?.metadata?.philosophers || []).join(", ");
          const desc = philosophers ? `${excerpt} — ${escapeHtml(philosophers)}` : excerpt;
          const logoUrl = "https://philosify.org/logo.png";
          const previewUrl = `https://philosify.org/api/share-preview/debate/${threadId}`;

          const html = `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="UTF-8">
<meta property="og:type" content="article">
<meta property="og:url" content="${previewUrl}">
<meta property="og:title" content="${title} | Philosify">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${logoUrl}">
<meta property="og:site_name" content="Philosify">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} | Philosify">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${logoUrl}">
<title>${title} | Philosify</title>
<meta http-equiv="refresh" content="1;url=https://philosify.org">
</head><body><h1>${title}</h1><p>${desc}</p></body></html>`;

           return new Response(html, { status: 200, headers: { "Content-Type": "text/html;charset=UTF-8", ...corsHeaders } });
        } catch (e) {
          console.error("[SharePreview] Debate error:", e.message);
          return jsonResponse({ error: "Failed to load preview" }, 500, origin, env);
        }
      }

      // GET /api/share-preview/panel/:panelId?lang=xx
      const panelShareMatch = url.pathname.match(/^\/api\/share-preview\/panel\/([a-f0-9-]+)$/);
      if (panelShareMatch && request.method === "GET") {
        try {
          const panelId = panelShareMatch[1];
          const lang = url.searchParams.get("lang") || "en";
          const raw = await env.PHILOSIFY_KV.get(`panel:${panelId}`);
          const panel = raw ? JSON.parse(raw) : null;
          const title = escapeHtml(panel?.title || getLabel("panel", lang));
          const analysis = panel?.analysis || "";
          const excerpt = escapeHtml(analysis.replace(/\*\*/g, "").replace(/\*/g, "").slice(0, 160) + "...");
          const mediaType = panel?.mediaType || "news";
          const desc = `${mediaType === "news" ? "📰" : mediaType === "cinema" ? "🎬" : mediaType === "music" ? "🎵" : "📚"} ${excerpt}`;
          const logoUrl = "https://philosify.org/logo.png";
          const previewUrl = `https://philosify.org/api/share-preview/panel/${panelId}`;

          const html = `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="UTF-8">
<meta property="og:type" content="article">
<meta property="og:url" content="${previewUrl}">
<meta property="og:title" content="${title} | Philosify">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${logoUrl}">
<meta property="og:site_name" content="Philosify">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} | Philosify">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${logoUrl}">
<title>${title} | Philosify</title>
<meta http-equiv="refresh" content="1;url=https://philosify.org">
</head><body><h1>${title}</h1><p>${desc}</p></body></html>`;

           return new Response(html, { status: 200, headers: { "Content-Type": "text/html;charset=UTF-8", ...corsHeaders } });
        } catch (e) {
          console.error("[SharePreview] Panel error:", e.message);
          return jsonResponse({ error: "Failed to load preview" }, 500, origin, env);
        }
      }


      // Unified user history — all analyses, panels, debates
      if (url.pathname === "/api/user-history" && request.method === "GET") {
        return handleUserHistory(request, env, origin);
      }

      // ============================================================
      // HISTORY GRAPH — Philosophy-History 3D Force Graph
      // ============================================================
      if (url.pathname === "/api/history/graph" && request.method === "GET") {
        return handleHistoryGraph(request, env, origin, ctx);
      }

      if (url.pathname === "/api/history/graph/extract" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }
        return handleHistoryExtract(request, env, origin);
      }

      // ============================================================
      // CONSTELLATION OF IDEAS — 3D visualization of 2,600 years of thought
      // ============================================================
      if (url.pathname === "/api/history/constellation" && request.method === "GET") {
        const { handleConstellation } = await import("./src/handlers/constellation.js");
        return handleConstellation(request, env, origin);
      }

      if (url.pathname === "/api/history/constellation/cache-clear" && request.method === "POST") {
        const adminSecret = request.headers.get("X-Admin-Secret");
        const expected = await getSecret(env.ADMIN_SECRET);
        if (!adminSecret || !safeEq(adminSecret, expected)) {
          return jsonResponse({ error: "Forbidden" }, 403, origin, env);
        }
        const { handleConstellationCacheClear } = await import("./src/handlers/constellation.js");
        return handleConstellationCacheClear(request, env, origin);
      }

      if (url.pathname === "/api/history/constellation/stats" && request.method === "GET") {
        const adminSecret = request.headers.get("X-Admin-Secret");
        const expected = await getSecret(env.ADMIN_SECRET);
        if (!adminSecret || !safeEq(adminSecret, expected)) {
          return jsonResponse({ error: "Forbidden" }, 403, origin, env);
        }
        const { handleConstellationStats } = await import("./src/handlers/constellation.js");
        return handleConstellationStats(request, env, origin);
      }

      // ============================================================
      // ORBITAL COORDINATES — 3D Tether Position Management
      // ============================================================
      if (url.pathname.match(/^\/api\/orbital\/assign\/(.+)$/) && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }
        const nodeId = url.pathname.split("/")[4];
        return handleAssignOrbitalCoordinates(request, env, nodeId);
      }
      
      if (url.pathname.match(/^\/api\/orbital\/set\/(.+)$/) && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }
        const nodeId = url.pathname.split("/")[4];
        return handleSetOrbitalCoordinates(request, env, nodeId);
      }
      
      if (url.pathname === "/api/orbital/check" && request.method === "GET") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }
        return handleCheckOrbitalPosition(request, env);
      }
      
      if (url.pathname === "/api/orbital/occupied" && request.method === "GET") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }
        return handleGetOccupiedPositions(request, env);
      }
      
      if (url.pathname === "/api/orbital/batch-assign" && request.method === "POST") {
        const user = await getUserFromAuth(request, env);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
        }
        return handleBatchAssignOrbitalCoordinates(request, env);
      }

      // ============================================================
      // QUIZ — Philosophical Quiz Feature
      // ============================================================
      if (url.pathname === "/api/quiz/start" && request.method === "POST") {
        // Rate limit - FAIL CLOSED for potential AI generation
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `quiz-start:${ip}`;
        let rateLimitOk = true;
        if (env.ANALYZE_RATE_LIMITER) {
          try {
            const { success } = await env.ANALYZE_RATE_LIMITER.limit({ key: rateLimitKey });
            rateLimitOk = success;
            if (!success) console.log("[RateLimit] Quiz start rate limit exceeded for:", rateLimitKey);
          } catch (error) {
            console.error("[RateLimit] ANALYZE_RATE_LIMITER error:", error);
            rateLimitOk = false;
          }
        } else {
          rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        }
        if (!rateLimitOk) {
          return jsonResponse(
            { error: "Too many requests", message: "Rate limit exceeded. Please wait." },
            429, origin, env,
          );
        }
        const { handleQuizStart } = await import("./src/handlers/quiz.js");
        return handleQuizStart(request, env);
      }
      if (url.pathname === "/api/quiz/answer" && request.method === "POST") {
        const { handleQuizAnswer } = await import("./src/handlers/quiz.js");
        return handleQuizAnswer(request, env);
      }
      if (url.pathname === "/api/quiz/continue" && request.method === "POST") {
        // Rate limit - FAIL CLOSED for potential AI generation
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `quiz-continue:${ip}`;
        let rateLimitOk = true;
        if (env.ANALYZE_RATE_LIMITER) {
          try {
            const { success } = await env.ANALYZE_RATE_LIMITER.limit({ key: rateLimitKey });
            rateLimitOk = success;
            if (!success) console.log("[RateLimit] Quiz continue rate limit exceeded for:", rateLimitKey);
          } catch (error) {
            console.error("[RateLimit] ANALYZE_RATE_LIMITER error:", error);
            rateLimitOk = false;
          }
        } else {
          rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        }
        if (!rateLimitOk) {
          return jsonResponse(
            { error: "Too many requests", message: "Rate limit exceeded. Please wait." },
            429, origin, env,
          );
        }
        const { handleQuizContinue } = await import("./src/handlers/quiz.js");
        return handleQuizContinue(request, env);
      }
      if (url.pathname === "/api/quiz/question" && request.method === "GET") {
        const { handleQuizNextQuestion } = await import("./src/handlers/quiz.js");
        return handleQuizNextQuestion(request, env);
      }
      if (url.pathname === "/api/quiz/leaderboard" && request.method === "GET") {
        const { handleQuizLeaderboard } = await import("./src/handlers/quiz.js");
        return handleQuizLeaderboard(request, env);
      }
      if (url.pathname === "/api/quiz/resume" && request.method === "GET") {
        const { handleQuizResume } = await import("./src/handlers/quiz.js");
        return handleQuizResume(request, env);
      }
      if (url.pathname === "/api/quiz/end" && request.method === "POST") {
        const { handleQuizEnd } = await import("./src/handlers/quiz.js");
        return handleQuizEnd(request, env);
      }
      if (url.pathname === "/api/quiz/abandon" && request.method === "POST") {
        const { handleQuizAbandon } = await import("./src/handlers/quiz.js");
        return handleQuizAbandon(request, env);
      }
      if (url.pathname === "/api/quiz/profile" && request.method === "GET") {
        const { handleQuizGetProfile } = await import("./src/handlers/quiz.js");
        return handleQuizGetProfile(request, env);
      }
      if (url.pathname === "/api/quiz/profile" && request.method === "POST") {
        const { handleQuizSetProfile } = await import("./src/handlers/quiz.js");
        return handleQuizSetProfile(request, env);
      }
      if (url.pathname === "/api/admin/quiz/generate" && request.method === "POST") {
        const { handleQuizBulkGenerate } = await import("./src/handlers/quiz.js");
        return handleQuizBulkGenerate(request, env);
      }

      // ============================================================
      // UNSAFE ZONE ROUTES
      // Session-based billing: 10 credits for 20 turns, 5 credits per 10 additional
      // ============================================================
      if (url.pathname === "/api/unsafe-zone" && request.method === "POST") {
        // Daily AI spend cap (auth checked inside handler)
        const uzUser = await getUserFromAuth(request, env);
        if (uzUser) {
          const capOk = await checkDailyAICap(env, uzUser.userId, "unsafe-zone");
          if (!capOk) {
            return jsonResponse(
              { error: "Daily AI usage limit reached", message: "You have exceeded the daily AI usage limit. Please try again tomorrow." },
              429, origin, env,
            );
          }
        }
        // Rate limit - FAIL CLOSED for expensive Claude API calls
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitKey = `unsafe-zone:${ip}`;
        let rateLimitOk = true;
        if (env.ANALYZE_RATE_LIMITER) {
          try {
            const { success } = await env.ANALYZE_RATE_LIMITER.limit({ key: rateLimitKey });
            rateLimitOk = success;
            if (!success) console.log("[RateLimit] Unsafe Zone rate limit exceeded for:", rateLimitKey);
          } catch (error) {
            console.error("[RateLimit] ANALYZE_RATE_LIMITER error:", error);
            rateLimitOk = false;
          }
        } else {
          rateLimitOk = await checkRateLimit(env, rateLimitKey, true);
        }
        if (!rateLimitOk) {
          return jsonResponse(
            { error: "Too many requests", message: "Rate limit exceeded. Please wait." },
            429, origin, env,
          );
        }
        const { handleUnsafeZone } = await import("./src/handlers/unsafe-zone.js");
        return handleUnsafeZone(request, env, origin);
      }
      if (url.pathname === "/api/unsafe-zone/conversation" && request.method === "GET") {
        const { handleUnsafeZoneLoad } = await import("./src/handlers/unsafe-zone.js");
        return handleUnsafeZoneLoad(request, env, origin);
      }
      if (url.pathname === "/api/unsafe-zone/conversation" && request.method === "DELETE") {
        const { handleUnsafeZoneClear } = await import("./src/handlers/unsafe-zone.js");
        return handleUnsafeZoneClear(request, env, origin);
      }
      if (url.pathname === "/api/unsafe-zone/history" && request.method === "GET") {
        const { handleUnsafeZoneHistory } = await import("./src/handlers/unsafe-zone.js");
        return handleUnsafeZoneHistory(request, env, origin);
      }
      if (url.pathname.startsWith("/api/unsafe-zone/session/") && request.method === "GET") {
        const sessionId = url.pathname.split("/api/unsafe-zone/session/")[1];
        const { handleUnsafeZoneGetSession } = await import("./src/handlers/unsafe-zone.js");
        return handleUnsafeZoneGetSession(request, env, origin, sessionId);
      }
      if (url.pathname === "/api/unsafe-zone/end" && request.method === "POST") {
        const { handleUnsafeZoneEnd } = await import("./src/handlers/unsafe-zone.js");
        return handleUnsafeZoneEnd(request, env, origin);
      }

      // ============================================================
      // ADS PLATFORM ROUTES
      // ============================================================

      // Ads Auth (public - RATE LIMITED to prevent brute force)
      if (url.pathname === "/api/ads/auth/signup" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `ads-signup:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests. Please try again later." }, 429, corsHeaders);
        }
        return handleAdsSignup(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/auth/login" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `ads-login:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests. Please try again later." }, 429, corsHeaders);
        }
        return handleAdsLogin(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/auth/logout" && request.method === "POST") {
        return handleAdsLogout(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/auth/refresh" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `ads-refresh:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests. Please try again later." }, 429, corsHeaders);
        }
        return handleAdsRefresh(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/auth/me" && request.method === "GET") {
        return handleAdsMe(request, env, corsHeaders);
      }

      // Ads Campaigns (authenticated advertisers)
      if (url.pathname === "/api/ads/campaigns" && request.method === "GET") {
        return handleAdsListCampaigns(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/campaigns" && request.method === "POST") {
        return handleAdsCreateCampaign(request, env, corsHeaders);
      }
      const campaignMatch = url.pathname.match(/^\/api\/ads\/campaigns\/([0-9a-f-]+)$/i);
      if (campaignMatch) {
        const campaignId = campaignMatch[1];
        if (request.method === "GET") {
          return handleAdsGetCampaign(request, env, corsHeaders, campaignId);
        }
        if (request.method === "PUT") {
          return handleAdsUpdateCampaign(request, env, corsHeaders, campaignId);
        }
        if (request.method === "DELETE") {
          return handleAdsDeleteCampaign(request, env, corsHeaders, campaignId);
        }
      }

      // Ads Billing (authenticated advertisers)
      if (url.pathname === "/api/ads/billing/balance" && request.method === "GET") {
        return handleAdsGetBalance(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/billing/transactions" && request.method === "GET") {
        return handleAdsGetTransactions(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/billing/checkout" && request.method === "POST") {
        return handleAdsCreateCheckout(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/billing/webhook" && request.method === "POST") {
        return handleAdsBillingWebhook(request, env, corsHeaders);
      }

      // Ads Account (authenticated advertisers)
      if (url.pathname === "/api/ads/account/profile" && request.method === "PUT") {
        return handleAdsUpdateProfile(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/account/password" && request.method === "PUT") {
        return handleAdsChangePassword(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/account" && request.method === "DELETE") {
        return handleAdsDeleteAccount(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/stats/overview" && request.method === "GET") {
        return handleAdsStatsOverview(request, env, corsHeaders);
      }

      // Analytics & Reporting
      if (url.pathname === "/api/ads/analytics/overview" && request.method === "GET") {
        const { handleAnalyticsOverview } = await import("./src/handlers/ads/analytics.js");
        return handleAnalyticsOverview(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/analytics/export" && request.method === "GET") {
        const { handleAnalyticsExport } = await import("./src/handlers/ads/analytics.js");
        return handleAnalyticsExport(request, env, corsHeaders);
      }

      // Ads Creative Upload/Delete (authenticated advertisers)
      if (url.pathname === "/api/ads/creatives/upload" && request.method === "POST") {
        return handleAdsUploadCreative(request, env, corsHeaders);
      }
      const creativeDeleteMatch = url.pathname.match(/^\/api\/ads\/creatives\/(.+)$/);
      if (creativeDeleteMatch && request.method === "DELETE") {
        const { handleDeleteCreative } = await import("./src/handlers/ads/creatives.js");
        return handleDeleteCreative(request, env, corsHeaders, creativeDeleteMatch[1]);
      }

      // Inventory Management (public for browsing, auth for quotes)
      if (url.pathname === "/api/ads/inventory" && request.method === "GET") {
        return handleGetInventory(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/inventory/check" && request.method === "POST") {
        return handleCheckAvailability(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/pricing" && request.method === "GET") {
        return handleGetPricing(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/inventory/quote" && request.method === "POST") {
        return handleGetQuote(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/inventory/calculate" && request.method === "POST") {
        return handleCalculateCart(request, env, corsHeaders);
      }

      // Orders (authenticated advertisers)
      if (url.pathname === "/api/ads/orders" && request.method === "GET") {
        return handleListOrders(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/orders" && request.method === "POST") {
        return handleCreateOrder(request, env, corsHeaders);
      }
      const orderIdMatch = url.pathname.match(/^\/api\/ads\/orders\/([0-9a-f-]+)$/i);
      if (orderIdMatch && request.method === "GET") {
        return handleGetOrder(request, env, corsHeaders, orderIdMatch[1]);
      }
      if (orderIdMatch && request.method === "PUT") {
        const { handleUpdateOrder } = await import("./src/handlers/ads/orders.js");
        return handleUpdateOrder(request, env, corsHeaders, orderIdMatch[1]);
      }
      const orderCheckoutMatch = url.pathname.match(/^\/api\/ads\/orders\/([0-9a-f-]+)\/checkout$/i);
      if (orderCheckoutMatch && request.method === "POST") {
        return handleOrderCheckout(request, env, corsHeaders, orderCheckoutMatch[1]);
      }
      const orderPauseMatch = url.pathname.match(/^\/api\/ads\/orders\/([0-9a-f-]+)\/pause$/i);
      if (orderPauseMatch && request.method === "POST") {
        return handlePauseOrder(request, env, corsHeaders, orderPauseMatch[1]);
      }
      const orderResumeMatch = url.pathname.match(/^\/api\/ads\/orders\/([0-9a-f-]+)\/resume$/i);
      if (orderResumeMatch && request.method === "POST") {
        return handleResumeOrder(request, env, corsHeaders, orderResumeMatch[1]);
      }
      const orderCancelMatch = url.pathname.match(/^\/api\/ads\/orders\/([0-9a-f-]+)\/cancel$/i);
      if (orderCancelMatch && request.method === "POST") {
        return handleCancelOrder(request, env, corsHeaders, orderCancelMatch[1]);
      }

      // Budget Planner (authenticated advertisers)
      if (url.pathname === "/api/ads/planner/generate" && request.method === "POST") {
        return handleGeneratePlan(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/planner/create" && request.method === "POST") {
        return handleCreateFromPlan(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/plans" && request.method === "GET") {
        return handleListPlans(request, env, corsHeaders);
      }
      const planIdMatch = url.pathname.match(/^\/api\/ads\/plans\/([0-9a-f-]+)$/i);
      if (planIdMatch && request.method === "GET") {
        return handleGetPlan(request, env, corsHeaders, planIdMatch[1]);
      }
      const planCheckoutMatch = url.pathname.match(/^\/api\/ads\/plans\/([0-9a-f-]+)\/checkout$/i);
      if (planCheckoutMatch && request.method === "POST") {
        return handlePlanCheckout(request, env, corsHeaders, planCheckoutMatch[1]);
      }
      const planCreativeApproveMatch = url.pathname.match(/^\/api\/ads\/plans\/([0-9a-f-]+)\/creative\/approve$/i);
      if (planCreativeApproveMatch && request.method === "POST") {
        return handleApprovePlanCreative(request, env, corsHeaders, planCreativeApproveMatch[1]);
      }
      const planCreativeRevisionMatch = url.pathname.match(/^\/api\/ads\/plans\/([0-9a-f-]+)\/creative\/revision$/i);
      if (planCreativeRevisionMatch && request.method === "POST") {
        return handleRequestPlanRevision(request, env, corsHeaders, planCreativeRevisionMatch[1]);
      }

      // Audience Targeting (public browsing, auth for detailed estimates)
      if (url.pathname === "/api/ads/targeting/options" && request.method === "GET") {
        return handleGetTargetingOptions(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/targeting/estimate" && request.method === "POST") {
        return handleEstimateReach(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/targeting/suggestions" && request.method === "GET") {
        return handleTargetingSuggestions(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/targeting/validate" && request.method === "POST") {
        return handleValidateTargeting(request, env, corsHeaders);
      }

      // Ad Serving (called by Philosify frontend)
      // These endpoints are public but rate-limited
      if (url.pathname === "/api/ads/serve" && request.method === "GET") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `ads-serve:${ip}`);
        if (!rateLimitOk) {
          return jsonResponse({ ad: null, reason: "rate_limited" }, 200, corsHeaders);
        }
        return handleServeAd(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/serve/batch" && request.method === "GET") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `ads-serve-batch:${ip}`);
        if (!rateLimitOk) {
          return jsonResponse({ ads: [], reason: "rate_limited" }, 200, corsHeaders);
        }
        return handleServeAdBatch(request, env, corsHeaders);
      }
      // CRITICAL: Impression/click recording requires origin validation and strict rate limiting
      // Only accept from philosify.org to prevent fraud
      if (url.pathname === "/api/ads/impression" && request.method === "POST") {
        // Validate origin - only allow from Philosify frontend
        const requestOrigin = request.headers.get("origin") || "";
        const isValidOrigin = requestOrigin === "https://philosify.org" || 
                              requestOrigin === "https://www.philosify.org" ||
                              (env.ENVIRONMENT !== "production" && requestOrigin.includes("localhost"));
        if (!isValidOrigin) {
          return jsonResponse({ error: "Invalid origin" }, 403, corsHeaders);
        }
        // Strict rate limiting per IP
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `ads-impression:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Rate limit exceeded" }, 429, corsHeaders);
        }
        return handleRecordImpression(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/click" && request.method === "POST") {
        // Validate origin - only allow from Philosify frontend
        const requestOrigin = request.headers.get("origin") || "";
        const isValidOrigin = requestOrigin === "https://philosify.org" || 
                              requestOrigin === "https://www.philosify.org" ||
                              (env.ENVIRONMENT !== "production" && requestOrigin.includes("localhost"));
        if (!isValidOrigin) {
          return jsonResponse({ error: "Invalid origin" }, 403, corsHeaders);
        }
        // Strict rate limiting per IP
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `ads-click:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Rate limit exceeded" }, 429, corsHeaders);
        }
        return handleRecordClick(request, env, corsHeaders);
      }

      // Ads Admin (owner only, requires X-Admin-Secret)
      if (url.pathname === "/api/ads/admin/pending" && request.method === "GET") {
        return handleAdsListPending(request, env, corsHeaders);
      }
      const adsApproveMatch = url.pathname.match(/^\/api\/ads\/admin\/approve\/([0-9a-f-]+)$/i);
      if (adsApproveMatch && request.method === "POST") {
        return handleApproveAdvertiser(request, env, corsHeaders, adsApproveMatch[1]);
      }
      const adsRejectMatch = url.pathname.match(/^\/api\/ads\/admin\/reject\/([0-9a-f-]+)$/i);
      if (adsRejectMatch && request.method === "POST") {
        return handleRejectAdvertiser(request, env, corsHeaders, adsRejectMatch[1]);
      }
      const adsSuspendMatch = url.pathname.match(/^\/api\/ads\/admin\/suspend\/([0-9a-f-]+)$/i);
      if (adsSuspendMatch && request.method === "POST") {
        return handleSuspendAdvertiser(request, env, corsHeaders, adsSuspendMatch[1]);
      }
      if (url.pathname === "/api/ads/admin/stats" && request.method === "GET") {
        return handleAdsAdminStats(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/admin/overview" && request.method === "GET") {
        return handleAdsAdminOverview(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/admin/plans" && request.method === "GET") {
        return handleAdsAdminListPlans(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/admin/creative-requests" && request.method === "GET") {
        return handleAdsAdminListCreativeRequests(request, env, corsHeaders);
      }
      const adsAdminPlanApproveMatch = url.pathname.match(/^\/api\/ads\/admin\/plans\/([0-9a-f-]+)\/approve$/i);
      if (adsAdminPlanApproveMatch && request.method === "POST") {
        return handleAdsAdminApprovePlan(request, env, corsHeaders, adsAdminPlanApproveMatch[1]);
      }
      const adsAdminCreativeDraftMatch = url.pathname.match(/^\/api\/ads\/admin\/creative-requests\/([0-9a-f-]+)\/draft$/i);
      if (adsAdminCreativeDraftMatch && request.method === "POST") {
        return handleAdsAdminSubmitCreativeDraft(request, env, corsHeaders, adsAdminCreativeDraftMatch[1]);
      }

      // Agency Auth (RATE LIMITED to prevent brute force)
      if (url.pathname === "/api/ads/agency/auth/signup" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `agency-signup:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests. Please try again later." }, 429, corsHeaders);
        }
        return handleAgencySignup(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/agency/auth/login" && request.method === "POST") {
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const rateLimitOk = await checkRateLimit(env, `agency-login:${ip}`, true);
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests. Please try again later." }, 429, corsHeaders);
        }
        return handleAgencyLogin(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/agency/auth/logout" && request.method === "POST") {
        return handleAgencyLogout(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/agency/auth/me" && request.method === "GET") {
        return handleAgencyMe(request, env, corsHeaders);
      }

      // Agency Client Management
      if (url.pathname === "/api/ads/agency/clients" && request.method === "GET") {
        return handleListClients(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/agency/clients" && request.method === "POST") {
        return handleCreateClient(request, env, corsHeaders);
      }
      const agencyClientCommissionMatch = url.pathname.match(/^\/api\/ads\/agency\/clients\/([0-9a-f-]+)\/commission$/i);
      if (agencyClientCommissionMatch && request.method === "PUT") {
        return handleUpdateClientCommission(request, env, corsHeaders, agencyClientCommissionMatch[1]);
      }

      // Agency Earnings & Payouts
      if (url.pathname === "/api/ads/agency/earnings" && request.method === "GET") {
        return handleAgencyEarnings(request, env, corsHeaders);
      }
      if (url.pathname === "/api/ads/agency/payout" && request.method === "POST") {
        return handleAgencyPayout(request, env, corsHeaders);
      }

      // Agency Client Campaigns
      const agencyClientCampaignsMatch = url.pathname.match(/^\/api\/ads\/agency\/clients\/([0-9a-f-]+)\/campaigns$/i);
      if (agencyClientCampaignsMatch) {
        const clientId = agencyClientCampaignsMatch[1];
        if (request.method === "GET") {
          return handleAgencyListClientCampaigns(request, env, corsHeaders, clientId);
        }
        if (request.method === "POST") {
          return handleAgencyCreateClientCampaign(request, env, corsHeaders, clientId);
        }
      }
      const agencyClientCampaignMatch = url.pathname.match(/^\/api\/ads\/agency\/clients\/([0-9a-f-]+)\/campaigns\/([0-9a-f-]+)$/i);
      if (agencyClientCampaignMatch) {
        const clientId = agencyClientCampaignMatch[1];
        const campaignId = agencyClientCampaignMatch[2];
        if (request.method === "PUT") {
          return handleAgencyUpdateClientCampaign(request, env, corsHeaders, clientId, campaignId);
        }
        if (request.method === "DELETE") {
          return handleAgencyDeleteClientCampaign(request, env, corsHeaders, clientId, campaignId);
        }
      }

      // ============================================================
      // END ADS PLATFORM ROUTES
      // ============================================================

      // Temporary diagnostic: check profiles table and auth trigger
      if (url.pathname === "/api/admin/diagnose-auth" && request.method === "GET") {
        const adminSecret = request.headers.get("X-Admin-Secret");
        const expected = await getSecret(env.ADMIN_SECRET);
        if (!adminSecret || !safeEq(adminSecret, expected)) {
          return jsonResponse({ error: "Forbidden" }, 403, origin, env);
        }
        try {
          const { getSupabaseCredentials: getSbCreds } = await import("./src/utils/supabase.js");
          const { url: sbUrl, key: sbKey } = await getSbCreds(env);
          const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

          // Check profiles table structure
          const profilesRes = await fetch(`${sbUrl}/rest/v1/profiles?select=user_id&limit=1`, { headers });
          const profilesOk = profilesRes.ok;
          const profilesStatus = profilesRes.status;

          // Try to list database functions related to auth
          const rpcRes = await fetch(`${sbUrl}/rest/v1/rpc/get_pg_functions`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          // Check if we can insert into profiles manually
          const testId = "00000000-0000-0000-0000-000000000000";
          const insertRes = await fetch(`${sbUrl}/rest/v1/profiles`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({
              user_id: testId,
              email: "diag-test@example.com",
              display_name: "Diagnostic Test",
            }),
          });
          const insertStatus = insertRes.status;
          const insertErr = insertStatus !== 201 ? await insertRes.text() : "ok";

          // Clean up test row
          if (insertStatus === 201 || insertStatus === 409) {
            await fetch(`${sbUrl}/rest/v1/profiles?user_id=eq.${testId}`, {
              method: "DELETE",
              headers: { ...headers },
            });
          }

          return jsonResponse({
            profiles_table_accessible: profilesOk,
            profiles_status: profilesStatus,
            insert_test_status: insertStatus,
            insert_test_result: insertErr.substring(0, 500),
          }, 200, origin, env);
        } catch (e) {
          console.error("[Admin] Diagnose-auth error:", e.message);
          return jsonResponse({ error: "Diagnostic failed" }, 500, origin, env);
        }
      }

      // 404
      return jsonResponse({ error: "Not found" }, 404, origin, env);
    } catch (error) {
      // Top-level error handler - ensures CORS headers are always included
      console.error("[Worker] Unhandled error:", error);
      return jsonResponse(
        {
          error: "Internal server error",
          message: "An unexpected error occurred. Please try again.",
        },
        500,
        origin,
        env,
      );
    }
  },

  // ============================================================
  // EMAIL HANDLER - Receives emails to bob@philosify.org
  // ============================================================
  async email(message, env, ctx) {
    console.log(`[Email] 📧 Incoming email from: ${message.from}`);
    console.log(`[Email] To: ${message.to}`);

    // Beta email auto-responder removed. Incoming emails are logged but not processed.
    console.log(`[Email] No handler configured. Ignoring.`);
  },

  // ============================================================
  // SCHEDULED HANDLER - Cron triggers
  // ============================================================
  async scheduled(event, env, ctx) {
    const now = new Date();
    const hour = now.getUTCHours();
    console.log(
      `[Cron] Scheduled event triggered at ${now.toISOString()} (hour: ${hour})`,
    );

    // Hour 12: Question of the Day for Agora (every day at noon UTC)
    if (hour === 12) {
      ctx.waitUntil(
        generateDailyQuestion(env).catch((err) =>
          console.error("[Cron] Daily question failed:", err.message),
        ),
      );

      // Weekly: Top 10 Spotify refresh (Sundays only)
      if (now.getUTCDay() === 0) {
        ctx.waitUntil(handleScheduledTop10(env));
      }
    }

    // Breaking news refresh — every 20 minutes (cron runs every 5 min, so check minutes)
    if (now.getUTCMinutes() % 20 < 5) {
      ctx.waitUntil(
        refreshBreakingNews(env).catch((err) =>
          console.error("[Cron] Breaking news refresh failed:", err.message),
        ),
      );
    }

    // User-proposed colloquium: staggered philosopher replies (every 5 min)
    ctx.waitUntil(
      checkPendingUserProposedReplies(env).catch((err) =>
        console.error(
          "[Cron] User-proposed philosopher check failed:",
          err.message,
        ),
      ),
    );

    // Auto-verdict check for user_proposed + open_debate (every 5 min)
    ctx.waitUntil(
      checkExpiredAutoVerdicts(env).catch((err) =>
        console.error("[Cron] Auto-verdict check failed:", err.message),
      ),
    );

    // Daily Academic Colloquium — hours 8, 11, 14, 17, 20, 23
    if ([8, 11, 14, 17, 20, 23].includes(hour)) {
      ctx.waitUntil(
        handleColloquiumCron(env, hour).catch((err) =>
          console.error("[Cron] Colloquium failed:", err.message),
        ),
      );
    }

    // Push queue cleanup — once daily at hour 8
    // Removes delivered entries >24h old and undelivered entries >48h old
    if (hour === 8) {
      ctx.waitUntil(
        cleanupPushQueue(env).catch((err) =>
          console.error("[Cron] Push queue cleanup failed:", err.message),
        ),
      );
    }

    // Top Books feed refresh — every 6 hours (0, 6, 12, 18 UTC)
    // Gate on minute < 5 to avoid redundant fetches from */5 cron
    const minute = now.getUTCMinutes();
    if (hour % 6 === 0 && minute < 5) {
      ctx.waitUntil(
        fetchTopBooks(env).catch((err) =>
          console.error("[Cron] Top Books refresh failed:", err.message),
        ),
      );
    }

    // Top Cinema feed refresh — every 3 hours (0, 3, 6, 9, 12, 15, 18, 21 UTC)
    if (hour % 3 === 0 && minute < 5) {
      ctx.waitUntil(
        fetchTopFilms(env).catch((err) =>
          console.error("[Cron] Top Cinema refresh failed:", err.message),
        ),
      );
    }

    // History Graph cache refresh — every 6 hours (0, 6, 12, 18 UTC)
    if (hour % 6 === 0 && minute < 5) {
      ctx.waitUntil(
        refreshGraphCache(env).catch((err) =>
          console.error("[Cron] History Graph refresh failed:", err.message),
        ),
      );
    }

    // Constellation of Ideas: Tier 2 LLM extraction sweep — every 30 minutes
    // Processes analyses that have Tier 1 but not Tier 2 extraction
    if (minute % 30 < 5) {
      ctx.waitUntil(
        (async () => {
          try {
            const { sweepLLMExtraction } = await import("./src/extractors/constellation-llm-extractor.js");
            const results = await sweepLLMExtraction(env);
            console.log(`[Cron] Constellation Tier 2: ${results.processed} processed, ${results.success} success`);

            // Also run auto-merge after LLM sweep
            const { runMergeOperations } = await import("./src/extractors/constellation-merge.js");
            const mergeResults = await runMergeOperations(env);
            console.log(`[Cron] Constellation merge: ${mergeResults.edges.merged} edges, ${mergeResults.nodes.promoted} nodes`);
          } catch (err) {
            console.error("[Cron] Constellation sweep failed:", err.message);
          }
        })(),
      );
    }
  },
};
