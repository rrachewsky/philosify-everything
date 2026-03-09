// Cloudflare Pages Functions (Single Worker) - SPA fallback
// This ensures deep links like /shared/:id work even when direct uploads
// do not apply Netlify-style `_redirects` rules consistently.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    // In Cloudflare Pages, fetching static assets from within a Pages Worker must use env.ASSETS.fetch,
    // otherwise `fetch()` will recursively call this Worker and can trigger compute errors.
    const assetFetch =
      env && env.ASSETS && typeof env.ASSETS.fetch === 'function'
        ? env.ASSETS.fetch.bind(env.ASSETS)
        : fetch;

    // Block sourcemaps at the edge (defense-in-depth)
    if (pathname.endsWith('.map')) {
      return new Response('Not Found', { status: 404 });
    }

    // Only apply SPA fallback to GET/HEAD navigation requests
    if (method !== 'GET' && method !== 'HEAD') {
      return assetFetch(request);
    }

    // Don’t rewrite known static assets
    if (
      pathname.startsWith('/assets/') ||
      pathname === '/sw.js' ||
      pathname === '/favicon.ico' ||
      pathname === '/manifest.json' ||
      pathname === '/logo.png' ||
      pathname === '/philosify-logo.svg' ||
      pathname === '/philosify-og.svg' ||
      pathname === '/browserconfig.xml'
    ) {
      return assetFetch(request);
    }

    // If it looks like a file request (has an extension), don't rewrite
    if (/\.[a-z0-9]+$/i.test(pathname)) {
      return assetFetch(request);
    }

    // Try normal fetch first (in case a real route/file exists)
    const res = await assetFetch(request);
    if (res.status !== 404) return res;

    // SPA fallback: serve index.html
    const indexUrl = new URL('/index.html', url.origin);
    const indexReq = new Request(indexUrl.toString(), {
      method,
      headers: request.headers,
    });
    return assetFetch(indexReq);
  },
};


