// ============================================================
// SPOTIFY - TOKEN MANAGEMENT (WITH CACHING)
// ============================================================

// In-memory cache
let SPOTIFY_TOKEN_CACHE = { token: null, exp: 0 };

export async function getSpotifyToken(clientId, clientSecret) {
    const now = Date.now();

    // Check cache
    if (SPOTIFY_TOKEN_CACHE.token && SPOTIFY_TOKEN_CACHE.exp > now) {
        return SPOTIFY_TOKEN_CACHE.token;
    }

    // Request new token
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const credentials = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    SPOTIFY_TOKEN_CACHE = {
        token: data.access_token,
        exp: now + (data.expires_in * 1000) - 60000 // -1 min safety
    };

    return data.access_token;
}
