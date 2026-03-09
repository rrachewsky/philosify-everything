// List all users in auth.users
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node list-all-users.js

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

async function listUsers() {
  console.log("\n=== Listing All Auth Users ===\n");

  // List auth.users
  const authUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
  const authRes = await fetch(authUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!authRes.ok) {
    console.error("ERROR:", authRes.status, await authRes.text());
    return;
  }

  const data = await authRes.json();
  const users = data.users || [];

  console.log(`Found ${users.length} users:\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email || "NO EMAIL"}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Confirmed: ${user.confirmed_at ? "Yes" : "No"}`);
    console.log("");
  });
}

listUsers().catch(console.error);
