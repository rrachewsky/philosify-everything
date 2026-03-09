// Add 10 credits to existing balance
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node add-10-credits.js <user-id>

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Usage: node add-10-credits.js <user-id>");
  process.exit(1);
}

const creditsToAdd = 10;

async function addCredits() {
  console.log(`Adding ${creditsToAdd} credits to user ${USER_ID}...`);

  // First, get current balance
  const checkResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${USER_ID}`,
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );

  const currentData = await checkResponse.json();
  const currentCredits = currentData[0]?.purchased_credits || 0;
  console.log(`Current balance: ${currentCredits} credits`);

  // Update credits
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${USER_ID}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        purchased_credits: currentCredits + creditsToAdd,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Error:", response.status, error);
    return;
  }

  const result = await response.json();
  console.log(`\nSuccess! Added ${creditsToAdd} credits`);
  console.log(`Previous balance: ${currentCredits}`);
  console.log(`New balance: ${result[0].purchased_credits}`);
  console.log(`Total credits: ${result[0].total_credits}`);
}

addCredits().catch(console.error);
