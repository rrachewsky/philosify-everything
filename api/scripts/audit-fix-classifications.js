// ============================================================
// AUDIT & FIX CLASSIFICATIONS SCRIPT
// ============================================================
// This script queries all analyses from Supabase, checks if the
// classification matches the final_score, and fixes any mismatches.
//
// Usage: 
//   node audit-fix-classifications.js <SUPABASE_URL> <SUPABASE_SERVICE_KEY>
//   node audit-fix-classifications.js <SUPABASE_URL> <SUPABASE_SERVICE_KEY> --fix
//
// Without --fix: audit only (no changes)
// With --fix: apply fixes automatically
// ============================================================

// Guide v2.7 classification thresholds
function classificationFromScore(score) {
  if (score >= 8.1) return 'Extremely Revolutionary';
  if (score >= 6.1) return 'Revolutionary';
  if (score >= 4.1) return 'Moderately Revolutionary';
  if (score >= 2.1) return 'Constructive Critique';
  if (score >= 0.1) return 'Ambiguous, Leaning Realist';
  if (score >= -2.0) return 'Ambiguous, Leaning Evasion';
  if (score >= -4.0) return 'Soft Conformist';
  if (score >= -6.0) return 'Directly Conformist';
  if (score >= -8.0) return 'Strongly Conformist';
  return 'Doctrinally Conformist';
}

async function main() {
  console.log('\n========================================');
  console.log('PHILOSIFY - CLASSIFICATION AUDIT & FIX');
  console.log('========================================\n');

  // Get credentials from command line arguments
  const args = process.argv.slice(2);
  const supabaseUrl = args[0];
  const supabaseKey = args[1];
  const autoFix = args.includes('--fix');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials.');
    console.error('');
    console.error('Usage:');
    console.error('  node audit-fix-classifications.js <SUPABASE_URL> <SUPABASE_SERVICE_KEY>');
    console.error('  node audit-fix-classifications.js <SUPABASE_URL> <SUPABASE_SERVICE_KEY> --fix');
    console.error('');
    console.error('Without --fix: audit only (no changes)');
    console.error('With --fix: apply fixes automatically');
    process.exit(1);
  }

  console.log(`Mode: ${autoFix ? '🔧 AUDIT + FIX' : '🔍 AUDIT ONLY'}\n`);

  console.log('\n📊 Fetching all analyses from Supabase...\n');

  // Fetch all analyses
  const response = await fetch(
    `${supabaseUrl}/rest/v1/analyses?select=id,final_score,classification,song_id`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  if (!response.ok) {
    console.error(`❌ Failed to fetch analyses: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error(errorText);
    process.exit(1);
  }

  const analyses = await response.json();
  console.log(`✅ Found ${analyses.length} analyses\n`);

  // Audit and collect fixes
  const fixes = [];
  const report = {
    total: analyses.length,
    correct: 0,
    wrong: 0,
    fixed: 0,
    errors: 0
  };

  console.log('🔍 Auditing classifications...\n');
  console.log('─'.repeat(80));

  for (const analysis of analyses) {
    const { id, final_score, classification } = analysis;
    const correctClassification = classificationFromScore(final_score);

    if (classification !== correctClassification) {
      report.wrong++;
      fixes.push({
        id,
        final_score,
        oldClassification: classification,
        newClassification: correctClassification
      });
      console.log(`❌ ID: ${id}`);
      console.log(`   Score: ${final_score}`);
      console.log(`   Current: "${classification}"`);
      console.log(`   Should be: "${correctClassification}"`);
      console.log('');
    } else {
      report.correct++;
    }
  }

  console.log('─'.repeat(80));
  console.log(`\n📋 AUDIT SUMMARY:`);
  console.log(`   Total analyses: ${report.total}`);
  console.log(`   Correct: ${report.correct}`);
  console.log(`   Wrong: ${report.wrong}`);

  if (fixes.length === 0) {
    console.log('\n✅ All classifications are correct! No fixes needed.\n');
    process.exit(0);
  }

  // Check if we should apply fixes
  if (!autoFix) {
    console.log('\n⚠️  Run with --fix flag to apply these fixes:');
    console.log(`   node audit-fix-classifications.js <URL> <KEY> --fix\n`);
    process.exit(0);
  }

  console.log('\n🔧 Applying fixes...\n');

  // Apply fixes
  for (const fix of fixes) {
    try {
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/analyses?id=eq.${fix.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            classification: fix.newClassification
          })
        }
      );

      if (updateResponse.ok) {
        report.fixed++;
        console.log(`✅ Fixed ID ${fix.id}: "${fix.oldClassification}" → "${fix.newClassification}"`);
      } else {
        report.errors++;
        console.error(`❌ Failed to fix ID ${fix.id}: ${updateResponse.status}`);
      }
    } catch (error) {
      report.errors++;
      console.error(`❌ Error fixing ID ${fix.id}: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('FINAL REPORT');
  console.log('========================================');
  console.log(`Total analyses: ${report.total}`);
  console.log(`Already correct: ${report.correct}`);
  console.log(`Fixed: ${report.fixed}`);
  console.log(`Errors: ${report.errors}`);
  console.log('========================================\n');
}

main().catch(console.error);

