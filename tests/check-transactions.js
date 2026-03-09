// Check credit transactions for user
// Run with: node check-transactions.js

const SUPABASE_URL = 'https://zunugudeytbdzlidosgr.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY';

const userId = '237148a2-a025-43d0-8c36-cc3ac54729ba';

async function checkTransactions() {
  console.log(`Checking transactions for user ${userId}...\n`);

  // Check user_credits
  const creditsResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  const credits = await creditsResponse.json();
  console.log('📊 Current Balance:');
  console.log(JSON.stringify(credits[0], null, 2));

  // Check credit_transactions
  const transactionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  const transactions = await transactionsResponse.json();
  console.log(`\n💳 Transaction History (${transactions.length} transactions):`);
  transactions.forEach((tx, i) => {
    console.log(`\n${i + 1}. ${tx.type.toUpperCase()}`);
    console.log(`   Amount: ${tx.amount > 0 ? '+' : ''}${tx.amount}`);
    console.log(`   Status: ${tx.status}`);
    console.log(`   Balance: ${tx.purchased_before} → ${tx.purchased_after} (purchased)`);
    console.log(`   Balance: ${tx.free_before} → ${tx.free_after} (free)`);
    console.log(`   Total: ${tx.total_before} → ${tx.total_after}`);
    console.log(`   Created: ${tx.created_at}`);
    if (tx.song_analyzed) console.log(`   Song: ${tx.song_analyzed}`);
    if (tx.stripe_session_id) console.log(`   Stripe Session: ${tx.stripe_session_id}`);
  });
}

checkTransactions().catch(console.error);
