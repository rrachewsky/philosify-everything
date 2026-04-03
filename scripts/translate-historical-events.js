/**
 * Script to translate historicalEvents from English to all other languages
 * Uses the existing translated titles from each language file
 * and translates descriptions and analyses
 */

const fs = require('fs');
const path = require('path');

// Read English events as source
const enPath = path.join(__dirname, '../site/src/i18n/translations/en.json');
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enEvents = enJson.historicalEvents;

// Languages to translate (excluding en)
const languages = [
  'pt', 'es', 'fr', 'de', 'it', 'nl', 'pl', 'hu', 'tr',
  'ru', 'ja', 'ko', 'zh', 'hi', 'ar', 'he', 'fa'
];

// Translation dictionaries for common phrases
const translations = {
  // POSITIVE/NEGATIVE/Long-term labels
  'POSITIVE:': {
    pt: 'POSITIVO:', es: 'POSITIVO:', fr: 'POSITIF:', de: 'POSITIV:', it: 'POSITIVO:',
    nl: 'POSITIEF:', pl: 'POZYTYWNE:', hu: 'POZITÍV:', tr: 'POZİTİF:',
    ru: 'ПОЛОЖИТЕЛЬНОЕ:', ja: 'プラス面:', ko: '긍정적:', zh: '正面:',
    hi: 'सकारात्मक:', ar: 'إيجابي:', he: 'חיובי:', fa: 'مثبت:'
  },
  'NEGATIVE:': {
    pt: 'NEGATIVO:', es: 'NEGATIVO:', fr: 'NÉGATIF:', de: 'NEGATIV:', it: 'NEGATIVO:',
    nl: 'NEGATIEF:', pl: 'NEGATYWNE:', hu: 'NEGATÍV:', tr: 'NEGATİF:',
    ru: 'ОТРИЦАТЕЛЬНОЕ:', ja: 'マイナス面:', ko: '부정적:', zh: '负面:',
    hi: 'नकारात्मक:', ar: 'سلبي:', he: 'שלילי:', fa: 'منفی:'
  },
  'Long-term:': {
    pt: 'Longo prazo:', es: 'A largo plazo:', fr: 'À long terme:', de: 'Langfristig:', it: 'A lungo termine:',
    nl: 'Op lange termijn:', pl: 'Długoterminowo:', hu: 'Hosszú távon:', tr: 'Uzun vadede:',
    ru: 'Долгосрочно:', ja: '長期的影響:', ko: '장기적 영향:', zh: '长期影响:',
    hi: 'दीर्घकालिक:', ar: 'على المدى الطويل:', he: 'לטווח ארוך:', fa: 'بلندمدت:'
  },
  'Consequences:': {
    pt: 'Consequências:', es: 'Consecuencias:', fr: 'Conséquences:', de: 'Konsequenzen:', it: 'Conseguenze:',
    nl: 'Gevolgen:', pl: 'Konsekwencje:', hu: 'Következmények:', tr: 'Sonuçlar:',
    ru: 'Последствия:', ja: '結果:', ko: '결과:', zh: '后果:',
    hi: 'परिणाम:', ar: 'العواقب:', he: 'תוצאות:', fa: 'پیامدها:'
  },
  'Philosophical significance:': {
    pt: 'Significado filosófico:', es: 'Significado filosófico:', fr: 'Signification philosophique:', 
    de: 'Philosophische Bedeutung:', it: 'Significato filosofico:',
    nl: 'Filosofische betekenis:', pl: 'Znaczenie filozoficzne:', hu: 'Filozófiai jelentőség:', 
    tr: 'Felsefi önemi:',
    ru: 'Философское значение:', ja: '哲学的意義:', ko: '철학적 의미:', zh: '哲学意义:',
    hi: 'दार्शनिक महत्व:', ar: 'الأهمية الفلسفية:', he: 'משמעות פילוסופית:', fa: 'اهمیت فلسفی:'
  }
};

// Process each language
languages.forEach(lang => {
  const langPath = path.join(__dirname, `../site/src/i18n/translations/${lang}.json`);
  const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  const existingEvents = langJson.historicalEvents || {};
  
  // Create new nested structure
  const newEvents = {};
  
  Object.keys(enEvents).forEach(eventId => {
    const enEvent = enEvents[eventId];
    
    // Use existing translated title if available, otherwise use English
    const existingTitle = typeof existingEvents[eventId] === 'string' 
      ? existingEvents[eventId] 
      : (existingEvents[eventId]?.title || enEvent.title);
    
    newEvents[eventId] = {
      title: existingTitle,
      description: enEvent.description, // Will be translated below
      analysis: enEvent.analysis // Will be translated below
    };
  });
  
  // Save the structure (descriptions and analyses need manual translation or API call)
  langJson.historicalEvents = newEvents;
  fs.writeFileSync(langPath, JSON.stringify(langJson, null, 2));
  
  console.log(`Updated ${lang}.json with ${Object.keys(newEvents).length} events (nested structure)`);
});

console.log('\nDone! Note: descriptions and analyses are in English and need translation.');
