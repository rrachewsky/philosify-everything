// useSharedContentLanguage — a shared permalink is read in the language its
// content was GENERATED in, which is the language of whoever shared it.
//
// Roberto's rule (2 Aug 2026): the card and the shared page stay in the
// generation language; a visitor who wants another language chooses it and asks
// for a fresh analysis, because there is no translation layer and there is not
// meant to be one. So this override applies to the shared view only — the
// visitor's own preference for the rest of the site must survive untouched.
//
// That last part is the reason this hook exists instead of a bare
// changeLanguage call: i18n/config.js persists EVERY language change to
// localStorage.preferredLanguage from its `languageChanged` listener. Before
// this, one visit to a shared Portuguese link switched the visitor's whole site
// to Portuguese permanently. Here the previous value is captured first and put
// back after the change — including putting back "absent", for a visitor who
// had never chosen a language at all.

import { useEffect } from 'react';
import i18n, { changeLanguageWithPreload, SUPPORTED_LANGUAGES } from '../i18n/config.js';
import { logger } from '../utils';

const STORAGE_KEY = 'preferredLanguage';

const normalize = (lang) =>
  String(lang || '')
    .toLowerCase()
    .split(/[-_]/)[0]
    .trim();

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // private mode / blocked storage
  }
}

// Undo what the languageChanged listener just wrote. `null` means the visitor
// had no preference stored, so leaving one behind would itself be a change.
function restorePreference(value) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function useSharedContentLanguage(contentLang) {
  const target = normalize(contentLang);

  useEffect(() => {
    if (!target || !SUPPORTED_LANGUAGES.includes(target)) return undefined;
    if (target === normalize(i18n.language)) return undefined;

    const previousLang = i18n.language;
    const previousPreference = readPreference();

    changeLanguageWithPreload(target)
      .then(() => restorePreference(previousPreference))
      .catch((err) => {
        logger.error('[sharedLang] Could not switch to the content language:', err);
        restorePreference(previousPreference);
      });

    return () => {
      // Only hand the language back if it is still the one we imposed; if the
      // visitor picked something else while reading, that choice is theirs.
      if (normalize(i18n.language) !== target) return;

      changeLanguageWithPreload(previousPreference || previousLang)
        .then(() => restorePreference(previousPreference))
        .catch(() => restorePreference(previousPreference));
    };
  }, [target]);
}

export default useSharedContentLanguage;
