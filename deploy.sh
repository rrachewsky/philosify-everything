#!/bin/bash

# ============================================================
# PHILOSIFY - AUTOMATED DEPLOYMENT SCRIPT
# ============================================================
# This script deploys Philosify using Cloudflare Secrets Store
# for secure credential management.
# ============================================================

echo "🚀 Starting Philosify deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# STEP 1: Check Prerequisites
# ============================================================

echo -e "${YELLOW}📋 STEP 1: Checking prerequisites...${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ ERROR: wrangler is not installed${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "api/wrangler.toml" ]; then
    echo -e "${RED}❌ ERROR: api/wrangler.toml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# ============================================================
# STEP 2: Secrets Store Instructions
# ============================================================

echo -e "${YELLOW}🔐 STEP 2: Cloudflare Secrets Store Configuration${NC}"
echo ""
echo -e "${BLUE}IMPORTANT: This project uses Cloudflare Secrets Store for secure credential management.${NC}"
echo ""
echo "Before deploying, ensure you have created all secrets in Cloudflare Secrets Store:"
echo ""
echo "📝 Required Secrets:"
echo "  1. OPENAI_API_KEY          - OpenAI API key (sk-...)"
echo "  2. GEMINI_API_KEY          - Google Gemini API key"
echo "  3. ANTHROPIC_API_KEY       - Anthropic Claude API key (sk-ant-...)"
echo "  4. GROK_API_KEY            - xAI Grok API key"
echo "  5. STRIPE_SECRET_KEY       - Stripe secret key (sk_live_... or sk_test_...)"
echo "  6. STRIPE_WEBHOOK_SECRET   - Stripe webhook secret (whsec_...)"
echo "  7. STRIPE_PRICE_ID_10      - Stripe price ID for 10 credits (price_...)"
echo "  8. STRIPE_PRICE_ID_20      - Stripe price ID for 20 credits (price_...)"
echo "  9. STRIPE_PRICE_ID_50      - Stripe price ID for 50 credits (price_...)"
echo "  10. SUPABASE_URL           - Supabase project URL"
echo "  11. SUPABASE_ANON_KEY      - Supabase public anon key (for frontend)"
echo "  12. SUPABASE_SERVICE_KEY   - Supabase service role key (for backend)"
echo "  13. GENIUS_ACCESS_TOKEN    - Genius API token for lyrics"
echo "  14. SPOTIFY_CLIENT_ID      - Spotify API client ID"
echo "  15. SPOTIFY_CLIENT_SECRET  - Spotify API client secret"
echo "  16. ADMIN_SECRET           - Admin password for wrangler.toml access"
echo ""
echo "🌐 To configure Secrets Store:"
echo "  1. Go to: https://dash.cloudflare.com"
echo "  2. Navigate to: Workers & Pages → Secrets Store"
echo "  3. Create a new Secret Store (if you haven't already)"
echo "  4. Add all 17 secrets listed above"
echo "  5. Copy each Secret ID and update api/wrangler.toml"
echo ""
echo "📖 Full documentation: https://developers.cloudflare.com/secrets-store/"
echo ""

read -p "Have you configured all secrets in Secrets Store and updated wrangler.toml? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Deployment paused. Please configure Secrets Store first.${NC}"
    exit 0
fi

echo -e "${GREEN}✅ Secrets Store configuration confirmed${NC}"
echo ""

# ============================================================
# STEP 3: Upload Philosophical Guides to KV
# ============================================================

echo -e "${YELLOW}📚 STEP 3: Uploading philosophical guides to KV...${NC}"
echo ""

cd api

# Check if guide files exist
if [ -f "guides/Guide_v2.9_LITE.txt" ]; then
    echo "Uploading English guide (guide_text)..."
    wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path="guides/Guide_v2.9_LITE.txt"
    echo -e "${GREEN}✅ English guide uploaded${NC}"
else
    echo -e "${RED}⚠️  WARNING: guides/Guide_v2.9_LITE.txt not found${NC}"
fi

if [ -f "guides/guide_text_pt_v2.6_FINAL.txt" ]; then
    echo "Uploading Portuguese guide (guide_text_pt)..."
    wrangler kv:key put --binding=PHILOSIFY_KV "guide_text_pt" --path="guides/guide_text_pt_v2.6_FINAL.txt"
    echo -e "${GREEN}✅ Portuguese guide uploaded${NC}"
else
    echo -e "${RED}⚠️  WARNING: guides/guide_text_pt_v2.6_FINAL.txt not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Guides uploaded to KV${NC}"
echo ""

# ============================================================
# STEP 4: Deploy Worker
# ============================================================

echo -e "${YELLOW}🚀 STEP 4: Deploying Cloudflare Worker...${NC}"
echo ""

wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Worker deployed successfully!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Worker deployment failed. Check errors above.${NC}"
    cd ..
    exit 1
fi

cd ..

# ============================================================
# STEP 5: Database Setup Instructions
# ============================================================

echo -e "${YELLOW}🗄️  STEP 5: Database Setup${NC}"
echo ""
echo "Next, set up your Supabase database:"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to: SQL Editor → New Query"
echo "4. Copy the contents of: supabase_schema.sql"
echo "5. Paste and run the SQL"
echo ""
echo "Tables created:"
echo "  • song_analyses       - Stores philosophical analysis results"
echo "  • song_translations   - Stores multilingual translations"
echo "  • model_comparisons   - Tracks model performance analytics"
echo ""

read -p "Press Enter to continue after setting up the database..."

echo ""
echo -e "${GREEN}✅ Database setup confirmed${NC}"
echo ""

# ============================================================
# STEP 6: Frontend Deployment
# ============================================================

echo -e "${YELLOW}🌐 STEP 6: Frontend Deployment${NC}"
echo ""
echo "Deploy the frontend to Cloudflare Pages:"
echo ""
echo "Option 1 - Wrangler CLI:"
echo "  cd site"
echo "  wrangler pages deploy ."
echo ""
echo "Option 2 - Cloudflare Dashboard:"
echo "  1. Go to: https://dash.cloudflare.com"
echo "  2. Pages → Create Project"
echo "  3. Connect your Git repository"
echo "  4. Build settings:"
echo "     - Build command: (none)"
echo "     - Build output directory: site"
echo ""
echo "⚠️  IMPORTANT: Update site/index.html line 265"
echo "     Change API_BASE from 'https://api.philosify.org'"
echo "     to your actual Worker URL"
echo ""

read -p "Press Enter to continue after deploying frontend..."

echo ""
echo -e "${GREEN}✅ Frontend deployment confirmed${NC}"
echo ""

# ============================================================
# STEP 7: Stripe Webhook Configuration
# ============================================================

echo -e "${YELLOW}💳 STEP 7: Stripe Webhook Configuration${NC}"
echo ""
echo "Configure Stripe webhooks:"
echo ""
echo "1. Go to: https://dashboard.stripe.com/webhooks"
echo "2. Click 'Add endpoint'"
echo "3. Endpoint URL: https://YOUR-WORKER-URL/api/stripe-webhook"
echo "4. Events to listen for:"
echo "   - checkout.session.completed"
echo "5. Copy the webhook signing secret"
echo "6. Add it to Secrets Store as: STRIPE_WEBHOOK_SECRET"
echo ""

read -p "Press Enter after configuring Stripe webhook..."

echo ""
echo -e "${GREEN}✅ Stripe webhook configured${NC}"
echo ""

# ============================================================
# SUCCESS SUMMARY
# ============================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║           🎉  PHILOSIFY DEPLOYMENT COMPLETE!  🎉               ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo ""
echo "✅ Cloudflare Worker deployed"
echo "✅ Philosophical guides uploaded to KV"
echo "✅ Secrets configured via Secrets Store"
echo "✅ Database schema ready"
echo "✅ Frontend deployed"
echo "✅ Stripe webhooks configured"
echo ""
echo -e "${BLUE}🎯 API Endpoints:${NC}"
echo ""
echo "  • GET  /api/health           - Health check"
echo "  • POST /api/search           - Search songs (public)"
echo "  • POST /api/analyze          - Analyze song (requires auth)"
echo "  • GET  /api/balance          - Check credits (requires auth)"
echo "  • POST /api/create-checkout  - Create Stripe session (requires auth)"
echo "  • POST /api/stripe-webhook   - Stripe payment webhook"
echo ""
echo -e "${BLUE}🤖 AI Models Available:${NC}"
echo ""
echo "  ✅ Claude Sonnet 4      (Anthropic)"
echo "  ✅ GPT-4o               (OpenAI)"
echo "  ✅ Gemini 3 Flash     (Google)"
echo "  ✅ Grok 3               (xAI)"
echo ""
echo -e "${BLUE}🌍 Languages Supported:${NC}"
echo ""
echo "  English, Português, Español, Français, Deutsch, Italiano,"
echo "  Русский, 日本語, 中文, 한국어, עברית, Magyar"
echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo ""
echo "  1. Test the API: curl https://YOUR-WORKER-URL/api/health"
echo "  2. Visit your frontend: https://YOUR-PAGES-URL"
echo "  3. Sign up for an account"
echo "  4. Analyze your first song!"
echo ""
echo -e "${YELLOW}💡 Pro Tips:${NC}"
echo ""
echo "  • Monitor Worker logs:  wrangler tail"
echo "  • Check KV data:        wrangler kv:key list --binding=PHILOSIFY_KV"
echo "  • View analytics:       Cloudflare Dashboard → Workers & Pages"
echo "  • Update secrets:       Cloudflare Dashboard → Secrets Store"
echo ""
echo -e "${GREEN}Happy philosophizing! 🎵📚${NC}"
echo ""
