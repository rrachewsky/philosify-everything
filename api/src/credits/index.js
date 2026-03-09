// ============================================================
// CREDITS - BARREL EXPORT
// ============================================================

// Reservation pattern (Auth + Capture)
export { reserveCredit } from "./reserve.js";
export { confirmReservation } from "./confirm.js";
export {
  releaseReservation,
  cleanupStaleReservations,
  cleanupUserStaleReservations,
} from "./release.js";

// Free ticker validation (SECURITY: server-side only)
export { isInFreeTicker } from "./freeTicker.js";

// Legacy exports - DEPRECATED (RPC functions removed)
// Use reservation pattern instead:
//   1. reserveCredit() - before analysis
//   2. confirmReservation(analysisId) - on success
//   3. releaseReservation(reason) - on failure
