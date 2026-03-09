# API Contracts Documentation

**Document Purpose:** Complete reference of all backend API endpoints used by the frontend

**Backend Base URL:** `https://api.philosify.org`

---

## Authentication

All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

**Token Source:** Supabase auth session (`supabase.auth.getSession().data.session.access_token`)

---

## Endpoints

### 1. GET `/api/config`

**Purpose:** Fetch Supabase configuration (URL and anon key)

**Authentication:** None (public)

**Request:**
```http
GET /api/config
```

**Response:**
```json
{
  "supabaseUrl": "https://xxx.supabase.co",
  "supabaseAnonKey": "eyJhbGci..."
}
```

**Frontend Usage:** `site/index.html:1534`
- Called on app initialization
- Used to configure Supabase client
- Required before any auth operations

**Error Handling:**
- 404/500: Show error, cannot proceed without Supabase config

---

### 2. GET `/api/balance`

**Purpose:** Fetch user's credit balance

**Authentication:** Required (JWT token)

**Request:**
```http
GET /api/balance
Headers:
  Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "userId": "uuid",
  "credits": 10,
  "freeRemaining": 2,
  "total": 12
}
```

**Frontend Usage:** `site/index.html:1601`
- Called after user logs in
- Called after credit purchase
- Used to display balance in UI

**Error Handling:**
- 401: User not authenticated, show login modal
- Invalid response format: Log error, show auth buttons

**Important:** Frontend must use `data.total` and `data.freeRemaining`, NOT `data.balance`

---

### 3. POST `/api/search`

**Purpose:** Search for songs using Spotify API

**Authentication:** None (public)

**Request:**
```http
POST /api/search
Headers:
  Content-Type: application/json
Body:
  {
    "query": "Imagine John Lennon"
  }
```

**Response:**
```json
{
  "options": [
    {
      "id": "spotify_id",
      "name": "Imagine",
      "artist": "John Lennon",
      "album": "Imagine",
      "image": "https://i.scdn.co/...",
      "preview_url": "https://p.scdn.co/..."
    }
  ]
}
```

**Frontend Usage:** `site/index.html:4540`
- Called when user types in search box (debounced)
- Returns Spotify search results
- Used to populate search dropdown

**Error Handling:**
- Network error: Clear search options, hide dropdown
- Empty results: Show "no results" message

---

### 4. POST `/api/analyze`

**Purpose:** Analyze a song philosophically

**Authentication:** Required (JWT token)

**Request:**
```http
POST /api/analyze
Headers:
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
Body:
  {
    "song": "Imagine",
    "artist": "John Lennon",
    "model": "gpt4",
    "lang": "en",
    "spotify_id": "spotify_id_optional"
  }
```

**Response:**
```json
{
  "song": "Imagine",
  "artist": "John Lennon",
  "author": "John Lennon",
  "release_year": 1971,
  "country": "UK",
  "genre": "Rock",
  "spotify_id": "...",
  "lyrics_snippet": "Imagine there's no heaven...",
  "scorecard": {
    "ethics": {
      "score": -8,
      "justification": "...",
      "weight": 0.4
    },
    "metaphysics": {
      "score": -6,
      "justification": "...",
      "weight": 0.2
    },
    "epistemology": {
      "score": -5,
      "justification": "...",
      "weight": 0.2
    },
    "politics": {
      "score": -7,
      "justification": "...",
      "weight": 0.1
    },
    "aesthetics": {
      "score": -4,
      "justification": "...",
      "weight": 0.1
    },
    "final_score": -6.8
  },
  "philosophical_note": 2,
  "classification": "Conformista Direta",
  "philosophical_analysis": "...",
  "historical_context": "...",
  "creative_process": "...",
  "has_ambivalence": false,
  "model_used": "gpt4",
  "analyzed_at": "2025-11-11T..."
}
```

**Frontend Usage:** `site/index.html:4672`
- Called when user clicks "Analyze" button
- Consumes 1 credit (free or paid)
- Returns full philosophical analysis

**Error Handling:**
- 401: Not authenticated → Show login modal
- 402: Insufficient credits → Show payment modal
- 404: Song not found
- 500: Analysis failed → Show error message

**Request Body Fields:**
- `song`: Song name (required)
- `artist`: Artist name (required)
- `model`: AI model to use - `gpt4`, `gemini`, `grok`, `claude` (required)
- `lang`: Language code - `en`, `pt`, `es`, `fr`, `de`, `it`, `hu`, `ru`, `ja`, `zh`, `ko`, `he` (required)
- `spotify_id`: Spotify track ID (optional)

---

### 5. POST `/api/create-checkout`

**Purpose:** Create Stripe Checkout session for credit purchase

**Authentication:** Required (JWT token)

**Request:**
```http
POST /api/create-checkout
Headers:
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
Body:
  {
    "tier": "10"
  }
```

**Valid Tiers:**
- `"10"` - 10 credits
- `"20"` - 20 credits
- `"50"` - 50 credits

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/..."
}
```

**Frontend Usage:** `site/index.html:1880`
- Called when user clicks on credit package button
- Redirects user to Stripe Checkout page
- After payment, webhook updates user balance

**Error Handling:**
- 401: Not authenticated
- 400: Invalid tier
- 500: Failed to create session → Show error alert

**Post-Payment Flow:**
1. User completes payment on Stripe
2. Stripe sends webhook to backend `/api/stripe-webhook`
3. Backend updates user balance in KV store
4. User redirected back to app
5. Frontend calls `/api/balance` to refresh display

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (not authenticated)
- `402`: Payment required (insufficient credits)
- `404`: Not found (song/resource not found)
- `429`: Too many requests (rate limited)
- `500`: Internal server error

---

## Rate Limiting

**Current Implementation:** 60 requests per 60-second window per user/IP

**Frontend Handling:**
- No explicit rate limit handling in frontend
- Backend returns 429 status code
- TODO: Add rate limit feedback to frontend

---

## CORS Configuration

**Allowed Origins:**
- `https://philosify.org`
- `https://*.philosify.org`
- `http://localhost:*` (development)

**Allowed Methods:** `GET`, `POST`, `OPTIONS`

**Allowed Headers:** `Content-Type`, `Authorization`

---

## Testing Endpoints

### Local Development
```bash
# Test config endpoint
curl http://localhost:8787/api/config

# Test search (no auth)
curl -X POST http://localhost:8787/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Imagine"}'

# Test balance (requires auth)
curl http://localhost:8787/api/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test analyze (requires auth)
curl -X POST http://localhost:8787/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"song":"Imagine","artist":"John Lennon","model":"gpt4","lang":"en"}'
```

### Production
Replace `http://localhost:8787` with `https://api.philosify.org`

---

## Frontend Service Layer Structure (Proposed)

Based on these contracts, we should create:

```
src/services/api/
├── config.js       # GET /api/config
├── balance.js      # GET /api/balance
├── search.js       # POST /api/search
├── analyze.js      # POST /api/analyze
├── checkout.js     # POST /api/create-checkout
└── index.js        # Export all
```

Each service module should:
1. Handle request formatting
2. Handle response parsing
3. Handle errors consistently
4. Add typing (if using TypeScript later)

---

## Changes from Backend Refactoring

**Backend Status:** Recently refactored from monolithic `index.js` to modular structure

**Current Backend Structure:**
```
api/src/
├── routes/         # API endpoints
├── services/       # Business logic
├── ai/             # AI model integrations
└── utils/          # Helpers
```

**Frontend Compatibility:** All endpoints remain unchanged (backward compatible)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Source:** `site/index.html` analysis
**Status:** Complete
