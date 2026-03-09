// ============================================================
// CREDITS - RESERVE (LOCK MECHANISM)
// ============================================================
// Reserves a credit (minimal lock). Song/model info goes to credit_history
// on confirm/release, not here. Returns reservation_id.

import { callRpc } from '../utils/supabase.js';

export async function reserveCredit(env, userId) {
  console.log(`[Credits] Reserving credit for ${userId}`);

  try {
    const result = await callRpc(env, 'reserve_credit', {
      p_user_id: userId
    });

    if (!result || !result.success) {
      const errorMsg = result?.message || 'Unknown error';
      console.log(`[Credits] Reservation failed for ${userId}: ${errorMsg}`);
      return {
        success: false,
        reservationId: null,
        type: 'none',
        remaining: 0,
        error: errorMsg
      };
    }

    console.log(`[Credits] Reserved ${result.used_free ? 'free' : 'paid'} credit for ${userId}. Reservation: ${result.reservation_id}. Remaining: ${result.remaining}`);

    return {
      success: true,
      reservationId: result.reservation_id,
      type: result.used_free ? 'free' : 'paid',
      remaining: result.remaining,
      credits: result.credits
    };
  } catch (error) {
    throw new Error(`Failed to reserve credit: ${error.message}`);
  }
}
