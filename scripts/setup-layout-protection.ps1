# ============================================================
# Setup Layout Protection - PowerShell Script
# ============================================================
# Run this script to enable layout protection hooks
# Usage: .\scripts\setup-layout-protection.ps1
# ============================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔒 LAYOUT PROTECTION SETUP                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository. Run from project root." -ForegroundColor Red
    exit 1
}

# Create hooks directory if it doesn't exist
if (-not (Test-Path ".git/hooks")) {
    New-Item -ItemType Directory -Path ".git/hooks" -Force | Out-Null
}

# Copy pre-commit hook
$hookContent = @'
#!/bin/sh
# Layout Protection Pre-Commit Hook
# Warns when protected CSS files are modified

PROTECTED="site/src/styles/ui.css site/src/styles/utilities.css site/src/styles/responsive.css site/src/styles/layout-locked.css"

for file in $PROTECTED; do
    if git diff --cached --name-only | grep -q "$file"; then
        echo ""
        echo "⚠️  WARNING: You are modifying protected CSS files!"
        echo ""
        echo "Please ensure you:"
        echo "  1. Read site/LAYOUT_SPECS.md"
        echo "  2. Tested on Desktop AND Mobile"
        echo "  3. Got approval for layout changes"
        echo ""
        echo "Type 'yes' to continue:"
        exec < /dev/tty
        read answer
        if [ "$answer" != "yes" ]; then
            echo "Commit aborted."
            exit 1
        fi
        break
    fi
done
exit 0
'@

$hookContent | Out-File -FilePath ".git/hooks/pre-commit" -Encoding utf8 -Force

Write-Host "✅ Pre-commit hook installed" -ForegroundColor Green
Write-Host ""
Write-Host "Protected files:" -ForegroundColor Yellow
Write-Host "  - site/src/styles/ui.css"
Write-Host "  - site/src/styles/utilities.css"
Write-Host "  - site/src/styles/responsive.css"
Write-Host "  - site/src/styles/layout-locked.css"
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Yellow
Write-Host "  - site/LAYOUT_SPECS.md"
Write-Host "  - site/docs/layout-reference/"
Write-Host ""
Write-Host "🔒 Layout protection is now active!" -ForegroundColor Green
Write-Host ""







