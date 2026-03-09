#!/bin/bash
# Deploy to Production
# Deploys both backend and frontend to Cloudflare

set -e  # Exit on error

echo "🚀 Deploying Philosify to Production..."
echo ""

# Deploy backend
echo "📦 Deploying Backend API..."
cd api
wrangler deploy --env production
echo "✅ Backend deployed successfully!"
echo ""

# Build and deploy frontend
echo "🎨 Building Frontend..."
cd ../site

if [[ -z "${VITE_SUPABASE_URL}" || -z "${VITE_SUPABASE_ANON_KEY}" ]]; then
  echo ""
  echo "❌ Missing required frontend build env vars:"
  echo "  - VITE_SUPABASE_URL"
  echo "  - VITE_SUPABASE_ANON_KEY"
  echo ""
  echo "Set them in your shell before running this script."
  exit 1
fi

npm run build

echo "🌐 Deploying Frontend..."
wrangler pages deploy dist --project-name=philosify-frontend --branch=production

echo ""
echo "✅ Production Deployment Complete!"
echo ""
echo "Backend:  https://api.philosify.org"
echo "Frontend: https://philosify.org"
echo ""
