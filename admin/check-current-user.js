// Check ACTUAL logged in user credits
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node check-current-user.js <user-id>

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Usage: node check-current-user.js <user-id>");
  process.exit(1);
}

async function check() {
  console.log("\n=== Checking Current User Credits ===");
  console.log("User ID:", USER_ID);

  // Get credits
  const creditsUrl = `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${USER_ID}`;
  const creditsRes = await fetch(creditsUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const credits = await creditsRes.json();
  console.log("\nuser_credits:");
  console.log(JSON.stringify(credits, null, 2));

  // Get recent transactions
  const txUrl = `${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${USER_ID}&order=created_at.desc&limit=5`;
  const txRes = await fetch(txUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const transactions = await txRes.json();
  console.log("\nRecent transactions:");
  console.log(JSON.stringify(transactions, null, 2));

  // Check stripe_webhooks for this user
  const webhooksUrl = `${SUPABASE_URL}/rest/v1/stripe_webhooks?user_id=eq.${USER_ID}&order=created_at.desc&limit=3`;
  const webhooksRes = await fetch(webhooksUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const webhooks = await webhooksRes.json();
  console.log("\nStripe webhooks/payments:");
  console.log(JSON.stringify(webhooks, null, 2));
}

check().catch(console.error);
