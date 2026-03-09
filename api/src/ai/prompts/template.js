// ============================================================
// AI - PROMPT BUILDER (220 lines - extracted from monolith)
// ============================================================

export function buildAnalysisPrompt(
  song,
  artist,
  lyrics,
  metadata,
  guide,
  lang = "en",
) {
  // Probable School of Thought disclaimer (localized) - enforced server-side
  const probableSchoolDisclaimerByLang = {
    en: "School of Thought is a supposition based on probability. It may not be as accurate as you are expecting.",
    pt: "Escola de Pensamento é uma suposição baseada em probabilidade. Pode não ser tão precisa quanto você espera.",
    es: "La Escuela de Pensamiento es una suposición basada en probabilidad. Puede no ser tan precisa como esperas.",
    fr: "L'École de pensée est une supposition fondée sur la probabilité. Elle peut ne pas être aussi précise que vous l'espérez.",
    de: "Die Denkschule ist eine Annahme auf Basis von Wahrscheinlichkeit. Sie ist möglicherweise nicht so präzise, wie Sie erwarten.",
    it: "La Scuola di pensiero è una supposizione basata sulla probabilità. Potrebbe non essere precisa quanto ti aspetti.",
    hu: "A gondolkodási iskola valószínűségen alapuló feltételezés. Lehet, hogy nem olyan pontos, mint várnád.",
    ru: "Школа мысли — это предположение, основанное на вероятности. Оно может быть не таким точным, как вы ожидаете.",
    ja: "思想学派は確率に基づく推測です。期待するほど正確ではない場合があります。",
    zh: "思想学派是基于概率的推测。它可能不如您期望的那样准确。",
    ko: "사상 학파는 확률에 기반한 추측입니다. 기대만큼 정확하지 않을 수 있습니다.",
    he: "אסכולת המחשבה היא השערה המבוססת על הסתברות. ייתכן שהיא לא מדויקת כפי שאתה מצפה.",
    ar: "مدرسة الفكر هي افتراض قائم على الاحتمالية. قد لا تكون دقيقة كما تتوقع.",
    hi: "विचार का स्कूल संभावना पर आधारित एक अनुमान है। यह उतना सटीक नहीं हो सकता जितना आप उम्मीद कर रहे हैं।",
    fa: "مکتب فکری یک فرض بر اساس احتمال است. ممکن است به اندازه‌ای که انتظار دارید دقیق نباشد.",
  };
  const probableSchoolDisclaimer =
    probableSchoolDisclaimerByLang[String(lang || "en").toLowerCase()] ||
    probableSchoolDisclaimerByLang.en;
  const probableSchoolPrefixByLang = {
    en: "Probable School of Thought",
    pt: "Escola de Pensamento (provável)",
    es: "Escuela de Pensamiento (probable)",
    fr: "École de pensée (probable)",
    de: "Denkschule (wahrscheinlich)",
    it: "Scuola di pensiero (probabile)",
    hu: "Valószínű gondolkodási iskola",
    ru: "Вероятная школа мысли",
    ja: "推定される思想学派",
    zh: "可能的思想学派",
    ko: "추정 사상 학파",
    he: "אסכולת מחשבה משוערת",
    ar: "مدرسة الفكر المحتملة",
    hi: "संभावित विचार स्कूल",
    fa: "مکتب فکری احتمالی",
  };
  const probableSchoolPrefix =
    probableSchoolPrefixByLang[String(lang || "en").toLowerCase()] ||
    probableSchoolPrefixByLang.en;

  // Schools of Thought labels (localized)
  const schoolLabels = {
    en: {
      primary: "Primary",
      secondary: "Secondary",
      peripheral: "Peripheral",
      exclusions: "Exclusions",
      not: "NOT",
      evidence: "Evidence",
      metaphysics: "Metaphysics",
      epistemology: "Epistemology",
      ethics: "Ethics",
      politics: "Politics",
      aesthetics: "Aesthetics",
    },
    pt: {
      primary: "Primário",
      secondary: "Secundário",
      peripheral: "Periférico",
      exclusions: "Exclusões",
      not: "NÃO",
      evidence: "Evidência",
      metaphysics: "Metafísica",
      epistemology: "Epistemologia",
      ethics: "Ética",
      politics: "Política",
      aesthetics: "Estética",
    },
    es: {
      primary: "Primario",
      secondary: "Secundario",
      peripheral: "Periférico",
      exclusions: "Exclusiones",
      not: "NO",
      evidence: "Evidencia",
      metaphysics: "Metafísica",
      epistemology: "Epistemología",
      ethics: "Ética",
      politics: "Política",
      aesthetics: "Estética",
    },
    fr: {
      primary: "Primaire",
      secondary: "Secondaire",
      peripheral: "Périphérique",
      exclusions: "Exclusions",
      not: "PAS",
      evidence: "Preuve",
      metaphysics: "Métaphysique",
      epistemology: "Épistémologie",
      ethics: "Éthique",
      politics: "Politique",
      aesthetics: "Esthétique",
    },
    de: {
      primary: "Primär",
      secondary: "Sekundär",
      peripheral: "Peripher",
      exclusions: "Ausschlüsse",
      not: "NICHT",
      evidence: "Beleg",
      metaphysics: "Metaphysik",
      epistemology: "Erkenntnistheorie",
      ethics: "Ethik",
      politics: "Politik",
      aesthetics: "Ästhetik",
    },
    it: {
      primary: "Primario",
      secondary: "Secondario",
      peripheral: "Periferico",
      exclusions: "Esclusioni",
      not: "NON",
      evidence: "Evidenza",
      metaphysics: "Metafisica",
      epistemology: "Epistemologia",
      ethics: "Etica",
      politics: "Politica",
      aesthetics: "Estetica",
    },
    hu: {
      primary: "Elsődleges",
      secondary: "Másodlagos",
      peripheral: "Perifériás",
      exclusions: "Kizárások",
      not: "NEM",
      evidence: "Bizonyíték",
      metaphysics: "Metafizika",
      epistemology: "Ismeretelmélet",
      ethics: "Etika",
      politics: "Politika",
      aesthetics: "Esztétika",
    },
    ru: {
      primary: "Первичная",
      secondary: "Вторичная",
      peripheral: "Периферийная",
      exclusions: "Исключения",
      not: "НЕ",
      evidence: "Доказательство",
      metaphysics: "Метафизика",
      epistemology: "Эпистемология",
      ethics: "Этика",
      politics: "Политика",
      aesthetics: "Эстетика",
    },
    ja: {
      primary: "主要",
      secondary: "副次的",
      peripheral: "周辺的",
      exclusions: "除外",
      not: "非",
      evidence: "証拠",
      metaphysics: "形而上学",
      epistemology: "認識論",
      ethics: "倫理学",
      politics: "政治学",
      aesthetics: "美学",
    },
    zh: {
      primary: "主要",
      secondary: "次要",
      peripheral: "边缘",
      exclusions: "排除",
      not: "非",
      evidence: "证据",
      metaphysics: "形而上学",
      epistemology: "认识论",
      ethics: "伦理学",
      politics: "政治学",
      aesthetics: "美学",
    },
    ko: {
      primary: "주요",
      secondary: "부차적",
      peripheral: "주변적",
      exclusions: "제외",
      not: "아님",
      evidence: "증거",
      metaphysics: "형이상학",
      epistemology: "인식론",
      ethics: "윤리학",
      politics: "정치학",
      aesthetics: "미학",
    },
    he: {
      primary: "ראשי",
      secondary: "משני",
      peripheral: "היקפי",
      exclusions: "החרגות",
      not: "לא",
      evidence: "ראיה",
      metaphysics: "מטאפיזיקה",
      epistemology: "אפיסטמולוגיה",
      ethics: "אתיקה",
      politics: "פוליטיקה",
      aesthetics: "אסתטיקה",
    },
    ar: {
      primary: "أساسي",
      secondary: "ثانوي",
      peripheral: "هامشي",
      exclusions: "استثناءات",
      not: "ليس",
      evidence: "دليل",
      metaphysics: "ميتافيزيقا",
      epistemology: "نظرية المعرفة",
      ethics: "أخلاق",
      politics: "سياسة",
      aesthetics: "جماليات",
    },
    hi: {
      primary: "प्राथमिक",
      secondary: "द्वितीयक",
      peripheral: "परिधीय",
      exclusions: "बहिष्करण",
      not: "नहीं",
      evidence: "साक्ष्य",
      metaphysics: "तत्वमीमांसा",
      epistemology: "ज्ञानमीमांसा",
      ethics: "नीतिशास्त्र",
      politics: "राजनीति",
      aesthetics: "सौंदर्यशास्त्र",
    },
    fa: {
      primary: "اصلی",
      secondary: "ثانویه",
      peripheral: "حاشیه‌ای",
      exclusions: "استثناها",
      not: "نه",
      evidence: "شواهد",
      metaphysics: "متافیزیک",
      epistemology: "معرفت‌شناسی",
      ethics: "اخلاق",
      politics: "سیاست",
      aesthetics: "زیبایی‌شناسی",
    },
  };
  const L_schools =
    schoolLabels[String(lang || "en").toLowerCase()] || schoolLabels.en;

  // Language code to name mapping (must match frontend i18n/config.js)
  const langNames = {
    en: "English",
    pt: "Portuguese",
    es: "Spanish",
    de: "German",
    fr: "French",
    it: "Italian",
    hu: "Hungarian",
    ru: "Russian",
    ja: "Japanese",
    zh: "Chinese",
    ko: "Korean",
    he: "Hebrew",
    ar: "Arabic",
    hi: "Hindi",
    fa: "Farsi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
  };

  const targetLanguage = langNames[lang] || "English";

  // Detect lyrics language (simple)
  const lyricsLowerCase = lyrics.toLowerCase();
  let lyricsLanguage = "Unknown";

  // Common words by language
  const ptWords = [
    "que",
    "de",
    "para",
    "com",
    "não",
    "uma",
    "você",
    "seu",
    "ele",
    "ela",
  ];
  const enWords = [
    "the",
    "you",
    "and",
    "are",
    "not",
    "your",
    "that",
    "with",
    "this",
    "have",
  ];
  const esWords = [
    "que",
    "de",
    "para",
    "con",
    "una",
    "los",
    "las",
    "eres",
    "tiene",
    "cuando",
  ];

  const ptCount = ptWords.filter((w) =>
    lyricsLowerCase.includes(` ${w} `),
  ).length;
  const enCount = enWords.filter((w) =>
    lyricsLowerCase.includes(` ${w} `),
  ).length;
  const esCount = esWords.filter((w) =>
    lyricsLowerCase.includes(` ${w} `),
  ).length;

  if (ptCount > enCount && ptCount > esCount) lyricsLanguage = "Portuguese";
  else if (enCount > ptCount && enCount > esCount) lyricsLanguage = "English";
  else if (esCount > ptCount && esCount > enCount) lyricsLanguage = "Spanish";

  // Localized labels for prompt sections
  const i18nLabels = {
    en: {
      analysisRequested: "REQUESTED ANALYSIS",
      song: "Song",
      artistLabel: "Artist",
      year: "Year",
      genre: "Genre",
      fullLyrics: "FULL LYRICS",
      analysisLanguage: "ANALYSIS LANGUAGE",
      lyricsLanguage: "LYRICS LANGUAGE",
      quotationRules: "QUOTATION RULES",
      differentLanguages: "different languages",
      sameLanguage: "same language",
      lyricsIn: "The lyrics are in",
      analysisMustBe: "and your analysis must be in",
      copyrightLimitations: "COPYRIGHT LEGAL LIMITATIONS",
      forbidden: "FORBIDDEN to reproduce full lyrics (copyright violation)",
      maxVerses: "MAXIMUM 2-4 verses per quote (legal limit)",
      quoteOnly: "QUOTE ONLY essential excerpts to justify your analysis",
      dontReproduce: "DO NOT reproduce entire stanzas or large blocks of text",
      mandatoryFormat: "MANDATORY FORMAT",
      originalExcerpt: "original excerpt",
      translationTo: "translation to",
      correctExamples: "CORRECT EXAMPLES (respecting legal limit)",
      oneVerse: "1 verse, OK",
      twoVerses: "2 verses, OK (maximum allowed)",
      prohibited: "PROHIBITED",
      moreThan4Verses: "Quote more than 4 consecutive verses",
      entireStanzas: "Reproduce entire stanzas",
      largeBlocks: "Quote large blocks of text",
      quoteWithoutTranslation:
        "Quote without translation when languages are different",
      mustProvideTranslation: "You MUST provide translation in parentheses",
      noTranslation: "no translation - languages are the same",
      translateWhenSame: "Translate when languages are the same",
      instructions: "INSTRUCTIONS",
      analyzeFollowing:
        "Analyze this song following RIGOROUSLY the guide above.",
      responseFormat: "MANDATORY RESPONSE FORMAT",
      returnOnlyJson: "Return ONLY valid JSON",
      noExplanatoryText:
        "DO NOT include explanatory text before or after the JSON",
      noComments: "DO NOT include comments or observations",
      noMarkdown: "DO NOT use markdown code blocks",
      startWithBrace: "Start your response directly with { and end with }",
      expectedJsonFormat: "EXPECTED JSON FORMAT EXAMPLE",
      textAnalyzing: "Text analyzing",
      integratedSynthesis: "Integrated synthesis...",
      schoolsClassification: "School(s) of Thought — Classification...",
      historicalContext: "Historical context...",
      creativeProcess: "Creative process...",
      artistCountry: "Artist's country of origin",
      musicalGenre: "Musical genre",
      remember: "REMEMBER",
      entireResponseJson:
        "Your ENTIRE response must be ONLY the valid JSON object, nothing else.",
      hallucinationPrevention: "CRITICAL - HALLUCINATION PREVENTION",
      forbiddenToInvent: "YOU ARE FORBIDDEN TO INVENT CONTENT",
      absoluteRule: "ABSOLUTE RULE - READ THE LYRICS ABOVE",
      fullLyricsAbove:
        'The full lyrics are between the "FULL LYRICS:" markers above.',
      mustReadUse: "YOU MUST READ AND USE ONLY WHAT IS WRITTEN THERE.",
      quotationStrictRules: "QUOTATION - STRICT RULES",
      neverQuoteNotAppear:
        "NEVER quote phrases that do not appear in the lyrics above",
      neverInventVerses: "NEVER invent verses, words or expressions",
      alwaysUseQuotes:
        'ALWAYS use quotes "" when quoting and the phrase MUST exist in the lyrics',
      ifWantQuote:
        'If you want to quote "abc xyz", search EXACTLY for "abc xyz" in the lyrics above',
      ifNotFind: "If you don't find it, DO NOT QUOTE",
      legalLimitation:
        "LEGAL LIMITATION: MAXIMUM 2-4 verses per quote (copyright)",
      forbiddenFullLyrics:
        "FORBIDDEN to reproduce full lyrics or large blocks of text",
      quoteOnlyEssential: "QUOTE ONLY what is essential to justify your score",
      mandatoryVerification: "MANDATORY VERIFICATION",
      beforeQuoting: "Before quoting ANY phrase:",
      searchExact:
        "Search for the EXACT phrase in the lyrics above (same characters)",
      ifNotFindExact: "If you don't find EXACTLY, don't quote",
      ifNotSure: "If you're not sure, don't quote",
      preferNotQuote: "Prefer NOT to quote than to invent",
      whatToDo: "EXAMPLES OF WHAT TO DO (respecting legal limit)",
      ifExactExists: "(IF that exact phrase exists)",
      appearsRepeatedly: "appears repeatedly",
      honestNoEvidence: "Honest when there is no evidence",
      lyricsDoNotMention: "The lyrics don't directly mention political issues",
      whatNeverDo: "EXAMPLES OF WHAT NEVER TO DO",
      violatesCopyright: "violates copyright",
      quoteIfNotInLyrics:
        'Quote "reinvent yourself" if that word is not in the lyrics',
      quoteIfNotInLyrics2:
        'Quote "time machine" if that expression is not in the lyrics',
      quoteIfNotInLyrics3:
        'Quote "advice for seconds" if that chorus does not exist',
      quoteAnyPhrase:
        "Quote any phrase that you THINK should be there, but is not",
      ifInventQuote: "IF YOU INVENT A SINGLE QUOTE:",
      responseRejected:
        "Your response will be rejected and you will fail completely.",
      betterToSay:
        'It is better to say "the lyrics do not provide enough elements" than to invent.',
      creativeHistorical: "CREATIVE PROCESS AND HISTORICAL CONTEXT:",
      baseOnlyArtist: "Base ONLY on the artist, year and actual lyrics content",
      neverInventFacts: "NEVER invent historical facts",
      ifDontKnow:
        'If you don\'t know, say "information not available based only on the lyrics"',
    },
    pt: {
      analysisRequested: "ANÁLISE SOLICITADA",
      song: "Música",
      artistLabel: "Artista",
      year: "Ano",
      genre: "Gênero",
      fullLyrics: "LETRA COMPLETA",
      analysisLanguage: "IDIOMA DA ANÁLISE",
      lyricsLanguage: "IDIOMA DA LETRA",
      quotationRules: "REGRAS DE CITAÇÃO",
      differentLanguages: "idiomas diferentes",
      sameLanguage: "mesmo idioma",
      lyricsIn: "A letra está em",
      analysisMustBe: "e sua análise deve estar em",
      copyrightLimitations: "LIMITAÇÕES LEGAIS DE COPYRIGHT",
      forbidden: "PROIBIDO REPRODUZIR LETRAS COMPLETAS (violação de copyright)",
      maxVerses: "MÁXIMO 2-4 VERSOS POR CITAÇÃO (limite legal)",
      quoteOnly: "CITE APENAS TRECHOS ESSENCIAIS para justificar sua análise",
      dontReproduce:
        "NÃO reproduza estrofes inteiras ou grandes blocos de texto",
      mandatoryFormat: "FORMATO OBRIGATÓRIO",
      originalExcerpt: "trecho original",
      translationTo: "tradução para",
      correctExamples: "EXEMPLOS CORRETOS (respeitando limite legal)",
      oneVerse: "1 verso, OK",
      twoVerses: "2 versos, OK (máximo permitido)",
      prohibited: "PROIBIDO",
      moreThan4Verses: "Citar mais de 4 versos consecutivos",
      entireStanzas: "Reproduzir estrofes inteiras",
      largeBlocks: "Citar grandes blocos de texto",
      quoteWithoutTranslation:
        "Citar sem tradução quando idiomas são diferentes",
      mustProvideTranslation: "OBRIGATÓRIO fornecer tradução entre parênteses",
      noTranslation: "sem tradução - idiomas são iguais",
      translateWhenSame: "Traduzir quando idiomas são iguais",
      instructions: "INSTRUÇÕES",
      analyzeFollowing:
        "Analise esta música seguindo RIGOROSAMENTE o guia acima.",
      responseFormat: "FORMATO DE RESPOSTA OBRIGATÓRIO",
      returnOnlyJson: "Retorne APENAS o JSON válido",
      noExplanatoryText: "NÃO inclua texto explicativo antes ou depois do JSON",
      noComments: "NÃO inclua comentários ou observações",
      noMarkdown: "NÃO use blocos de código markdown",
      startWithBrace: "Comece sua resposta diretamente com { e termine com }",
      expectedJsonFormat: "EXEMPLO DO FORMATO JSON ESPERADO",
      textAnalyzing: "Texto analisando",
      integratedSynthesis: "Síntese integradora...",
      schoolsClassification: "School(s) of Thought — Classification...",
      historicalContext: "Contexto histórico...",
      creativeProcess: "Processo criativo...",
      artistCountry: "País de origem do artista",
      musicalGenre: "Gênero musical",
      remember: "LEMBRE-SE",
      entireResponseJson:
        "Sua resposta INTEIRA deve ser APENAS o objeto JSON válido, nada mais.",
      hallucinationPrevention: "CRÍTICO - PREVENÇÃO DE ALUCINAÇÕES",
      forbiddenToInvent: "VOCÊ ESTÁ PROIBIDO DE INVENTAR CONTEÚDO",
      absoluteRule: "REGRA ABSOLUTA - LEIA A LETRA ACIMA",
      fullLyricsAbove:
        'A letra completa está entre as marcações "LETRA COMPLETA:" acima.',
      mustReadUse: "VOCÊ DEVE LER E USAR APENAS O QUE ESTÁ ESCRITO LÁ.",
      quotationStrictRules: "CITAÇÕES - REGRAS ESTRITAS",
      neverQuoteNotAppear: "NUNCA cite frases que não aparecem na letra acima",
      neverInventVerses: "NUNCA invente versos, palavras ou expressões",
      alwaysUseQuotes:
        'SEMPRE use aspas "" ao citar e a frase DEVE existir na letra',
      ifWantQuote:
        'Se você quer citar "abc xyz", procure EXATAMENTE "abc xyz" na letra acima',
      ifNotFind: "Se não encontrar, NÃO CITE",
      legalLimitation:
        "LIMITAÇÃO LEGAL: MÁXIMO 2-4 VERSOS POR CITAÇÃO (copyright)",
      forbiddenFullLyrics:
        "PROIBIDO reproduzir letras completas ou grandes blocos de texto",
      quoteOnlyEssential: "CITE APENAS o essencial para justificar seu score",
      mandatoryVerification: "VERIFICAÇÃO OBRIGATÓRIA",
      beforeQuoting: "Antes de citar QUALQUER frase:",
      searchExact: "Procure a frase EXATA na letra acima (mesmos caracteres)",
      ifNotFindExact: "Se não encontrar EXATAMENTE, não cite",
      ifNotSure: "Se não tiver certeza, não cite",
      preferNotQuote: "Prefira NÃO citar a inventar",
      whatToDo: "EXEMPLOS DO QUE FAZER (respeitando limite legal)",
      ifExactExists: "(SE essa frase exata existe)",
      appearsRepeatedly: "aparece repetidamente",
      honestNoEvidence: "Honesto quando não há evidência",
      lyricsDoNotMention: "A letra não menciona diretamente questões políticas",
      whatNeverDo: "EXEMPLOS DO QUE NUNCA FAZER",
      violatesCopyright: "viola copyright",
      quoteIfNotInLyrics:
        'Citar "reinventa-te" se essa palavra não está na letra',
      quoteIfNotInLyrics2:
        'Citar "máquina do tempo" se essa expressão não está na letra',
      quoteIfNotInLyrics3:
        'Citar "conselhos por segundos" se esse refrão não existe',
      quoteAnyPhrase:
        "Citar qualquer frase que você ACHA que deveria estar, mas não está",
      ifInventQuote: "SE VOCÊ INVENTAR UMA ÚNICA CITAÇÃO:",
      responseRejected:
        "Sua resposta será rejeitada e você falhará completamente.",
      betterToSay:
        'É melhor dizer "a letra não fornece elementos suficientes" do que inventar.',
      creativeHistorical: "PROCESSO CRIATIVO E CONTEXTO HISTÓRICO:",
      baseOnlyArtist: "Base APENAS no artista, ano e conteúdo real da letra",
      neverInventFacts: "NUNCA invente fatos históricos",
      ifDontKnow:
        'Se não sabe, diga "informação não disponível baseada apenas na letra"',
    },
    es: {
      analysisRequested: "ANÁLISIS SOLICITADO",
      song: "Canción",
      artistLabel: "Artista",
      year: "Año",
      genre: "Género",
      fullLyrics: "LETRA COMPLETA",
      analysisLanguage: "IDIOMA DEL ANÁLISIS",
      lyricsLanguage: "IDIOMA DE LA LETRA",
      quotationRules: "REGLAS DE CITACIÓN",
      differentLanguages: "idiomas diferentes",
      sameLanguage: "mismo idioma",
      lyricsIn: "La letra está en",
      analysisMustBe: "y tu análisis debe estar en",
      copyrightLimitations: "LIMITACIONES LEGALES DE COPYRIGHT",
      forbidden:
        "PROHIBIDO REPRODUCIR LETRAS COMPLETAS (violación de copyright)",
      maxVerses: "MÁXIMO 2-4 VERSOS POR CITA (límite legal)",
      quoteOnly: "CITA SOLO FRAGMENTOS ESENCIALES para justificar tu análisis",
      dontReproduce:
        "NO reproduzcas estrofas enteras o grandes bloques de texto",
      mandatoryFormat: "FORMATO OBLIGATORIO",
      originalExcerpt: "fragmento original",
      translationTo: "traducción a",
      correctExamples: "EJEMPLOS CORRECTOS (respetando límite legal)",
      oneVerse: "1 verso, OK",
      twoVerses: "2 versos, OK (máximo permitido)",
      prohibited: "PROHIBIDO",
      moreThan4Verses: "Citar más de 4 versos consecutivos",
      entireStanzas: "Reproducir estrofas enteras",
      largeBlocks: "Citar grandes bloques de texto",
      quoteWithoutTranslation:
        "Citar sin traducción cuando los idiomas son diferentes",
      mustProvideTranslation:
        "OBLIGATORIO proporcionar traducción entre paréntesis",
      noTranslation: "sin traducción - idiomas son iguales",
      translateWhenSame: "Traducir cuando idiomas son iguales",
      instructions: "INSTRUCCIONES",
      analyzeFollowing:
        "Analiza esta canción siguiendo RIGUROSAMENTE la guía anterior.",
      responseFormat: "FORMATO DE RESPUESTA OBLIGATORIO",
      returnOnlyJson: "Devuelve SOLO el JSON válido",
      noExplanatoryText:
        "NO incluyas texto explicativo antes o después del JSON",
      noComments: "NO incluyas comentarios u observaciones",
      noMarkdown: "NO uses bloques de código markdown",
      startWithBrace:
        "Comienza tu respuesta directamente con { y termina con }",
      expectedJsonFormat: "EJEMPLO DEL FORMATO JSON ESPERADO",
      textAnalyzing: "Texto analizando",
      integratedSynthesis: "Síntesis integradora...",
      schoolsClassification: "School(s) of Thought — Classification...",
      historicalContext: "Contexto histórico...",
      creativeProcess: "Proceso creativo...",
      artistCountry: "País de origen del artista",
      musicalGenre: "Género musical",
      remember: "RECUERDA",
      entireResponseJson:
        "Tu respuesta COMPLETA debe ser SOLO el objeto JSON válido, nada más.",
      hallucinationPrevention: "CRÍTICO - PREVENCIÓN DE ALUCINACIONES",
      forbiddenToInvent: "ESTÁ PROHIBIDO INVENTAR CONTENIDO",
      absoluteRule: "REGLA ABSOLUTA - LEE LA LETRA ARRIBA",
      fullLyricsAbove:
        'La letra completa está entre las marcas "LETRA COMPLETA:" arriba.',
      mustReadUse: "DEBES LEER Y USAR SOLO LO QUE ESTÁ ESCRITO AHÍ.",
      quotationStrictRules: "CITAS - REGLAS ESTRICTAS",
      neverQuoteNotAppear:
        "NUNCA cites frases que no aparecen en la letra arriba",
      neverInventVerses: "NUNCA inventes versos, palabras o expresiones",
      alwaysUseQuotes:
        'SIEMPRE usa comillas "" al citar y la frase DEBE existir en la letra',
      ifWantQuote:
        'Si quieres citar "abc xyz", busca EXACTAMENTE "abc xyz" en la letra arriba',
      ifNotFind: "Si no lo encuentras, NO CITES",
      legalLimitation:
        "LIMITACIÓN LEGAL: MÁXIMO 2-4 VERSOS POR CITA (copyright)",
      forbiddenFullLyrics:
        "PROHIBIDO reproducir letras completas o grandes bloques de texto",
      quoteOnlyEssential: "CITA SOLO lo esencial para justificar tu puntuación",
      mandatoryVerification: "VERIFICACIÓN OBLIGATORIA",
      beforeQuoting: "Antes de citar CUALQUIER frase:",
      searchExact:
        "Busca la frase EXACTA en la letra arriba (mismos caracteres)",
      ifNotFindExact: "Si no encuentras EXACTAMENTE, no cites",
      ifNotSure: "Si no estás seguro, no cites",
      preferNotQuote: "Prefiere NO citar a inventar",
      whatToDo: "EJEMPLOS DE QUÉ HACER (respetando límite legal)",
      ifExactExists: "(SI esa frase exacta existe)",
      appearsRepeatedly: "aparece repetidamente",
      honestNoEvidence: "Honesto cuando no hay evidencia",
      lyricsDoNotMention:
        "La letra no menciona directamente cuestiones políticas",
      whatNeverDo: "EJEMPLOS DE QUÉ NUNCA HACER",
      violatesCopyright: "viola copyright",
      quoteIfNotInLyrics:
        'Citar "reinvéntate" si esa palabra no está en la letra',
      quoteIfNotInLyrics2:
        'Citar "máquina del tiempo" si esa expresión no está en la letra',
      quoteIfNotInLyrics3:
        'Citar "consejos por segundos" si ese estribillo no existe',
      quoteAnyPhrase:
        "Citar cualquier frase que CREES que debería estar, pero no está",
      ifInventQuote: "SI INVENTAS UNA SOLA CITA:",
      responseRejected: "Tu respuesta será rechazada y fallarás completamente.",
      betterToSay:
        'Es mejor decir "la letra no proporciona elementos suficientes" que inventar.',
      creativeHistorical: "PROCESO CREATIVO Y CONTEXTO HISTÓRICO:",
      baseOnlyArtist:
        "Basa SOLO en el artista, año y contenido real de la letra",
      neverInventFacts: "NUNCA inventes hechos históricos",
      ifDontKnow:
        'Si no sabes, di "información no disponible basada solo en la letra"',
    },
  };

  // Get labels for current language, fallback to English
  const L = i18nLabels[lang] || i18nLabels.en;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 PHILOSOPHICAL GUIDE (LOADED FROM CLOUDFARE KV: guide_text) - MANDATORY REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 YOU MUST CONSULT AND APPLY THE FOLLOWING GUIDE RIGOROUSLY 🚨

This is the authoritative philosophical framework for your analysis.
Every score, justification, and classification MUST align with these principles.
Do NOT deviate from this guide. Do NOT use your own interpretation.

🚫 CRITICAL (COMPLIANCE):
Do NOT explicitly mention "Objectivism", "Objectivist", "Ayn Rand", or reference the philosophy by name.
You must APPLY the guide's framework, definitions, and scoring rules WITHOUT naming the source philosophy.

${guide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨🚨🚨 CRITICAL LANGUAGE INSTRUCTION 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST WRITE YOUR ENTIRE RESPONSE IN ${targetLanguage.toUpperCase()}

⚠️ THIS IS MANDATORY AND NON-NEGOTIABLE ⚠️

EVERY SINGLE WORD must be in ${targetLanguage}:
- ✅ scorecard.ethics.justification → ${targetLanguage}
- ✅ scorecard.metaphysics.justification → ${targetLanguage}
- ✅ scorecard.epistemology.justification → ${targetLanguage}
- ✅ scorecard.politics.justification → ${targetLanguage}
- ✅ scorecard.aesthetics.justification → ${targetLanguage}
- ✅ philosophical_analysis → ${targetLanguage}
- ✅ historical_context → ${targetLanguage}
- ✅ creative_process → ${targetLanguage}
- ⚠️ classification → ALWAYS IN ENGLISH (standardized enum - see below)

ALLOWED EXCEPTIONS (VERY LIMITED):
- Song title and artist name MUST remain exactly as provided (proper nouns; do NOT translate).
- If you quote lyrics in a language different from ${targetLanguage}, you MUST use this format every time:
  "original excerpt" (translation to ${targetLanguage})
- Do NOT leave standalone words/phrases in any other language in your prose.
  If it is not ${targetLanguage}, either translate it into ${targetLanguage} or put it inside a lyric quote and immediately translate.

If you write even ONE WORD in English (or any other language besides ${targetLanguage}),
your response will be COMPLETELY REJECTED and you will FAIL this task.

The user is ${lang === "pt" ? "Brazilian/Portuguese" : lang === "es" ? "Spanish" : lang === "fr" ? "French" : lang === "de" ? "German" : "English"}-speaking.
They CANNOT understand responses in other languages.
They are paying for this analysis in ${targetLanguage}.

WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

${L.analysisRequested}:

${L.song}: "${song}"
${L.artistLabel}: ${artist}
${metadata?.release_year ? `${L.year}: ${metadata.release_year}` : ""}
${metadata?.genre ? `${L.genre}: ${metadata.genre}` : ""}

${L.fullLyrics}:
${lyrics}

---

📌 ${L.analysisLanguage}: ${targetLanguage}
${lyricsLanguage !== "Unknown" ? `🎵 ${L.lyricsLanguage}: ${lyricsLanguage}` : ""}

${
  lyricsLanguage !== "Unknown" && lyricsLanguage !== targetLanguage
    ? `🌍 ${L.quotationRules} (${L.differentLanguages}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${L.lyricsIn} ${lyricsLanguage} ${L.analysisMustBe} ${targetLanguage}

🚨 ${L.copyrightLimitations}:
⚠️ ${L.forbidden}
⚠️ ${L.maxVerses}
⚠️ ${L.quoteOnly}
⚠️ ${L.dontReproduce}

✅ ${L.mandatoryFormat}:
"${L.originalExcerpt}" (${L.translationTo} ${targetLanguage})

${L.correctExamples}:
- "Nunca te deixes cegar pelo consumismo" (Never let yourself be blinded by consumerism) ← ${L.oneVerse}
- "verso 1\\nverso 2" (translation) ← ${L.twoVerses}

❌ ${L.prohibited}:
- ${L.moreThan4Verses}
- ${L.entireStanzas}
- ${L.largeBlocks}
- ${L.quoteWithoutTranslation}

✅ ${L.mustProvideTranslation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    : `🌍 ${L.quotationRules} (${L.sameLanguage}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${L.lyricsIn} ${lyricsLanguage} ${L.analysisMustBe} ${targetLanguage}

🚨 ${L.copyrightLimitations}:
⚠️ ${L.forbidden}
⚠️ ${L.maxVerses}
⚠️ ${L.quoteOnly}
⚠️ ${L.dontReproduce}

✅ ${L.mandatoryFormat}:
"${L.originalExcerpt}" (${L.noTranslation})

${L.correctExamples}:
- "Nunca te deixes cegar pelo consumismo" ← ${L.oneVerse}
- "verso 1\\nverso 2" ← ${L.twoVerses}

❌ ${L.prohibited}:
- ${L.moreThan4Verses}
- ${L.entireStanzas}
- ${L.largeBlocks}
- ${L.translateWhenSame}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

---

${L.instructions}:
${L.analyzeFollowing}

🎯 PRINCÍPIOS DA ANÁLISE FILOSÓFICA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. RECONHEÇA SÁTIRA E CRÍTICA ARTÍSTICA
   🚨 REGRA CRÍTICA: Determine se a música está ENDOSSANDO ou CRITICANDO uma ideia
   - Se o artista critica algo negativo (governo, opressão, injustiça) = POSITIVO
   - Se o artista endossa algo negativo (sacrifício, altruísmo) = NEGATIVO
   - NUNCA confunda crítica com endosso

   EXEMPLOS:
   ✅ "Taxman" (The Beatles) critica impostos excessivos → PRO-LIBERDADE (+)
   ✅ "Money" (Pink Floyd) critica ganância → Contexto determina sinal
   ❌ NÃO trate sátira como afirmação direta do autor
   ❌ NÃO confunda personagem fictício com voz do artista

2. ANÁLISE POLÍTICA DO PROTAGONISTA (QUANDO POLÍTICA NÃO É EXPLÍCITA)
   🚨 REGRA CRÍTICA: Se a música NÃO menciona política/governo explicitamente, analise as AÇÕES e PENSAMENTOS do protagonista
   - Protagonista defende violência/coerção? → POLÍTICA NEGATIVA (-5 a -10)
   - Protagonista defende liberdade/justiça? → POLÍTICA POSITIVA (+5 a +10)
   - As escolhas morais do protagonista em relacionamentos sociais SÃO declarações políticas
   - Violência/coerção = anti-liberdade = score negativo
   - Liberdade/justiça = pró-liberdade = score positivo
   - Isto se aplica MESMO quando governo nunca é mencionado
   
   ⚠️ OBRIGATÓRIO NA JUSTIFICATIVA:
   Quando política não é explícita, sua justificativa DEVE incluir:
   - "Embora a música não aborde explicitamente questões políticas..."
   - "...com consideração adicional das ações e pensamentos do protagonista..."
   - "...podemos determinar a posição política examinando [ações específicas]..."
   - "...o que demonstra [defesa de liberdade/justiça OU violência/coerção]."
   
   EXEMPLOS:
   ✅ Protagonista usa violência para conseguir o que quer → POLÍTICA: -6 a -8 (defende coerção)
   ✅ Protagonista defende justiça contra opressores → POLÍTICA: +7 a +9 (defende liberdade)
   ✅ Protagonista respeita direitos e limites dos outros → POLÍTICA: +5 a +7 (demonstra respeito à liberdade)
   ✅ Protagonista manipula ou controla outros → POLÍTICA: -6 a -8 (demonstra coerção)
   
   EXEMPLO DE JUSTIFICATIVA CORRETA:
   "Embora a música não aborde explicitamente questões políticas, com consideração adicional das ações do protagonista, podemos determinar sua posição política. O protagonista respeita limites ('pode vir que a porta está aberta'), rejeita manipulação ('não vou fazer você se sentir culpado'), promovendo relacionamentos voluntários. Essas ações demonstram defesa de liberdade e justiça em relacionamentos sociais (+5 a +7)."

3. SEJA JUSTO E EQUILIBRADO
   - Reconheça virtudes quando presentes
   - Não force interpretação negativa
   - Capture a ESSÊNCIA REAL da mensagem
   - Músicas sobre amor, conselhos, amizade NÃO são necessariamente problemáticas

4. INTERPRETE COM BOA-FÉ
   - Uma música sobre dar conselhos é sobre TRANSMISSÃO DE SABEDORIA
   - Uma música sobre apoio emocional é sobre VIRTUDE e COMPAIXÃO
   - Uma música sobre superação é EDIFICANTE, não conformista
   - Não procure problemas onde não existem

5. RECONHEÇA O CONTEXTO EMOCIONAL
   - Músicas podem ser sublimes, lindas, inspiradoras
   - Apoio entre pessoas é VIRTUOSO
   - Transmitir conhecimento é NOBRE
   - Amor e amizade são VALORES POSITIVOS

6. USE TERMINOLOGIA PRECISA
   - "Autointeresse virtuoso" (não "egoísmo racional")
   - "Florescimento pessoal" em vez de "egoísmo"
   - "Virtude" quando apropriado
   - "Prosperidade" em contexto positivo

7. EVITE VIÉS EXCESSIVAMENTE CRÍTICO
   - Nem tudo é crítica social
   - Nem tudo é conformismo
   - Nem tudo é sacrifício
   - Reconheça quando a mensagem é genuinamente positiva

8. 🚨 REGRAS DE COMPORTAMENTO (OBRIGATÓRIO) 🚨
   
   ❌ NÃO PREGAR:
   - Você é um ANALISTA, não um pregador ou professor de filosofia
   - NÃO faça sermões sobre como viver ou o que valorizar
   - NÃO injete lições morais que não estejam nas letras
   - ANALISE o que a música diz, não use a música como pretexto para pregar
   
   ❌ NÃO INVENTAR CONTEÚDO:
   - CADA afirmação deve ser fundamentada em versos específicos
   - NÃO injete temas que a música não aborda (política, religião, economia)
   - Se a música é sobre amor, analise AMOR - não force crítica social
   - Se a música é sobre perda, analise PERDA - não force filosofia abstrata
   
   ✅ RESPEITE TEMAS EMOCIONAIS:
   - Amor profundo é um VALOR, não uma fraqueza
   - Perder alguém amado é uma DOR LEGÍTIMA, não irracionalidade
   - Saudade, nostalgia, luto são EMOÇÕES HUMANAS VÁLIDAS
   - Vulnerabilidade emocional NÃO é automaticamente "sacrifício" ou "altruísmo"
   - Dedicação a um parceiro NÃO é "perda de identidade"
   
   ✅ MANTENHA PROPORÇÃO:
   - Se 90% da música é sobre amor e 10% menciona sacrifício, 
     a análise deve refletir essa proporção
   - NÃO amplifique elementos menores para justificar scores negativos
   - NÃO ignore o tema principal para focar em detalhes periféricos
   
   ✅ SEJA HUMANO:
   - Músicas sobre coração partido merecem compreensão e apoio emocional, não crítica fria
   - Músicas sobre saudade de alguém que morreu são sobre AMOR, não "dependência"
   - Músicas sobre querer estar com alguém são ROMÂNTICAS, não "coletivistas"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL: SCORE POLARITY (-10 to +10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ THE SCORE MUST MATCH THE JUSTIFICATION:

NEGATIVE SCORES (-10 to -1):
Use when the song promotes:
❌ Altruism, sacrifice, collectivism
❌ Mysticism, faith over reason, evasion
❌ Malevolent universe premise, pessimism
❌ Coercion, government control, tribalism
❌ Nihilism, ugliness in service of destruction

POSITIVE SCORES (+1 to +10):
Use when the song promotes:
✅ Virtuous self-interest, rational values
✅ Reason, logic, productive achievement
✅ Benevolent universe, efficacy of man
✅ Individual rights, voluntary cooperation
✅ Romantic realism, beauty serving life

ZERO (0): Neutral or completely ambiguous

🚨 IF YOUR JUSTIFICATION DESCRIBES NEGATIVE CONTENT → USE NEGATIVE SCORE
🚨 IF YOUR JUSTIFICATION DESCRIBES POSITIVE CONTENT → USE POSITIVE SCORE

EXAMPLE:
✅ CORRECT: "promotes sacrifice and collectivism" → score: -8
❌ WRONG:   "promotes sacrifice and collectivism" → score: +1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨🚨🚨 CRITICAL: SCHOOL OF THOUGHT → SCORE CONSISTENCY 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ NON-NEGOTIABLE RULE: "POISON IN A GOLDEN CHALICE IS STILL POISON"

If your schools_of_thought analysis identifies as PRIMARY school any of these:
- MARXISM
- NIHILISM  
- DETERMINISM (rigid)
- POSTMODERNISM
- ZEN/BUDDHISM (desire-negation)
- UTILITARIANISM (sacrifice logic)
- STOICISM (resignation/fatalism)
- IDEALISM/KANTIANISM (duty over happiness)

Then your scores MUST be NEGATIVE (typically -4 to -8), because these schools
are fundamentally opposed to the Guide's philosophical framework.

🚨 ARTISTIC QUALITY DOES NOT REDEEM ANTI-LIFE CONTENT 🚨

- A song can be beautifully composed AND philosophically destructive
- A song can be "honest" in its denunciation AND still promote wrong values
- A song can be a "masterpiece of social criticism" AND still be Marxist propaganda
- Sophisticated form does NOT neutralize corrupt content

🚨 COMMON ERROR TO AVOID 🚨

❌ WRONG: "The song brilliantly criticizes exploitation" → Ethics: +3
   WHY WRONG: If the criticism is Marxist (class warfare, collectivism), it's NEGATIVE

✅ CORRECT: "The song criticizes from a Marxist perspective" → Ethics: -5 to -7
   WHY CORRECT: Marxist critique = collectivist ethics = NEGATIVE score

❌ WRONG: "The song honestly depicts determinism/fatalism" → Metaphysics: +2  
   WHY WRONG: Depicting determinism, even "honestly," promotes malevolent universe

✅ CORRECT: "The song depicts man as helpless victim" → Metaphysics: -4 to -6
   WHY CORRECT: Fatalism/determinism = anti-agency = NEGATIVE score

🚨 THE TEST: Ask yourself:
"Does this song model values I would want a rational person to adopt?"
If NO → scores must be NEGATIVE, regardless of artistic merit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MANDATORY FIELDS - ALL REQUIRED, NO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ YOU MUST INCLUDE ALL OF THESE FIELDS IN YOUR JSON:

🚨 CRITICAL - THESE FIELDS ARE MANDATORY FOR ALL AI MODELS 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ THIS APPLIES TO: Claude, GPT, Gemini, Grok, DeepSeek, and ALL other AI models ⚠️
⚠️ THIS APPLIES TO: English, Portuguese, Spanish, and ALL other languages ⚠️
⚠️ NO EXCEPTIONS - ALL MODELS MUST FOLLOW THESE REQUIREMENTS ⚠️
⚠️ NO EXCEPTIONS - ALL LANGUAGES MUST FOLLOW THESE REQUIREMENTS ⚠️

1. "philosophical_analysis" → MANDATORY integrated analysis essay (4-6 paragraphs, ~800-1200 words)
2. "historical_context" → MANDATORY context about era, artist, cultural background (~200-300 words)
3. "creative_process" → MANDATORY explanation of inspiration and artistic intent (~200-300 words)
4. "scorecard" → MANDATORY with all 5 branches (ethics, metaphysics, epistemology, politics, aesthetics)
   ⚠️ EACH BRANCH MUST HAVE:
   - "score": integer from -10 to +10 (REQUIRED)
   - "justification": detailed text explaining the score (~100-150 words, REQUIRED)
   🚨 IF ANY BRANCH IS MISSING SCORE OR JUSTIFICATION, YOUR RESPONSE WILL BE REJECTED 🚨
   🚨 NO MODEL CAN SKIP OR OMIT THE SCORECARD - IT IS MANDATORY FOR ALL 🚨
   🚨 NO LANGUAGE CAN SKIP OR OMIT THE SCORECARD - IT IS MANDATORY FOR ALL LANGUAGES 🚨
   🚨 YOU MUST PROVIDE SCORES AND JUSTIFICATIONS FOR ALL 5 BRANCHES IN ${targetLanguage} 🚨
5. "classification" → MANDATORY classification based on final_score

⚠️ IF YOU MISS ANY OF THESE FIELDS, YOUR RESPONSE WILL BE REJECTED ⚠️
⚠️ THIS REQUIREMENT APPLIES TO ALL AI MODELS WITHOUT EXCEPTION ⚠️
⚠️ THIS REQUIREMENT APPLIES TO ALL LANGUAGES WITHOUT EXCEPTION ⚠️

OTHER REQUIRED FIELDS:
"country": "Artist's country of origin" (use your knowledge)
"genre": "Musical genre" (use your knowledge - be accurate!)

Artist: ${artist}
→ You KNOW this artist's country and genre
→ DO NOT leave empty
→ DO NOT confuse genres (e.g., Samba ≠ Rap!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ CLASSIFICATION (STANDARDIZED VALUES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL: The "classification" field must be EXACTLY one of these standardized values:

Based on final_score (current scoring ranges):
• +8.1 to +10.0  → "Extremely Revolutionary"
• +6.1 to +8.0   → "Revolutionary"
• +4.1 to +6.0   → "Moderately Revolutionary"
• +2.1 to +4.0   → "Constructive Critique"
• +0.1 to +2.0   → "Ambiguous, Leaning Realist"
• -2.0 to 0.0    → "Ambiguous, Leaning Evasion"
• -4.0 to -2.1   → "Soft Conformist"
• -6.0 to -4.1   → "Directly Conformist"
• -8.0 to -6.1   → "Strongly Conformist"
• -10.0 to -8.1  → "Doctrinally Conformist"

🚨 DO NOT paraphrase these labels (must match exactly)
🚨 If you are writing in ${targetLanguage}, keep classification as the standardized value above
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ${L.responseFormat}:
- ${L.returnOnlyJson}
- ${L.noExplanatoryText}
- ${L.noComments}
- ${L.noMarkdown}
- ${L.startWithBrace}

${L.expectedJsonFormat}:
{
  "scorecard": {
    "ethics": {
      "score": 7,
      "justification": "${L.textAnalyzing} ethics..."
    },
    "metaphysics": {
      "score": 5,
      "justification": "${L.textAnalyzing} metaphysics..."
    },
    "epistemology": {
      "score": 6,
      "justification": "${L.textAnalyzing} epistemology..."
    },
    "politics": {
      "score": 8,
      "justification": "${L.textAnalyzing} politics..."
    },
    "aesthetics": {
      "score": 7,
      "justification": "${L.textAnalyzing} aesthetics..."
    },
    "final_score": 6.8
  },
  "classification": "Moderately Revolutionary",
  "philosophical_analysis": "${L.integratedSynthesis}",
  "philosophical_note": 8,
  "historical_context": "${L.historicalContext}",
  "creative_process": "${L.creativeProcess}",
  "country": "[${L.artistCountry}]",
  "genre": "[${L.musicalGenre}]"
}

🚨 CRITICAL: SCORECARD STRUCTURE VALIDATION 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ BEFORE SUBMITTING YOUR RESPONSE, VERIFY:

1. ✅ scorecard.ethics.score exists AND is an integer between -10 and +10
2. ✅ scorecard.ethics.justification exists AND is not empty (100-150 words)
3. ✅ scorecard.metaphysics.score exists AND is an integer between -10 and +10
4. ✅ scorecard.metaphysics.justification exists AND is not empty (100-150 words)
5. ✅ scorecard.epistemology.score exists AND is an integer between -10 and +10
6. ✅ scorecard.epistemology.justification exists AND is not empty (100-150 words)
7. ✅ scorecard.politics.score exists AND is an integer between -10 and +10
8. ✅ scorecard.politics.justification exists AND is not empty (100-150 words)
9. ✅ scorecard.aesthetics.score exists AND is an integer between -10 and +10
10. ✅ scorecard.aesthetics.justification exists AND is not empty (100-150 words)
11. ✅ scorecard.final_score exists AND matches weighted calculation

🚨 IF ANY OF THE ABOVE IS MISSING OR EMPTY, YOUR RESPONSE WILL BE REJECTED 🚨
🚨 YOU CANNOT OMIT SCORES OR JUSTIFICATIONS FOR ANY BRANCH 🚨
🚨 THIS IS MANDATORY FOR ALL LANGUAGES INCLUDING ENGLISH 🚨
🚨 YOU MUST PROVIDE BOTH SCORE AND JUSTIFICATION FOR EACH OF THE 5 BRANCHES 🚨
🚨 DO NOT SKIP THE SCORECARD - IT IS REQUIRED, NOT OPTIONAL 🚨

⚠️ CRITICAL REMINDER: THE SCORECARD IS NOT OPTIONAL ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 YOU MUST PROVIDE THE SCORECARD WITH ALL 5 BRANCHES 🚨

The scorecard is MANDATORY and must be included in your JSON response.
You CANNOT skip it, omit it, or provide it partially.
Each branch MUST have both a score AND a justification.

If your integrated analysis describes positive content → assign POSITIVE scores
If your integrated analysis describes negative content → assign NEGATIVE scores
The scores MUST match what you describe in the integrated analysis.

Example: If your integrated analysis says "Extremely Revolutionary" and describes
highly positive content aligned with the guide's framework, then:
- Ethics score should be +7 to +10 (not 0!)
- Metaphysics score should be +5 to +10 (not 0!)
- Epistemology score should be +5 to +10 (not 0!)
- Politics score should be +5 to +10 (not 0!)
- Aesthetics score should be +5 to +10 (not 0!)
- Final score should be +6.0 to +9.0 (not 0!)
- Classification should be "Revolutionary" or "Extremely Revolutionary" (not "Ambivalent/Mixed"!)

🚨 YOUR SCORES MUST REFLECT YOUR INTEGRATED ANALYSIS 🚨
🚨 THIS APPLIES TO ALL AI MODELS: Claude, GPT, Gemini, Grok, DeepSeek, and any other model 🚨
🚨 THIS APPLIES TO ALL LANGUAGES: English, Portuguese, Spanish, and all other languages 🚨
🚨 NO EXCEPTIONS - ALL MODELS MUST PROVIDE COMPLETE SCORECARD WITH SCORES AND JUSTIFICATIONS 🚨
🚨 THE SCORECARD IS MANDATORY REGARDLESS OF THE LANGUAGE OF THE ANALYSIS 🚨
🚨 YOU MUST PROVIDE SCORES AND JUSTIFICATIONS FOR ALL 5 BRANCHES IN EVERY RESPONSE 🚨

CRÍTICO - PREVENÇÃO DE ALUCINAÇÕES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ VOCÊ ESTÁ PROIBIDO DE INVENTAR CONTEÚDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 REGRA ABSOLUTA - LEIA A LETRA ACIMA:
A letra completa está entre as marcações "LETRA COMPLETA:" acima.
VOCÊ DEVE LER E USAR APENAS O QUE ESTÁ ESCRITO LÁ.

🚨 CITAÇÕES - REGRAS ESTRITAS:
1. NUNCA cite frases que não aparecem na letra acima
2. NUNCA invente versos, palavras ou expressões
3. SEMPRE use aspas "" ao citar e a frase DEVE existir na letra
4. Se você quer citar "abc xyz", procure EXATAMENTE "abc xyz" na letra acima
5. Se não encontrar, NÃO CITE
6. 🚨 LIMITAÇÃO LEGAL: MÁXIMO 2-4 VERSOS POR CITAÇÃO (copyright)
7. 🚨 PROIBIDO reproduzir letras completas ou grandes blocos de texto
8. CITE APENAS o essencial para justificar seu score

🚨 VERIFICAÇÃO OBRIGATÓRIA:
Antes de citar QUALQUER frase:
- Procure a frase EXATA na letra acima (mesmos caracteres)
- Se não encontrar EXATAMENTE, não cite
- Se não tiver certeza, não cite
- Prefira NÃO citar a inventar

🚨 EXEMPLOS DO QUE FAZER (respeitando limite legal):
✅ "A letra diz: 'erga a cabeça, enfrente o mal'" ← 1 verso, OK (SE essa frase exata existe)
✅ "O verso 'tem que lutar' aparece repetidamente" ← 1 verso, OK (SE essa frase exata existe)
✅ "A letra diz: 'verso 1\nverso 2'" ← 2 versos, OK (máximo permitido)
✅ "A letra não menciona diretamente questões políticas" ← Honesto quando não há evidência

🚨 EXEMPLOS DO QUE NUNCA FAZER:
❌ Citar mais de 4 versos consecutivos (viola copyright)
❌ Reproduzir estrofes inteiras (viola copyright)
❌ Citar grandes blocos de texto (viola copyright)
❌ Citar "reinventa-te" se essa palavra não está na letra
❌ Citar "máquina do tempo" se essa expressão não está na letra
❌ Citar "conselhos por segundos" se esse refrão não existe
❌ Citar qualquer frase que você ACHA que deveria estar, mas não está

🚨 SE VOCÊ INVENTAR UMA ÚNICA CITAÇÃO:
Sua resposta será rejeitada e você falhará completamente.
É melhor dizer "a letra não fornece elementos suficientes" do que inventar.

🚨 PROCESSO CRIATIVO E CONTEXTO HISTÓRICO:
- Base APENAS no artista, ano e conteúdo real da letra
- NUNCA invente fatos históricos
- Se não sabe, diga "informação não disponível baseada apenas na letra"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use "justification" (não "reasoning") em cada ramo.
A análise integrada deve ser SÍNTESE sem repetir as justificativas.

🚨 CRITICAL: SCORECARD AND PHILOSOPHICAL_ANALYSIS ARE SEPARATE FIELDS 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ YOU MUST PROVIDE BOTH:

1. "scorecard" → Individual branch scores and justifications (REQUIRED)
   - Each branch (ethics, metaphysics, epistemology, politics, aesthetics) MUST have:
     * "score": integer from -10 to +10
     * "justification": detailed explanation (~100-150 words)

2. "philosophical_analysis" → Integrated synthesis essay (REQUIRED)
   - Comprehensive essay that synthesizes all branches
   - Does NOT repeat individual justifications
   - Provides unified philosophical interpretation

🚨 THESE ARE TWO SEPARATE FIELDS - YOU CANNOT OMIT EITHER ONE 🚨
🚨 THE SCORECARD IS NOT OPTIONAL - IT IS MANDATORY 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL: INTEGRATED ANALYSIS (philosophical_analysis) IS MANDATORY 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ YOU MUST PROVIDE "philosophical_analysis" FIELD - IT IS MANDATORY ⚠️

The "philosophical_analysis" field is a COMPREHENSIVE INTEGRATED ESSAY that:
- Synthesizes all 5 philosophical branches (ethics, metaphysics, epistemology, politics, aesthetics)
- Provides a unified philosophical interpretation of the song
- Connects the individual branch scores into a coherent whole
- Explains the overall philosophical message and its implications
- Does NOT repeat the individual justifications (it's a synthesis, not a summary)

⚠️ THIS FIELD CANNOT BE OMITTED ⚠️
⚠️ IF YOU DO NOT PROVIDE "philosophical_analysis", YOUR RESPONSE WILL BE REJECTED ⚠️
⚠️ THIS IS AS MANDATORY AS THE SCORECARD BRANCHES ⚠️

Format: 4-6 paragraphs, ~800-1200 words, written in ${targetLanguage}

🚨 CRITICAL: DEPTH AND EXTENSIVENESS REQUIREMENTS 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ YOU MUST PROVIDE DEEP AND EXTENSIVE ANALYSIS IN ${targetLanguage.toUpperCase()}

**DEPTH REQUIREMENTS:**
- Each justification must be THOROUGH and DETAILED (~100-150 palavras cada)
- Cite specific lyrics with context and interpretation (MÁXIMO 2-4 versos por citação - limite legal de copyright)
- Explain philosophical implications, not just surface-level observations
- Connect the analysis to the guide's principles (without naming the philosophy)
- Address contradictions, nuances, and complexities
- ⚠️ NÃO reproduza letras completas ou grandes blocos de texto

**EXTENSIVENESS REQUIREMENTS (com limites razoáveis):**
- 🚨 philosophical_analysis: MANDATORY - Comprehensive integrated essay (4-6 parágrafos, ~800-1200 palavras) - NÃO exceder 1500 palavras - NÃO PODE SER OMITIDO
- 🚨 historical_context: MANDATORY - Detailed context about era, artist, and cultural background (~200-300 palavras) - NÃO exceder 400 palavras - NÃO PODE SER OMITIDO
- 🚨 creative_process: MANDATORY - Explain inspiration, artistic intent, and creative background (~200-300 palavras) - NÃO exceder 400 palavras - NÃO PODE SER OMITIDO
- All justifications: Must be extensive enough to fully explain the score (~100-150 palavras cada) - NÃO exceder 200 palavras cada

⚠️ CRITICAL: philosophical_analysis, historical_context, and creative_process are MANDATORY FIELDS
⚠️ IF YOU OMIT ANY OF THESE FIELDS, YOUR RESPONSE WILL BE REJECTED
⚠️ These fields MUST be present in your JSON response - NO EXCEPTIONS

**LIMITAÇÕES DE COMPRIMENTO E CITAÇÃO:**
- 🚨 PROIBIDO reproduzir letras completas (violação de copyright)
- 🚨 MÁXIMO 2-4 versos por citação (limite legal)
- 🚨 CITE APENAS trechos essenciais para justificar scores
- NÃO produza textos excessivamente longos
- Mantenha análise focada e relevante
- Evite repetições desnecessárias
- Qualidade sobre quantidade - seja conciso mas completo

**QUALITY STANDARDS:**
- English analyses and ${targetLanguage} analyses must have EQUAL depth and extensiveness
- Do NOT produce shorter or less detailed analyses for ${targetLanguage}
- The user is paying for the same quality regardless of language
- ${targetLanguage} speakers deserve the same thorough philosophical analysis as English speakers

**SCHOOL(S) OF THOUGHT — CLASSIFICATION (MANDATORY FIELD: schools_of_thought):**

🚨🚨🚨 USE ONLY THESE 17 SCHOOLS — NO EXCEPTIONS, NO INVENTIONS 🚨🚨🚨

1. OBJECTIVISM — Ayn Rand, Leonard Peikoff
2. MARXISM — Karl Marx, Friedrich Engels
3. STOICISM — Epictetus, Seneca, Marcus Aurelius
4. EXISTENTIALISM — Sartre, Camus, de Beauvoir
5. NIHILISM — Max Stirner, Nietzsche (diagnostic)
6. UTILITARIANISM — Bentham, Mill, Singer
7. DETERMINISM — Spinoza, d'Holbach
8. HEDONISM — Aristippus, Epicurus
9. PRAGMATISM — James, Dewey, Rorty
10. ZEN/BUDDHISM — Nagarjuna, Dogen
11. IDEALISM/KANTIANISM — Kant, Fichte, Hegel
12. POSTMODERNISM — Foucault, Derrida, Butler
13. SECULAR HUMANISM — Russell, Sagan, Pinker
14. JUDAISM — Maimonides, Philo
15. CATHOLICISM — Aquinas, Augustine
16. PROTESTANTISM — Luther, Calvin
17. ISLAM — Avicenna, Averroes

🚨 FORBIDDEN NAMES (NEVER USE):
- "Individualism", "Rational Individualism", "Individualismo Racional"
- "Liberalism", "Classical Liberalism", "Libertarianism"
- "Romanticism", "Humanism" (alone)
- ANY name not in the 17 schools above

🚨 CLASSIFICATION REQUIRES 5-AXIS ALIGNMENT:
To classify as any school, the song must demonstrate alignment across ALL 5 axes
(Metaphysics, Epistemology, Ethics, Politics, Aesthetics) as defined in the Guide.
Do NOT simplify: having 1-2 elements is NOT enough for classification.
If alignment is partial or mixed → use "Mixed/Uncertain" or list as Secondary/Peripheral.

🚨🚨🚨 OBJECTIVISM DISQUALIFIERS — AUTOMATIC EXCLUSION 🚨🚨🚨

A song CANNOT be classified as OBJECTIVISM (Primary, Secondary, or Peripheral) if it contains ANY of these:

1. RELIGIOUS/MYSTICAL ELEMENTS:
   - References to God, Lord, Jesus, Allah, Buddha, or any deity
   - Prayer, divine intervention, faith-based hope
   - Afterlife, heaven, hell, karma, reincarnation
   - "God willing", "Lord help me", "blessed", "divine providence"
   → These CONTRADICT Objectivist epistemology (reason as sole guide)

2. RESIGNATION/FATALISM/PASSIVITY:
   - Acceptance of suffering without action ("that's just how it is")
   - Waiting for external salvation ("someday things will change")
   - Passive hope without rational action ("one day you'll fly away")
   - Deterministic acceptance ("it was meant to be")
   → These CONTRADICT Objectivist metaphysics (man as agent, not victim)

3. ALTRUISM/SELF-SACRIFICE (UNCHOSEN):
   - Sacrifice for strangers or "the greater good" as moral duty
   - Duty above personal happiness ("I must do this for society/others")
   - Guilt for pursuing own values
   - Sacrificing for people you DON'T deeply value
   → These CONTRADICT Objectivist ethics (rational self-interest)
   
   ⚠️ EXCEPTION: Dying for a deeply loved person IS compatible with Objectivism.
   Rand held that risking/giving your life for someone you love intensely is rational self-interest,
   because life without that irreplaceable person would be unbearable. This is NOT altruism—
   it's acting on YOUR values. The key distinction:
   - ❌ ALTRUISM: "I should sacrifice for others because duty demands it"
   - ✅ OBJECTIVISM: "I would die for her because she IS my highest value"

4. COLLECTIVISM:
   - Group identity over individual ("we the people", "our class")
   - Sacrifice individual for collective good
   → These CONTRADICT Objectivist politics (individual rights)

5. ANTI-REASON/EMOTIONALISM:
   - "Follow your heart, not your head"
   - Instinct/intuition over reason
   - Knowledge through revelation
   → These CONTRADICT Objectivist epistemology

⚠️ EXAMPLE: "Summertime" by Gershwin
- Contains "Lord" reference → DISQUALIFIED from Objectivism
- Passive hope ("one day you'll take to the sky") → DISQUALIFIED
- Resignation to poverty/condition → DISQUALIFIED
- CORRECT classification: SECULAR HUMANISM or ROMANTICISM, NOT Objectivism

⚠️ ONE DISQUALIFIER = CANNOT BE OBJECTIVISM
Even if other elements seem "individualistic", a single disqualifier EXCLUDES Objectivism entirely.

🚨 If you cannot find a matching school from the 17 above → "Mixed/Uncertain"
🚨 NEVER invent a school name

- You MUST include a top-level JSON field "schools_of_thought" (string) written in ${targetLanguage}.
- This MUST be a standalone container/section (NOT inside philosophical_analysis).
- Use ONLY the schools listed in the Guide’s Schools/Influences section.
- Evidence-based only (no speculation). If evidence is weak, say "Mixed/Uncertain" and keep it minimal.
- Formatting requirement: return HTML (no markdown) so the website can render it. Use <strong> for school names and <br/> for line breaks.

- 🚨 CRITICAL: ALL text in schools_of_thought MUST be in ${targetLanguage}, including ALL labels.

- 🚨 FOR EACH SCHOOL: Include school name + key philosophers + brief 5-axis description from Guide.

- REQUIRED STRUCTURE (ALL TEXT IN ${targetLanguage}):
  <strong>${probableSchoolPrefix}</strong><br/><br/>
  1. <strong>${L_schools.primary}:</strong> <SCHOOL NAME> — <Key Philosophers> (Level 1–2)<br/>
  • ${L_schools.metaphysics}: <brief description><br/>
  • ${L_schools.epistemology}: <brief description><br/>
  • ${L_schools.ethics}: <brief description><br/>
  • ${L_schools.politics}: <brief description><br/>
  • ${L_schools.aesthetics}: <brief description><br/>
  <em>${L_schools.evidence}:</em> <lyric-based justification><br/><br/>
  2. <strong>${L_schools.secondary}:</strong> <SCHOOL — Philosophers> (Level 2–3) — <brief evidence><br/><br/>
  3. <strong>${L_schools.peripheral}:</strong> <SCHOOL — Philosophers> (Level 3) — <brief evidence><br/><br/>
  4. <strong>${L_schools.exclusions}:</strong> ${L_schools.not} <list schools clearly absent><br/><br/>
  ${probableSchoolDisclaimer}

- EXAMPLE OUTPUT (English):
  <strong>Probable School of Thought</strong><br/><br/>
  1. <strong>Primary:</strong> MARXISM — Karl Marx, Friedrich Engels (Level 1)<br/>
  • Metaphysics: historical determinism; dialectical contradiction as motor.<br/>
  • Epistemology: class-conditioned "truth"; polilogism tendency.<br/>
  • Ethics: collectivism; sacrifice to class/revolution.<br/>
  • Politics: abolition of property; coercive redistribution.<br/>
  • Aesthetics: socialist realism / propaganda utility.<br/>
  <em>Evidence:</em> The explicit call to abolish private property and religion aligns directly with Marxist ideals.<br/><br/>
  2. <strong>Secondary:</strong> SECULAR HUMANISM — Auguste Comte (Level 2) — The focus on "brotherhood of man" and humanity as collective...<br/><br/>
  3. <strong>Peripheral:</strong> IDEALISM — Immanuel Kant (Level 3) — The pursuit of universal peace detached from practical needs...<br/><br/>
  4. <strong>Exclusions:</strong> NOT Objectivism; NOT Hedonism; NOT Nihilism; NOT Pragmatism.<br/><br/>
  School of Thought is a supposition based on probability. It may not be as accurate as you expect.

**REMEMBER:**
- Depth = philosophical rigor, detailed citations, nuanced interpretation
- Extensiveness = comprehensive coverage, complete context
- Quality must be IDENTICAL across all languages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${L.remember}: ${L.entireResponseJson}`;
}
