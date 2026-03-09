import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, model, created_at, song_id, final_score, classification")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("\n📊 MOST RECENT ANALYSES IN SUPABASE\n");
  console.log("=".repeat(100));

  for (const a of data) {
    const { data: song } = await supabase
      .from("songs")
      .select("title, artist")
      .eq("id", a.song_id)
      .single();

    const time = new Date(a.created_at).toLocaleString();
    console.log(`${time}`);
    console.log(`  🎵 "${song?.title}" - ${song?.artist}`);
    console.log(`  🤖 Model: ${a.model.toUpperCase()}`);
    console.log(
      `  📈 Score: ${a.final_score} | Classification: ${a.classification}`,
    );
    console.log("-".repeat(100));
  }
}

main();
