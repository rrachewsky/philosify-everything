// v2 token lint (Roberto's WP4 pass condition, 30 Jul 2026) — any color
// value in a v2 surface that is not defined in tokens.css fails the build
// gate. Allowlist = every color literal that appears in tokens.css itself,
// plus non-color keywords (transparent/currentColor/inherit/none).
// Usage: node scripts/lint-v2-palette.cjs  (or: npm run lint:tokens)
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || path.resolve(__dirname, '..', '..');
const SITE = path.join(ROOT, 'site', 'src');

const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const NAMED = new RegExp(
  '\\b(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blue|brown|chartreuse|chocolate|coral|cornflowerblue|crimson|cyan|darkblue|darkcyan|darkgray|darkgreen|darkgrey|darkmagenta|darkorange|darkred|darkviolet|deeppink|dimgray|dimgrey|firebrick|fuchsia|gainsboro|gold|goldenrod|gray|green|grey|hotpink|indigo|ivory|khaki|lavender|lime|linen|magenta|maroon|navy|olive|orange|orangered|orchid|pink|plum|purple|red|salmon|silver|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|tomato|turquoise|violet|wheat|white|whitesmoke|yellow)\\b',
  'g'
);
// CSS/JSX property contexts where a bare named color is a color (avoids
// matching prose or class names)
const PROP_CTX =
  /(?:^|[;{,\s"'])(?:color|background(?:-color|Color)?|border[a-zA-Z-]*|outline[a-zA-Z-]*|fill|stroke|caret-color|accent-color|box-shadow|boxShadow|text-shadow|textShadow|text-decoration-color)\s*:\s*([^;}\n]+)/g;

const norm = (s) => s.toLowerCase().replace(/\s+/g, '');

// 1. Allowlist from tokens.css
const tokensSrc = fs.readFileSync(path.join(SITE, 'styles', 'tokens.css'), 'utf8');
const allow = new Set((tokensSrc.match(COLOR_LITERAL) || []).map(norm));
['transparent', 'currentcolor', 'inherit', 'none', 'initial', 'unset'].forEach((k) => allow.add(k));

// 2. Files under lint: every v2 surface
const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx?|css)$/.test(e.name)) files.push(p);
  }
};
walk(path.join(SITE, 'components', 'v2'));
walk(path.join(SITE, 'pages', 'v2'));
walk(path.join(SITE, 'styles', 'v2-pages'));
files.push(
  path.join(SITE, 'styles', 'v2-components.css'),
  path.join(SITE, 'pages', 'V2Gallery.jsx'),
  path.join(SITE, 'components', 'common', 'Lockup.jsx')
);

// 3. Scan
const problems = [];
for (const f of files) {
  if (!fs.existsSync(f)) { problems.push(`${f}: MISSING FILE`); continue; }
  const src = fs.readFileSync(f, 'utf8');
  // blank out block + line comments (documentation may cite literals),
  // preserving newlines so reported line numbers stay correct
  const blanked = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  const lines = blanked.split('\n');
  lines.forEach((line, i) => {
    const code = line;
    for (const m of code.match(COLOR_LITERAL) || []) {
      if (!allow.has(norm(m))) {
        problems.push(`${path.relative(ROOT, f)}:${i + 1}  literal ${m}`);
      }
    }
    let pm;
    PROP_CTX.lastIndex = 0;
    while ((pm = PROP_CTX.exec(code)) !== null) {
      const value = pm[1].replace(COLOR_LITERAL, '').replace(/var\([^)]*\)/g, '');
      for (const n of value.match(NAMED) || []) {
        if (!allow.has(norm(n))) {
          problems.push(`${path.relative(ROOT, f)}:${i + 1}  named "${n}" in: ${pm[0].trim().slice(0, 80)}`);
        }
      }
    }
  });
}

if (problems.length) {
  console.error(`FAIL: ${problems.length} color value(s) not defined in tokens.css`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`OK: ${files.length} v2 files scanned — every color value is defined in tokens.css`);
