const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from api/.dev.vars (it's a text file)
const fs = require('fs');
const devVarsPath = path.join(__dirname, '../api/.dev.vars');
const devVars = fs.readFileSync(devVarsPath, 'utf8');
const env = {};
devVars.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeaturedSongs() {
  console.log('Checking featured_songs table...');
  const { data, error } = await supabase
    .from('featured_songs')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching featured_songs:', error.message);
    return;
  }

  console.log(`Found ${data.length} active featured songs:`);
  data.forEach(song => {
    console.log(`${song.position}. ${song.song_title} - ${song.artist} (${song.spotify_id})`);
  });
}

checkFeaturedSongs();
