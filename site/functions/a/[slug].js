// Cloudflare Pages Function — Open Graph card for a shared analysis.
//
// philosify.org is served by Pages, which returns the static index.html for
// every path (`/* /index.html 200`). That file carries the site's generic
// English slogan, so a Portuguese analysis shared on WhatsApp previewed in
// English (defect reported 31 Jul). Only /a/* is intercepted here; every
// other route keeps its static path untouched.
//
// The SPA still boots normally: this returns the same index.html, with the
// meta tags rewritten on the way out. Humans and crawlers get one document.
//
// The description is the analysis's own opening text, already in the analysis
// language, so no translation layer exists to drift.

const escapeAttr = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

class MetaRewriter {
  constructor(map) {
    this.map = map;
  }
  element(el) {
    const key = el.getAttribute('property') || el.getAttribute('name');
    const value = this.map[key];
    if (value) el.setAttribute('content', value);
  }
}

class TitleRewriter {
  constructor(title) {
    this.title = title;
    this.replaced = false;
  }
  element(el) {
    el.setInnerContent(this.title);
    this.replaced = true;
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

export async function onRequestGet(context) {
  const { request, params, env } = context;

  // Always resolve the SPA document first; a preview failure must never cost
  // the visitor the page itself.
  const url = new URL(request.url);
  const assetResponse = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));

  let preview = null;
  try {
    const api = 'https://api.philosify.org/api/share-preview/a/' + encodeURIComponent(params.slug);
    const res = await fetch(api, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) preview = data;
    }
  } catch {
    preview = null;
  }

  if (!preview || !preview.title) return assetResponse;

  const title = escapeAttr(`${preview.title} | Philosify`);
  const description = escapeAttr(preview.description || '');
  const canonical = `${url.origin}/a/${params.slug}`;

  const map = {
    'og:title': title,
    'og:description': description,
    'og:url': canonical,
    'og:type': 'article',
    'twitter:title': title,
    'twitter:description': description,
    description,
  };

  return new HTMLRewriter()
    .on('html', new LangRewriter(preview.lang))
    .on('title', new TitleRewriter(`${preview.title} | Philosify`))
    .on('meta', new MetaRewriter(map))
    .transform(assetResponse);
}
