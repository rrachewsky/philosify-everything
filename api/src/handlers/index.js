// ============================================================
// HANDLERS - BARREL EXPORT
// ============================================================

export { handleAnalyze } from './analyze.js';
export { handleSearch } from './search.js';

// Literature (Books)
export { handleBookSearch } from './book-search.js';
export { handleBookAnalyze } from './book-analyze.js';
export { handleBookAnalysisHistory } from './book-analysis-history.js';
export { handleBookAnalysisDetail } from './book-analysis-detail.js';

// History Graph (legacy - to be removed)
export { handleHistoryGraph, handleHistoryExtract, refreshGraphCache } from './history-graph.js';

// Constellation of Ideas
export { handleConstellation, handleConstellationCacheClear, handleConstellationStats } from './constellation.js';

