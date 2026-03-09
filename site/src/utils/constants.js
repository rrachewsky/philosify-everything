// Application constants

// AI Models - Keys match backend orchestrator routing
// Actual model versions configured in backend env vars
export const AI_MODELS = {
  CLAUDE: 'claude', // → claude-opus-4-5-20251101
  OPENAI: 'openai', // → gpt-4.1
  GEMINI: 'gemini', // → gemini-3.1-flash
  GROK: 'grok', // → grok-4-1-fast-reasoning
  DEEPSEEK: 'deepseek', // → deepseek-reasoner
};

export const AI_MODEL_NAMES = {
  [AI_MODELS.CLAUDE]: 'Claude',
  [AI_MODELS.OPENAI]: 'ChatGPT',
  [AI_MODELS.GEMINI]: 'Gemini',
  [AI_MODELS.GROK]: 'Grok',
  [AI_MODELS.DEEPSEEK]: 'DeepSeek',
};

// Model descriptions (for UI tooltips)
export const AI_MODEL_DESCRIPTIONS = {
  [AI_MODELS.CLAUDE]: 'Claude Opus 4.5 - Extended thinking (32K reasoning tokens)',
  [AI_MODELS.OPENAI]: 'GPT-4.1 - High capability model for accurate analysis',
  [AI_MODELS.GEMINI]: 'Gemini 3 Flash - Fast and efficient analysis',
  [AI_MODELS.GROK]: 'Grok 4.1 Fast - Reasoning model',
  [AI_MODELS.DEEPSEEK]: 'DeepSeek Reasoner - Best value reasoning model',
};

// Model pricing (cost per analysis in USD)
export const AI_MODEL_PRICES = {
  [AI_MODELS.DEEPSEEK]: 0.022,
  [AI_MODELS.GROK]: 0.003,
  [AI_MODELS.GEMINI]: 0.08,
  [AI_MODELS.CLAUDE]: 0.35,
  [AI_MODELS.OPENAI]: 0.525,
};

export const AI_MODEL_DISPLAY_NAMES = {
  [AI_MODELS.CLAUDE]: 'Claude',
  [AI_MODELS.OPENAI]: 'ChatGPT',
  [AI_MODELS.GEMINI]: 'Gemini',
  [AI_MODELS.GROK]: 'Grok',
  [AI_MODELS.DEEPSEEK]: 'DeepSeek',
};

// Languages — must match site/src/i18n/config.js SUPPORTED_LANGUAGES
// and api/src/utils/validation.js SUPPORTED_LANGUAGES
export const LANGUAGES = {
  EN: 'en',
  PT: 'pt',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  RU: 'ru',
  HU: 'hu',
  HE: 'he',
  ZH: 'zh',
  JA: 'ja',
  KO: 'ko',
  AR: 'ar',
  HI: 'hi',
  FA: 'fa',
  NL: 'nl',
  PL: 'pl',
  TR: 'tr',
};

// Credit packages
export const CREDIT_PACKAGES = [
  { amount: 6.0, credits: 10, tier: '10' },
  { amount: 10.0, credits: 20, tier: '20' },
  { amount: 20.0, credits: 50, tier: '50' },
];

// Default values
export const DEFAULT_LANGUAGE = LANGUAGES.EN;
export const DEFAULT_MODEL = AI_MODELS.GROK; // Grok is mandatory
export const FREE_ANALYSES_COUNT = 2;
export const CREDIT_COST_PER_ANALYSIS = 0.6;

// Debounce delays
export const SEARCH_DEBOUNCE_MS = 500;
export const INPUT_DEBOUNCE_MS = 300;
