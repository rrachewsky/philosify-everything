// ============================================================
// PAYMENTS - STRIPE CHECKOUT
// ============================================================

import { getSecret } from "../utils/secrets.js";

// Pick price ID from request (SECURITY: only accept known tier values, never raw priceId)
export async function pickPriceIdFromRequest(env, body) {
  const tier = String(body?.tier || "").trim();
  if (["10", "20", "50"].includes(tier)) {
    return await getSecret(env[`STRIPE_PRICE_ID_${tier}`]);
  }
  // SECURITY: Do NOT accept body.priceId directly -- prevents price manipulation attacks
  if (body?.priceId) {
    console.error(
      "[Stripe] SECURITY: Rejected direct priceId from client:",
      body.priceId,
    );
  }
  return null;
}

// Look up stored Stripe customer ID from database
async function getStoredCustomerId(env, userId) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey || !userId) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/stripe_customers?user_id=eq.${userId}&select=stripe_customer_id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (res.ok) {
      const rows = await res.json();
      if (rows.length > 0 && rows[0].stripe_customer_id) {
        return rows[0].stripe_customer_id;
      }
    }
  } catch (err) {
    console.log("[Stripe] Could not look up stored customer ID:", err.message);
  }

  return null;
}

// Verify if a Stripe customer exists
async function verifyCustomerExists(stripeKey, customerId) {
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Create Stripe checkout session
export async function createStripeCheckout(
  env,
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
) {
  const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);
  if (!stripeKey) {
    throw new Error("Stripe API key not configured");
  }

  // Check if user already has a Stripe customer ID
  let existingCustomerId = await getStoredCustomerId(env, userId);

  // Verify the customer actually exists in Stripe (handles test->live migration)
  if (existingCustomerId) {
    const customerExists = await verifyCustomerExists(
      stripeKey,
      existingCustomerId,
    );
    if (!customerExists) {
      console.log(
        "[Stripe] Stored customer ID not found in Stripe (test->live migration?), will create new customer",
      );
      existingCustomerId = null;

      // Clear the invalid customer ID from database
      try {
        const supabaseUrl = await getSecret(env.SUPABASE_URL);
        const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
        await fetch(
          `${supabaseUrl}/rest/v1/stripe_customers?user_id=eq.${userId}`,
          {
            method: "DELETE",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          },
        );
        console.log("[Stripe] Cleared invalid customer ID from database");
      } catch (err) {
        console.log(
          "[Stripe] Could not clear invalid customer ID:",
          err.message,
        );
      }
    }
  }

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("client_reference_id", userId);
  form.set("metadata[user_id]", userId);
  // IMPORTANT: Webhook events do not always include expanded line_items.
  // Persist the price_id in session metadata so /api/stripe-webhook can reliably map to credits.
  form.set("metadata[price_id]", priceId);

  if (existingCustomerId) {
    // Reuse existing customer (all purchases linked to same customer)
    form.set("customer", existingCustomerId);
    console.log("[Stripe] Reusing existing customer:", existingCustomerId);
  } else {
    // First purchase - create new customer
    form.set("customer_email", userEmail);
    form.set("customer_creation", "always");
    console.log("[Stripe] Creating new customer for:", userEmail);
  }

  // Enable invoice creation for one-time payments (shows in billing portal)
  form.set("invoice_creation[enabled]", "true");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(() => "");
    throw new Error(`Stripe error ${res.status}: ${errTxt}`);
  }
  return res.json();
}
