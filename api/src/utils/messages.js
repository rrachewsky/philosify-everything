// ============================================================
// LOCALIZED ERROR MESSAGES
// ============================================================
// User-facing error messages in all 12 supported languages

const ERROR_MESSAGES = {
  en: {
    lyricsNotFound: (song, artist) => `Lyrics for "${song}" by "${artist}" were not found or are invalid.`,
    lyricsTooShort: (song, artist) => `Lyrics for "${song}" by "${artist}" are too short or contain invalid content.`,
    guideNotLoaded: () => `Analysis system temporarily unavailable. Please try again.`,
  },
  pt: {
    lyricsNotFound: (song, artist) => `A letra de "${song}" por "${artist}" não foi encontrada ou é inválida.`,
    lyricsTooShort: (song, artist) => `A letra de "${song}" por "${artist}" é muito curta ou contém conteúdo inválido.`,
    guideNotLoaded: () => `Sistema de análise temporariamente indisponível. Tente novamente.`,
  },
  es: {
    lyricsNotFound: (song, artist) => `La letra de "${song}" de "${artist}" no fue encontrada o es inválida.`,
    lyricsTooShort: (song, artist) => `La letra de "${song}" de "${artist}" es muy corta o contiene contenido inválido.`,
    guideNotLoaded: () => `Sistema de análisis temporalmente no disponible. Inténtelo de nuevo.`,
  },
  de: {
    lyricsNotFound: (song, artist) => `Der Text von "${song}" von "${artist}" wurde nicht gefunden oder ist ungültig.`,
    lyricsTooShort: (song, artist) => `Der Text von "${song}" von "${artist}" ist zu kurz oder enthält ungültigen Inhalt.`,
    guideNotLoaded: () => `Analysesystem vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut.`,
  },
  fr: {
    lyricsNotFound: (song, artist) => `Les paroles de "${song}" par "${artist}" n'ont pas été trouvées ou sont invalides.`,
    lyricsTooShort: (song, artist) => `Les paroles de "${song}" par "${artist}" sont trop courtes ou contiennent un contenu invalide.`,
    guideNotLoaded: () => `Système d'analyse temporairement indisponible. Veuillez réessayer.`,
  },
  it: {
    lyricsNotFound: (song, artist) => `Il testo di "${song}" di "${artist}" non è stato trovato o non è valido.`,
    lyricsTooShort: (song, artist) => `Il testo di "${song}" di "${artist}" è troppo corto o contiene contenuto non valido.`,
    guideNotLoaded: () => `Sistema di analisi temporaneamente non disponibile. Riprova.`,
  },
  hu: {
    lyricsNotFound: (song, artist) => `A "${song}" (${artist}) dalszövege nem található vagy érvénytelen.`,
    lyricsTooShort: (song, artist) => `A "${song}" (${artist}) dalszövege túl rövid vagy érvénytelen tartalmat tartalmaz.`,
    guideNotLoaded: () => `Az elemző rendszer átmenetileg nem érhető el. Kérjük, próbálja újra.`,
  },
  ru: {
    lyricsNotFound: (song, artist) => `Текст песни "${song}" исполнителя "${artist}" не найден или недействителен.`,
    lyricsTooShort: (song, artist) => `Текст песни "${song}" исполнителя "${artist}" слишком короткий или содержит недопустимый контент.`,
    guideNotLoaded: () => `Система анализа временно недоступна. Пожалуйста, попробуйте снова.`,
  },
  ja: {
    lyricsNotFound: (song, artist) => `「${song}」（${artist}）の歌詞が見つからないか、無効です。`,
    lyricsTooShort: (song, artist) => `「${song}」（${artist}）の歌詞が短すぎるか、無効なコンテンツが含まれています。`,
    guideNotLoaded: () => `分析システムは一時的に利用できません。もう一度お試しください。`,
  },
  zh: {
    lyricsNotFound: (song, artist) => `未找到"${song}"（${artist}）的歌词或歌词无效。`,
    lyricsTooShort: (song, artist) => `"${song}"（${artist}）的歌词太短或包含无效内容。`,
    guideNotLoaded: () => `分析系统暂时不可用。请重试。`,
  },
  ko: {
    lyricsNotFound: (song, artist) => `"${song}" (${artist})의 가사를 찾을 수 없거나 유효하지 않습니다.`,
    lyricsTooShort: (song, artist) => `"${song}" (${artist})의 가사가 너무 짧거나 유효하지 않은 내용이 포함되어 있습니다.`,
    guideNotLoaded: () => `분석 시스템을 일시적으로 사용할 수 없습니다. 다시 시도해 주세요.`,
  },
  he: {
    lyricsNotFound: (song, artist) => `מילות השיר "${song}" של "${artist}" לא נמצאו או אינן תקינות.`,
    lyricsTooShort: (song, artist) => `מילות השיר "${song}" של "${artist}" קצרות מדי או מכילות תוכן לא תקין.`,
    guideNotLoaded: () => `מערכת הניתוח אינה זמינה באופן זמני. אנא נסה שוב.`,
  },
};

/**
 * Get localized error message
 * @param {string} lang - Language code (en, pt, es, etc.)
 * @param {string} key - Message key (lyricsNotFound, lyricsTooShort, etc.)
 * @param {...any} args - Arguments to pass to the message function
 * @returns {string} Localized message (falls back to English if not found)
 */
export function getMessage(lang, key, ...args) {
  const messages = ERROR_MESSAGES[lang] || ERROR_MESSAGES['en'];
  const messageFn = messages[key] || ERROR_MESSAGES['en'][key];

  if (typeof messageFn === 'function') {
    return messageFn(...args);
  }

  // Fallback if key doesn't exist
  return ERROR_MESSAGES['en'][key]?.(...args) || `Error: ${key}`;
}
