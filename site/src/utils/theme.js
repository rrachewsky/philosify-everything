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

export function setTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // private mode: theme still applies for the session
  }
  document.body.classList.toggle('t-white', theme === 'white');
}

export function toggleTheme() {
  const next = getTheme() === 'white' ? 'dark' : 'white';
  setTheme(next);
  return next;
}

export function initTheme() {
  document.body.classList.toggle('t-white', getTheme() === 'white');
}
