// ============================================================
// GUIDES - KV LOADER WITH FALLBACK
// ============================================================

// NOTE:
// We need the canonical LITE guide for quick preview analysis.
// - In production (Cloudflare Workers via Wrangler), we can import `.txt` as a Text module (wrangler.toml rules).
// - In CI/unit tests (Node/Vitest), Node cannot import `.txt` modules. So we fall back to reading from disk.
async function loadLiteGuideText() {
  // 1) Try Wrangler-bundled Text module import (Workers)
  try {
    const mod = await import("../../guides/Guide_v2.9_LITE.txt");
    const txt = String(mod?.default || "").trim();
    if (txt) return txt;
  } catch {
    // ignore and fall back
  }

  // 2) Node/Vitest fallback: read from filesystem
  try {
    const fs = await import("node:fs/promises");
    const txt = String(
      await fs.readFile(
        new URL("../../guides/Guide_v2.9_LITE.txt", import.meta.url),
        "utf8",
      ),
    ).trim();
    if (txt) return txt;
  } catch {
    // ignore
  }

  return "";
}

// Load the main guide (v3.0 LITE) from bundled file
// Used as fallback when KV is not available (local dev mode)
async function loadMainGuideText() {
  // 1) Try Wrangler-bundled Text module import (Workers)
  try {
    const mod = await import("../../guides/Guide_v3.0_LITE.txt");
    const txt = String(mod?.default || "").trim();
    if (txt) return txt;
  } catch {
    // ignore and fall back
  }

  // 2) Node/Vitest fallback: read from filesystem
  try {
    const fs = await import("node:fs/promises");
    const txt = String(
      await fs.readFile(
        new URL("../../guides/Guide_v3.0_LITE.txt", import.meta.url),
        "utf8",
      ),
    ).trim();
    if (txt) return txt;
  } catch {
    // ignore
  }

  return "";
}

// Calculate SHA256 hash of guide text
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Extract version from guide text
function extractVersion(guideText) {
  // Look for version patterns: "v2.7", "Version: 2.7", "v2.7 LITE", etc.
  const versionPatterns = [
    /Version:\s*([\d.]+(?:\s+\w+)?)/i,
    /v([\d.]+(?:\s+\w+)?)/i,
    /GUIDELINES\s*—\s*v([\d.]+(?:\s+\w+)?)/i,
  ];

  for (const pattern of versionPatterns) {
    const match = guideText.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return "Unknown";
}

// Generate HMAC-SHA256 signature for guide proof
async function generateHMAC(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Sign the message
  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate guide proof (SHA256 hash + version)
export async function generateGuideProof(guideText) {
  const hash = await sha256(guideText);
  const version = extractVersion(guideText);
  return {
    sha256: hash,
    version: version,
  };
}

// Get full model name from model identifier and env vars
function getFullModelName(model, env) {
  const modelLower = model.toLowerCase();

  // Map model identifiers to full names
  const modelNames = {
    gemini: env.GEMINI_MODEL || "gemini-2.0-flash",
    claude: env.CLAUDE_MODEL || "claude-opus-4-5-20251101",
    openai: env.OPENAI_MODEL || "gpt-4.1",
    gpt4: env.OPENAI_MODEL || "gpt-4.1",
    grok: env.GROK_MODEL || "grok-4-1-fast-reasoning",
    deepseek: env.DEEPSEEK_MODEL || "deepseek-reasoner",
    "deepseek-r1": env.DEEPSEEK_MODEL || "deepseek-reasoner",
    "deepseek-reasoner": env.DEEPSEEK_MODEL || "deepseek-reasoner",
  };

  // Get the actual model name from env or use default
  const actualModel = modelNames[modelLower] || model;

  // Format for display (capitalize first letter of each word)
  const formatted = actualModel
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formatted;
}

// Generate guide proof with HMAC signature for analysis
// Signature includes analysisId and guide_sha256 to prevent replay attacks
export async function generateGuideProofWithSignature(
  guideText,
  analysisId,
  secret,
  model = null,
  env = null,
) {
  const hash = await sha256(guideText);
  const version = extractVersion(guideText);

  // Create message to sign: {analysisId, guide_sha256}
  const message = JSON.stringify({
    analysisId: analysisId,
    guide_sha256: hash,
  });

  // Generate HMAC signature
  const signature = await generateHMAC(message, secret);

  // Get full model name if model and env provided
  const modelo = model && env ? getFullModelName(model, env) : null;

  return {
    sha256: hash,
    version: version,
    signature: signature,
    modelo: modelo,
  };
}

// Load default (English) guide from KV with fallback to bundled file
export async function getGuide(env) {
  // 1) Try KV first (production)
  if (env.PHILOSIFY_KV) {
    console.log("[Guide] Loading guide from KV...");
    const txt = await env.PHILOSIFY_KV.get("guide_text");

    if (txt) {
      console.log(`[Guide] Loaded guide from KV (${txt.length} chars)`);
      return txt;
    }
    console.warn(
      "[Guide] KV returned empty for guide_text, trying bundled fallback...",
    );
  } else {
    console.warn("[Guide] KV binding not available, using bundled fallback...");
  }

  // 2) Fallback to bundled guide file (local dev mode)
  const bundled = await loadMainGuideText();
  if (bundled) {
    console.log(
      `[Guide] Loaded bundled guide v3.0 LITE (${bundled.length} chars)`,
    );
    return bundled;
  }

  throw new Error("Guide not found in KV and bundled fallback failed");
}

// Load LITE guide from KV (used for quick preview analysis)
export async function getLiteGuide(env) {
  // We do NOT rely on KV for the LITE guide because production KV currently only has `guide_text`.
  // Preview must always use the bundled canonical LITE guide (unless served from Supabase cache).
  const txt = await loadLiteGuideText();

  if (!txt) {
    throw new Error(
      "Bundled LITE guide text is empty (api/guides/Guide_v2.9_LITE.txt)",
    );
  }

  console.log(`[Guide] Loaded bundled LITE guide (${txt.length} chars)`);
  return txt;
}

// Load language-specific guide with fallback to English
// Since Grok is polyglot, we only need ONE guide (English) - it responds in user's language
export async function getGuideForLanguage(env, lang = "en") {
  // All languages use the same guide - Grok is polyglot and responds in user's language
  console.log(`[Guide] Loading guide (polyglot - responds in ${lang})`);

  // Use the main getGuide which has KV + bundled fallback
  return getGuide(env);
}

// ============================================================
// WRAP-UP SOURCE OF TRUTH (KV only, no bundled fallback)
// ============================================================
// Single philosophical reference used exclusively by debate wrap-up:
//   - wrap_up_source_of_truth : the authoritative Source of Truth for AI verdicts
// Gemini analyses debate propositions and comments based on guide_text + this text.

const WRAPUP_KV_KEY = "wrap_up_source_of_truth";

export async function getWrapupSource(env) {
  if (!env.PHILOSIFY_KV) {
    console.warn("[Guide] KV not available — wrap-up source unavailable");
    return "";
  }

  const text = (await env.PHILOSIFY_KV.get(WRAPUP_KV_KEY)) || "";

  console.log(`[Guide] Wrap-up source loaded: ${text.length} chars`);

  return text;
}

// ============================================================
// DEBATE AESTHETIC GUIDE (KV with bundled fallback)
// ============================================================
// Aesthetic Philosophy Framework for Book Reviews & Debate Sessions.
// Based on principles from The Romantic Manifesto.
// Used as a third reference alongside guide_text and wrap_up_source_of_truth.

const DEBATE_AESTHETIC_KV_KEY = "debate_aesthetic_guide";

async function loadDebateAestheticGuideText() {
  // Strategy 1: Wrangler text module import (Cloudflare Workers)
  try {
    const mod =
      await import("../../guides/Aesthetic_Framework_Literature_Debates.txt");
    const txt = typeof mod === "string" ? mod : mod?.default;
    if (txt && txt.length > 100) return txt;
  } catch {
    // not in Workers environment
  }

  // Strategy 2: Node.js fs (Vitest / local dev)
  try {
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const { resolve, dirname } = await import("node:path");
    const here = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(
      here,
      "../../guides/Aesthetic_Framework_Literature_Debates.txt",
    );
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

export async function getDebateAestheticGuide(env) {
  // Try KV first
  if (env.PHILOSIFY_KV) {
    try {
      const text = await env.PHILOSIFY_KV.get(DEBATE_AESTHETIC_KV_KEY);
      if (text && text.length > 100) {
        console.log(
          `[Guide] Debate aesthetic guide loaded from KV: ${text.length} chars`,
        );
        return text;
      }
    } catch (err) {
      console.warn(
        "[Guide] KV read failed for debate aesthetic guide:",
        err.message,
      );
    }
  }

  // Fallback to bundled file
  const fallback = await loadDebateAestheticGuideText();
  if (fallback) {
    console.log(
      `[Guide] Debate aesthetic guide loaded from bundled file: ${fallback.length} chars`,
    );
  } else {
    console.warn(
      "[Guide] Debate aesthetic guide unavailable (KV and bundled fallback both failed)",
    );
  }
  return fallback;
}
