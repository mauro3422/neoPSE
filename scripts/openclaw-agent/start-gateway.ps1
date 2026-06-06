param(
  [int]$Port = 18789
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir = Join-Path $root "logs\openclaw-agent"
$stdoutLog = Join-Path $logDir "openclaw-gateway.stdout.log"
$stderrLog = Join-Path $logDir "openclaw-gateway.stderr.log"
$rawStreamLog = Join-Path $logDir "openclaw-raw-stream.jsonl"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
$openclaw = (Get-Command openclaw.cmd -ErrorAction Stop).Source

$existing = Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -eq "node.exe" -or $_.Name -eq "openclaw.cmd") -and
    $_.CommandLine -match "openclaw" -and
    $_.CommandLine -match "gateway"
  }

foreach ($proc in $existing) {
  Stop-Process -Id $proc.ProcessId -Force
}

$args = @(
  "gateway",
  "run",
  "--port", "$Port",
  "--bind", "loopback",
  "--raw-stream",
  "--raw-stream-path", $rawStreamLog,
  "--ws-log", "compact"
)

$proc = Start-Process -FilePath $openclaw `
  -ArgumentList $args `
  -WorkingDirectory $root `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -WindowStyle Hidden `
  -PassThru

Write-Output "Started OpenClaw gateway on ws://127.0.0.1:$Port"
Write-Output "PID: $($proc.Id)"
Write-Output "Logs: $logDir"
