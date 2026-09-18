// ThemeBar - landing theme switch (Black / White), wired to utils/theme.
// Ruling 17 Sep 2026: the switch lives INLINE in the landing footer (it
// used to float fixed at the viewport bottom and covered cards and footer
// links while scrolling). `variant` is the placement class.
import { useState } from 'react';
import { getTheme, setTheme } from '../../utils/theme';

export function ThemeBar({ variant = 'inline' }) {
  const [theme, setLocal] = useState(getTheme());
  const pick = (t) => {
    setTheme(t);
    setLocal(t);
  };
  return (
    <div className={`themebar ${variant}`} role="group" aria-label="Background theme">
      <button className={theme === 'dark' ? 'on' : ''} onClick={() => pick('dark')}>
        Black
      </button>
      <button className={theme === 'white' ? 'on' : ''} onClick={() => pick('white')}>
        White
      </button>
    </div>
  );
}
