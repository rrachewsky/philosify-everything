param(
  [string]$GuidePath = "",
  [string]$KvKey = "guide_text",
  [ValidateSet("production", "")]
  [string]$Environment = "production",
  [switch]$NoPrompt
)

$ErrorActionPreference = "Stop"

function Resolve-GuidePath([string]$p) {
  if ($p -and $p.Trim().Length -gt 0) {
    return (Resolve-Path -LiteralPath $p).Path
  }
  # Default: canonical guide in repo
  $default = Join-Path $PSScriptRoot "..\\guides\\Guide_v2.9_LITE.txt"
  return (Resolve-Path -LiteralPath $default).Path
}

$resolvedGuide = Resolve-GuidePath $GuidePath

if (!(Test-Path -LiteralPath $resolvedGuide)) {
  throw "Guide file not found: $resolvedGuide"
}

$content = Get-Content -LiteralPath $resolvedGuide -Raw -Encoding UTF8
if (!$content -or $content.Trim().Length -lt 100) {
  throw "Guide file looks empty/too small (refusing upload): $resolvedGuide"
}

$sha256 = (Get-FileHash -LiteralPath $resolvedGuide -Algorithm SHA256).Hash.ToLowerInvariant()

Write-Host ""
Write-Host "Philosify - Upload Guide to Cloudflare KV"
Write-Host "----------------------------------------"
Write-Host "Guide: $resolvedGuide"
Write-Host "KV key: $KvKey"
Write-Host "SHA256: $sha256"
Write-Host "Env:   $Environment"
Write-Host ""
Write-Host "NOTE: Worker caches guides in-memory for up to 1 hour. For immediate effect, redeploy the Worker."
Write-Host ""

if (-not $NoPrompt) {
  $answer = Read-Host "Proceed with upload? (y/N)"
  if ($answer.ToLowerInvariant() -ne "y") {
    Write-Host "Aborted."
    exit 1
  }
}

Push-Location (Join-Path $PSScriptRoot "..")
try {
  $envArgs = @()
  if ($Environment -and $Environment.Trim().Length -gt 0) {
    $envArgs = @("--env", $Environment)
  }

  # Uses wrangler.toml binding PHILOSIFY_KV
  & wrangler kv:key put --binding=PHILOSIFY_KV $KvKey --path $resolvedGuide @envArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Wrangler upload failed (exit code $LASTEXITCODE)"
  }

  Write-Host ""
  Write-Host "Upload complete."
} finally {
  Pop-Location
}

