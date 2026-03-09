// Initialize user credits
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node initialize-user.js <user-id>

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Usage: node initialize-user.js <user-id>");
  process.exit(1);
}

async function initialize() {
  console.log("\n=== Initializing User Credits ===");
  console.log("User ID:", USER_ID);

  // Call initialize_user_credits RPC
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/initialize_user_credits`;
  const rpcRes = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_user_id: USER_ID }),
  });

  if (!rpcRes.ok) {
    const error = await rpcRes.text();
    console.error("ERROR:", rpcRes.status, error);
    return;
  }

  const result = await rpcRes.json();
  console.log("\nRPC result:");
  console.log(JSON.stringify(result, null, 2));

  // Now check the credits
  const creditsUrl = `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${USER_ID}`;
  const creditsRes = await fetch(creditsUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const credits = await creditsRes.json();
  console.log("\nuser_credits record after initialization:");
  console.log(JSON.stringify(credits, null, 2));
}

initialize().catch(console.error);
