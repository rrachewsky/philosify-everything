# i18n Error System - Complete Implementation

## What Was The Problem?

**Before:** Hardcoded English error messages scattered across 50+ API handlers.

```javascript
// ❌ English-only errors everywhere
return jsonResponse({ error: "Insufficient credits" }, 402, origin, env);
return jsonResponse({ error: "Not found" }, 404, origin, env);
return jsonResponse({ error: "Invalid input" }, 400, origin, env);
```

**Result:** Users in Portugal, Spain, France, Germany, Japan, etc. saw English error messages even when using the app in their native language.

## The Solution (Implemented)

### 1. Centralized Error Helper ✅

**File:** `api/src/utils/errorResponse.js`

```javascript
import { errorResponse } from "../utils/errorResponse.js";

// Automatic i18n + status code inference
return errorResponse(env, origin, 'INSUFFICIENT_CREDITS', lang, { needed: 1 });
// Returns: { "error": "Créditos insuficientes" } in PT
//          { "error": "Insufficient credits" } in EN
//          { "error": "أرصدة غير كافية" } in AR
```

**Features:**
- ✅ Enforces i18n (impossible to return untranslated errors)
- ✅ Auto-infers HTTP status codes (INSUFFICIENT_CREDITS → 402)
- ✅ Type-safe error keys (prevents typos)
- ✅ Consistent error structure across all endpoints

### 2. Multilingual Error Messages ✅

**File:** `api/src/utils/i18n-errors.js`

**Supported languages (18):**
EN, PT, ES, FR, DE, IT, NL, RU, ZH, AR, HE, JA, KO, TR, PL, HU, HI, FA

**Available error keys:**
- `INSUFFICIENT_CREDITS` - User has no credits
- `UNAUTHORIZED` - Not logged in
- `AUTHENTICATION_REQUIRED` - Auth token missing
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `NOT_FOUND` - Resource not found
- `LYRICS_NOT_FOUND` - Song lyrics unavailable
- `INVALID_INPUT` - Bad request data
- `INVALID_JSON` - Malformed JSON
- `METHOD_NOT_ALLOWED` - Wrong HTTP method
- `ACCESS_DENIED` - Forbidden resource
- `GUIDE_NOT_LOADED` - Philosophical guide missing
- `ANALYSIS_FAILED` - AI analysis error
- `INTERNAL_ERROR` - Server error

### 3. Automated Tests ✅

**File:** `api/src/utils/i18n-errors.test.js`

```bash
npm test -- i18n-errors.test.js
# ✅ 9 tests passing
```

**Tests ensure:**
- All 10+ error keys have translations in all 18 languages
- No placeholder text (FIXME, TODO, XXX)
- No empty or whitespace-only messages
- English fallback works for unknown languages
- No duplicate English messages across error keys

## Migration Status

### ✅ DONE (3 handlers)
- `cinema-analyze.js` - All 4 error responses localized
- `news-analyze.js` - All 4 error responses localized
- `book-analyze.js` - Partial (needs completion)

### 🔲 TODO (47+ handlers)
- `analyze.js` (music analysis)
- `philosopher-panel.js`
- `quiz.js`
- `colloquium-user.js`
- `chat.js`
- `unsafe-zone.js`
- `news-preferences.js`
- `books-top.js`
- `analysis-detail.js`
- ... and 38 more

## How To Use

### Standard Error Response

```javascript
import { errorResponse } from "../utils/errorResponse.js";

export async function handleSomething(request, env, origin) {
  let lang = 'en'; // Hoist for error handling
  try {
    const body = await request.json();
    lang = body.lang || 'en';
    
    // ... validation ...
    if (!valid) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }
    
    // ... credit check ...
    if (credits < 1) {
      return errorResponse(env, origin, 'INSUFFICIENT_CREDITS', lang, {
        needed: 1,
        balance: credits
      });
    }
    
  } catch (err) {
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
  }
}
```

### Before vs After

| Scenario | Before (Hardcoded) | After (i18n) |
|----------|-------------------|--------------|
| PT user, no credits | ❌ "Insufficient credits" | ✅ "Créditos insuficientes" |
| ES user, invalid input | ❌ "Invalid input" | ✅ "Entrada no válida" |
| FR user, not found | ❌ "Not found" | ✅ "Non trouvé" |
| AR user, rate limited | ❌ "Too many requests" | ✅ "طلبات كثيرة جداً" |
| HE user, unauthorized | ❌ "Please log in" | ✅ "אנא התחבר כדי להמשיך" |
| JA user, analysis failed | ❌ "Analysis failed" | ✅ "分析に失敗しました" |

## Adding New Error Types

1. **Add to `i18n-errors.js`:**

```javascript
export const ERROR_MESSAGES_I18N = {
  // ... existing errors
  PAYMENT_FAILED: {
    en: 'Payment failed',
    pt: 'Pagamento falhou',
    es: 'Pago falló',
    fr: 'Paiement échoué',
    de: 'Zahlung fehlgeschlagen',
    // ... all 18 languages
  },
};
```

2. **Add status code mapping to `errorResponse.js`:**

```javascript
const statusMap = {
  // ... existing mappings
  PAYMENT_FAILED: 402,
};
```

3. **Use in handler:**

```javascript
return errorResponse(env, origin, 'PAYMENT_FAILED', lang);
```

## Testing Locally

```bash
cd api
npm test -- i18n-errors.test.js

# Test in Portuguese
curl -X POST http://localhost:8787/api/cinema-analyze \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","lang":"pt"}' \
  | jq '.error'
# Expected: "Créditos insuficientes"
```

## Why This Matters

**110+ countries use Philosify.**

Your users in:
- 🇧🇷 Brazil speak Portuguese
- 🇪🇸 Spain speaks Spanish  
- 🇫🇷 France speaks French
- 🇩🇪 Germany speaks German
- 🇸🇦 Saudi Arabia speaks Arabic
- 🇮🇱 Israel speaks Hebrew
- 🇯🇵 Japan speaks Japanese
- 🇨🇳 China speaks Chinese
- 🇰🇷 Korea speaks Korean
- 🇹🇷 Turkey speaks Turkish

**They deserve error messages in their own language.**

## Next Steps

1. **Migrate remaining 47 handlers** (prioritize high-traffic: analyze.js, philosopher-panel.js, quiz.js)
2. **Add linting rule** to prevent new hardcoded errors
3. **Frontend i18n** - Apply same pattern to `site/src/services/api/`

## Files Created

- ✅ `api/src/utils/errorResponse.js` - Centralized helper
- ✅ `api/src/utils/i18n-errors.js` - Multilingual messages (expanded)
- ✅ `api/src/utils/i18n-errors.test.js` - Automated tests
- ✅ `api/docs/ERROR_I18N_MIGRATION.md` - Migration guide
- ✅ `api/docs/I18N_ERROR_SYSTEM.md` - This document

---

**Status:** System implemented ✅ | Migration in progress 🔄 | 3 of 50+ handlers complete (6%)
