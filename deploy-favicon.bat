@echo off
REM Deploy Favicon Update - Commit, Push, and Deploy to Cloudflare
REM This script commits the favicon changes and pushes to GitHub
REM GitHub Actions will automatically build and deploy to Cloudflare Pages

echo ========================================
echo Deploying Favicon Update
echo ========================================
echo.

REM Navigate to project root
cd /d "%~dp0"

echo [1/4] Checking git status...
git status
echo.

echo [2/4] Adding changes...
git add site/index.html
echo.

echo [3/4] Committing changes...
git commit -m "Update favicon to use favicon.ico from Cloudflare R2 storage"
echo.

echo [4/4] Pushing to GitHub (production branch)...
git push origin production
echo.

echo ========================================
echo Done!
echo ========================================
echo.
echo Changes have been pushed to GitHub production branch.
echo GitHub Actions will automatically:
echo   - Build the frontend
echo   - Deploy to Cloudflare Pages (production branch)
echo.
echo Check deployment status at:
echo https://github.com/%USERNAME%/philosify-web/actions
echo.
pause
