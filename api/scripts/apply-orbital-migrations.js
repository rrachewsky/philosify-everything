// ============================================================
// APPLY ORBITAL COORDINATE MIGRATIONS
// Runs SQL migrations against Supabase
// ============================================================

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigrations() {
  // Load environment variables
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    console.error('\nSet them in .dev.vars or environment:');
    console.error('   SUPABASE_URL=https://xxx.supabase.co');
    console.error('   SUPABASE_SERVICE_KEY=eyJhbGc...');
    process.exit(1);
  }

  // Read migration files
  const migrationsDir = join(__dirname, '../../migrations');
  const migrations = [
    {
      name: 'Add Orbital Coordinates',
      file: 'add_orbital_coordinates.sql',
    },
    {
      name: 'Add Orbital RPC Functions',
      file: 'add_orbital_rpc_functions.sql',
    },
  ];

  console.log('🚀 Starting migration process...\n');

  for (const migration of migrations) {
    console.log(`📄 Applying: ${migration.name}`);
    
    const sqlPath = join(migrationsDir, migration.file);
    const sql = readFileSync(sqlPath, 'utf-8');

    try {
      // Execute SQL via Supabase REST API (pg_query)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!res.ok) {
        // Try alternative: direct SQL execution via PostgREST
        console.log('   ⚠️  RPC method failed, trying direct execution...');
        
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          const directRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/sql',
            },
            body: statement + ';',
          });

          if (!directRes.ok) {
            const err = await directRes.text();
            console.error(`   ❌ Failed: ${err}`);
            console.error(`\n📋 Statement that failed:\n${statement}\n`);
          }
        }
        
        console.log('   ⚠️  Migration partially applied (some statements may have failed)');
        console.log('   💡 Please run the migration manually via Supabase SQL Editor');
        console.log(`   📂 File: migrations/${migration.file}\n`);
        continue;
      }

      console.log(`   ✅ Applied successfully\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      console.log('   💡 Please run the migration manually via Supabase SQL Editor');
      console.log(`   📂 File: migrations/${migration.file}\n`);
    }
  }

  console.log('✅ Migration process complete!\n');
  console.log('🔍 Verify in Supabase SQL Editor:');
  console.log('   SELECT column_name, data_type FROM information_schema.columns');
  console.log('   WHERE table_name = \'graph_nodes\'');
  console.log('   AND column_name IN (\'x_inclination\', \'y_inclination\', \'z_altitude\');\n');
}

applyMigrations().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
