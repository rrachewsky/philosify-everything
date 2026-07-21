// ============================================================
// AI - BOOK ANALYSIS PROMPT BUILDER
// ============================================================
// Mirrors template.js but adapted for literary works.
// Key differences:
// - No lyrics/copyright quotation rules
// - Book metadata (author, year, genre, pages, publisher)
// - AI uses its own knowledge of the book + synopsis
// - Literature Aesthetic Framework guide (expanded aesthetics A1-A8)
// ============================================================

export function buildBookAnalysisPrompt(
  title,
  author,
  synopsis,
  metadata,
  guide,
  lang = "en",
) {

  // Language code to name mapping
  const langNames = {
    en: "English", pt: "Brazilian Portuguese", es: "Spanish", de: "German",
    fr: "French", it: "Italian", hu: "Hungarian", ru: "Russian",
    ja: "Japanese", zh: "Chinese", ko: "Korean", he: "Hebrew",
    ar: "Arabic", hi: "Hindi", fa: "Farsi", nl: "Dutch",
    pl: "Polish", tr: "Turkish",
  };

  const targetLanguage = langNames[lang] || "English";

  // Build book metadata section
  const bookInfoLines = [];
  bookInfoLines.push(`Title: "${title}"`);
  bookInfoLines.push(`Author: ${author}`);
  if (metadata?.release_year || metadata?.published_date) {
    bookInfoLines.push(`Year: ${metadata.release_year || metadata.published_date}`);
  }
  if (metadata?.categories?.length > 0) {
    bookInfoLines.push(`Genre/Categories: ${metadata.categories.join(', ')}`);
  }
  if (metadata?.page_count) {
    bookInfoLines.push(`Page Count: ${metadata.page_count}`);
  }
  if (metadata?.publisher) {
    bookInfoLines.push(`Publisher: ${metadata.publisher}`);
  }
  if (metadata?.language) {
    bookInfoLines.push(`Original Language: ${metadata.language}`);
  }
  if (metadata?.isbn) {
    bookInfoLines.push(`ISBN: ${metadata.isbn}`);
  }

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHILOSOPHICAL GUIDE (LITERATURE AESTHETIC FRAMEWORK) - MANDATORY REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST CONSULT AND APPLY THE FOLLOWING GUIDE RIGOROUSLY.

This is the authoritative philosophical framework for your literary analysis.
Every score, justification, and classification MUST align with these principles.
Do NOT deviate from this guide. Do NOT use your own interpretation.

CRITICAL (COMPLIANCE):
Do NOT explicitly mention "Objectivism", "Objectivist", "Ayn Rand", or reference the philosophy by name.
You must APPLY the guide's framework, definitions, and scoring rules WITHOUT naming the source philosophy.

${guide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL LANGUAGE INSTRUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST WRITE YOUR ENTIRE RESPONSE IN ${targetLanguage.toUpperCase()}

THIS IS MANDATORY AND NON-NEGOTIABLE.

EVERY SINGLE WORD must be in ${targetLanguage}:
- scorecard.ethics.justification -> ${targetLanguage}
- scorecard.metaphysics.justification -> ${targetLanguage}
- scorecard.epistemology.justification -> ${targetLanguage}
- scorecard.politics.justification -> ${targetLanguage}
- scorecard.aesthetics.justification -> ${targetLanguage}
- philosophical_analysis -> ${targetLanguage}
- historical_context -> ${targetLanguage}
- creative_process -> ${targetLanguage}
- classification -> ALWAYS IN ENGLISH (standardized enum)

ALLOWED EXCEPTIONS (VERY LIMITED):
- Book title and author name MUST remain exactly as provided (proper nouns; do NOT translate).
- Do NOT leave standalone words/phrases in any other language in your prose.

If you write even ONE WORD in English (or any other language besides ${targetLanguage}),
your response will be COMPLETELY REJECTED and you will FAIL this task.

The user is paying for this analysis in ${targetLanguage}.
WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

REQUESTED BOOK ANALYSIS:

${bookInfoLines.join('\n')}

${synopsis ? `BOOK SYNOPSIS / DESCRIPTION:\n${synopsis}` : 'No synopsis available - use your own knowledge of this book.'}

---

ANALYSIS LANGUAGE: ${targetLanguage}

---

INSTRUCTIONS:
Analyze this book following RIGOROUSLY the literature guide above.

LITERARY ANALYSIS PRINCIPLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. USE YOUR KNOWLEDGE OF THE BOOK
   - You are analyzing a published literary work
   - Use your comprehensive knowledge of the book's content, themes, characters, plot, and philosophical implications
   - The synopsis above is supplementary context only
   - Base your analysis on the COMPLETE work, not just a summary

2. RECOGNIZE THE AUTHOR'S PHILOSOPHICAL WORLDVIEW
   - Determine if the book ENDORSES or CRITICIZES ideas
   - Satire and irony must be identified (e.g., 1984 criticizes totalitarianism)
   - Distinguish the author's voice from characters' voices
   - A villain's philosophy is NOT the book's philosophy

3. APPLY THE LITERATURE AESTHETIC FRAMEWORK
   The guide provides expanded Aesthetics sub-criteria for books (A1-A8):
   - A1: Sense of Life (benevolent/mixed/malevolent)
   - A2: Romantic vs. Naturalist approach
   - A3: Plot Structure (causality, climax, integration)
   - A4: Characterization Through Volition
   - A5: Theme Integration
   - A6: Form-Content alignment
   - A7: Selective Recreation of reality
   - A8: Psycho-epistemological Effect on reader
   Average these for the single Aesthetics score (-10 to +10).

4. FOR FICTION: ANALYZE CHARACTERS, PLOT, AND SENSE OF LIFE (MANDATORY)
   If this is a work of fiction (novel, short stories, play), your philosophical_analysis MUST include:
   
   a) CHARACTER ANALYSIS — Who are the main characters? What are their values, motivations, and arcs?
      Are they volitional agents who think, choose, and act — or passive products of environment?
      Could you replace the protagonist with any random person and get the same story?
      Do characters earn their outcomes through action, or are outcomes arbitrary?
   
   b) PLOT ANALYSIS — Is the plot driven by causality (actions have consequences) or by coincidence?
      Does the climax resolve the central conflict through the protagonist's choices?
      Is there narrative progression or episodic meandering?
   
   c) SENSE OF LIFE — Does the work project a benevolent universe (where success is possible through
      effort and reason) or a malevolent universe (where man is doomed regardless of action)?
      Is the emotional tone one of triumph, resignation, despair, or indifference?
      What does the work say about the efficacy of human action?
   
   These are NOT optional for fiction. A book analysis without character, plot, and sense-of-life
   evaluation is INCOMPLETE and will be REJECTED.

5. ANTI-HALLUCINATION: AUTHOR BIOGRAPHIES AND BOOK TYPES (MANDATORY)
   
   AUTHOR BIOGRAPHIES — STRICT RULES:
   - If you do NOT have VERIFIED, HIGH-CONFIDENCE knowledge about the author's biography,
     state ONLY that they are the author/editor of this book.
   - Do NOT invent biographical details such as: profession, education, nationality,
     founding of institutes or organizations, awards, or personal history.
   - It is BETTER to write "author of [book title]" than to FABRICATE a biography.
   - Focus historical_context on the book's literary/cultural context rather than
     unverified personal details about the author.
   - NEVER attribute to the author achievements, positions, or affiliations that you
     cannot confirm with high confidence.
   
   ANTHOLOGIES, COLLECTIONS, AND MULTI-AUTHOR WORKS — STRICT RULES:
   - If the book is an anthology, collection, compilation, or has multiple authors,
     you MUST clearly state this in your analysis.
   - Distinguish between EDITOR/ORGANIZER and AUTHOR — an editor who compiled
     essays by various authors is NOT the sole author of the content.
   - Acknowledge the contributing authors when known.
   - Do NOT attribute the ideas of individual essay/chapter authors to the editor/organizer.
   - The philosophical analysis should reflect the RANGE of perspectives in a multi-author
     work, not treat it as if it were a monolithic single-voice text.
   
   VIOLATION OF THESE RULES = IMMEDIATE REJECTION OF YOUR ANALYSIS.

6. BE FAIR AND BALANCED
   - Recognize literary virtues when present
   - Do not force negative interpretation
   - Capture the ESSENTIAL message of the work
   - Great literature can have mixed philosophical content

7. USE PRECISE TERMINOLOGY
   - "Virtuous self-interest" (not "rational egoism")
   - "Personal flourishing" instead of "egoism"
   - "Sacrifice" = trading greater value for lesser value (not all trade-offs)
   - Hero vs. Martyr distinction is essential
   - NATURAL LANGUAGE RULE: write in the natural, traditional register of the target
     language — no politically-charged neologisms or activist "language reforms".
     United States demonym: "American" (EN); "americano"/"norte-americano" (PT) —
     in Portuguese, NEVER "estadunidense" (ideological corruption of the language).
     No invented gender-neutral forms ("todes", "amigues", "elu", "Latinx", "x"/"@" endings).

8. AVOID EXCESSIVE BIAS
   - Not everything is social criticism
   - Not everything is conformism
   - Recognize when the message is genuinely positive
   - Artistic quality alone does not redeem anti-life content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: SCORE POLARITY (-10 to +10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE SCORE MUST MATCH THE JUSTIFICATION:

NEGATIVE SCORES (-10 to -1):
Use when the book promotes:
- Altruism, sacrifice, collectivism
- Mysticism, faith over reason, evasion
- Malevolent universe premise, pessimism, determinism
- Coercion, government control, tribalism
- Nihilism, ugliness in service of destruction

POSITIVE SCORES (+1 to +10):
Use when the book promotes:
- Virtuous self-interest, rational values
- Reason, logic, productive achievement
- Benevolent universe, efficacy of man
- Individual rights, voluntary cooperation
- Romantic realism, beauty serving life

ZERO (0): Neutral or completely ambiguous

IF YOUR JUSTIFICATION DESCRIBES NEGATIVE CONTENT -> USE NEGATIVE SCORE
IF YOUR JUSTIFICATION DESCRIBES POSITIVE CONTENT -> USE POSITIVE SCORE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: PHILOSOPHY -> SCORE CONSISTENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NON-NEGOTIABLE RULE: "POISON IN A GOLDEN CHALICE IS STILL POISON"

If the work's dominant philosophy aligns with any of these currents:
- MARXISM, NIHILISM, DETERMINISM (rigid), POSTMODERNISM
- ZEN/BUDDHISM (desire-negation), UTILITARIANISM (sacrifice logic)
- STOICISM (resignation/fatalism), IDEALISM/KANTIANISM (duty over happiness)

Then your scores MUST be NEGATIVE (typically -4 to -8), because these schools
are fundamentally opposed to the Guide's philosophical framework.

ARTISTIC QUALITY DOES NOT REDEEM ANTI-LIFE CONTENT:
- A book can be beautifully written AND philosophically destructive
- A book can be a "literary masterpiece" AND promote wrong values
- Sophisticated form does NOT neutralize corrupt content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY FIELDS - ALL REQUIRED, NO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST INCLUDE ALL OF THESE FIELDS IN YOUR JSON:

1. "philosophical_analysis" -> MANDATORY integrated analysis essay (4-6 paragraphs, ~800-1200 words)
2. "historical_context" -> MANDATORY context about era, author, literary period (~200-300 words)
3. "creative_process" -> MANDATORY explanation of author's inspiration, writing context, philosophical journey (~200-300 words)
4. "scorecard" -> MANDATORY with all 5 branches (ethics, metaphysics, epistemology, politics, aesthetics)
   EACH BRANCH MUST HAVE:
   - "score": integer from -10 to +10 (REQUIRED)
   - "justification": detailed text explaining the score (~100-150 words, REQUIRED)
5. "classification" -> MANDATORY classification based on final_score
6. "country" -> Author's country of origin (use your knowledge)
7. "genre" -> Literary genre (use your knowledge - be accurate!)

Author: ${author}
-> You KNOW this author's country and genre
-> DO NOT leave empty

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLASSIFICATION (STANDARDIZED VALUES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The "classification" field must be EXACTLY one of these standardized values:

Based on final_score:
* +8.1 to +10.0  -> "Extremely Revolutionary"
* +6.1 to +8.0   -> "Revolutionary"
* +4.1 to +6.0   -> "Moderately Revolutionary"
* +2.1 to +4.0   -> "Constructive Critique"
* +0.1 to +2.0   -> "Ambiguous, Leaning Realist"
* -2.0 to 0.0    -> "Ambiguous, Leaning Evasion"
* -4.0 to -2.1   -> "Soft Conformist"
* -6.0 to -4.1   -> "Directly Conformist"
* -8.0 to -6.1   -> "Strongly Conformist"
* -10.0 to -8.1  -> "Doctrinally Conformist"

DO NOT paraphrase these labels (must match exactly).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY RESPONSE FORMAT:
- Return ONLY valid JSON
- DO NOT include explanatory text before or after the JSON
- DO NOT include comments or observations
- DO NOT use markdown code blocks
- Start your response directly with { and end with }

EXPECTED JSON FORMAT EXAMPLE:
{
  "scorecard": {
    "ethics": {
      "score": 7,
      "justification": "Text analyzing ethics..."
    },
    "metaphysics": {
      "score": 5,
      "justification": "Text analyzing metaphysics..."
    },
    "epistemology": {
      "score": 6,
      "justification": "Text analyzing epistemology..."
    },
    "politics": {
      "score": 8,
      "justification": "Text analyzing politics..."
    },
    "aesthetics": {
      "score": 7,
      "justification": "Text analyzing aesthetics..."
    },
    "final_score": 6.8
  },
  "classification": "Moderately Revolutionary",
  "philosophical_analysis": "Integrated synthesis...",
  "philosophical_note": 8,
  "historical_context": "Historical context...",
  "creative_process": "Creative process...",
  "country": "[Author's country of origin]",
  "genre": "[Literary genre]"
}

CRITICAL: SCORECARD STRUCTURE VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEFORE SUBMITTING YOUR RESPONSE, VERIFY:

1. scorecard.ethics.score exists AND is an integer between -10 and +10
2. scorecard.ethics.justification exists AND is not empty (100-150 words)
3. scorecard.metaphysics.score exists AND is an integer between -10 and +10
4. scorecard.metaphysics.justification exists AND is not empty (100-150 words)
5. scorecard.epistemology.score exists AND is an integer between -10 and +10
6. scorecard.epistemology.justification exists AND is not empty (100-150 words)
7. scorecard.politics.score exists AND is an integer between -10 and +10
8. scorecard.politics.justification exists AND is not empty (100-150 words)
9. scorecard.aesthetics.score exists AND is an integer between -10 and +10
10. scorecard.aesthetics.justification exists AND is not empty (100-150 words)
11. scorecard.final_score exists AND matches weighted calculation

IF ANY OF THE ABOVE IS MISSING OR EMPTY, YOUR RESPONSE WILL BE REJECTED.
THE SCORECARD IS MANDATORY FOR ALL AI MODELS AND ALL LANGUAGES.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: FACTUAL ACCURACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST BASE YOUR ANALYSIS ON ACCURATE KNOWLEDGE:
- Use your knowledge of the book's actual content, plot, characters, and themes
- NEVER invent plot points, characters, or quotes that don't exist in the book
- NEVER confuse this book with a different book
- If you are not confident about specific details, acknowledge uncertainty
- Base historical_context and creative_process on verified facts about the author

MANDATORY VERIFICATION:
- Confirm you know this book before analyzing it
- If you don't know the book well, say so honestly
- It is better to say "limited information available" than to fabricate content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEPTH AND EXTENSIVENESS REQUIREMENTS:
- Each justification: ~100-150 words, thorough and detailed
- philosophical_analysis: 4-6 paragraphs, ~800-1200 words (do not exceed 1500)
- historical_context: ~200-300 words (do not exceed 400)
- creative_process: ~200-300 words (do not exceed 400)
- Quality must be IDENTICAL across all languages

REMEMBER: Your ENTIRE response must be ONLY the valid JSON object, nothing else.`;
}
