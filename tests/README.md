# Test Scripts

Integration and endpoint testing scripts for the Philosify API.

## Credit System Tests
- **test-add-credits.js** - Test credit addition functionality
- **test-add-credits-simple.js** - Simple credit addition test
- **test-init-and-add-credits.js** - Test user initialization + credit addition
- **check-transactions.js** - Verify credit transaction logging

## API Endpoint Tests
- **test-balance-endpoint.js** - Test `/api/balance` endpoint
- **test-verify-payment.js** - Test Stripe payment verification

## Realtime Tests
- **test-realtime.html** - Browser-based realtime subscription test (Supabase)

## Usage

### Node.js Tests
```bash
node tests/script-name.js
```

### Browser Tests
Open in browser:
```bash
# Serve locally or open directly
tests/test-realtime.html
```

## Requirements
- Valid Supabase credentials
- API running locally or in production
- For payment tests: valid Stripe test keys

**Note:** These are testing utilities, not production code.
