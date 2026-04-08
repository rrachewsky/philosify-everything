# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Philosify, please report it responsibly.

**Email:** security@philosify.org

**What to include:**
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Your contact information (optional, for follow-up)

**What to expect:**
- Acknowledgment within 48 hours
- Status update within 7 days
- Resolution timeline shared once assessed

## Safe Harbor

We will not take legal action against researchers who:
- Make a good faith effort to avoid privacy violations, data destruction, or service disruption
- Only interact with accounts they own or with explicit permission
- Do not exploit vulnerabilities beyond what is necessary to demonstrate the issue
- Report findings promptly and do not disclose publicly before a fix is deployed

## Scope

In scope:
- philosify.org (frontend)
- api.philosify.org (API)
- ads.philosify.org (advertising platform)
- Authentication and session management
- Data access controls
- Payment processing
- Push notification system

Out of scope:
- Third-party services (Supabase, Cloudflare, Stripe) unless the vulnerability is in our integration
- Social engineering attacks
- Denial of service attacks (please do not test DDoS)
- Automated scanning without prior coordination

## Security Controls

- Row Level Security (RLS) enforced on all database tables
- JWT authentication with JWKS verification
- HttpOnly cookies with SameSite=Lax
- CORS whitelist (no origin reflection)
- Rate limiting on all endpoints
- Input validation and size limits
- Error message sanitization
- E2E encryption for direct messages (X25519 + XChaCha20-Poly1305)
- Stripe webhook signature verification
- Content Security Policy on all pages
