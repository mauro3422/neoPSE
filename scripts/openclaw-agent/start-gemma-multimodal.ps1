param(
  [int]$ContextSize = 8192,
  [int]$Port = 8007,
  [ValidateSet("off", "auto", "on")]
  [string]$Reasoning = "off",
  [int]$ReasoningBudget = 0,
  [ValidateSet("auto", "none", "deepseek", "deepseek-legacy")]
  [string]$ReasoningFormat = "auto",
  [switch]$Foreground
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$runtimeDir = $env:LLAMA_RUNTIME_DIR
if ([string]::IsNullOrWhiteSpace($runtimeDir)) {
  $runtimeDir = "D:\ai-runtime\llama-b9360"
}

$modelPath = "D:\ai-models\gemma-4-E2B_q4_0-it.gguf"
$mmprojPath = "D:\ai-models\gemma-4-E2B-it-mmproj.gguf"
$llamaExe = Join-Path $runtimeDir "llama.exe"
$llamaServerExe = Join-Path $runtimeDir "llama-server.exe"
$logDir = Join-Path $root "logs\openclaw-agent"
$stdoutLog = Join-Path $logDir "gemma-multimodal.stdout.log"
$stderrLog = Join-Path $logDir "gemma-multimodal.stderr.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if (Test-Path $llamaExe) {
  $serverBin = $llamaExe
  $baseArgs = @("server")
} elseif (Test-Path $llamaServerExe) {
  $serverBin = $llamaServerExe
  $baseArgs = @()
} else {
  throw "No pude encontrar llama.exe o llama-server.exe en $runtimeDir."
}

if (-not (Test-Path $modelPath)) {
  throw "No existe el modelo $modelPath."
}

if (-not (Test-Path $mmprojPath)) {
  throw "No existe el projector multimodal $mmprojPath."
}

$existing = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match "^llama(-server)?\.exe$" -and $_.CommandLine -match "--port $Port" }

foreach ($proc in $existing) {
  Stop-Process -Id $proc.ProcessId -Force
}

$args = $baseArgs + @(
  "--host", "127.0.0.1",
  "--port", "$Port",
  "--model", $modelPath,
  "--mmproj", $mmprojPath,
  "--ctx-size", "$ContextSize",
  "--parallel", "1",
  "-cb",
  "--temp", "0.2",
  "--reasoning", $Reasoning,
  "--reasoning-budget", "$ReasoningBudget",
  "--reasoning-format", $ReasoningFormat,
  "--cache-type-k", "q8_0",
  "--cache-type-v", "q8_0",
  "--cache-ram", "0",
  "--n-gpu-layers", "99",
  "-fa", "auto"
)

if ($Foreground) {
  & $serverBin @args 2>&1 | Tee-Object -FilePath $stdoutLog -Append
  exit $LASTEXITCODE
}

$proc = Start-Process -FilePath $serverBin `
  -ArgumentList $args `
  -WorkingDirectory $root `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -WindowStyle Hidden `
  -PassThru

Write-Output "Started Gemma QAT multimodal test server on http://127.0.0.1:$Port/v1"
Write-Output "PID: $($proc.Id)"
Write-Output "Context: $ContextSize"
Write-Output "MMProj: $mmprojPath"
Write-Output "Reasoning: $Reasoning (budget: $ReasoningBudget, format: $ReasoningFormat)"
Write-Output "Logs: $logDir"
