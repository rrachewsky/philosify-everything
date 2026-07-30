// theme - v2 theme wiring (Design Law §2): dark default, white variant.
// The white theme is body.t-white per tokens.css; old (pre-v2) styles do
// not consume the tokens, so this is inert until v2 surfaces mount.

const STORAGE_KEY = 'philosify_theme';

export function getTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'white' ? 'white' : 'dark';
  } catch {
    return 'dark';
  }
}

// index.html paints the first frame black via an inline html/body rule;
// the white theme has to repaint that canvas or overscroll stays dark.
function paintCanvas(theme) {
  document.documentElement.style.background = theme === 'white' ? '#FFFFFF' : '#070708';
}

export function setTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // private mode: theme still applies for the session
  }
  document.body.classList.toggle('t-white', theme === 'white');
  paintCanvas(theme);
  // theme-aware components (brand lockup src swap) re-render on this
  window.dispatchEvent(new CustomEvent('philosify-theme', { detail: theme }));
}

export function toggleTheme() {
  const next = getTheme() === 'white' ? 'dark' : 'white';
  setTheme(next);
  return next;
}

export function initTheme() {
  const theme = getTheme();
  document.body.classList.toggle('t-white', theme === 'white');
  paintCanvas(theme);
}
