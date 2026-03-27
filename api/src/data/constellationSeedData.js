// ============================================================
// Constellation Seed Data - Verified Historical Philosopher Data
// ALL DATA MUST BE HISTORICALLY ACCURATE AND VERIFIABLE
// VERSION 2.2 FINAL - 168 philosophers · 42 schools · 41 champions · binary stance (VERIFIED)
// ============================================================

// ═══════════════════════════════════════════════════════════
// SCHOOL COLORS - 49 philosophical schools (42 Western + 7 Eastern)
// ═══════════════════════════════════════════════════════════
export const SCHOOL_COLORS = {
  // EASTERN TRADITIONS
  'Confucian': '#C4A747',
  'Daoist': '#5D8C3E',
  'Mohist': '#6B8BA4',
  'Legalist': '#8B4513',
  'Buddhist': '#F4A460',
  'Jain': '#CD853F',
  'Vedanta': '#DAA520',
  // WESTERN TRADITIONS
  'Pre-Socratic': '#89CFF0',
  'Sophist': '#E05A5A',
  'Socratic': '#D6158C',
  'Platonic': '#B044B0',
  'Aristotelian': '#1A7FBD',
  'Epicurean': '#2EA87E',
  'Stoic': '#3AAFCF',
  'Skeptic': '#8C8CA0',
  'Neo-Platonic': '#9B6EC8',
  'Islamic': '#D4952A',
  'Scholastic': '#7A6040',
  'Mystical': '#C46090',
  'Humanist': '#E88030',
  'Political Realist': '#A05060',
  'Naturalist': '#40A050',
  'Empiricist': '#4488CC',
  'Rationalist': '#D6158C',
  'Counter-Enlightenment': '#C05030',
  'German Idealism': '#8855AA',
  'Enlightenment': '#F5C518',
  'Positivist': '#22AA88',
  'Utilitarian': '#44BB66',
  'Voluntarist': '#D84040',
  'Existentialist': '#885530',
  'Vitalist': '#88AA22',
  'Marxist': '#CC4444',
  'Phenomenology': '#6688AA',
  'Pragmatist': '#EE8833',
  'Analytic': '#378ADD',
  'Critical Theory': '#AA4466',
  'Postmodern': '#666688',
  'Objectivist': '#D6158C',
  'Post-Randian Realism': '#EF9F27',
  'Liberal': '#4499BB',
  'Philosophy of Science': '#33AA99',
  'Neo-Pragmatist': '#CC7722',
  'Virtue Ethics': '#55AA55',
  'Sociologist': '#997744',
  'Political': '#778844',
  'Libertarian': '#2EA87E',
  'Naturalist (Contemporary)': '#44AA44',
  'Anarcho-Capitalist': '#AA6600',
  // NEW SCHOOLS
  'Austrian Economics': '#D4952A',
  'Chicago School': '#4A7BA7',
  'Voluntaryist': '#5BAD8F',
  'Abolitionist': '#4A90D9',
  'Anarcho-Communist': '#CC3333',
  'Egoist': '#885500',
  'Transcendentalist': '#44AA77',
  'Church Fathers': '#8B6914',
};

// ═══════════════════════════════════════════════════════════
// SCHOOL STANCES - Binary only: pro or anti (reason & objectivity)
// ═══════════════════════════════════════════════════════════
export const SCHOOL_STANCES = {
  // EASTERN TRADITIONS
  'Confucian': 'pro',      // Emphasis on rational ethics and social order
  'Daoist': 'anti',        // Wu wei, mystical, beyond rational categories
  'Mohist': 'pro',         // Logical argumentation, consequentialist ethics
  'Legalist': 'anti',      // Amoral statecraft, collective over individual
  'Buddhist': 'anti',      // Transcends reason, seeks liberation from illusion
  'Jain': 'anti',          // Mystical liberation, asceticism
  'Vedanta': 'anti',       // World as illusion (maya), mystical unity
  // WESTERN TRADITIONS
  'Pre-Socratic': 'pro',
  'Sophist': 'anti',
  'Socratic': 'pro',
  'Platonic': 'pro',
  'Aristotelian': 'pro',
  'Epicurean': 'pro',
  'Stoic': 'pro',
  'Skeptic': 'anti',
  'Neo-Platonic': 'anti',
  'Islamic': 'pro',
  'Scholastic': 'pro',
  'Mystical': 'anti',
  'Humanist': 'pro',
  'Political Realist': 'pro',
  'Naturalist': 'pro',
  'Empiricist': 'pro',
  'Rationalist': 'pro',
  'Counter-Enlightenment': 'anti',
  'German Idealism': 'anti',
  'Enlightenment': 'pro',
  'Positivist': 'pro',
  'Utilitarian': 'anti',
  'Voluntarist': 'anti',
  'Existentialist': 'anti',
  'Vitalist': 'anti',
  'Marxist': 'anti',
  'Phenomenology': 'anti',
  'Pragmatist': 'anti',
  'Analytic': 'pro',
  'Critical Theory': 'anti',
  'Postmodern': 'anti',
  'Objectivist': 'pro',
  'Post-Randian Realism': 'pro',
  'Liberal': 'anti',
  'Philosophy of Science': 'anti',
  'Neo-Pragmatist': 'anti',
  'Virtue Ethics': 'anti',
  'Sociologist': 'anti',
  'Political': 'anti',
  'Libertarian': 'pro',
  'Naturalist (Contemporary)': 'pro',
  'Anarcho-Capitalist': 'anti',  // Utopian mysticism; subjectivist ethics; competing agencies = no objective law = might makes right; anti-IP
  // NEW SCHOOLS
  'Austrian Economics': 'pro',
  'Chicago School': 'pro',  // Monetarist, empiricist, free market - defends capitalism (even if with positivist methodology)
  'Voluntaryist': 'pro',
  'Abolitionist': 'pro',
  'Anarcho-Communist': 'anti',
  'Egoist': 'anti',
  'Transcendentalist': 'anti',
  'Church Fathers': 'anti',
};

// ═══════════════════════════════════════════════════════════
// PHILOSOPHER PORTRAITS - Self-hosted in /portraits/{id}.jpg
// Download from DOWNLOAD_LIST.txt in site/public/portraits/
// ═══════════════════════════════════════════════════════════
export const PHILOSOPHER_PORTRAITS = {
  // PRE-SOCRATICS & ANCIENT GREEKS
  'thales': '/portraits/thales.jpg',
  'anaximander': '/portraits/anaximander.jpg',
  'anaximenes': '/portraits/anaximenes.jpg',
  'pythagoras': '/portraits/pythagoras.jpg',
  'heraclitus': '/portraits/heraclitus.jpg',
  'parmenides': '/portraits/parmenides.jpg',
  'anaxagoras': '/portraits/anaxagoras.jpg',
  'empedocles': '/portraits/empedocles.jpg',
  'zeno_of_elea': '/portraits/zeno_of_elea.jpg',
  'democritus': '/portraits/democritus.jpg',
  'protagoras': '/portraits/protagoras.jpg',
  'gorgias': '/portraits/gorgias.jpg',
  'thrasymachus': '/portraits/thrasymachus.jpg',
  'socrates': '/portraits/socrates.jpg',
  'plato': '/portraits/plato.jpg',
  'aristotle': '/portraits/aristotle.jpg',
  'diogenes': '/portraits/diogenes.jpg',
  'pyrrho': '/portraits/pyrrho.jpg',
  'carneades': '/portraits/carneades.jpg',
  'sextus_empiricus': '/portraits/sextus_empiricus.jpg',
  'epicurus': '/portraits/epicurus.jpg',
  'zeno_of_citium': '/portraits/zeno_of_citium.jpg',
  'chrysippus': '/portraits/chrysippus.jpg',
  'cicero': '/portraits/cicero.jpg',
  'lucretius': '/portraits/lucretius.jpg',
  'seneca': '/portraits/seneca.jpg',
  'epictetus': '/portraits/epictetus.jpg',
  'marcus_aurelius': '/portraits/marcus_aurelius.jpg',
  'plotinus': '/portraits/plotinus.jpg',
  'porphyry': '/portraits/porphyry.jpg',
  'proclus': '/portraits/proclus.jpg',
  'hypatia': '/portraits/hypatia.jpg',
  
  // MEDIEVAL - CHRISTIAN, ISLAMIC, JEWISH
  'augustine': '/portraits/augustine.jpg',
  'boethius': '/portraits/boethius.jpg',
  'anselm': '/portraits/anselm.jpg',
  'bernard_of_clairvaux': '/portraits/bernard_of_clairvaux.jpg',
  'peter_abelard': '/portraits/peter_abelard.jpg',
  'al_kindi': '/portraits/al_kindi.jpg',
  'al_farabi': '/portraits/al_farabi.jpg',
  'avicenna': '/portraits/avicenna.jpg',
  'al_ghazali': '/portraits/al_ghazali.jpg',
  'averroes': '/portraits/averroes.jpg',
  'maimonides': '/portraits/maimonides.jpg',
  'thomas_aquinas': '/portraits/thomas_aquinas.jpg',
  'duns_scotus': '/portraits/duns_scotus.jpg',
  'william_of_ockham': '/portraits/william_of_ockham.jpg',
  'meister_eckhart': '/portraits/meister_eckhart.jpg',
  'roger_bacon': '/portraits/roger_bacon.jpg',
  
  // RENAISSANCE & EARLY MODERN
  'erasmus': '/portraits/erasmus.jpg',
  'machiavelli': '/portraits/machiavelli.jpg',
  'pico_della_mirandola': '/portraits/pico_della_mirandola.jpg',
  'thomas_more': '/portraits/thomas_more.jpg',
  'montaigne': '/portraits/montaigne.jpg',
  'giordano_bruno': '/portraits/giordano_bruno.jpg',
  'hugo_grotius': '/portraits/hugo_grotius.jpg',
  'francis_bacon': '/portraits/francis_bacon.jpg',
  'thomas_hobbes': '/portraits/thomas_hobbes.jpg',
  'rene_descartes': '/portraits/rene_descartes.jpg',
  'blaise_pascal': '/portraits/blaise_pascal.jpg',
  'baruch_spinoza': '/portraits/baruch_spinoza.jpg',
  'john_locke': '/portraits/john_locke.jpg',
  'john_milton': '/portraits/john_milton.jpg',
  'algernon_sidney': '/portraits/algernon_sidney.jpg',
  'malebranche': '/portraits/malebranche.jpg',
  'leibniz': '/portraits/leibniz.jpg',
  'isaac_newton': '/portraits/isaac_newton.jpg',
  'george_berkeley': '/portraits/george_berkeley.jpg',
  'christian_wolff': '/portraits/christian_wolff.jpg',
  'giambattista_vico': '/portraits/giambattista_vico.jpg',
  
  // ENLIGHTENMENT
  'montesquieu': '/portraits/montesquieu.jpg',
  'voltaire': '/portraits/voltaire.jpg',
  'david_hume': '/portraits/david_hume.jpg',
  'rousseau': '/portraits/rousseau.jpg',
  'diderot': '/portraits/diderot.jpg',
  'adam_smith': '/portraits/adam_smith.jpg',
  'immanuel_kant': '/portraits/immanuel_kant.jpg',
  'condorcet': '/portraits/condorcet.jpg',
  'edmund_burke': '/portraits/edmund_burke.jpg',
  'mary_wollstonecraft': '/portraits/mary_wollstonecraft.jpg',
  'lessing': '/portraits/lessing.jpg',
  'hamann': '/portraits/hamann.jpg',
  'herder': '/portraits/herder.jpg',
  'jacobi': '/portraits/jacobi.jpg',
  
  // GERMAN IDEALISM & 19TH CENTURY
  'fichte': '/portraits/fichte.jpg',
  'schelling': '/portraits/schelling.jpg',
  'schiller': '/portraits/schiller.jpg',
  'hegel': '/portraits/hegel.jpg',
  'schopenhauer': '/portraits/schopenhauer.jpg',
  'feuerbach': '/portraits/feuerbach.jpg',
  'kierkegaard': '/portraits/kierkegaard.jpg',
  'karl_marx': '/portraits/karl_marx.jpg',
  'friedrich_engels': '/portraits/friedrich_engels.jpg',
  'auguste_comte': '/portraits/auguste_comte.jpg',
  'jeremy_bentham': '/portraits/jeremy_bentham.jpg',
  'john_stuart_mill': '/portraits/john_stuart_mill.jpg',
  'darwin': '/portraits/darwin.jpg',
  'herbert_spencer': '/portraits/herbert_spencer.jpg',
  'nietzsche': '/portraits/nietzsche.jpg',
  'dilthey': '/portraits/dilthey.jpg',
  'frederic_bastiat': '/portraits/frederic_bastiat.jpg',
  'alexis_de_tocqueville': '/portraits/alexis_de_tocqueville.jpg',
  'frederick_douglass': '/portraits/frederick_douglass.jpg',
  'max_stirner': '/portraits/max_stirner.jpg',
  'de_maistre': '/portraits/de_maistre.jpg',
  'wilhelm_von_humboldt': '/portraits/wilhelm_von_humboldt.jpg',
  'max_weber': '/portraits/max_weber.jpg',
  
  // 19TH CENTURY LIBERTARIANS & ANARCHISTS
  'lysander_spooner': '/portraits/lysander_spooner.jpg',
  'pierre_joseph_proudhon': '/portraits/pierre_joseph_proudhon.jpg',
  'mikhail_bakunin': '/portraits/mikhail_bakunin.jpg',
  'peter_kropotkin': '/portraits/peter_kropotkin.jpg',
  'emma_goldman': '/portraits/emma_goldman.jpg',
  'la_boetie': '/portraits/la_boetie.jpg',
  'auberon_herbert': '/portraits/auberon_herbert.jpg',
  'lord_acton': '/portraits/lord_acton.jpg',
  
  // 20TH CENTURY - EARLY
  'gottlob_frege': '/portraits/gottlob_frege.jpg',
  'edmund_husserl': '/portraits/edmund_husserl.jpg',
  'henri_bergson': '/portraits/henri_bergson.jpg',
  'alfred_whitehead': '/portraits/alfred_whitehead.jpg',
  'bertrand_russell': '/portraits/bertrand_russell.jpg',
  'g_e_moore': '/portraits/g_e_moore.jpg',
  'ludwig_wittgenstein': '/portraits/ludwig_wittgenstein.jpg',
  'rudolf_carnap': '/portraits/rudolf_carnap.jpg',
  'martin_heidegger': '/portraits/martin_heidegger.jpg',
  'karl_jaspers': '/portraits/karl_jaspers.jpg',
  'ortega': '/portraits/ortega_y_gasset.jpg',
  'cassirer': '/portraits/cassirer.jpg',
  'ludwig_von_mises': '/portraits/ludwig_von_mises.jpg',
  'carl_menger': '/portraits/carl_menger.jpg',
  'eugen_bohm_bawerk': '/portraits/eugen_bohm_bawerk.jpg',
  'george_stigler': '/portraits/george_stigler.jpg',
  'gary_becker': '/portraits/gary_becker.jpg',
  'thomas_sowell': '/portraits/thomas_sowell.jpg',
  'scheler': '/portraits/scheler.jpg',
  'a_j_ayer': '/portraits/a_j_ayer.jpg',
  'gilbert_ryle': '/portraits/gilbert_ryle.jpg',
  
  // 20TH CENTURY - MID & LATE
  'karl_popper': '/portraits/karl_popper.jpg',
  'theodor_adorno': '/portraits/theodor_adorno.jpg',
  'max_horkheimer': '/portraits/max_horkheimer.jpg',
  'herbert_marcuse': '/portraits/herbert_marcuse.jpg',
  'walter_benjamin': '/portraits/walter_benjamin.jpg',
  'jean_paul_sartre': '/portraits/jean_paul_sartre.jpg',
  'simone_de_beauvoir': '/portraits/simone_de_beauvoir.jpg',
  'albert_camus': '/portraits/albert_camus.jpg',
  'merleau_ponty': '/portraits/merleau_ponty.jpg',
  'emmanuel_levinas': '/portraits/emmanuel_levinas.jpg',
  'hannah_arendt': '/portraits/hannah_arendt.jpg',
  'friedrich_hayek': '/portraits/friedrich_hayek.jpg',
  'ayn_rand': '/portraits/ayn_rand.jpg',
  'w_v_o_quine': '/portraits/w_v_o_quine.jpg',
  'austin': '/portraits/austin.jpg',
  'john_rawls': '/portraits/john_rawls.jpg',
  'robert_nozick': '/portraits/robert_nozick.jpg',
  'michel_foucault': '/portraits/michel_foucault.jpg',
  'jacques_derrida': '/portraits/jacques_derrida.jpg',
  'gilles_deleuze': '/portraits/gilles_deleuze.jpg',
  'lyotard': '/portraits/lyotard.jpg',
  'jean_baudrillard': '/portraits/jean_baudrillard.jpg',
  'richard_rorty': '/portraits/richard_rorty.jpg',
  'thomas_kuhn': '/portraits/thomas_kuhn.jpg',
  'alasdair_macintyre': '/portraits/alasdair_macintyre.jpg',
  'jurgen_habermas': '/portraits/jurgen_habermas.jpg',
  'gadamer': '/portraits/gadamer.jpg',
  'paul_ricoeur': '/portraits/paul_ricoeur.jpg',
  'john_searle': '/portraits/john_searle.jpg',
  'daniel_dennett': '/portraits/daniel_dennett.jpg',
  'hilary_putnam': '/portraits/hilary_putnam.jpg',
  'saul_kripke': '/portraits/saul_kripke.jpg',
  'david_lewis': '/portraits/david_lewis.jpg',
  'derek_parfit': '/portraits/derek_parfit.jpg',
  'bernard_williams': '/portraits/bernard_williams.jpg',
  'peter_singer': '/portraits/peter_singer.jpg',
  'martha_nussbaum': '/portraits/martha_nussbaum.jpg',
  'louis_althusser': '/portraits/louis_althusser.jpg',
  'alvin_plantinga': '/portraits/alvin_plantinga.jpg',
  'paul_feyerabend': '/portraits/paul_feyerabend.jpg',
  'slavoj_zizek': '/portraits/slavoj_zizek.jpg',
  'noam_chomsky': '/portraits/noam_chomsky.jpg',
  'nick_bostrom': '/portraits/nick_bostrom.jpg',
  'patricia_churchland': '/portraits/patricia_churchland.jpg',
  'peter_railton': '/portraits/peter_railton.jpg',
  
  // AUSTRIAN & LIBERTARIAN
  'murray_rothbard': '/portraits/murray_rothbard.jpg',
  'milton_friedman': '/portraits/milton_friedman.jpg',
  'henry_hazlitt': '/portraits/henry_hazlitt.jpg',
  'h_l_mencken': '/portraits/h_l_mencken.jpg',
  'albert_jay_nock': '/portraits/albert_jay_nock.jpg',
  'isabel_paterson': '/portraits/isabel_paterson.jpg',
  'rose_wilder_lane': '/portraits/rose_wilder_lane.jpg',
  'hans_hermann_hoppe': '/portraits/hans_hermann_hoppe.jpg',
  'walter_block': '/portraits/walter_block.jpg',
  'david_friedman': '/portraits/david_friedman.jpg',
  'tibor_machan': '/portraits/tibor_machan.jpg',
  
  // AMERICAN FOUNDERS & TRANSCENDENTALISTS
  'thomas_jefferson': '/portraits/thomas_jefferson.jpg',
  'james_madison': '/portraits/james_madison.jpg',
  'thomas_paine': '/portraits/thomas_paine.jpg',
  'john_adams': '/portraits/john_adams.jpg',
  'ralph_waldo_emerson': '/portraits/ralph_waldo_emerson.jpg',
  'henry_david_thoreau': '/portraits/henry_david_thoreau.jpg',
  'charles_peirce': '/portraits/charles_peirce.jpg',
  'william_james': '/portraits/william_james.jpg',
  'john_dewey': '/portraits/john_dewey.jpg',
  'santayana': '/portraits/santayana.jpg',
  
  // OBJECTIVISM & POST-RANDIAN REALISM
  'nathaniel_branden': '/portraits/nathaniel_branden.jpg',
  'barbara_branden': '/portraits/barbara_branden.jpg',
  'leonard_peikoff': '/portraits/leonard_peikoff.jpg',
  'harry_binswanger': '/portraits/harry_binswanger.jpg',
  'yaron_brook': '/portraits/yaron_brook.jpg',
  'tara_smith': '/portraits/tara_smith.jpg',
  'david_kelley': '/portraits/david_kelley.jpg',
  'stephen_hicks': '/portraits/stephen_hicks.jpg',
  'edwin_locke': '/portraits/edwin_locke.jpg',
  'allan_gotthelf': '/portraits/allan_gotthelf.jpg',
  'michael_berliner': '/portraits/michael_berliner.jpg',
  'andrew_bernstein': '/portraits/andrew_bernstein.jpg',
  'peter_schwartz': '/portraits/peter_schwartz.jpg',
  'robert_mayhew': '/portraits/robert_mayhew.jpg',
  'darryl_wright': '/portraits/darryl_wright.jpg',
  'craig_biddle': '/portraits/craig_biddle.jpg',
  'onkar_ghate': '/portraits/onkar_ghate.jpg',
  'gregory_salmieri': '/portraits/gregory_salmieri.jpg',
  'elan_journo': '/portraits/elan_journo.jpg',
  'ben_bayer': '/portraits/ben_bayer.jpg',
  'don_watkins': '/portraits/don_watkins.jpg',
  'robert_tracinski': '/portraits/robert_tracinski.jpg',
  
  // EASTERN PHILOSOPHY
  'confucius': '/portraits/confucius.jpg',
  'laozi': '/portraits/laozi.jpg',
  'mozi': '/portraits/mozi.jpg',
  'mencius': '/portraits/mencius.jpg',
  'xunzi': '/portraits/xunzi.jpg',
  'han_fei': '/portraits/han_fei.jpg',
  'zhuangzi': '/portraits/zhuangzi.jpg',
  'buddha': '/portraits/buddha.jpg',
  'mahavira': '/portraits/mahavira.jpg',
  'nagarjuna': '/portraits/nagarjuna.jpg',
  'shankara': '/portraits/shankara.jpg',
  'ramanuja': '/portraits/ramanuja.jpg',
  'gandhi': '/portraits/gandhi.jpg',
  
  // NEW ATHEISTS
  'sam_harris': '/portraits/sam_harris.jpg',
  'christopher_hitchens': '/portraits/christopher_hitchens.jpg',
  'richard_dawkins': '/portraits/richard_dawkins.jpg',
};

// ═══════════════════════════════════════════════════════════
// SEED_NODES - 219 philosophers (206 Western + 13 Eastern)
// ═══════════════════════════════════════════════════════════
export const SEED_NODES = [
  // ═══════════════════════════════════════════════════════════
  // EASTERN PHILOSOPHY - 13 philosophers
  // ═══════════════════════════════════════════════════════════

  // INDIAN TRADITION (6)
  {
    id: 'mahavira',
    name: 'Mahavira',
    birth_year: -599,
    death_year: -527,
    dates: 'c.599–527 BC',
    birth_city: 'Vaishali',
    birth_country_modern: 'India',
    latitude: 25.9833,
    longitude: 85.1333,
    school_of_thought: 'Jainism',
    school: 'Jain',
    tradition: 'indian',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Ahimsa (non-violence); anekantavada (many-sidedness of truth); liberation through asceticism'],
    historical_weight: 1.0,
    // Mahavira: Jain asceticism, mystical liberation through self-denial, ahimsa as absolute duty
    battles: { reason_faith: -0.6, reality_mysticism: -0.7, individual_collective: 0.4, freedom_coercion: 0.5, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.6 }
  },
  {
    id: 'buddha',
    name: 'Siddhartha Gautama (Buddha)',
    birth_year: -563,
    death_year: -483,
    dates: 'c.563–483 BC',
    birth_city: 'Lumbini',
    birth_country_modern: 'Nepal',
    latitude: 27.4833,
    longitude: 83.2833,
    school_of_thought: 'Buddhism',
    school: 'Buddhist',
    tradition: 'indian',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Four Noble Truths; Eightfold Path; impermanence and non-self (anatta)'],
    historical_weight: 1.0,
    // Buddha: Meditation > reason; reality is impermanent/illusory; self is illusion (anatta); desire is evil
    battles: { reason_faith: -0.5, reality_mysticism: -0.8, individual_collective: -0.3, freedom_coercion: 0.3, value_nihilism: -0.2, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.4 }
  },
  {
    id: 'nagarjuna',
    name: 'Nagarjuna',
    birth_year: 150,
    death_year: 250,
    dates: 'c.150–250 AD',
    birth_city: 'Vidarbha',
    birth_country_modern: 'India',
    latitude: 20.7500,
    longitude: 78.7500,
    school_of_thought: 'Madhyamaka Buddhism',
    school: 'Buddhist',
    tradition: 'indian',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Emptiness (sunyata); two truths doctrine; middle way between eternalism and nihilism'],
    historical_weight: 0.7,
    // Nagarjuna: Sunyata (emptiness) - ultimate reality is void; reason leads to contradictions; anti-conceptual
    battles: { reason_faith: -0.7, reality_mysticism: -0.9, individual_collective: -0.2, freedom_coercion: 0.3, value_nihilism: -0.3, market_planning: 0.0, beauty_chaos: 0.2, good_evil: 0.3 }
  },
  {
    id: 'shankara',
    name: 'Adi Shankara',
    birth_year: 788,
    death_year: 820,
    dates: '788–820 AD',
    birth_city: 'Kaladi',
    birth_country_modern: 'India',
    latitude: 10.1675,
    longitude: 76.4411,
    school_of_thought: 'Advaita Vedanta',
    school: 'Vedanta',
    tradition: 'indian',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Brahman alone is real; world is illusion (maya); Atman is Brahman; liberation through knowledge'],
    historical_weight: 1.0,
    // Shankara: World is maya (illusion); only Brahman is real; individual self dissolves into Brahman
    battles: { reason_faith: -0.5, reality_mysticism: -0.9, individual_collective: -0.5, freedom_coercion: 0.3, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'ramanuja',
    name: 'Ramanuja',
    birth_year: 1017,
    death_year: 1137,
    dates: '1017–1137 AD',
    birth_city: 'Sriperumbudur',
    birth_country_modern: 'India',
    latitude: 12.9667,
    longitude: 79.9500,
    school_of_thought: 'Vishishtadvaita Vedanta',
    school: 'Vedanta',
    tradition: 'indian',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Qualified non-dualism; souls as real parts of Brahman; bhakti (devotion) path to liberation'],
    historical_weight: 0.7,
    // Ramanuja: Bhakti (devotion) over reason; liberation through surrender to God; less extreme than Shankara
    battles: { reason_faith: -0.5, reality_mysticism: -0.5, individual_collective: -0.3, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },
  {
    id: 'gandhi',
    name: 'Mahatma Gandhi',
    birth_year: 1869,
    death_year: 1948,
    dates: '1869–1948',
    birth_city: 'Porbandar',
    birth_country_modern: 'India',
    latitude: 21.6417,
    longitude: 69.6293,
    school_of_thought: 'Satyagraha / Nonviolence',
    school: 'Vedanta',
    tradition: 'indian',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Satyagraha (truth-force); ahimsa (non-violence); swaraj (self-rule through self-discipline)'],
    historical_weight: 0.85,
    // Gandhi: Mystical truth-force; self-sacrifice as highest virtue; collective duty; anti-industrial
    battles: { reason_faith: -0.4, reality_mysticism: -0.3, individual_collective: -0.5, freedom_coercion: 0.4, value_nihilism: 0.5, market_planning: -0.4, beauty_chaos: 0.4, good_evil: 0.6 }
  },

  // CHINESE TRADITION (7)
  {
    id: 'laozi',
    name: 'Laozi',
    birth_year: -571,
    death_year: -471,
    dates: 'c.571–471 BC',
    birth_city: 'Luoyi',
    birth_country_modern: 'China',
    latitude: 34.6197,
    longitude: 112.4540,
    school_of_thought: 'Taoism',
    school: 'Daoist',
    tradition: 'chinese',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['The Tao that can be told is not the eternal Tao; wu wei (non-action); simplicity and naturalness'],
    historical_weight: 1.0,
    // Laozi: Tao is ineffable/beyond reason; anti-conceptual; nature over civilization; wu wei = passivity
    battles: { reason_faith: -0.8, reality_mysticism: -0.7, individual_collective: 0.3, freedom_coercion: 0.5, value_nihilism: 0.2, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.3 }
  },
  {
    id: 'confucius',
    name: 'Confucius',
    birth_year: -551,
    death_year: -479,
    dates: '551–479 BC',
    birth_city: 'Qufu',
    birth_country_modern: 'China',
    latitude: 35.5961,
    longitude: 116.9913,
    school_of_thought: 'Confucianism',
    school: 'Confucian',
    tradition: 'chinese',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Ren (benevolence); li (ritual propriety); the junzi (noble person) cultivates virtue'],
    historical_weight: 1.0,
    // Confucius: Practical ethics based on tradition; collectivist (family/state duty); hierarchical
    battles: { reason_faith: 0.4, reality_mysticism: 0.5, individual_collective: -0.4, freedom_coercion: 0.1, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.7 }
  },
  {
    id: 'mozi',
    name: 'Mozi',
    birth_year: -470,
    death_year: -391,
    dates: 'c.470–391 BC',
    birth_city: 'Lu State',
    birth_country_modern: 'China',
    latitude: 35.5961,
    longitude: 116.9913,
    school_of_thought: 'Mohism',
    school: 'Mohist',
    tradition: 'chinese',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Universal love without partiality; consequentialist ethics; opposition to offensive warfare'],
    historical_weight: 1.0,
    // Mozi: Rational argumentation but altruist ethics (universal love = self-sacrifice); collectivist
    battles: { reason_faith: 0.6, reality_mysticism: 0.6, individual_collective: -0.6, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.2, good_evil: 0.5 }
  },
  {
    id: 'mencius',
    name: 'Mencius',
    birth_year: -372,
    death_year: -289,
    dates: 'c.372–289 BC',
    birth_city: 'Zoucheng',
    birth_country_modern: 'China',
    latitude: 35.4047,
    longitude: 116.9658,
    school_of_thought: 'Confucianism',
    school: 'Confucian',
    tradition: 'chinese',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Human nature is inherently good; benevolent government; four beginnings of virtue'],
    historical_weight: 0.85,
    battles: { reason_faith: 0.6, reality_mysticism: 0.6, individual_collective: 0.2, freedom_coercion: 0.4, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.9 }
  },
  {
    id: 'zhuangzi',
    name: 'Zhuangzi',
    birth_year: -369,
    death_year: -286,
    dates: 'c.369–286 BC',
    birth_city: 'Meng',
    birth_country_modern: 'China',
    latitude: 34.4300,
    longitude: 115.6500,
    school_of_thought: 'Taoism',
    school: 'Daoist',
    tradition: 'chinese',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Butterfly dream (what is reality?); embrace spontaneity; all perspectives are relative'],
    historical_weight: 0.85,
    // Zhuangzi: Radical relativist; reality is unknowable; anti-conceptual; rejects distinctions
    battles: { reason_faith: -0.7, reality_mysticism: -0.6, individual_collective: 0.5, freedom_coercion: 0.6, value_nihilism: -0.2, market_planning: 0.0, beauty_chaos: 0.2, good_evil: 0.1 }
  },
  {
    id: 'xunzi',
    name: 'Xunzi',
    birth_year: -310,
    death_year: -235,
    dates: 'c.310–235 BC',
    birth_city: 'Zhao',
    birth_country_modern: 'China',
    latitude: 37.8706,
    longitude: 114.5305,
    school_of_thought: 'Confucianism',
    school: 'Confucian',
    tradition: 'chinese',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Human nature is evil; goodness is acquired; ritual and education transform nature'],
    historical_weight: 0.7,
    // Xunzi: More rationalist Confucian but still collectivist/hierarchical
    battles: { reason_faith: 0.5, reality_mysticism: 0.5, individual_collective: -0.4, freedom_coercion: 0.0, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'han_fei',
    name: 'Han Fei',
    birth_year: -280,
    death_year: -233,
    dates: 'c.280–233 BC',
    birth_city: 'Han State',
    birth_country_modern: 'China',
    latitude: 34.7500,
    longitude: 113.6500,
    school_of_thought: 'Legalism',
    school: 'Legalist',
    tradition: 'chinese',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Law and punishment maintain order; the ruler must be impersonal; human nature is self-interested'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.7, reality_mysticism: 0.8, individual_collective: -0.5, freedom_coercion: -0.7, value_nihilism: 0.3, market_planning: -0.5, beauty_chaos: 0.2, good_evil: 0.2 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 1: ANCIENT GREEK (c.624–322 BC) - 16 philosophers
  // ═══════════════════════════════════════════════════════════

  // PRE-SOCRATIC (10)
  {
    id: 'thales',
    name: 'Thales',
    birth_year: -624,
    death_year: -546,
    dates: 'c.624–546 BC',
    birth_city: 'Miletus',
    birth_country_modern: 'Turkey',
    latitude: 37.5306,
    longitude: 27.2783,
    school_of_thought: 'Milesian School',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['First philosopher; rational principles in nature'],
    historical_weight: 1.0,
    // Thales: Father of Western philosophy; sought NATURAL explanations (water as arche) over mythological ones.
    // High reason (+0.8): pioneered rational inquiry into nature. High reality (+0.8): studied THIS world, not supernatural.
    // Neutral on politics/economics (no extant political writings). Moderate value/beauty: implicit naturalism.
    battles: { reason_faith: 0.8, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.6 }
  },
  {
    id: 'anaximander',
    name: 'Anaximander',
    birth_year: -610,
    death_year: -546,
    dates: 'c.610–546 BC',
    birth_city: 'Miletus',
    birth_country_modern: 'Turkey',
    latitude: 37.5306,
    longitude: 27.2783,
    school_of_thought: 'Milesian School',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Apeiron as first principle; rational cosmology'],
    historical_weight: 0.6,
    // Anaximander: Proposed "apeiron" (boundless/infinite) as rational first principle; early cosmologist.
    // High reason (+0.8): rational cosmology without gods. Reality (+0.7): apeiron is abstract but still naturalistic.
    // No political/economic doctrine. Moderate aesthetics: cosmic order implies natural standards.
    battles: { reason_faith: 0.8, reality_mysticism: 0.7, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.5 }
  },
  {
    id: 'anaximenes',
    name: 'Anaximenes',
    birth_year: -586,
    death_year: -526,
    dates: 'c.586–526 BC',
    birth_city: 'Miletus',
    birth_country_modern: 'Turkey',
    latitude: 37.5306,
    longitude: 27.2783,
    school_of_thought: 'Milesian School',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Air as rational first principle'],
    historical_weight: 0.5,
    // Anaximenes: Air as arche; processes of condensation/rarefaction explain all change.
    // Reason (+0.7): naturalistic but less rigorous than successors. Reality (+0.7): material first principle.
    // No political/economic writings preserved. Neutral/moderate on other axes.
    battles: { reason_faith: 0.7, reality_mysticism: 0.7, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.5 }
  },
  {
    id: 'pythagoras',
    name: 'Pythagoras',
    birth_year: -570,
    death_year: -495,
    dates: 'c.570–495 BC',
    birth_city: 'Samos',
    birth_country_modern: 'Greece',
    latitude: 37.7575,
    longitude: 26.9761,
    school_of_thought: 'Pythagoreanism',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Mathematical structure underlies all reality'],
    historical_weight: 0.7,
    // Pythagoras: "All is number" — math as rational key to reality. BUT: also ran mystic cult,
    // believed in transmigration of souls, secretive brotherhood. High reason (+0.8) for math/logic
    // but reality only (+0.6) due to mystical/religious elements. High beauty (+0.8): discovered
    // mathematical harmony in music (ratios), believed cosmos has aesthetic order.
    battles: { reason_faith: 0.8, reality_mysticism: 0.6, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.8, good_evil: 0.6 }
  },
  {
    id: 'heraclitus',
    name: 'Heraclitus',
    birth_year: -535,
    death_year: -475,
    dates: 'c.535–475 BC',
    birth_city: 'Ephesus',
    birth_country_modern: 'Turkey',
    latitude: 37.9394,
    longitude: 27.3417,
    school_of_thought: 'Ephesian School',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Flux over permanence; paradox over logic; logos invoked but reason never systematized — seeds of irrationalism'],
    historical_weight: 0.75,
    // Heraclitus: "Everything flows"; reality is constant flux and contradiction. Invokes "logos" but
    // never systematizes it — obscurantist writing style ("The Obscure"). Low reason (+0.3): embraces paradox,
    // contradictions ("war is father of all"), anti-systematic. Low reality (+0.3): if everything changes,
    // identity (A=A) becomes problematic. Hegel later exploited Heraclitus to justify dialectical "contradictions."
    battles: { reason_faith: 0.3, reality_mysticism: 0.3, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.4 }
  },
  {
    id: 'parmenides',
    name: 'Parmenides',
    birth_year: -515,
    death_year: -450,
    dates: 'c.515–450 BC',
    birth_city: 'Elea',
    birth_country_modern: 'Italy',
    latitude: 40.1614,
    longitude: 15.1531,
    school_of_thought: 'Eleatic School',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Being is one; logical monism over the senses'],
    historical_weight: 0.7,
    // Parmenides: Father of logic; first to use deductive argument to reach metaphysical conclusions.
    // "What is, IS" — pioneered principle of identity (A=A). Very high reason (+0.9): rigorous logical argument
    // over sense-perception. High reality (+0.8): defended objective Being against flux. BUT: pure rationalism
    // divorced from senses can become problematic (claimed motion is illusion). Aristotle later integrated
    // Parmenidean logic WITH empirical observation — the proper synthesis.
    battles: { reason_faith: 0.9, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.6 }
  },
  {
    id: 'anaxagoras',
    name: 'Anaxagoras',
    birth_year: -500,
    death_year: -428,
    dates: 'c.500–428 BC',
    birth_city: 'Clazomenae',
    birth_country_modern: 'Turkey',
    latitude: 38.3650,
    longitude: 26.7803,
    school_of_thought: 'Pluralism',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Nous (mind) orders matter rationally'],
    historical_weight: 0.65,
    // Anaxagoras: "Nous" (Mind/Intellect) as cosmic ordering principle; first to bring philosophy to Athens.
    // Very high reason (+0.85): nous as rational organizer of matter. High reality (+0.8): studied nature
    // scientifically (correctly explained eclipses, Nile flooding). Prosecuted for impiety — defended
    // natural explanation of sun as burning stone against religious mythology.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.6 }
  },
  {
    id: 'empedocles',
    name: 'Empedocles',
    birth_year: -494,
    death_year: -434,
    dates: 'c.494–434 BC',
    birth_city: 'Akragas',
    birth_country_modern: 'Italy',
    latitude: 37.2906,
    longitude: 13.5833,
    school_of_thought: 'Pluralism',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Four elements; natural causation without myth'],
    historical_weight: 0.6,
    // Empedocles: Four classical elements (earth, water, air, fire) + Love/Strife as cosmic forces.
    // Reason (+0.7): naturalistic explanation but less rigorous than atomists. Reality (+0.7): studied
    // THIS world but Love/Strife have quasi-mythological character. Also claimed miraculous powers
    // and allegedly leapt into Mount Etna for apotheosis — some mystical/religious tendencies.
    battles: { reason_faith: 0.7, reality_mysticism: 0.7, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.5 }
  },
  {
    id: 'zeno_of_elea',
    name: 'Zeno of Elea',
    birth_year: -490,
    death_year: -430,
    dates: 'c.490–430 BC',
    birth_city: 'Elea',
    birth_country_modern: 'Italy',
    latitude: 40.1614,
    longitude: 15.1531,
    school_of_thought: 'Eleatic School',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Logical paradoxes defending rational monism'],
    historical_weight: 0.65,
    // Zeno of Elea: Parmenides' defender; created famous paradoxes (Achilles & Tortoise, Arrow) to
    // defend logical monism. Very high reason (+0.85): pioneered reductio ad absurdum, foundational
    // for logic and mathematics. High reality (+0.8): defended objective Being against flux.
    // His paradoxes were eventually resolved by calculus — but showed importance of rigorous argument.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.5 }
  },
  {
    id: 'democritus',
    name: 'Democritus',
    birth_year: -460,
    death_year: -370,
    dates: 'c.460–370 BC',
    birth_city: 'Abdera',
    birth_country_modern: 'Greece',
    latitude: 40.9500,
    longitude: 24.9833,
    school_of_thought: 'Atomism',
    school: 'Pre-Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Atomism; materialist reason; void and atoms'],
    historical_weight: 0.7,
    // Democritus: "Laughing Philosopher"; founder of atomism — only atoms and void exist.
    // Very high reason (+0.9): systematic materialist explanation of ALL phenomena through rational
    // principles. Very high reality (+0.9): defended objective external world, materialist metaphysics.
    // Slightly higher individual (+0.6): advocated cheerfulness (euthymia) and self-sufficiency.
    // Also wrote on ethics: "The brave man is not only he who overcomes the enemy, but he who overcomes
    // his pleasures" — virtue through reason. Epicurus later built on Democritean atomism.
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },

  // SOPHIST (3)
  {
    id: 'protagoras',
    name: 'Protagoras',
    birth_year: -490,
    death_year: -420,
    dates: 'c.490–420 BC',
    birth_city: 'Abdera',
    birth_country_modern: 'Greece',
    latitude: 40.9500,
    longitude: 24.9833,
    school_of_thought: 'Sophism',
    school: 'Sophist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Man is the measure; cognitive relativism'],
    historical_weight: 1.0,
    // Protagoras: "Man is the measure" = subjectivism/relativism; no objective truth
    battles: { reason_faith: -0.5, reality_mysticism: -0.5, individual_collective: 0.3, freedom_coercion: 0.4, value_nihilism: -0.4, market_planning: 0.0, beauty_chaos: 0.1, good_evil: -0.3 }
  },
  {
    id: 'gorgias',
    name: 'Gorgias',
    birth_year: -483,
    death_year: -375,
    dates: 'c.483–375 BC',
    birth_city: 'Leontinoi',
    birth_country_modern: 'Italy',
    latitude: 37.2872,
    longitude: 14.9925,
    school_of_thought: 'Sophism',
    school: 'Sophist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Nothing exists; radical rhetorical nihilism'],
    historical_weight: 0.6,
    // Gorgias: "Nothing exists, if it did we couldn't know it" = radical nihilism/anti-reason
    battles: { reason_faith: -0.8, reality_mysticism: -0.8, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: -0.8, market_planning: 0.0, beauty_chaos: -0.3, good_evil: -0.5 }
  },
  {
    id: 'thrasymachus',
    name: 'Thrasymachus',
    birth_year: -459,
    death_year: -400,
    dates: 'c.459–400 BC',
    birth_city: 'Chalcedon',
    birth_country_modern: 'Turkey',
    latitude: 40.9833,
    longitude: 29.0333,
    school_of_thought: 'Sophism',
    school: 'Sophist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Justice is the advantage of the stronger'],
    historical_weight: 0.5,
    // Thrasymachus: Might makes right = moral nihilism; cynical power politics
    battles: { reason_faith: 0.2, reality_mysticism: 0.3, individual_collective: 0.2, freedom_coercion: -0.3, value_nihilism: -0.4, market_planning: 0.0, beauty_chaos: -0.2, good_evil: -0.5 }
  },

  // SOCRATIC (1)
  {
    id: 'socrates',
    name: 'Socrates',
    birth_year: -470,
    death_year: -399,
    dates: 'c.470–399 BC',
    birth_city: 'Athens',
    birth_country_modern: 'Greece',
    latitude: 37.9838,
    longitude: 23.7275,
    school_of_thought: 'Socratic Method',
    school: 'Socratic',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Dialectic method; logos; the examined life'],
    historical_weight: 1.0,
    // Socrates: Founder of Western ethics; "The unexamined life is not worth living."
    // Near-perfect reason (+0.95): invented dialectic method, sought universal definitions through
    // rigorous questioning. High reality (+0.85): sought objective truth, but relied on dialectic
    // over empirical observation. High individual (+0.7): personal conscience over social pressure
    // (refused to arrest Leon of Salamis). High value (+0.9): virtue is knowledge; objective ethics.
    // High good_evil (+0.9): moral realism — evil is ignorance, no one does wrong willingly.
    // Slight mystical element: his "daimonion" (divine sign) reduces reality score slightly.
    battles: { reason_faith: 0.95, reality_mysticism: 0.85, individual_collective: 0.7, freedom_coercion: 0.7, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.7, good_evil: 0.9 }
  },

  // PLATONIC (1)
  {
    id: 'plato',
    name: 'Plato',
    birth_year: -428,
    death_year: -348,
    dates: 'c.428–348 BC',
    birth_city: 'Athens',
    birth_country_modern: 'Greece',
    latitude: 37.9838,
    longitude: 23.7275,
    school_of_thought: 'Platonism',
    school: 'Platonic',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Eternal Forms; objective truth; reason over senses'],
    historical_weight: 1.0,
    // Plato: Defended objective truth against sophist relativism; founded the Academy.
    // High reason (+0.85): systematic philosophy, dialectical method. BUT: depreciated senses in favor
    // of pure intellect — Forms exist in transcendent realm, not THIS world. Reality (+0.7): defended
    // objective reality but located it in a separate realm accessible only to pure reason — proto-mystical.
    // Neutral politics: Republic advocates philosopher-kings (benevolent authoritarianism) — neither
    // individualist nor collectivist in modern sense. Very high value/beauty (+0.9): objective Forms of
    // Good, Beautiful exist. High good_evil (+0.85): moral realism, virtue ethics.
    // Aristotle later corrected Plato by bringing Forms down to earth (immanent universals).
    battles: { reason_faith: 0.85, reality_mysticism: 0.7, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.9, good_evil: 0.85 }
  },

  // ARISTOTELIAN (1)
  {
    id: 'aristotle',
    name: 'Aristotle',
    birth_year: -384,
    death_year: -322,
    dates: '384–322 BC',
    birth_city: 'Stagira',
    birth_country_modern: 'Greece',
    latitude: 40.5269,
    longitude: 23.7508,
    school_of_thought: 'Aristotelianism',
    school: 'Aristotelian',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Logic; empiricism; objective science and ethics'],
    historical_weight: 1.0,
    // Aristotle: THE philosopher of reason and reality. Objectivism's closest ancient ally.
    // PERFECT reason (+1.0): invented formal logic (syllogism), founded multiple sciences.
    // PERFECT reality (+1.0): "A is A" (law of identity); universals exist IN particulars, not in
    // separate realm. Rejected Platonic otherworldliness. Empirical observation grounds knowledge.
    // High individual (+0.8): eudaimonia (flourishing) is personal achievement through virtue.
    // "Man is a rational animal" — individual reason as defining characteristic.
    // High freedom (+0.7): endorsed slavery (product of era) but defended private property, natural law.
    // PERFECT value (+1.0): Nicomachean Ethics — objective virtues, rational self-interest as proper aim.
    // Very high beauty (+0.9): Poetics — objective standards in art (unity, probability, catharsis).
    // Very high good_evil (+0.95): moral realism; virtue as objective, rational, achievable.
    // Moderate market (+0.3): defended private property but suspicious of trade/money-making (product of era).
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 0.8, freedom_coercion: 0.7, value_nihilism: 1.0, market_planning: 0.3, beauty_chaos: 0.9, good_evil: 0.95 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 2: HELLENISTIC & ROMAN (c.341 BC – 529 AD) - 14 philosophers
  // ═══════════════════════════════════════════════════════════

  // EPICUREAN (2)
  {
    id: 'epicurus',
    name: 'Epicurus',
    birth_year: -341,
    death_year: -270,
    dates: '341–270 BC',
    birth_city: 'Samos',
    birth_country_modern: 'Greece',
    latitude: 37.7575,
    longitude: 26.9761,
    school_of_thought: 'Epicureanism',
    school: 'Epicurean',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Reason guides pleasure; atomic ethics'],
    historical_weight: 1.0,
    // Epicurus: Materialist atomism (building on Democritus); happiness through RATIONAL pleasure.
    // Very high reason (+0.9): systematic philosophy, empiricism (senses as criterion of truth).
    // Very high reality (+0.9): materialist — only atoms and void; no supernatural realm; gods exist
    // but don't intervene. High individual (+0.8): "live unnoticed" — personal tranquility (ataraxia)
    // as goal; friendship-based communities. High value (+0.8): rational hedonism — not sensual excess
    // but absence of pain (aponia) and mental disturbance. Good_evil (+0.7): objective ethics based on
    // nature, but focused on pleasure/pain rather than virtue per se. Key Objectivist parallel: this-worldly,
    // pro-reason, pro-individual, anti-religious-fear. Differs: pleasure vs. achievement as standard.
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.8, freedom_coercion: 0.7, value_nihilism: 0.8, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.7 }
  },
  {
    id: 'lucretius',
    name: 'Lucretius',
    birth_year: -99,
    death_year: -55,
    dates: 'c.99–55 BC',
    birth_city: 'Rome',
    birth_country_modern: 'Italy',
    latitude: 41.9028,
    longitude: 12.4964,
    school_of_thought: 'Epicureanism',
    school: 'Epicurean',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['De Rerum Natura; atomism; reason over religion'],
    historical_weight: 0.7,
    // Lucretius: Roman poet-philosopher who wrote De Rerum Natura (On the Nature of Things).
    // Very high reason (+0.9): systematic exposition of Epicurean physics/ethics; attacks superstition.
    // Very high reality (+0.9): materialist atomism — explains ALL phenomena through natural causes.
    // Explicitly attacked religion as source of fear and evil ("Tantum religio potuit suadere malorum").
    // High value (+0.8): this-worldly ethics. Beauty (+0.7): combined philosophical rigor with poetry.
    // Slightly lower good_evil (+0.6): ethics derivative from physics, less developed than Aristotle's.
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.7, freedom_coercion: 0.6, value_nihilism: 0.8, market_planning: 0.0, beauty_chaos: 0.7, good_evil: 0.6 }
  },

  // STOIC (6)
  {
    id: 'zeno_of_citium',
    name: 'Zeno of Citium',
    birth_year: -334,
    death_year: -262,
    dates: 'c.334–262 BC',
    birth_city: 'Citium',
    birth_country_modern: 'Cyprus',
    latitude: 34.9186,
    longitude: 33.6362,
    school_of_thought: 'Stoicism',
    school: 'Stoic',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Universal Logos; virtue through reason'],
    historical_weight: 1.0,
    // Zeno of Citium: Founded Stoicism in Athens (taught at the Stoa Poikile = "Painted Porch").
    // Very high reason (+0.9): logic as first pillar of Stoicism; virtue = living according to reason.
    // Moderate reality (+0.7): Stoic physics posits rational Logos pervading universe — pantheistic
    // tendency (God = Nature = Reason) is somewhat mystical compared to Aristotelian realism.
    // High value (+0.9): virtue is the ONLY good; external goods are "indifferent" (wealth, health).
    // Very high good_evil (+0.9): objective ethics based on nature/reason. Individual (+0.6): emphasis
    // on personal virtue BUT also cosmopolitanism, duty to rational world-order.
    battles: { reason_faith: 0.9, reality_mysticism: 0.7, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.9 }
  },
  {
    id: 'chrysippus',
    name: 'Chrysippus',
    birth_year: -279,
    death_year: -206,
    dates: 'c.279–206 BC',
    birth_city: 'Soli',
    birth_country_modern: 'Turkey',
    latitude: 36.7500,
    longitude: 34.5500,
    school_of_thought: 'Stoicism',
    school: 'Stoic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Systematic Stoic logic; master of the syllogism'],
    historical_weight: 0.7,
    // Chrysippus: "Second founder of Stoicism"; systematized Stoic logic (propositional logic).
    // Very high reason (+0.9): prolific logician, developed sophisticated argument forms.
    // Said "without Chrysippus, there would be no Stoa." Moderate reality (+0.7): shared Stoic
    // pantheistic physics (Logos/Nature/God). High value (+0.85): rigorous defense of Stoic ethics.
    // High good_evil (+0.85): developed Stoic moral psychology (impressions, assent, impulse).
    battles: { reason_faith: 0.9, reality_mysticism: 0.7, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.85, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.85 }
  },
  {
    id: 'cicero',
    name: 'Cicero',
    birth_year: -106,
    death_year: -43,
    dates: '106–43 BC',
    birth_city: 'Arpinum',
    birth_country_modern: 'Italy',
    latitude: 41.6494,
    longitude: 13.6083,
    school_of_thought: 'Stoicism / Eclecticism',
    school: 'Stoic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Natural law; rational statecraft and rhetoric'],
    historical_weight: 0.85,
    // Cicero: Roman statesman, orator, eclectic philosopher (primarily Stoic with Academic skeptic elements).
    // High reason (+0.8): transmitted Greek philosophy to Rome; De Officiis, De Re Publica. Defended
    // natural law accessible to reason. Moderate reality (+0.7): eclectic, not a systematic metaphysician.
    // High value (+0.8): virtue ethics, duty, honesty. Market (+0.3): defended private property, moderate
    // economic views. Beauty (+0.7): master of Latin prose, aesthetic standards in rhetoric.
    // Good_evil (+0.8): natural law ethics — objective moral standards discoverable by reason.
    // Individual (+0.6): mixed — defended Republic against tyranny but also emphasized duty to state.
    battles: { reason_faith: 0.8, reality_mysticism: 0.7, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.8, market_planning: 0.3, beauty_chaos: 0.7, good_evil: 0.8 }
  },
  {
    id: 'seneca',
    name: 'Seneca',
    birth_year: -4,
    death_year: 65,
    dates: 'c.4 BC–65 AD',
    birth_city: 'Corduba',
    birth_country_modern: 'Spain',
    latitude: 37.8916,
    longitude: -4.7728,
    school_of_thought: 'Stoicism',
    school: 'Stoic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Reason and virtue; natural philosophy'],
    historical_weight: 0.7,
    // Seneca: Roman Stoic philosopher, statesman, dramatist. Nero's tutor (problematic association).
    // High reason (+0.85): Letters to Lucilius — practical Stoic philosophy through rational argument.
    // Moderate reality (+0.7): standard Stoic physics. Very high value (+0.9): "It is not that we have
    // a short time to live, but that we waste much of it." Individual (+0.6): personal virtue focus BUT
    // also duty to others. Very high good_evil (+0.9): moral clarity — distinguished between virtue and
    // externals. Tension: accumulated great wealth while preaching indifference to externals.
    battles: { reason_faith: 0.85, reality_mysticism: 0.7, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.9 }
  },
  {
    id: 'epictetus',
    name: 'Epictetus',
    birth_year: 50,
    death_year: 135,
    dates: 'c.50–135 AD',
    birth_city: 'Hierapolis',
    birth_country_modern: 'Turkey',
    latitude: 37.9239,
    longitude: 29.1269,
    school_of_thought: 'Stoicism',
    school: 'Stoic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Logos; only what is in our rational control'],
    historical_weight: 0.7,
    // Epictetus: Born a slave, became one of the most influential Stoic teachers.
    // Very high reason (+0.9): Enchiridion/Discourses — rigorous analysis of what is/isn't in our control.
    // "Some things are within our power, while others are not" — focus reason on what you can control.
    // Moderate reality (+0.7): standard Stoic metaphysics. Higher individual (+0.7): personal moral
    // autonomy — even as slave, inner freedom through reason. Higher freedom (+0.8): "No man is free
    // who is not master of himself" — psychological freedom more important than political.
    // Very high value/good_evil (+0.9): clear objective ethics; virtue is the only good.
    battles: { reason_faith: 0.9, reality_mysticism: 0.7, individual_collective: 0.7, freedom_coercion: 0.8, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.9 }
  },
  {
    id: 'marcus_aurelius',
    name: 'Marcus Aurelius',
    birth_year: 121,
    death_year: 180,
    dates: '121–180 AD',
    birth_city: 'Rome',
    birth_country_modern: 'Italy',
    latitude: 41.9028,
    longitude: 12.4964,
    school_of_thought: 'Stoicism',
    school: 'Stoic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Rational self-governance; universal reason'],
    historical_weight: 0.85,
    // Marcus Aurelius: "Philosopher-king"; Roman Emperor who wrote Meditations for private reflection.
    // High reason (+0.85): Meditations demonstrate rigorous self-examination, logical argument.
    // Lower reality (+0.6): more mystical/religious tone than earlier Stoics — "the universe is either
    // atoms or providence" shows tension. Also pessimistic undertones: "all is vanity." Individual (+0.5):
    // balanced between personal virtue and duty to empire/cosmic order. Freedom (+0.5): as emperor,
    // pragmatic compromises; also Stoic acceptance of fate (amor fati) reduces activist freedom.
    // Very high value/good_evil (+0.9): maintained Stoic moral clarity despite political pressures.
    battles: { reason_faith: 0.85, reality_mysticism: 0.6, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.9 }
  },

  // SKEPTIC (3)
  {
    id: 'pyrrho',
    name: 'Pyrrho',
    birth_year: -360,
    death_year: -270,
    dates: 'c.360–270 BC',
    birth_city: 'Elis',
    birth_country_modern: 'Greece',
    latitude: 37.8879,
    longitude: 21.3806,
    school_of_thought: 'Pyrrhonism',
    school: 'Skeptic',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Radical skepticism; suspend all judgment'],
    historical_weight: 1.0,
    // Pyrrho: Suspend ALL judgment; reason cannot reach truth; ataraxia through ignorance
    battles: { reason_faith: -0.7, reality_mysticism: -0.5, individual_collective: 0.3, freedom_coercion: 0.4, value_nihilism: -0.5, market_planning: 0.0, beauty_chaos: 0.0, good_evil: -0.3 }
  },
  {
    id: 'carneades',
    name: 'Carneades',
    birth_year: -214,
    death_year: -129,
    dates: 'c.214–129 BC',
    birth_city: 'Cyrene',
    birth_country_modern: 'Libya',
    latitude: 32.8240,
    longitude: 21.8569,
    school_of_thought: 'Academic Skepticism',
    school: 'Skeptic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Academic skepticism; only probability'],
    historical_weight: 0.6,
    // Carneades: Attacked Stoic certainty; only probability, never truth
    battles: { reason_faith: -0.5, reality_mysticism: -0.3, individual_collective: 0.4, freedom_coercion: 0.4, value_nihilism: -0.3, market_planning: 0.0, beauty_chaos: 0.1, good_evil: -0.1 }
  },
  {
    id: 'sextus_empiricus',
    name: 'Sextus Empiricus',
    birth_year: 160,
    death_year: 210,
    dates: 'c.160–210 AD',
    birth_city: 'Greece',
    birth_country_modern: 'Greece',
    latitude: 37.9838,
    longitude: 23.7275,
    school_of_thought: 'Pyrrhonism',
    school: 'Skeptic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Pyrrhonism; no objective knowledge possible'],
    historical_weight: 0.6,
    // Sextus Empiricus: Systematized attacks on reason; "Against the Dogmatists" = against all knowledge claims
    battles: { reason_faith: -0.8, reality_mysticism: -0.6, individual_collective: 0.3, freedom_coercion: 0.4, value_nihilism: -0.5, market_planning: 0.0, beauty_chaos: -0.1, good_evil: -0.3 }
  },

  // NEO-PLATONIC (3)
  {
    id: 'plotinus',
    name: 'Plotinus',
    birth_year: 204,
    death_year: 270,
    dates: 'c.204–270 AD',
    birth_city: 'Lycopolis',
    birth_country_modern: 'Egypt',
    latitude: 27.1833,
    longitude: 31.1667,
    school_of_thought: 'Neoplatonism',
    school: 'Neo-Platonic',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['The One beyond reason; mystical emanation; reality is graded emanation from ineffable source'],
    historical_weight: 1.0,
    // Plotinus: The One is BEYOND reason (ineffable); material world is lowest emanation; mystical union is goal
    battles: { reason_faith: -0.8, reality_mysticism: -0.9, individual_collective: -0.4, freedom_coercion: 0.2, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.4 }
  },
  {
    id: 'porphyry',
    name: 'Porphyry',
    birth_year: 234,
    death_year: 305,
    dates: 'c.234–305 AD',
    birth_city: 'Tyre',
    birth_country_modern: 'Lebanon',
    latitude: 33.2705,
    longitude: 35.2038,
    school_of_thought: 'Neoplatonism',
    school: 'Neo-Platonic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Neoplatonist mystic; reason as ladder to supra-rational unity'],
    historical_weight: 0.6,
    // Porphyry: Reason only a ladder to transcend; goal is supra-rational union
    battles: { reason_faith: -0.6, reality_mysticism: -0.7, individual_collective: -0.3, freedom_coercion: 0.2, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.3 }
  },

  // CHURCH FATHERS (1)
  {
    id: 'augustine',
    name: 'Augustine of Hippo',
    birth_year: 354,
    death_year: 430,
    dates: '354–430 AD',
    birth_city: 'Thagaste',
    birth_country_modern: 'Algeria',
    latitude: 36.2667,
    longitude: 8.3167,
    school_of_thought: 'Christian Platonism',
    school: 'Church Fathers',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Faith over reason; original sin; City of God; divine illumination'],
    historical_weight: 1.0,
    // Augustine: "Believe that you may understand"; faith precedes reason; original sin; City of God > earthly
    battles: { reason_faith: -0.6, reality_mysticism: -0.5, individual_collective: -0.3, freedom_coercion: -0.2, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.5 }
  },
  {
    id: 'proclus',
    name: 'Proclus',
    birth_year: 412,
    death_year: 485,
    dates: '412–485 AD',
    birth_city: 'Constantinople',
    birth_country_modern: 'Turkey',
    latitude: 41.0082,
    longitude: 28.9784,
    school_of_thought: 'Neoplatonism',
    school: 'Neo-Platonic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Systematic Neoplatonism; divine intellect above discursive reason'],
    historical_weight: 0.6,
    // Proclus: Divine intellect above reason; elaborate mystical hierarchy; reality emanates from The One
    battles: { reason_faith: -0.7, reality_mysticism: -0.8, individual_collective: -0.3, freedom_coercion: 0.2, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.4 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 3: MEDIEVAL (c.800–1400) - 14 philosophers
  // ═══════════════════════════════════════════════════════════

  // ISLAMIC (5)
  {
    id: 'al_kindi',
    name: 'Al-Kindi',
    birth_year: 801,
    death_year: 873,
    dates: 'c.801–873',
    birth_city: 'Kufa',
    birth_country_modern: 'Iraq',
    latitude: 32.0300,
    longitude: 44.4000,
    school_of_thought: 'Islamic Philosophy',
    school: 'Islamic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['First Arab philosopher; reason and revelation compatible'],
    historical_weight: 0.6,
    // Al-Kindi: "Philosopher of the Arabs"; first major Islamic philosopher, translated Greek works.
    // High reason (+0.7): defended philosophy's legitimacy, integrated Aristotelian/Neoplatonic thought.
    // Moderate reality (+0.6): some Neoplatonic emanation metaphysics reduces realism. Argued reason
    // and revelation are compatible but revelation ultimately authoritative for theological matters.
    // Pioneered philosophical terminology in Arabic; made Greek philosophy accessible to Islamic world.
    battles: { reason_faith: 0.7, reality_mysticism: 0.6, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },
  {
    id: 'al_farabi',
    name: 'Al-Farabi',
    birth_year: 872,
    death_year: 950,
    dates: 'c.872–950',
    birth_city: 'Farab',
    birth_country_modern: 'Kazakhstan',
    latitude: 42.3167,
    longitude: 68.2500,
    school_of_thought: 'Islamic Aristotelianism',
    school: 'Islamic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Aristotelian rationalism; philosopher-king ideal'],
    historical_weight: 0.7,
    // Al-Farabi: "Second Teacher" (after Aristotle); greatest Islamic political philosopher.
    // High reason (+0.8): systematic Aristotelian logic; wrote on syllogistics, demonstration, rhetoric.
    // Moderate reality (+0.7): combined Aristotle with Neoplatonic emanation scheme (Active Intellect).
    // Political philosophy: ideal state ruled by philosopher-prophet-king (synthesis of Plato's Republic
    // with Islamic prophecy). High value (+0.7): objective ethics grounded in reason/nature.
    // Major influence on Avicenna, Averroes, Maimonides.
    battles: { reason_faith: 0.8, reality_mysticism: 0.7, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.7 }
  },
  {
    id: 'avicenna',
    name: 'Avicenna',
    birth_year: 980,
    death_year: 1037,
    dates: '980–1037',
    birth_city: 'Afshana',
    birth_country_modern: 'Uzbekistan',
    latitude: 39.7681,
    longitude: 64.4556,
    school_of_thought: 'Islamic Aristotelianism',
    school: 'Islamic',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Rationalist metaphysics; floating man argument'],
    historical_weight: 1.0,
    // Avicenna (Ibn Sina): Most influential Islamic philosopher; polymath (medicine, physics, metaphysics).
    // Very high reason (+0.85): "Book of Healing" — systematic rationalist metaphysics. Essence/existence
    // distinction; "Flying Man" argument (precursor to cogito). High reality (+0.75): but emanation
    // metaphysics (Necessary Being → Active Intellect → world) has mystical elements. High value (+0.8):
    // rational ethics, virtues, happiness through contemplation. Canon of Medicine dominated for centuries.
    // Targeted by Al-Ghazali's attack but defended by Averroes.
    battles: { reason_faith: 0.85, reality_mysticism: 0.75, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.8, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.75 }
  },
  {
    id: 'al_ghazali',
    name: 'Al-Ghazali',
    birth_year: 1058,
    death_year: 1111,
    dates: '1058–1111',
    birth_city: 'Tus',
    birth_country_modern: 'Iran',
    latitude: 36.5900,
    longitude: 59.5400,
    school_of_thought: 'Islamic Theology',
    school: 'Islamic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Incoherence of philosophers; faith over reason'],
    historical_weight: 0.75,
    // Al-Ghazali: "Incoherence of Philosophers" attacked reason; faith/revelation primary; Sufi mystic
    battles: { reason_faith: -0.8, reality_mysticism: -0.6, individual_collective: -0.2, freedom_coercion: 0.0, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'averroes',
    name: 'Averroes',
    birth_year: 1126,
    death_year: 1198,
    dates: '1126–1198',
    birth_city: 'Cordoba',
    birth_country_modern: 'Spain',
    latitude: 37.8916,
    longitude: -4.7728,
    school_of_thought: 'Islamic Aristotelianism',
    school: 'Islamic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["Aristotle's great commentator; reason is autonomous"],
    historical_weight: 0.85,
    // Averroes (Ibn Rushd): "The Commentator"; greatest Aristotelian of Islamic world, wrote
    // definitive commentaries on Aristotle. Very high reason (+0.9): defended philosophy against
    // Al-Ghazali's attacks in "Incoherence of the Incoherence." Argued reason is autonomous and
    // philosophy can reach truth independently. High reality (+0.8): closer to Aristotelian realism
    // than Avicenna's Neoplatonic emanation. Influenced Latin Scholastics (especially Aquinas).
    // "Double truth" doctrine (possibly misattributed) — philosophy and religion address different
    // domains. High value (+0.8): rational ethics. Banned in Islamic world but preserved in West.
    battles: { reason_faith: 0.9, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.8, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.7 }
  },

  // SCHOLASTIC (7)
  {
    id: 'anselm',
    name: 'Anselm',
    birth_year: 1033,
    death_year: 1109,
    dates: '1033–1109',
    birth_city: 'Aosta',
    birth_country_modern: 'Italy',
    latitude: 45.7372,
    longitude: 7.3150,
    school_of_thought: 'Scholasticism',
    school: 'Scholastic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Faith precedes reason; ontological argument subordinates logic to theology — reason as servant of revelation'],
    historical_weight: 0.7,
    // Anselm: "Faith seeking understanding" = faith FIRST; reason serves theology; ontological argument is faith-based
    battles: { reason_faith: -0.5, reality_mysticism: -0.3, individual_collective: -0.2, freedom_coercion: 0.1, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'peter_abelard',
    name: 'Peter Abelard',
    birth_year: 1079,
    death_year: 1142,
    dates: '1079–1142',
    birth_city: 'Le Pallet',
    birth_country_modern: 'France',
    latitude: 47.1478,
    longitude: -1.3358,
    school_of_thought: 'Scholasticism',
    school: 'Scholastic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Dialectics; skepticism of scriptural authority'],
    historical_weight: 0.65,
    // Peter Abelard: Most original medieval logician before Aquinas; challenged Bernard of Clairvaux.
    // High reason (+0.7): Sic et Non method — questioned authorities by showing contradictions, requiring
    // rational resolution. Moderate reality (+0.6): still within Christian framework. Applied dialectic
    // to theology; condemned for rationalism by Bernard. Ethics of intention: moral value depends on
    // inner intent, not just external act (proto-modern ethics).
    battles: { reason_faith: 0.7, reality_mysticism: 0.6, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },
  {
    id: 'maimonides',
    name: 'Maimonides',
    birth_year: 1138,
    death_year: 1204,
    dates: '1138–1204',
    birth_city: 'Cordoba',
    birth_country_modern: 'Spain',
    latitude: 37.8916,
    longitude: -4.7728,
    school_of_thought: 'Jewish Aristotelianism',
    school: 'Scholastic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Rationalist theology; reason compatible with Torah'],
    historical_weight: 0.85,
    // Maimonides (Rambam): Greatest Jewish philosopher; "Guide for the Perplexed" reconciles Aristotle
    // with Torah. High reason (+0.8): systematic Aristotelian; negative theology (we know what God
    // ISN'T) shows epistemic humility. Moderate reality (+0.7): maintains transcendent God beyond
    // full comprehension. High value (+0.75): rational ethics, virtues, purpose of commandments.
    // Influenced Aquinas, Spinoza. "Give a man a fish and you feed him for a day; teach a man to
    // fish and you feed him for a lifetime" — emphasis on rational self-sufficiency.
    battles: { reason_faith: 0.8, reality_mysticism: 0.7, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.75, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.75 }
  },
  {
    id: 'roger_bacon',
    name: 'Roger Bacon',
    birth_year: 1214,
    death_year: 1292,
    dates: 'c.1214–1292',
    birth_city: 'Ilchester',
    birth_country_modern: 'United Kingdom',
    latitude: 50.9667,
    longitude: -2.6833,
    school_of_thought: 'Scholasticism / Empiricism',
    school: 'Scholastic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Empirical science; observation over authority'],
    historical_weight: 0.65,
    // Roger Bacon: "Doctor Mirabilis"; Franciscan proto-scientist; championed experiential knowledge.
    // High reason (+0.75): advocated scientia experimentalis — knowledge through observation and
    // experiment, criticized reliance on authority. High reality (+0.8): studied optics, astronomy,
    // mathematics empirically. Still within Christian framework but anticipated Scientific Revolution.
    // "Argument concludes a question, but does not make us feel certain... unless the truth is also
    // found by experience."
    battles: { reason_faith: 0.75, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },
  {
    id: 'thomas_aquinas',
    name: 'Thomas Aquinas',
    birth_year: 1225,
    death_year: 1274,
    dates: '1225–1274',
    birth_city: 'Roccasecca',
    birth_country_modern: 'Italy',
    latitude: 41.5063,
    longitude: 13.6686,
    school_of_thought: 'Thomism',
    school: 'Scholastic',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Reason and faith reconciled; natural law'],
    historical_weight: 1.0,
    // Aquinas: Tried to reconcile reason/faith but theology > philosophy; natural law is good; faith still trumps reason ultimately
    battles: { reason_faith: -0.2, reality_mysticism: 0.4, individual_collective: 0.2, freedom_coercion: 0.3, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.7 }
  },
  {
    id: 'duns_scotus',
    name: 'Duns Scotus',
    birth_year: 1266,
    death_year: 1308,
    dates: '1266–1308',
    birth_city: 'Duns',
    birth_country_modern: 'United Kingdom',
    latitude: 55.7728,
    longitude: -2.3522,
    school_of_thought: 'Scotism',
    school: 'Scholastic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ["Will primacy over intellect; divine voluntarism — God's will not bound by reason"],
    historical_weight: 0.65,
    // Duns Scotus: Divine voluntarism = God's arbitrary will over reason; will > intellect
    battles: { reason_faith: -0.5, reality_mysticism: -0.3, individual_collective: 0.2, freedom_coercion: 0.2, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.3 }
  },
  {
    id: 'william_of_ockham',
    name: 'William of Ockham',
    birth_year: 1287,
    death_year: 1347,
    dates: 'c.1287–1347',
    birth_city: 'Ockham',
    birth_country_modern: 'United Kingdom',
    latitude: 51.2833,
    longitude: -0.4333,
    school_of_thought: 'Nominalism',
    school: 'Scholastic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["Nominalism; Occam's Razor; empirical logic"],
    historical_weight: 0.75,
    // Ockham: Nominalism undermines universals; fideist (reason and faith separate); but empirical method positive
    battles: { reason_faith: 0.3, reality_mysticism: 0.5, individual_collective: 0.4, freedom_coercion: 0.4, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.4 }
  },

  // MYSTICAL (2)
  {
    id: 'bernard_of_clairvaux',
    name: 'Bernard of Clairvaux',
    birth_year: 1090,
    death_year: 1153,
    dates: '1090–1153',
    birth_city: 'Fontaine-lès-Dijon',
    birth_country_modern: 'France',
    latitude: 47.3387,
    longitude: 5.0341,
    school_of_thought: 'Christian Mysticism',
    school: 'Mystical',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Love and faith over dialectical reason'],
    historical_weight: 0.6,
    // Bernard: Attacked Abelard's rationalism; love/faith over reason; mystical contemplation
    battles: { reason_faith: -0.8, reality_mysticism: -0.6, individual_collective: -0.3, freedom_coercion: 0.0, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.5 }
  },
  {
    id: 'meister_eckhart',
    name: 'Meister Eckhart',
    birth_year: 1260,
    death_year: 1328,
    dates: 'c.1260–1328',
    birth_city: 'Tambach',
    birth_country_modern: 'Germany',
    latitude: 50.7900,
    longitude: 10.6100,
    school_of_thought: 'Christian Mysticism',
    school: 'Mystical',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Mystical union with God beyond rational concepts'],
    historical_weight: 1.0,
    // Meister Eckhart: Radical mystic; God beyond all concepts; soul dissolves into Godhead; anti-rational
    battles: { reason_faith: -0.9, reality_mysticism: -0.9, individual_collective: -0.6, freedom_coercion: 0.1, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.4 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 4: RENAISSANCE (1400–1620) - 7 philosophers
  // ═══════════════════════════════════════════════════════════

  // HUMANIST (3)
  {
    id: 'pico_della_mirandola',
    name: 'Pico della Mirandola',
    birth_year: 1463,
    death_year: 1494,
    dates: '1463–1494',
    birth_city: 'Mirandola',
    birth_country_modern: 'Italy',
    latitude: 44.8872,
    longitude: 11.0656,
    school_of_thought: 'Renaissance Humanism',
    school: 'Humanist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Human dignity; eclectic rational humanism'],
    historical_weight: 0.6,
    // Pico della Mirandola: "Oration on the Dignity of Man" — Renaissance manifesto of human potential.
    // High reason (+0.7): sought synthesis of all philosophies through rational concordance. Moderate
    // reality (+0.6): mixed Greek, Christian, Kabbalistic, Hermetic traditions (some mystical elements).
    // High individual (+0.7): humans have NO fixed nature — we CREATE ourselves through choice.
    // Very high beauty (+0.8): aesthetic ideals of Renaissance. Died young (31), poisoned possibly
    // by Medici enemies. Anticipated existentialist themes of self-creation.
    battles: { reason_faith: 0.7, reality_mysticism: 0.6, individual_collective: 0.7, freedom_coercion: 0.6, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.8, good_evil: 0.6 }
  },
  {
    id: 'erasmus',
    name: 'Erasmus',
    birth_year: 1466,
    death_year: 1536,
    dates: '1466–1536',
    birth_city: 'Rotterdam',
    birth_country_modern: 'Netherlands',
    latitude: 51.9244,
    longitude: 4.4777,
    school_of_thought: 'Christian Humanism',
    school: 'Humanist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Christian humanism; rational reform of the Church'],
    historical_weight: 1.0,
    // Erasmus of Rotterdam: "Prince of Humanists"; championed classical scholarship and rational reform.
    // High reason (+0.75): recovered/edited Greek New Testament; used philology/textual criticism.
    // "Praise of Folly" satirized Church corruption through wit. Moderate reality (+0.65): still Christian
    // framework but applied reason to reform. Individual (+0.6): emphasized free will against Luther's
    // determinism. Opposed violence of Reformation wars — preferred gradual rational reform.
    // "In the land of the blind, the one-eyed man is king."
    battles: { reason_faith: 0.75, reality_mysticism: 0.65, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.7, good_evil: 0.7 }
  },
  {
    id: 'thomas_more',
    name: 'Thomas More',
    birth_year: 1478,
    death_year: 1535,
    dates: '1478–1535',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Christian Humanism',
    school: 'Humanist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Utopian rationalism; social reform'],
    historical_weight: 0.65,
    // Thomas More: Lawyer, statesman, author of "Utopia" — coined the term meaning "no place."
    // High reason (+0.7): applied rationalist critique to social arrangements. Moderate reality (+0.6):
    // Christian martyr (executed for refusing to accept Henry VIII as head of Church). Individual (+0.4):
    // Utopia features common property, no private ownership — proto-communist elements. Freedom (+0.5):
    // some religious toleration in Utopia but More himself persecuted Protestants. Ambiguous: was
    // Utopia satire or blueprint? Canonized as saint; also executed heretics.
    battles: { reason_faith: 0.7, reality_mysticism: 0.6, individual_collective: 0.4, freedom_coercion: 0.5, value_nihilism: 0.65, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.65 }
  },

  // POLITICAL REALIST (1)
  {
    id: 'machiavelli',
    name: 'Niccolò Machiavelli',
    birth_year: 1469,
    death_year: 1527,
    dates: '1469–1527',
    birth_city: 'Florence',
    birth_country_modern: 'Italy',
    latitude: 43.7696,
    longitude: 11.2558,
    school_of_thought: 'Political Realism',
    school: 'Political Realist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Political reason divorced from religious morality'],
    historical_weight: 1.0,
    // Machiavelli: Father of modern political science; "The Prince" analyzed power as it IS, not should be.
    // High reason (+0.8): empirical study of politics through historical examples, not theology.
    // Very high reality (+0.85): ruthless realism about human nature and political power. Low freedom
    // (+0.3): endorsed deception, force, cruelty when expedient for the ruler. Low value (+0.4): separated
    // politics from morality ("the end justifies the means"). Low good_evil (+0.2): moral relativism
    // in service of raison d'état. Also wrote "Discourses on Livy" praising republican virtue —
    // more nuanced than "The Prince" alone suggests. Individual (+0.5): focused on state, not individuals.
    battles: { reason_faith: 0.8, reality_mysticism: 0.85, individual_collective: 0.5, freedom_coercion: 0.3, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.2 }
  },

  // NATURALIST (1)
  {
    id: 'giordano_bruno',
    name: 'Giordano Bruno',
    birth_year: 1548,
    death_year: 1600,
    dates: '1548–1600',
    birth_city: 'Nola',
    birth_country_modern: 'Italy',
    latitude: 40.9247,
    longitude: 14.5278,
    school_of_thought: 'Renaissance Naturalism',
    school: 'Naturalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Infinite universe; reason and science over dogma'],
    historical_weight: 1.0,
    // Giordano Bruno: Renaissance martyr for reason; burned at stake by Inquisition for cosmological heresies.
    // Very high reason (+0.9): defended Copernican heliocentrism, proposed infinite universe with many worlds.
    // Moderate reality (+0.7): combined science with Hermetic/mystical elements (pantheism, "world soul").
    // Very high individual (+0.8): defied Church authority, wouldn't recant. Very high freedom (+0.9):
    // died for intellectual freedom. High value (+0.8): knowledge and truth as supreme values.
    // "Perhaps you who pronounce my sentence are in greater fear than I who receive it."
    battles: { reason_faith: 0.9, reality_mysticism: 0.7, individual_collective: 0.8, freedom_coercion: 0.9, value_nihilism: 0.8, market_planning: 0.0, beauty_chaos: 0.7, good_evil: 0.7 }
  },

  // ABOLITIONIST (1)
  {
    id: 'la_boetie',
    name: 'Étienne de La Boétie',
    birth_year: 1530,
    death_year: 1563,
    dates: '1530–1563',
    birth_city: 'Sarlat',
    birth_country_modern: 'France',
    latitude: 44.8903,
    longitude: 1.2164,
    school_of_thought: 'Classical Liberalism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Discourse on Voluntary Servitude; tyranny rests on consent; liberty through refusal'],
    historical_weight: 0.7,
    // La Boétie: Proto-libertarian; "Discourse on Voluntary Servitude" (age 18!) analyzed how tyranny
    // requires popular consent. Very high individual (+0.9): liberty is natural state, servitude is chosen.
    // Near-perfect freedom (+0.95): withdrawal of consent delegitimizes tyranny — "Resolve to serve no
    // more, and you are at once freed." Influenced anarchist/libertarian thought (Rothbard published it).
    // High reason (+0.75): rational analysis of political psychology. Friend of Montaigne.
    // Market (+0.5): didn't develop economic theory but anti-coercion implies property rights.
    battles: { reason_faith: 0.75, reality_mysticism: 0.7, individual_collective: 0.9, freedom_coercion: 0.95, value_nihilism: 0.7, market_planning: 0.5, beauty_chaos: 0.5, good_evil: 0.75 }
  },

  // SKEPTIC (1)
  {
    id: 'montaigne',
    name: 'Michel de Montaigne',
    birth_year: 1533,
    death_year: 1592,
    dates: '1533–1592',
    birth_city: 'Château de Montaigne',
    birth_country_modern: 'France',
    latitude: 44.8667,
    longitude: 0.0333,
    school_of_thought: 'Skepticism',
    school: 'Skeptic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Que sais-je? — radical self-doubt suspends all objective knowledge; skepticism as a way of life'],
    historical_weight: 0.7,
    // Montaigne: Father of the essay form; revived Pyrrhonian skepticism. "Que sais-je?" (What do I know?)
    // Low reason (+0.3): undermines certainty in human knowledge; "Apology for Raymond Sebond" attacks
    // reason's pretensions. Low reality (+0.3): we can't be sure of anything beyond appearances.
    // Moderate individual (+0.6): introspective, personal (the self as subject). Moderate freedom (+0.6):
    // tolerant of diversity, opposed religious persecution. Low value (+0.3): suspends judgment on values.
    // Low good_evil (+0.4): moral relativism follows from epistemological skepticism.
    // Influenced Pascal, Descartes (who then tried to overcome skepticism).
    battles: { reason_faith: 0.3, reality_mysticism: 0.3, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.4 }
  },

  // EMPIRICIST (1)
  {
    id: 'francis_bacon',
    name: 'Francis Bacon',
    birth_year: 1561,
    death_year: 1626,
    dates: '1561–1626',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Empiricism',
    school: 'Empiricist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Inductive method; idols of the mind; new science'],
    historical_weight: 0.7,
    // Francis Bacon: Father of empiricism and scientific method; "Novum Organum" (New Instrument).
    // Very high reason (+0.85): systematic inductive method for science; identified "Idols of the Mind"
    // (cognitive biases). Very high reality (+0.9): "Nature, to be commanded, must be obeyed" —
    // knowledge comes from studying the world AS IT IS. Rejected Scholastic reliance on Aristotle's authority.
    // High value (+0.8): "Knowledge is power" — science for human betterment. Individual (+0.6): science
    // is collective enterprise but serves human flourishing. Lord Chancellor but fell to bribery charges.
    battles: { reason_faith: 0.85, reality_mysticism: 0.9, individual_collective: 0.6, freedom_coercion: 0.5, value_nihilism: 0.8, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 5: EARLY MODERN (1588–1750) - 10 philosophers
  // ═══════════════════════════════════════════════════════════

  // EMPIRICIST (3)
  {
    id: 'thomas_hobbes',
    name: 'Thomas Hobbes',
    birth_year: 1588,
    death_year: 1679,
    dates: '1588–1679',
    birth_city: 'Westport',
    birth_country_modern: 'United Kingdom',
    latitude: 51.3492,
    longitude: -2.3467,
    school_of_thought: 'Materialism',
    school: 'Empiricist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Mechanistic materialism; rational social contract'],
    historical_weight: 0.7,
    // Hobbes: Materialist; "Leviathan" — state of nature is "war of all against all."
    // High reason (+0.8): geometric method, deductive political science. Very high reality (+0.9):
    // strict materialism — even mind is matter in motion. Low individual (+0.3): individuals surrender
    // rights to absolute sovereign. Very low freedom (+0.2): Leviathan has near-absolute power to prevent
    // civil war. Low value (+0.5): ethics reduced to self-preservation, no objective good beyond peace.
    // Low good_evil (+0.4): moral relativism — "good" is what we desire. Pro-peace but anti-liberty.
    // Influenced social contract tradition but in authoritarian direction.
    battles: { reason_faith: 0.8, reality_mysticism: 0.9, individual_collective: 0.3, freedom_coercion: 0.2, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.4 }
  },
  {
    id: 'john_locke',
    name: 'John Locke',
    birth_year: 1632,
    death_year: 1704,
    dates: '1632–1704',
    birth_city: 'Wrington',
    birth_country_modern: 'United Kingdom',
    latitude: 51.3667,
    longitude: -2.7667,
    school_of_thought: 'Empiricism / Liberalism',
    school: 'Empiricist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Tabula rasa; experience as the ground of knowledge'],
    historical_weight: 1.0,
    // John Locke: Father of classical liberalism; most important political philosopher for America.
    // Very high reason (+0.85): Essay Concerning Human Understanding — systematic empiricism, tabula rasa.
    // Very high reality (+0.85): knowledge from experience of objective world. Very high individual (+0.9):
    // natural rights to life, liberty, property exist PRIOR to government. Very high freedom (+0.9):
    // government exists only by consent; right to revolution if rights violated. High market (+0.7):
    // labor theory of property, defended private property. High value (+0.75): objective natural law.
    // Direct influence on Jefferson, Madison, American founding. Second Treatise is Objectivist-compatible
    // in many respects. Epistemology weaker than Aristotle (nominalism, primary/secondary qualities).
    battles: { reason_faith: 0.85, reality_mysticism: 0.85, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.75, market_planning: 0.7, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'george_berkeley',
    name: 'George Berkeley',
    birth_year: 1685,
    death_year: 1753,
    dates: '1685–1753',
    birth_city: 'Kilkenny',
    birth_country_modern: 'Ireland',
    latitude: 52.6541,
    longitude: -7.2448,
    school_of_thought: 'Idealism',
    school: 'Empiricist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Esse est percipi — existence requires a perceiver; denies mind-independent reality'],
    historical_weight: 0.7,
    // Berkeley: Idealist - no material world exists; reality is ideas in minds; God perceives all = theistic
    battles: { reason_faith: -0.3, reality_mysticism: -0.8, individual_collective: 0.3, freedom_coercion: 0.4, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.4 }
  },

  // RATIONALIST (5)
  {
    id: 'rene_descartes',
    name: 'René Descartes',
    birth_year: 1596,
    death_year: 1650,
    dates: '1596–1650',
    birth_city: 'La Haye en Touraine',
    birth_country_modern: 'France',
    latitude: 47.0000,
    longitude: 0.7500,
    school_of_thought: 'Rationalism',
    school: 'Rationalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Cogito; clear and distinct ideas; method of doubt'],
    historical_weight: 1.0,
    // Descartes: Father of modern philosophy; "Cogito ergo sum" (I think therefore I am).
    // Very high reason (+0.9): method of systematic doubt, geometric method for philosophy, founded
    // analytic geometry. High reality (+0.8): aimed to establish certain knowledge but introduced
    // problematic mind-body dualism. Individual (+0.7): the thinking self is foundational.
    // Epistemically: clear and distinct ideas as criterion of truth (rationalist, not empiricist).
    // Problems from Objectivist view: dualism separates mind from world; "evil demon" hypothesis
    // introduced radical skepticism that plagued later philosophy. But pro-science, pro-reason overall.
    battles: { reason_faith: 0.9, reality_mysticism: 0.8, individual_collective: 0.7, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.6 }
  },
  {
    id: 'baruch_spinoza',
    name: 'Baruch Spinoza',
    birth_year: 1632,
    death_year: 1677,
    dates: '1632–1677',
    birth_city: 'Amsterdam',
    birth_country_modern: 'Netherlands',
    latitude: 52.3676,
    longitude: 4.9041,
    school_of_thought: 'Rationalism / Pantheism',
    school: 'Rationalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Geometric ethics; reason as the highest freedom'],
    historical_weight: 0.85,
    // Spinoza: Radical rationalist; Ethics demonstrated "in geometric order." Excommunicated for heresy.
    // Very high reason (+0.9): deductive metaphysics from first principles; freedom = understanding necessity.
    // Moderate reality (+0.6): pantheism (Deus sive Natura — God = Nature) is quasi-mystical; denies
    // personal God but also denies individual free will (determinism). Very high value (+0.9): highest
    // good is intellectual love of God (= rational understanding of universe). Moderate freedom (+0.6):
    // psychological freedom through reason but metaphysical determinism. Individual (+0.5): finite modes
    // of infinite substance, not truly independent beings. Influenced Einstein, Goethe.
    battles: { reason_faith: 0.9, reality_mysticism: 0.6, individual_collective: 0.5, freedom_coercion: 0.6, value_nihilism: 0.9, market_planning: 0.0, beauty_chaos: 0.7, good_evil: 0.7 }
  },
  {
    id: 'malebranche',
    name: 'Malebranche',
    birth_year: 1638,
    death_year: 1715,
    dates: '1638–1715',
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Occasionalism',
    school: 'Rationalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Vision in God; occasionalism; Cartesian theology'],
    historical_weight: 0.6,
    // Malebranche: Cartesian priest; "occasionalism" — God is the only true cause; we "see all things in God."
    // High reason (+0.7): systematic, rigorous argument. Moderate reality (+0.5): occasionalism denies
    // natural causation — all events are directly caused by God, reducing nature to mere occasion.
    // This is quasi-mystical: finite minds don't truly know external world but only divine ideas.
    // Influenced Berkeley's idealism. Less important than Descartes, Spinoza, Leibniz.
    battles: { reason_faith: 0.7, reality_mysticism: 0.5, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.6 }
  },
  {
    id: 'leibniz',
    name: 'G. W. Leibniz',
    birth_year: 1646,
    death_year: 1716,
    dates: '1646–1716',
    birth_city: 'Leipzig',
    birth_country_modern: 'Germany',
    latitude: 51.3397,
    longitude: 12.3731,
    school_of_thought: 'Rationalism',
    school: 'Rationalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Principle of sufficient reason; monads; calculus'],
    historical_weight: 0.85,
    // Leibniz: Universal genius; co-invented calculus (with Newton), pioneered symbolic logic, polymath.
    // High reason (+0.8): principle of sufficient reason, principle of non-contradiction as foundations.
    // Moderate reality (+0.6): monadology — reality consists of "windowless" soul-like substances, not
    // material atoms. "Best of all possible worlds" theodicy (satirized by Voltaire's Candide). Pre-established
    // harmony = quasi-mystical solution to mind-body problem. High value (+0.8): optimistic rationalism.
    // High beauty (+0.8): aesthetic order in universe reflects divine reason. High good_evil (+0.8):
    // rational ethics, natural law. Less this-worldly than Aristotle but highly pro-reason.
    battles: { reason_faith: 0.8, reality_mysticism: 0.6, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.8, market_planning: 0.0, beauty_chaos: 0.8, good_evil: 0.8 }
  },
  {
    id: 'christian_wolff',
    name: 'Christian Wolff',
    birth_year: 1679,
    death_year: 1754,
    dates: '1679–1754',
    birth_city: 'Breslau',
    birth_country_modern: 'Poland',
    latitude: 51.1079,
    longitude: 17.0385,
    school_of_thought: 'Leibnizian Rationalism',
    school: 'Rationalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Systematic Leibnizian rationalism'],
    historical_weight: 0.55,
    // Christian Wolff: Systematized Leibniz; created German philosophical terminology (Enlightenment background).
    // High reason (+0.75): rigorous deductive method, systematized metaphysics/ethics/psychology.
    // Moderate reality (+0.6): inherited Leibnizian monadology's idealist tendencies. Accused of fatalism,
    // expelled from Prussia, later restored. Important for creating academic philosophy in Germany.
    // Kant's "dogmatic slumber" was in Wolffian rationalism. Moderate influence, less original than Leibniz.
    battles: { reason_faith: 0.75, reality_mysticism: 0.6, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.65, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },

  // ABOLITIONIST / CLASSICAL LIBERAL (4)
  {
    id: 'hugo_grotius',
    name: 'Hugo Grotius',
    birth_year: 1583,
    death_year: 1645,
    dates: '1583–1645',
    birth_city: 'Delft',
    birth_country_modern: 'Netherlands',
    latitude: 52.0116,
    longitude: 4.3571,
    school_of_thought: 'Natural Law',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Natural law foundation; law of nations; rights independent of theology'],
    historical_weight: 0.7,
    // Grotius: Father of international law; "De Jure Belli ac Pacis" (On the Law of War and Peace).
    // High reason (+0.8): natural law would hold "even if God did not exist" (etsi Deus non daretur) —
    // secularized natural law, made it independent of theology. High reality (+0.75): studied actual
    // practices of nations to derive principles. High individual (+0.8): natural rights prior to state.
    // High freedom (+0.8): limited just war theory, rights in wartime. Influenced Locke, Pufendorf.
    // Market (+0.5): defended property, freedom of seas (Mare Liberum). Pioneer of liberal internationalism.
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.8, freedom_coercion: 0.8, value_nihilism: 0.7, market_planning: 0.5, beauty_chaos: 0.5, good_evil: 0.75 }
  },
  {
    id: 'john_milton',
    name: 'John Milton',
    birth_year: 1608,
    death_year: 1674,
    dates: '1608–1674',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Classical Liberalism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Areopagitica; freedom of thought and press as absolute; individual conscience'],
    historical_weight: 0.7,
    // Milton: Poet and pamphleteer; "Areopagitica" is classic defense of freedom of the press.
    // High reason (+0.7): truth will prevail in free marketplace of ideas; "Let her and Falsehood grapple."
    // Moderate reality (+0.65): Protestant Christian, Paradise Lost; reason serves faith. Very high
    // individual (+0.85): individual conscience supreme. Very high freedom (+0.9): opposed censorship,
    // defended divorce, regicide (justified killing Charles I). Secretary to Cromwell's Commonwealth.
    // Market (+0.5): marketplace of ideas precedes economic marketplace analogy. High value (+0.7):
    // objective truth exists and will triumph. Influential on First Amendment tradition.
    battles: { reason_faith: 0.7, reality_mysticism: 0.65, individual_collective: 0.85, freedom_coercion: 0.9, value_nihilism: 0.7, market_planning: 0.5, beauty_chaos: 0.6, good_evil: 0.7 }
  },
  {
    id: 'algernon_sidney',
    name: 'Algernon Sidney',
    birth_year: 1623,
    death_year: 1683,
    dates: '1623–1683',
    birth_city: 'Penshurst',
    birth_country_modern: 'United Kingdom',
    latitude: 51.1833,
    longitude: 0.1833,
    school_of_thought: 'Republican Liberty',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Discourses Concerning Government; republican liberty; pre-Locke rights theory'],
    historical_weight: 0.65,
    // Algernon Sidney: Republican martyr; "Discourses Concerning Government" written against Filmer's
    // divine right of kings. High reason (+0.75): rational arguments for natural rights, consent of governed.
    // High reality (+0.7): historical examples. Very high individual (+0.85): liberty as natural condition.
    // Very high freedom (+0.9): resisted Stuart tyranny, executed for treason (his unpublished manuscript
    // used as evidence against him — "Every man is author of his own book"). Market (+0.5): property rights.
    // Influenced American founders; Jefferson called him one of the "elementary books of public right."
    battles: { reason_faith: 0.75, reality_mysticism: 0.7, individual_collective: 0.85, freedom_coercion: 0.9, value_nihilism: 0.7, market_planning: 0.5, beauty_chaos: 0.5, good_evil: 0.75 }
  },
  {
    id: 'isaac_newton',
    name: 'Isaac Newton',
    birth_year: 1642,
    death_year: 1727,
    dates: '1642–1727',
    birth_city: 'Woolsthorpe',
    birth_country_modern: 'United Kingdom',
    latitude: 52.8061,
    longitude: -0.6336,
    school_of_thought: 'Natural Philosophy',
    school: 'Naturalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Mathematical principles of natural philosophy; universal gravitation; scientific method'],
    historical_weight: 0.85,
    // Newton: Greatest scientist; Principia Mathematica unified terrestrial and celestial mechanics.
    // Very high reason (+0.85): rigorous mathematical physics, scientific method ("Hypotheses non fingo").
    // Very high reality (+0.9): discovered actual laws governing the physical universe. High value (+0.85):
    // knowledge of objective reality as supreme good. High beauty (+0.8): mathematical elegance reflects
    // cosmic order. Moderate individual/freedom (+0.6): focused on science, not political philosophy.
    // Also did alchemy, biblical chronology — but his scientific work is what matters. Newtonian physics
    // as paradigm of rational knowledge. "If I have seen further, it is by standing on shoulders of giants."
    battles: { reason_faith: 0.85, reality_mysticism: 0.9, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.85, market_planning: 0.5, beauty_chaos: 0.8, good_evil: 0.7 }
  },

  // MYSTICAL (1)
  {
    id: 'blaise_pascal',
    name: 'Blaise Pascal',
    birth_year: 1623,
    death_year: 1662,
    dates: '1623–1662',
    birth_city: 'Clermont-Ferrand',
    birth_country_modern: 'France',
    latitude: 45.7772,
    longitude: 3.0870,
    school_of_thought: 'Jansenism',
    school: 'Mystical',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Heart has reasons reason cannot know; the wager'],
    historical_weight: 0.6,
    // Pascal: "Heart has reasons reason cannot know" = anti-rationalist; faith over reason; wager is pragmatic not rational
    battles: { reason_faith: -0.6, reality_mysticism: -0.3, individual_collective: 0.3, freedom_coercion: 0.4, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.5 }
  },

  // COUNTER-ENLIGHTENMENT (1)
  {
    id: 'giambattista_vico',
    name: 'Giambattista Vico',
    birth_year: 1668,
    death_year: 1744,
    dates: '1668–1744',
    birth_city: 'Naples',
    birth_country_modern: 'Italy',
    latitude: 40.8518,
    longitude: 14.2681,
    school_of_thought: 'Historicism',
    school: 'Counter-Enlightenment',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Verum factum: we know only what we make — denies objective reality independent of human construction'],
    historical_weight: 0.6,
    // Vico: Historicism/constructivism - we know only what we make; anti-Cartesian; proto-relativist
    battles: { reason_faith: -0.4, reality_mysticism: -0.5, individual_collective: -0.2, freedom_coercion: 0.2, value_nihilism: 0.2, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.3 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 6: ENLIGHTENMENT (1687–1804) - 18 philosophers
  // ═══════════════════════════════════════════════════════════

  // ENLIGHTENMENT (6)
  {
    id: 'montesquieu',
    name: 'Montesquieu',
    birth_year: 1689,
    death_year: 1755,
    dates: '1689–1755',
    birth_city: 'La Brède',
    birth_country_modern: 'France',
    latitude: 44.6833,
    longitude: -0.5333,
    school_of_thought: 'Political Philosophy',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Rational analysis of laws; separation of powers'],
    historical_weight: 0.85,
    // Montesquieu: "The Spirit of the Laws" — comparative study of governments, separation of powers.
    // High reason (+0.8): empirical study of political systems across cultures. High reality (+0.75):
    // examined actual institutions. High freedom (+0.85): separation of powers prevents tyranny.
    // Individual (+0.7): liberty requires limited government but not radically individualist.
    // Major influence on American Constitution. Market (+0.5): commerce promotes peace (doux commerce).
    // Some climate determinism (geography shapes political institutions) — proto-sociology.
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.7, freedom_coercion: 0.85, value_nihilism: 0.7, market_planning: 0.5, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'voltaire',
    name: 'Voltaire',
    birth_year: 1694,
    death_year: 1778,
    dates: '1694–1778',
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Enlightenment',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Reason vs. superstition, tyranny, and fanaticism'],
    historical_weight: 1.0,
    // Voltaire: Champion of Enlightenment; "Écrasez l'infâme!" (Crush the infamous thing — superstition/fanaticism).
    // Near-perfect reason (+0.95): relentless critic of religious intolerance, superstition, tyranny.
    // High reality (+0.8): empiricist influenced by Newton, Locke. Very high individual (+0.8): defended
    // religious tolerance, free speech. Very high freedom (+0.9): satirized censorship, absolutism.
    // Market (+0.6): commerce civilizes, creates interdependence. Moderate value (+0.7): utilitarian
    // tendencies. Moderate good_evil (+0.6): moral universalism but not systematic ethical theory.
    // "I disapprove of what you say, but I will defend to the death your right to say it."
    battles: { reason_faith: 0.95, reality_mysticism: 0.8, individual_collective: 0.8, freedom_coercion: 0.9, value_nihilism: 0.7, market_planning: 0.6, beauty_chaos: 0.7, good_evil: 0.6 }
  },
  {
    id: 'diderot',
    name: 'Diderot',
    birth_year: 1713,
    death_year: 1784,
    dates: '1713–1784',
    birth_city: 'Langres',
    birth_country_modern: 'France',
    latitude: 47.8633,
    longitude: 5.3336,
    school_of_thought: 'Materialism / Encyclopedism',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Encyclopédie; materialism; human knowledge catalogued'],
    historical_weight: 0.75,
    // Diderot: Chief editor of the Encyclopédie — 28 volumes cataloging human knowledge for progress.
    // Very high reason (+0.9): systematic organization of knowledge, attack on ignorance/superstition.
    // Very high reality (+0.85): materialist, atheist ("Man will never be free until the last king is
    // strangled with the entrails of the last priest"). Individual (+0.6): collective project for human
    // improvement. Freedom (+0.7): censorship battles; published underground. Novel "Jacques the Fatalist"
    // explores determinism. Art critic, playwright. Central figure of French Enlightenment.
    battles: { reason_faith: 0.9, reality_mysticism: 0.85, individual_collective: 0.6, freedom_coercion: 0.7, value_nihilism: 0.7, market_planning: 0.5, beauty_chaos: 0.6, good_evil: 0.6 }
  },
  {
    id: 'adam_smith',
    name: 'Adam Smith',
    birth_year: 1723,
    death_year: 1790,
    dates: '1723–1790',
    birth_city: 'Kirkcaldy',
    birth_country_modern: 'United Kingdom',
    latitude: 56.1118,
    longitude: -3.1596,
    school_of_thought: 'Classical Economics',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Rational self-interest; invisible hand; moral sentiments'],
    historical_weight: 0.85,
    // Adam Smith: Father of economics; "Wealth of Nations" and "Theory of Moral Sentiments."
    // High reason (+0.8): systematic analysis of economic behavior. High reality (+0.8): observed actual
    // market processes. Very high market (+0.9): invisible hand, division of labor, free trade benefits all.
    // "It is not from the benevolence of the butcher... that we expect our dinner, but from their regard
    // to their own interest." High individual (+0.8): self-interest channeled by markets produces social good.
    // High value (+0.8): rational self-interest is NOT greed; also wrote on sympathy, virtue.
    // NOT laissez-faire absolutist: allowed some government roles (defense, justice, public works).
    battles: { reason_faith: 0.8, reality_mysticism: 0.8, individual_collective: 0.8, freedom_coercion: 0.8, value_nihilism: 0.8, market_planning: 0.9, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'lessing',
    name: 'G. E. Lessing',
    birth_year: 1729,
    death_year: 1781,
    dates: '1729–1781',
    birth_city: 'Kamenz',
    birth_country_modern: 'Germany',
    latitude: 51.2689,
    longitude: 14.0936,
    school_of_thought: 'Enlightenment',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Rational theology; toleration; education of humanity'],
    historical_weight: 0.6,
    // Lessing: German Enlightenment dramatist and critic; "Nathan the Wise" promoted religious tolerance.
    // High reason (+0.8): applied rational criticism to religion, literature. Ring parable: truth of
    // religions judged by moral fruits, not revelation. Moderate reality (+0.7): rational theology but
    // still theistic. Freedom (+0.7): religious tolerance, free inquiry. High beauty (+0.7): aesthetic
    // theory (Laocoon on painting vs. poetry). Education of the Human Race: progress through stages of
    // religious development toward rational ethics. Friend of Moses Mendelssohn. German Voltaire.
    battles: { reason_faith: 0.8, reality_mysticism: 0.7, individual_collective: 0.6, freedom_coercion: 0.7, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.7, good_evil: 0.7 }
  },
  {
    id: 'condorcet',
    name: 'Condorcet',
    birth_year: 1743,
    death_year: 1794,
    dates: '1743–1794',
    birth_city: 'Ribemont',
    birth_country_modern: 'France',
    latitude: 49.7972,
    longitude: 3.4661,
    school_of_thought: 'Enlightenment',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Indefinite human progress through reason and science'],
    historical_weight: 0.6,
    // Condorcet: Mathematician, philosopher of progress; "Sketch for a Historical Picture of the Progress
    // of the Human Mind." Very high reason (+0.9): science and reason will improve humanity indefinitely.
    // Very high reality (+0.85): empirical optimism about human nature. High value (+0.8): progress is real
    // and measurable. Supported American and French Revolutions; opposed slavery, death penalty, defended
    // women's rights. Died during Terror (hiding while writing his optimistic masterwork). Influenced
    // by Turgot, influenced Comte, Mill. Individual (+0.6): progress is collective but through rational
    // individuals. Voting theory (Condorcet paradox) anticipates social choice theory.
    battles: { reason_faith: 0.9, reality_mysticism: 0.85, individual_collective: 0.6, freedom_coercion: 0.7, value_nihilism: 0.8, market_planning: 0.5, beauty_chaos: 0.5, good_evil: 0.7 }
  },

  // AMERICAN ENLIGHTENMENT (4)
  {
    id: 'john_adams',
    name: 'John Adams',
    birth_year: 1735,
    death_year: 1826,
    dates: '1735–1826',
    birth_city: 'Braintree',
    birth_country_modern: 'United States',
    latitude: 42.2529,
    longitude: -71.0023,
    school_of_thought: 'Republican Political Philosophy',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Mixed government; balance of powers; republican virtue'],
    historical_weight: 0.7,
    // John Adams: 2nd President; "Defence of the Constitutions of the United States."
    // High reason (+0.75): studied political philosophy systematically; mixed constitution theory.
    // High reality (+0.7): realistic about human nature (ambition must counteract ambition).
    // High freedom (+0.85): independence leader, but also signed Alien and Sedition Acts (tension).
    // Individual (+0.75): rights are real but virtue is necessary for republic. Market (+0.6): defended
    // property rights but skeptical of pure commerce. Good_evil (+0.75): believed in moral order.
    // More conservative than Jefferson; worried about democracy without checks.
    battles: { reason_faith: 0.75, reality_mysticism: 0.7, individual_collective: 0.75, freedom_coercion: 0.85, value_nihilism: 0.7, market_planning: 0.6, beauty_chaos: 0.5, good_evil: 0.75 }
  },
  {
    id: 'thomas_paine',
    name: 'Thomas Paine',
    birth_year: 1737,
    death_year: 1809,
    dates: '1737–1809',
    birth_city: 'Thetford',
    birth_country_modern: 'United Kingdom',
    latitude: 52.4176,
    longitude: 0.7445,
    school_of_thought: 'Radical Enlightenment',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Natural rights; popular sovereignty; anti-monarchy; "Common Sense"'],
    historical_weight: 0.85,
    // Thomas Paine: Revolutionary pamphleteer; "Common Sense" sparked American Revolution.
    // Very high reason (+0.9): clear, forceful arguments accessible to common people. High reality (+0.8):
    // practical focus on political arrangements. Very high individual (+0.85): "These are the times that
    // try men's souls." Near-perfect freedom (+0.95): attacked hereditary monarchy, aristocracy, established
    // religion. "Rights of Man" defended French Revolution. High market (+0.7): agrarian justice, progressive
    // taxation but defended commerce. High good_evil (+0.8): moral clarity about tyranny.
    // "The Age of Reason" attacked organized religion — deist. Died poor, marginalized for radicalism.
    battles: { reason_faith: 0.9, reality_mysticism: 0.8, individual_collective: 0.85, freedom_coercion: 0.95, value_nihilism: 0.75, market_planning: 0.7, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'thomas_jefferson',
    name: 'Thomas Jefferson',
    birth_year: 1743,
    death_year: 1826,
    dates: '1743–1826',
    birth_city: 'Shadwell',
    birth_country_modern: 'United States',
    latitude: 37.9883,
    longitude: -78.4536,
    school_of_thought: 'Natural Rights Philosophy',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Natural rights; "life, liberty, pursuit of happiness"; separation of church and state'],
    historical_weight: 1.0,
    // Thomas Jefferson: Principal author of Declaration of Independence; 3rd President.
    // Very high reason (+0.85): enlightenment rationalist; Virginia Statute for Religious Freedom.
    // High reality (+0.8): empiricist, scientist (Notes on Virginia). Very high individual (+0.9):
    // "We hold these truths to be self-evident, that all men are created equal, that they are endowed
    // by their Creator with certain unalienable Rights." Near-perfect freedom (+0.95): limited government,
    // religious liberty, free press. High market (+0.75): agrarian republic but defended commerce.
    // High value (+0.8): pursued happiness as rational self-fulfillment. Slavery contradiction haunts legacy.
    // "I have sworn upon the altar of God eternal hostility against every form of tyranny over the mind of man."
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.9, freedom_coercion: 0.95, value_nihilism: 0.8, market_planning: 0.75, beauty_chaos: 0.6, good_evil: 0.8 }
  },
  {
    id: 'james_madison',
    name: 'James Madison',
    birth_year: 1751,
    death_year: 1836,
    dates: '1751–1836',
    birth_city: 'Port Conway',
    birth_country_modern: 'United States',
    latitude: 38.3,
    longitude: -77.3,
    school_of_thought: 'Constitutional Theory',
    school: 'Enlightenment',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Federalism; checks and balances; faction theory; Bill of Rights'],
    historical_weight: 0.85,
    // James Madison: "Father of the Constitution"; 4th President; Federalist Papers author.
    // High reason (+0.8): systematic political science (Federalist #10 on faction, #51 on separation of powers).
    // High reality (+0.75): realistic about human nature and interest-group politics. Very high individual
    // (+0.85): Bill of Rights protects individuals from majority tyranny. Very high freedom (+0.9):
    // designed institutions to limit government power. High market (+0.7): defended property, commerce.
    // "If men were angels, no government would be necessary." Brilliant constitutional engineer.
    // Tension: initially opposed Bill of Rights as unnecessary, then championed it.
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.85, freedom_coercion: 0.9, value_nihilism: 0.75, market_planning: 0.7, beauty_chaos: 0.5, good_evil: 0.75 }
  },

  // ABOLITIONIST / CLASSICAL LIBERAL (2)
  {
    id: 'mary_wollstonecraft',
    name: 'Mary Wollstonecraft',
    birth_year: 1759,
    death_year: 1797,
    dates: '1759–1797',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Classical Liberalism / Feminism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['A Vindication of the Rights of Woman; reason has no sex; equality through education'],
    historical_weight: 0.75,
    // Mary Wollstonecraft: Pioneer feminist philosopher; "Vindication of the Rights of Woman."
    // Very high reason (+0.85): argued women's apparent inferiority is due to lack of education, not nature.
    // "I do not wish them to have power over men; but over themselves." High reality (+0.8): empirical
    // observation of women's condition. Very high individual (+0.9): "Mind has no sex" — women deserve same
    // rational education as men. Very high freedom (+0.9): opposed tyranny in marriage and politics.
    // Applied Enlightenment principles consistently (unlike those who excluded women). Died in childbirth
    // (daughter Mary Shelley wrote Frankenstein). Attacked by Burke, vindicated by history.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.75, market_planning: 0.6, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'wilhelm_von_humboldt',
    name: 'Wilhelm von Humboldt',
    birth_year: 1767,
    death_year: 1835,
    dates: '1767–1835',
    birth_city: 'Potsdam',
    birth_country_modern: 'Germany',
    latitude: 52.3906,
    longitude: 13.0645,
    school_of_thought: 'Classical Liberalism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The Limits of State Action; individual development as the highest end; minimal government'],
    historical_weight: 0.7,
    // Wilhelm von Humboldt: Liberal political theorist; "The Limits of State Action" (influenced J.S. Mill).
    // High reason (+0.8): systematic argument for limited government. High reality (+0.75): Prussian
    // educational reformer (founded Berlin University). Very high individual (+0.9): "Bildung" — self-cultivation
    // as highest human purpose; state must protect but not direct individual development. Very high freedom
    // (+0.9): minimalist state; only legitimate function is protecting rights. High market (+0.7): freedom
    // includes economic liberty. "The highest and most harmonious development of his powers to a complete
    // and consistent whole." Proto-Objectivist emphasis on individual flourishing.
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.75, market_planning: 0.7, beauty_chaos: 0.6, good_evil: 0.75 }
  },

  // EMPIRICIST (1)
  {
    id: 'david_hume',
    name: 'David Hume',
    birth_year: 1711,
    death_year: 1776,
    dates: '1711–1776',
    birth_city: 'Edinburgh',
    birth_country_modern: 'United Kingdom',
    latitude: 55.9533,
    longitude: -3.1883,
    school_of_thought: 'Empiricism / Skepticism',
    school: 'Empiricist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Causation is habit not necessity; induction unjustifiable — destroys the rational foundations of science'],
    historical_weight: 0.85,
    // Hume: Skeptic about causation, induction, self, morality; "reason is slave of passions"; undermined rational foundations
    battles: { reason_faith: -0.6, reality_mysticism: -0.4, individual_collective: 0.4, freedom_coercion: 0.5, value_nihilism: -0.3, market_planning: 0.4, beauty_chaos: 0.4, good_evil: -0.2 }
  },

  // COUNTER-ENLIGHTENMENT (5)
  {
    id: 'rousseau',
    name: 'J.-J. Rousseau',
    birth_year: 1712,
    death_year: 1778,
    dates: '1712–1778',
    birth_city: 'Geneva',
    birth_country_modern: 'Switzerland',
    latitude: 46.2044,
    longitude: 6.1432,
    school_of_thought: 'Social Contract / Romanticism',
    school: 'Counter-Enlightenment',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Nature and sentiment over civilization and reason'],
    historical_weight: 0.7,
    // Rousseau: Already correct - anti-reason, collectivist (general will), anti-civilization
    battles: { reason_faith: -0.6, reality_mysticism: -0.5, individual_collective: -0.8, freedom_coercion: -0.6, value_nihilism: 0.2, market_planning: -0.6, beauty_chaos: 0.4, good_evil: 0.2 }
  },
  {
    id: 'edmund_burke',
    name: 'Edmund Burke',
    birth_year: 1729,
    death_year: 1797,
    dates: '1729–1797',
    birth_city: 'Dublin',
    birth_country_modern: 'Ireland',
    latitude: 53.3498,
    longitude: -6.2603,
    school_of_thought: 'Conservatism',
    school: 'Counter-Enlightenment',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Tradition and prejudice over abstract rationalism'],
    historical_weight: 0.7,
    // Burke: Tradition/prejudice over reason; anti-rationalist; but defended property rights and some liberty
    battles: { reason_faith: -0.4, reality_mysticism: -0.2, individual_collective: 0.1, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: 0.4, beauty_chaos: 0.5, good_evil: 0.5 }
  },
  {
    id: 'hamann',
    name: 'J. G. Hamann',
    birth_year: 1730,
    death_year: 1788,
    dates: '1730–1788',
    birth_city: 'Königsberg',
    birth_country_modern: 'Russia',
    latitude: 54.7104,
    longitude: 20.4522,
    school_of_thought: 'Counter-Enlightenment',
    school: 'Counter-Enlightenment',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Faith and language over Enlightenment reason'],
    historical_weight: 0.5,
    // Hamann: "Magus of the North"; faith and feeling over reason; attacked Enlightenment rationalism
    battles: { reason_faith: -0.8, reality_mysticism: -0.5, individual_collective: 0.1, freedom_coercion: 0.2, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.3 }
  },
  {
    id: 'jacobi',
    name: 'F. H. Jacobi',
    birth_year: 1743,
    death_year: 1819,
    dates: '1743–1819',
    birth_city: 'Düsseldorf',
    birth_country_modern: 'Germany',
    latitude: 51.2277,
    longitude: 6.7735,
    school_of_thought: 'Glaubensphilosophie',
    school: 'Counter-Enlightenment',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Leap of faith; Glaubensphilosophie against Spinoza'],
    historical_weight: 0.5,
    // Jacobi: Salto mortale (leap of faith); reason leads to nihilism, only faith saves
    battles: { reason_faith: -0.7, reality_mysticism: -0.4, individual_collective: 0.2, freedom_coercion: 0.3, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.4 }
  },
  {
    id: 'herder',
    name: 'J. G. Herder',
    birth_year: 1744,
    death_year: 1803,
    dates: '1744–1803',
    birth_city: 'Mohrungen',
    birth_country_modern: 'Poland',
    latitude: 53.9167,
    longitude: 19.9333,
    school_of_thought: 'Counter-Enlightenment',
    school: 'Counter-Enlightenment',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Cultural particularity; Volksgeist over universal reason'],
    historical_weight: 1.0,
    // Herder: Volksgeist (folk spirit); cultural relativism; collective identity over individual/universal reason
    battles: { reason_faith: -0.5, reality_mysticism: -0.4, individual_collective: -0.6, freedom_coercion: 0.1, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.3 }
  },

  // GERMAN IDEALISM (1)
  {
    id: 'immanuel_kant',
    name: 'Immanuel Kant',
    birth_year: 1724,
    death_year: 1804,
    dates: '1724–1804',
    birth_city: 'Königsberg',
    birth_country_modern: 'Russia',
    latitude: 54.7104,
    longitude: 20.4522,
    school_of_thought: 'Transcendental Idealism',
    school: 'German Idealism',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Thing-in-itself unknowable; reason bounded; duty-ethics divorced from reality — arch-enemy of Objectivism'],
    historical_weight: 1.0,
    // Kant: DESTROYED reason in CPR; noumenal reality unknowable; duty divorced from happiness; categorical imperative = self-sacrifice
    battles: { reason_faith: -0.7, reality_mysticism: -0.8, individual_collective: -0.3, freedom_coercion: 0.1, value_nihilism: 0.2, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.3 }
  },

  // UTILITARIAN (1)
  {
    id: 'jeremy_bentham',
    name: 'Jeremy Bentham',
    birth_year: 1748,
    death_year: 1832,
    dates: '1748–1832',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Utilitarianism',
    school: 'Utilitarian',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Felicific calculus: aggregate utility can override individual rights — collectivism in rational disguise'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.7, reality_mysticism: 0.7, individual_collective: -0.3, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: 0.2, beauty_chaos: 0.3, good_evil: 0.4 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 7: 19TH CENTURY (1770–1900) - 18 philosophers
  // ═══════════════════════════════════════════════════════════

  // COUNTER-ENLIGHTENMENT (1)
  {
    id: 'de_maistre',
    name: 'J. de Maistre',
    birth_year: 1753,
    death_year: 1821,
    dates: '1753–1821',
    birth_city: 'Chambéry',
    birth_country_modern: 'France',
    latitude: 45.5646,
    longitude: 5.9178,
    school_of_thought: 'Reactionary Conservatism',
    school: 'Counter-Enlightenment',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Theocratic authority and tradition over rationalism'],
    historical_weight: 0.55,
    // de Maistre: Theocracy; divine authority; anti-reason; anti-individual; praised executioner; counter-revolutionary
    battles: { reason_faith: -0.7, reality_mysticism: -0.5, individual_collective: -0.6, freedom_coercion: -0.5, value_nihilism: 0.4, market_planning: -0.3, beauty_chaos: 0.4, good_evil: 0.4 }
  },

  // GERMAN IDEALISM (4)
  {
    id: 'schiller',
    name: 'Friedrich Schiller',
    birth_year: 1759,
    death_year: 1805,
    dates: '1759–1805',
    birth_city: 'Marbach am Neckar',
    birth_country_modern: 'Germany',
    latitude: 48.9372,
    longitude: 9.2586,
    school_of_thought: 'German Idealism / Aesthetics',
    school: 'German Idealism',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ["Aesthetic education; play-drive dissolves rational-natural divide; Kant's heir in aesthetics"],
    historical_weight: 0.6,
    // Schiller: Kant's aesthetics developed; play-drive synthesis; less destructive than other idealists
    battles: { reason_faith: 0.1, reality_mysticism: -0.2, individual_collective: 0.2, freedom_coercion: 0.4, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.7, good_evil: 0.4 }
  },
  {
    id: 'fichte',
    name: 'J. G. Fichte',
    birth_year: 1762,
    death_year: 1814,
    dates: '1762–1814',
    birth_city: 'Rammenau',
    birth_country_modern: 'Germany',
    latitude: 51.1528,
    longitude: 14.1278,
    school_of_thought: 'German Idealism',
    school: 'German Idealism',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Absolute Ego as primary; collapses objective reality into subject'],
    historical_weight: 0.65,
    // Fichte: Subjective idealism; Ego creates Non-Ego; no objective reality; German nationalism
    battles: { reason_faith: -0.4, reality_mysticism: -0.7, individual_collective: -0.5, freedom_coercion: 0.0, value_nihilism: 0.2, market_planning: -0.2, beauty_chaos: 0.3, good_evil: 0.2 }
  },
  {
    id: 'hegel',
    name: 'G. W. F. Hegel',
    birth_year: 1770,
    death_year: 1831,
    dates: '1770–1831',
    birth_city: 'Stuttgart',
    birth_country_modern: 'Germany',
    latitude: 48.7758,
    longitude: 9.1829,
    school_of_thought: 'Absolute Idealism',
    school: 'German Idealism',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Dialectical Spirit; individual dissolved into collective History; root of totalitarianism'],
    historical_weight: 0.85,
    // Hegel: Dialectical "reason" is mysticism disguised; Absolute Spirit = mystical; individual = nothing; state worship
    battles: { reason_faith: -0.6, reality_mysticism: -0.9, individual_collective: -0.9, freedom_coercion: -0.8, value_nihilism: 0.1, market_planning: -0.5, beauty_chaos: 0.4, good_evil: 0.0 }
  },
  {
    id: 'schelling',
    name: 'F. W. J. Schelling',
    birth_year: 1775,
    death_year: 1854,
    dates: '1775–1854',
    birth_city: 'Leonberg',
    birth_country_modern: 'Germany',
    latitude: 48.8000,
    longitude: 9.0167,
    school_of_thought: 'German Idealism',
    school: 'German Idealism',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Nature philosophy; subject-object identity; late mysticism'],
    historical_weight: 0.6,
    // Schelling: Nature philosophy; subject-object identity = anti-realism; late period explicit mysticism
    battles: { reason_faith: -0.4, reality_mysticism: -0.6, individual_collective: 0.0, freedom_coercion: 0.2, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.3 }
  },

  // POSITIVIST (2)
  {
    id: 'auguste_comte',
    name: 'Auguste Comte',
    birth_year: 1798,
    death_year: 1857,
    dates: '1798–1857',
    birth_city: 'Montpellier',
    birth_country_modern: 'France',
    latitude: 43.6108,
    longitude: 3.8767,
    school_of_thought: 'Positivism',
    school: 'Positivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Three stages; science replaces theology and metaphysics'],
    historical_weight: 1.0,
    // Auguste Comte: Founder of positivism and sociology; "Law of Three Stages" (theological → metaphysical → positive/scientific).
    // Very high reason (+0.9): science as supreme knowledge; rejected metaphysics. Very high reality (+0.9):
    // empirical social science. BUT: collectivist individual (-0.3) — designed "Religion of Humanity" with
    // scientists as priests; technocratic social engineering. Neutral freedom (0.0): not libertarian, envisioned
    // expert management of society. Market (-0.2): suspicious of capitalism's disorder. Good_evil (+0.4):
    // ethics from social science, somewhat relativistic. Pro-science but anti-individual-liberty.
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: -0.3, freedom_coercion: 0.0, value_nihilism: 0.5, market_planning: -0.2, beauty_chaos: 0.3, good_evil: 0.4 }
  },
  {
    id: 'herbert_spencer',
    name: 'Herbert Spencer',
    birth_year: 1820,
    death_year: 1903,
    dates: '1820–1903',
    birth_city: 'Derby',
    birth_country_modern: 'United Kingdom',
    latitude: 52.9225,
    longitude: -1.4746,
    school_of_thought: 'Social Darwinism',
    school: 'Positivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Synthetic philosophy; social evolution; scientism'],
    historical_weight: 0.6,
    // Herbert Spencer: Evolutionary philosopher; coined "survival of the fittest" (before Darwin applied it to biology).
    // High reason (+0.8): systematic philosophy based on evolution. High reality (+0.8): naturalistic worldview.
    // Moderate individual (+0.6): defended laissez-faire, but social evolution could justify hierarchy.
    // Moderate freedom (+0.6): opposed state intervention but also militarism. Market (+0.6): pro-capitalism
    // as natural evolutionary outcome. Low good_evil (+0.5): evolutionary ethics problematic — is ≠ ought.
    // "Social Darwinism" (often misattributed) used to justify inequality. Progressive evolution assumed.
    // Influenced libertarians but also criticized for biologizing politics.
    battles: { reason_faith: 0.8, reality_mysticism: 0.8, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.6, market_planning: 0.6, beauty_chaos: 0.4, good_evil: 0.5 }
  },

  // ABOLITIONIST / CLASSICAL LIBERAL (4)
  {
    id: 'frederic_bastiat',
    name: 'Frédéric Bastiat',
    birth_year: 1801,
    death_year: 1850,
    dates: '1801–1850',
    birth_city: 'Bayonne',
    birth_country_modern: 'France',
    latitude: 43.4929,
    longitude: -1.4748,
    school_of_thought: 'Classical Liberalism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['The Law; property rights; the state as legal plunder; broken window fallacy'],
    historical_weight: 1.0,
    // Bastiat: French classical liberal economist; brilliant polemicist for free markets.
    // Very high reason (+0.85): clear, witty arguments (broken window fallacy, petition of candlemakers).
    // High reality (+0.8): observed actual economic effects. Near-perfect individual (+0.95): natural rights,
    // self-ownership. Near-perfect freedom (+0.95): "The Law" — state exists only to protect life, liberty,
    // property; everything else is "legal plunder." Near-perfect market (+0.95): free trade, laissez-faire.
    // High good_evil (+0.85): moral clarity about coercion vs. voluntary exchange.
    // "The state is that great fiction by which everyone tries to live at the expense of everyone else."
    // Proto-Objectivist in many ways; died young (49) during his most productive period.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.8, market_planning: 0.95, beauty_chaos: 0.5, good_evil: 0.85 }
  },
  {
    id: 'alexis_de_tocqueville',
    name: 'Alexis de Tocqueville',
    birth_year: 1805,
    death_year: 1859,
    dates: '1805–1859',
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Classical Liberalism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Democracy in America; liberty over equality; tyranny of the majority; civic virtue'],
    historical_weight: 0.85,
    // Tocqueville: French political theorist; "Democracy in America" analyzed American republic.
    // High reason (+0.75): systematic observation and analysis. High reality (+0.7): empirical study of
    // actual institutions and mores. Very high individual (+0.85): warned against "soft despotism" where
    // people trade liberty for security. Very high freedom (+0.85): "tyranny of the majority" threatens
    // individual rights. High market (+0.7): commerce supports liberty but materialism threatens virtue.
    // Individual liberty more important than equality; voluntary associations essential.
    // "The American Republic will endure until the day Congress discovers that it can bribe the public
    // with the public's money." Prescient about democratic dangers.
    battles: { reason_faith: 0.75, reality_mysticism: 0.7, individual_collective: 0.85, freedom_coercion: 0.85, value_nihilism: 0.75, market_planning: 0.7, beauty_chaos: 0.5, good_evil: 0.75 }
  },
  {
    id: 'frederick_douglass',
    name: 'Frederick Douglass',
    birth_year: 1818,
    death_year: 1895,
    dates: '1818–1895',
    birth_city: 'Talbot County',
    birth_country_modern: 'United States',
    latitude: 38.7762,
    longitude: -76.1723,
    school_of_thought: 'Natural Rights Abolitionism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Natural rights to demolish slavery; reason as liberation; self-ownership'],
    historical_weight: 1.0,
    // Frederick Douglass: Escaped slave, abolitionist leader, orator, writer; greatest American of 19th century.
    // Very high reason (+0.9): used argument, evidence, eloquence to demolish slavery apologetics.
    // Very high reality (+0.85): direct witness to slavery's evil. Near-perfect individual (+0.95):
    // "I am a man, and entitled to all the rights of a man." Self-ownership is foundational.
    // Near-perfect freedom (+0.95): abolition, equal rights, Constitution properly interpreted guarantees liberty.
    // Very high good_evil (+0.9): moral clarity — slavery is simply evil, no compromise.
    // "I would unite with anybody to do right and with nobody to do wrong." Applied Enlightenment
    // principles consistently; refuted claims that blacks were less than human.
    battles: { reason_faith: 0.9, reality_mysticism: 0.85, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.85, market_planning: 0.7, beauty_chaos: 0.5, good_evil: 0.9 }
  },
  {
    id: 'lord_acton',
    name: 'Lord Acton',
    birth_year: 1834,
    death_year: 1902,
    dates: '1834–1902',
    birth_city: 'Naples',
    birth_country_modern: 'Italy',
    latitude: 40.8518,
    longitude: 14.2681,
    school_of_thought: 'Classical Liberalism',
    school: 'Abolitionist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Power corrupts absolutely; liberty as the supreme political value; conscience over authority'],
    historical_weight: 1.0,
    // Lord Acton: Catholic historian and liberal; "Power tends to corrupt, and absolute power corrupts absolutely."
    // High reason (+0.8): historical analysis of power and liberty. High reality (+0.75): studied actual
    // political history. Very high individual (+0.9): individual conscience over institutional authority.
    // Near-perfect freedom (+0.95): liberty as the supreme political value throughout history.
    // "The most certain test by which we judge whether a country is really free is the amount of security
    // enjoyed by minorities." Catholic but applied natural law reasoning to politics. Influenced Hayek.
    // Never completed his planned History of Liberty but left brilliant essays and letters.
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.9, freedom_coercion: 0.95, value_nihilism: 0.8, market_planning: 0.7, beauty_chaos: 0.5, good_evil: 0.85 }
  },

  // TRANSCENDENTALIST (2)
  {
    id: 'ralph_waldo_emerson',
    name: 'Ralph Waldo Emerson',
    birth_year: 1803,
    death_year: 1882,
    dates: '1803–1882',
    birth_city: 'Boston',
    birth_country_modern: 'United States',
    latitude: 42.3601,
    longitude: -71.0589,
    school_of_thought: 'Transcendentalism',
    school: 'Transcendentalist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Over-Soul; intuition over reason; nature mysticism; self-reliance'],
    historical_weight: 1.0,
    // Emerson: Leader of American Transcendentalism; "Self-Reliance" celebrates individual, but...
    // Low reason (+0.3): "intuition" and "Over-Soul" over discursive reason; anti-systematic.
    // Low reality (+0.2): mystical — ultimate reality is spiritual, not material. Very high individual (+0.8):
    // "Self-Reliance" — trust yourself, nonconformity, inner voice. High freedom (+0.7): opposed slavery,
    // conformity. High beauty (+0.7): nature as source of truth and beauty. "Trust thyself" sounds
    // individualist but grounded in mystical unity with Over-Soul, not rational self-interest.
    // Influenced Thoreau, Whitman. American optimism combined with Eastern mysticism.
    battles: { reason_faith: 0.3, reality_mysticism: 0.2, individual_collective: 0.8, freedom_coercion: 0.7, value_nihilism: 0.6, market_planning: 0.5, beauty_chaos: 0.7, good_evil: 0.6 }
  },
  {
    id: 'henry_david_thoreau',
    name: 'Henry David Thoreau',
    birth_year: 1817,
    death_year: 1862,
    dates: '1817–1862',
    birth_city: 'Concord',
    birth_country_modern: 'United States',
    latitude: 42.4604,
    longitude: -71.3489,
    school_of_thought: 'Transcendentalism',
    school: 'Transcendentalist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Civil Disobedience; mystical individualism; simplicity; conscience over law'],
    historical_weight: 0.75,
    // Thoreau: "Civil Disobedience" and "Walden"; passive resistance to unjust laws.
    // Low reason (+0.4): mystical individualism, intuition over systematic thought. Low reality (+0.3):
    // Transcendentalist nature mysticism. Very high individual (+0.9): "That government is best which
    // governs least" — anarchist tendencies. Very high freedom (+0.85): refused to pay poll tax for
    // Mexican War, went to jail. Market (+0.5): "simplify, simplify" — skeptical of commerce, consumerism.
    // High beauty (+0.7): nature writing. Good_evil (+0.65): moral clarity about slavery but grounded
    // in conscience/intuition rather than objective ethics. Influenced Gandhi, MLK.
    battles: { reason_faith: 0.4, reality_mysticism: 0.3, individual_collective: 0.9, freedom_coercion: 0.85, value_nihilism: 0.6, market_planning: 0.5, beauty_chaos: 0.7, good_evil: 0.65 }
  },

  // EGOIST (1)
  {
    id: 'max_stirner',
    name: 'Max Stirner',
    birth_year: 1806,
    death_year: 1856,
    dates: '1806–1856',
    birth_city: 'Bayreuth',
    birth_country_modern: 'Germany',
    latitude: 49.9456,
    longitude: 11.5713,
    school_of_thought: 'Egoism',
    school: 'Egoist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['The Ego and Its Own; all abstractions are spooks; pure egoism; the unique one'],
    historical_weight: 1.0,
    // Stirner: Radical egoist; "The Ego and Its Own" — all ideals (God, State, Humanity, Morality) are "spooks."
    // Moderate reason (+0.5): uses argument but rejects all concepts as enslaving. Moderate reality (+0.5):
    // nominalist — only individuals exist, abstractions are illusions. PERFECT individual (+1.0): the "Unique One"
    // is beyond all categories, owes allegiance to nothing. High freedom (+0.8): anti-state, anti-authority.
    // Low value (+0.2): rejects all values as spooks constraining the ego. Low good_evil (+0.3): moral nihilism —
    // no objective right/wrong, only my will. Influenced Nietzsche (who denied it), anarchists.
    // Critiqued by Marx in "German Ideology." NOT Objectivist: rejects objective morality, rational self-interest
    // involves objective values. Stirner's ego is mere will, not rational agent.
    battles: { reason_faith: 0.5, reality_mysticism: 0.5, individual_collective: 1.0, freedom_coercion: 0.8, value_nihilism: 0.2, market_planning: 0.5, beauty_chaos: 0.4, good_evil: 0.3 }
  },

  // VOLUNTARYIST (2)
  {
    id: 'lysander_spooner',
    name: 'Lysander Spooner',
    birth_year: 1808,
    death_year: 1887,
    dates: '1808–1887',
    birth_city: 'Athol',
    birth_country_modern: 'United States',
    latitude: 42.5959,
    longitude: -72.2265,
    school_of_thought: 'Voluntaryism',
    school: 'Voluntaryist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['No Treason; natural rights; Constitution has no authority; individual over state'],
    historical_weight: 0.7,
    // Lysander Spooner: American anarchist, abolitionist, legal theorist; "No Treason: The Constitution of No Authority."
    // High reason (+0.8): rigorous legal/philosophical arguments. High reality (+0.75): applied natural law to
    // actual institutions. Near-perfect individual (+0.95): self-ownership, Constitution never consented to.
    // Near-perfect freedom (+0.95): all taxation is theft, all government is illegitimate without individual consent.
    // High market (+0.8): private postal service (competed with government), free banking. High good_evil (+0.8):
    // slavery is simply wrong, contracts require actual consent. Influenced both left and right anarchists.
    // "If the majority can impose their will on the minority, there is no such thing as individual rights."
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.75, market_planning: 0.8, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'auberon_herbert',
    name: 'Auberon Herbert',
    birth_year: 1838,
    death_year: 1906,
    dates: '1838–1906',
    birth_city: 'Highclere',
    birth_country_modern: 'United Kingdom',
    latitude: 51.3333,
    longitude: -1.3833,
    school_of_thought: 'Voluntaryism',
    school: 'Voluntaryist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Voluntary taxation; no coercion ever justified; individual sovereignty; the true liberty'],
    historical_weight: 1.0,
    // Auberon Herbert: British "voluntaryist"; disciple of Spencer but more radical.
    // Very high reason (+0.85): systematic case for voluntary society. High reality (+0.8): practical
    // proposals for voluntary taxation, competing governments. Near-perfect individual (+0.95): individual
    // sovereignty is absolute; no one may use force against another. PERFECT freedom (+1.0): no coercion ever
    // justified, even by majority vote. Very high market (+0.85): voluntary exchange only. Very high
    // good_evil (+0.85): coercion is always wrong regardless of consequences. "Voluntaryism" — coined the term.
    // "If we use force to impose our will on others, we destroy that which we seek to protect."
    // Closest to Objectivist politics but less developed epistemology/ethics.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.95, freedom_coercion: 1.0, value_nihilism: 0.8, market_planning: 0.85, beauty_chaos: 0.5, good_evil: 0.85 }
  },

  // ANARCHO-COMMUNIST (4)
  {
    id: 'pierre_joseph_proudhon',
    name: 'Pierre-Joseph Proudhon',
    birth_year: 1809,
    death_year: 1865,
    dates: '1809–1865',
    birth_city: 'Besançon',
    birth_country_modern: 'France',
    latitude: 47.2378,
    longitude: 6.0241,
    school_of_thought: 'Mutualism',
    school: 'Anarcho-Communist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Property is theft; mutualist anarchism; federalism; anti-state, anti-capitalist'],
    historical_weight: 1.0,
    // Proudhon: First to call himself "anarchist"; "Property is theft" (but also "Property is freedom" — depends on type).
    // Moderate reason (+0.6): systematic arguments but often contradictory. Moderate reality (+0.6): mutualism
    // based on exchange without profit. Low individual (+0.3): against private capital accumulation.
    // High freedom (+0.7): anti-state, decentralist. Low market (+0.2): exchange economy without capitalism.
    // Influenced Marx (who broke with him), later anarchists. Anti-democratic, anti-communist, anti-capitalist.
    // "To be governed is to be watched, inspected, spied upon..."
    battles: { reason_faith: 0.6, reality_mysticism: 0.6, individual_collective: 0.3, freedom_coercion: 0.7, value_nihilism: 0.4, market_planning: 0.2, beauty_chaos: 0.4, good_evil: 0.4 }
  },
  {
    id: 'mikhail_bakunin',
    name: 'Mikhail Bakunin',
    birth_year: 1814,
    death_year: 1876,
    dates: '1814–1876',
    birth_city: 'Pryamukhino',
    birth_country_modern: 'Russia',
    latitude: 57.1522,
    longitude: 34.6019,
    school_of_thought: 'Collectivist Anarchism',
    school: 'Anarcho-Communist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Collectivist anarchism; destroy the state and God; revolutionary violence'],
    historical_weight: 0.8,
    // Bakunin: Revolutionary anarchist; Marx's rival in First International.
    // Moderate reason (+0.5): uses argument but embraces destructive passion. Moderate reality (+0.5):
    // materialist but apocalyptic. Low individual (+0.2): collectivist — workers' associations, not
    // individual rights. Moderate freedom (+0.6): anti-state but also anti-freedom-of-commerce.
    // Very low market (+0.1): collective ownership. "The urge to destroy is also a creative urge."
    // Advocated violent revolution, secret revolutionary societies. Antisemitic conspiracy theories.
    // Warned (correctly) that Marxism would create "red bureaucracy" worse than capitalism.
    battles: { reason_faith: 0.5, reality_mysticism: 0.5, individual_collective: 0.2, freedom_coercion: 0.6, value_nihilism: 0.3, market_planning: 0.1, beauty_chaos: 0.3, good_evil: 0.3 }
  },
  {
    id: 'friedrich_engels',
    name: 'Friedrich Engels',
    birth_year: 1820,
    death_year: 1895,
    dates: '1820–1895',
    birth_city: 'Barmen',
    birth_country_modern: 'Germany',
    latitude: 51.2667,
    longitude: 7.2000,
    school_of_thought: 'Marxism',
    school: 'Marxist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Co-author of Communist Manifesto; historical materialism; dialectics of nature'],
    historical_weight: 0.8,
    // Engels: Marx's collaborator; co-authored Communist Manifesto, edited Capital vols. 2-3.
    // Moderate reason (+0.6): claims to be "scientific" socialism. High reality (+0.7): materialist.
    // Near-negative individual (-0.9): class consciousness over individual identity. Negative freedom (-0.5):
    // dictatorship of proletariat, revolution. Near-negative market (-0.9): abolish private property.
    // "Anti-Dühring" and "Dialectics of Nature" — tried to extend Marxism to natural science (badly).
    // Funded Marx from his factory-owning family's money. Systematized Marxism after Marx's death.
    battles: { reason_faith: 0.6, reality_mysticism: 0.7, individual_collective: -0.9, freedom_coercion: -0.5, value_nihilism: 0.4, market_planning: -0.9, beauty_chaos: 0.0, good_evil: 0.2 }
  },
  {
    id: 'peter_kropotkin',
    name: 'Peter Kropotkin',
    birth_year: 1842,
    death_year: 1921,
    dates: '1842–1921',
    birth_city: 'Moscow',
    birth_country_modern: 'Russia',
    latitude: 55.7558,
    longitude: 37.6173,
    school_of_thought: 'Anarcho-Communism',
    school: 'Anarcho-Communist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Mutual aid; communist anarchism; no individual property; scientific anarchism'],
    historical_weight: 0.75,
    // Kropotkin: "Anarchist prince"; geographer who developed anarcho-communism based on "mutual aid."
    // Moderate reason (+0.6): tried to ground anarchism in Darwinian science (cooperation, not competition).
    // Moderate reality (+0.6): naturalist, observed animal cooperation. Very low individual (+0.1):
    // no individual property, common ownership. Moderate freedom (+0.6): anti-state but also anti-market.
    // Neutral market (0.0): "from each according to ability, to each according to need" — no exchange.
    // "Mutual Aid: A Factor of Evolution" challenged social Darwinism. Kind-hearted, opposed Bolsheviks.
    battles: { reason_faith: 0.6, reality_mysticism: 0.6, individual_collective: 0.1, freedom_coercion: 0.6, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.4 }
  },

  // VOLUNTARIST (2)
  {
    id: 'schopenhauer',
    name: 'Arthur Schopenhauer',
    birth_year: 1788,
    death_year: 1860,
    dates: '1788–1860',
    birth_city: 'Danzig',
    birth_country_modern: 'Poland',
    latitude: 54.3520,
    longitude: 18.6466,
    school_of_thought: 'Pessimism',
    school: 'Voluntarist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Blind Will underlies reality; reason is its servant'],
    historical_weight: 1.0,
    battles: { reason_faith: -0.5, reality_mysticism: -0.8, individual_collective: 0.1, freedom_coercion: 0.2, value_nihilism: -0.6, market_planning: 0.0, beauty_chaos: 0.7, good_evil: -0.2 }
  },
  {
    id: 'nietzsche',
    name: 'Friedrich Nietzsche',
    birth_year: 1844,
    death_year: 1900,
    dates: '1844–1900',
    birth_city: 'Röcken',
    birth_country_modern: 'Germany',
    latitude: 51.2167,
    longitude: 12.1167,
    school_of_thought: 'Perspectivism',
    school: 'Voluntarist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Will to Power; death of God; perspectivism'],
    historical_weight: 0.85,
    // Nietzsche: Perspectivism = no objective truth; Will to Power is mystical/irrational; attacked slave morality but replaced with irrationalism
    battles: { reason_faith: -0.3, reality_mysticism: -0.2, individual_collective: 0.8, freedom_coercion: 0.5, value_nihilism: -0.2, market_planning: 0.1, beauty_chaos: 0.5, good_evil: -0.4 }
  },

  // UTILITARIAN (1)
  {
    id: 'john_stuart_mill',
    name: 'John Stuart Mill',
    birth_year: 1806,
    death_year: 1873,
    dates: '1806–1873',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Utilitarianism / Liberalism',
    school: 'Utilitarian',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Harm principle subordinates individual to society; utility trumps rights — altruism with a logical veneer'],
    historical_weight: 0.85,
    battles: { reason_faith: 0.7, reality_mysticism: 0.7, individual_collective: 0.4, freedom_coercion: 0.6, value_nihilism: 0.6, market_planning: 0.3, beauty_chaos: 0.5, good_evil: 0.5 }
  },

  // EXISTENTIALIST (1)
  {
    id: 'kierkegaard',
    name: 'S. Kierkegaard',
    birth_year: 1813,
    death_year: 1855,
    dates: '1813–1855',
    birth_city: 'Copenhagen',
    birth_country_modern: 'Denmark',
    latitude: 55.6761,
    longitude: 12.5683,
    school_of_thought: 'Existentialism',
    school: 'Existentialist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Leap of faith; subjectivity is truth; against Hegel'],
    historical_weight: 0.75,
    // Kierkegaard: Father of existentialism; "leap of faith" over reason; "truth is subjectivity"; radical individualist; faith-based values
    battles: { reason_faith: -0.8, reality_mysticism: -0.5, individual_collective: 0.8, freedom_coercion: 0.6, value_nihilism: -0.3, market_planning: 0.0, beauty_chaos: 0.4, good_evil: -0.4 }
  },

  // MARXIST (1)
  {
    id: 'karl_marx',
    name: 'Karl Marx',
    birth_year: 1818,
    death_year: 1883,
    dates: '1818–1883',
    birth_city: 'Trier',
    birth_country_modern: 'Germany',
    latitude: 49.7557,
    longitude: 6.6394,
    school_of_thought: 'Marxism',
    school: 'Marxist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Dialectical materialism inverts Hegel but retains irrationalism; collectivism; anti-individual'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.6, reality_mysticism: 0.7, individual_collective: -1.0, freedom_coercion: -0.6, value_nihilism: 0.4, market_planning: -1.0, beauty_chaos: 0.0, good_evil: 0.2 }
  },

  // PRAGMATIST (3)
  {
    id: 'charles_peirce',
    name: 'Charles S. Peirce',
    birth_year: 1839,
    death_year: 1914,
    dates: '1839–1914',
    birth_city: 'Cambridge',
    birth_country_modern: 'United States',
    latitude: 42.3736,
    longitude: -71.1097,
    school_of_thought: 'Pragmatism',
    school: 'Pragmatist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Truth as long-run consensus of inquirers — replaces correspondence to reality with social agreement'],
    historical_weight: 1.0,
    // Peirce: Founded pragmatism; rigorous logician but truth=consensus undermines correspondence; accepts external reality but social truth
    battles: { reason_faith: -0.4, reality_mysticism: -0.3, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: -0.4, market_planning: 0.0, beauty_chaos: 0.2, good_evil: -0.3 }
  },
  {
    id: 'william_james',
    name: 'William James',
    birth_year: 1842,
    death_year: 1910,
    dates: '1842–1910',
    birth_city: 'New York',
    birth_country_modern: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    school_of_thought: 'Pragmatism',
    school: 'Pragmatist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Truth is what works — explicitly rejects correspondence theory of truth; pragmatic cash-value'],
    historical_weight: 0.7,
    // James: "Will to Believe" defends faith; "Varieties of Religious Experience" sympathetic to mysticism; individualist, liberal
    battles: { reason_faith: -0.5, reality_mysticism: -0.4, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: -0.4, market_planning: 0.2, beauty_chaos: 0.2, good_evil: -0.4 }
  },
  {
    id: 'john_dewey',
    name: 'John Dewey',
    birth_year: 1859,
    death_year: 1952,
    dates: '1859–1952',
    birth_city: 'Burlington',
    birth_country_modern: 'United States',
    latitude: 44.4759,
    longitude: -73.2121,
    school_of_thought: 'Instrumentalism',
    school: 'Pragmatist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Instrumentalism; truth as tool for biological adaptation; no objective standards independent of use'],
    historical_weight: 0.7,
    // Dewey: Instrumentalism; progressive education (state control); democratic socialism; "growth" as only end; no fixed human nature
    battles: { reason_faith: -0.4, reality_mysticism: -0.3, individual_collective: -0.5, freedom_coercion: -0.4, value_nihilism: -0.4, market_planning: -0.5, beauty_chaos: 0.1, good_evil: -0.4 }
  },

  // ANALYTIC (1)
  {
    id: 'gottlob_frege',
    name: 'Gottlob Frege',
    birth_year: 1848,
    death_year: 1925,
    dates: '1848–1925',
    birth_city: 'Wismar',
    birth_country_modern: 'Germany',
    latitude: 53.8917,
    longitude: 11.4583,
    school_of_thought: 'Logicism',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Logical foundations of mathematics; objectivity of sense'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 0.6, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },

  // PHENOMENOLOGY (1)
  {
    id: 'edmund_husserl',
    name: 'Edmund Husserl',
    birth_year: 1859,
    death_year: 1938,
    dates: '1859–1938',
    birth_city: 'Prostějov',
    birth_country_modern: 'Czech Republic',
    latitude: 49.4719,
    longitude: 17.1114,
    school_of_thought: 'Phenomenology',
    school: 'Phenomenology',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Phenomenological reduction brackets objective reality; consciousness constitutes the world'],
    historical_weight: 1.0,
    // Husserl: "Philosophy as rigorous science" - rigorous method seeking certainty; BUT brackets natural attitude, transcendental idealism; consciousness constitutes world
    battles: { reason_faith: 0.5, reality_mysticism: -0.5, individual_collective: 0.4, freedom_coercion: 0.3, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.2 }
  },

  // VITALIST (1)
  {
    id: 'henri_bergson',
    name: 'Henri Bergson',
    birth_year: 1859,
    death_year: 1941,
    dates: '1859–1941',
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Vitalism',
    school: 'Vitalist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Élan vital; intuition over intellect and mechanism'],
    historical_weight: 1.0,
    // Bergson: Explicitly "intuition over intellect"; élan vital is mystical life force; duration vs spatialized time; creative evolution; valued freedom & creativity
    battles: { reason_faith: -0.6, reality_mysticism: -0.5, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.2 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 8: 20TH CENTURY (1864–1999) - 40 philosophers
  // ═══════════════════════════════════════════════════════════

  // SOCIOLOGIST (1)
  {
    id: 'max_weber',
    name: 'Max Weber',
    birth_year: 1864,
    death_year: 1920,
    dates: '1864–1920',
    birth_city: 'Erfurt',
    birth_country_modern: 'Germany',
    latitude: 50.9787,
    longitude: 11.0328,
    school_of_thought: 'Sociology',
    school: 'Sociologist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Disenchantment: reason strips meaning from the world; value-free science cannot ground ethics — fact-value split'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.6, reality_mysticism: 0.6, individual_collective: 0.4, freedom_coercion: 0.4, value_nihilism: 0.2, market_planning: 0.3, beauty_chaos: 0.3, good_evil: 0.2 }
  },

  // PROCESS PHILOSOPHY (1)
  {
    id: 'alfred_whitehead',
    name: 'Alfred North Whitehead',
    birth_year: 1861,
    death_year: 1947,
    dates: '1861–1947',
    birth_city: 'Ramsgate',
    birth_country_modern: 'United Kingdom',
    latitude: 51.3361,
    longitude: 1.4164,
    school_of_thought: 'Process Philosophy',
    school: 'Analytic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Process philosophy; reality as becoming not being; organism over mechanism'],
    historical_weight: 0.7,
    battles: { reason_faith: 0.5, reality_mysticism: 0.4, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.6, good_evil: 0.5 }
  },

  // ANARCHO-COMMUNIST (1)
  {
    id: 'emma_goldman',
    name: 'Emma Goldman',
    birth_year: 1869,
    death_year: 1940,
    dates: '1869–1940',
    birth_city: 'Kaunas',
    birth_country_modern: 'Lithuania',
    latitude: 54.8985,
    longitude: 23.9036,
    school_of_thought: 'Anarcho-Communism',
    school: 'Anarcho-Communist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Anarcho-communism; free love; anti-capitalism; individual freedom through collective liberation'],
    historical_weight: 0.7,
    // Emma Goldman: "Red Emma"; anarcho-communist, feminist, advocate of free love.
    // Moderate reason (+0.5): passionate arguments but often emotional over logical. Moderate reality (+0.5):
    // concerned with actual working-class conditions. Low individual (+0.3): collective liberation, not individual
    // rights in property. High freedom (+0.7): opposed all authority — state, capitalism, religion, patriarchy.
    // Very low market (+0.1): anti-capitalist anarchism. Deported from US for radicalism; opposed Bolsheviks
    // after visiting Russia. "If I can't dance, I don't want to be in your revolution" (apocryphal).
    battles: { reason_faith: 0.5, reality_mysticism: 0.5, individual_collective: 0.3, freedom_coercion: 0.7, value_nihilism: 0.4, market_planning: 0.1, beauty_chaos: 0.5, good_evil: 0.4 }
  },

  // VOLUNTARYIST (4)
  {
    id: 'albert_jay_nock',
    name: 'Albert Jay Nock',
    birth_year: 1870,
    death_year: 1945,
    dates: '1870–1945',
    birth_city: 'Scranton',
    birth_country_modern: 'United States',
    latitude: 41.4090,
    longitude: -75.6624,
    school_of_thought: 'Voluntaryism',
    school: 'Voluntaryist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Our Enemy the State; radical individualism; the remnant; anti-mass society'],
    historical_weight: 0.7,
    // Albert Jay Nock: "Our Enemy, the State" — distinguished State (coercive) from government (necessary).
    // High reason (+0.8): erudite classical liberal arguments. High reality (+0.75): historical analysis
    // of state power. Very high individual (+0.9): "the Remnant" — the thoughtful few vs. mass conformity.
    // Very high freedom (+0.9): state is organized exploitation by political class. High market (+0.8):
    // laissez-faire but skeptical of corporate capitalism as state-allied. Influenced early libertarian movement.
    // "The State claims and exercises the monopoly of crime."
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.75, market_planning: 0.8, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'h_l_mencken',
    name: 'H. L. Mencken',
    birth_year: 1880,
    death_year: 1956,
    dates: '1880–1956',
    birth_city: 'Baltimore',
    birth_country_modern: 'United States',
    latitude: 39.2904,
    longitude: -76.6122,
    school_of_thought: 'Voluntaryism',
    school: 'Voluntaryist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The iconoclast of individualism; enemy of mass conformity; critic of democracy'],
    historical_weight: 0.7,
    // H.L. Mencken: "The Sage of Baltimore"; journalist, satirist, iconoclast.
    // Very high reason (+0.85): ruthless logic applied to American culture/politics. High reality (+0.8):
    // empirical observation of political life. Very high individual (+0.9): defended individual liberty against
    // democracy's tyranny. Very high freedom (+0.85): "Democracy is the theory that the common people know
    // what they want, and deserve to get it good and hard." High market (+0.75): anti-New Deal, anti-regulation.
    // Moderate good_evil (+0.7): moral skeptic but not nihilist. Influenced early libertarian/conservative thought.
    // Some problematic views on race; complex legacy.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.9, freedom_coercion: 0.85, value_nihilism: 0.7, market_planning: 0.75, beauty_chaos: 0.6, good_evil: 0.7 }
  },
  {
    id: 'isabel_paterson',
    name: 'Isabel Paterson',
    birth_year: 1886,
    death_year: 1961,
    dates: '1886–1961',
    birth_city: 'Manitoulin Island',
    birth_country_modern: 'Canada',
    latitude: 45.7667,
    longitude: -82.2833,
    school_of_thought: 'Voluntaryism',
    school: 'Voluntaryist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The God of the Machine; founding mother of American libertarianism; energy circuit of production'],
    historical_weight: 0.75,
    // Isabel Paterson: "The God of the Machine" (1943) — one of three "founding mothers" of libertarianism.
    // Very high reason (+0.85): systematic analysis of freedom and production. High reality (+0.8): historical
    // examples of what enables civilization. Very high individual (+0.9): individual creativity as engine of
    // progress. Near-perfect freedom (+0.95): "energy circuit" — liberty enables productive human energy to flow.
    // Very high market (+0.85): capitalism as natural expression of human reason and freedom.
    // Mentor to Ayn Rand (they later broke). "Do-gooders" who use force cause more harm than good.
    // "The humanitarian wishes to be a prime mover in the lives of others."
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.9, freedom_coercion: 0.95, value_nihilism: 0.8, market_planning: 0.85, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'rose_wilder_lane',
    name: 'Rose Wilder Lane',
    birth_year: 1886,
    death_year: 1968,
    dates: '1886–1968',
    birth_city: 'De Smet',
    birth_country_modern: 'United States',
    latitude: 44.3869,
    longitude: -97.5503,
    school_of_thought: 'Voluntaryism',
    school: 'Voluntaryist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The Discovery of Freedom; individual sovereignty; founding mother of libertarianism'],
    historical_weight: 0.7,
    // Rose Wilder Lane: "The Discovery of Freedom" (1943) — third "founding mother" of libertarianism.
    // High reason (+0.8): historical analysis of freedom's role in human progress. High reality (+0.75):
    // traced freedom's growth through history. Very high individual (+0.9): individual energy as source
    // of all progress. Very high freedom (+0.9): opposed New Deal, all government expansion.
    // High market (+0.8): free markets as natural order. Daughter of Laura Ingalls Wilder (Little House).
    // Converted from communism to libertarianism after visiting Soviet Russia.
    // "Freedom is self-control, no more, no less."
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.75, market_planning: 0.8, beauty_chaos: 0.5, good_evil: 0.75 }
  },

  // AUSTRIAN ECONOMICS (6)
  {
    id: 'carl_menger',
    name: 'Carl Menger',
    birth_year: 1840,
    death_year: 1921,
    dates: '1840–1921',
    birth_city: 'Neu-Sandez',
    birth_country_modern: 'Poland',
    latitude: 49.6250,
    longitude: 20.6917,
    school_of_thought: 'Austrian Economics',
    school: 'Austrian Economics',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Founder of Austrian School; subjective theory of value; Principles of Economics (1871); methodological individualism'],
    historical_weight: 1.0,
    // Carl Menger: Founder of Austrian School of Economics; "Principles of Economics" (1871).
    // Very high reason (+0.85): systematic deductive economics from first principles. Very high reality (+0.85):
    // studied actual market processes, not mathematical models. Very high individual (+0.9): methodological
    // individualism — all economic phenomena are actions of individuals. Very high freedom (+0.85): implied
    // by subjective value theory. Near-perfect market (+0.95): marginal utility revolution destroyed labor
    // theory of value. Subjective theory of value is NOT subjectivism — values are subjective but economic
    // laws are objective. Founder alongside Walras, Jevons of marginalist revolution.
    battles: { reason_faith: 0.85, reality_mysticism: 0.85, individual_collective: 0.9, freedom_coercion: 0.85, value_nihilism: 0.8, market_planning: 0.95, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'eugen_bohm_bawerk',
    name: 'Eugen von Böhm-Bawerk',
    birth_year: 1851,
    death_year: 1914,
    dates: '1851–1914',
    birth_city: 'Brno',
    birth_country_modern: 'Czech Republic',
    latitude: 49.1951,
    longitude: 16.6068,
    school_of_thought: 'Austrian Economics',
    school: 'Austrian Economics',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Capital and Interest; critique of Marx exploitation theory; time preference; roundabout production'],
    historical_weight: 0.85,
    // Böhm-Bawerk: Austrian economist; capital theory, time preference, devastating critique of Marx.
    // Very high reason (+0.85): rigorous logic. Very high reality (+0.85): studied actual capital processes.
    // Very high individual (+0.85): time preference is individual choice. Very high freedom (+0.85): interest
    // is legitimate return, not exploitation. Near-perfect market (+0.95): capital formation requires savings,
    // interest coordinates across time. Demolished Marx's exploitation theory by explaining interest without
    // exploitation. Austrian Finance Minister three times. Mises was his student.
    battles: { reason_faith: 0.85, reality_mysticism: 0.85, individual_collective: 0.85, freedom_coercion: 0.85, value_nihilism: 0.8, market_planning: 0.95, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'ludwig_von_mises',
    name: 'Ludwig von Mises',
    birth_year: 1881,
    death_year: 1973,
    dates: '1881–1973',
    birth_city: 'Lemberg',
    birth_country_modern: 'Ukraine',
    latitude: 49.8397,
    longitude: 24.0297,
    school_of_thought: 'Austrian Economics',
    school: 'Austrian Economics',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Human Action; praxeology; rational economic calculation; critique of socialism'],
    historical_weight: 1.0,
    // Ludwig von Mises: Greatest 20th-century economist; "Human Action" is magnum opus.
    // Very high reason (+0.9): praxeology — deductive science of human action from axiom of purposeful behavior.
    // Very high reality (+0.85): studied actual market processes, not equilibrium models. Near-perfect individual
    // (+0.95): methodological individualism; society is individuals acting. Near-perfect freedom (+0.95): socialism
    // is impossible (calculation problem); only market prices can coordinate production. PERFECT market (+1.0):
    // capitalism is only rational system. Very high value (+0.85): rational action implies values; utilitarianism
    // of ends. Economic calculation argument definitively proved socialism cannot work. Influenced Rand, Hayek,
    // Rothbard. "The worst evils which mankind has ever had to endure were inflicted by bad governments."
    battles: { reason_faith: 0.9, reality_mysticism: 0.85, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.85, market_planning: 1.0, beauty_chaos: 0.5, good_evil: 0.85 }
  },
  {
    id: 'henry_hazlitt',
    name: 'Henry Hazlitt',
    birth_year: 1894,
    death_year: 1993,
    dates: '1894–1993',
    birth_city: 'Philadelphia',
    birth_country_modern: 'United States',
    latitude: 39.9526,
    longitude: -75.1652,
    school_of_thought: 'Austrian Economics',
    school: 'Austrian Economics',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Economics in One Lesson; seen and unseen; close friend and ally of Ayn Rand'],
    historical_weight: 0.7,
    // Henry Hazlitt: Journalist, economist; "Economics in One Lesson" (1946) — most accessible economics book.
    // Very high reason (+0.85): clear, logical exposition. High reality (+0.8): traced actual effects of policies.
    // Very high individual (+0.9): defended individual liberty against government intervention.
    // Very high freedom (+0.9): exposed fallacies of interventionism. Near-perfect market (+0.95): free markets
    // produce prosperity, intervention causes harm. "The art of economics consists in looking not merely at the
    // immediate but at the longer effects of any act or policy." Close friend of Ayn Rand; reviewed Atlas Shrugged
    // positively. Introduced her to Mises. Also wrote on ethics ("The Foundations of Morality").
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.8, market_planning: 0.95, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'friedrich_hayek',
    name: 'Friedrich Hayek',
    birth_year: 1899,
    death_year: 1992,
    dates: '1899–1992',
    birth_city: 'Vienna',
    birth_country_modern: 'Austria',
    latitude: 48.2082,
    longitude: 16.3738,
    school_of_thought: 'Austrian Economics',
    school: 'Austrian Economics',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Spontaneous order; Road to Serfdom; knowledge problem; critique of central planning'],
    historical_weight: 0.85,
    // F.A. Hayek: Austrian-British economist/philosopher; Nobel 1974; "The Road to Serfdom."
    // Very high reason (+0.85): knowledge problem — dispersed knowledge can't be centralized. High reality (+0.8):
    // empirical study of market processes. Very high individual (+0.9): spontaneous order emerges from individual
    // actions. Very high freedom (+0.9): central planning leads to totalitarianism. Near-perfect market (+0.95):
    // prices coordinate information no planner can possess. "The Constitution of Liberty" — comprehensive liberal
    // political philosophy. Differs from Mises: evolution over design, less rationalist. "The curious task of
    // economics is to demonstrate to men how little they really know about what they imagine they can design."
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.8, market_planning: 0.95, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'milton_friedman',
    name: 'Milton Friedman',
    birth_year: 1912,
    death_year: 2006,
    dates: '1912–2006',
    birth_city: 'Brooklyn',
    birth_country_modern: 'United States',
    latitude: 40.6782,
    longitude: -73.9442,
    school_of_thought: 'Monetarism',
    school: 'Chicago School',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Capitalism and Freedom; monetarism; empiricist methodology; free markets; school choice'],
    historical_weight: 0.85,
    // Milton Friedman: Chicago School economist; Nobel 1976; "Free to Choose" (with Rose Friedman).
    // Very high reason (+0.85): empirical methodology, statistical analysis. High reality (+0.8): data-driven.
    // Very high individual (+0.85): school choice, drug legalization, volunteer military. Very high freedom (+0.85):
    // "Capitalism and Freedom" — economic liberty and political liberty are inseparable. Very high market (+0.9):
    // monetarism, floating exchange rates, deregulation. Influential advisor to Reagan, Thatcher.
    // Differs from Austrians: empiricist vs. apriorist; accepts some government role (negative income tax).
    // "There's no such thing as a free lunch." Effective public advocate for free markets.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.85, freedom_coercion: 0.85, value_nihilism: 0.8, market_planning: 0.9, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'george_stigler',
    name: 'George Stigler',
    birth_year: 1911,
    death_year: 1991,
    dates: '1911–1991',
    birth_city: 'Renton',
    birth_country_modern: 'United States',
    latitude: 47.4829,
    longitude: -122.2171,
    school_of_thought: 'Chicago Economics',
    school: 'Chicago School',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Regulatory capture theory; economics of information; Nobel 1982; critique of government intervention'],
    historical_weight: 0.75,
    // George Stigler: Chicago economist; Nobel 1982; regulatory capture theory.
    // Very high reason (+0.85): rigorous analysis of how regulation actually works. High reality (+0.8):
    // empirical study of regulatory agencies. Very high individual (+0.85): public choice perspective.
    // Very high freedom (+0.85): regulation often serves regulated industries, not public.
    // Very high market (+0.9): markets work; regulation usually makes things worse.
    // "The Economics of Information" — search costs, asymmetric information. Friend of Friedman.
    // Showed that government failure is systematic, not accidental.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.85, freedom_coercion: 0.85, value_nihilism: 0.8, market_planning: 0.9, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'gary_becker',
    name: 'Gary Becker',
    birth_year: 1930,
    death_year: 2014,
    dates: '1930–2014',
    birth_city: 'Pottsville',
    birth_country_modern: 'United States',
    latitude: 40.6856,
    longitude: -76.1955,
    school_of_thought: 'Chicago Economics',
    school: 'Chicago School',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Human capital theory; economics of discrimination; Nobel 1992; rational choice applied to all behavior'],
    historical_weight: 0.75,
    // Gary Becker: Chicago economist; Nobel 1992; applied economic analysis to all human behavior.
    // Very high reason (+0.85): rational choice framework applied universally. High reality (+0.8): empirical testing.
    // Very high individual (+0.85): all behavior is individual rational choice. High freedom (+0.8): markets better
    // than regulation in most areas. Very high market (+0.9): human capital theory — education/skills as investment.
    // Economics of discrimination showed markets punish prejudice. Economics of crime, family, addiction.
    // Expanded economics to "economic imperialism" — everything can be analyzed economically.
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.85, freedom_coercion: 0.8, value_nihilism: 0.8, market_planning: 0.9, beauty_chaos: 0.5, good_evil: 0.8 }
  },
  {
    id: 'thomas_sowell',
    name: 'Thomas Sowell',
    birth_year: 1930,
    death_year: null,
    dates: '1930–',
    birth_city: 'Gastonia',
    birth_country_modern: 'United States',
    latitude: 35.2621,
    longitude: -81.1873,
    school_of_thought: 'Chicago Economics',
    school: 'Chicago School',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Knowledge and Decisions; Basic Economics; critique of egalitarianism; constrained vs unconstrained visions'],
    historical_weight: 0.8,
    // Thomas Sowell: Economist, social theorist; "Knowledge and Decisions," "Basic Economics."
    // Very high reason (+0.9): rigorous analysis, clear prose, devastating critiques. Very high reality (+0.85):
    // empirical, historical, comparative. Very high individual (+0.9): individual decisions and incentives.
    // Very high freedom (+0.9): government programs usually harm their intended beneficiaries.
    // Near-perfect market (+0.95): markets process information better than central planning.
    // "Conflict of Visions" — constrained (tragic/conservative) vs. unconstrained (utopian/progressive).
    // "There are no solutions, only trade-offs." Former Marxist, trained under Friedman and Stigler.
    // One of most prolific, influential contemporary defenders of free markets and individual liberty.
    battles: { reason_faith: 0.9, reality_mysticism: 0.85, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.85, market_planning: 0.95, beauty_chaos: 0.5, good_evil: 0.85 }
  },

  // EXISTENTIALIST (1)
  {
    id: 'karl_jaspers',
    name: 'Karl Jaspers',
    birth_year: 1883,
    death_year: 1969,
    dates: '1883–1969',
    birth_city: 'Oldenburg',
    birth_country_modern: 'Germany',
    latitude: 53.1435,
    longitude: 8.2146,
    school_of_thought: 'Existentialism',
    school: 'Existentialist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Existenz; transcendence; limits of reason; boundary situations'],
    historical_weight: 0.7,
    // Jaspers: Existenz; transcendence beyond reason; "the Encompassing"; boundary situations reveal limits; anti-Nazi; individualist
    battles: { reason_faith: -0.5, reality_mysticism: -0.4, individual_collective: 0.6, freedom_coercion: 0.5, value_nihilism: 0.2, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.1 }
  },

  // ANALYTIC (6)
  {
    id: 'bertrand_russell',
    name: 'Bertrand Russell',
    birth_year: 1872,
    death_year: 1970,
    dates: '1872–1970',
    birth_city: 'Trellech',
    birth_country_modern: 'United Kingdom',
    latitude: 51.7500,
    longitude: -2.7333,
    school_of_thought: 'Analytic Philosophy',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Logical atomism; scientific philosophy; anti-mysticism'],
    historical_weight: 0.85,
    battles: { reason_faith: 1.0, reality_mysticism: 0.9, individual_collective: 0.7, freedom_coercion: 0.7, value_nihilism: 0.6, market_planning: 0.2, beauty_chaos: 0.5, good_evil: 0.6 }
  },
  {
    id: 'g_e_moore',
    name: 'G. E. Moore',
    birth_year: 1873,
    death_year: 1958,
    dates: '1873–1958',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Common Sense Realism',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Common sense realism; naturalistic fallacy in ethics'],
    historical_weight: 0.65,
    battles: { reason_faith: 0.85, reality_mysticism: 0.85, individual_collective: 0.6, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'ludwig_wittgenstein',
    name: 'Ludwig Wittgenstein',
    birth_year: 1889,
    death_year: 1951,
    dates: '1889–1951',
    birth_city: 'Vienna',
    birth_country_modern: 'Austria',
    latitude: 48.2082,
    longitude: 16.3738,
    school_of_thought: 'Analytic Philosophy',
    school: 'Analytic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Late: language games dissolve objective meaning; meaning is use, not correspondence to reality'],
    historical_weight: 0.85,
    // Wittgenstein (late): Dissolves philosophy as language confusion; no correspondence to reality; language games are local/social; ethics is unsayable; family resemblances
    battles: { reason_faith: -0.4, reality_mysticism: -0.4, individual_collective: 0.2, freedom_coercion: 0.2, value_nihilism: -0.4, market_planning: 0.0, beauty_chaos: -0.1, good_evil: -0.4 }
  },
  {
    id: 'gilbert_ryle',
    name: 'Gilbert Ryle',
    birth_year: 1900,
    death_year: 1976,
    dates: '1900–1976',
    birth_city: 'Brighton',
    birth_country_modern: 'United Kingdom',
    latitude: 50.8225,
    longitude: -0.1372,
    school_of_thought: 'Ordinary Language Philosophy',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Category mistakes; ordinary language analysis'],
    historical_weight: 0.55,
    battles: { reason_faith: 0.7, reality_mysticism: 0.7, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'w_v_o_quine',
    name: 'W. V. O. Quine',
    birth_year: 1908,
    death_year: 2000,
    dates: '1908–2000',
    birth_city: 'Akron',
    birth_country_modern: 'United States',
    latitude: 41.0814,
    longitude: -81.5190,
    school_of_thought: 'Naturalized Epistemology',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Naturalized epistemology; no analytic/synthetic distinction'],
    historical_weight: 0.75,
    battles: { reason_faith: 0.8, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'bernard_williams',
    name: 'Bernard Williams',
    birth_year: 1929,
    death_year: 2003,
    dates: '1929–2003',
    birth_city: 'Westcliff-on-Sea',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5417,
    longitude: 0.6833,
    school_of_thought: 'Ethics',
    school: 'Analytic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Integrity and internal reasons dissolve objective moral standards — moral relativism with analytic credentials'],
    historical_weight: 0.6,
    // Williams: Analytic rigor (pro-reason method); naturalist; internal reasons ONLY - no objective external standards; moral luck; critic of moral theory; liberal
    battles: { reason_faith: 0.5, reality_mysticism: 0.5, individual_collective: 0.4, freedom_coercion: 0.4, value_nihilism: -0.5, market_planning: 0.0, beauty_chaos: 0.2, good_evil: -0.5 }
  },
  {
    id: 'john_searle',
    name: 'John Searle',
    birth_year: 1932,
    death_year: null,
    dates: '1932–',
    birth_city: 'Denver',
    birth_country_modern: 'United States',
    latitude: 39.7392,
    longitude: -104.9903,
    school_of_thought: 'Philosophy of Mind',
    school: 'Analytic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Chinese Room argument; social construction of reality; intentionality'],
    historical_weight: 0.7,
    battles: { reason_faith: 0.6, reality_mysticism: 0.5, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'saul_kripke',
    name: 'Saul Kripke',
    birth_year: 1940,
    death_year: 2022,
    dates: '1940–2022',
    birth_city: 'Bay Shore',
    birth_country_modern: 'United States',
    latitude: 40.7254,
    longitude: -73.2454,
    school_of_thought: 'Analytic Philosophy',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Naming and Necessity; rigid designators; modal logic; necessity a posteriori'],
    historical_weight: 0.8,
    battles: { reason_faith: 0.85, reality_mysticism: 0.85, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.75, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },

  // POSITIVIST (2)
  {
    id: 'rudolf_carnap',
    name: 'Rudolf Carnap',
    birth_year: 1891,
    death_year: 1970,
    dates: '1891–1970',
    birth_city: 'Ronsdorf',
    birth_country_modern: 'Germany',
    latitude: 51.2333,
    longitude: 7.1833,
    school_of_thought: 'Logical Positivism',
    school: 'Positivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Logical syntax; Vienna Circle verificationism'],
    historical_weight: 0.7,
    battles: { reason_faith: 0.9, reality_mysticism: 0.85, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'a_j_ayer',
    name: 'A. J. Ayer',
    birth_year: 1910,
    death_year: 1989,
    dates: '1910–1989',
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Logical Positivism',
    school: 'Positivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Language Truth and Logic; strict verificationism'],
    historical_weight: 0.6,
    battles: { reason_faith: 0.85, reality_mysticism: 0.85, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.4 }
  },

  // EXISTENTIALIST (4)
  {
    id: 'martin_heidegger',
    name: 'Martin Heidegger',
    birth_year: 1889,
    death_year: 1976,
    dates: '1889–1976',
    birth_city: 'Meßkirch',
    birth_country_modern: 'Germany',
    latitude: 47.9939,
    longitude: 9.1122,
    school_of_thought: 'Existential Phenomenology',
    school: 'Existentialist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Being over cognition; Dasein; critique of Cartesian reason'],
    historical_weight: 1.0,
    // Heidegger: Attacks "calculative thinking"; Being is mysterious/poetic; Nazi rector; anti-modern/anti-technology; no ethics
    battles: { reason_faith: -0.7, reality_mysticism: -0.6, individual_collective: -0.4, freedom_coercion: -0.5, value_nihilism: -0.4, market_planning: -0.4, beauty_chaos: 0.2, good_evil: -0.5 }
  },
  {
    id: 'jean_paul_sartre',
    name: 'Jean-Paul Sartre',
    birth_year: 1905,
    death_year: 1980,
    dates: '1905–1980',
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Existentialism',
    school: 'Existentialist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Existence precedes essence — denies human nature; radical freedom has no rational grounding in reality'],
    historical_weight: 0.85,
    // Sartre: Uses argument (not mystical) but denies essence; early freedom talk but late Marxist; supported communist regimes; "condemned to be free"
    battles: { reason_faith: -0.2, reality_mysticism: -0.4, individual_collective: 0.2, freedom_coercion: 0.0, value_nihilism: -0.5, market_planning: -0.6, beauty_chaos: 0.1, good_evil: -0.5 }
  },
  {
    id: 'simone_de_beauvoir',
    name: 'Simone de Beauvoir',
    birth_year: 1908,
    death_year: 1986,
    dates: '1908–1986',
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Existentialist Feminism',
    school: 'Existentialist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Existentialist feminism; situation over nature; no objective human essence or sex-based identity'],
    historical_weight: 0.65,
    // Beauvoir: Philosophical argument but denies essence; individual situation but collectivist politics; Maoist sympathies; "Ethics of Ambiguity"
    battles: { reason_faith: -0.2, reality_mysticism: -0.4, individual_collective: 0.1, freedom_coercion: 0.0, value_nihilism: -0.4, market_planning: -0.5, beauty_chaos: 0.1, good_evil: -0.4 }
  },
  {
    id: 'albert_camus',
    name: 'Albert Camus',
    birth_year: 1913,
    death_year: 1960,
    dates: '1913–1960',
    birth_city: 'Mondovi',
    birth_country_modern: 'Algeria',
    latitude: 36.4667,
    longitude: 7.4333,
    school_of_thought: 'Absurdism',
    school: 'Existentialist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Absurdism: universe is irrational and indifferent; revolt without rational foundation'],
    historical_weight: 0.7,
    // Camus: Uses reason to analyze absurdity; universe is indifferent; rejected communism (broke with Sartre); individual revolt; no objective moral order
    battles: { reason_faith: -0.3, reality_mysticism: -0.4, individual_collective: 0.6, freedom_coercion: 0.5, value_nihilism: -0.6, market_planning: 0.1, beauty_chaos: 0.3, good_evil: -0.4 }
  },

  // PHENOMENOLOGY (3)
  {
    id: 'emmanuel_levinas',
    name: 'Emmanuel Levinas',
    birth_year: 1906,
    death_year: 1995,
    dates: '1906–1995',
    birth_city: 'Kaunas',
    birth_country_modern: 'Lithuania',
    latitude: 54.8985,
    longitude: 23.9036,
    school_of_thought: 'Phenomenology / Ethics',
    school: 'Phenomenology',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ["Ethics as first philosophy before metaphysics — inverts Rand's hierarchy; the Other commands absolutely"],
    historical_weight: 0.6,
    battles: { reason_faith: 0.3, reality_mysticism: 0.3, individual_collective: 0.2, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'merleau_ponty',
    name: 'Maurice Merleau-Ponty',
    birth_year: 1908,
    death_year: 1961,
    dates: '1908–1961',
    birth_city: 'Rochefort-sur-Mer',
    birth_country_modern: 'France',
    latitude: 45.9333,
    longitude: -0.9667,
    school_of_thought: 'Phenomenology',
    school: 'Phenomenology',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Embodied cognition dissolves subject-object distinction; no mind-independent reality accessible'],
    historical_weight: 0.6,
    battles: { reason_faith: 0.4, reality_mysticism: 0.3, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.4 }
  },
  {
    id: 'paul_ricoeur',
    name: 'Paul Ricoeur',
    birth_year: 1913,
    death_year: 2005,
    dates: '1913–2005',
    birth_city: 'Valence',
    birth_country_modern: 'France',
    latitude: 44.9333,
    longitude: 4.8917,
    school_of_thought: 'Hermeneutic Phenomenology',
    school: 'Phenomenology',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Hermeneutics; all understanding is interpretation; no unmediated access to objective meaning'],
    historical_weight: 0.55,
    battles: { reason_faith: 0.4, reality_mysticism: 0.4, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.4 }
  },

  // CRITICAL THEORY (5)
  {
    id: 'walter_benjamin',
    name: 'Walter Benjamin',
    birth_year: 1892,
    death_year: 1940,
    dates: '1892–1940',
    birth_city: 'Berlin',
    birth_country_modern: 'Germany',
    latitude: 52.5200,
    longitude: 13.4050,
    school_of_thought: 'Critical Theory',
    school: 'Critical Theory',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Marxist aesthetics; dialectical image; history as catastrophe — no rational progress'],
    historical_weight: 0.6,
    battles: { reason_faith: 0.3, reality_mysticism: 0.3, individual_collective: -0.2, freedom_coercion: 0.3, value_nihilism: 0.2, market_planning: -0.3, beauty_chaos: 0.5, good_evil: 0.3 }
  },
  {
    id: 'max_horkheimer',
    name: 'Max Horkheimer',
    birth_year: 1895,
    death_year: 1973,
    dates: '1895–1973',
    birth_city: 'Stuttgart',
    birth_country_modern: 'Germany',
    latitude: 48.7758,
    longitude: 9.1829,
    school_of_thought: 'Critical Theory',
    school: 'Critical Theory',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Instrumental reason as domination; Enlightenment itself becomes myth — attacks reason at its root'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.2, reality_mysticism: 0.3, individual_collective: -0.3, freedom_coercion: 0.2, value_nihilism: 0.2, market_planning: -0.4, beauty_chaos: 0.3, good_evil: 0.2 }
  },
  {
    id: 'herbert_marcuse',
    name: 'Herbert Marcuse',
    birth_year: 1898,
    death_year: 1979,
    dates: '1898–1979',
    birth_city: 'Berlin',
    birth_country_modern: 'Germany',
    latitude: 52.5200,
    longitude: 13.4050,
    school_of_thought: 'Critical Theory',
    school: 'Critical Theory',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['One-dimensional man; technological reason as repression'],
    historical_weight: 0.6,
    battles: { reason_faith: 0.3, reality_mysticism: 0.3, individual_collective: -0.4, freedom_coercion: 0.2, value_nihilism: 0.2, market_planning: -0.5, beauty_chaos: 0.3, good_evil: 0.2 }
  },
  {
    id: 'theodor_adorno',
    name: 'Theodor Adorno',
    birth_year: 1903,
    death_year: 1969,
    dates: '1903–1969',
    birth_city: 'Frankfurt',
    birth_country_modern: 'Germany',
    latitude: 50.1109,
    longitude: 8.6821,
    school_of_thought: 'Critical Theory',
    school: 'Critical Theory',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Negative dialectics; no positive knowledge possible; Enlightenment inevitably turns into barbarism'],
    historical_weight: 0.85,
    battles: { reason_faith: 0.2, reality_mysticism: 0.2, individual_collective: -0.3, freedom_coercion: 0.2, value_nihilism: 0.1, market_planning: -0.4, beauty_chaos: 0.4, good_evil: 0.2 }
  },
  {
    id: 'jurgen_habermas',
    name: 'Jürgen Habermas',
    birth_year: 1929,
    death_year: null,
    dates: '1929–',
    birth_city: 'Düsseldorf',
    birth_country_modern: 'Germany',
    latitude: 51.2277,
    longitude: 6.7735,
    school_of_thought: 'Critical Theory',
    school: 'Critical Theory',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Communicative reason is intersubjective not objective — truth by consensus, not by correspondence to reality'],
    historical_weight: 0.85,
    battles: { reason_faith: 0.5, reality_mysticism: 0.4, individual_collective: 0.3, freedom_coercion: 0.4, value_nihilism: 0.4, market_planning: -0.2, beauty_chaos: 0.4, good_evil: 0.4 }
  },

  // RATIONALIST (1)
  {
    id: 'noam_chomsky',
    name: 'Noam Chomsky',
    birth_year: 1928,
    death_year: null,
    dates: '1928–',
    birth_city: 'Philadelphia',
    birth_country_modern: 'United States',
    latitude: 39.9526,
    longitude: -75.1652,
    school_of_thought: 'Generative Grammar',
    school: 'Rationalist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Innate grammar; generative rationalism; language universals'],
    historical_weight: 0.75,
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.3, freedom_coercion: 0.4, value_nihilism: 0.6, market_planning: -0.3, beauty_chaos: 0.5, good_evil: 0.5 }
  },

  // PHILOSOPHY OF SCIENCE (3)
  {
    id: 'karl_popper',
    name: 'Karl Popper',
    birth_year: 1902,
    death_year: 1994,
    dates: '1902–1994',
    birth_city: 'Vienna',
    birth_country_modern: 'Austria',
    latitude: 48.2082,
    longitude: 16.3738,
    school_of_thought: 'Critical Rationalism',
    school: 'Philosophy of Science',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Falsificationism; critical rationalism; open society'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.8, freedom_coercion: 0.8, value_nihilism: 0.7, market_planning: 0.6, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'thomas_kuhn',
    name: 'Thomas Kuhn',
    birth_year: 1922,
    death_year: 1996,
    dates: '1922–1996',
    birth_city: 'Cincinnati',
    birth_country_modern: 'United States',
    latitude: 39.1031,
    longitude: -84.5120,
    school_of_thought: 'Philosophy of Science',
    school: 'Philosophy of Science',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Paradigm shifts; scientific revolutions incommensurable — no objective progress in science'],
    historical_weight: 0.7,
    battles: { reason_faith: 0.4, reality_mysticism: 0.4, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.3, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.4 }
  },
  {
    id: 'paul_feyerabend',
    name: 'Paul Feyerabend',
    birth_year: 1924,
    death_year: 1994,
    dates: '1924–1994',
    birth_city: 'Vienna',
    birth_country_modern: 'Austria',
    latitude: 48.2082,
    longitude: 16.3738,
    school_of_thought: 'Epistemological Anarchism',
    school: 'Philosophy of Science',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Against method; epistemological anarchism'],
    historical_weight: 0.55,
    battles: { reason_faith: 0.2, reality_mysticism: 0.3, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.2, market_planning: 0.0, beauty_chaos: 0.3, good_evil: 0.3 }
  },

  // OBJECTIVIST (3 in 20th century)
  {
    id: 'ayn_rand',
    name: 'Ayn Rand',
    birth_year: 1905,
    death_year: 1982,
    dates: '1905–1982',
    birth_city: 'Saint Petersburg',
    birth_country_modern: 'Russia',
    latitude: 59.9311,
    longitude: 30.3609,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ["Reason as man's absolute; Objectivism; rational self-interest"],
    historical_weight: 1.0,
    // Ayn Rand: Founder of Objectivism; "Atlas Shrugged," "The Fountainhead." THE benchmark philosopher.
    // PERFECT reason (+1.0): "reason is man's only means of perceiving reality, his only source of knowledge,
    // his only guide to action, and his basic means of survival." PERFECT reality (+1.0): A is A; existence
    // exists; consciousness is identification; objective metaphysics. PERFECT individual (+1.0): man is an
    // end in himself, not a means to others' ends. PERFECT freedom (+1.0): laissez-faire capitalism is the
    // only moral system. PERFECT value (+1.0): man's life is the standard of value; objective ethics.
    // PERFECT market (+1.0): capitalism as the social system based on individual rights.
    // All 8-axis scores are the reference point for the Objectivist framework.
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 1.0, freedom_coercion: 1.0, value_nihilism: 1.0, market_planning: 1.0, beauty_chaos: 0.9, good_evil: 0.9 }
  },
  {
    id: 'barbara_branden',
    name: 'Barbara Branden',
    birth_year: 1929,
    death_year: 2013,
    dates: '1929–2013',
    birth_city: 'Winnipeg',
    birth_country_modern: 'Canada',
    latitude: 49.8951,
    longitude: -97.1384,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The Passion of Ayn Rand; early movement organizer'],
    historical_weight: 0.5,
    // Barbara Branden: Early Objectivist, organized NBI (Nathaniel Branden Institute), biographer.
    // Very high across all axes: committed Objectivist who later wrote "The Passion of Ayn Rand."
    // Later estranged from Rand but remained broadly within Objectivist framework on fundamentals.
    // Contributed to spreading Objectivism in early years. Beauty score reflects aesthetic contributions.
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.85, market_planning: 0.85, beauty_chaos: 0.7, good_evil: 0.8 }
  },
  {
    id: 'nathaniel_branden',
    name: 'Nathaniel Branden',
    birth_year: 1930,
    death_year: 2014,
    dates: '1930–2014',
    birth_city: 'Brampton',
    birth_country_modern: 'Canada',
    latitude: 43.7315,
    longitude: -79.7624,
    school_of_thought: 'Objectivism / Psychology',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Psychology of self-esteem; chief popularizer of Objectivism'],
    historical_weight: 0.6,
    // Nathaniel Branden: Rand's intellectual heir in psychology; "The Psychology of Self-Esteem."
    // Developed Objectivist psychology; co-organized NBI lectures that spread Objectivism widely.
    // Very high across all axes as committed Objectivist. Later break with Rand but continued work on
    // self-esteem, which aligns with Objectivist emphasis on self-value. "Six Pillars of Self-Esteem."
    // Pioneered psychological application of Objectivist principles to human flourishing.
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.9, market_planning: 0.85, beauty_chaos: 0.7, good_evil: 0.85 }
  },

  // POLITICAL (1)
  {
    id: 'hannah_arendt',
    name: 'Hannah Arendt',
    birth_year: 1906,
    death_year: 1975,
    dates: '1906–1975',
    birth_city: 'Linden',
    birth_country_modern: 'Germany',
    latitude: 52.3667,
    longitude: 9.6833,
    school_of_thought: 'Political Philosophy',
    school: 'Political',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Political action over individual reason; vita activa over vita contemplativa — the collective precedes the individual'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.5, reality_mysticism: 0.5, individual_collective: 0.3, freedom_coercion: 0.6, value_nihilism: 0.5, market_planning: 0.2, beauty_chaos: 0.5, good_evil: 0.6 }
  },

  // MARXIST (1 in 20th century)
  {
    id: 'louis_althusser',
    name: 'Louis Althusser',
    birth_year: 1918,
    death_year: 1990,
    dates: '1918–1990',
    birth_city: 'Birmandreis',
    birth_country_modern: 'Algeria',
    latitude: 36.7333,
    longitude: 3.0500,
    school_of_thought: 'Structural Marxism',
    school: 'Marxist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Scientific Marxism; individuals are effects of ideology — no autonomous rational subject'],
    historical_weight: 0.55,
    battles: { reason_faith: 0.4, reality_mysticism: 0.4, individual_collective: -0.6, freedom_coercion: -0.3, value_nihilism: 0.3, market_planning: -0.7, beauty_chaos: 0.2, good_evil: 0.2 }
  },

  // LIBERAL (2)
  {
    id: 'john_rawls',
    name: 'John Rawls',
    birth_year: 1921,
    death_year: 2002,
    dates: '1921–2002',
    birth_city: 'Baltimore',
    birth_country_modern: 'United States',
    latitude: 39.2904,
    longitude: -76.6122,
    school_of_thought: 'Political Liberalism',
    school: 'Liberal',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Veil of ignorance erases individual identity; distributive justice violates rights; egalitarianism over merit'],
    historical_weight: 0.7,
    battles: { reason_faith: 0.6, reality_mysticism: 0.6, individual_collective: -0.2, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: -0.3, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'robert_nozick',
    name: 'Robert Nozick',
    birth_year: 1938,
    death_year: 2002,
    dates: '1938–2002',
    birth_city: 'Brooklyn',
    birth_country_modern: 'United States',
    latitude: 40.6782,
    longitude: -73.9442,
    school_of_thought: 'Libertarianism',
    school: 'Liberal',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Libertarian natural rights; self-ownership; Anarchy State and Utopia — closest liberal to Objectivism'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.8, reality_mysticism: 0.8, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.7, market_planning: 0.8, beauty_chaos: 0.5, good_evil: 0.7 }
  },

  // POSTMODERN (5)
  {
    id: 'lyotard',
    name: 'Jean-François Lyotard',
    birth_year: 1924,
    death_year: 1998,
    dates: '1924–1998',
    birth_city: 'Versailles',
    birth_country_modern: 'France',
    latitude: 48.8014,
    longitude: 2.1301,
    school_of_thought: 'Postmodernism',
    school: 'Postmodern',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Incredulity toward metanarratives; end of grand reason'],
    historical_weight: 0.6,
    // Lyotard: Rejects reason as universal metanarrative; no objective reality, just language games; no progress or meaning; leftist; sublime over beautiful
    battles: { reason_faith: -0.8, reality_mysticism: -0.6, individual_collective: 0.1, freedom_coercion: 0.2, value_nihilism: -0.7, market_planning: -0.3, beauty_chaos: -0.4, good_evil: -0.6 }
  },
  {
    id: 'gilles_deleuze',
    name: 'Gilles Deleuze',
    birth_year: 1925,
    death_year: 1995,
    dates: '1925–1995',
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Post-structuralism',
    school: 'Postmodern',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Difference and repetition; anti-dialectics; rhizome'],
    historical_weight: 0.65,
    // Deleuze: Anti-dialectical, rejects systematic logic; flux/multiplicities; celebrates difference; nomadic, anti-authority; immanent values; anti-capitalist
    battles: { reason_faith: -0.5, reality_mysticism: -0.4, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: -0.3, market_planning: -0.4, beauty_chaos: -0.2, good_evil: -0.4 }
  },
  {
    id: 'michel_foucault',
    name: 'Michel Foucault',
    birth_year: 1926,
    death_year: 1984,
    dates: '1926–1984',
    birth_city: 'Poitiers',
    birth_country_modern: 'France',
    latitude: 46.5802,
    longitude: 0.3404,
    school_of_thought: 'Post-structuralism',
    school: 'Postmodern',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Power-knowledge regimes; genealogy of truth'],
    historical_weight: 1.0,
    // Foucault: Truth is power relations; reality constructed by discourse; subject is power-construct; late libertarian turn; morality is power
    battles: { reason_faith: -0.7, reality_mysticism: -0.5, individual_collective: -0.3, freedom_coercion: -0.2, value_nihilism: -0.6, market_planning: -0.3, beauty_chaos: -0.3, good_evil: -0.6 }
  },
  {
    id: 'jean_baudrillard',
    name: 'Jean Baudrillard',
    birth_year: 1929,
    death_year: 2007,
    dates: '1929–2007',
    birth_city: 'Reims',
    birth_country_modern: 'France',
    latitude: 49.2583,
    longitude: 4.0317,
    school_of_thought: 'Postmodernism',
    school: 'Postmodern',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Hyperreality; simulation replaces the real'],
    historical_weight: 0.6,
    // Baudrillard: Reality is GONE, only simulation; reason can't penetrate hyperreality; freedom is illusory; no authentic values; morality is simulacrum
    battles: { reason_faith: -0.5, reality_mysticism: -0.9, individual_collective: 0.0, freedom_coercion: -0.1, value_nihilism: -0.8, market_planning: -0.4, beauty_chaos: -0.5, good_evil: -0.6 }
  },
  {
    id: 'jacques_derrida',
    name: 'Jacques Derrida',
    birth_year: 1930,
    death_year: 2004,
    dates: '1930–2004',
    birth_city: 'El Biar',
    birth_country_modern: 'Algeria',
    latitude: 36.7683,
    longitude: 3.0308,
    school_of_thought: 'Deconstruction',
    school: 'Postmodern',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Deconstruction; all texts endlessly defer meaning'],
    historical_weight: 0.85,
    // Derrida: Deconstruction attacks logos/reason itself; no presence, only traces; meaning endlessly deferred; anti-totalitarian; ethics without foundations
    battles: { reason_faith: -0.8, reality_mysticism: -0.7, individual_collective: 0.0, freedom_coercion: 0.2, value_nihilism: -0.7, market_planning: -0.3, beauty_chaos: -0.4, good_evil: -0.6 }
  },

  // VIRTUE ETHICS (1)
  {
    id: 'alasdair_macintyre',
    name: 'Alasdair MacIntyre',
    birth_year: 1929,
    death_year: null,
    dates: '1929–',
    birth_city: 'Glasgow',
    birth_country_modern: 'United Kingdom',
    latitude: 55.8642,
    longitude: -4.2518,
    school_of_thought: 'Virtue Ethics',
    school: 'Virtue Ethics',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Tradition-dependent rationality — no universal reason, only internal standards of practices'],
    historical_weight: 1.0,
    // MacIntyre: Rejects universal reason, only tradition-internal; historicist; communitarian; critic of liberalism & capitalism; virtue but tradition-dependent
    battles: { reason_faith: -0.4, reality_mysticism: -0.2, individual_collective: -0.4, freedom_coercion: -0.1, value_nihilism: 0.4, market_planning: -0.3, beauty_chaos: 0.2, good_evil: 0.3 }
  },

  // NEO-PRAGMATIST (1)
  {
    id: 'richard_rorty',
    name: 'Richard Rorty',
    birth_year: 1931,
    death_year: 2007,
    dates: '1931–2007',
    birth_city: 'New York',
    birth_country_modern: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    school_of_thought: 'Neo-pragmatism',
    school: 'Neo-Pragmatist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['No mirror of nature; truth is contingent and social'],
    historical_weight: 1.0,
    // Rorty: Explicitly attacks reason's ability to know truth; no mirror of nature; values are contingent social constructs; liberal democrat; moral relativist
    battles: { reason_faith: -0.7, reality_mysticism: -0.6, individual_collective: 0.2, freedom_coercion: 0.3, value_nihilism: -0.6, market_planning: -0.3, beauty_chaos: -0.4, good_evil: -0.5 }
  },

  // ANARCHO-CAPITALIST (1 in 20th century)
  {
    id: 'murray_rothbard',
    name: 'Murray Rothbard',
    birth_year: 1926,
    death_year: 1995,
    dates: '1926–1995',
    birth_city: 'New York',
    birth_country_modern: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    school_of_thought: 'Anarcho-Capitalism',
    school: 'Anarcho-Capitalist',
    tradition: 'western',
    stance: 'anti',
    is_champion: true,
    key_ideas: ['Anarcho-capitalism; utopian stateless society; competing defense agencies; anti-IP; subjectivist ethics; no objective law'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.4, reality_mysticism: 0.3, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: 0.4, market_planning: 0.9, beauty_chaos: 0.4, good_evil: 0.3 }
  },

  // ═══════════════════════════════════════════════════════════
  // ERA 9: CONTEMPORARY (1926–present) - 35 philosophers
  // ═══════════════════════════════════════════════════════════

  // ANALYTIC (6)
  {
    id: 'hilary_putnam',
    name: 'Hilary Putnam',
    birth_year: 1926,
    death_year: 2016,
    dates: '1926–2016',
    birth_city: 'Chicago',
    birth_country_modern: 'United States',
    latitude: 41.8781,
    longitude: -87.6298,
    school_of_thought: 'Internal Realism',
    school: 'Analytic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['No view from nowhere; internal realism denies mind-independent objective reality — Kant recycled'],
    historical_weight: 0.6,
    battles: { reason_faith: 0.5, reality_mysticism: 0.4, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.4, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.4 }
  },
  {
    id: 'alvin_plantinga',
    name: 'Alvin Plantinga',
    birth_year: 1932,
    death_year: null,
    dates: '1932–',
    birth_city: 'Ann Arbor',
    birth_country_modern: 'United States',
    latitude: 42.2808,
    longitude: -83.7430,
    school_of_thought: 'Reformed Epistemology',
    school: 'Analytic',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Belief in God as properly basic — bypasses reason entirely; faith without rational justification is anti-reason'],
    historical_weight: 0.55,
    battles: { reason_faith: 0.1, reality_mysticism: 0.3, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.5, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.5 }
  },
  {
    id: 'david_lewis',
    name: 'David Lewis',
    birth_year: 1941,
    death_year: 2001,
    dates: '1941–2001',
    birth_city: 'Oberlin',
    birth_country_modern: 'United States',
    latitude: 41.2939,
    longitude: -82.2171,
    school_of_thought: 'Modal Realism',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Modal realism; possible worlds; logical rigor'],
    historical_weight: 0.65,
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.5 }
  },
  {
    id: 'derek_parfit',
    name: 'Derek Parfit',
    birth_year: 1942,
    death_year: 2017,
    dates: '1942–2017',
    birth_city: 'Chengdu',
    birth_country_modern: 'China',
    latitude: 30.5728,
    longitude: 104.0668,
    school_of_thought: 'Ethics / Personal Identity',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Personal identity; objective reasons; reasons and persons'],
    historical_weight: 0.65,
    battles: { reason_faith: 0.8, reality_mysticism: 0.75, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'peter_railton',
    name: 'Peter Railton',
    birth_year: 1950,
    death_year: null,
    dates: '1950–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Moral Realism',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Moral realism; naturalist metaethics'],
    historical_weight: 0.5,
    battles: { reason_faith: 0.8, reality_mysticism: 0.8, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'nick_bostrom',
    name: 'Nick Bostrom',
    birth_year: 1973,
    death_year: null,
    dates: '1973–',
    birth_city: 'Helsingborg',
    birth_country_modern: 'Sweden',
    latitude: 56.0465,
    longitude: 12.6945,
    school_of_thought: 'Philosophy of AI',
    school: 'Analytic',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Simulation argument; existential risk; rational futurism'],
    historical_weight: 0.5,
    battles: { reason_faith: 0.85, reality_mysticism: 0.8, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.7, market_planning: 0.0, beauty_chaos: 0.5, good_evil: 0.6 }
  },

  // OBJECTIVIST (18 in Contemporary)
  {
    id: 'leonard_peikoff',
    name: 'Leonard Peikoff',
    birth_year: 1933,
    death_year: null,
    dates: '1933–',
    birth_city: 'Winnipeg',
    birth_country_modern: 'Canada',
    latitude: 49.8951,
    longitude: -97.1384,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["Rand's designated heir; OPAR (1991); founder of ARI"],
    historical_weight: 0.85,
    // Leonard Peikoff: Rand's designated intellectual heir; "Objectivism: The Philosophy of Ayn Rand" (OPAR).
    // PERFECT scores across epistemology, metaphysics, ethics, politics — faithful systematization of Rand.
    // Founded Ayn Rand Institute (ARI). "The DIM Hypothesis" — integration-disintegration-misintegration.
    // Lectures on history of philosophy, Objectivist methodology. PhD in philosophy (NYU under Sidney Hook).
    // "The Ominous Parallels" — philosophy's role in Nazism. Most authoritative expositor of Objectivism.
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 1.0, freedom_coercion: 1.0, value_nihilism: 1.0, market_planning: 1.0, beauty_chaos: 0.85, good_evil: 0.9 }
  },
  {
    id: 'edwin_locke',
    name: 'Edwin Locke',
    birth_year: 1938,
    death_year: null,
    dates: '1938–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism / Psychology',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The Prime Movers (2000); goal-setting theory; Objectivist psychology of achievement'],
    historical_weight: 0.5,
    // Edwin Locke: Industrial/organizational psychologist; integrated Objectivism with business research.
    // "The Prime Movers" — profiles of productive businesspeople. Goal-setting theory widely influential.
    // Applied Objectivist principles to management, motivation, achievement. Very high scores reflecting
    // commitment to reason, reality, individualism in professional psychology.
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 0.9, freedom_coercion: 0.85, value_nihilism: 0.85, market_planning: 0.8, beauty_chaos: 0.6, good_evil: 0.8 }
  },
  {
    id: 'allan_gotthelf',
    name: 'Allan Gotthelf',
    birth_year: 1942,
    death_year: 2013,
    dates: '1942–2013',
    birth_city: 'Brooklyn',
    birth_country_modern: 'United States',
    latitude: 40.6782,
    longitude: -73.9442,
    school_of_thought: 'Objectivism / Aristotle',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Gotthelf on Aristotle; philosophy of biology; Objectivist scholar'],
    historical_weight: 0.55,
    // Allan Gotthelf: Aristotle scholar and Objectivist; bridged academic philosophy and Objectivism.
    // Major works on Aristotle's biology and teleology. Co-editor "Ayn Rand: A Companion to Her Works."
    // Very high reality score (+0.95) — specialized in Aristotelian naturalism, philosophy of biology.
    // Demonstrated Objectivism's Aristotelian foundations in academic context. Brought rigor to Objectivist scholarship.
    battles: { reason_faith: 0.95, reality_mysticism: 0.95, individual_collective: 0.85, freedom_coercion: 0.85, value_nihilism: 0.9, market_planning: 0.8, beauty_chaos: 0.7, good_evil: 0.85 }
  },
  {
    id: 'michael_berliner',
    name: 'Michael Berliner',
    birth_year: 1942,
    death_year: null,
    dates: '1942–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["ARI co-founder and former executive director; Rand's philosophy and education reform"],
    historical_weight: 0.45,
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.85, market_planning: 0.85, beauty_chaos: 0.6, good_evil: 0.8 }
  },
  {
    id: 'harry_binswanger',
    name: 'Harry Binswanger',
    birth_year: 1944,
    death_year: null,
    dates: '1944–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['How We Know (2014); consciousness; ARI senior fellow'],
    historical_weight: 0.7,
    // Harry Binswanger: Objectivist philosopher; "How We Know" — Objectivist epistemology for academics.
    // Edited "The Ayn Rand Lexicon." ARI board member. Specialist in consciousness and theory of concepts.
    // Perfect scores on reason and reality — focuses on epistemological foundations. "The Biological Basis
    // of Teleological Concepts." Runs Harry Binswanger Letter (HBL) discussion forum. Rigorous thinker.
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.95, market_planning: 0.95, beauty_chaos: 0.7, good_evil: 0.9 }
  },
  {
    id: 'andrew_bernstein',
    name: 'Andrew Bernstein',
    birth_year: 1949,
    death_year: null,
    dates: '1949–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The Capitalist Manifesto; Objectivism in history and culture'],
    historical_weight: 0.45,
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.85, market_planning: 0.9, beauty_chaos: 0.6, good_evil: 0.8 }
  },
  {
    id: 'peter_schwartz',
    name: 'Peter Schwartz',
    birth_year: 1949,
    death_year: null,
    dates: '1949–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['In Defense of Selfishness (2015); The Foreign Policy of Self-Interest; ARI senior fellow'],
    historical_weight: 0.7,
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 0.95, freedom_coercion: 0.9, value_nihilism: 0.9, market_planning: 0.9, beauty_chaos: 0.6, good_evil: 0.85 }
  },
  {
    id: 'tara_smith',
    name: 'Tara Smith',
    birth_year: 1961,
    death_year: null,
    dates: '1961–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["Viable Values (2000); Rand's Normative Ethics (2006)"],
    historical_weight: 0.6,
    // Tara Smith: Academic philosopher at UT Austin; brings Objectivist ethics to mainstream philosophy.
    // "Ayn Rand's Normative Ethics: The Virtuous Egoist" — most rigorous academic treatment of Rand's ethics.
    // "Viable Values" — metaethical foundations. "Judicial Review in an Objective Legal System."
    // Perfect scores on core axes — fully committed Objectivist engaging academic philosophy on its own terms.
    // Demonstrates Objectivism can meet standards of academic rigor.
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 1.0, freedom_coercion: 1.0, value_nihilism: 1.0, market_planning: 0.95, beauty_chaos: 0.7, good_evil: 0.95 }
  },
  {
    id: 'yaron_brook',
    name: 'Yaron Brook',
    birth_year: 1961,
    death_year: null,
    dates: '1961–',
    birth_city: 'Israel',
    birth_country_modern: 'Israel',
    latitude: 32.0853,
    longitude: 34.7818,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Equal Is Unfair; ARI executive chairman; Objectivist activism'],
    historical_weight: 0.7,
    // Yaron Brook: ARI chairman; most prominent public voice for Objectivism today.
    // "Equal Is Unfair" (with Don Watkins) — critique of egalitarianism. "Free Market Revolution."
    // Israeli-American, finance PhD, businessman turned intellectual activist. Podcast host.
    // Perfect scores across board — effective communicator of Objectivism to general public and media.
    // Takes Objectivist positions on current events, foreign policy, economics.
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 1.0, freedom_coercion: 1.0, value_nihilism: 1.0, market_planning: 1.0, beauty_chaos: 0.6, good_evil: 0.9 }
  },
  {
    id: 'robert_mayhew',
    name: 'Robert Mayhew',
    birth_year: 1963,
    death_year: null,
    dates: '1963–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["Editor of Rand's Q&A volumes; Essays on Ayn Rand's fiction; Objectivist scholarship"],
    historical_weight: 0.45,
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 0.9, freedom_coercion: 0.85, value_nihilism: 0.85, market_planning: 0.8, beauty_chaos: 0.7, good_evil: 0.8 }
  },
  {
    id: 'darryl_wright',
    name: 'Darryl Wright',
    birth_year: 1963,
    death_year: null,
    dates: '1963–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Objectivist ethics and metaethics; Harvey Mudd College; normative theory'],
    historical_weight: 0.45,
    battles: { reason_faith: 0.95, reality_mysticism: 0.95, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.9, market_planning: 0.85, beauty_chaos: 0.6, good_evil: 0.85 }
  },
  {
    id: 'craig_biddle',
    name: 'Craig Biddle',
    birth_year: 1967,
    death_year: null,
    dates: '1967–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Loving Life (2002); The Objective Standard; Objectivist ethics'],
    historical_weight: 0.45,
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 1.0, freedom_coercion: 1.0, value_nihilism: 1.0, market_planning: 1.0, beauty_chaos: 0.6, good_evil: 0.9 }
  },
  {
    id: 'onkar_ghate',
    name: 'Onkar Ghate',
    birth_year: 1970,
    death_year: null,
    dates: '1970–',
    birth_city: 'India',
    birth_country_modern: 'India',
    latitude: 20.5937,
    longitude: 78.9629,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["ARI chief philosophy officer; Rand's epistemology and ethics"],
    historical_weight: 0.7,
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 1.0, freedom_coercion: 1.0, value_nihilism: 1.0, market_planning: 1.0, beauty_chaos: 0.7, good_evil: 0.9 }
  },
  {
    id: 'gregory_salmieri',
    name: 'Gregory Salmieri',
    birth_year: 1975,
    death_year: null,
    dates: '1975–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['A Companion to Ayn Rand (2016); Objectivist epistemology'],
    historical_weight: 0.55,
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.95, market_planning: 0.9, beauty_chaos: 0.7, good_evil: 0.9 }
  },
  {
    id: 'elan_journo',
    name: 'Elan Journo',
    birth_year: 1978,
    death_year: null,
    dates: '1978–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Winning the Unwinnable War (2009); ARI fellow; foreign policy and self-interest'],
    historical_weight: 0.45,
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.9, market_planning: 0.9, beauty_chaos: 0.6, good_evil: 0.85 }
  },
  {
    id: 'ben_bayer',
    name: 'Ben Bayer',
    birth_year: 1980,
    death_year: null,
    dates: '1980–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ["ARI fellow; epistemology; Rand's theory of concepts and perception"],
    historical_weight: 0.4,
    battles: { reason_faith: 1.0, reality_mysticism: 1.0, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.95, market_planning: 0.9, beauty_chaos: 0.6, good_evil: 0.85 }
  },
  {
    id: 'don_watkins',
    name: 'Don Watkins',
    birth_year: 1981,
    death_year: null,
    dates: '1981–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Objectivism',
    school: 'Objectivist',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Equal Is Unfair (2016); Free Market Revolution; ARI fellow; capitalism and rights'],
    historical_weight: 0.4,
    battles: { reason_faith: 0.95, reality_mysticism: 0.9, individual_collective: 1.0, freedom_coercion: 1.0, value_nihilism: 0.9, market_planning: 1.0, beauty_chaos: 0.6, good_evil: 0.85 }
  },

  // POST-RANDIAN REALISM (3)
  {
    id: 'david_kelley',
    name: 'David Kelley',
    birth_year: 1949,
    death_year: null,
    dates: '1949–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Post-Randian Realism',
    school: 'Post-Randian Realism',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['The Evidence of the Senses; open Objectivism; Atlas Society'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.95, reality_mysticism: 0.95, individual_collective: 0.9, freedom_coercion: 0.9, value_nihilism: 0.9, market_planning: 0.9, beauty_chaos: 0.7, good_evil: 0.85 }
  },
  {
    id: 'stephen_hicks',
    name: 'Stephen Hicks',
    birth_year: 1960,
    death_year: null,
    dates: '1960–',
    birth_city: 'Canada',
    birth_country_modern: 'Canada',
    latitude: 56.1304,
    longitude: -106.3468,
    school_of_thought: 'Post-Randian Realism',
    school: 'Post-Randian Realism',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Explaining Postmodernism (2004); Rand-influenced realism'],
    historical_weight: 0.5,
    battles: { reason_faith: 0.95, reality_mysticism: 0.95, individual_collective: 0.85, freedom_coercion: 0.85, value_nihilism: 0.9, market_planning: 0.85, beauty_chaos: 0.7, good_evil: 0.8 }
  },
  {
    id: 'robert_tracinski',
    name: 'Robert Tracinski',
    birth_year: 1968,
    death_year: null,
    dates: '1968–',
    birth_city: 'United States',
    birth_country_modern: 'United States',
    latitude: 39.8283,
    longitude: -98.5795,
    school_of_thought: 'Post-Randian Realism',
    school: 'Post-Randian Realism',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['The Tracinski Letter; Rand-influenced cultural and political commentary'],
    historical_weight: 0.4,
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.85, freedom_coercion: 0.85, value_nihilism: 0.85, market_planning: 0.85, beauty_chaos: 0.6, good_evil: 0.75 }
  },

  // LIBERTARIAN (1)
  {
    id: 'tibor_machan',
    name: 'Tibor Machan',
    birth_year: 1939,
    death_year: 2016,
    dates: '1939–2016',
    birth_city: 'Budapest',
    birth_country_modern: 'Hungary',
    latitude: 47.4979,
    longitude: 19.0402,
    school_of_thought: 'Libertarianism',
    school: 'Libertarian',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Libertarian ethics; Rand-influenced natural rights'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.85, reality_mysticism: 0.85, individual_collective: 0.95, freedom_coercion: 0.95, value_nihilism: 0.75, market_planning: 0.9, beauty_chaos: 0.5, good_evil: 0.7 }
  },

  // ANARCHO-CAPITALIST (3)
  {
    id: 'walter_block',
    name: 'Walter Block',
    birth_year: 1941,
    death_year: null,
    dates: '1941–',
    birth_city: 'Brooklyn',
    birth_country_modern: 'United States',
    latitude: 40.6782,
    longitude: -73.9442,
    school_of_thought: 'Anarcho-Capitalism',
    school: 'Anarcho-Capitalist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Rothbardian anarcho-capitalism; utopian; anti-IP; NAP without objective law; subjectivist framework'],
    historical_weight: 0.5,
    battles: { reason_faith: 0.4, reality_mysticism: 0.3, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: 0.4, market_planning: 0.9, beauty_chaos: 0.4, good_evil: 0.3 }
  },
  {
    id: 'david_friedman',
    name: 'David Friedman',
    birth_year: 1945,
    death_year: null,
    dates: '1945–',
    birth_city: 'New York',
    birth_country_modern: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    school_of_thought: 'Anarcho-Capitalism',
    school: 'Anarcho-Capitalist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Consequentialist anarcho-capitalism; utopian; competing private defense agencies; utilitarian ethics; anti-IP'],
    historical_weight: 0.55,
    battles: { reason_faith: 0.3, reality_mysticism: 0.2, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: 0.3, market_planning: 0.9, beauty_chaos: 0.4, good_evil: 0.2 }
  },
  {
    id: 'hans_hermann_hoppe',
    name: 'Hans-Hermann Hoppe',
    birth_year: 1949,
    death_year: null,
    dates: '1949–',
    birth_city: 'Peine',
    birth_country_modern: 'Germany',
    latitude: 52.3167,
    longitude: 10.2167,
    school_of_thought: 'Anarcho-Capitalism',
    school: 'Anarcho-Capitalist',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Kantian argumentation ethics (transcendental deduction); utopian natural order; anti-democracy and anti-objective-law; praxeology; anti-IP'],
    historical_weight: 0.5,
    battles: { reason_faith: 0.2, reality_mysticism: 0.2, individual_collective: 0.3, freedom_coercion: 0.3, value_nihilism: 0.3, market_planning: 0.9, beauty_chaos: 0.3, good_evil: 0.2 }
  },

  // UTILITARIAN (1)
  {
    id: 'peter_singer',
    name: 'Peter Singer',
    birth_year: 1946,
    death_year: null,
    dates: '1946–',
    birth_city: 'Melbourne',
    birth_country_modern: 'Australia',
    latitude: -37.8136,
    longitude: 144.9631,
    school_of_thought: 'Preference Utilitarianism',
    school: 'Utilitarian',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Impartial utilitarianism; rational but demands self-sacrifice; animal rights dissolve human exceptionalism'],
    historical_weight: 0.65,
    battles: { reason_faith: 0.7, reality_mysticism: 0.7, individual_collective: -0.3, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: -0.2, beauty_chaos: 0.4, good_evil: 0.4 }
  },

  // LIBERAL (1)
  {
    id: 'martha_nussbaum',
    name: 'Martha Nussbaum',
    birth_year: 1947,
    death_year: null,
    dates: '1947–',
    birth_city: 'New York',
    birth_country_modern: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    school_of_thought: 'Capabilities Approach',
    school: 'Liberal',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Capabilities require redistribution overriding individual rights; cosmopolitan obligations deny national sovereignty'],
    historical_weight: 0.6,
    battles: { reason_faith: 0.6, reality_mysticism: 0.6, individual_collective: -0.2, freedom_coercion: 0.3, value_nihilism: 0.5, market_planning: -0.3, beauty_chaos: 0.5, good_evil: 0.5 }
  },

  // NATURALIST (CONTEMPORARY) (2)
  {
    id: 'daniel_dennett',
    name: 'Daniel Dennett',
    birth_year: 1942,
    death_year: 2024,
    dates: '1942–2024',
    birth_city: 'Boston',
    birth_country_modern: 'United States',
    latitude: 42.3601,
    longitude: -71.0589,
    school_of_thought: 'Naturalism',
    school: 'Naturalist (Contemporary)',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Consciousness explained; Darwinian reason'],
    historical_weight: 1.0,
    battles: { reason_faith: 0.9, reality_mysticism: 0.9, individual_collective: 0.6, freedom_coercion: 0.6, value_nihilism: 0.7, market_planning: 0.3, beauty_chaos: 0.5, good_evil: 0.6 }
  },
  {
    id: 'patricia_churchland',
    name: 'Patricia Churchland',
    birth_year: 1943,
    death_year: null,
    dates: '1943–',
    birth_city: 'Oliver',
    birth_country_modern: 'Canada',
    latitude: 49.1833,
    longitude: -119.5500,
    school_of_thought: 'Neurophilosophy',
    school: 'Naturalist (Contemporary)',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Neurophilosophy; eliminative materialism'],
    historical_weight: 0.55,
    battles: { reason_faith: 0.85, reality_mysticism: 0.9, individual_collective: 0.5, freedom_coercion: 0.5, value_nihilism: 0.6, market_planning: 0.0, beauty_chaos: 0.4, good_evil: 0.5 }
  },
  {
    id: 'sam_harris',
    name: 'Sam Harris',
    birth_year: 1967,
    death_year: null,
    dates: '1967–',
    birth_city: 'Los Angeles',
    birth_country_modern: 'United States',
    latitude: 34.0522,
    longitude: -118.2437,
    school_of_thought: 'New Atheism',
    school: 'Naturalist (Contemporary)',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Moral landscape; science can determine values; critique of religion and faith'],
    historical_weight: 0.7,
    battles: { reason_faith: 0.95, reality_mysticism: 0.95, individual_collective: 0.6, freedom_coercion: 0.7, value_nihilism: 0.8, market_planning: 0.2, beauty_chaos: 0.5, good_evil: 0.7 }
  },
  {
    id: 'christopher_hitchens',
    name: 'Christopher Hitchens',
    birth_year: 1949,
    death_year: 2011,
    dates: '1949–2011',
    birth_city: 'Portsmouth',
    birth_country_modern: 'United Kingdom',
    latitude: 50.8198,
    longitude: -1.0880,
    school_of_thought: 'New Atheism',
    school: 'Naturalist (Contemporary)',
    tradition: 'western',
    stance: 'pro',
    is_champion: false,
    key_ideas: ['Antitheism; religion poisons everything; Enlightenment values; free expression'],
    historical_weight: 0.75,
    battles: { reason_faith: 0.98, reality_mysticism: 0.95, individual_collective: 0.7, freedom_coercion: 0.8, value_nihilism: 0.8, market_planning: 0.3, beauty_chaos: 0.6, good_evil: 0.7 }
  },
  {
    id: 'richard_dawkins',
    name: 'Richard Dawkins',
    birth_year: 1941,
    death_year: null,
    dates: '1941–',
    birth_city: 'Nairobi',
    birth_country_modern: 'Kenya',
    latitude: -1.2921,
    longitude: 36.8219,
    school_of_thought: 'New Atheism',
    school: 'Naturalist (Contemporary)',
    tradition: 'western',
    stance: 'pro',
    is_champion: true,
    key_ideas: ['Selfish gene; memes; evolution as explanation; militant atheism; God delusion'],
    historical_weight: 0.85,
    battles: { reason_faith: 0.98, reality_mysticism: 0.95, individual_collective: 0.5, freedom_coercion: 0.6, value_nihilism: 0.7, market_planning: 0.3, beauty_chaos: 0.6, good_evil: 0.6 }
  },

  // CRITICAL THEORY (1 in Contemporary)
  {
    id: 'slavoj_zizek',
    name: 'Slavoj Žižek',
    birth_year: 1949,
    death_year: null,
    dates: '1949–',
    birth_city: 'Ljubljana',
    birth_country_modern: 'Slovenia',
    latitude: 46.0569,
    longitude: 14.5058,
    school_of_thought: 'Lacanian Marxism',
    school: 'Critical Theory',
    tradition: 'western',
    stance: 'anti',
    is_champion: false,
    key_ideas: ['Lacanian Marxism; the Real is inaccessible; ideology pervades all apparent rationality'],
    historical_weight: 0.6,
    battles: { reason_faith: 0.3, reality_mysticism: 0.2, individual_collective: -0.3, freedom_coercion: 0.3, value_nihilism: 0.2, market_planning: -0.4, beauty_chaos: 0.4, good_evil: 0.2 }
  },
];

// ═══════════════════════════════════════════════════════════
// SEED_EDGES - Influence relationships
// ═══════════════════════════════════════════════════════════
export const SEED_EDGES = [
  // CHINESE TRADITION
  { source_id: 'confucius', target_id: 'mencius', relationship_type: 'influenced', weight: 3 },
  { source_id: 'confucius', target_id: 'xunzi', relationship_type: 'influenced', weight: 3 },
  { source_id: 'xunzi', target_id: 'han_fei', relationship_type: 'influenced', weight: 3 },
  { source_id: 'laozi', target_id: 'zhuangzi', relationship_type: 'influenced', weight: 3 },
  { source_id: 'mozi', target_id: 'xunzi', relationship_type: 'influenced', weight: 2 },

  // INDIAN TRADITION
  { source_id: 'buddha', target_id: 'nagarjuna', relationship_type: 'influenced', weight: 3 },
  { source_id: 'shankara', target_id: 'ramanuja', relationship_type: 'reacted against', weight: 3 },
  { source_id: 'buddha', target_id: 'gandhi', relationship_type: 'influenced', weight: 2 },
  { source_id: 'mahavira', target_id: 'gandhi', relationship_type: 'influenced', weight: 2 },

  // CROSS-TRADITION (East-West)
  { source_id: 'buddha', target_id: 'schopenhauer', relationship_type: 'influenced', weight: 3 },

  // PRE-SOCRATIC CHAIN
  { source_id: 'thales', target_id: 'anaximander', relationship_type: 'influenced', weight: 3 },
  { source_id: 'anaximander', target_id: 'anaximenes', relationship_type: 'influenced', weight: 2 },
  { source_id: 'pythagoras', target_id: 'plato', relationship_type: 'influenced', weight: 3 },
  { source_id: 'parmenides', target_id: 'plato', relationship_type: 'influenced', weight: 3 },
  { source_id: 'parmenides', target_id: 'zeno_of_elea', relationship_type: 'influenced', weight: 3 },
  { source_id: 'heraclitus', target_id: 'plato', relationship_type: 'influenced', weight: 2 },
  { source_id: 'democritus', target_id: 'epicurus', relationship_type: 'influenced', weight: 3 },
  { source_id: 'anaxagoras', target_id: 'socrates', relationship_type: 'influenced', weight: 2 },

  // CLASSICAL
  { source_id: 'socrates', target_id: 'plato', relationship_type: 'influenced', weight: 3 },
  { source_id: 'plato', target_id: 'aristotle', relationship_type: 'influenced', weight: 3 },
  { source_id: 'plato', target_id: 'plotinus', relationship_type: 'influenced', weight: 3 },
  { source_id: 'aristotle', target_id: 'epicurus', relationship_type: 'influenced', weight: 2 },
  { source_id: 'aristotle', target_id: 'zeno_of_citium', relationship_type: 'influenced', weight: 2 },
  { source_id: 'aristotle', target_id: 'averroes', relationship_type: 'influenced', weight: 3 },
  { source_id: 'aristotle', target_id: 'thomas_aquinas', relationship_type: 'influenced', weight: 3 },
  { source_id: 'aristotle', target_id: 'al_farabi', relationship_type: 'influenced', weight: 3 },
  { source_id: 'aristotle', target_id: 'avicenna', relationship_type: 'influenced', weight: 3 },
  { source_id: 'aristotle', target_id: 'francis_bacon', relationship_type: 'influenced', weight: 2 },
  { source_id: 'aristotle', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 3 },
  { source_id: 'aristotle', target_id: 'allan_gotthelf', relationship_type: 'influenced', weight: 2 },

  // HELLENISTIC
  { source_id: 'epicurus', target_id: 'lucretius', relationship_type: 'influenced', weight: 3 },
  { source_id: 'zeno_of_citium', target_id: 'chrysippus', relationship_type: 'influenced', weight: 3 },
  { source_id: 'zeno_of_citium', target_id: 'cicero', relationship_type: 'influenced', weight: 2 },
  { source_id: 'zeno_of_citium', target_id: 'seneca', relationship_type: 'influenced', weight: 2 },
  { source_id: 'zeno_of_citium', target_id: 'epictetus', relationship_type: 'influenced', weight: 2 },
  { source_id: 'epictetus', target_id: 'marcus_aurelius', relationship_type: 'influenced', weight: 3 },
  { source_id: 'pyrrho', target_id: 'sextus_empiricus', relationship_type: 'influenced', weight: 3 },
  { source_id: 'pyrrho', target_id: 'carneades', relationship_type: 'influenced', weight: 2 },
  { source_id: 'plotinus', target_id: 'porphyry', relationship_type: 'influenced', weight: 3 },
  { source_id: 'plotinus', target_id: 'proclus', relationship_type: 'influenced', weight: 2 },

  // MEDIEVAL ISLAMIC
  { source_id: 'al_kindi', target_id: 'al_farabi', relationship_type: 'influenced', weight: 2 },
  { source_id: 'al_farabi', target_id: 'avicenna', relationship_type: 'influenced', weight: 2 },
  { source_id: 'avicenna', target_id: 'averroes', relationship_type: 'influenced', weight: 2 },
  { source_id: 'avicenna', target_id: 'thomas_aquinas', relationship_type: 'influenced', weight: 2 },
  { source_id: 'al_ghazali', target_id: 'averroes', relationship_type: 'reacted against', weight: 2 },

  // MEDIEVAL SCHOLASTIC
  { source_id: 'anselm', target_id: 'thomas_aquinas', relationship_type: 'influenced', weight: 2 },
  { source_id: 'thomas_aquinas', target_id: 'duns_scotus', relationship_type: 'influenced', weight: 2 },
  { source_id: 'thomas_aquinas', target_id: 'william_of_ockham', relationship_type: 'influenced', weight: 2 },

  // RENAISSANCE
  { source_id: 'plato', target_id: 'pico_della_mirandola', relationship_type: 'influenced', weight: 1 },
  { source_id: 'plato', target_id: 'erasmus', relationship_type: 'influenced', weight: 1 },
  { source_id: 'plotinus', target_id: 'pico_della_mirandola', relationship_type: 'influenced', weight: 3 },
  { source_id: 'proclus', target_id: 'pico_della_mirandola', relationship_type: 'influenced', weight: 2 },
  { source_id: 'plotinus', target_id: 'giordano_bruno', relationship_type: 'influenced', weight: 3 },
  { source_id: 'plotinus', target_id: 'meister_eckhart', relationship_type: 'influenced', weight: 3 },
  { source_id: 'cicero', target_id: 'erasmus', relationship_type: 'influenced', weight: 3 },
  { source_id: 'cicero', target_id: 'thomas_more', relationship_type: 'influenced', weight: 3 },
  { source_id: 'erasmus', target_id: 'thomas_more', relationship_type: 'influenced', weight: 3 },
  { source_id: 'seneca', target_id: 'montaigne', relationship_type: 'influenced', weight: 3 },
  { source_id: 'epictetus', target_id: 'montaigne', relationship_type: 'influenced', weight: 2 },
  { source_id: 'cicero', target_id: 'montaigne', relationship_type: 'influenced', weight: 2 },
  { source_id: 'montaigne', target_id: 'blaise_pascal', relationship_type: 'influenced', weight: 3 },
  { source_id: 'montaigne', target_id: 'rene_descartes', relationship_type: 'influenced', weight: 2 },
  { source_id: 'giordano_bruno', target_id: 'baruch_spinoza', relationship_type: 'influenced', weight: 2 },
  { source_id: 'francis_bacon', target_id: 'thomas_hobbes', relationship_type: 'influenced', weight: 2 },
  { source_id: 'francis_bacon', target_id: 'john_locke', relationship_type: 'influenced', weight: 2 },
  { source_id: 'francis_bacon', target_id: 'rene_descartes', relationship_type: 'influenced', weight: 2 },

  // EARLY MODERN RATIONALISM
  { source_id: 'rene_descartes', target_id: 'baruch_spinoza', relationship_type: 'influenced', weight: 3 },
  { source_id: 'rene_descartes', target_id: 'leibniz', relationship_type: 'influenced', weight: 3 },
  { source_id: 'rene_descartes', target_id: 'malebranche', relationship_type: 'influenced', weight: 3 },
  { source_id: 'rene_descartes', target_id: 'david_hume', relationship_type: 'influenced', weight: 2 },
  { source_id: 'baruch_spinoza', target_id: 'leibniz', relationship_type: 'influenced', weight: 2 },
  { source_id: 'baruch_spinoza', target_id: 'hegel', relationship_type: 'influenced', weight: 2 },
  { source_id: 'baruch_spinoza', target_id: 'jacobi', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leibniz', target_id: 'christian_wolff', relationship_type: 'influenced', weight: 3 },
  { source_id: 'leibniz', target_id: 'immanuel_kant', relationship_type: 'influenced', weight: 2 },
  { source_id: 'christian_wolff', target_id: 'immanuel_kant', relationship_type: 'influenced', weight: 3 },

  // EMPIRICISM INTO ENLIGHTENMENT
  { source_id: 'john_locke', target_id: 'david_hume', relationship_type: 'influenced', weight: 3 },
  { source_id: 'john_locke', target_id: 'george_berkeley', relationship_type: 'influenced', weight: 3 },
  { source_id: 'george_berkeley', target_id: 'david_hume', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_locke', target_id: 'voltaire', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_locke', target_id: 'rousseau', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_locke', target_id: 'condorcet', relationship_type: 'influenced', weight: 2 },
  { source_id: 'david_hume', target_id: 'immanuel_kant', relationship_type: 'influenced', weight: 3 },
  { source_id: 'david_hume', target_id: 'adam_smith', relationship_type: 'influenced', weight: 2 },
  { source_id: 'david_hume', target_id: 'jeremy_bentham', relationship_type: 'influenced', weight: 2 },
  { source_id: 'rousseau', target_id: 'immanuel_kant', relationship_type: 'influenced', weight: 2 },
  { source_id: 'rousseau', target_id: 'herder', relationship_type: 'influenced', weight: 2 },
  { source_id: 'rousseau', target_id: 'edmund_burke', relationship_type: 'influenced', weight: 2 },
  { source_id: 'rousseau', target_id: 'schiller', relationship_type: 'influenced', weight: 2 },

  // AMERICAN ENLIGHTENMENT
  { source_id: 'john_locke', target_id: 'thomas_jefferson', relationship_type: 'influenced', weight: 3 },
  { source_id: 'john_locke', target_id: 'john_adams', relationship_type: 'influenced', weight: 3 },
  { source_id: 'john_locke', target_id: 'thomas_paine', relationship_type: 'influenced', weight: 3 },
  { source_id: 'john_locke', target_id: 'james_madison', relationship_type: 'influenced', weight: 3 },
  { source_id: 'montesquieu', target_id: 'thomas_jefferson', relationship_type: 'influenced', weight: 3 },
  { source_id: 'montesquieu', target_id: 'john_adams', relationship_type: 'influenced', weight: 3 },
  { source_id: 'montesquieu', target_id: 'james_madison', relationship_type: 'influenced', weight: 3 },
  { source_id: 'cicero', target_id: 'john_adams', relationship_type: 'influenced', weight: 2 },
  { source_id: 'rousseau', target_id: 'thomas_paine', relationship_type: 'influenced', weight: 2 },
  { source_id: 'voltaire', target_id: 'thomas_jefferson', relationship_type: 'influenced', weight: 2 },
  { source_id: 'voltaire', target_id: 'thomas_paine', relationship_type: 'influenced', weight: 2 },
  { source_id: 'david_hume', target_id: 'james_madison', relationship_type: 'influenced', weight: 2 },
  { source_id: 'thomas_paine', target_id: 'thomas_jefferson', relationship_type: 'influenced', weight: 2 },
  { source_id: 'thomas_jefferson', target_id: 'james_madison', relationship_type: 'influenced', weight: 3 },

  // GERMAN IDEALISM
  { source_id: 'immanuel_kant', target_id: 'fichte', relationship_type: 'influenced', weight: 3 },
  { source_id: 'immanuel_kant', target_id: 'schelling', relationship_type: 'influenced', weight: 3 },
  { source_id: 'immanuel_kant', target_id: 'hegel', relationship_type: 'influenced', weight: 3 },
  { source_id: 'immanuel_kant', target_id: 'schopenhauer', relationship_type: 'influenced', weight: 3 },
  { source_id: 'immanuel_kant', target_id: 'herder', relationship_type: 'influenced', weight: 2 },
  { source_id: 'fichte', target_id: 'schelling', relationship_type: 'influenced', weight: 2 },
  { source_id: 'fichte', target_id: 'hegel', relationship_type: 'influenced', weight: 2 },
  { source_id: 'schelling', target_id: 'hegel', relationship_type: 'influenced', weight: 2 },
  { source_id: 'schelling', target_id: 'kierkegaard', relationship_type: 'influenced', weight: 2 },
  { source_id: 'hegel', target_id: 'karl_marx', relationship_type: 'influenced', weight: 3 },
  { source_id: 'hegel', target_id: 'kierkegaard', relationship_type: 'reacted against', weight: 3 },
  { source_id: 'hegel', target_id: 'nietzsche', relationship_type: 'reacted against', weight: 2 },
  { source_id: 'hegel', target_id: 'max_horkheimer', relationship_type: 'influenced', weight: 2 },
  { source_id: 'hegel', target_id: 'theodor_adorno', relationship_type: 'influenced', weight: 2 },

  // 19TH CENTURY
  { source_id: 'schopenhauer', target_id: 'nietzsche', relationship_type: 'influenced', weight: 3 },
  { source_id: 'schopenhauer', target_id: 'henri_bergson', relationship_type: 'influenced', weight: 2 },
  { source_id: 'nietzsche', target_id: 'martin_heidegger', relationship_type: 'influenced', weight: 3 },
  { source_id: 'nietzsche', target_id: 'michel_foucault', relationship_type: 'influenced', weight: 3 },
  { source_id: 'nietzsche', target_id: 'gilles_deleuze', relationship_type: 'influenced', weight: 2 },
  { source_id: 'nietzsche', target_id: 'lyotard', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_stuart_mill', target_id: 'herbert_spencer', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_stuart_mill', target_id: 'bertrand_russell', relationship_type: 'influenced', weight: 2 },
  { source_id: 'jeremy_bentham', target_id: 'john_stuart_mill', relationship_type: 'influenced', weight: 3 },
  { source_id: 'karl_marx', target_id: 'max_horkheimer', relationship_type: 'influenced', weight: 3 },
  { source_id: 'karl_marx', target_id: 'herbert_marcuse', relationship_type: 'influenced', weight: 3 },
  { source_id: 'karl_marx', target_id: 'louis_althusser', relationship_type: 'influenced', weight: 3 },
  { source_id: 'karl_marx', target_id: 'walter_benjamin', relationship_type: 'influenced', weight: 2 },

  // EXISTENTIALISM
  { source_id: 'kierkegaard', target_id: 'martin_heidegger', relationship_type: 'influenced', weight: 3 },
  { source_id: 'kierkegaard', target_id: 'jean_paul_sartre', relationship_type: 'influenced', weight: 2 },
  { source_id: 'martin_heidegger', target_id: 'jean_paul_sartre', relationship_type: 'influenced', weight: 3 },
  { source_id: 'martin_heidegger', target_id: 'jacques_derrida', relationship_type: 'influenced', weight: 3 },
  { source_id: 'martin_heidegger', target_id: 'michel_foucault', relationship_type: 'influenced', weight: 2 },
  { source_id: 'jean_paul_sartre', target_id: 'simone_de_beauvoir', relationship_type: 'influenced', weight: 3 },
  { source_id: 'jean_paul_sartre', target_id: 'albert_camus', relationship_type: 'influenced', weight: 2 },

  // ANALYTIC TRADITION
  { source_id: 'gottlob_frege', target_id: 'bertrand_russell', relationship_type: 'influenced', weight: 3 },
  { source_id: 'gottlob_frege', target_id: 'ludwig_wittgenstein', relationship_type: 'influenced', weight: 3 },
  { source_id: 'bertrand_russell', target_id: 'ludwig_wittgenstein', relationship_type: 'influenced', weight: 3 },
  { source_id: 'bertrand_russell', target_id: 'rudolf_carnap', relationship_type: 'influenced', weight: 2 },
  { source_id: 'bertrand_russell', target_id: 'a_j_ayer', relationship_type: 'influenced', weight: 2 },
  { source_id: 'bertrand_russell', target_id: 'w_v_o_quine', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ludwig_wittgenstein', target_id: 'gilbert_ryle', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ludwig_wittgenstein', target_id: 'richard_rorty', relationship_type: 'influenced', weight: 2 },
  { source_id: 'w_v_o_quine', target_id: 'david_lewis', relationship_type: 'influenced', weight: 2 },
  { source_id: 'w_v_o_quine', target_id: 'hilary_putnam', relationship_type: 'influenced', weight: 2 },
  { source_id: 'bertrand_russell', target_id: 'karl_popper', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ludwig_wittgenstein', target_id: 'karl_popper', relationship_type: 'reacted against', weight: 2 },
  { source_id: 'david_hume', target_id: 'karl_popper', relationship_type: 'influenced', weight: 2 },
  { source_id: 'karl_popper', target_id: 'thomas_kuhn', relationship_type: 'influenced', weight: 3 },
  { source_id: 'karl_popper', target_id: 'paul_feyerabend', relationship_type: 'influenced', weight: 3 },

  // PHENOMENOLOGY
  { source_id: 'edmund_husserl', target_id: 'martin_heidegger', relationship_type: 'influenced', weight: 3 },
  { source_id: 'edmund_husserl', target_id: 'merleau_ponty', relationship_type: 'influenced', weight: 3 },
  { source_id: 'edmund_husserl', target_id: 'jean_paul_sartre', relationship_type: 'influenced', weight: 2 },
  { source_id: 'edmund_husserl', target_id: 'emmanuel_levinas', relationship_type: 'influenced', weight: 2 },

  // PRAGMATISM
  { source_id: 'charles_peirce', target_id: 'william_james', relationship_type: 'influenced', weight: 3 },
  { source_id: 'charles_peirce', target_id: 'john_dewey', relationship_type: 'influenced', weight: 2 },
  { source_id: 'william_james', target_id: 'john_dewey', relationship_type: 'influenced', weight: 2 },
  { source_id: 'william_james', target_id: 'richard_rorty', relationship_type: 'influenced', weight: 2 },

  // FRANKFURT SCHOOL
  { source_id: 'max_horkheimer', target_id: 'theodor_adorno', relationship_type: 'influenced', weight: 3 },
  { source_id: 'max_horkheimer', target_id: 'herbert_marcuse', relationship_type: 'influenced', weight: 2 },
  { source_id: 'max_horkheimer', target_id: 'jurgen_habermas', relationship_type: 'influenced', weight: 2 },
  { source_id: 'theodor_adorno', target_id: 'jurgen_habermas', relationship_type: 'influenced', weight: 2 },

  // POSTMODERN
  { source_id: 'michel_foucault', target_id: 'jacques_derrida', relationship_type: 'influenced', weight: 2 },
  { source_id: 'michel_foucault', target_id: 'jean_baudrillard', relationship_type: 'influenced', weight: 2 },
  { source_id: 'thomas_kuhn', target_id: 'paul_feyerabend', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_rawls', target_id: 'robert_nozick', relationship_type: 'reacted against', weight: 2 },
  { source_id: 'john_rawls', target_id: 'martha_nussbaum', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // OBJECTIVIST LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'aristotle', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 3 },
  { source_id: 'john_locke', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 2 },
  { source_id: 'baruch_spinoza', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 1 },
  { source_id: 'nietzsche', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 2 },
  { source_id: 'immanuel_kant', target_id: 'ayn_rand', relationship_type: 'reacted against', weight: 3 },

  // Rand's direct disciples
  { source_id: 'ayn_rand', target_id: 'leonard_peikoff', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ayn_rand', target_id: 'nathaniel_branden', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ayn_rand', target_id: 'barbara_branden', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ayn_rand', target_id: 'harry_binswanger', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ayn_rand', target_id: 'allan_gotthelf', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ayn_rand', target_id: 'david_kelley', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ayn_rand', target_id: 'tibor_machan', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ayn_rand', target_id: 'peter_schwartz', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ayn_rand', target_id: 'michael_berliner', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ayn_rand', target_id: 'edwin_locke', relationship_type: 'influenced', weight: 2 },

  // Peikoff's influence (second generation orthodox)
  { source_id: 'leonard_peikoff', target_id: 'tara_smith', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'onkar_ghate', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'harry_binswanger', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'andrew_bernstein', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'yaron_brook', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'gregory_salmieri', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'craig_biddle', relationship_type: 'influenced', weight: 1 },
  { source_id: 'leonard_peikoff', target_id: 'peter_schwartz', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'michael_berliner', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'robert_mayhew', relationship_type: 'influenced', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'elan_journo', relationship_type: 'influenced', weight: 1 },
  { source_id: 'leonard_peikoff', target_id: 'darryl_wright', relationship_type: 'influenced', weight: 1 },
  { source_id: 'leonard_peikoff', target_id: 'ben_bayer', relationship_type: 'influenced', weight: 1 },
  { source_id: 'leonard_peikoff', target_id: 'don_watkins', relationship_type: 'influenced', weight: 1 },

  // Peikoff vs Kelley — the schism
  { source_id: 'leonard_peikoff', target_id: 'david_kelley', relationship_type: 'split from', weight: 2 },

  // Kelley's Post-Randian school
  { source_id: 'david_kelley', target_id: 'stephen_hicks', relationship_type: 'influenced', weight: 2 },
  { source_id: 'david_kelley', target_id: 'robert_tracinski', relationship_type: 'influenced', weight: 1 },
  { source_id: 'stephen_hicks', target_id: 'robert_tracinski', relationship_type: 'influenced', weight: 1 },

  // Allan Gotthelf's scholarly influence
  { source_id: 'allan_gotthelf', target_id: 'gregory_salmieri', relationship_type: 'influenced', weight: 2 },
  { source_id: 'allan_gotthelf', target_id: 'darryl_wright', relationship_type: 'influenced', weight: 2 },
  { source_id: 'allan_gotthelf', target_id: 'robert_mayhew', relationship_type: 'influenced', weight: 2 },

  // Nathaniel Branden's divergence
  { source_id: 'nathaniel_branden', target_id: 'david_kelley', relationship_type: 'influenced', weight: 1 },

  // Contemporary Objectivist work
  { source_id: 'tara_smith', target_id: 'gregory_salmieri', relationship_type: 'influenced', weight: 1 },
  { source_id: 'harry_binswanger', target_id: 'onkar_ghate', relationship_type: 'influenced', weight: 1 },
  { source_id: 'harry_binswanger', target_id: 'ben_bayer', relationship_type: 'influenced', weight: 1 },

  // Yaron Brook cross-influence
  { source_id: 'yaron_brook', target_id: 'don_watkins', relationship_type: 'influenced', weight: 2 },
  { source_id: 'yaron_brook', target_id: 'elan_journo', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // ANARCHO-CAPITALIST LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'john_locke', target_id: 'murray_rothbard', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ayn_rand', target_id: 'murray_rothbard', relationship_type: 'influenced', weight: 2 },
  { source_id: 'immanuel_kant', target_id: 'murray_rothbard', relationship_type: 'reacted against', weight: 1 },

  // Rothbard's school
  { source_id: 'murray_rothbard', target_id: 'walter_block', relationship_type: 'influenced', weight: 3 },
  { source_id: 'murray_rothbard', target_id: 'hans_hermann_hoppe', relationship_type: 'influenced', weight: 3 },

  // Friedman's distinct lineage
  { source_id: 'adam_smith', target_id: 'david_friedman', relationship_type: 'influenced', weight: 2 },
  { source_id: 'murray_rothbard', target_id: 'david_friedman', relationship_type: 'reacted against', weight: 1 },

  // Hoppe's extensions
  { source_id: 'hans_hermann_hoppe', target_id: 'walter_block', relationship_type: 'influenced', weight: 1 },

  // Rand/Objectivist tension with anarcho-capitalism
  { source_id: 'ayn_rand', target_id: 'murray_rothbard', relationship_type: 'reacted against', weight: 2 },
  { source_id: 'leonard_peikoff', target_id: 'murray_rothbard', relationship_type: 'reacted against', weight: 1 },
  { source_id: 'tibor_machan', target_id: 'murray_rothbard', relationship_type: 'reacted against', weight: 1 },

  // ═══════════════════════════════════════════════════════════
  // CHURCH FATHERS & MEDIEVAL
  // ═══════════════════════════════════════════════════════════
  { source_id: 'plotinus', target_id: 'augustine', relationship_type: 'influenced', weight: 3 },
  { source_id: 'plato', target_id: 'augustine', relationship_type: 'influenced', weight: 2 },
  { source_id: 'augustine', target_id: 'thomas_aquinas', relationship_type: 'influenced', weight: 3 },
  { source_id: 'augustine', target_id: 'anselm', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // EARLY MODERN ADDITIONS
  // ═══════════════════════════════════════════════════════════
  { source_id: 'la_boetie', target_id: 'montaigne', relationship_type: 'influenced', weight: 3 },
  { source_id: 'hugo_grotius', target_id: 'john_locke', relationship_type: 'influenced', weight: 2 },
  { source_id: 'hugo_grotius', target_id: 'thomas_hobbes', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_milton', target_id: 'john_locke', relationship_type: 'influenced', weight: 2 },
  { source_id: 'algernon_sidney', target_id: 'john_locke', relationship_type: 'influenced', weight: 2 },
  { source_id: 'algernon_sidney', target_id: 'thomas_jefferson', relationship_type: 'influenced', weight: 2 },
  { source_id: 'isaac_newton', target_id: 'voltaire', relationship_type: 'influenced', weight: 3 },
  { source_id: 'isaac_newton', target_id: 'immanuel_kant', relationship_type: 'influenced', weight: 2 },
  { source_id: 'isaac_newton', target_id: 'david_hume', relationship_type: 'influenced', weight: 2 },
  { source_id: 'francis_bacon', target_id: 'isaac_newton', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // ENLIGHTENMENT ABOLITIONIST LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'john_locke', target_id: 'mary_wollstonecraft', relationship_type: 'influenced', weight: 2 },
  { source_id: 'rousseau', target_id: 'mary_wollstonecraft', relationship_type: 'reacted against', weight: 2 },
  { source_id: 'wilhelm_von_humboldt', target_id: 'john_stuart_mill', relationship_type: 'influenced', weight: 3 },
  { source_id: 'immanuel_kant', target_id: 'wilhelm_von_humboldt', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // 19TH CENTURY CLASSICAL LIBERAL / ABOLITIONIST
  // ═══════════════════════════════════════════════════════════
  { source_id: 'adam_smith', target_id: 'frederic_bastiat', relationship_type: 'influenced', weight: 3 },
  { source_id: 'jean_baptiste_say', target_id: 'frederic_bastiat', relationship_type: 'influenced', weight: 2 },
  { source_id: 'montesquieu', target_id: 'alexis_de_tocqueville', relationship_type: 'influenced', weight: 3 },
  { source_id: 'edmund_burke', target_id: 'alexis_de_tocqueville', relationship_type: 'influenced', weight: 2 },
  { source_id: 'thomas_paine', target_id: 'frederick_douglass', relationship_type: 'influenced', weight: 2 },
  { source_id: 'john_locke', target_id: 'frederick_douglass', relationship_type: 'influenced', weight: 2 },
  { source_id: 'frederic_bastiat', target_id: 'lord_acton', relationship_type: 'influenced', weight: 2 },
  { source_id: 'alexis_de_tocqueville', target_id: 'lord_acton', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // TRANSCENDENTALIST LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'immanuel_kant', target_id: 'ralph_waldo_emerson', relationship_type: 'influenced', weight: 2 },
  { source_id: 'plotinus', target_id: 'ralph_waldo_emerson', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ralph_waldo_emerson', target_id: 'henry_david_thoreau', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ralph_waldo_emerson', target_id: 'nietzsche', relationship_type: 'influenced', weight: 2 },
  { source_id: 'henry_david_thoreau', target_id: 'gandhi', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // EGOIST LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'hegel', target_id: 'max_stirner', relationship_type: 'reacted against', weight: 3 },
  { source_id: 'max_stirner', target_id: 'nietzsche', relationship_type: 'influenced', weight: 2 },
  { source_id: 'max_stirner', target_id: 'mikhail_bakunin', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // VOLUNTARYIST LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'john_locke', target_id: 'lysander_spooner', relationship_type: 'influenced', weight: 2 },
  { source_id: 'lysander_spooner', target_id: 'murray_rothbard', relationship_type: 'influenced', weight: 2 },
  { source_id: 'herbert_spencer', target_id: 'auberon_herbert', relationship_type: 'influenced', weight: 3 },
  { source_id: 'auberon_herbert', target_id: 'albert_jay_nock', relationship_type: 'influenced', weight: 2 },
  { source_id: 'albert_jay_nock', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 1 },
  { source_id: 'h_l_mencken', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 1 },
  { source_id: 'isabel_paterson', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 3 },
  { source_id: 'rose_wilder_lane', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // ANARCHO-COMMUNIST LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'pierre_joseph_proudhon', target_id: 'mikhail_bakunin', relationship_type: 'influenced', weight: 3 },
  { source_id: 'pierre_joseph_proudhon', target_id: 'peter_kropotkin', relationship_type: 'influenced', weight: 2 },
  { source_id: 'mikhail_bakunin', target_id: 'peter_kropotkin', relationship_type: 'influenced', weight: 2 },
  { source_id: 'mikhail_bakunin', target_id: 'emma_goldman', relationship_type: 'influenced', weight: 2 },
  { source_id: 'peter_kropotkin', target_id: 'emma_goldman', relationship_type: 'influenced', weight: 2 },
  { source_id: 'karl_marx', target_id: 'friedrich_engels', relationship_type: 'influenced', weight: 3 },
  { source_id: 'friedrich_engels', target_id: 'karl_marx', relationship_type: 'influenced', weight: 2 },
  { source_id: 'karl_marx', target_id: 'mikhail_bakunin', relationship_type: 'reacted against', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // AUSTRIAN ECONOMICS LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'adam_smith', target_id: 'carl_menger', relationship_type: 'influenced', weight: 2 },
  { source_id: 'carl_menger', target_id: 'eugen_bohm_bawerk', relationship_type: 'influenced', weight: 3 },
  { source_id: 'carl_menger', target_id: 'ludwig_von_mises', relationship_type: 'influenced', weight: 3 },
  { source_id: 'eugen_bohm_bawerk', target_id: 'ludwig_von_mises', relationship_type: 'influenced', weight: 3 },
  { source_id: 'eugen_bohm_bawerk', target_id: 'karl_marx', relationship_type: 'reacted against', weight: 2 },
  { source_id: 'immanuel_kant', target_id: 'ludwig_von_mises', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ludwig_von_mises', target_id: 'friedrich_hayek', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ludwig_von_mises', target_id: 'henry_hazlitt', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ludwig_von_mises', target_id: 'murray_rothbard', relationship_type: 'influenced', weight: 3 },
  { source_id: 'ludwig_von_mises', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 2 },
  { source_id: 'friedrich_hayek', target_id: 'milton_friedman', relationship_type: 'influenced', weight: 2 },
  { source_id: 'henry_hazlitt', target_id: 'ayn_rand', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // CHICAGO SCHOOL LINEAGE
  // ═══════════════════════════════════════════════════════════
  { source_id: 'milton_friedman', target_id: 'george_stigler', relationship_type: 'influenced', weight: 2 },
  { source_id: 'george_stigler', target_id: 'milton_friedman', relationship_type: 'influenced', weight: 2 },
  { source_id: 'milton_friedman', target_id: 'gary_becker', relationship_type: 'influenced', weight: 3 },
  { source_id: 'george_stigler', target_id: 'gary_becker', relationship_type: 'influenced', weight: 2 },
  { source_id: 'milton_friedman', target_id: 'thomas_sowell', relationship_type: 'influenced', weight: 3 },
  { source_id: 'friedrich_hayek', target_id: 'thomas_sowell', relationship_type: 'influenced', weight: 2 },
  { source_id: 'thomas_sowell', target_id: 'ayn_rand', relationship_type: 'reacted against', weight: 1 },

  // ═══════════════════════════════════════════════════════════
  // ANALYTIC ADDITIONS
  // ═══════════════════════════════════════════════════════════
  { source_id: 'bertrand_russell', target_id: 'alfred_whitehead', relationship_type: 'influenced', weight: 3 },
  { source_id: 'alfred_whitehead', target_id: 'bertrand_russell', relationship_type: 'influenced', weight: 2 },
  { source_id: 'gottlob_frege', target_id: 'saul_kripke', relationship_type: 'influenced', weight: 2 },
  { source_id: 'ludwig_wittgenstein', target_id: 'john_searle', relationship_type: 'influenced', weight: 2 },
  { source_id: 'saul_kripke', target_id: 'hilary_putnam', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // EXISTENTIALIST ADDITIONS
  // ═══════════════════════════════════════════════════════════
  { source_id: 'immanuel_kant', target_id: 'karl_jaspers', relationship_type: 'influenced', weight: 2 },
  { source_id: 'kierkegaard', target_id: 'karl_jaspers', relationship_type: 'influenced', weight: 2 },
  { source_id: 'karl_jaspers', target_id: 'hannah_arendt', relationship_type: 'influenced', weight: 2 },

  // ═══════════════════════════════════════════════════════════
  // NEW ATHEISTS (Four Horsemen)
  // ═══════════════════════════════════════════════════════════
  // Darwin's influence on New Atheists
  { source_id: 'darwin', target_id: 'richard_dawkins', relationship_type: 'influenced', weight: 3 },
  { source_id: 'darwin', target_id: 'daniel_dennett', relationship_type: 'influenced', weight: 3 },
  { source_id: 'darwin', target_id: 'sam_harris', relationship_type: 'influenced', weight: 2 },
  { source_id: 'darwin', target_id: 'christopher_hitchens', relationship_type: 'influenced', weight: 2 },
  // Hume's influence (empiricism, skepticism of miracles)
  { source_id: 'david_hume', target_id: 'richard_dawkins', relationship_type: 'influenced', weight: 2 },
  { source_id: 'david_hume', target_id: 'christopher_hitchens', relationship_type: 'influenced', weight: 2 },
  { source_id: 'david_hume', target_id: 'sam_harris', relationship_type: 'influenced', weight: 2 },
  // Bertrand Russell's influence (public atheism)
  { source_id: 'bertrand_russell', target_id: 'richard_dawkins', relationship_type: 'influenced', weight: 2 },
  { source_id: 'bertrand_russell', target_id: 'christopher_hitchens', relationship_type: 'influenced', weight: 2 },
  { source_id: 'bertrand_russell', target_id: 'sam_harris', relationship_type: 'influenced', weight: 2 },
  // Four Horsemen mutual influences
  { source_id: 'daniel_dennett', target_id: 'richard_dawkins', relationship_type: 'influenced', weight: 2 },
  { source_id: 'richard_dawkins', target_id: 'daniel_dennett', relationship_type: 'influenced', weight: 2 },
  { source_id: 'richard_dawkins', target_id: 'sam_harris', relationship_type: 'influenced', weight: 2 },
  { source_id: 'richard_dawkins', target_id: 'christopher_hitchens', relationship_type: 'influenced', weight: 2 },
  { source_id: 'christopher_hitchens', target_id: 'sam_harris', relationship_type: 'influenced', weight: 1 },
];

export default { SEED_NODES, SEED_EDGES, SCHOOL_COLORS, SCHOOL_STANCES };
