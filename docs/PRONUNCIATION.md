# Philosify Pronunciation Standard

## MANDATORY - DO NOT MODIFY WITHOUT APPROVAL

This document defines the canonical pronunciation of "Philosify" across all languages.
These rules are enforced in the TTS system and must never be violated.

---

## Canonical Pronunciation

| Property | Value |
|----------|-------|
| Word | Philosify |
| IPA (brand-locked) | /fəˈlɒsɪfaɪ/ |
| Phonetic | phi-LOS-i-fy |
| Stress | 2nd syllable |
| Mnemonic | "philosophy + Spotify" |

### Key Rules

- Ending is **"-sify"** = /sɪfaɪ/ (like Spotify, Classify, Diversify)
- Stress on **2nd syllable**: phi-**LOS**-i-fy
- **NOT** /-sofaɪ/ or /-zo-fai/

---

## Forbidden Pronunciations

| Wrong | Why |
|-------|-----|
| "Philosofy" | Wrong vowel in 3rd syllable |
| "Philosophy" | Wrong ending entirely |
| /filosofi/ | Missing "-fy" ending |
| /-zo-fai/ | Voiced 's' error |
| /-so-fai/ | Wrong vowel before "-fai" |

---

## Morphological Structure

```
Philo + sify
```

- **Philo** = philosophy root
- **-sify** = transformation verb suffix (like "classify", "diversify")

Semantic meaning: "To render philosophical" / "To transform into philosophical analysis"

---

## Stress Invariance Rule

**ALWAYS:** phi-**LOS**-i-fy

**NEVER:**
- **PHI**-lo-si-fy (wrong stress)
- phi-lo-**SI**-fy (wrong stress)

This maintains brand cadence aligned with Spotify-like rhythm.

---

## 24-Language Phonetic Table

Spelling remains **Philosify** globally; only phonetics adapt for TTS.

| Language | Code | Phonetic Spelling | IPA Approximation | Notes |
|----------|------|-------------------|-------------------|-------|
| English | en | fə-LOS-i-fy | /fəˈlɒsɪfaɪ/ | Canonical reference |
| Portuguese | pt | fi-LÓ-si-fai | /fiˈlɔsifai/ | Keep "si," not "so" |
| Spanish | es | fi-LÓ-si-fai | /fiˈlosifai/ | Natural fit |
| French | fr | fi-LO-si-faï | /fi.lo.si.faj/ | Avoid "zo" |
| Italian | it | fi-LÓ-si-fai | /fiˈlɔsifai/ | Clean vowel |
| German | de | fi-LO-si-fai | /fiˈloːzɪfaɪ/ | "s" may voice |
| Dutch | nl | fi-LO-si-fai | /fiˈloːsɪfaɪ/ | Close to EN |
| Swedish | sv | fi-LO-si-faj | /fiˈluːsɪfaj/ | Vowel rounding |
| Polish | pl | fi-LO-si-faj | /fiˈlɔɕifaj/ | Palatal "ś" |
| Hungarian | hu | fi-LÓ-si-fai | /fiˈloʃifɒi/ | "s" → "sh" |
| Romanian | ro | fi-LO-si-fai | /fiˈlosifaj/ | Latin phonology |
| Turkish | tr | fi-LO-si-fay | /fiˈlosifaj/ | Stable |
| Russian | ru | фи-ЛО-си-фай | /fʲɪˈlosʲɪfaj/ | Cyrillic |
| Ukrainian | uk | фі-ЛО-си-фай | /fiˈlosifaj/ | Same stress |
| Greek | el | φι-ΛΟ-σι-φάι | /fiˈlosifai/ | Returns to root |
| Hebrew | he | פי-לו-סי-פיי | /fi.lo.siˈfai/ | Final lift |
| Arabic | ar | في-لو-سي-فاي | /fiːlosiˈfaɪ/ | Clear vowels |
| Hindi | hi | फ़ि-लो-सि-फाय | /fi.lo.si.faːj/ | Devanagari |
| Mandarin | zh | fi-luo-si-fai | /fi luo si fai/ | Syllabic |
| Japanese | ja | フィロシファイ | /fi.ro.ɕi.fa.i/ | "shi" mora |
| Korean | ko | 필로시파이 | /pil.lo.ɕi.pʰa.i/ | Aspirated |
| Thai | th | ฟิโลซิไฟ | /fi.lo.si.fai/ | Neutral tone |
| Vietnamese | vi | phi-lô-si-phai | /fi lo si fai/ | Latinized |
| Indonesian | id | fi-lo-si-fai | /filosifai/ | Natural |

---

## TTS Implementation

### Location: `api/src/tts/gemini.js`

### Layer 1: systemInstruction (API-level)

```javascript
body: JSON.stringify({
  systemInstruction: {
    parts: [{
      text: 'CRITICAL: "Philosify" = /fəˈlɒsɪfaɪ/ (phi-LOS-i-fy). Never say "Philosofy".'
    }]
  },
  contents: [{ parts: [{ text: script }] }],
  // ...
})
```

### Layer 2: PODCAST_PHRASES (Dialogue-level)

Phonetic spellings used in welcome/thanks phrases:

| Language | welcome phrase uses | thanks phrase uses |
|----------|--------------------|--------------------|
| PT | "Filosifai" | "Filosifai" |
| ES | "Filosifai" | "Filosifai" |
| JA | "フィロシファイ" | "フィロシファイ" |
| KO | "필로시파이" | "필로시파이" |
| ... | (per language) | (per language) |

### Layer 3: Script Headers (Backup)

Each chunk script includes:
```
PRONUNCIATION OF "Philosify": FILL-oh-sih-fye (like "Spotify")
```

---

## Modification Policy

### DO NOT:
- Remove `systemInstruction` from TTS API calls
- Replace phonetic spellings with plain "Philosify" in dialogue
- Remove script header pronunciation instructions
- Simplify multilingual phonetics to single standard
- Change stress pattern from 2nd syllable

### ALWAYS:
- Preserve all 3 layers of pronunciation enforcement
- Test audio output after any TTS code changes
- Refer to this document before modifying TTS code
- Consult product owner for pronunciation changes

---

## Public Branding Guidance

When teaching pronunciation publicly:

> "Philosify - pronounced like *philosophy* + *Spotify*."

This instantly eliminates "sofai" drift.

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-10 | Initial documentation created |

---

## Related Files

- `AGENTS.md` - AI agent instructions (includes pronunciation section)
- `api/src/tts/gemini.js` - TTS implementation with pronunciation lock
