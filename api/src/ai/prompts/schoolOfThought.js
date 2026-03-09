// ============================================================
// AI - PROBABLE SCHOOL OF THOUGHT (LOCALIZED OUTPUT HELPERS)
// ============================================================

export function getProbableSchoolDisclaimer(lang = 'en') {
  const l = String(lang || 'en').toLowerCase();

  // NOTE: Keep these deterministic; this string is enforced server-side.
  const map = {
    en: 'School of Thought is a supposion based on probability. It may not be as accurated as you are expecting.',
    pt: 'Escola de Pensamento é uma suposição baseada em probabilidade. Pode não ser tão precisa quanto você espera.',
    es: 'La Escuela de Pensamiento es una suposición basada en probabilidad. Puede no ser tan precisa como esperas.',
    fr: 'L’École de pensée est une supposition fondée sur la probabilité. Elle peut ne pas être aussi précise que vous l’espérez.',
    de: 'Die Denkschule ist eine Annahme auf Basis von Wahrscheinlichkeit. Sie ist möglicherweise nicht so präzise, wie Sie erwarten.',
    it: 'La Scuola di pensiero è una supposizione basata sulla probabilità. Potrebbe non essere precisa quanto ti aspetti.'
  };

  return map[l] || map.en;
}

export function getProbableSchoolPrefix(lang = 'en') {
  const l = String(lang || 'en').toLowerCase();
  const map = {
    en: 'Probable School of Thought',
    pt: 'Escola de Pensamento (provável)',
    es: 'Escuela de Pensamiento (probable)',
    fr: 'École de pensée (probable)',
    de: 'Denkschule (wahrscheinlich)',
    it: 'Scuola di pensiero (probabile)'
  };
  return map[l] || map.en;
}

