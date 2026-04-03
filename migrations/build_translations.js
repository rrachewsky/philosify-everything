#!/usr/bin/env node
/**
 * Builds complete translation data for 7 languages (134 questions each)
 * and generates final SQL migration files.
 *
 * Usage: node migrations/build_translations.js
 */

const fs = require('fs');
const path = require('path');

const eq = JSON.parse(fs.readFileSync(path.join(__dirname, '_english_questions.json')));
const template = fs.readFileSync(path.join(__dirname, 'quiz_translations_pt_es_fr.sql'), 'utf8');

// Extract WHERE clauses
const whereList = [];
for (const line of template.split(/\r?\n/)) {
  if (!line.startsWith('UPDATE quiz_questions')) continue;
  const m = line.match(/WHERE question = '(.+)';$/);
  if (m) whereList.push(m[1]);
}

console.log(`Processing ${eq.length} questions for 7 languages...`);

// ============================================================
// Name translation maps
// ============================================================
const NM = {
  nl: { 'Plato': 'Plato', 'Aristotle': 'Aristoteles', 'Socrates': 'Socrates', 'Plutarch': 'Plutarchus', 'Seneca': 'Seneca', 'Epicurus': 'Epicurus', 'Saint Bernard of Clairvaux': 'Sint Bernardus van Clairvaux', 'Confucius': 'Confucius', 'The Bible (1 Timothy)': 'De Bijbel (1 Timotheüs)', 'Leon Trotsky': 'Leon Trotski' },
  pl: { 'Plato': 'Platon', 'Aristotle': 'Arystoteles', 'Socrates': 'Sokrates', 'Plutarch': 'Plutarch', 'Seneca': 'Seneka', 'Epicurus': 'Epikur', 'Saint Bernard of Clairvaux': 'Święty Bernard z Clairvaux', 'Confucius': 'Konfucjusz', 'The Bible (1 Timothy)': 'Biblia (1 Tm)', 'Leon Trotsky': 'Lew Trocki', 'Vladimir Lenin': 'Włodzimierz Lenin' },
  tr: { 'Plato': 'Platon', 'Aristotle': 'Aristoteles', 'Socrates': 'Sokrates', 'Plutarch': 'Plutarkhos', 'Seneca': 'Seneca', 'Epicurus': 'Epikür', 'Saint Bernard of Clairvaux': 'Aziz Bernard', 'Confucius': 'Konfüçyüs', 'The Bible (1 Timothy)': 'Kutsal Kitap (1. Timoteos)', 'Leon Trotsky': 'Lev Troçki' },
  hu: { 'Plato': 'Platón', 'Aristotle': 'Arisztotelész', 'Socrates': 'Szókratész', 'Plutarch': 'Plutarkhosz', 'Seneca': 'Seneca', 'Epicurus': 'Epikurosz', 'Saint Bernard of Clairvaux': 'Clairvaux-i Szent Bernát', 'Confucius': 'Konfuciusz', 'The Bible (1 Timothy)': 'Biblia (1Tim)', 'Leon Trotsky': 'Lev Trockij', 'Vladimir Lenin': 'Vlagyimir Lenin' },
  he: { 'Plato': 'אפלטון', 'Aristotle': 'אריסטו', 'Socrates': 'סוקרטס', 'Plutarch': 'פלוטרכוס', 'Seneca': 'סנקה', 'Epicurus': 'אפיקורוס', 'Saint Bernard of Clairvaux': 'ברנרד הקדוש מקלרוו', 'Confucius': 'קונפוציוס', 'The Bible (1 Timothy)': 'התנ"ך (טימותיאוס א\')', 'René Descartes': 'רנה דקארט', 'Immanuel Kant': 'עמנואל קאנט', 'Karl Marx': 'קארל מרקס', 'Friedrich Nietzsche': 'פרידריך ניטשה', 'Adam Smith': 'אדם סמית\'', 'Leon Trotsky': 'לאון טרוצקי', 'Vladimir Lenin': 'ולדימיר לנין', 'John Locke': 'ג\'ון לוק', 'Samuel Johnson': 'סמואל ג\'ונסון', 'Sigmund Freud': 'זיגמונד פרויד', 'John Milton': 'ג\'ון מילטון' },
  fa: { 'Plato': 'افلاطون', 'Aristotle': 'ارسطو', 'Socrates': 'سقراط', 'Plutarch': 'پلوتارک', 'Seneca': 'سنکا', 'Epicurus': 'اپیکور', 'Saint Bernard of Clairvaux': 'قدیس برنارد کلروویی', 'Confucius': 'کنفوسیوس', 'The Bible (1 Timothy)': 'کتاب مقدس (اول تیموتائوس)', 'René Descartes': 'رنه دکارت', 'Immanuel Kant': 'ایمانوئل کانت', 'Karl Marx': 'کارل مارکس', 'Friedrich Nietzsche': 'فریدریش نیچه', 'Adam Smith': 'آدام اسمیت', 'Leon Trotsky': 'لئون تروتسکی', 'Vladimir Lenin': 'ولادیمیر لنین' },
  hi: { 'Plato': 'प्लेटो', 'Aristotle': 'अरस्तू', 'Socrates': 'सुकरात', 'Plutarch': 'प्लूटार्क', 'Seneca': 'सेनेका', 'Epicurus': 'एपिक्यूरस', 'Saint Bernard of Clairvaux': 'क्लेयरवॉ के संत बर्नार्ड', 'Confucius': 'कन्फ्यूशियस', 'The Bible (1 Timothy)': 'बाइबल (1 तीमुथियुस)', 'René Descartes': 'रेने देकार्त', 'Immanuel Kant': 'इमैनुएल कांट', 'Karl Marx': 'कार्ल मार्क्स', 'Friedrich Nietzsche': 'फ्रीड्रिख नीत्शे', 'Adam Smith': 'एडम स्मिथ', 'Leon Trotsky': 'लियोन ट्रॉट्स्की', 'Vladimir Lenin': 'व्लादिमीर लेनिन' },
};

function tn(n,l) { return (NM[l] && NM[l][n]) || n; }
function to(opts,l) { return opts.map(o => ({id:o.id, text:tn(o.text,l)})); }

// ============================================================
// COMPLETE TRANSLATION DATA
// All 134 questions for all 7 languages
// ============================================================

// Load the comprehensive translations module
// This contains FULL translated text for all questions in all languages
const T = require('./_full_translations.js');

// Build the final translations structure
const TRANS = {};
for (const lang of ['nl','pl','tr','hu','he','fa','hi']) {
  TRANS[lang] = [];
  for (let i = 0; i < eq.length; i++) {
    const q = eq[i];
    const t = T[lang][i];
    TRANS[lang].push({
      question: t.question,
      options: t.options || to(q.options, lang),
      explanation: t.explanation,
      wrong_explanations: t.wrong_explanations
    });
  }
}

// ============================================================
// Generate SQL files
// ============================================================
const LANG_NAMES = {
  nl:'Dutch (Nederlands)', pl:'Polish (Polski)', tr:'Turkish (Türkçe)',
  hu:'Hungarian (Magyar)', he:'Hebrew (עברית)', fa:'Persian (فارسی)', hi:'Hindi (हिन्दी)'
};

for (const lang of ['nl','pl','tr','hu','he','fa','hi']) {
  const langName = LANG_NAMES[lang];
  let sql = `-- ============================================================\n`;
  sql += `-- PHILOSIFY QUIZ - Translations for ${lang.toUpperCase()} (${langName})\n`;
  sql += `-- Generated migration: adds ${lang} translations JSONB for 134 questions\n`;
  sql += `-- ============================================================\n\n`;
  
  let count = 0;
  for (let i = 0; i < whereList.length; i++) {
    const t = TRANS[lang][i];
    const jsonObj = {};
    jsonObj[lang] = {
      question: t.question,
      options: t.options,
      explanation: t.explanation,
      wrong_explanations: t.wrong_explanations
    };
    
    let jsonStr = JSON.stringify(jsonObj);
    jsonStr = jsonStr.replace(/'/g, "''");
    
    sql += `-- Q${i+1}\n`;
    sql += `UPDATE quiz_questions SET translations = translations || '${jsonStr}'::jsonb WHERE question = '${whereList[i]}';\n\n`;
    count++;
  }
  
  const outFile = path.join(__dirname, `quiz_translations_${lang}.sql`);
  fs.writeFileSync(outFile, sql, 'utf8');
  console.log(`${lang.toUpperCase()}: ${count} UPDATE statements → ${outFile}`);
}

console.log('\nAll 7 SQL migration files generated successfully!');
