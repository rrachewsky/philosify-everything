#!/usr/bin/env node
// ============================================================
// QUIZ POOL SEEDER — Generates 500 quiz questions via Gemini
// ============================================================
// Usage:
//   node scripts/seed-quiz.js
//
// Requires environment variables (set in shell before running):
//   GEMINI_API_KEY    — Google AI API key
//   SUPABASE_URL      — Supabase project URL
//   SUPABASE_SERVICE_KEY — Supabase service role key
//
// Example:
//   $env:GEMINI_API_KEY="AIza..."
//   $env:SUPABASE_URL="https://xxx.supabase.co"
//   $env:SUPABASE_SERVICE_KEY="eyJ..."
//   node scripts/seed-quiz.js
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables.');
  console.error('Set: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const QUIZ_CATEGORIES = [
  'metaphysics', 'epistemology', 'ethics', 'politics',
  'aesthetics', 'applied', 'history', 'american_exceptionalism',
  'virtues', 'economics', 'law', 'music', 'cinema', 'quotes',
];

const TARGET_TOTAL = 500;
const BATCH_SIZE = 8; // questions per Gemini call
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ============================================================
// Supabase helpers
// ============================================================
async function supabaseQuery(method, table, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  if (method === 'GET') {
    if (params.select) url.searchParams.set('select', params.select);
    if (params.filter) {
      for (const [k, v] of Object.entries(params.filter)) {
        url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString(), { method: 'GET', headers });
    return res.json();
  }

  if (method === 'POST') {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(params.body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Insert failed: ${res.status} ${err}`);
    }
    return res.json();
  }
}

async function getPoolStats() {
  const data = await supabaseQuery('GET', 'quiz_questions', {
    select: 'difficulty,category',
    filter: { 'active': 'eq.true' },
  });
  const diffCounts = {};
  const catCounts = {};
  for (const q of data) {
    diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
    catCounts[q.category] = (catCounts[q.category] || 0) + 1;
  }
  return { total: data.length, diffCounts, catCounts };
}

// ============================================================
// Gemini question generation
// ============================================================
async function generateBatch(difficulty, category, count) {
  const prompt = `Generate ${count} unique philosophy quiz questions.

DIFFICULTY: ${difficulty}/10
- 1-2: Famous quotes, well-known philosophers, easy identification
- 3-4: Intermediate concepts, matching ideas to thinkers, basic arguments
- 5-6: Advanced concepts, nuanced distinctions, cross-tradition comparisons
- 7-8: Expert level, obscure works, detailed doctrines, subtle differences
- 9-10: Master level, specialized academic knowledge, original source texts

CATEGORY: "${category}"

Return a JSON array of objects. Each object must have:
{
  "question": "The question text",
  "options": [
    {"text": "Option A", "correct": true},
    {"text": "Option B"},
    {"text": "Option C"},
    {"text": "Option D"}
  ],
  "explanation": "Why the correct answer is correct (2-3 sentences)",
  "wrong_explanations": {
    "0": "Why option A is wrong (if not correct)",
    "1": "Why option B is wrong (if not correct)",
    "2": "Why option C is wrong (if not correct)",
    "3": "Why option D is wrong (if not correct)"
  }
}

RULES:
- Exactly 4 options per question, exactly 1 marked correct:true
- Questions must be factually accurate and philosophically sound
- Wrong explanations must be educational
- Make questions diverse — different philosophers, eras, traditions
- Return ONLY the JSON array, no markdown fences, no extra text`;

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    console.error(`  Gemini API error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const questions = JSON.parse(jsonStr);
    if (!Array.isArray(questions)) return [];
    return questions;
  } catch (e) {
    console.error(`  Failed to parse Gemini response: ${e.message}`);
    return [];
  }
}

function validateQuestion(q) {
  if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) return false;
  if (!q.explanation) return false;

  const hasText = q.options.every(o => {
    const text = typeof o === 'string' ? o : (o?.text || '');
    return text.trim().length > 0;
  });
  if (!hasText) return false;

  const correctCount = q.options.filter(o => typeof o === 'object' && o.correct === true).length;
  if (correctCount !== 1) return false;

  return true;
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('=== Quiz Pool Seeder ===\n');

  const stats = await getPoolStats();
  console.log(`Current pool: ${stats.total} active questions`);
  console.log('By difficulty:', stats.diffCounts);
  console.log('By category:', stats.catCounts);

  const needed = TARGET_TOTAL - stats.total;
  if (needed <= 0) {
    console.log(`\nPool already has ${stats.total} >= ${TARGET_TOTAL}. Done.`);
    return;
  }

  console.log(`\nNeed to generate ${needed} more questions to reach ${TARGET_TOTAL}.\n`);

  // Build a work queue: prioritize underserved difficulties and categories
  const workQueue = [];
  for (let d = 1; d <= 10; d++) {
    const current = stats.diffCounts[d] || 0;
    const target = Math.ceil(TARGET_TOTAL / 10); // ~50 per difficulty
    const deficit = Math.max(0, target - current);
    if (deficit > 0) {
      workQueue.push({ difficulty: d, deficit });
    }
  }

  // Sort by biggest deficit first
  workQueue.sort((a, b) => b.deficit - a.deficit);

  let totalInserted = 0;
  let batchNum = 0;

  for (const work of workQueue) {
    if (totalInserted >= needed) break;

    const remaining = Math.min(work.deficit, needed - totalInserted);
    const batches = Math.ceil(remaining / BATCH_SIZE);

    for (let b = 0; b < batches; b++) {
      if (totalInserted >= needed) break;
      batchNum++;

      const count = Math.min(BATCH_SIZE, remaining - (b * BATCH_SIZE));
      // Rotate through categories
      const category = QUIZ_CATEGORIES[batchNum % QUIZ_CATEGORIES.length];

      console.log(`Batch ${batchNum}: ${count} questions at difficulty ${work.difficulty}, category "${category}"...`);

      const questions = await generateBatch(work.difficulty, category, count);
      let inserted = 0;

      for (const q of questions) {
        if (!validateQuestion(q)) {
          console.log('  Skipped invalid question');
          continue;
        }

        const options = q.options.map(o => ({
          text: typeof o === 'string' ? o : (o.text || ''),
          ...(o.correct ? { correct: true } : {}),
        }));

        const validCategory = QUIZ_CATEGORIES.includes(q.category) ? q.category : category;
        const validDifficulty = Math.max(1, Math.min(10, q.difficulty || work.difficulty));

        try {
          await supabaseQuery('POST', 'quiz_questions', {
            body: {
              category: validCategory,
              difficulty: validDifficulty,
              question: q.question,
              options: options,
              explanation: q.explanation,
              wrong_explanations: q.wrong_explanations || {},
              active: true,
            },
          });
          inserted++;
          totalInserted++;
        } catch (e) {
          console.error(`  Insert error: ${e.message}`);
        }
      }

      console.log(`  Inserted ${inserted}/${questions.length} (total: ${stats.total + totalInserted})`);

      // Rate limit: 300ms between Gemini calls
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Final stats
  const finalStats = await getPoolStats();
  console.log(`\n=== Done ===`);
  console.log(`Pool: ${stats.total} -> ${finalStats.total} (+${finalStats.total - stats.total})`);
  console.log('By difficulty:', finalStats.diffCounts);
  console.log('By category:', finalStats.catCounts);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
