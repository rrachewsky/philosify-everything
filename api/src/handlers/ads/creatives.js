// ============================================================
// ADS PLATFORM - CREATIVE UPLOAD HANDLERS
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
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

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `ads/${advertiser.id}/${crypto.randomUUID()}.${ext}`;

    // Upload to R2 (using TTS_CACHE bucket, ads go in /ads/ folder)
    const arrayBuffer = await file.arrayBuffer();
    
    await env.TTS_CACHE.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      customMetadata: {
        advertiserId: advertiser.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Construct public URL
    const publicUrl = `${env.R2_PUBLIC_URL || 'https://cdn.philosify.org'}/${filename}`;

    return jsonResponse({ 
      url: publicUrl,
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
