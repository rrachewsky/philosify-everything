// Quick script to check user credits in Supabase
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node check-user-credits.js <user-id>

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Usage: node check-user-credits.js <user-id>");
  process.exit(1);
}

async function checkCredits() {
  console.log("\n=== Checking Credits for User ===");
  console.log("User ID:", USER_ID);

  // Get user_credits record
  const creditsUrl = `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${USER_ID}`;
  const creditsRes = await fetch(creditsUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const credits = await creditsRes.json();
  console.log("\nuser_credits record:");
  console.log(JSON.stringify(credits, null, 2));

  // Get recent credit transactions
  const transactionsUrl = `${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${USER_ID}&order=created_at.desc&limit=10`;
  const transactionsRes = await fetch(transactionsUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const transactions = await transactionsRes.json();
  console.log("\nRecent credit transactions:");
  console.log(JSON.stringify(transactions, null, 2));
}

checkCredits().catch(console.error);
