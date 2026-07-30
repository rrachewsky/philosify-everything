// Catalog stats — telemetry honesty rule (visual-reshape-spec §5b):
// every user-facing count binds here or to live data, never inline in copy.
// Provider-catalog sizes are WP4-sanctioned config values ("live/config").
//
// PHILOSOPHER_COUNT must equal SEED_NODES.length in data/constellationSeedData,
// which is kept in sync with the API seed — the source of truth per the system
// map (reconciled 2026-07-30: 266 both sides). The seed file is ~380KB so it
// must never be imported here (this module is in the landing chunk); HistoryPage
// binds the live SEED_NODES.length, so any drift surfaces there first.
export const CATALOG = {
  songs: '1.7M', // Spotify + Genius working set (spec §3b value)
  films: '1.3M', // TMDb catalog
  books: '40M', // Google Books catalog
  philosophers: 266,
  locales: 18,
};
