// ============================================================
// PHILOSOPHER DICTIONARY - Name variants for extraction
// Auto-builds from constellation seed data
// ============================================================

import { SEED_NODES } from '../data/constellationSeedData.js';

// Manual name variants for common philosophers (supplements auto-generated variants)
const MANUAL_VARIANTS = {
  'aristotle': ['aristotelian', 'peripatetic', 'the stagirite', 'aristoteles'],
  'plato': ['platonic', 'platonism', 'platonist', 'platonian'],
  'socrates': ['socratic', 'socratean'],
  'kant': ['kantian', 'kantianism', 'immanuel kant'],
  'marx': ['marxist', 'marxism', 'marxian', 'karl marx'],
  'rand': ['randian', 'objectivism', 'objectivist', 'ayn rand'],
  'nietzsche': ['nietzschean', 'zarathustra', 'übermensch', 'ubermensch', 'friedrich nietzsche'],
  'hegel': ['hegelian', 'hegelianism', 'dialectic'],
  'locke': ['lockean', 'john locke', 'tabula rasa'],
  'confucius': ['confucian', 'confucianism', 'kongzi', 'kong qiu', 'master kong'],
  'buddha': ['buddhist', 'buddhism', 'siddhartha', 'gautama', 'shakyamuni'],
  'laozi': ['lao tzu', 'lao-tzu', 'laotzu', 'taoist', 'taoism', 'daoist', 'daoism'],
  'zhuangzi': ['chuang tzu', 'chuang-tzu', 'zhuang zhou'],
  'descartes': ['cartesian', 'cartesianism', 'rené descartes', 'rene descartes'],
  'spinoza': ['spinozist', 'spinozism', 'baruch spinoza', 'benedict spinoza'],
  'leibniz': ['leibnizian', 'gottfried leibniz'],
  'hume': ['humean', 'humeanism', 'david hume'],
  'rousseau': ['rousseauian', 'jean-jacques rousseau', 'jean jacques rousseau'],
  'voltaire': ['voltairean', 'françois-marie arouet'],
  'mill': ['john stuart mill', 'j.s. mill', 'millian', 'utilitarian'],
  'bentham': ['benthamite', 'jeremy bentham', 'utilitarianism'],
  'hobbes': ['hobbesian', 'thomas hobbes', 'leviathan'],
  'smith': ['adam smith', 'smithian', 'invisible hand'],
  'mises': ['misesian', 'ludwig von mises', 'praxeology'],
  'hayek': ['hayekian', 'friedrich hayek', 'f.a. hayek'],
  'aquinas': ['thomist', 'thomism', 'thomas aquinas', 'st. thomas'],
  'augustine': ['augustinian', 'saint augustine', 'st. augustine'],
  'kierkegaard': ['kierkegaardian', 'søren kierkegaard', 'soren kierkegaard'],
  'sartre': ['sartrean', 'jean-paul sartre', 'jean paul sartre'],
  'camus': ['camusian', 'albert camus', 'absurdism', 'absurdist'],
  'heidegger': ['heideggerian', 'martin heidegger', 'dasein'],
  'wittgenstein': ['wittgensteinian', 'ludwig wittgenstein'],
  'frege': ['fregean', 'gottlob frege'],
  'russell': ['russellian', 'bertrand russell'],
  'popper': ['popperian', 'karl popper', 'falsifiability'],
  'foucault': ['foucauldian', 'michel foucault'],
  'derrida': ['derridean', 'jacques derrida', 'deconstruction'],
  'rawls': ['rawlsian', 'john rawls', 'veil of ignorance'],
  'nozick': ['nozickian', 'robert nozick'],
  'schopenhauer': ['schopenhauerian', 'arthur schopenhauer'],
  'epicurus': ['epicurean', 'epicureanism'],
  'seneca': ['senecan', 'lucius seneca'],
  'marcus_aurelius': ['marcus aurelius', 'aurelius', 'meditations'],
  'epictetus': ['epictetan'],
  'machiavelli': ['machiavellian', 'niccolò machiavelli', 'niccolo machiavelli', 'the prince'],
  'montesquieu': ['montesquieuian', 'charles de montesquieu'],
  'tocqueville': ['alexis de tocqueville', 'tocquevillian'],
  'burke': ['burkean', 'edmund burke'],
  'paine': ['thomas paine'],
  'thoreau': ['henry david thoreau', 'thoreauvian'],
  'emerson': ['ralph waldo emerson', 'emersonian', 'transcendentalism', 'transcendentalist'],
  'james': ['william james', 'jamesian', 'pragmatism', 'pragmatist'],
  'dewey': ['john dewey', 'deweyan'],
  'whitehead': ['alfred north whitehead', 'whiteheadian', 'process philosophy'],
  'comte': ['comtean', 'auguste comte', 'positivism', 'positivist'],
  'durkheim': ['durkheimian', 'émile durkheim', 'emile durkheim'],
  'weber': ['weberian', 'max weber'],
  'simmel': ['georg simmel'],
  'parmenides': ['parmenidean', 'eleatic'],
  'heraclitus': ['heraclitean', 'heracliteanism'],
  'pythagoras': ['pythagorean', 'pythagoreanism'],
  'democritus': ['democritean', 'atomism', 'atomist'],
  'protagoras': ['protagorean', 'sophist', 'sophism'],
  'gorgias': ['gorgian'],
  'zeno': ['zenonian', 'zeno of elea', 'zeno of citium'],
  'plotinus': ['plotinian', 'neoplatonism', 'neoplatonist'],
  'avicenna': ['ibn sina', 'avicennan'],
  'averroes': ['ibn rushd', 'averroist'],
  'maimonides': ['maimonidean', 'moses maimonides', 'rambam'],
  'ockham': ['occam', 'william of ockham', 'occam\'s razor', 'ockhamist'],
  'bacon': ['francis bacon', 'baconian'],
  'pascal': ['pascalian', 'blaise pascal'],
  'husserl': ['husserlian', 'edmund husserl', 'phenomenology', 'phenomenologist'],
  'merleau_ponty': ['merleau-ponty', 'maurice merleau-ponty'],
  'levinas': ['levinasian', 'emmanuel levinas'],
  'arendt': ['arendtian', 'hannah arendt'],
  'beauvoir': ['simone de beauvoir', 'de beauvoir'],
  'mencius': ['mengzi', 'meng ke'],
  'xunzi': ['hsün tzu', 'xun kuang'],
  'mozi': ['mo tzu', 'mohism', 'mohist'],
  'han_fei': ['han feizi', 'han fei tzu', 'legalism', 'legalist'],
  'wang_yangming': ['wang yang-ming', 'yangming'],
  'zhu_xi': ['chu hsi', 'neo-confucianism', 'neo-confucian'],
  'nagarjuna': ['madhyamaka'],
  'shankara': ['shankaracharya', 'adi shankara', 'advaita', 'advaita vedanta'],
  'ramanuja': ['vishishtadvaita'],
  'al_ghazali': ['al-ghazali', 'ghazali', 'algazel'],
  'al_farabi': ['al-farabi', 'farabi', 'alpharabius'],
  'ibn_khaldun': ['khaldun', 'khaldunian'],
};

// Common false positives to skip
export const PROPER_NAME_STOPWORDS = new Set([
  'the author', 'the artist', 'the singer', 'the band', 'the composer',
  'the director', 'the writer', 'the protagonist', 'the character',
  'the story', 'the film', 'the movie', 'the book', 'the song',
  'the album', 'the lyrics', 'the verse', 'the chorus',
  'john doe', 'jane doe', 'anonymous',
  // Common name parts that aren't philosophers
  'van', 'von', 'de', 'la', 'al', 'ibn', 'ben', 'el',
]);

// Build the philosopher dictionary from seed data
let PHILOSOPHER_DICTIONARY = null;
let PHILOSOPHER_REGEX = null;

/**
 * Initialize the philosopher dictionary from seed data.
 * Call once at startup or on first use.
 */
export function initPhilosopherDictionary() {
  if (PHILOSOPHER_DICTIONARY) return PHILOSOPHER_DICTIONARY;

  PHILOSOPHER_DICTIONARY = {};

  for (const node of SEED_NODES) {
    const id = node.id;
    const name = node.name.toLowerCase();
    
    // Start with the philosopher's name
    const variants = new Set([name]);
    
    // Add first name / last name variants
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      variants.add(nameParts[nameParts.length - 1]); // Last name
      // Don't add first name alone - too common
    }
    
    // Add manual variants if available
    if (MANUAL_VARIANTS[id]) {
      MANUAL_VARIANTS[id].forEach(v => variants.add(v.toLowerCase()));
    }
    
    // Add school of thought as variant (if unique enough)
    if (node.school_of_thought) {
      const school = node.school_of_thought.toLowerCase();
      // Only add if it's a clear identifier (e.g., "objectivism" for Rand)
      if (school.length > 6 && !school.includes('philosophy') && !school.includes('school')) {
        variants.add(school);
      }
    }

    PHILOSOPHER_DICTIONARY[id] = {
      node_id: id,
      name: node.name,
      variants: Array.from(variants),
      tradition: node.tradition,
      birth_year: node.birth_year,
    };
  }

  return PHILOSOPHER_DICTIONARY;
}

/**
 * Build a regex that matches any philosopher name variant.
 * Sorts by length (longest first) to avoid partial matches.
 */
export function buildPhilosopherRegex() {
  if (PHILOSOPHER_REGEX) return PHILOSOPHER_REGEX;

  const dict = initPhilosopherDictionary();
  
  const allVariants = Object.values(dict)
    .flatMap(entry => entry.variants)
    .sort((a, b) => b.length - a.length); // longest first
  
  // Escape special regex characters
  const escaped = allVariants.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  PHILOSOPHER_REGEX = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  return PHILOSOPHER_REGEX;
}

/**
 * Find philosopher entry by variant name.
 * @param {string} variant - The name variant to look up
 * @returns {Object|null} - The philosopher entry or null
 */
export function findPhilosopherByVariant(variant) {
  const dict = initPhilosopherDictionary();
  const lowerVariant = variant.toLowerCase().trim();
  
  for (const [id, entry] of Object.entries(dict)) {
    if (entry.variants.includes(lowerVariant)) {
      return entry;
    }
  }
  
  return null;
}

/**
 * Canonicalize a name for comparison.
 * @param {string} name - The name to canonicalize
 * @returns {string} - Lowercase, normalized name
 */
export function canonicalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a name is a known philosopher.
 * @param {string} name - The name to check
 * @returns {boolean}
 */
export function isKnownPhilosopher(name) {
  return findPhilosopherByVariant(name) !== null;
}

/**
 * Get all philosopher IDs.
 * @returns {string[]}
 */
export function getAllPhilosopherIds() {
  const dict = initPhilosopherDictionary();
  return Object.keys(dict);
}

/**
 * Get philosopher by ID.
 * @param {string} id - The philosopher ID
 * @returns {Object|null}
 */
export function getPhilosopherById(id) {
  const dict = initPhilosopherDictionary();
  return dict[id] || null;
}

export default {
  initPhilosopherDictionary,
  buildPhilosopherRegex,
  findPhilosopherByVariant,
  canonicalizeName,
  isKnownPhilosopher,
  getAllPhilosopherIds,
  getPhilosopherById,
  PROPER_NAME_STOPWORDS,
};
