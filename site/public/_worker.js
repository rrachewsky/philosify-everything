// Cloudflare Pages Functions (Single Worker) - SPA fallback
// This ensures deep links like /shared/:id work even when direct uploads
// do not apply Netlify-style `_redirects` rules consistently.
//
// NOTE: this file puts the project in Pages "advanced mode". While it exists,
// Cloudflare IGNORES the entire `functions/` directory — every route must be
// handled here. That is why the Open Graph rewrite below lives in this file
// instead of a `functions/a/[slug].js`.

// The three public permalinks. /a and /shared are the same thing (a shared
// analysis) under two historical prefixes.
const SHARE_PATH = /^\/(a|shared|panel|debate)\/([A-Za-z0-9_-]{4,80})\/?$/;
const CARD_TYPE = { a: 'a', shared: 'a', panel: 'panel', debate: 'debate' };

class MetaRewriter {
  constructor(map) {
    this.map = map;
  }
  element(el) {
    const key = el.getAttribute('property') || el.getAttribute('name');
    const value = this.map[key];
    // HTMLRewriter escapes attribute values on serialization — do not pre-escape.
    if (value) el.setAttribute('content', value);
  }
}

class TitleRewriter {
  constructor(title) {
    this.title = title;
  }
  element(el) {
    el.setInnerContent(this.title);
  }
}

class LangRewriter {
  constructor(lang) {
    this.lang = lang;
  }
  element(el) {
    if (this.lang) el.setAttribute('lang', this.lang);
  }
}

// Open Graph card for a shared analysis, panel or debate.
//
// The crawlers behind WhatsApp, Telegram and Slack do not execute JavaScript:
// they read the served HTML and leave. index.html carries the site's generic
// English slogan, so a Portuguese analysis previewed in English. Here the same
// document is served with its meta tags rewritten from the shared item itself —
// title, verdict and rationale, already in that item's language, so there is no
// translation layer in between to drift.
//
// A preview failure must never cost the visitor the page: every failure path
// returns the untouched document.
async function shareDocument(type, id, url, request, assetFetch) {
  const indexReq = new Request(new URL('/index.html', url.origin).toString(), {
    method: request.method,
    headers: request.headers,
  });
  const assetResponse = await assetFetch(indexReq);

  let preview = null;
  try {
    // A debate is translated on demand and has no language of its own, so the
    // link carries the one it was shared in.
    const lang = url.searchParams.get('lang');
    const api =
      `https://api.philosify.org/api/share-card/${type}/${encodeURIComponent(id)}` +
      (lang ? `?lang=${encodeURIComponent(lang)}` : '');
    const res = await fetch(api, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok && data.title) preview = data;
    }
  } catch {
    preview = null;
  }

  if (!preview) return assetResponse;

  const title = `${preview.title} · Philosify`;
  const description = preview.description || '';
  const canonical = `${url.origin}${url.pathname}`;
  const map = {
    'og:title': title,
    'og:description': description,
    'og:url': canonical,
    'og:type': 'article',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:url': canonical,
    description,
  };

  return new HTMLRewriter()
    .on('html', new LangRewriter(preview.lang))
    .on('title', new TitleRewriter(title))
    .on('meta', new MetaRewriter(map))
    .transform(assetResponse);
}

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

    // Public permalinks get the same document with a localized preview card.
    const share = pathname.match(SHARE_PATH);
    if (share) {
      try {
        return await shareDocument(CARD_TYPE[share[1]], share[2], url, request, assetFetch);
      } catch {
        // fall through to the normal SPA path
      }
    }

    // Don’t rewrite known static assets
    if (
      pathname.startsWith('/assets/') ||
      pathname === '/sw.js' ||
      pathname === '/favicon.ico' ||
      pathname === '/manifest.json' ||
      pathname === '/logo.png' ||
      pathname === '/logo-everything.png' ||
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
