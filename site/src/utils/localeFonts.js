// localeFonts - lazy per-locale Noto fallback loading (Design Law §3)
// Latin-script locales are covered by Michroma/Inter/Newsreader; the
// locales below need a script-specific Noto family behind them. The
// matching font-stack overrides live in styles/v2-foundation.css.

const LOCALE_FONTS = {
  ar: ['Noto Sans Arabic:wght@400;500', 'Noto Naskh Arabic'],
  fa: ['Noto Sans Arabic:wght@400;500', 'Noto Naskh Arabic'],
  he: ['Noto Sans Hebrew:wght@400;500', 'Noto Serif Hebrew'],
  hi: ['Noto Sans Devanagari:wght@400;500', 'Noto Serif Devanagari'],
  ja: ['Noto Sans JP:wght@400;500', 'Noto Serif JP'],
  ko: ['Noto Sans KR:wght@400;500', 'Noto Serif KR'],
  zh: ['Noto Sans SC:wght@400;500', 'Noto Serif SC'],
  ru: ['Noto Serif'],
};

export function ensureLocaleFont(locale) {
  const families = LOCALE_FONTS[locale];
  if (!families) return;
  const id = `locale-fonts-${locale}`;
  if (document.getElementById(id)) return;
  const query = families
    .map((f) => `family=${f.replace(/ /g, '+')}`)
    .join('&');
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  document.head.appendChild(link);
}
