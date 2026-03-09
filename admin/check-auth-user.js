// Check if user exists in auth.users and public.users
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node check-auth-user.js <user-id>

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Usage: node check-auth-user.js <user-id>");
  process.exit(1);
}

async function check() {
  console.log("\n=== Checking User ===");
  console.log("User ID:", USER_ID);

  // Check auth.users (using admin API)
  const authUrl = `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`;
  const authRes = await fetch(authUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (authRes.ok) {
    const authUser = await authRes.json();
    console.log("\nauth.users record found:");
    console.log("Email:", authUser.email);
    console.log("Created:", authUser.created_at);
  } else {
    console.log("\nauth.users: NOT FOUND (status:", authRes.status, ")");
  }

  // Check public.users
  const usersUrl = `${SUPABASE_URL}/rest/v1/users?id=eq.${USER_ID}`;
  const usersRes = await fetch(usersUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const users = await usersRes.json();
  console.log("\npublic.users record:");
  if (users.length > 0) {
    console.log(JSON.stringify(users[0], null, 2));
  } else {
    console.log("NOT FOUND");
  }
}

check().catch(console.error);
