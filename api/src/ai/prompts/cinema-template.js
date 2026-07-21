// ============================================================
// AI - CINEMA ANALYSIS PROMPT BUILDER
// ============================================================
// Mirrors literature-template.js but adapted for films.
// Key differences:
// - Film metadata (director, cast, year, genres, runtime, countries, vote_average, tagline)
// - AI uses its own knowledge of the film + synopsis
// - Cinema Aesthetic Framework guide (expanded aesthetics A1-A8)
// ============================================================

export function buildCinemaAnalysisPrompt(
  title,
  director,
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

  // Build film metadata section
  const filmInfoLines = [];
  filmInfoLines.push(`Title: "${title}"`);
  // CRITICAL: Include original title to prevent AI hallucination of regional titles
  if (metadata?.original_title && metadata.original_title !== title) {
    filmInfoLines.push(`Original Title: "${metadata.original_title}"`);
  }
  filmInfoLines.push(`Director: ${director}`);
  if (metadata?.cast?.length > 0) {
    filmInfoLines.push(`Cast: ${metadata.cast.join(', ')}`);
  }
  if (metadata?.release_year || metadata?.year) {
    filmInfoLines.push(`Year: ${metadata.release_year || metadata.year}`);
  }
  if (metadata?.genres?.length > 0) {
    filmInfoLines.push(`Genres: ${metadata.genres.join(', ')}`);
  }
  if (metadata?.runtime) {
    filmInfoLines.push(`Runtime: ${metadata.runtime} minutes`);
  }
  if (metadata?.countries?.length > 0) {
    filmInfoLines.push(`Countries: ${metadata.countries.join(', ')}`);
  }
  if (metadata?.vote_average) {
    filmInfoLines.push(`Vote Average: ${metadata.vote_average}`);
  }
  if (metadata?.tagline) {
    filmInfoLines.push(`Tagline: "${metadata.tagline}"`);
  }
  if (metadata?.language) {
    filmInfoLines.push(`Original Language: ${metadata.language}`);
  }

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHILOSOPHICAL GUIDE (CINEMA AESTHETIC FRAMEWORK) - MANDATORY REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST CONSULT AND APPLY THE FOLLOWING GUIDE RIGOROUSLY.

This is the authoritative philosophical framework for your cinematic analysis.
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
- Director name MUST remain exactly as provided (proper noun; do NOT translate).
- Do NOT leave standalone words/phrases in any other language in your prose.

CRITICAL - FILM IDENTIFICATION AND TITLE:
- FIRST: Identify the film using the ORIGINAL TITLE provided (if available). This is the canonical identifier.
- The ORIGINAL TITLE tells you EXACTLY which film to analyze. Do NOT confuse it with any other film.
- Example: Original Title "Dead Poets Society" = Brazilian Portuguese "Sociedade dos Poetas Mortos" (NOT "Clube dos Poetas Mortos").
- Example: Original Title "Die Hard" = Brazilian Portuguese "Duro de Matar" (NOT "Morrer Difícil").
- If the user provided a localized title that matches an official regional title, USE THAT EXACT TITLE.
- Do NOT invent or guess regional titles. If unsure, use the original title.
- NEVER treat the same film as two different films due to title variations.
- The official regional title is what appears on posters, DVDs, and streaming services in that region.

If you write even ONE WORD in English (or any other language besides ${targetLanguage}),
your response will be COMPLETELY REJECTED and you will FAIL this task.

The user is paying for this analysis in ${targetLanguage}.
WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

REQUESTED FILM ANALYSIS:

${filmInfoLines.join('\n')}

${synopsis ? `FILM SYNOPSIS / PLOT:\n${synopsis}` : 'No synopsis available - use your own knowledge of this film.'}

---

ANALYSIS LANGUAGE: ${targetLanguage}

---

INSTRUCTIONS:
Analyze this film following RIGOROUSLY the cinema guide above.

CINEMATIC ANALYSIS PRINCIPLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. USE YOUR KNOWLEDGE OF THE FILM
   - You are analyzing a released cinematic work
   - Use your comprehensive knowledge of the film's content, themes, characters, plot, and philosophical implications
   - The synopsis above is supplementary context only
   - Base your analysis on the COMPLETE work, not just a summary

2. RECOGNIZE THE DIRECTOR'S PHILOSOPHICAL WORLDVIEW
   - Determine if the film ENDORSES or CRITICIZES ideas
   - Satire and irony must be identified (e.g., Starship Troopers satirizes fascism)
   - Distinguish the director's artistic choices from characters' perspectives
   - A villain's philosophy is NOT the film's philosophy

3. APPLY THE CINEMA AESTHETIC FRAMEWORK
   The guide provides expanded Aesthetics sub-criteria for films (A1-A8):
   - A1: Sense of Life (benevolent/mixed/malevolent universe projected)
   - A2: Romantic vs. Naturalist approach to storytelling
   - A3: Narrative Structure (causality, climax, plot integration)
   - A4: Characterization Through Volition (are characters agents or victims?)
   - A5: Theme Integration (does form serve content?)
   - A6: Visual Storytelling (cinematography, mise-en-scène serving philosophical themes)
   - A7: Selective Recreation of reality through film language
   - A8: Psycho-epistemological Effect on viewer
   Average these for the single Aesthetics score (-10 to +10).

4. FOR NARRATIVE FILMS: ANALYZE CHARACTERS, PLOT, AND SENSE OF LIFE (MANDATORY)
   If this is a narrative film (fiction, drama, thriller, etc.), your philosophical_analysis MUST include:
   
   a) CHARACTER ANALYSIS — Who are the main characters? What are their values, motivations, and arcs?
      Are they volitional agents who think, choose, and act — or passive products of environment?
      Could you replace the protagonist with any random person and get the same story?
      Do characters earn their outcomes through action, or are outcomes arbitrary?
   
   b) PLOT ANALYSIS — Is the plot driven by causality (actions have consequences) or by coincidence?
      Does the climax resolve the central conflict through the protagonist's choices?
      Is there narrative progression or episodic meandering?
   
   c) SENSE OF LIFE — Does the film project a benevolent universe (where success is possible through
      effort and reason) or a malevolent universe (where man is doomed regardless of action)?
      Is the emotional tone one of triumph, resignation, despair, or indifference?
      What does the film say about the efficacy of human action?
   
   These are NOT optional for narrative films. A film analysis without character, plot, and sense-of-life
   evaluation is INCOMPLETE and will be REJECTED.

5. ANTI-HALLUCINATION: DIRECTOR BIOGRAPHIES AND FILM TYPES (MANDATORY)
   
   DIRECTOR BIOGRAPHIES — STRICT RULES:
   - If you do NOT have VERIFIED, HIGH-CONFIDENCE knowledge about the director's biography,
     state ONLY that they are the director of this film.
   - Do NOT invent biographical details such as: education, nationality,
     founding of studios or production companies, awards, or personal history.
   - It is BETTER to write "director of [film title]" than to FABRICATE a biography.
   - Focus historical_context on the film's cultural/cinematic context rather than
     unverified personal details about the director.
   - NEVER attribute to the director achievements, positions, or affiliations that you
     cannot confirm with high confidence.
   
   DOCUMENTARIES, ANTHOLOGIES, AND MULTI-DIRECTOR WORKS — STRICT RULES:
   - If the film is a documentary, anthology, or has multiple directors,
     you MUST clearly state this in your analysis.
   - Distinguish between DOCUMENTARY and FICTION — a documentary presents real events
     and should be analyzed for its editorial perspective and framing, not as narrative fiction.
   - For anthology films, acknowledge the contributing directors when known.
   - Do NOT attribute the perspectives of documentary subjects to the director as personal beliefs.
   - The philosophical analysis should reflect the editorial stance and framing choices
     in documentaries, not treat presented viewpoints as the director's endorsements.
   
   VIOLATION OF THESE RULES = IMMEDIATE REJECTION OF YOUR ANALYSIS.

6. BE FAIR AND BALANCED
   - Recognize cinematic virtues when present
   - Do not force negative interpretation
   - Capture the ESSENTIAL message of the work
   - Great films can have mixed philosophical content

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

8. JUSTICE AND LIBERTY AS VIRTUOUS SELF-INTEREST
   Acting for justice and liberty is VIRTUE, not altruism:
   - A just, free world is in YOUR interest — defending it IS self-interest
   - Fighting tyranny and protecting innocents from evil = virtuous action
   - NOT standing against injustice when you CAN act = cowardice, not self-interest
   
   Characters who act AGAINST evil (like Schindler) are VIRTUOUS, not altruistic.
   They defend values that make life worth living. This is heroism, not sacrifice.
   
   The passive bystander who watches injustice and claims "self-interest" is a COWARD
   misusing philosophy to justify moral failure. Virtue requires ACTION when possible.

9. AVOID EXCESSIVE BIAS
   - Not everything is social criticism
   - Not everything is conformism
   - Recognize when the message is genuinely positive
   - Artistic quality alone does not redeem anti-life content

10. THE ETHICS OF EMERGENCIES (MANDATORY FOR FILMS DEPICTING PERSECUTION/WAR/GENOCIDE)
   Ethics is designed for NORMAL life, not for emergencies.
   
   An EMERGENCY is: an unchosen situation, limited in time, where survival is
   threatened by factors BEYOND one's control (war, persecution, genocide, disaster).
   
   In emergencies:
   - Survival itself becomes the rational value
   - Normal ethical expectations do not apply the same way
   - You CANNOT judge characters by emergency behavior as if it were normal life
   
   Example: A Holocaust survivor who hid, fled, or relied on others is NOT being
   "passive" or lacking agency — they are rationally surviving an emergency where
   heroic resistance meant certain death. Do NOT criticize real historical figures
   (in biographical films) for not being fictional Romantic heroes.

11. BIOGRAPHICAL VS. FICTIONAL FILMS (MANDATORY DISTINCTION)
    - FICTION: The filmmaker CHOOSES to create passive or active characters.
      This aesthetic choice can be critiqued.
    - BIOGRAPHY/DOCUMENTARY: The filmmaker documents what ACTUALLY HAPPENED.
      Criticizing real people for not being idealized heroes is inappropriate.
    
    A biographical film about survival has VALUE as historical testimony.
    The choice to tell a TRUE story honestly — even if not heroic — is valid.
    Reality is not obligated to conform to Romantic aesthetics.
    
    Films like "The Pianist" or "Schindler's List" document REAL emergencies.
    Judge them for HOW they tell the truth, not for the truth not being heroic enough.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: SCORE POLARITY (-10 to +10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE SCORE MUST MATCH THE JUSTIFICATION:

NEGATIVE SCORES (-10 to -1):
Use when the film promotes:
- Altruism, sacrifice, collectivism
- Mysticism, faith over reason, evasion
- Malevolent universe premise, pessimism, determinism
- Coercion, government control, tribalism
- Nihilism, ugliness in service of destruction

POSITIVE SCORES (+1 to +10):
Use when the film promotes:
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
- A film can be beautifully crafted AND philosophically destructive
- A film can be a "cinematic masterpiece" AND promote wrong values
- Sophisticated form does NOT neutralize corrupt content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY FIELDS - ALL REQUIRED, NO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST INCLUDE ALL OF THESE FIELDS IN YOUR JSON:

1. "philosophical_analysis" -> MANDATORY integrated analysis essay (4-6 paragraphs, ~800-1200 words)
2. "historical_context" -> MANDATORY context about era, director, cinematic period (~200-300 words)
3. "creative_process" -> MANDATORY explanation of director's inspiration, production context, philosophical journey (~200-300 words)
4. "scorecard" -> MANDATORY with all 5 branches (ethics, metaphysics, epistemology, politics, aesthetics)
   EACH BRANCH MUST HAVE:
   - "score": integer from -10 to +10 (REQUIRED)
   - "justification": detailed text explaining the score (~100-150 words, REQUIRED)
5. "classification" -> MANDATORY classification based on final_score
6. "country" -> Country of production (use your knowledge)
7. "genre" -> Film genre (use your knowledge - be accurate!)

Director: ${director}
-> You KNOW this director's country and genre
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
  "country": "[Country of production]",
  "genre": "[Film genre]"
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
- Use your knowledge of the film's actual content, plot, characters, and themes
- NEVER invent plot points, characters, or scenes that don't exist in the film
- NEVER confuse this film with a different film
- If you are not confident about specific details, acknowledge uncertainty
- Base historical_context and creative_process on verified facts about the director

MANDATORY VERIFICATION:
- Confirm you know this film before analyzing it
- If you don't know the film well, say so honestly
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
