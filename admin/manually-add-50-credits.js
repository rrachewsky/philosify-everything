// Manually add 50 credits to user (bypass payment verification for testing)
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node manually-add-50-credits.js <user-id>

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Usage: node manually-add-50-credits.js <user-id>");
  process.exit(1);
}

async function addCredits() {
  console.log("\n=== Manually Adding 50 Credits ===");
  console.log("User ID:", USER_ID);

  // Call process_stripe_payment RPC
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/process_stripe_payment`;
  const rpcRes = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_stripe_session_id: "manual_test_" + Date.now(),
      p_stripe_price_id: "price_test_50",
      p_user_id: USER_ID,
      p_credits: 50,
    }),
  });

  if (!rpcRes.ok) {
    console.error("ERROR:", await rpcRes.text());
    return;
  }

  const result = await rpcRes.json();
  console.log("\nResult:", JSON.stringify(result, null, 2));

  // Check new balance
  const creditsUrl = `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${USER_ID}`;
  const creditsRes = await fetch(creditsUrl, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  const credits = await creditsRes.json();
  console.log("\nNew balance:");
  console.log(`  Purchased: ${credits[0]?.purchased_credits || 0}`);
  console.log(`  Free: ${credits[0]?.free_credits_remaining || 0}`);
  console.log(`  Total: ${credits[0]?.total_credits || 0}`);
}

addCredits().catch(console.error);
