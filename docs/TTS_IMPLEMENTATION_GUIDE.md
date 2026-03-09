# Philosify TTS System - Complete Implementation Guide

## Table of Contents

1. [Overview](#1-overview)
2. [Voice Architecture](#2-voice-architecture)
3. [Character Names](#3-character-names)
4. [Pronunciation Requirements](#4-pronunciation-requirements)
5. [Podcast Phrases](#5-podcast-phrases)
6. [Script Structure](#6-script-structure)
7. [Dialogue Flow](#7-dialogue-flow)
8. [Implementation Tasks](#8-implementation-tasks)

---

## 1. Overview

### System Purpose
Generate natural-sounding podcast-style audio analysis of songs using Gemini 2.5 Flash TTS with 4 distinct voices in conversational dialogue.

### Current Architecture
- **4 parallel chunks** generated simultaneously for ~65% faster generation
- **4 voices**: 1 Host (female) + 3 Experts (male)
- **18 supported languages**
- **R2 caching** for repeated playback

### Key Files
| File | Purpose |
|------|---------|
| `api/src/tts/gemini.js` | Main TTS generation logic |
| `api/src/handlers/tts.js` | Legacy OpenAI TTS (deprecated) |
| `site/src/services/ttsCache.js` | Frontend TTS service |

---

## 2. Voice Architecture

### Voice Configuration

| Role | Gender | Gemini Voice | Appears In |
|------|--------|--------------|------------|
| **Host** | Female | Aoede | All 4 chunks |
| **Historian** | Male | Charon | Chunk 1 only |
| **Music Critic** | Male | Fenrir | Chunk 2 only |
| **Philosopher** | Male | Puck | Chunks 3 & 4 |

### Chunk Distribution

| Chunk | Content | Voices |
|-------|---------|--------|
| 1 | Historical Context | Host ↔ Historian |
| 2 | Creative Process | Host ↔ Critic |
| 3 | Philosophical Analysis Part 1 | Host ↔ Philosopher |
| 4 | Philosophical Analysis Part 2 + Verdict | Host ↔ Philosopher |

### Voice Contrast Requirement
- Each chunk must have **Male/Female alternation**
- **NEVER** two voices of same gender in sequence
- This creates natural conversational distinction

---

## 3. Character Names

### Purpose
- Speakers address each other **by name** for natural dialogue
- Names are **language-specific** for cultural authenticity

### Current Name Configuration (18 languages)

| Lang | Host (F) | Historian (M) | Critic (M) | Philosopher (M) |
|------|----------|---------------|------------|-----------------|
| EN | Emma | James | David | Michael |
| PT | Maria | João | Lucas | Pedro |
| ES | María | Carlos | Diego | Miguel |
| FR | Marie | Pierre | Antoine | Jean |
| DE | Anna | Thomas | Felix | Michael |
| IT | Giulia | Marco | Andrea | Luca |
| RU | Мария | Александр | Иван | Дмитрий |
| JA | 美咲 | 健太 | 大輝 | 翔太 |
| KO | 서연 | 민준 | 현우 | 준호 |
| ZH | 芳 | 伟 | 浩 | 明 |
| AR | فاطمة | محمد | عمر | أحمد |
| HE | שרה | דוד | יונתן | יוסי |
| HI | प्रिया | राहुल | विकास | अमित |
| FA | مریم | علی | رضا | محمد |
| TR | Zeynep | Mehmet | Emre | Ahmet |
| HU | Anna | László | Gábor | Péter |
| PL | Anna | Jan | Tomasz | Piotr |
| NL | Emma | Jan | Daan | Thomas |

---

## 4. Pronunciation Requirements

### Brand Name: "Philosify"

| Property | Value |
|----------|-------|
| IPA | /fəˈlɒsɪfaɪ/ |
| Phonetic | phi-LOS-i-fy |
| Stress | 2nd syllable |
| Ending | "-sify" (like Spotify) |
| Mnemonic | "philosophy + Spotify" |

### FORBIDDEN Pronunciations
- "Philosofy" ❌
- "Philosophy" ❌
- Any "-sofy" or "-zofy" ending ❌

### Implementation Strategy
Since Gemini TTS doesn't support `systemInstruction`, pronunciation is enforced via **phonetic spelling**:

| Language | Written As |
|----------|------------|
| EN | Filosifai |
| PT | Filosifai |
| ES | Filosifai |
| FR | Filosifaï |
| DE | Filosifai |
| IT | Filosifai |
| JA | フィロシファイ |
| KO | 필로시파이 |
| ZH | Filosifai |
| RU | Философай |
| AR | في-لو-سي-فاي |
| HE | פילוסיפאי |
| HI | फ़िलोसिफ़ाय |
| NL | Filosifai |
| PL | Filosifaj |
| TR | Filosifay |
| HU | Filosifáj |
| FA | فیلوسیفای |

### Where Phonetic Spelling Must Be Used
1. `PODCAST_PHRASES.{lang}.welcome` - Podcast intro
2. `PODCAST_PHRASES.{lang}.thanks` - Podcast outro
3. Script headers - `# PODCAST: Filosifai - ...`
4. `generateContextualQuestions` prompt - `"...host of the Filosifai podcast..."`

---

## 5. Podcast Phrases

### Structure per Language

Each language in `PODCAST_PHRASES` must have these keys:

```javascript
{
  // Basic phrases
  welcome: "...",           // Podcast intro with Filosifai
  byArtist: "...",          // "by" connector
  fascinating: "...",       // Initial reaction
  interesting: "...",       // Expert's first response
  
  // Handoff phrases (Host → Expert, with {name} placeholder)
  historianHandoff: "{name}, ...",    // Host → Historian
  criticHandoff: "{name}, ...",       // Host → Critic  
  philosopherHandoff: "{name}, ...",  // Host → Philosopher
  verdictHandoff: "{name}, ...",      // Host → Philosopher (verdict)
  
  // Transition phrases (legacy, used as fallback)
  background: "...",        // Ask for background
  creativeIntro: "...",     // Transition to creative
  analysisIntro: "...",     // Transition to analysis
  verdictIntro: "...",      // Ask for verdict
  
  // Verdict phrases
  scoreIs: "...",           // "The score is"
  outOf10: "...",           // "out of 10"
  classification: "...",    // "This places it in"
  category: "...",          // "category"
  
  // Sign-off
  thanks: "...",            // With Filosifai
  
  // Reactions (array of 8)
  reactions: [
    "That's fascinating.",
    "Interesting point.",
    // ... 6 more
  ]
}
```

### Handoff Phrase Requirements

| Key | Purpose | Example (English) |
|-----|---------|-------------------|
| `historianHandoff` | Host addresses Historian at start of Chunk 1 | "{name}, tell us about the history behind this song." |
| `criticHandoff` | Host addresses Critic at start of Chunk 2 | "Thanks! {name}, what can you tell us about the creative process?" |
| `philosopherHandoff` | Host addresses Philosopher at start of Chunk 3 | "Excellent insights! {name}, let's dive into the philosophical analysis." |
| `verdictHandoff` | Host asks Philosopher for verdict in Chunk 4 | "{name}, what's your final verdict on this song?" |

---

## 6. Script Structure

### Script Header Format

Each chunk script starts with:

```
# PODCAST: Filosifai - {Chunk Title} ({Language Name})
Voices:
- {HostVoice} ({HostName}): Warm, engaging female host.
- {ExpertVoice} ({ExpertName}): {Expert description}.

PACING: Natural conversational flow. Brief pauses between speakers.
LANGUAGE: Speak ONLY in {Language Name}.

## SCRIPT

{Dialogue content}
```

### Example (Portuguese, Chunk 2)

```
# PODCAST: Filosifai - Creative Process (Portuguese)
Voices:
- Aoede (Maria): Warm, engaging female host.
- Fenrir (Lucas): Enthusiastic male music critic.

PACING: Natural conversational flow. Brief pauses between speakers.
LANGUAGE: Speak ONLY in Portuguese.

## SCRIPT

**Aoede:** Obrigada! Lucas, o que você pode nos contar sobre o processo criativo?

**Fenrir:** O processo criativo desta música foi bastante interessante...

**Aoede:** Isso é realmente fascinante.

**Fenrir:** A gravação aconteceu em um estúdio pequeno...
```

---

## 7. Dialogue Flow

### Interjection System

Each chunk has **2-3 interjections** where the Host interjects:
- **R (Reaction)**: Short affirmation ("Fascinating!", "Interesting point.")
- **Q (Question)**: Contextual question leading into next content

### Interjection Pattern

| Content Length | Interjections | Pattern |
|----------------|---------------|---------|
| < 3 sentences | 1 | [R] |
| 3-5 sentences | 2 | [R, Q] |
| 6+ sentences | 3 | [R, Q, R] |

### Question Requirement

When Host asks a question (Q), **must include expert's name**:

```javascript
// Current (WRONG):
**Aoede:** What inspired the creative direction?

// Required (CORRECT):
**Aoede:** Lucas, what inspired the creative direction?
```

### Implementation in `buildChunkDialogue`

```javascript
function buildChunkDialogue(text, reactions, question, hostVoice, expertVoice, expertCharacterName) {
  // ...
  if (type === "Q" && question && !questionUsed) {
    // Prepend expert name to question
    interjection = expertCharacterName 
      ? `${expertCharacterName}, ${question}` 
      : question;
    questionUsed = true;
  }
  // ...
}
```

---

## 8. Implementation Tasks

### Task 1: Add Handoff Phrases to All 18 Languages

**Files:** `api/src/tts/gemini.js`

**Phrases to add per language (4 each):**

| Key | English Example |
|-----|-----------------|
| `historianHandoff` | "{name}, tell us about the history behind this song." |
| `criticHandoff` | "Thanks! {name}, what can you tell us about the creative process?" |
| `philosopherHandoff` | "Excellent insights! {name}, let's dive into the philosophical analysis." |
| `verdictHandoff` | "{name}, what's your final verdict on this song?" |

---

### Task 2: Update `buildChunkDialogue` Function

**Current signature:**
```javascript
function buildChunkDialogue(text, reactions, question, hostName, expertName)
```

**New signature:**
```javascript
function buildChunkDialogue(text, reactions, question, hostVoice, expertVoice, expertCharacterName)
```

**Update question handling:**
```javascript
if (type === "Q" && question && !questionUsed) {
  interjection = expertCharacterName 
    ? `${expertCharacterName}, ${question}` 
    : question;
  questionUsed = true;
}
```

---

### Task 3: Update All 4 Call Sites

Pass character names to `buildChunkDialogue`:

| Chunk | Pass Name |
|-------|-----------|
| 1 - History | `names.historian` |
| 2 - Creative | `names.critic` |
| 3 - Analysis 1 | `names.philosopher` |
| 4 - Analysis 2 | `names.philosopher` |

---

### Task 4: Deploy and Test

1. Deploy API: `npm run deploy:prod`
2. Commit and push to all branches
3. Clear TTS cache (R2)
4. Test in multiple languages

---

## Summary Checklist

| # | Task | Status |
|---|------|--------|
| 1 | Voice config: Critic = Male (Fenrir) | ✓ Done |
| 2 | Character names: All 18 languages | ✓ Done |
| 3 | Pronunciation: "Filosifai" in PODCAST_PHRASES | ✓ Done |
| 4 | Pronunciation: "Filosifai" in script headers | ✓ Done |
| 5 | Pronunciation: "Filosifai" in question prompt | ✓ Done |
| 6 | Handoff phrases: EN, PT | ✓ Done |
| 7 | Handoff phrases: 16 other languages | TODO |
| 8 | Update buildChunkDialogue signature | TODO |
| 9 | Update 4 call sites with character names | TODO |
| 10 | Prepend expert name to questions | TODO |
| 11 | Deploy and test | TODO |
