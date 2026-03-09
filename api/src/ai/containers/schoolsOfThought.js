// ============================================================
// AI CONTAINER - SCHOOL(S) OF THOUGHT CLASSIFICATION
// ============================================================
// This container is intentionally independent from the main analysis prompt.
// It produces a small, structured JSON used to build a final "comment-style"
// last paragraph inside `philosophical_analysis`.

import { callOpenAI } from '../models/openai.js';
import { extractJSON } from '../parser.js';
import { getProbableSchoolDisclaimer } from '../prompts/schoolOfThought.js';

function normalizeLang(lang = 'en') {
  const l = String(lang || 'en').toLowerCase();
  return l;
}

function numberLyricsLines(lyrics) {
  const lines = String(lyrics || '').split(/\r?\n/);
  return lines.map((line, i) => `${i + 1}| ${line}`).join('\n');
}

function extractSchoolsReference(guideText) {
  const g = String(guideText || '');
  // Heuristic: keep the "PHILOSOPHICAL INFLUENCES" and "SCHOOLS_*" blocks if present.
  const startIdx =
    g.indexOf('@@SECTION id=core_influences_evidence') !== -1
      ? g.indexOf('@@SECTION id=core_influences_evidence')
      : g.indexOf('PHILOSOPHICAL INFLUENCES');

  if (startIdx === -1) {
    // Fallback: return a short hint only
    return [
      'SCHOOLS AVAILABLE FOR CLASSIFICATION:',
      'Objectivism, Marxism, Stoicism, Existentialism, Nihilism, Religion/Faith, Utilitarianism, Determinism, Hedonism, Pragmatism, Zen/Buddhism, Kantian Idealism, Postmodernism, Secular Humanism.',
    ].join('\n');
  }

  // Try to stop after the schools list ends to keep prompt size under control.
  const endMarkers = [
    'END — REFERENCE ONLY',
    'END - REFERENCE ONLY',
    'END OF GUIDE',
  ];
  let endIdx = -1;
  for (const m of endMarkers) {
    const idx = g.indexOf(m, startIdx);
    if (idx !== -1) {
      endIdx = idx;
      break;
    }
  }

  const slice = endIdx !== -1 ? g.slice(startIdx, endIdx) : g.slice(startIdx);
  // Hard cap (prompt budget safety)
  return slice.slice(0, 12000);
}

function labelsForLang(lang) {
  const l = normalizeLang(lang);
  const map = {
    en: {
      heading: 'School(s) of Thought (probable)',
      primary: 'Primary',
      secondary: 'Secondary',
      peripheral: 'Peripheral',
      exclusions: 'Exclusions',
      finalOrder: 'Final order',
      level: 'Level',
      not: 'NOT',
      uncertain: 'Mixed/Uncertain',
      arrow: '→'
    },
    pt: {
      heading: 'Escola(s) de Pensamento (provável)',
      primary: 'Primária',
      secondary: 'Secundárias',
      peripheral: 'Periféricas',
      exclusions: 'Exclusões',
      finalOrder: 'Ordem final',
      level: 'Nível',
      not: 'NÃO',
      uncertain: 'Misto/Incerto',
      arrow: '→'
    },
    es: {
      heading: 'Escuela(s) de Pensamiento (probable)',
      primary: 'Primaria',
      secondary: 'Secundarias',
      peripheral: 'Periféricas',
      exclusions: 'Exclusiones',
      finalOrder: 'Orden final',
      level: 'Nivel',
      not: 'NO',
      uncertain: 'Mixto/Incierto',
      arrow: '→'
    },
    fr: {
      heading: 'École(s) de pensée (probable)',
      primary: 'Principale',
      secondary: 'Secondaires',
      peripheral: 'Périphériques',
      exclusions: 'Exclusions',
      finalOrder: 'Ordre final',
      level: 'Niveau',
      not: 'PAS',
      uncertain: 'Mixte/Incertain',
      arrow: '→'
    },
    de: {
      heading: 'Denkschule(n) (wahrscheinlich)',
      primary: 'Primär',
      secondary: 'Sekundär',
      peripheral: 'Peripher',
      exclusions: 'Ausschlüsse',
      finalOrder: 'Endreihenfolge',
      level: 'Stufe',
      not: 'NICHT',
      uncertain: 'Gemischt/Unklar',
      arrow: '→'
    },
    it: {
      heading: 'Scuola(e) di pensiero (probabile)',
      primary: 'Primaria',
      secondary: 'Secondarie',
      peripheral: 'Periferiche',
      exclusions: 'Esclusioni',
      finalOrder: 'Ordine finale',
      level: 'Livello',
      not: 'NON',
      uncertain: 'Misto/Incerto',
      arrow: '→'
    }
  };
  return map[l] || map.en;
}

function languageNameForLang(lang = 'en') {
  const l = normalizeLang(lang);
  const map = {
    en: 'English',
    pt: 'Portuguese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    hu: 'Hungarian',
    ru: 'Russian',
    ja: 'Japanese',
    zh: 'Chinese',
    ko: 'Korean',
    he: 'Hebrew',
    ar: 'Arabic',
    hi: 'Hindi',
    fa: 'Persian'
  };
  return map[l] || 'English';
}

export async function classifySchoolsOfThought({
  song,
  artist,
  lang = 'en',
  lyrics,
  guideText,
  env
}) {
  const targetLanguage = languageNameForLang(lang);

  const schoolsReference = extractSchoolsReference(guideText);
  const numberedLyrics = numberLyricsLines(lyrics);

  const prompt = `
You are running the "SCHOOL(S) OF THOUGHT — CLASSIFICATION" container.

Output STRICTLY VALID JSON only (no markdown, no commentary), with this exact schema:
{
  "primary": [{"school":"", "evidence_level": 1, "justification": ""}],
  "secondary": [{"school":"", "evidence_level": 2, "justification": ""}],
  "peripheral": [{"school":"", "evidence_level": 3, "justification": ""}],
  "excluded": ["", ""],
  "final_order": ["", ""]
}

Rules:
- Use ONLY schools listed in the reference text below.
- evidence_level must be 1, 2, or 3 only.
- justification must be short (1 sentence) and grounded in lyric evidence (cite line numbers like "L12–L18").
- Do not speculate. If unclear, keep arrays empty except "excluded" can still list clear NOT fits.
- Write in the requested output language (lang = "${normalizeLang(lang)}").

Song:
- Title: ${song}
- Artist: ${artist}

Reference: Schools of Thought (from Guide)
${schoolsReference}

Lyrics (with line numbers):
${numberedLyrics}
`;

  // Use OpenAI JSON mode for reliability; keep temperature low.
  const raw = await callOpenAI(prompt, targetLanguage, env);
  const parsed = extractJSON(raw);
  return parsed;
}

export function buildSchoolsOfThoughtParagraph(classificationJson, lang = 'en') {
  const t = labelsForLang(lang);
  const disclaimer = getProbableSchoolDisclaimer(lang);

  const primary = (classificationJson?.primary || []).slice(0, 1);
  const secondary = (classificationJson?.secondary || []).slice(0, 2);
  const peripheral = (classificationJson?.peripheral || []).slice(0, 2);
  const excluded = (classificationJson?.excluded || []).slice(0, 5);
  const finalOrder = (classificationJson?.final_order || []).slice(0, 6);

  const fmtList = (arr, fmt) => arr.length ? arr.map(fmt).join(', ') : '';

  const line1 = `${t.heading}: ` +
    `${t.primary} — ${fmtList(primary, (x) => `${x.school} (${t.level} ${x.evidence_level})`) || t.uncertain}. ` +
    `${t.secondary} — ${fmtList(secondary, (x) => `${x.school} (${t.level} ${x.evidence_level})`) || '—'}. ` +
    `${t.peripheral} — ${fmtList(peripheral, (x) => `${x.school} (${t.level} ${x.evidence_level})`) || '—'}. ` +
    `${t.exclusions} — ${excluded.length ? excluded.map((s) => `${t.not} ${s}`).join('; ') : '—'}. ` +
    `${t.finalOrder} — ${finalOrder.length ? finalOrder.join(` ${t.arrow} `) : '—'}.`;

  const justifications = [
    ...primary,
    ...secondary
  ]
    .map((x) => String(x?.justification || '').trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');

  const line2 = justifications ? justifications : '';

  // One paragraph: join with spaces.
  const parts = [line1, line2, disclaimer].filter(Boolean);
  return parts.join(' ');
}

