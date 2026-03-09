@echo off
REM Build Frontend Locally (for testing before deployment)

echo ========================================
echo Building Frontend Locally
echo ========================================
echo.

REM Navigate to site directory
cd /d "%~dp0site"

echo [1/2] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/2] Building frontend...
set NODE_ENV=production
set VITE_API_URL=https://api.philosify.org
set VITE_CDN_URL=https://pub-2485a0b8727445bbb7148e85a0db3edf.r2.dev
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Build output is in: site\dist
echo You can preview it with: cd site ^&^& npm run preview
echo.
pause
