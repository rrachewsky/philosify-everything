// ThemeBar - landing theme switch (Black / White), wired to utils/theme
import { useState } from 'react';
import { getTheme, setTheme } from '../../utils/theme';

export function ThemeBar() {
  const [theme, setLocal] = useState(getTheme());
  const pick = (t) => {
    setTheme(t);
    setLocal(t);
  };
  return (
    <div className="themebar" role="group" aria-label="Background theme">
      <button className={theme === 'dark' ? 'on' : ''} onClick={() => pick('dark')}>
        Black
      </button>
      <button className={theme === 'white' ? 'on' : ''} onClick={() => pick('white')}>
        White
      </button>
    </div>
  );
}
