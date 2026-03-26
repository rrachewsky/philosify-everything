/**
 * Portrait Download & Standardization Script v2
 * 
 * Uses Wikipedia API to fetch current portrait URLs (not hardcoded thumbnails)
 * 
 * Downloads philosopher portraits and standardizes them:
 * - Size: 150x200 (portrait aspect ratio)
 * - Fit: Cover (crop to fill)
 * - Color: Sepia tone for consistent historical look
 * - Format: JPEG, 85% quality
 * 
 * Usage: node scripts/download-portraits.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTRAITS_DIR = path.join(__dirname, '..', 'public', 'portraits');
const DOWNLOAD_LIST = path.join(PORTRAITS_DIR, 'DOWNLOAD_LIST.txt');

// Configuration
const CONFIG = {
  width: 150,
  height: 200,
  fit: 'cover',
  quality: 85,
  delayBetweenRequests: 1000, // 1 second between requests
  retries: 2,
  retryDelay: 2000,
};

// Sepia tone matrix
const SEPIA_MATRIX = [
  0.393, 0.769, 0.189,
  0.349, 0.686, 0.168,
  0.272, 0.534, 0.131,
];

// Map philosopher IDs to Wikipedia article titles
const WIKIPEDIA_TITLES = {
  a_j_ayer: 'A._J._Ayer',
  adam_smith: 'Adam_Smith',
  al_farabi: 'Al-Farabi',
  al_ghazali: 'Al-Ghazali',
  al_kindi: 'Al-Kindi',
  alasdair_macintyre: 'Alasdair_MacIntyre',
  albert_camus: 'Albert_Camus',
  albert_jay_nock: 'Albert_Jay_Nock',
  alexis_de_tocqueville: 'Alexis_de_Tocqueville',
  alfred_whitehead: 'Alfred_North_Whitehead',
  algernon_sidney: 'Algernon_Sidney',
  alvin_plantinga: 'Alvin_Plantinga',
  anaxagoras: 'Anaxagoras',
  anaximander: 'Anaximander',
  anaximenes: 'Anaximenes_of_Miletus',
  anselm: 'Anselm_of_Canterbury',
  aristotle: 'Aristotle',
  auberon_herbert: 'Auberon_Herbert',
  auguste_comte: 'Auguste_Comte',
  augustine: 'Augustine_of_Hippo',
  austin: 'J._L._Austin',
  averroes: 'Averroes',
  avicenna: 'Avicenna',
  ayn_rand: 'Ayn_Rand',
  barbara_branden: 'Barbara_Branden',
  baruch_spinoza: 'Baruch_Spinoza',
  bernard_of_clairvaux: 'Bernard_of_Clairvaux',
  bernard_williams: 'Bernard_Williams',
  bertrand_russell: 'Bertrand_Russell',
  blaise_pascal: 'Blaise_Pascal',
  boethius: 'Boethius',
  buddha: 'Gautama_Buddha',
  carneades: 'Carneades',
  cassirer: 'Ernst_Cassirer',
  charles_peirce: 'Charles_Sanders_Peirce',
  christian_wolff: 'Christian_Wolff_(philosopher)',
  chrysippus: 'Chrysippus',
  cicero: 'Cicero',
  condorcet: 'Marquis_de_Condorcet',
  confucius: 'Confucius',
  daniel_dennett: 'Daniel_Dennett',
  darwin: 'Charles_Darwin',
  david_friedman: 'David_D._Friedman',
  david_hume: 'David_Hume',
  david_kelley: 'David_Kelley',
  david_lewis: 'David_Lewis_(philosopher)',
  de_maistre: 'Joseph_de_Maistre',
  democritus: 'Democritus',
  derek_parfit: 'Derek_Parfit',
  diderot: 'Denis_Diderot',
  dilthey: 'Wilhelm_Dilthey',
  diogenes: 'Diogenes',
  duns_scotus: 'Duns_Scotus',
  edmund_burke: 'Edmund_Burke',
  edmund_husserl: 'Edmund_Husserl',
  emma_goldman: 'Emma_Goldman',
  emmanuel_levinas: 'Emmanuel_Levinas',
  empedocles: 'Empedocles',
  epictetus: 'Epictetus',
  epicurus: 'Epicurus',
  erasmus: 'Erasmus',
  feuerbach: 'Ludwig_Feuerbach',
  fichte: 'Johann_Gottlieb_Fichte',
  francis_bacon: 'Francis_Bacon',
  frederic_bastiat: 'Frédéric_Bastiat',
  frederick_douglass: 'Frederick_Douglass',
  friedrich_engels: 'Friedrich_Engels',
  friedrich_hayek: 'Friedrich_Hayek',
  g_e_moore: 'G._E._Moore',
  gadamer: 'Hans-Georg_Gadamer',
  gandhi: 'Mahatma_Gandhi',
  george_berkeley: 'George_Berkeley',
  giambattista_vico: 'Giambattista_Vico',
  gilbert_ryle: 'Gilbert_Ryle',
  gilles_deleuze: 'Gilles_Deleuze',
  giordano_bruno: 'Giordano_Bruno',
  gorgias: 'Gorgias',
  gottlob_frege: 'Gottlob_Frege',
  h_l_mencken: 'H._L._Mencken',
  hamann: 'Johann_Georg_Hamann',
  han_fei: 'Han_Fei',
  hannah_arendt: 'Hannah_Arendt',
  hans_hermann_hoppe: 'Hans-Hermann_Hoppe',
  harry_binswanger: 'Harry_Binswanger',
  hegel: 'Georg_Wilhelm_Friedrich_Hegel',
  henri_bergson: 'Henri_Bergson',
  henry_david_thoreau: 'Henry_David_Thoreau',
  henry_hazlitt: 'Henry_Hazlitt',
  heraclitus: 'Heraclitus',
  herbert_marcuse: 'Herbert_Marcuse',
  herbert_spencer: 'Herbert_Spencer',
  herder: 'Johann_Gottfried_Herder',
  hilary_putnam: 'Hilary_Putnam',
  hugo_grotius: 'Hugo_Grotius',
  hypatia: 'Hypatia',
  immanuel_kant: 'Immanuel_Kant',
  isaac_newton: 'Isaac_Newton',
  isabel_paterson: 'Isabel_Paterson',
  jacobi: 'Friedrich_Heinrich_Jacobi',
  jacques_derrida: 'Jacques_Derrida',
  james_madison: 'James_Madison',
  jean_baudrillard: 'Jean_Baudrillard',
  jean_paul_sartre: 'Jean-Paul_Sartre',
  jeremy_bentham: 'Jeremy_Bentham',
  john_adams: 'John_Adams',
  john_dewey: 'John_Dewey',
  john_locke: 'John_Locke',
  john_milton: 'John_Milton',
  john_rawls: 'John_Rawls',
  john_searle: 'John_Searle',
  john_stuart_mill: 'John_Stuart_Mill',
  jurgen_habermas: 'Jürgen_Habermas',
  karl_jaspers: 'Karl_Jaspers',
  karl_marx: 'Karl_Marx',
  karl_popper: 'Karl_Popper',
  kierkegaard: 'Søren_Kierkegaard',
  la_boetie: 'Étienne_de_La_Boétie',
  laozi: 'Laozi',
  leibniz: 'Gottfried_Wilhelm_Leibniz',
  leonard_peikoff: 'Leonard_Peikoff',
  lessing: 'Gotthold_Ephraim_Lessing',
  lord_acton: 'Lord_Acton',
  louis_althusser: 'Louis_Althusser',
  lucretius: 'Lucretius',
  ludwig_von_mises: 'Ludwig_von_Mises',
  ludwig_wittgenstein: 'Ludwig_Wittgenstein',
  lyotard: 'Jean-François_Lyotard',
  lysander_spooner: 'Lysander_Spooner',
  machiavelli: 'Niccolò_Machiavelli',
  mahavira: 'Mahavira',
  maimonides: 'Maimonides',
  malebranche: 'Nicolas_Malebranche',
  marcus_aurelius: 'Marcus_Aurelius',
  martha_nussbaum: 'Martha_Nussbaum',
  martin_heidegger: 'Martin_Heidegger',
  mary_wollstonecraft: 'Mary_Wollstonecraft',
  max_horkheimer: 'Max_Horkheimer',
  max_stirner: 'Max_Stirner',
  max_weber: 'Max_Weber',
  meister_eckhart: 'Meister_Eckhart',
  mencius: 'Mencius',
  merleau_ponty: 'Maurice_Merleau-Ponty',
  michel_foucault: 'Michel_Foucault',
  michel_montaigne: 'Michel_de_Montaigne',
  milton_friedman: 'Milton_Friedman',
  montesquieu: 'Montesquieu',
  moses_mendelssohn: 'Moses_Mendelssohn',
  murray_rothbard: 'Murray_Rothbard',
  nagarjuna: 'Nagarjuna',
  nathaniel_branden: 'Nathaniel_Branden',
  nicholas_of_cusa: 'Nicholas_of_Cusa',
  nietzsche: 'Friedrich_Nietzsche',
  noam_chomsky: 'Noam_Chomsky',
  nozick: 'Robert_Nozick',
  ockham: 'William_of_Ockham',
  onkar_ghate: 'Onkar_Ghate',
  ortega_y_gasset: 'José_Ortega_y_Gasset',
  paine: 'Thomas_Paine',
  parmenides: 'Parmenides',
  peter_abelard: 'Peter_Abelard',
  peter_singer: 'Peter_Singer',
  philo: 'Philo',
  plato: 'Plato',
  plotinus: 'Plotinus',
  plutarch: 'Plutarch',
  porphyry: 'Porphyry_(philosopher)',
  proclus: 'Proclus',
  protagoras: 'Protagoras',
  proudhon: 'Pierre-Joseph_Proudhon',
  pyrrho: 'Pyrrho',
  pythagoras: 'Pythagoras',
  ralph_waldo_emerson: 'Ralph_Waldo_Emerson',
  rene_descartes: 'René_Descartes',
  richard_rorty: 'Richard_Rorty',
  robert_filmer: 'Robert_Filmer',
  rose_wilder_lane: 'Rose_Wilder_Lane',
  rousseau: 'Jean-Jacques_Rousseau',
  rudolf_carnap: 'Rudolf_Carnap',
  samuel_pufendorf: 'Samuel_von_Pufendorf',
  schelling: 'Friedrich_Wilhelm_Joseph_Schelling',
  schleiermacher: 'Friedrich_Schleiermacher',
  schopenhauer: 'Arthur_Schopenhauer',
  seneca: 'Seneca_the_Younger',
  sextus_empiricus: 'Sextus_Empiricus',
  shankara: 'Adi_Shankara',
  sidgwick: 'Henry_Sidgwick',
  simone_de_beauvoir: 'Simone_de_Beauvoir',
  slavoj_zizek: 'Slavoj_Žižek',
  socrates: 'Socrates',
  solon: 'Solon',
  ssu_ma_chien: 'Sima_Qian',
  sun_tzu: 'Sun_Tzu',
  tara_smith: 'Tara_Smith_(philosopher)',
  thales: 'Thales_of_Miletus',
  theodor_adorno: 'Theodor_W._Adorno',
  thomas_aquinas: 'Thomas_Aquinas',
  thomas_hobbes: 'Thomas_Hobbes',
  thomas_jefferson: 'Thomas_Jefferson',
  thomas_kuhn: 'Thomas_Kuhn',
  thomas_more: 'Thomas_More',
  thomas_reid: 'Thomas_Reid',
  voltaire: 'Voltaire',
  walter_benjamin: 'Walter_Benjamin',
  william_godwin: 'William_Godwin',
  william_james: 'William_James',
  willard_van_orman_quine: 'Willard_Van_Orman_Quine',
  xenophon: 'Xenophon',
  yaron_brook: 'Yaron_Brook',
  zeno_citium: 'Zeno_of_Citium',
  zeno_elea: 'Zeno_of_Elea',
  zhuangzi: 'Zhuangzi_(book)',
};

/**
 * Get Wikipedia image URL via API
 */
async function getWikipediaImageUrl(title) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=300`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'PhilosifyBot/1.0 (https://philosify.app; contact@philosify.app)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Wikipedia API error: ${response.status}`);
  }
  
  const data = await response.json();
  const pages = data.query?.pages;
  
  if (!pages) return null;
  
  const page = Object.values(pages)[0];
  return page?.thumbnail?.source || null;
}

/**
 * Download image with retries
 */
async function downloadImage(url, retries = CONFIG.retries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PhilosifyBot/1.0 (https://philosify.app; contact@philosify.app)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
    }
  }
}

/**
 * Process image: resize, apply sepia, convert to JPEG
 */
async function processImage(inputBuffer) {
  return sharp(inputBuffer)
    .resize(CONFIG.width, CONFIG.height, {
      fit: CONFIG.fit,
      position: 'top',
    })
    .recomb([
      [SEPIA_MATRIX[0], SEPIA_MATRIX[1], SEPIA_MATRIX[2]],
      [SEPIA_MATRIX[3], SEPIA_MATRIX[4], SEPIA_MATRIX[5]],
      [SEPIA_MATRIX[6], SEPIA_MATRIX[7], SEPIA_MATRIX[8]],
    ])
    .modulate({
      brightness: 1.02,
      saturation: 0.9,
    })
    .jpeg({
      quality: CONFIG.quality,
      mozjpeg: true,
    })
    .toBuffer();
}

/**
 * Process a single portrait
 */
async function processPortrait(id, index, total) {
  const outputPath = path.join(PORTRAITS_DIR, `${id}.jpg`);
  
  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`[${index}/${total}] SKIP ${id} (exists)`);
    return { id, status: 'skipped' };
  }
  
  const wikiTitle = WIKIPEDIA_TITLES[id];
  if (!wikiTitle) {
    console.log(`[${index}/${total}] SKIP ${id} (no wiki mapping)`);
    return { id, status: 'no_mapping' };
  }
  
  try {
    // Get image URL from Wikipedia API
    const imageUrl = await getWikipediaImageUrl(wikiTitle);
    
    if (!imageUrl) {
      console.log(`[${index}/${total}] ✗ ${id} (no image on Wikipedia)`);
      return { id, status: 'no_image' };
    }
    
    // Download and process
    const imageBuffer = await downloadImage(imageUrl);
    const processedBuffer = await processImage(imageBuffer);
    
    fs.writeFileSync(outputPath, processedBuffer);
    console.log(`[${index}/${total}] ✓ ${id}`);
    
    return { id, status: 'success' };
  } catch (error) {
    console.log(`[${index}/${total}] ✗ ${id}: ${error.message}`);
    return { id, status: 'failed', error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('PHILOSOPHER PORTRAIT DOWNLOADER v2');
  console.log('Using Wikipedia API for current image URLs');
  console.log('='.repeat(50));
  
  const ids = Object.keys(WIKIPEDIA_TITLES);
  console.log(`Found ${ids.length} philosophers with Wikipedia mappings\n`);
  
  // Ensure directory exists
  if (!fs.existsSync(PORTRAITS_DIR)) {
    fs.mkdirSync(PORTRAITS_DIR, { recursive: true });
  }
  
  // Process sequentially
  const results = [];
  for (let i = 0; i < ids.length; i++) {
    const result = await processPortrait(ids[i], i + 1, ids.length);
    results.push(result);
    
    // Delay between requests
    if (i < ids.length - 1 && result.status !== 'skipped') {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
  }
  
  // Summary
  const success = results.filter(r => r.status === 'success').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const noImage = results.filter(r => r.status === 'no_image').length;
  const failed = results.filter(r => r.status === 'failed');
  
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Downloaded: ${success}`);
  console.log(`→ Skipped:    ${skipped}`);
  console.log(`○ No image:   ${noImage}`);
  console.log(`✗ Failed:     ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed:');
    failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  }
  
  // Count total portraits
  const totalPortraits = fs.readdirSync(PORTRAITS_DIR).filter(f => f.endsWith('.jpg')).length;
  console.log(`\nTotal portraits in folder: ${totalPortraits}`);
}

main().catch(console.error);
