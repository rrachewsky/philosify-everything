// Catalog stats — telemetry honesty rule (visual-reshape-spec §5b):
// every user-facing count binds here or to live data, never inline in copy.
// Provider-catalog sizes are WP4-sanctioned config values ("live/config").
//
// PHILOSOPHER_COUNT must equal SEED_NODES.length in data/constellationSeedData
// (verified 2026-07-29: 265). The seed file is ~380KB so it must never be
// imported here (this module is in the landing chunk); HistoryPage binds the
// live SEED_NODES.length, so any drift surfaces there first.
export const CATALOG = {
  songs: '1.7M', // Spotify + Genius working set (spec §3b value)
  films: '1.3M', // TMDb catalog
  books: '40M', // Google Books catalog
  philosophers: 265,
  locales: 18,
};
