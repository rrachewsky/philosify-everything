#!/usr/bin/env node
/**
 * Generates quiz translation SQL files for 7 languages:
 *   nl (Dutch), pl (Polish), tr (Turkish), hu (Hungarian),
 *   he (Hebrew), fa (Persian), hi (Hindi)
 *
 * Reads the PT/ES/FR template to extract structure and WHERE clauses,
 * then generates translated versions for each target language.
 *
 * Usage: node migrations/generate_7lang.js
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = __dirname;

// Parse the template file
const template = fs.readFileSync(path.join(MIGRATIONS_DIR, 'quiz_translations_pt_es_fr.sql'), 'utf8');
const lines = template.split(/\r?\n/);

// Extract UPDATE statements with WHERE clauses and PT JSON data
const entries = [];
for (const line of lines) {
  if (!line.startsWith('UPDATE quiz_questions SET translations')) continue;
  const whereMatch = line.match(/WHERE question = '(.+)';$/);
  if (!whereMatch) continue;
  const jsonMatch = line.match(/translations \|\| '(\{.+\})'::jsonb/);
  if (!jsonMatch) continue;
  let jsonStr = jsonMatch[1].replace(/''/g, "'");
  try {
    const obj = JSON.parse(jsonStr);
    entries.push({ where: whereMatch[1], pt: obj.pt, es: obj.es, fr: obj.fr });
  } catch(e) {
    entries.push({ where: whereMatch[1], pt: null, es: null, fr: null });
  }
}

console.log(`Parsed ${entries.length} entries from template`);

// ============================================================
// Translation functions for each language
// These generate proper translations based on the PT/ES/FR reference
// ============================================================

// Helper: translate option text (mainly philosopher/person names)
function trName(name, lang) {
  const map = NAME_MAPS[lang];
  return (map && map[name]) || name;
}

function trOptions(opts, lang) {
  return opts.map(o => ({ id: o.id, text: trName(o.text, lang) }));
}

// Name translation maps per language
const NAME_MAPS = {
  nl: {
    'Platão': 'Plato', 'Aristóteles': 'Aristoteles', 'Sócrates': 'Socrates',
    'Plutarco': 'Plutarchus', 'Séneca': 'Seneca', 'Epicuro': 'Epicurus',
    'São Bernardo de Claraval': 'Sint Bernardus van Clairvaux',
    'Confúcio': 'Confucius', 'A Bíblia (1 Timóteo)': 'De Bijbel (1 Timotheüs)',
    'Vladimir Lenine': 'Vladimir Lenin', 'Platón': 'Plato',
  },
  pl: {
    'Platão': 'Platon', 'Aristóteles': 'Arystoteles', 'Sócrates': 'Sokrates',
    'Plutarco': 'Plutarch', 'Séneca': 'Seneka', 'Epicuro': 'Epikur',
    'São Bernardo de Claraval': 'Święty Bernard z Clairvaux',
    'Confúcio': 'Konfucjusz', 'A Bíblia (1 Timóteo)': 'Biblia (1 Tm)',
    'Vladimir Lenine': 'Włodzimierz Lenin',
  },
  tr: {
    'Platão': 'Platon', 'Aristóteles': 'Aristoteles', 'Sócrates': 'Sokrates',
    'Plutarco': 'Plutarkhos', 'Séneca': 'Seneca', 'Epicuro': 'Epikür',
    'São Bernardo de Claraval': "Clairvaux'lu Aziz Bernard",
    'Confúcio': 'Konfüçyüs', 'A Bíblia (1 Timóteo)': 'Kutsal Kitap (1. Timoteos)',
    'Vladimir Lenine': 'Vladimir Lenin',
  },
  hu: {
    'Platão': 'Platón', 'Aristóteles': 'Arisztotelész', 'Sócrates': 'Szókratész',
    'Plutarco': 'Plutarkhosz', 'Séneca': 'Seneca', 'Epicuro': 'Epikurosz',
    'São Bernardo de Claraval': 'Clairvaux-i Szent Bernát',
    'Confúcio': 'Konfuciusz', 'A Bíblia (1 Timóteo)': 'Biblia (1Tim)',
    'Vladimir Lenine': 'Vlagyimir Lenin',
  },
  he: {
    'Platão': 'אפלטון', 'Aristóteles': 'אריסטו', 'Sócrates': 'סוקרטס',
    'Plutarco': 'פלוטרכוס', 'Séneca': 'סנקה', 'Epicuro': 'אפיקורוס',
    'São Bernardo de Claraval': 'ברנרד הקדוש מקלרוו',
    'Confúcio': 'קונפוציוס', 'A Bíblia (1 Timóteo)': 'התנ"ך (טימותיאוס א\')',
    'René Descartes': 'רנה דקארט', 'Immanuel Kant': 'עמנואל קאנט',
    'Karl Marx': 'קארל מרקס', 'John Milton': "ג'ון מילטון",
    'Samuel Johnson': "סמואל ג'ונסון",
    'Vladimir Lenine': 'ולדימיר לנין', 'Friedrich Nietzsche': 'פרידריך ניטשה',
    'Sigmund Freud': 'זיגמונד פרויד', 'Adam Smith': 'אדם סמית\'',
  },
  fa: {
    'Platão': 'افلاطون', 'Aristóteles': 'ارسطو', 'Sócrates': 'سقراط',
    'Plutarco': 'پلوتارک', 'Séneca': 'سنکا', 'Epicuro': 'اپیکور',
    'São Bernardo de Claraval': 'قدیس برنارد کلروویی',
    'Confúcio': 'کنفوسیوس', 'A Bíblia (1 Timóteo)': 'کتاب مقدس (اول تیموتائوس)',
    'René Descartes': 'رنه دکارت', 'Immanuel Kant': 'ایمانوئل کانت',
    'Karl Marx': 'کارل مارکس',
    'Vladimir Lenine': 'ولادیمیر لنین', 'Friedrich Nietzsche': 'فریدریش نیچه',
  },
  hi: {
    'Platão': 'प्लेटो', 'Aristóteles': 'अरस्तू', 'Sócrates': 'सुकरात',
    'Plutarco': 'प्लूटार्क', 'Séneca': 'सेनेका', 'Epicuro': 'एपिक्यूरस',
    'São Bernardo de Claraval': 'क्लेयरवॉ के संत बर्नार्ड',
    'Confúcio': 'कन्फ्यूशियस', 'A Bíblia (1 Timóteo)': 'बाइबल (1 तीमुथियुस)',
    'René Descartes': 'रेने देकार्त', 'Immanuel Kant': 'इमैनुएल कांट',
    'Karl Marx': 'कार्ल मार्क्स',
    'Vladimir Lenine': 'व्लादिमीर लेनिन', 'Friedrich Nietzsche': 'फ्रीड्रिख नीत्शे',
  },
};

// ============================================================
// Generate each language file
// ============================================================

const LANG_NAMES = {
  nl: 'Dutch (Nederlands)',
  pl: 'Polish (Polski)',
  tr: 'Turkish (Türkçe)',
  hu: 'Hungarian (Magyar)',
  he: 'Hebrew (עברית)',
  fa: 'Persian (فارسی)',
  hi: 'Hindi (हिन्दी)',
};

// We'll load pre-built translation data from JSON files
// For now, generate the SQL structure and fill with translations

for (const lang of ['nl','pl','tr','hu','he','fa','hi']) {
  const langName = LANG_NAMES[lang];
  const dataFile = path.join(MIGRATIONS_DIR, `_translations_${lang}.json`);
  
  let transData;
  if (fs.existsSync(dataFile)) {
    transData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } else {
    console.log(`Translation data file not found for ${lang}, skipping`);
    continue;
  }
  
  let sql = '';
  sql += `-- ============================================================\n`;
  sql += `-- PHILOSIFY QUIZ - Translations for ${lang.toUpperCase()} (${langName})\n`;
  sql += `-- Generated migration: adds ${lang} translations JSONB for 134 questions\n`;
  sql += `-- ============================================================\n\n`;
  
  let count = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const t = transData[i];
    if (!t) continue;
    
    const jsonObj = {};
    jsonObj[lang] = {
      question: t.question,
      options: t.options,
      explanation: t.explanation,
      wrong_explanations: t.wrong_explanations,
    };
    
    let jsonStr = JSON.stringify(jsonObj);
    jsonStr = jsonStr.replace(/'/g, "''");
    
    sql += `-- Q${i + 1}\n`;
    sql += `UPDATE quiz_questions SET translations = translations || '${jsonStr}'::jsonb WHERE question = '${entry.where}';\n\n`;
    count++;
  }
  
  const outFile = path.join(MIGRATIONS_DIR, `quiz_translations_${lang}.sql`);
  fs.writeFileSync(outFile, sql, 'utf8');
  console.log(`${lang.toUpperCase()}: Written ${outFile} — ${count} UPDATE statements`);
}
