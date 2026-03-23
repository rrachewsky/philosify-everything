// ============================================================
// Constellation Seed Data - Verified Historical Philosopher Data
// ALL DATA MUST BE HISTORICALLY ACCURATE AND VERIFIABLE
// ============================================================

// PHILOSOPHERS - The Constellation Nodes
// Negative years = BC (e.g., -470 = 470 BC)
export const SEED_NODES = [
  // ═══════════════════════════════════════════════════════════
  // TRUNK 1: GREEK/WESTERN TRADITION
  // ═══════════════════════════════════════════════════════════
  
  // PRE-SOCRATICS
  {
    id: 'thales',
    name: 'Thales',
    birth_year: -624,
    death_year: -546,
    birth_city: 'Miletus',
    birth_country_modern: 'Turkey',
    latitude: 37.5306,
    longitude: 27.2783,
    school_of_thought: 'Milesian School',
    tradition: 'western',
    key_ideas: [
      'Water is the fundamental substance of all things',
      'All things are full of gods (panpsychism)',
      'First to seek natural explanations over myth'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.6,
      individual_collective: 0.3,
      freedom_coercion: 0.3,
      value_nihilism: 0.5,
      market_planning: 0.0,
      beauty_chaos: 0.4,
      good_evil: 0.4
    }
  },
  {
    id: 'pythagoras',
    name: 'Pythagoras',
    birth_year: -570,
    death_year: -495,
    birth_city: 'Samos',
    birth_country_modern: 'Greece',
    latitude: 37.7573,
    longitude: 26.9738,
    school_of_thought: 'Pythagoreanism',
    tradition: 'western',
    key_ideas: [
      'Numbers are the essence of all things',
      'The soul is immortal and transmigrates',
      'Harmony and proportion govern the cosmos'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.5,
      reality_mysticism: 0.3,
      individual_collective: 0.4,
      freedom_coercion: 0.3,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.9,
      good_evil: 0.6
    }
  },
  {
    id: 'heraclitus',
    name: 'Heraclitus',
    birth_year: -535,
    death_year: -475,
    birth_city: 'Ephesus',
    birth_country_modern: 'Turkey',
    latitude: 37.9394,
    longitude: 27.3417,
    school_of_thought: 'Heracliteanism',
    tradition: 'western',
    key_ideas: [
      'Everything flows; you cannot step in the same river twice',
      'Fire is the primordial element; all is flux',
      'Logos (reason) governs all change'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.4,
      individual_collective: 0.5,
      freedom_coercion: 0.4,
      value_nihilism: 0.6,
      market_planning: 0.0,
      beauty_chaos: 0.3,
      good_evil: 0.5
    }
  },
  {
    id: 'parmenides',
    name: 'Parmenides',
    birth_year: -515,
    death_year: -450,
    birth_city: 'Elea',
    birth_country_modern: 'Italy',
    latitude: 40.1619,
    longitude: 15.1511,
    school_of_thought: 'Eleatic School',
    tradition: 'western',
    key_ideas: [
      'Being is one, eternal, and unchanging',
      'Change and motion are illusions',
      'Only reason can grasp true reality'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.7,
      individual_collective: 0.4,
      freedom_coercion: 0.3,
      value_nihilism: 0.6,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.5
    }
  },
  {
    id: 'democritus',
    name: 'Democritus',
    birth_year: -460,
    death_year: -370,
    birth_city: 'Abdera',
    birth_country_modern: 'Greece',
    latitude: 40.9500,
    longitude: 24.9833,
    school_of_thought: 'Atomism',
    tradition: 'western',
    key_ideas: [
      'Reality consists of atoms moving through void',
      'All qualities emerge from atomic arrangement',
      'Cheerfulness (euthymia) is the highest good'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.9,
      individual_collective: 0.6,
      freedom_coercion: 0.5,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },

  // CLASSICAL ATHENS
  {
    id: 'socrates',
    name: 'Socrates',
    birth_year: -470,
    death_year: -399,
    birth_city: 'Athens',
    birth_country_modern: 'Greece',
    latitude: 37.9838,
    longitude: 23.7275,
    school_of_thought: 'Socratic Method',
    tradition: 'western',
    key_ideas: [
      'The unexamined life is not worth living',
      'Knowledge is virtue; ignorance is the root of evil',
      'I know that I know nothing (Socratic irony)'
    ],
    historical_weight: 1.0,
    battles: {
      reason_faith: 1.0,
      reality_mysticism: 0.8,
      individual_collective: 0.7,
      freedom_coercion: 0.6,
      value_nihilism: 1.0,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.9
    }
  },
  {
    id: 'plato',
    name: 'Plato',
    birth_year: -428,
    death_year: -348,
    birth_city: 'Athens',
    birth_country_modern: 'Greece',
    latitude: 37.9838,
    longitude: 23.7275,
    school_of_thought: 'Platonism',
    tradition: 'western',
    key_ideas: [
      'The Forms are the true reality; matter is shadow',
      'The soul is immortal and has three parts',
      'The philosopher-king should rule the ideal state'
    ],
    historical_weight: 1.0,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.5,
      individual_collective: 0.3,
      freedom_coercion: 0.2,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.9,
      good_evil: 0.8
    }
  },
  {
    id: 'aristotle',
    name: 'Aristotle',
    birth_year: -384,
    death_year: -322,
    birth_city: 'Stagira',
    birth_country_modern: 'Greece',
    latitude: 40.5269,
    longitude: 23.7525,
    school_of_thought: 'Aristotelianism',
    tradition: 'western',
    key_ideas: [
      'Eudaimonia (flourishing) is the highest good',
      'Reality is knowable through reason and observation',
      'Virtue is the mean between extremes'
    ],
    historical_weight: 1.0,
    battles: {
      reason_faith: 1.0,
      reality_mysticism: 1.0,
      individual_collective: 0.7,
      freedom_coercion: 0.6,
      value_nihilism: 1.0,
      market_planning: 0.4,
      beauty_chaos: 0.8,
      good_evil: 0.9
    }
  },

  // HELLENISTIC
  {
    id: 'epicurus',
    name: 'Epicurus',
    birth_year: -341,
    death_year: -270,
    birth_city: 'Samos',
    birth_country_modern: 'Greece',
    latitude: 37.7573,
    longitude: 26.9738,
    school_of_thought: 'Epicureanism',
    tradition: 'western',
    key_ideas: [
      'Pleasure (absence of pain) is the highest good',
      'The gods exist but do not intervene in human affairs',
      'Death is nothing to us; the soul dissolves at death'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.9,
      individual_collective: 0.8,
      freedom_coercion: 0.7,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'zeno_citium',
    name: 'Zeno of Citium',
    birth_year: -334,
    death_year: -262,
    birth_city: 'Citium',
    birth_country_modern: 'Cyprus',
    latitude: 34.9182,
    longitude: 33.6296,
    school_of_thought: 'Stoicism',
    tradition: 'western',
    key_ideas: [
      'Live according to nature and reason',
      'Virtue is the only good; externals are indifferent',
      'The universe is governed by divine providence (logos)'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.6,
      individual_collective: 0.5,
      freedom_coercion: 0.6,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.9
    }
  },

  // ROMAN
  {
    id: 'cicero',
    name: 'Cicero',
    birth_year: -106,
    death_year: -43,
    birth_city: 'Arpinum',
    birth_country_modern: 'Italy',
    latitude: 41.6494,
    longitude: 13.6083,
    school_of_thought: 'Eclectic / Academic Skepticism',
    tradition: 'western',
    key_ideas: [
      'Natural law is the foundation of justice',
      'The best life combines contemplation and action',
      'Rhetoric is essential to civic virtue'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.6,
      individual_collective: 0.5,
      freedom_coercion: 0.6,
      value_nihilism: 0.7,
      market_planning: 0.3,
      beauty_chaos: 0.7,
      good_evil: 0.7
    }
  },
  {
    id: 'seneca',
    name: 'Seneca',
    birth_year: -4,
    death_year: 65,
    birth_city: 'Corduba',
    birth_country_modern: 'Spain',
    latitude: 37.8882,
    longitude: -4.7794,
    school_of_thought: 'Stoicism',
    tradition: 'western',
    key_ideas: [
      'Virtue is sufficient for happiness',
      'We suffer more in imagination than in reality',
      'Time is our most precious resource'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.6,
      individual_collective: 0.6,
      freedom_coercion: 0.6,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.9
    }
  },
  {
    id: 'marcus_aurelius',
    name: 'Marcus Aurelius',
    birth_year: 121,
    death_year: 180,
    birth_city: 'Rome',
    birth_country_modern: 'Italy',
    latitude: 41.9028,
    longitude: 12.4964,
    school_of_thought: 'Stoicism',
    tradition: 'western',
    key_ideas: [
      'Focus only on what you can control',
      'All is change; accept impermanence',
      'Duty to the common good above personal desire'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.5,
      individual_collective: 0.4,
      freedom_coercion: 0.5,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.9
    }
  },
  {
    id: 'plotinus',
    name: 'Plotinus',
    birth_year: 204,
    death_year: 270,
    birth_city: 'Lycopolis',
    birth_country_modern: 'Egypt',
    latitude: 27.1783,
    longitude: 31.1859,
    school_of_thought: 'Neoplatonism',
    tradition: 'western',
    key_ideas: [
      'The One is the source of all reality',
      'Reality emanates from the One in levels',
      'The soul ascends through contemplation to unity'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.5,
      reality_mysticism: 0.2,
      individual_collective: 0.5,
      freedom_coercion: 0.4,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.9,
      good_evil: 0.8
    }
  },

  // LATE ANTIQUITY / MEDIEVAL
  {
    id: 'augustine',
    name: 'Augustine of Hippo',
    birth_year: 354,
    death_year: 430,
    birth_city: 'Thagaste',
    birth_country_modern: 'Algeria',
    latitude: 36.2772,
    longitude: 7.9536,
    school_of_thought: 'Christian Platonism',
    tradition: 'western',
    key_ideas: [
      'Original sin corrupts human will',
      'The City of God vs the City of Man',
      'Evil is the absence of good, not a substance'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: 0.3,
      individual_collective: 0.3,
      freedom_coercion: 0.3,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.8
    }
  },
  {
    id: 'boethius',
    name: 'Boethius',
    birth_year: 477,
    death_year: 524,
    birth_city: 'Rome',
    birth_country_modern: 'Italy',
    latitude: 41.9028,
    longitude: 12.4964,
    school_of_thought: 'Neoplatonism / Scholasticism',
    tradition: 'western',
    key_ideas: [
      'Philosophy is the consolation of the soul',
      'Fortune is a wheel; accept its turning',
      'True happiness lies in the Good itself'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.5,
      reality_mysticism: 0.4,
      individual_collective: 0.5,
      freedom_coercion: 0.4,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.8
    }
  },
  {
    id: 'aquinas',
    name: 'Thomas Aquinas',
    birth_year: 1225,
    death_year: 1274,
    birth_city: 'Roccasecca',
    birth_country_modern: 'Italy',
    latitude: 41.5063,
    longitude: 13.6686,
    school_of_thought: 'Thomism / Scholasticism',
    tradition: 'western',
    key_ideas: [
      'Faith and reason are compatible; both lead to truth',
      'Five ways to prove God\'s existence',
      'Natural law is participation in eternal law'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.5,
      reality_mysticism: 0.6,
      individual_collective: 0.4,
      freedom_coercion: 0.4,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.9
    }
  },
  {
    id: 'ockham',
    name: 'William of Ockham',
    birth_year: 1287,
    death_year: 1347,
    birth_city: 'Ockham',
    birth_country_modern: 'United Kingdom',
    latitude: 51.2833,
    longitude: -0.4333,
    school_of_thought: 'Nominalism',
    tradition: 'western',
    key_ideas: [
      'Entities should not be multiplied beyond necessity',
      'Universals are names, not real entities',
      'Faith and reason have separate domains'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.7,
      individual_collective: 0.6,
      freedom_coercion: 0.5,
      value_nihilism: 0.5,
      market_planning: 0.0,
      beauty_chaos: 0.4,
      good_evil: 0.5
    }
  },

  // RENAISSANCE / EARLY MODERN
  {
    id: 'machiavelli',
    name: 'Niccolo Machiavelli',
    birth_year: 1469,
    death_year: 1527,
    birth_city: 'Florence',
    birth_country_modern: 'Italy',
    latitude: 43.7696,
    longitude: 11.2558,
    school_of_thought: 'Political Realism',
    tradition: 'western',
    key_ideas: [
      'The ends justify the means in politics',
      'It is better to be feared than loved',
      'Virtue (virtu) is effective political action'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.8,
      individual_collective: 0.5,
      freedom_coercion: 0.3,
      value_nihilism: 0.4,
      market_planning: 0.0,
      beauty_chaos: 0.3,
      good_evil: 0.2
    }
  },
  {
    id: 'bacon',
    name: 'Francis Bacon',
    birth_year: 1561,
    death_year: 1626,
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Empiricism',
    tradition: 'western',
    key_ideas: [
      'Knowledge is power',
      'The scientific method: observation and induction',
      'Idols of the mind distort understanding'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.9,
      individual_collective: 0.6,
      freedom_coercion: 0.5,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'hobbes',
    name: 'Thomas Hobbes',
    birth_year: 1588,
    death_year: 1679,
    birth_city: 'Westport',
    birth_country_modern: 'United Kingdom',
    latitude: 51.3492,
    longitude: -2.3467,
    school_of_thought: 'Social Contract Theory',
    tradition: 'western',
    key_ideas: [
      'Life without government is solitary, poor, nasty, brutish, short',
      'The social contract creates the Leviathan state',
      'All matter is in motion; thought is computation'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.9,
      individual_collective: 0.3,
      freedom_coercion: 0.2,
      value_nihilism: 0.5,
      market_planning: 0.0,
      beauty_chaos: 0.3,
      good_evil: 0.4
    }
  },
  {
    id: 'descartes',
    name: 'Rene Descartes',
    birth_year: 1596,
    death_year: 1650,
    birth_city: 'La Haye en Touraine',
    birth_country_modern: 'France',
    latitude: 47.0000,
    longitude: 0.7500,
    school_of_thought: 'Rationalism',
    tradition: 'western',
    key_ideas: [
      'I think, therefore I am (Cogito ergo sum)',
      'Mind and body are distinct substances (dualism)',
      'Clear and distinct ideas are the mark of truth'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.8,
      individual_collective: 0.7,
      freedom_coercion: 0.5,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.6
    }
  },
  {
    id: 'spinoza',
    name: 'Baruch Spinoza',
    birth_year: 1632,
    death_year: 1677,
    birth_city: 'Amsterdam',
    birth_country_modern: 'Netherlands',
    latitude: 52.3676,
    longitude: 4.9041,
    school_of_thought: 'Rationalism / Pantheism',
    tradition: 'western',
    key_ideas: [
      'God and Nature are one substance (Deus sive Natura)',
      'Freedom is understanding necessity',
      'Emotions arise from inadequate ideas'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.6,
      individual_collective: 0.5,
      freedom_coercion: 0.6,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.7
    }
  },
  {
    id: 'locke',
    name: 'John Locke',
    birth_year: 1632,
    death_year: 1704,
    birth_city: 'Wrington',
    birth_country_modern: 'United Kingdom',
    latitude: 51.3667,
    longitude: -2.7667,
    school_of_thought: 'Empiricism / Liberalism',
    tradition: 'western',
    key_ideas: [
      'The mind is a blank slate (tabula rasa)',
      'Natural rights: life, liberty, and property',
      'Government derives legitimacy from consent'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.8,
      individual_collective: 0.9,
      freedom_coercion: 0.9,
      value_nihilism: 0.7,
      market_planning: 0.7,
      beauty_chaos: 0.5,
      good_evil: 0.7
    }
  },
  {
    id: 'leibniz',
    name: 'Gottfried Wilhelm Leibniz',
    birth_year: 1646,
    death_year: 1716,
    birth_city: 'Leipzig',
    birth_country_modern: 'Germany',
    latitude: 51.3397,
    longitude: 12.3731,
    school_of_thought: 'Rationalism',
    tradition: 'western',
    key_ideas: [
      'Monads are the ultimate simple substances',
      'This is the best of all possible worlds',
      'Pre-established harmony explains mind-body coordination'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.5,
      individual_collective: 0.6,
      freedom_coercion: 0.5,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.8,
      good_evil: 0.8
    }
  },

  // ENLIGHTENMENT
  {
    id: 'hume',
    name: 'David Hume',
    birth_year: 1711,
    death_year: 1776,
    birth_city: 'Edinburgh',
    birth_country_modern: 'United Kingdom',
    latitude: 55.9533,
    longitude: -3.1883,
    school_of_thought: 'Empiricism / Skepticism',
    tradition: 'western',
    key_ideas: [
      'All ideas derive from sense impressions',
      'Causation is habit, not necessity',
      'Reason is the slave of the passions'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.9,
      individual_collective: 0.7,
      freedom_coercion: 0.6,
      value_nihilism: 0.5,
      market_planning: 0.5,
      beauty_chaos: 0.5,
      good_evil: 0.4
    }
  },
  {
    id: 'rousseau',
    name: 'Jean-Jacques Rousseau',
    birth_year: 1712,
    death_year: 1778,
    birth_city: 'Geneva',
    birth_country_modern: 'Switzerland',
    latitude: 46.2044,
    longitude: 6.1432,
    school_of_thought: 'Social Contract / Romanticism',
    tradition: 'western',
    key_ideas: [
      'Man is born free, but everywhere he is in chains',
      'The general will is the basis of legitimate government',
      'Civilization corrupts natural human goodness'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: 0.3,
      individual_collective: -0.3,
      freedom_coercion: 0.2,
      value_nihilism: 0.6,
      market_planning: -0.3,
      beauty_chaos: 0.5,
      good_evil: 0.4
    }
  },
  {
    id: 'adam_smith',
    name: 'Adam Smith',
    birth_year: 1723,
    death_year: 1790,
    birth_city: 'Kirkcaldy',
    birth_country_modern: 'United Kingdom',
    latitude: 56.1118,
    longitude: -3.1596,
    school_of_thought: 'Classical Liberalism',
    tradition: 'western',
    key_ideas: [
      'The invisible hand coordinates markets',
      'Division of labor increases productivity',
      'Self-interest can serve the common good'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.8,
      individual_collective: 0.8,
      freedom_coercion: 0.8,
      value_nihilism: 0.8,
      market_planning: 0.9,
      beauty_chaos: 0.5,
      good_evil: 0.7
    }
  },
  {
    id: 'kant',
    name: 'Immanuel Kant',
    birth_year: 1724,
    death_year: 1804,
    birth_city: 'Konigsberg',
    birth_country_modern: 'Russia',
    latitude: 54.7104,
    longitude: 20.4522,
    school_of_thought: 'Transcendental Idealism',
    tradition: 'western',
    key_ideas: [
      'The mind shapes experience through categories',
      'Act only according to maxims you could universalize',
      'We cannot know things-in-themselves'
    ],
    historical_weight: 1.0,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.4,
      individual_collective: 0.5,
      freedom_coercion: 0.6,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.8,
      good_evil: 0.8
    }
  },
  {
    id: 'burke',
    name: 'Edmund Burke',
    birth_year: 1729,
    death_year: 1797,
    birth_city: 'Dublin',
    birth_country_modern: 'Ireland',
    latitude: 53.3498,
    longitude: -6.2603,
    school_of_thought: 'Conservatism',
    tradition: 'western',
    key_ideas: [
      'Tradition embodies accumulated wisdom',
      'Society is a contract across generations',
      'Gradual reform, not violent revolution'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: 0.4,
      individual_collective: 0.4,
      freedom_coercion: 0.6,
      value_nihilism: 0.7,
      market_planning: 0.5,
      beauty_chaos: 0.7,
      good_evil: 0.7
    }
  },
  {
    id: 'bentham',
    name: 'Jeremy Bentham',
    birth_year: 1748,
    death_year: 1832,
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Utilitarianism',
    tradition: 'western',
    key_ideas: [
      'The greatest happiness for the greatest number',
      'Pleasure and pain are the sovereign masters',
      'All laws should maximize utility'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.8,
      individual_collective: 0.3,
      freedom_coercion: 0.5,
      value_nihilism: 0.6,
      market_planning: 0.3,
      beauty_chaos: 0.3,
      good_evil: 0.5
    }
  },

  // 19TH CENTURY
  {
    id: 'hegel',
    name: 'Georg Wilhelm Friedrich Hegel',
    birth_year: 1770,
    death_year: 1831,
    birth_city: 'Stuttgart',
    birth_country_modern: 'Germany',
    latitude: 48.7758,
    longitude: 9.1829,
    school_of_thought: 'German Idealism',
    tradition: 'western',
    key_ideas: [
      'History moves through thesis, antithesis, synthesis',
      'The real is the rational',
      'Spirit (Geist) unfolds through history'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.4,
      reality_mysticism: 0.2,
      individual_collective: -0.2,
      freedom_coercion: 0.2,
      value_nihilism: 0.7,
      market_planning: -0.2,
      beauty_chaos: 0.6,
      good_evil: 0.5
    }
  },
  {
    id: 'schopenhauer',
    name: 'Arthur Schopenhauer',
    birth_year: 1788,
    death_year: 1860,
    birth_city: 'Danzig',
    birth_country_modern: 'Poland',
    latitude: 54.3520,
    longitude: 18.6466,
    school_of_thought: 'Pessimism / Voluntarism',
    tradition: 'western',
    key_ideas: [
      'The world is will and representation',
      'Life is suffering driven by blind will',
      'Escape through art, compassion, or asceticism'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.3,
      individual_collective: 0.6,
      freedom_coercion: 0.5,
      value_nihilism: -0.3,
      market_planning: 0.0,
      beauty_chaos: 0.8,
      good_evil: 0.3
    }
  },
  {
    id: 'comte',
    name: 'Auguste Comte',
    birth_year: 1798,
    death_year: 1857,
    birth_city: 'Montpellier',
    birth_country_modern: 'France',
    latitude: 43.6108,
    longitude: 3.8767,
    school_of_thought: 'Positivism',
    tradition: 'western',
    key_ideas: [
      'Knowledge progresses through three stages',
      'Only observable phenomena constitute knowledge',
      'Sociology as the science of society'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.9,
      individual_collective: -0.3,
      freedom_coercion: 0.0,
      value_nihilism: 0.5,
      market_planning: -0.2,
      beauty_chaos: 0.3,
      good_evil: 0.4
    }
  },
  {
    id: 'mill',
    name: 'John Stuart Mill',
    birth_year: 1806,
    death_year: 1873,
    birth_city: 'London',
    birth_country_modern: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    school_of_thought: 'Utilitarianism / Liberalism',
    tradition: 'western',
    key_ideas: [
      'Higher pleasures are qualitatively superior',
      'The harm principle limits government power',
      'Liberty is essential for individual development'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.8,
      individual_collective: 0.7,
      freedom_coercion: 0.8,
      value_nihilism: 0.7,
      market_planning: 0.4,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'kierkegaard',
    name: 'Soren Kierkegaard',
    birth_year: 1813,
    death_year: 1855,
    birth_city: 'Copenhagen',
    birth_country_modern: 'Denmark',
    latitude: 55.6761,
    longitude: 12.5683,
    school_of_thought: 'Existentialism',
    tradition: 'western',
    key_ideas: [
      'Existence precedes essence (for individuals)',
      'The leap of faith transcends reason',
      'Authenticity requires subjective commitment'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: -0.2,
      reality_mysticism: 0.3,
      individual_collective: 0.9,
      freedom_coercion: 0.7,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.7
    }
  },
  {
    id: 'marx',
    name: 'Karl Marx',
    birth_year: 1818,
    death_year: 1883,
    birth_city: 'Trier',
    birth_country_modern: 'Germany',
    latitude: 49.7567,
    longitude: 6.6414,
    school_of_thought: 'Marxism',
    tradition: 'western',
    key_ideas: [
      'History is class struggle',
      'Capitalism alienates workers from their labor',
      'Religion is the opium of the people'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.7,
      individual_collective: -1.0,
      freedom_coercion: -0.6,
      value_nihilism: 0.4,
      market_planning: -1.0,
      beauty_chaos: 0.0,
      good_evil: 0.2
    }
  },
  {
    id: 'nietzsche',
    name: 'Friedrich Nietzsche',
    birth_year: 1844,
    death_year: 1900,
    birth_city: 'Rocken',
    birth_country_modern: 'Germany',
    latitude: 51.2167,
    longitude: 12.1167,
    school_of_thought: 'Existentialism / Nihilism',
    tradition: 'western',
    key_ideas: [
      'God is dead; we have killed him',
      'The Ubermensch creates new values',
      'Will to power is the fundamental drive'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.6,
      individual_collective: 0.9,
      freedom_coercion: 0.7,
      value_nihilism: 0.3,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.2
    }
  },

  // 20TH CENTURY
  {
    id: 'husserl',
    name: 'Edmund Husserl',
    birth_year: 1859,
    death_year: 1938,
    birth_city: 'Prostejov',
    birth_country_modern: 'Czech Republic',
    latitude: 49.4719,
    longitude: 17.1114,
    school_of_thought: 'Phenomenology',
    tradition: 'western',
    key_ideas: [
      'To the things themselves!',
      'Bracket assumptions to study consciousness',
      'Intentionality: consciousness is always of something'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.5,
      individual_collective: 0.6,
      freedom_coercion: 0.5,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'russell',
    name: 'Bertrand Russell',
    birth_year: 1872,
    death_year: 1970,
    birth_city: 'Trellech',
    birth_country_modern: 'United Kingdom',
    latitude: 51.7500,
    longitude: -2.7333,
    school_of_thought: 'Analytic Philosophy',
    tradition: 'western',
    key_ideas: [
      'Logic is the essence of philosophy',
      'Descriptions theory resolves puzzles of reference',
      'Knowledge by acquaintance vs description'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 1.0,
      reality_mysticism: 0.9,
      individual_collective: 0.7,
      freedom_coercion: 0.7,
      value_nihilism: 0.6,
      market_planning: 0.2,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'wittgenstein',
    name: 'Ludwig Wittgenstein',
    birth_year: 1889,
    death_year: 1951,
    birth_city: 'Vienna',
    birth_country_modern: 'Austria',
    latitude: 48.2082,
    longitude: 16.3738,
    school_of_thought: 'Analytic Philosophy',
    tradition: 'western',
    key_ideas: [
      'The limits of my language are the limits of my world',
      'Meaning is use in a language game',
      'Philosophy is therapy for conceptual confusion'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.5,
      individual_collective: 0.5,
      freedom_coercion: 0.4,
      value_nihilism: 0.5,
      market_planning: 0.0,
      beauty_chaos: 0.4,
      good_evil: 0.4
    }
  },
  {
    id: 'heidegger',
    name: 'Martin Heidegger',
    birth_year: 1889,
    death_year: 1976,
    birth_city: 'Messkirch',
    birth_country_modern: 'Germany',
    latitude: 47.9939,
    longitude: 9.1122,
    school_of_thought: 'Phenomenology / Existentialism',
    tradition: 'western',
    key_ideas: [
      'Being-in-the-world is our fundamental condition',
      'Dasein is thrown into existence',
      'Technology reveals and conceals Being'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: 0.2,
      individual_collective: 0.4,
      freedom_coercion: 0.3,
      value_nihilism: 0.4,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.3
    }
  },
  {
    id: 'popper',
    name: 'Karl Popper',
    birth_year: 1902,
    death_year: 1994,
    birth_city: 'Vienna',
    birth_country_modern: 'Austria',
    latitude: 48.2082,
    longitude: 16.3738,
    school_of_thought: 'Critical Rationalism',
    tradition: 'western',
    key_ideas: [
      'Falsifiability is the criterion of science',
      'Open society vs its enemies',
      'Piecemeal social engineering, not utopian planning'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.9,
      individual_collective: 0.8,
      freedom_coercion: 0.8,
      value_nihilism: 0.7,
      market_planning: 0.6,
      beauty_chaos: 0.5,
      good_evil: 0.7
    }
  },
  {
    id: 'sartre',
    name: 'Jean-Paul Sartre',
    birth_year: 1905,
    death_year: 1980,
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Existentialism',
    tradition: 'western',
    key_ideas: [
      'Existence precedes essence',
      'We are condemned to be free',
      'Bad faith is self-deception about freedom'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.6,
      individual_collective: 0.5,
      freedom_coercion: 0.6,
      value_nihilism: 0.4,
      market_planning: -0.3,
      beauty_chaos: 0.3,
      good_evil: 0.3
    }
  },
  {
    id: 'rand',
    name: 'Ayn Rand',
    birth_year: 1905,
    death_year: 1982,
    birth_city: 'Saint Petersburg',
    birth_country_modern: 'Russia',
    latitude: 59.9311,
    longitude: 30.3609,
    school_of_thought: 'Objectivism',
    tradition: 'western',
    key_ideas: [
      'Reason is mans only means of knowledge',
      'Rational self-interest is the proper moral purpose',
      'Individual rights are absolute and inalienable'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 1.0,
      reality_mysticism: 1.0,
      individual_collective: 1.0,
      freedom_coercion: 1.0,
      value_nihilism: 1.0,
      market_planning: 1.0,
      beauty_chaos: 0.9,
      good_evil: 0.9
    }
  },
  {
    id: 'arendt',
    name: 'Hannah Arendt',
    birth_year: 1906,
    death_year: 1975,
    birth_city: 'Linden',
    birth_country_modern: 'Germany',
    latitude: 52.3667,
    longitude: 9.7333,
    school_of_thought: 'Political Philosophy',
    tradition: 'western',
    key_ideas: [
      'The banality of evil in totalitarianism',
      'Action is the highest human capacity',
      'The public realm is where freedom appears'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.7,
      individual_collective: 0.6,
      freedom_coercion: 0.8,
      value_nihilism: 0.7,
      market_planning: 0.3,
      beauty_chaos: 0.5,
      good_evil: 0.8
    }
  },
  {
    id: 'beauvoir',
    name: 'Simone de Beauvoir',
    birth_year: 1908,
    death_year: 1986,
    birth_city: 'Paris',
    birth_country_modern: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    school_of_thought: 'Existentialism / Feminism',
    tradition: 'western',
    key_ideas: [
      'One is not born, but becomes, a woman',
      'The Other: women defined by male perspective',
      'Freedom requires material conditions'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.6,
      individual_collective: 0.5,
      freedom_coercion: 0.6,
      value_nihilism: 0.5,
      market_planning: -0.2,
      beauty_chaos: 0.4,
      good_evil: 0.5
    }
  },
  {
    id: 'camus',
    name: 'Albert Camus',
    birth_year: 1913,
    death_year: 1960,
    birth_city: 'Mondovi',
    birth_country_modern: 'Algeria',
    latitude: 36.4667,
    longitude: 7.4333,
    school_of_thought: 'Absurdism',
    tradition: 'western',
    key_ideas: [
      'The absurd: life has no inherent meaning',
      'One must imagine Sisyphus happy',
      'Revolt against absurdity without nihilism'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.7,
      individual_collective: 0.7,
      freedom_coercion: 0.7,
      value_nihilism: 0.3,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'rawls',
    name: 'John Rawls',
    birth_year: 1921,
    death_year: 2002,
    birth_city: 'Baltimore',
    birth_country_modern: 'United States',
    latitude: 39.2904,
    longitude: -76.6122,
    school_of_thought: 'Political Liberalism',
    tradition: 'western',
    key_ideas: [
      'Justice as fairness behind a veil of ignorance',
      'The difference principle: inequalities benefit the worst-off',
      'Primary goods: what rational persons want'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.7,
      individual_collective: 0.2,
      freedom_coercion: 0.4,
      value_nihilism: 0.6,
      market_planning: -0.3,
      beauty_chaos: 0.4,
      good_evil: 0.6
    }
  },
  {
    id: 'foucault',
    name: 'Michel Foucault',
    birth_year: 1926,
    death_year: 1984,
    birth_city: 'Poitiers',
    birth_country_modern: 'France',
    latitude: 46.5802,
    longitude: 0.3404,
    school_of_thought: 'Post-structuralism',
    tradition: 'western',
    key_ideas: [
      'Power-knowledge: truth is a product of power',
      'Discipline creates docile bodies',
      'Genealogy uncovers contingent origins'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: 0.2,
      individual_collective: 0.0,
      freedom_coercion: 0.2,
      value_nihilism: -0.2,
      market_planning: -0.2,
      beauty_chaos: -0.2,
      good_evil: 0.0
    }
  },
  {
    id: 'hayek',
    name: 'Friedrich Hayek',
    birth_year: 1899,
    death_year: 1992,
    birth_city: 'Vienna',
    birth_country_modern: 'Austria',
    latitude: 48.2082,
    longitude: 16.3738,
    school_of_thought: 'Classical Liberalism',
    tradition: 'western',
    key_ideas: [
      'The knowledge problem makes central planning impossible',
      'Spontaneous order emerges from individual action',
      'The road to serfdom: planning leads to tyranny'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.8,
      individual_collective: 0.9,
      freedom_coercion: 0.9,
      value_nihilism: 0.7,
      market_planning: 1.0,
      beauty_chaos: 0.5,
      good_evil: 0.7
    }
  },
  {
    id: 'mises',
    name: 'Ludwig von Mises',
    birth_year: 1881,
    death_year: 1973,
    birth_city: 'Lemberg',
    birth_country_modern: 'Ukraine',
    latitude: 49.8397,
    longitude: 24.0297,
    school_of_thought: 'Austrian Economics',
    tradition: 'western',
    key_ideas: [
      'Human action is purposeful behavior',
      'Economic calculation requires market prices',
      'Socialism cannot rationally allocate resources'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.9,
      reality_mysticism: 0.9,
      individual_collective: 0.9,
      freedom_coercion: 0.9,
      value_nihilism: 0.7,
      market_planning: 1.0,
      beauty_chaos: 0.4,
      good_evil: 0.7
    }
  },

  // ═══════════════════════════════════════════════════════════
  // TRUNK 2: CHINESE TRADITION
  // ═══════════════════════════════════════════════════════════
  {
    id: 'laozi',
    name: 'Laozi',
    birth_year: -571,
    death_year: -471,
    birth_city: 'Luoyi',
    birth_country_modern: 'China',
    latitude: 34.6197,
    longitude: 112.4540,
    school_of_thought: 'Taoism',
    tradition: 'chinese',
    key_ideas: [
      'The Tao that can be told is not the eternal Tao',
      'Wu wei: action through non-action',
      'Simplicity, patience, compassion'
    ],
    historical_weight: 0.9,
    battles: {
      reason_faith: 0.2,
      reality_mysticism: -0.2,
      individual_collective: 0.5,
      freedom_coercion: 0.7,
      value_nihilism: 0.6,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'confucius',
    name: 'Confucius',
    birth_year: -551,
    death_year: -479,
    birth_city: 'Qufu',
    birth_country_modern: 'China',
    latitude: 35.5961,
    longitude: 116.9913,
    school_of_thought: 'Confucianism',
    tradition: 'chinese',
    key_ideas: [
      'Ren (benevolence) is the supreme virtue',
      'Li (ritual propriety) maintains social harmony',
      'The junzi (noble person) cultivates virtue'
    ],
    historical_weight: 1.0,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.6,
      individual_collective: 0.0,
      freedom_coercion: 0.3,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.9
    }
  },
  {
    id: 'mozi',
    name: 'Mozi',
    birth_year: -470,
    death_year: -391,
    birth_city: 'Lu State',
    birth_country_modern: 'China',
    latitude: 35.5961,
    longitude: 116.9913,
    school_of_thought: 'Mohism',
    tradition: 'chinese',
    key_ideas: [
      'Universal love without partiality',
      'Consequentialist ethics: benefit to all',
      'Opposition to offensive warfare'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.7,
      individual_collective: -0.3,
      freedom_coercion: 0.5,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.3,
      good_evil: 0.8
    }
  },
  {
    id: 'mencius',
    name: 'Mencius',
    birth_year: -372,
    death_year: -289,
    birth_city: 'Zoucheng',
    birth_country_modern: 'China',
    latitude: 35.4047,
    longitude: 116.9658,
    school_of_thought: 'Confucianism',
    tradition: 'chinese',
    key_ideas: [
      'Human nature is inherently good',
      'Benevolent government serves the people',
      'The four beginnings: compassion, shame, courtesy, right/wrong'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.6,
      individual_collective: 0.2,
      freedom_coercion: 0.4,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.9
    }
  },
  {
    id: 'zhuangzi',
    name: 'Zhuangzi',
    birth_year: -369,
    death_year: -286,
    birth_city: 'Meng',
    birth_country_modern: 'China',
    latitude: 34.4300,
    longitude: 115.6500,
    school_of_thought: 'Taoism',
    tradition: 'chinese',
    key_ideas: [
      'The butterfly dream: what is reality?',
      'Embrace spontaneity and naturalness',
      'All perspectives are relative'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: -0.1,
      individual_collective: 0.7,
      freedom_coercion: 0.8,
      value_nihilism: 0.5,
      market_planning: 0.0,
      beauty_chaos: 0.4,
      good_evil: 0.5
    }
  },
  {
    id: 'xunzi',
    name: 'Xunzi',
    birth_year: -310,
    death_year: -235,
    birth_city: 'Zhao',
    birth_country_modern: 'China',
    latitude: 37.8706,
    longitude: 114.5305,
    school_of_thought: 'Confucianism',
    tradition: 'chinese',
    key_ideas: [
      'Human nature is evil; goodness is acquired',
      'Ritual and education transform nature',
      'Order requires hierarchy and discipline'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.7,
      individual_collective: -0.2,
      freedom_coercion: 0.2,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  },
  {
    id: 'han_fei',
    name: 'Han Fei',
    birth_year: -280,
    death_year: -233,
    birth_city: 'Han State',
    birth_country_modern: 'China',
    latitude: 34.7500,
    longitude: 113.6500,
    school_of_thought: 'Legalism',
    tradition: 'chinese',
    key_ideas: [
      'Law and punishment maintain order',
      'The ruler must be strong and impersonal',
      'Human nature is self-interested'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.8,
      individual_collective: -0.5,
      freedom_coercion: -0.7,
      value_nihilism: 0.3,
      market_planning: -0.5,
      beauty_chaos: 0.2,
      good_evil: 0.2
    }
  },

  // ═══════════════════════════════════════════════════════════
  // TRUNK 3: INDIAN TRADITION
  // ═══════════════════════════════════════════════════════════
  {
    id: 'mahavira',
    name: 'Mahavira',
    birth_year: -599,
    death_year: -527,
    birth_city: 'Vaishali',
    birth_country_modern: 'India',
    latitude: 25.9833,
    longitude: 85.1333,
    school_of_thought: 'Jainism',
    tradition: 'indian',
    key_ideas: [
      'Ahimsa: non-violence is the supreme dharma',
      'Many-sidedness of truth (anekantavada)',
      'Liberation through asceticism and non-attachment'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.4,
      reality_mysticism: 0.3,
      individual_collective: 0.6,
      freedom_coercion: 0.8,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.9
    }
  },
  {
    id: 'buddha',
    name: 'Siddhartha Gautama',
    birth_year: -563,
    death_year: -483,
    birth_city: 'Lumbini',
    birth_country_modern: 'Nepal',
    latitude: 27.4833,
    longitude: 83.2833,
    school_of_thought: 'Buddhism',
    tradition: 'indian',
    key_ideas: [
      'The Four Noble Truths: suffering, cause, cessation, path',
      'The Eightfold Path to liberation',
      'Impermanence and non-self (anatta)'
    ],
    historical_weight: 1.0,
    battles: {
      reason_faith: 0.5,
      reality_mysticism: 0.1,
      individual_collective: 0.5,
      freedom_coercion: 0.7,
      value_nihilism: 0.6,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.8
    }
  },
  {
    id: 'nagarjuna',
    name: 'Nagarjuna',
    birth_year: 150,
    death_year: 250,
    birth_city: 'Vidarbha',
    birth_country_modern: 'India',
    latitude: 20.7500,
    longitude: 78.7500,
    school_of_thought: 'Madhyamaka Buddhism',
    tradition: 'indian',
    key_ideas: [
      'Emptiness (sunyata): all phenomena lack inherent existence',
      'The two truths: conventional and ultimate',
      'The middle way between eternalism and nihilism'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.5,
      reality_mysticism: -0.2,
      individual_collective: 0.4,
      freedom_coercion: 0.5,
      value_nihilism: 0.5,
      market_planning: 0.0,
      beauty_chaos: 0.4,
      good_evil: 0.6
    }
  },
  {
    id: 'shankara',
    name: 'Adi Shankara',
    birth_year: 788,
    death_year: 820,
    birth_city: 'Kaladi',
    birth_country_modern: 'India',
    latitude: 10.1675,
    longitude: 76.4411,
    school_of_thought: 'Advaita Vedanta',
    tradition: 'indian',
    key_ideas: [
      'Brahman alone is real; the world is illusion (maya)',
      'Atman is identical with Brahman',
      'Liberation through knowledge, not action'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.4,
      reality_mysticism: -0.3,
      individual_collective: 0.6,
      freedom_coercion: 0.5,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.7
    }
  },
  {
    id: 'ramanuja',
    name: 'Ramanuja',
    birth_year: 1017,
    death_year: 1137,
    birth_city: 'Sriperumbudur',
    birth_country_modern: 'India',
    latitude: 12.9667,
    longitude: 79.9500,
    school_of_thought: 'Vishishtadvaita Vedanta',
    tradition: 'indian',
    key_ideas: [
      'Qualified non-dualism: souls are real parts of Brahman',
      'Devotion (bhakti) is the path to liberation',
      'God is personal and accessible'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: 0.1,
      individual_collective: 0.4,
      freedom_coercion: 0.5,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.8
    }
  },
  {
    id: 'gandhi',
    name: 'Mahatma Gandhi',
    birth_year: 1869,
    death_year: 1948,
    birth_city: 'Porbandar',
    birth_country_modern: 'India',
    latitude: 21.6417,
    longitude: 69.6293,
    school_of_thought: 'Satyagraha / Nonviolence',
    tradition: 'indian',
    key_ideas: [
      'Satyagraha: truth-force as political weapon',
      'Ahimsa: non-violence in thought, word, and deed',
      'Swaraj: self-rule begins with self-discipline'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.3,
      reality_mysticism: 0.3,
      individual_collective: 0.3,
      freedom_coercion: 0.9,
      value_nihilism: 0.9,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 1.0
    }
  },

  // ═══════════════════════════════════════════════════════════
  // TRUNK 4: ISLAMIC TRADITION
  // ═══════════════════════════════════════════════════════════
  {
    id: 'al_kindi',
    name: 'Al-Kindi',
    birth_year: 801,
    death_year: 873,
    birth_city: 'Kufa',
    birth_country_modern: 'Iraq',
    latitude: 32.0167,
    longitude: 44.4000,
    school_of_thought: 'Islamic Philosophy',
    tradition: 'islamic',
    key_ideas: [
      'Philosophy and revelation are compatible',
      'First Islamic philosopher to engage Greek thought',
      'The intellect as connection to divine truth'
    ],
    historical_weight: 0.5,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.5,
      individual_collective: 0.4,
      freedom_coercion: 0.4,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.7
    }
  },
  {
    id: 'al_farabi',
    name: 'Al-Farabi',
    birth_year: 872,
    death_year: 950,
    birth_city: 'Farab',
    birth_country_modern: 'Kazakhstan',
    latitude: 42.3000,
    longitude: 68.2167,
    school_of_thought: 'Islamic Neoplatonism',
    tradition: 'islamic',
    key_ideas: [
      'The virtuous city ruled by philosopher-prophet',
      'Emanation from the One to the many',
      'Philosophy and religion express same truths differently'
    ],
    historical_weight: 0.6,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.4,
      individual_collective: 0.3,
      freedom_coercion: 0.4,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.7
    }
  },
  {
    id: 'avicenna',
    name: 'Avicenna (Ibn Sina)',
    birth_year: 980,
    death_year: 1037,
    birth_city: 'Afshana',
    birth_country_modern: 'Uzbekistan',
    latitude: 39.7500,
    longitude: 64.4167,
    school_of_thought: 'Islamic Aristotelianism',
    tradition: 'islamic',
    key_ideas: [
      'The Necessary Existent: God exists by nature',
      'Essence-existence distinction in contingent beings',
      'The Flying Man: proof of souls self-awareness'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.7,
      reality_mysticism: 0.5,
      individual_collective: 0.5,
      freedom_coercion: 0.4,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.7,
      good_evil: 0.7
    }
  },
  {
    id: 'al_ghazali',
    name: 'Al-Ghazali',
    birth_year: 1058,
    death_year: 1111,
    birth_city: 'Tus',
    birth_country_modern: 'Iran',
    latitude: 36.4500,
    longitude: 59.5000,
    school_of_thought: 'Asharism / Sufism',
    tradition: 'islamic',
    key_ideas: [
      'Incoherence of the Philosophers: critique of falsafa',
      'Occasionalism: God is the only true cause',
      'Mystical experience surpasses rational argument'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: -0.2,
      reality_mysticism: -0.3,
      individual_collective: 0.3,
      freedom_coercion: 0.3,
      value_nihilism: 0.7,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.8
    }
  },
  {
    id: 'averroes',
    name: 'Averroes (Ibn Rushd)',
    birth_year: 1126,
    death_year: 1198,
    birth_city: 'Cordoba',
    birth_country_modern: 'Spain',
    latitude: 37.8882,
    longitude: -4.7794,
    school_of_thought: 'Islamic Aristotelianism',
    tradition: 'islamic',
    key_ideas: [
      'Philosophy is obligatory for those capable of it',
      'Natural causation is real, not merely divine habit',
      'Transmitted Aristotle to medieval Europe'
    ],
    historical_weight: 0.8,
    battles: {
      reason_faith: 0.8,
      reality_mysticism: 0.8,
      individual_collective: 0.5,
      freedom_coercion: 0.5,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.7
    }
  },
  {
    id: 'maimonides',
    name: 'Maimonides',
    birth_year: 1138,
    death_year: 1204,
    birth_city: 'Cordoba',
    birth_country_modern: 'Spain',
    latitude: 37.8882,
    longitude: -4.7794,
    school_of_thought: 'Jewish Aristotelianism',
    tradition: 'islamic',
    key_ideas: [
      'Guide for the Perplexed: reconciling faith and reason',
      'Negative theology: we can only say what God is not',
      'The 13 principles of Jewish faith'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.6,
      individual_collective: 0.5,
      freedom_coercion: 0.4,
      value_nihilism: 0.8,
      market_planning: 0.0,
      beauty_chaos: 0.6,
      good_evil: 0.8
    }
  },
  {
    id: 'ibn_khaldun',
    name: 'Ibn Khaldun',
    birth_year: 1332,
    death_year: 1406,
    birth_city: 'Tunis',
    birth_country_modern: 'Tunisia',
    latitude: 36.8065,
    longitude: 10.1815,
    school_of_thought: 'Philosophy of History',
    tradition: 'islamic',
    key_ideas: [
      'Asabiyyah: group solidarity as historical force',
      'Civilizations rise and fall in cycles',
      'Founder of sociology and historiography'
    ],
    historical_weight: 0.7,
    battles: {
      reason_faith: 0.6,
      reality_mysticism: 0.7,
      individual_collective: 0.0,
      freedom_coercion: 0.3,
      value_nihilism: 0.6,
      market_planning: 0.0,
      beauty_chaos: 0.5,
      good_evil: 0.6
    }
  }
];

// ═══════════════════════════════════════════════════════════
// EDGES - Intellectual Connections
// ═══════════════════════════════════════════════════════════
export const SEED_EDGES = [
  // PRE-SOCRATICS → CLASSICAL
  { source_id: 'thales', target_id: 'pythagoras', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.5, description: 'Pythagoras inherited natural philosophy from Milesian tradition' },
  { source_id: 'heraclitus', target_id: 'socrates', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.6, description: 'Heraclitus doctrine of flux influenced Socratic dialectic' },
  { source_id: 'parmenides', target_id: 'plato', relationship_type: 'influenced_by', primary_battle: 'reality_mysticism', weight: 0.8, description: 'Parmenides Being-thinking inspired Platonic Forms' },
  
  // SOCRATIC LINEAGE
  { source_id: 'socrates', target_id: 'plato', relationship_type: 'teacher_of', primary_battle: 'reason_faith', weight: 1.0, description: 'Socrates was Platos teacher; Plato recorded the dialogues' },
  { source_id: 'plato', target_id: 'aristotle', relationship_type: 'teacher_of', primary_battle: 'reality_mysticism', weight: 1.0, description: 'Aristotle studied at Platos Academy for 20 years' },
  { source_id: 'plato', target_id: 'aristotle', relationship_type: 'opposes', primary_battle: 'reality_mysticism', weight: 0.9, description: 'Aristotle rejected separate Forms: universals exist in particulars' },
  
  // HELLENISTIC
  { source_id: 'democritus', target_id: 'epicurus', relationship_type: 'influenced_by', primary_battle: 'reality_mysticism', weight: 0.9, description: 'Epicurus adopted atomism from Democritus' },
  { source_id: 'socrates', target_id: 'zeno_citium', relationship_type: 'influenced_by', primary_battle: 'good_evil', weight: 0.7, description: 'Stoicism traced its ethics back to Socratic virtue' },
  
  // ROMAN STOICS
  { source_id: 'zeno_citium', target_id: 'seneca', relationship_type: 'influenced_by', primary_battle: 'good_evil', weight: 0.8, description: 'Seneca was a major interpreter of Stoic philosophy' },
  { source_id: 'seneca', target_id: 'marcus_aurelius', relationship_type: 'influenced_by', primary_battle: 'good_evil', weight: 0.7, description: 'Marcus Aurelius studied Stoic texts including Seneca' },
  
  // NEOPLATONISM
  { source_id: 'plato', target_id: 'plotinus', relationship_type: 'influenced_by', primary_battle: 'reality_mysticism', weight: 0.9, description: 'Plotinus systematized Platonic metaphysics into Neoplatonism' },
  { source_id: 'plotinus', target_id: 'augustine', relationship_type: 'influenced_by', primary_battle: 'reality_mysticism', weight: 0.8, description: 'Augustine converted through Neoplatonic books' },
  
  // MEDIEVAL
  { source_id: 'aristotle', target_id: 'aquinas', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.9, description: 'Aquinas synthesized Aristotle with Christian theology' },
  { source_id: 'averroes', target_id: 'aquinas', relationship_type: 'transmitted_by', primary_battle: 'reason_faith', weight: 0.8, description: 'Averroes commentaries transmitted Aristotle to Latin West' },
  { source_id: 'aquinas', target_id: 'ockham', relationship_type: 'opposes', primary_battle: 'reality_mysticism', weight: 0.6, description: 'Ockham nominalism rejected Thomistic realism' },
  
  // ISLAMIC TRANSMISSION
  { source_id: 'aristotle', target_id: 'al_farabi', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.9, description: 'Al-Farabi was the Second Teacher after Aristotle' },
  { source_id: 'al_farabi', target_id: 'avicenna', relationship_type: 'influenced_by', primary_battle: 'reality_mysticism', weight: 0.8, description: 'Avicenna built on Al-Farabis Neoplatonic Aristotelianism' },
  { source_id: 'avicenna', target_id: 'al_ghazali', relationship_type: 'opposes', primary_battle: 'reason_faith', weight: 0.9, description: 'Al-Ghazali attacked Avicennas rationalism in The Incoherence' },
  { source_id: 'al_ghazali', target_id: 'averroes', relationship_type: 'opposes', primary_battle: 'reason_faith', weight: 0.9, description: 'Averroes wrote The Incoherence of the Incoherence against Al-Ghazali' },
  
  // EARLY MODERN
  { source_id: 'bacon', target_id: 'hobbes', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.5, description: 'Hobbes served as Bacons secretary and absorbed empiricism' },
  { source_id: 'descartes', target_id: 'spinoza', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.8, description: 'Spinoza radicalized Cartesian rationalism' },
  { source_id: 'descartes', target_id: 'leibniz', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.7, description: 'Leibniz engaged critically with Cartesian philosophy' },
  { source_id: 'locke', target_id: 'hume', relationship_type: 'influenced_by', primary_battle: 'reality_mysticism', weight: 0.8, description: 'Hume radicalized Lockean empiricism' },
  
  // ENLIGHTENMENT
  { source_id: 'hume', target_id: 'kant', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.9, description: 'Hume awakened Kant from his dogmatic slumber' },
  { source_id: 'rousseau', target_id: 'kant', relationship_type: 'influenced_by', primary_battle: 'freedom_coercion', weight: 0.6, description: 'Rousseau influenced Kants moral philosophy' },
  { source_id: 'locke', target_id: 'adam_smith', relationship_type: 'influenced_by', primary_battle: 'freedom_coercion', weight: 0.6, description: 'Smith built on Lockean natural rights and property' },
  
  // 19TH CENTURY
  { source_id: 'kant', target_id: 'hegel', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.9, description: 'Hegel developed post-Kantian idealism' },
  { source_id: 'hegel', target_id: 'marx', relationship_type: 'influenced_by', primary_battle: 'individual_collective', weight: 0.9, description: 'Marx inverted Hegelian dialectic into materialism' },
  { source_id: 'kant', target_id: 'schopenhauer', relationship_type: 'influenced_by', primary_battle: 'reality_mysticism', weight: 0.8, description: 'Schopenhauer transformed Kants thing-in-itself into Will' },
  { source_id: 'schopenhauer', target_id: 'nietzsche', relationship_type: 'influenced_by', primary_battle: 'value_nihilism', weight: 0.8, description: 'Nietzsche began as Schopenhauerian but transformed the will' },
  { source_id: 'bentham', target_id: 'mill', relationship_type: 'teacher_of', primary_battle: 'good_evil', weight: 0.8, description: 'Mill was raised in Benthams utilitarian circle' },
  { source_id: 'hume', target_id: 'comte', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.7, description: 'Humes empiricism shaped Comtes positivism' },
  
  // 20TH CENTURY ANALYTIC
  { source_id: 'russell', target_id: 'wittgenstein', relationship_type: 'teacher_of', primary_battle: 'reason_faith', weight: 0.9, description: 'Wittgenstein studied with Russell at Cambridge' },
  { source_id: 'husserl', target_id: 'heidegger', relationship_type: 'teacher_of', primary_battle: 'reality_mysticism', weight: 0.9, description: 'Heidegger was Husserls assistant and transformed phenomenology' },
  
  // EXISTENTIALISM
  { source_id: 'kierkegaard', target_id: 'heidegger', relationship_type: 'influenced_by', primary_battle: 'individual_collective', weight: 0.7, description: 'Kierkegaards existential themes shaped Heideggers Dasein' },
  { source_id: 'heidegger', target_id: 'sartre', relationship_type: 'influenced_by', primary_battle: 'freedom_coercion', weight: 0.9, description: 'Sartre adapted Heideggerian phenomenology for French existentialism' },
  { source_id: 'sartre', target_id: 'beauvoir', relationship_type: 'contemporary_of', primary_battle: 'freedom_coercion', weight: 0.8, description: 'Beauvoir and Sartre developed existentialism together' },
  { source_id: 'sartre', target_id: 'camus', relationship_type: 'contemporary_of', primary_battle: 'value_nihilism', weight: 0.7, description: 'Camus and Sartre were allies then opponents on violence' },
  
  // LIBERALISM / ECONOMICS
  { source_id: 'mises', target_id: 'hayek', relationship_type: 'teacher_of', primary_battle: 'market_planning', weight: 0.9, description: 'Hayek was Mises student and colleague in Vienna' },
  { source_id: 'mises', target_id: 'rand', relationship_type: 'influenced_by', primary_battle: 'market_planning', weight: 0.6, description: 'Rand adopted Austrian economics from Mises' },
  { source_id: 'hayek', target_id: 'popper', relationship_type: 'contemporary_of', primary_battle: 'reason_faith', weight: 0.6, description: 'Hayek and Popper were allied critics of central planning' },
  
  // RAND'S CONNECTIONS
  { source_id: 'aristotle', target_id: 'rand', relationship_type: 'fulfills_legacy_of', primary_battle: 'reason_faith', weight: 1.0, description: 'Rand claimed to fulfill Aristotelian realism and eudaimonism' },
  { source_id: 'rand', target_id: 'kant', relationship_type: 'opposes_legacy_of', primary_battle: 'reason_faith', weight: 0.9, description: 'Rand viewed Kant as the destroyer of reason and the individual' },
  { source_id: 'rand', target_id: 'hegel', relationship_type: 'opposes_legacy_of', primary_battle: 'individual_collective', weight: 0.7, description: 'Rand opposed Hegelian collectivism and historicism' },
  { source_id: 'locke', target_id: 'rand', relationship_type: 'fulfills_legacy_of', primary_battle: 'freedom_coercion', weight: 0.6, description: 'Rand built on Lockean natural rights tradition' },
  { source_id: 'rand', target_id: 'marx', relationship_type: 'opposes_legacy_of', primary_battle: 'individual_collective', weight: 0.9, description: 'Rand explicitly opposed Marxist collectivism' },
  { source_id: 'nietzsche', target_id: 'rand', relationship_type: 'influenced_by', primary_battle: 'value_nihilism', weight: 0.4, description: 'Early Rand admired Nietzsche; later explicitly rejected him' },
  { source_id: 'rand', target_id: 'rawls', relationship_type: 'opposes', primary_battle: 'individual_collective', weight: 0.7, description: 'Objectivism opposes Rawlsian redistributive justice' },
  
  // POLITICAL PHILOSOPHY
  { source_id: 'marx', target_id: 'arendt', relationship_type: 'opposes_legacy_of', primary_battle: 'freedom_coercion', weight: 0.7, description: 'Arendt analyzed and criticized totalitarianism including Marxism' },
  { source_id: 'hegel', target_id: 'foucault', relationship_type: 'influenced_by', primary_battle: 'individual_collective', weight: 0.5, description: 'Foucault engaged critically with Hegelian dialectic' },
  { source_id: 'nietzsche', target_id: 'foucault', relationship_type: 'influenced_by', primary_battle: 'value_nihilism', weight: 0.8, description: 'Foucault adopted Nietzschean genealogy' },
  
  // CHINESE CONNECTIONS
  { source_id: 'confucius', target_id: 'mencius', relationship_type: 'influenced_by', primary_battle: 'good_evil', weight: 0.9, description: 'Mencius developed Confucian ethics toward human goodness' },
  { source_id: 'confucius', target_id: 'xunzi', relationship_type: 'influenced_by', primary_battle: 'good_evil', weight: 0.8, description: 'Xunzi was a Confucian who argued human nature is evil' },
  { source_id: 'xunzi', target_id: 'han_fei', relationship_type: 'teacher_of', primary_battle: 'freedom_coercion', weight: 0.7, description: 'Han Fei studied under Xunzi but developed Legalism' },
  { source_id: 'laozi', target_id: 'zhuangzi', relationship_type: 'influenced_by', primary_battle: 'freedom_coercion', weight: 0.9, description: 'Zhuangzi expanded Taoist philosophy with parables' },
  
  // INDIAN CONNECTIONS
  { source_id: 'buddha', target_id: 'nagarjuna', relationship_type: 'fulfills_legacy_of', primary_battle: 'reality_mysticism', weight: 0.9, description: 'Nagarjuna systematized Buddhist emptiness doctrine' },
  { source_id: 'shankara', target_id: 'ramanuja', relationship_type: 'opposes', primary_battle: 'reality_mysticism', weight: 0.8, description: 'Ramanuja argued against Shankaras radical non-dualism' },
  { source_id: 'buddha', target_id: 'gandhi', relationship_type: 'influenced_by', primary_battle: 'good_evil', weight: 0.6, description: 'Gandhi incorporated Buddhist ahimsa into political action' },
  
  // CROSS-TRADITION
  { source_id: 'aristotle', target_id: 'avicenna', relationship_type: 'influenced_by', primary_battle: 'reason_faith', weight: 0.9, description: 'Avicenna synthesized Aristotelian and Islamic thought' },
  { source_id: 'averroes', target_id: 'maimonides', relationship_type: 'contemporary_of', primary_battle: 'reason_faith', weight: 0.6, description: 'Both worked in Cordoba reconciling reason and scripture' },
  { source_id: 'schopenhauer', target_id: 'buddha', relationship_type: 'influenced_by', primary_battle: 'value_nihilism', weight: 0.7, description: 'Schopenhauer imported Buddhist ideas into Western philosophy' },
];

export default { SEED_NODES, SEED_EDGES };
