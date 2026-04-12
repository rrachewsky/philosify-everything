// ============================================================
// ADS PLATFORM - CREATIVE UPLOAD & AI GENERATION HANDLERS
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getSecret } from '../../utils/secrets.js';
import { getAdvertiserFromRequest } from './utils.js';

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

// Magic byte signatures for file type verification
const MAGIC_BYTES = {
  'image/png':  [0x89, 0x50, 0x4E, 0x47],  // .PNG
  'image/jpeg': [0xFF, 0xD8, 0xFF],          // JFIF
  'image/jpg':  [0xFF, 0xD8, 0xFF],          // JFIF (alias)
  'image/gif':  [0x47, 0x49, 0x46],          // GIF
  'image/webp': [0x52, 0x49, 0x46, 0x46],    // RIFF (WebP)
};

/**
 * POST /api/ads/creatives/upload
 * Upload creative to R2
 */
export async function handleUploadCreative(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Parse multipart form data
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return jsonResponse({ error: 'Content-Type must be multipart/form-data' }, 400, corsHeaders);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: 'No file provided' }, 400, corsHeaders);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonResponse({ 
        error: 'Invalid file type. Allowed: PNG, JPG, GIF, WebP' 
      }, 400, corsHeaders);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: 'File too large. Maximum size is 2MB' }, 400, corsHeaders);
    }

    // Magic byte validation: verify file content matches declared MIME type
    const fileBuffer = await file.arrayBuffer();
    const header = new Uint8Array(fileBuffer).slice(0, 12);
    const expected = MAGIC_BYTES[file.type];
    if (expected) {
      const matches = expected.every((byte, i) => header[i] === byte);
      if (!matches) {
        return jsonResponse({
          error: 'File content does not match declared type'
        }, 400, corsHeaders);
      }
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `ads/${advertiser.id}/${crypto.randomUUID()}.${ext}`;

    // Upload to R2 (using TTS_CACHE bucket, ads go in /ads/ folder)
    await env.TTS_CACHE.put(filename, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      customMetadata: {
        advertiserId: advertiser.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        'X-Content-Type-Options': 'nosniff',
      },
    });

    // Construct proxy URL (R2 stays private, images served through API)
    const apiBase = env.API_BASE_URL || 'https://api.philosify.org';
    const proxyUrl = `${apiBase}/api/ads/media/${filename}`;

    return jsonResponse({ 
      url: proxyUrl,
      filename,
      size: file.size,
      type: file.type,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Upload creative error:', err);
    return jsonResponse({ error: 'Failed to upload creative' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/media/*
 * Proxy R2 images through the API. No direct public R2 access needed.
 * - Active campaign creatives: public (users see ads)
 * - Draft/review creatives: public (simpler than per-image auth, images are just PNGs)
 * The bucket itself stays private. Only the ads/ prefix is served.
 */
export async function handleServeCreativeMedia(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    // Extract the path after /api/ads/media/
    const mediaPath = url.pathname.replace(/^\/api\/ads\/media\//, '');

    if (!mediaPath || !mediaPath.startsWith('ads/')) {
      return new Response('Not found', { status: 404 });
    }

    // Prevent path traversal
    if (mediaPath.includes('..') || mediaPath.includes('//')) {
      return new Response('Forbidden', { status: 403 });
    }

    const object = await env.TTS_CACHE.get(mediaPath);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
    headers.set('Cache-Control', 'public, max-age=86400'); // 1 day cache
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(object.body, { status: 200, headers });
  } catch (err) {
    console.error('[Ads] Serve media error:', err);
    return new Response('Internal error', { status: 500 });
  }
}

/**
 * DELETE /api/ads/creatives/:filename
 * Delete creative from R2 (optional cleanup)
 */
export async function handleDeleteCreative(request, env, corsHeaders, filename) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Verify the file belongs to this advertiser
    const fullPath = `ads/${advertiser.id}/${filename}`;
    
    const object = await env.TTS_CACHE.head(fullPath);
    if (!object) {
      return jsonResponse({ error: 'File not found' }, 404, corsHeaders);
    }

    // Delete from R2
    await env.TTS_CACHE.delete(fullPath);

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Delete creative error:', err);
    return jsonResponse({ error: 'Failed to delete creative' }, 500, corsHeaders);
  }
}

// ============================================================
// CONTENT MODERATION — BRIEF GUARDRAILS
// ============================================================
// Rejects briefs that violate platform policy before they reach
// the image generation API. Two layers:
//   1. OpenAI Moderation API (free, catches illegal/harmful)
//   2. Platform-specific keyword + AI policy review
// ============================================================

const BLOCKED_CATEGORIES = [
  'sexual', 'sexual/minors', 'violence', 'violence/graphic',
  'self-harm', 'self-harm/intent', 'self-harm/instructions',
  'harassment', 'harassment/threatening', 'hate', 'hate/threatening',
];

// Platform-specific terms that are never acceptable in ad briefs
const BLOCKED_KEYWORDS = [
  // Child exploitation
  'child', 'children', 'minor', 'underage', 'loli', 'pedo', 'pedophil',
  // Pornographic / explicit sexual
  'porn', 'xxx', 'nude', 'naked', 'erotic', 'hentai', 'fetish', 'orgasm',
  'genitalia', 'intercourse', 'sexually explicit',
  // Extreme violence
  'gore', 'dismember', 'torture', 'mutilat', 'beheading', 'massacre',
  // Drugs & illegal substances
  'cocaine', 'heroin', 'methamphetamine', 'fentanyl', 'drug dealer',
  // Hate / extremism
  'supremacist', 'nazi', 'genocide', 'ethnic cleansing', 'jihad',
  // Weapons
  'assault rifle', 'bomb making', 'explosive', 'firearm sale',
  // Scams
  'get rich quick', 'ponzi', 'pyramid scheme', 'nigerian prince',
];

// Categories that Philosify Ads explicitly does not promote
const POLICY_RESTRICTED = [
  'religious proselytizing', 'religious conversion', 'cult recruitment',
  'nihilistic messaging', 'self-destruction', 'promiscuous lifestyle promotion',
  'political propaganda', 'election interference', 'misinformation',
  'gambling', 'casino', 'betting', 'lottery',
  'tobacco', 'vaping', 'e-cigarette',
  'cryptocurrency pump', 'token sale', 'ico',
];

/**
 * Moderate a creative brief. Returns { safe: boolean, reason?: string }.
 * Called before AI generation and at campaign creation.
 */
export async function moderateBrief(env, brief, brandName = '') {
  const combined = `${brief} ${brandName}`.toLowerCase();

  // Layer 1: Keyword blocklist (instant, no API call)
  for (const term of BLOCKED_KEYWORDS) {
    if (combined.includes(term.toLowerCase())) {
      console.warn(`[Ads Moderation] Blocked keyword: "${term}" in brief`);
      return { safe: false, reason: `Content violates advertising policy. Prohibited term detected.` };
    }
  }

  // Layer 1b: Policy-restricted categories
  for (const term of POLICY_RESTRICTED) {
    if (combined.includes(term.toLowerCase())) {
      console.warn(`[Ads Moderation] Policy-restricted: "${term}" in brief`);
      return { safe: false, reason: `Content is restricted under Philosify advertising policy.` };
    }
  }

  // Layer 2: OpenAI Moderation API (free, catches nuanced harmful content)
  try {
    const openaiKey = await getSecret(env.OPENAI_API_KEY);

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: `Ad creative brief for "${brandName}": ${brief}` }),
    });

    if (response.ok) {
      const data = await response.json();
      const result = data.results?.[0];

      if (result?.flagged) {
        const flagged = Object.entries(result.categories || {})
          .filter(([cat, val]) => val && BLOCKED_CATEGORIES.includes(cat))
          .map(([cat]) => cat);

        if (flagged.length > 0) {
          console.warn(`[Ads Moderation] OpenAI flagged: ${flagged.join(', ')}`);
          return { safe: false, reason: `Content flagged for: ${flagged.join(', ')}. Please revise your brief.` };
        }
      }
    }
  } catch (err) {
    // Moderation API failure is not a blocker — keyword check already passed
    console.warn('[Ads Moderation] OpenAI moderation API error:', err.message);
  }

  return { safe: true };
}

// ============================================================
// AI CREATIVE GENERATION (DALL-E 3)
// ============================================================

const PLACEMENT_SIZES = {
  sidebar: { w: 300, h: 250, label: '300x250 sidebar ad' },
  constellation: { w: 250, h: 250, label: '250x250 constellation panel ad' },
};

/**
 * Generate ad creative using DALL-E 3, upload to R2, return public URL.
 * Called automatically after payment for creative_type='philosify' plans.
 *
 * @param {object} env - Worker env
 * @param {object} options
 * @param {string} options.advertiserId - Advertiser UUID
 * @param {string} options.brief - Creative brief from the advertiser
 * @param {string} options.brandName - Company name
 * @param {string} options.targetUrl - Destination URL
 * @param {string} options.placement - 'sidebar' or 'constellation'
 * @returns {Promise<{url: string, filename: string} | null>}
 */
export async function generateAICreative(env, options) {
  const { advertiserId, brief, brandName, targetUrl, placement } = options;
  const size = PLACEMENT_SIZES[placement] || PLACEMENT_SIZES.sidebar;

  try {
    // Guardrail: moderate brief before generating
    const moderation = await moderateBrief(env, brief || '', brandName || '');
    if (!moderation.safe) {
      console.warn(`[Ads AI] Brief rejected for ${advertiserId}: ${moderation.reason}`);
      return null;
    }

    const openaiKey = await getSecret(env.OPENAI_API_KEY);

    const prompt = buildCreativePrompt({ brief, brandName, targetUrl, size });

    console.log(`[Ads AI] Generating creative for ${advertiserId}, placement: ${placement}`);

    // DALL-E 3 generates 1024x1024 — we use square and let the browser scale
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Ads AI] DALL-E error:', errText);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      console.error('[Ads AI] No image URL in response');
      return null;
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('[Ads AI] Failed to download generated image');
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const filename = `ads/${advertiserId}/ai-${crypto.randomUUID()}.png`;

    // Upload to R2
    await env.TTS_CACHE.put(filename, imageBuffer, {
      httpMetadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      },
      customMetadata: {
        advertiserId,
        generatedBy: 'dall-e-3',
        placement,
        brief: (brief || '').slice(0, 200),
        createdAt: new Date().toISOString(),
      },
    });

    const apiBase = env.API_BASE_URL || 'https://api.philosify.org';
    const proxyUrl = `${apiBase}/api/ads/media/${filename}`;

    console.log(`[Ads AI] Creative generated: ${proxyUrl}`);
    return { url: proxyUrl, filename };
  } catch (err) {
    console.error('[Ads AI] Generation error:', err);
    return null;
  }
}

function buildCreativePrompt({ brief, brandName, targetUrl, size }) {
  return `Design a clean, professional visual background for a digital advertisement banner.

BRAND: "${brandName}"
BRIEF FROM ADVERTISER: ${brief || 'Create a visually appealing brand awareness visual.'}

CRITICAL RULES:
- DO NOT include ANY text, letters, words, numbers, URLs, or typography in the image
- DO NOT render brand names, slogans, buttons, or call-to-action text
- The image must be PURELY VISUAL — all text will be added separately as a perfect overlay
- This is a ${size.label} for a philosophy and culture platform

VISUAL STYLE:
- Modern, premium aesthetic
- Abstract, geometric, or artistic style — NO photorealistic human faces
- Professional color palette that stands out on a dark background (#07111f)
- Leave space at the top and bottom edges for text overlay (brand name at top, CTA at bottom)
- Clean composition with visual breathing room
- The design should evoke the brand's identity through color, shape, and mood — not through words`;
}
