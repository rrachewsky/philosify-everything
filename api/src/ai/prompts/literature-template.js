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
  // Probable School of Thought disclaimer (localized)
  const probableSchoolDisclaimerByLang = {
    en: "School of Thought is a supposition based on probability. It may not be as accurate as you are expecting.",
    pt: "Escola de Pensamento é uma suposição baseada em probabilidade. Pode não ser tão precisa quanto você espera.",
    es: "La Escuela de Pensamiento es una suposición basada en probabilidad. Puede no ser tan precisa como esperas.",
    fr: "L'École de pensée est une supposition fondée sur la probabilité. Elle peut ne pas être aussi précise que vous l'espérez.",
    de: "Die Denkschule ist eine Annahme auf Basis von Wahrscheinlichkeit. Sie ist möglicherweise nicht so präzise, wie Sie erwarten.",
    it: "La Scuola di pensiero è una supposizione basata sulla probabilità. Potrebbe non essere precisa quanto ti aspetti.",
    hu: "A gondolkodási iskola valószínűségen alapuló feltételezés. Lehet, hogy nem olyan pontos, mint várnád.",
    ru: "Школа мысли — это предположение, основанное на вероятности. Оно может быть не таким точным, как вы ожидаете.",
    ja: "思想学派は確率に基づく推測です。期待するほど正確ではない場合があります。",
    zh: "思想学派是基于概率的推测。它可能不如您期望的那样准确。",
    ko: "사상 학파는 확률에 기반한 추측입니다. 기대만큼 정확하지 않을 수 있습니다.",
    he: "אסכולת המחשבה היא השערה המבוססת על הסתברות. ייתכן שהיא לא מדויקת כפי שאתה מצפה.",
    ar: "مدرسة الفكر هي افتراض قائم على الاحتمالية. قد لا تكون دقيقة كما تتوقع.",
    hi: "विचार का स्कूल संभावना पर आधारित एक अनुमान है। यह उतना सटीक नहीं हो सकता जितना आप उम्मीद कर रहे हैं।",
    fa: "مکتب فکری یک فرض بر اساس احتمال است. ممکن است به اندازه‌ای که انتظار دارید دقیق نباشد.",
  };
  const probableSchoolDisclaimer =
    probableSchoolDisclaimerByLang[String(lang || "en").toLowerCase()] ||
    probableSchoolDisclaimerByLang.en;
  const probableSchoolPrefixByLang = {
    en: "Probable School of Thought",
    pt: "Escola de Pensamento (provável)",
    es: "Escuela de Pensamiento (probable)",
    fr: "École de pensée (probable)",
    de: "Denkschule (wahrscheinlich)",
    it: "Scuola di pensiero (probabile)",
    hu: "Valószínű gondolkodási iskola",
    ru: "Вероятная школа мысли",
    ja: "推定される思想学派",
    zh: "可能的思想学派",
    ko: "추정 사상 학파",
    he: "אסכולת מחשבה משוערת",
    ar: "مدرسة الفكر المحتملة",
    hi: "संभावित विचार स्कूल",
    fa: "مکتب فکری احتمالی",
  };
  const probableSchoolPrefix =
    probableSchoolPrefixByLang[String(lang || "en").toLowerCase()] ||
    probableSchoolPrefixByLang.en;

  // Schools of Thought labels (localized)
  const schoolLabels = {
    en: { primary: "Primary", secondary: "Secondary", peripheral: "Peripheral", exclusions: "Exclusions", not: "NOT", evidence: "Evidence", metaphysics: "Metaphysics", epistemology: "Epistemology", ethics: "Ethics", politics: "Politics", aesthetics: "Aesthetics" },
    pt: { primary: "Primário", secondary: "Secundário", peripheral: "Periférico", exclusions: "Exclusões", not: "NÃO", evidence: "Evidência", metaphysics: "Metafísica", epistemology: "Epistemologia", ethics: "Ética", politics: "Política", aesthetics: "Estética" },
    es: { primary: "Primario", secondary: "Secundario", peripheral: "Periférico", exclusions: "Exclusiones", not: "NO", evidence: "Evidencia", metaphysics: "Metafísica", epistemology: "Epistemología", ethics: "Ética", politics: "Política", aesthetics: "Estética" },
    fr: { primary: "Primaire", secondary: "Secondaire", peripheral: "Périphérique", exclusions: "Exclusions", not: "PAS", evidence: "Preuve", metaphysics: "Métaphysique", epistemology: "Épistémologie", ethics: "Éthique", politics: "Politique", aesthetics: "Esthétique" },
    de: { primary: "Primär", secondary: "Sekundär", peripheral: "Peripher", exclusions: "Ausschlüsse", not: "NICHT", evidence: "Beleg", metaphysics: "Metaphysik", epistemology: "Erkenntnistheorie", ethics: "Ethik", politics: "Politik", aesthetics: "Ästhetik" },
    it: { primary: "Primario", secondary: "Secondario", peripheral: "Periferico", exclusions: "Esclusioni", not: "NON", evidence: "Evidenza", metaphysics: "Metafisica", epistemology: "Epistemologia", ethics: "Etica", politics: "Politica", aesthetics: "Estetica" },
    hu: { primary: "Elsődleges", secondary: "Másodlagos", peripheral: "Perifériás", exclusions: "Kizárások", not: "NEM", evidence: "Bizonyíték", metaphysics: "Metafizika", epistemology: "Ismeretelmélet", ethics: "Etika", politics: "Politika", aesthetics: "Esztétika" },
    ru: { primary: "Первичная", secondary: "Вторичная", peripheral: "Периферийная", exclusions: "Исключения", not: "НЕ", evidence: "Доказательство", metaphysics: "Метафизика", epistemology: "Эпистемология", ethics: "Этика", politics: "Политика", aesthetics: "Эстетика" },
    ja: { primary: "主要", secondary: "副次的", peripheral: "周辺的", exclusions: "除外", not: "非", evidence: "証拠", metaphysics: "形而上学", epistemology: "認識論", ethics: "倫理学", politics: "政治学", aesthetics: "美学" },
    zh: { primary: "主要", secondary: "次要", peripheral: "边缘", exclusions: "排除", not: "非", evidence: "证据", metaphysics: "形而上学", epistemology: "认识论", ethics: "伦理学", politics: "政治学", aesthetics: "美学" },
    ko: { primary: "주요", secondary: "부차적", peripheral: "주변적", exclusions: "제외", not: "아님", evidence: "증거", metaphysics: "형이상학", epistemology: "인식론", ethics: "윤리학", politics: "정치학", aesthetics: "미학" },
    he: { primary: "ראשי", secondary: "משני", peripheral: "היקפי", exclusions: "החרגות", not: "לא", evidence: "ראיה", metaphysics: "מטאפיזיקה", epistemology: "אפיסטמולוגיה", ethics: "אתיקה", politics: "פוליטיקה", aesthetics: "אסתטיקה" },
    ar: { primary: "أساسي", secondary: "ثانوي", peripheral: "هامشي", exclusions: "استثناءات", not: "ليس", evidence: "دليل", metaphysics: "ميتافيزيقا", epistemology: "نظرية المعرفة", ethics: "أخلاق", politics: "سياسة", aesthetics: "جماليات" },
    hi: { primary: "प्राथमिक", secondary: "द्वितीयक", peripheral: "परिधीय", exclusions: "बहिष्करण", not: "नहीं", evidence: "साक्ष्य", metaphysics: "तत्वमीमांसा", epistemology: "ज्ञानमीमांसा", ethics: "नीतिशास्त्र", politics: "राजनीति", aesthetics: "सौंदर्यशास्त्र" },
    fa: { primary: "اصلی", secondary: "ثانویه", peripheral: "حاشیه‌ای", exclusions: "استثناها", not: "نه", evidence: "شواهد", metaphysics: "متافیزیک", epistemology: "معرفت‌شناسی", ethics: "اخلاق", politics: "سیاست", aesthetics: "زیبایی‌شناسی" },
  };
  const L_schools =
    schoolLabels[String(lang || "en").toLowerCase()] || schoolLabels.en;

  // Language code to name mapping
  const langNames = {
    en: "English", pt: "Portuguese", es: "Spanish", de: "German",
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
CRITICAL: SCHOOL OF THOUGHT -> SCORE CONSISTENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NON-NEGOTIABLE RULE: "POISON IN A GOLDEN CHALICE IS STILL POISON"

If your schools_of_thought analysis identifies as PRIMARY school any of these:
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

SCHOOL(S) OF THOUGHT - CLASSIFICATION (MANDATORY FIELD: schools_of_thought):

USE ONLY THESE 17 SCHOOLS - NO EXCEPTIONS, NO INVENTIONS:

1. OBJECTIVISM - Ayn Rand, Leonard Peikoff
2. MARXISM - Karl Marx, Friedrich Engels
3. STOICISM - Epictetus, Seneca, Marcus Aurelius
4. EXISTENTIALISM - Sartre, Camus, de Beauvoir
5. NIHILISM - Max Stirner, Nietzsche (diagnostic)
6. UTILITARIANISM - Bentham, Mill, Singer
7. DETERMINISM - Spinoza, d'Holbach
8. HEDONISM - Aristippus, Epicurus
9. PRAGMATISM - James, Dewey, Rorty
10. ZEN/BUDDHISM - Nagarjuna, Dogen
11. IDEALISM/KANTIANISM - Kant, Fichte, Hegel
12. POSTMODERNISM - Foucault, Derrida, Butler
13. SECULAR HUMANISM - Russell, Sagan, Pinker
14. JUDAISM - Maimonides, Philo
15. CATHOLICISM - Aquinas, Augustine
16. PROTESTANTISM - Luther, Calvin
17. ISLAM - Avicenna, Averroes

FORBIDDEN NAMES (NEVER USE):
- "Individualism", "Rational Individualism"
- "Liberalism", "Classical Liberalism", "Libertarianism"
- "Romanticism", "Humanism" (alone)
- ANY name not in the 17 schools above

CLASSIFICATION REQUIRES 5-AXIS ALIGNMENT.
If alignment is partial or mixed -> use "Mixed/Uncertain" or list as Secondary/Peripheral.

OBJECTIVISM DISQUALIFIERS - AUTOMATIC EXCLUSION:
A book CANNOT be classified as OBJECTIVISM if it contains:
1. Religious/mystical elements (God, prayer, divine intervention, afterlife)
2. Resignation/fatalism/passivity (acceptance without action)
3. Altruism/self-sacrifice as moral duty (sacrifice for "the greater good")
4. Collectivism (group identity over individual)
5. Anti-reason/emotionalism ("follow your heart, not your head")

EXCEPTION: Dying for a deeply loved person IS compatible with Objectivism (acting on highest values).

ONE DISQUALIFIER = CANNOT BE OBJECTIVISM.

If you cannot find a matching school -> "Mixed/Uncertain"
NEVER invent a school name.

You MUST include a top-level JSON field "schools_of_thought" (string) written in ${targetLanguage}.
This MUST be a standalone container/section (NOT inside philosophical_analysis).
Formatting requirement: return HTML (no markdown). Use <strong> for school names and <br/> for line breaks.

ALL text in schools_of_thought MUST be in ${targetLanguage}, including ALL labels.

REQUIRED STRUCTURE (ALL TEXT IN ${targetLanguage}):
  <strong>${probableSchoolPrefix}</strong><br/><br/>
  1. <strong>${L_schools.primary}:</strong> <SCHOOL NAME> - <Key Philosophers> (Level 1-2)<br/>
  * ${L_schools.metaphysics}: <brief description><br/>
  * ${L_schools.epistemology}: <brief description><br/>
  * ${L_schools.ethics}: <brief description><br/>
  * ${L_schools.politics}: <brief description><br/>
  * ${L_schools.aesthetics}: <brief description><br/>
  <em>${L_schools.evidence}:</em> <book-based justification><br/><br/>
  2. <strong>${L_schools.secondary}:</strong> <SCHOOL - Philosophers> (Level 2-3) - <brief evidence><br/><br/>
  3. <strong>${L_schools.peripheral}:</strong> <SCHOOL - Philosophers> (Level 3) - <brief evidence><br/><br/>
  4. <strong>${L_schools.exclusions}:</strong> ${L_schools.not} <list schools clearly absent><br/><br/>
  ${probableSchoolDisclaimer}

DEPTH AND EXTENSIVENESS REQUIREMENTS:
- Each justification: ~100-150 words, thorough and detailed
- philosophical_analysis: 4-6 paragraphs, ~800-1200 words (do not exceed 1500)
- historical_context: ~200-300 words (do not exceed 400)
- creative_process: ~200-300 words (do not exceed 400)
- Quality must be IDENTICAL across all languages

REMEMBER: Your ENTIRE response must be ONLY the valid JSON object, nothing else.`;
}
