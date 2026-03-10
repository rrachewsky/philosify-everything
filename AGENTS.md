# AGENTS.md

Instructions for AI coding agents working in the Philosify codebase.

## Build/Lint/Test Commands

### Backend (api/)

```bash
cd api
npm run dev           # Local dev server (localhost:8787)
npm test              # Run all tests (vitest)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run deploy:prod   # Deploy to production
```

### Frontend (site/)

```bash
cd site
npm run dev    # Local dev server (localhost:3000)
npm run build  # Production build
npm test       # Run all tests (vitest)
npm run lint   # ESLint check
npm run format # Prettier format all files
```

### Running a Single Test

```bash
npx vitest run src/utils/validation.test.js  # Run specific test file
npx vitest run validation                     # Run by pattern matching
npx vitest src/utils/validation.test.js       # Watch a specific file
npx vitest run --coverage src/utils/validation.test.js  # With coverage
```

## Command Execution Rules

**CRITICAL:** All bash commands MUST use the `workdir` parameter with full paths. NEVER use `cd` with `&&`.

### Full Paths Required

| Context | Full Path                                                              |
| ------- | ---------------------------------------------------------------------- |
| API     | `C:\Users\r_rac\OneDrive\Documents\GitHub\philosify-everything\api`    |
| Site    | `C:\Users\r_rac\OneDrive\Documents\GitHub\philosify-everything\site`   |
| Root    | `C:\Users\r_rac\OneDrive\Documents\GitHub\philosify-everything`        |

### Correct Example

```
workdir: C:\Users\r_rac\OneDrive\Documents\GitHub\philosify-everything\api
command: npm run dev
```

### Incorrect Example (DO NOT USE)

```bash
cd api && npm run dev
```

## Deployment Strategy

### Deploy to Development (Testing/WIP)

- Push to `development` branch ONLY
- Deploy to dev environment

### Deploy to Production

- Push to ALL branches: `development`, `main`, `production`
- Deploy API: `npm run deploy:prod` (workdir: api)
- Deploy Site: `npx wrangler pages deploy dist --project-name=philosify-everything-frontend --branch=production` (workdir: site)

```bash
# Push to all branches for production deploy
git push origin development main production
```

## Code Style Guidelines

### Formatting (Prettier - site/.prettierrc.json)

- **Semicolons**: Always required
- **Quotes**: Single quotes
- **Indentation**: 2 spaces
- **Trailing commas**: ES5 style
- **Print width**: 100 characters
- **Arrow parens**: Always `(x) => x`

### ESLint (site/eslint.config.js)

- React hooks rules enabled
- Prettier integration (no conflicting rules)
- `react/prop-types`: off (runtime validation)
- `react/react-in-jsx-scope`: off (React 17+)

### Imports

**Path Aliases** (frontend only):

```javascript
import { Button } from "@/components/common/Button";
import { useCredits } from "@hooks/useCredits";
import { logger } from "@utils";
```

Aliases: `@/`, `@components`, `@services`, `@hooks`, `@utils`, `@contexts`, `@styles`

**Import Order**: External packages > Internal aliases (@/) > Relative imports (./)

**File Extensions**: Always include `.js` for local imports:

```javascript
import { getSecret } from "./utils/secrets.js"; // Correct
import { getSecret } from "./utils/secrets"; // Wrong
```

### Module Exports

Use **barrel files** (`index.js`) and prefer **named exports**:

```javascript
// hooks/index.js
export { useAuth } from "./useAuth.js";
export { useCredits } from "./useCredits.js";
// Consumer: import { useAuth, useCredits } from '@hooks';
```

### Naming Conventions

| Type             | Convention              | Example           |
| ---------------- | ----------------------- | ----------------- |
| React Components | PascalCase.jsx          | `SearchInput.jsx` |
| Hooks            | camelCase, `use` prefix | `useCredits.js`   |
| Utilities        | camelCase.js            | `validation.js`   |
| Constants        | SCREAMING_SNAKE_CASE    | `MAX_BODY_SIZE`   |
| CSS classes      | kebab-case              | `button-primary`  |

### Error Handling

```javascript
try {
  const result = await callRpc(env, "reserve_credit", { p_user_id: userId });
} catch (error) {
  throw new Error(`Failed to reserve credit: ${error.message}`);
}
```

### Logging

Backend: `console.log('[Credits] Reserving credit for ${userId}');`
Frontend: `import { logger } from '@utils'; logger.log('[Hook] message');`

## Architecture

- **Backend**: Cloudflare Workers (ES modules in `api/src/`)
- **Frontend**: Vite + React SPA (`site/src/`)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare KV (philosophical guides only)
- **Auth**: Supabase Auth with JWT verification

### Key Patterns

**Credits System** (Reserve/Confirm/Release):

```javascript
const reservation = await reserveCredit(env, userId);
if (success) await confirmReservation(env, reservation.id);
else await releaseReservation(env, reservation.id);
```

**Secrets Access** (works in dev and production):

```javascript
import { getSecret } from "./utils/secrets.js";
const apiKey = await getSecret(env.OPENAI_API_KEY);
```

## Domain-Specific Rules

When modifying AI prompts or philosophical analysis:

- Use **"virtuous self-interest"** NOT "rational egoism"
- Use **"autointeresse virtuoso"** in Portuguese (NOT "egoismo racional")
- **Sacrifice** = trading greater value for lesser value (not all trade-offs)
- **Hero vs. Martyr** distinction is essential (reason vs. faith)
- Scores are **immutable** once saved per (song, artist, model) combination

## Colloquium Verdict Structure (PROTECTED — Owner-Only)

The verdict prompt in `api/src/handlers/colloquium.js` (`generateColloquiumVerdictForThread`) has a **MANDATORY structure** that agents must NEVER modify without explicit owner authorization:

1. **Individual Philosopher Opinions** — Every philosopher on the panel MUST have a dedicated subsection with their opinion grounded in their specific school of thought. This is NOT optional.
2. **User-added philosophers** are tagged with ★ and must be highlighted in the verdict.
3. **Points of Agreement & Conflict** — Where philosophers agree and clash, referencing schools of thought.
4. **User Contributions** — Acknowledging user arguments (when present).
5. **Verdict** — Clear philosophical conclusion aligned with reason, individual rights, and objective reality.

### NEVER:

- Remove or simplify per-philosopher opinion sections
- Reduce the verdict to a generic summary without individual philosopher voices
- Remove the `[ADDED BY USER]` tagging for user-added philosophers
- Lower the word limit below 1200 words
- Remove the protective comment block in the source code

## Philosify Pronunciation Rules (MANDATORY - NEVER VIOLATE)

The word **"Philosify"** has a **LOCKED pronunciation** that must NEVER be changed.

| Property | Value                                       |
| -------- | ------------------------------------------- |
| IPA      | /fəˈlɒsɪfaɪ/                                |
| Phonetic | phi-LOS-i-fy                                |
| Stress   | 2nd syllable                                |
| Ending   | "-sify" (like Spotify, Classify, Diversify) |

**Mnemonic:** "philosophy + Spotify"

### FORBIDDEN Pronunciations

- "Philosofy" ❌
- "Philosophy" ❌
- /-sofaɪ/ ❌
- /-zo-fai/ ❌

### TTS Implementation (api/src/tts/gemini.js)

1. `systemInstruction` in Gemini TTS API calls enforces pronunciation
2. `PODCAST_PHRASES` uses phonetic spellings per language (e.g., "Filosifai" for PT/ES)
3. Script headers include pronunciation instructions as backup

### When Modifying TTS Code - NEVER:

- Remove the `systemInstruction` pronunciation directive
- Replace phonetic spellings (e.g., "Filosifai") with plain "Philosify"
- Remove script header pronunciation instructions
- Simplify multilingual phonetics

**Full reference:** See `docs/PRONUNCIATION.md` for 24-language phonetic table.

## Cursor Rules

The `.cursor/rules/philosify-3.0-lite.md` defines Philosify philosophical analysis rules:

- Required sections: Pre-check, Axis Analysis, Scorecard, Schools of Thought, Verdict
- Allowed schools: Objectivism, Marxism, Stoicism, Existentialism, Nihilism, etc.
- Evidence-based classification hierarchy

These rules apply to AI-generated song analyses, not code style.

## Push Notifications (DO NOT BREAK)

Philosify uses **empty push + fetch** because Cloudflare Workers cannot run `web-push` (Node crypto). This is the correct architecture.

### Flow

1. **Subscribe**: User grants permission → `pushManager.subscribe()` with VAPID key → POST `/api/push/subscribe` saves `{ endpoint, p256dh, auth }` to Supabase
2. **Send**: Backend inserts into `push_notification_queue`, waits 500ms, sends empty push to endpoint (VAPID headers only, no body)
3. **Receive**: Service worker wakes on push → POST `/api/push/pending` with `{ endpoint }` (no auth; endpoint proves identity) → shows notifications → POST `/api/push/ack` with `{ ids, endpoint }`

### Key Files

| File                       | Purpose                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `site/public/sw.js`        | Service worker — MUST be at `/sw.js` (root). Handles push, fetches /pending, shows notification |
| `site/src/utils/pwa.js`    | Registers SW, `subscribeToPush()`, `isPushSubscribed()`                                         |
| `api/src/push/sender.js`   | Queue insert → 500ms delay → empty push. Handles 404/410 (remove stale subs)                    |
| `api/src/push/vapid.js`    | VAPID JWT via Web Crypto (no npm package)                                                       |
| `api/src/handlers/push.js` | subscribe, unsubscribe, pending, ack, preferences                                               |

### Rules for Agents

- **NEVER** use `web-push` or payload-in-push in Workers — encryption requires Node crypto
- **NEVER** require auth cookies for `/api/push/pending` or `/api/push/ack` — SW runs in background, no cookies
- **NEVER** move `sw.js` to a subfolder — it must be served at root (`/sw.js`)
- **NEVER** reduce the 500ms queue delay — race condition causes empty notifications
- VAPID keys: generate with `npx web-push generate-vapid-keys`, store in secrets

### Testing Push

- Push only works in **production build** (SW is skipped in `import.meta.env.DEV`)
- Test: `npm run build` then serve `dist/` with API at localhost:8787, or use production
- Diagnostic: `POST /api/push/test` (auth) or `POST /api/push/diagnose/:userId` with `X-Admin-Secret`

## Testing

- **Framework**: Vitest (both api/ and site/)
- **Frontend env**: jsdom | **Backend env**: node
- **Globals**: `describe`, `it`, `expect` enabled
- **Files**: Co-locate as `*.test.js` or place in `__tests__/`

## Git Commit Policy

**Never include AI attribution in commits:**

```bash
# Good
git commit -m "Add credit validation before analysis"
# Bad - DO NOT include
Co-Authored-By: Claude <noreply@anthropic.com>
```
