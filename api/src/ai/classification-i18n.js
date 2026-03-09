// ============================================================
// AI - CLASSIFICATION LOCALIZATION (DISPLAY LABELS)
// ============================================================
// We keep `classification` as a canonical enum (English) for storage/logic,
// and provide a localized display label for the requested language.
//
// IMPORTANT:
// - These strings should be treated as UI copy. Keep them consistent.
// - If a language is missing, we fall back to English.

const CLASSIFICATION_LOCALIZED = {
  en: {
    'Extremely Revolutionary': 'Extremely Revolutionary',
    'Revolutionary': 'Revolutionary',
    'Moderately Revolutionary': 'Moderately Revolutionary',
    'Constructive Critique': 'Constructive Critique',
    'Ambiguous, Leaning Realist': 'Ambiguous, Leaning Realist',
    'Ambiguous, Leaning Evasion': 'Ambiguous, Leaning Evasion',
    'Soft Conformist': 'Soft Conformist',
    'Directly Conformist': 'Directly Conformist',
    'Strongly Conformist': 'Strongly Conformist',
    'Doctrinally Conformist': 'Doctrinally Conformist'
  },
  pt: {
    'Extremely Revolutionary': 'Extremamente Revolucionária',
    'Revolutionary': 'Revolucionária',
    'Moderately Revolutionary': 'Moderadamente Revolucionária',
    'Constructive Critique': 'Crítica Construtiva',
    'Ambiguous, Leaning Realist': 'Ambígua, Inclinada ao Realismo',
    'Ambiguous, Leaning Evasion': 'Ambígua, Inclinada à Evasão',
    'Soft Conformist': 'Conformista Suave',
    'Directly Conformist': 'Diretamente Conformista',
    'Strongly Conformist': 'Fortemente Conformista',
    'Doctrinally Conformist': 'Doutrinariamente Conformista'
  },
  es: {
    'Extremely Revolutionary': 'Extremadamente Revolucionaria',
    'Revolutionary': 'Revolucionaria',
    'Moderately Revolutionary': 'Moderadamente Revolucionaria',
    'Constructive Critique': 'Crítica Constructiva',
    'Ambiguous, Leaning Realist': 'Ambigua, Inclinada al Realismo',
    'Ambiguous, Leaning Evasion': 'Ambigua, Inclinada a la Evasión',
    'Soft Conformist': 'Conformista Suave',
    'Directly Conformist': 'Directamente Conformista',
    'Strongly Conformist': 'Fuertemente Conformista',
    'Doctrinally Conformist': 'Doctrinalmente Conformista'
  },
  fr: {
    'Extremely Revolutionary': 'Extrêmement Révolutionnaire',
    'Revolutionary': 'Révolutionnaire',
    'Moderately Revolutionary': 'Modérément Révolutionnaire',
    'Constructive Critique': 'Critique Constructive',
    'Ambiguous, Leaning Realist': 'Ambigu, Penché vers le Réalisme',
    'Ambiguous, Leaning Evasion': 'Ambigu, Penché vers l’Évasion',
    'Soft Conformist': 'Conformiste Modéré',
    'Directly Conformist': 'Directement Conformiste',
    'Strongly Conformist': 'Fortement Conformiste',
    'Doctrinally Conformist': 'Doctrinalement Conformiste'
  },
  de: {
    'Extremely Revolutionary': 'Extrem Revolutionär',
    'Revolutionary': 'Revolutionär',
    'Moderately Revolutionary': 'Mäßig Revolutionär',
    'Constructive Critique': 'Konstruktive Kritik',
    'Ambiguous, Leaning Realist': 'Ambivalent, Zum Realismus Neigend',
    'Ambiguous, Leaning Evasion': 'Ambivalent, Zur Evasion Neigend',
    'Soft Conformist': 'Sanft Konformistisch',
    'Directly Conformist': 'Direkt Konformistisch',
    'Strongly Conformist': 'Stark Konformistisch',
    'Doctrinally Conformist': 'Doktrinär Konformistisch'
  },
  it: {
    'Extremely Revolutionary': 'Estremamente Rivoluzionario',
    'Revolutionary': 'Rivoluzionario',
    'Moderately Revolutionary': 'Moderatamente Rivoluzionario',
    'Constructive Critique': 'Critica Costruttiva',
    'Ambiguous, Leaning Realist': 'Ambiguo, Incline al Realismo',
    'Ambiguous, Leaning Evasion': 'Ambiguo, Incline all’Evasione',
    'Soft Conformist': 'Conformista Moderato',
    'Directly Conformist': 'Direttamente Conformista',
    'Strongly Conformist': 'Fortemente Conformista',
    'Doctrinally Conformist': 'Dottrinalmente Conformista'
  }
};

export function localizeClassification(classificationEnum, lang = 'en') {
  const key = String(classificationEnum || '').trim();
  if (!key) return '';

  const table = CLASSIFICATION_LOCALIZED[lang] || CLASSIFICATION_LOCALIZED.en;
  return table[key] || CLASSIFICATION_LOCALIZED.en[key] || key;
}

