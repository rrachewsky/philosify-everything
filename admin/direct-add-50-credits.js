// Directly update user_credits table (bypass RPC)
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node direct-add-50-credits.js <user-id>

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Usage: node direct-add-50-credits.js <user-id>");
  process.exit(1);
}

async function addCredits() {
  console.log("\n=== Directly Adding 50 Credits ===");
  console.log("User ID:", USER_ID);

  // Update user_credits directly
  const updateUrl = `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${USER_ID}`;
  const updateRes = await fetch(updateUrl, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      purchased_credits: 50,
      // total_credits is auto-calculated
    }),
  });

  if (!updateRes.ok) {
    console.error("ERROR:", await updateRes.text());
    return;
  }

  const result = await updateRes.json();
  console.log("\nUpdated:");
  console.log(JSON.stringify(result, null, 2));

  console.log("\nCredits added! Now refresh the page to see the new balance.");
}

addCredits().catch(console.error);
