param(
  [string]$RepoRoot = "",
  [string]$StateDir = "",
  [switch]$Preview,
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-DefaultStateDir {
  if (-not [string]::IsNullOrWhiteSpace($env:OPENCLAW_CAPITAL_BROKERDESK_STATE_DIR)) {
    return $env:OPENCLAW_CAPITAL_BROKERDESK_STATE_DIR
  }
  if (-not [string]::IsNullOrWhiteSpace($env:BROKERDESK_STATE_DIR)) {
    return $env:BROKERDESK_STATE_DIR
  }
  return ""
}

function Test-ProcessAlive {
  param([int]$ProcessId)
  try {
    Get-Process -Id $ProcessId -ErrorAction Stop | Out-Null
    return $true
  } catch {
    return $false
  }
}

$scriptRoot = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = (Resolve-Path (Join-Path $scriptRoot "..")).Path
}
if ([string]::IsNullOrWhiteSpace($StateDir)) {
  $StateDir = Resolve-DefaultStateDir
}

$serviceDir = Join-Path $RepoRoot ".openclaw\service"
$logDir = Join-Path $RepoRoot ".openclaw\logs"
$pidPath = Join-Path $serviceDir "auto-trading-watch-service.pid"
$statePath = Join-Path $serviceDir "auto-trading-watch-service.json"
$stdoutPath = Join-Path $logDir "auto-trading-watch-service.out.log"
$stderrPath = Join-Path $logDir "auto-trading-watch-service.err.log"
$watchScript = Join-Path $RepoRoot "scripts\openclaw-auto-trading-watch.mjs"
$nodePath = (Get-Command node -ErrorAction Stop).Source

$watchArguments = @(
  $watchScript,
  "--repo-root", $RepoRoot,
  "--json"
)
if (-not [string]::IsNullOrWhiteSpace($StateDir)) {
  $watchArguments = @(
    $watchScript,
    "--repo-root", $RepoRoot,
    "--state-dir", $StateDir,
    "--json"
  )
}

$launchPlan = @{
  schema = "openclaw.auto-trading-watch-service.v1"
  generatedAt = (Get-Date).ToString("o")
  status = "preview"
  repoRoot = $RepoRoot
  stateDir = if ([string]::IsNullOrWhiteSpace($StateDir)) { "auto" } else { $StateDir }
  nodePath = $nodePath
  watchScript = $watchScript
  arguments = $watchArguments
  pidPath = $pidPath
  stdoutPath = $stdoutPath
  stderrPath = $stderrPath
  nextSafeTask = "Keep the watch process running and wait for new SKQuoteLib callbacks."
}

if (Test-Path -LiteralPath $pidPath) {
  try {
    $existingPid = [int]((Get-Content -LiteralPath $pidPath -Raw).Trim())
    if ($existingPid -gt 0 -and (Test-ProcessAlive -ProcessId $existingPid) -and -not $Force) {
      $launchPlan.status = "running"
      $launchPlan.pid = $existingPid
      $launchPlan.generatedAt = (Get-Date).ToString("o")
      New-Item -ItemType Directory -Path $serviceDir -Force | Out-Null
      New-Item -ItemType Directory -Path $logDir -Force | Out-Null
      $launchJson = $launchPlan | ConvertTo-Json -Depth 6
      Set-Content -LiteralPath $statePath -Value ($launchJson + "`n") -Encoding UTF8
      Write-Output $launchJson
      exit 0
    }
  } catch {
    # Fall through and relaunch.
  }
}

if ($Preview) {
  Write-Output ($launchPlan | ConvertTo-Json -Depth 6)
  exit 0
}

New-Item -ItemType Directory -Path $serviceDir, $logDir -Force | Out-Null

$startProcessArgs = @{
  FilePath = $nodePath
  ArgumentList = $watchArguments
  WorkingDirectory = $RepoRoot
  WindowStyle = "Hidden"
  PassThru = $true
  RedirectStandardOutput = $stdoutPath
  RedirectStandardError = $stderrPath
}

$process = Start-Process @startProcessArgs
Set-Content -LiteralPath $pidPath -Value $process.Id -Encoding ASCII
$launchPlan.status = "running"
$launchPlan.pid = $process.Id
$launchPlan.generatedAt = (Get-Date).ToString("o")
$launchJson = $launchPlan | ConvertTo-Json -Depth 6
Set-Content -LiteralPath $statePath -Value ($launchJson + "`n") -Encoding UTF8

Write-Output "AUTO_TRADING_WATCH_DAEMON_STARTED pid=$($process.Id)"
