# Deploy to Production
# Deploys both backend and frontend to Cloudflare

Write-Host "Deploying Philosify to Production..." -ForegroundColor Cyan
Write-Host ""

# Deploy backend
Write-Host "Deploying Backend API..." -ForegroundColor Yellow
cd "$PSScriptRoot\api"
wrangler deploy --env production

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Build and deploy frontend
Write-Host "Building Frontend..." -ForegroundColor Yellow
cd "$PSScriptRoot\site"

if (-not $env:VITE_SUPABASE_URL -or -not $env:VITE_SUPABASE_ANON_KEY) {
    Write-Host ""
    Write-Host "Missing required frontend build env vars:" -ForegroundColor Red
    Write-Host "  - VITE_SUPABASE_URL" -ForegroundColor Red
    Write-Host "  - VITE_SUPABASE_ANON_KEY" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set them in this PowerShell session BEFORE building, e.g.:" -ForegroundColor Yellow
    Write-Host "  `$env:VITE_SUPABASE_URL='https://YOURPROJECT.supabase.co'" -ForegroundColor Yellow
    Write-Host "  `$env:VITE_SUPABASE_ANON_KEY='YOUR_SUPABASE_ANON_KEY'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying Frontend..." -ForegroundColor Yellow
wrangler pages deploy dist --project-name=philosify-frontend --branch=production

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Production Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  https://api.philosify.org" -ForegroundColor Cyan
Write-Host "Frontend: https://philosify.org" -ForegroundColor Cyan
Write-Host ""
