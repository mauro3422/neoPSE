param(
  [ValidateSet("gemma", "gemmaQat", "gemmaE4Qat", "gemma12Qat", "wr")]
  [string]$Profile = "gemma",

  [int]$ContextSize = 8192
)

$ErrorActionPreference = "Stop"

$runtimeDir = $env:LLAMA_RUNTIME_DIR
if ([string]::IsNullOrWhiteSpace($runtimeDir)) {
  $runtimeDir = "D:\ai-runtime\llama-b9360"
}

$zipPath = Join-Path $env:TEMP "neopse-llama-b9360\llama-b9360-bin-win-vulkan-x64.zip"
$llamaExe = Join-Path $runtimeDir "llama.exe"

if (-not (Test-Path $llamaExe)) {
  if (-not (Test-Path $zipPath)) {
    throw "No existe $llamaExe ni el zip de respaldo $zipPath. Descarga llama.cpp b9360 win-vulkan-x64 primero."
  }

  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $runtimeDir -Force
}

if (-not (Test-Path $llamaExe)) {
  throw "No pude restaurar $llamaExe. Revisa si el antivirus lo puso en cuarentena."
}

$commonArgs = @(
  "server",
  "--host", "127.0.0.1",
  "--parallel", "1",
  "-cb",
  "--temp", "0.2",
  "--reasoning", "off",
  "--reasoning-budget", "0",
  "--ctx-size", "$ContextSize",
  "--cache-type-k", "q8_0",
  "--cache-type-v", "q8_0",
  "--cache-ram", "0"
)

$profiles = @{
  gemma = @{
    Model = "D:\ai-models\google_gemma-4-E2B-it-Q4_K_M.gguf"
    Port = "8000"
    Gpu = $true
  }
  gemmaQat = @{
    Model = "D:\ai-models\gemma-4-E2B_q4_0-it.gguf"
    Port = "8003"
    Gpu = $true
  }
  gemmaE4Qat = @{
    Model = "D:\ai-models\gemma-4-E4B_q4_0-it.gguf"
    Port = "8004"
    Gpu = $true
  }
  gemma12Qat = @{
    Model = "D:\ai-models\gemma-4-12b-it-qat-q4_0.gguf"
    Port = "8005"
    Gpu = $true
  }
  wr = @{
    Model = "D:\ai-models\WhiteRabbitNeo-2.5-Qwen-2.5-Coder-7B-Q4_K_M.gguf"
    Port = "8001"
    Gpu = $false
  }
}

$selected = $profiles[$Profile]
if (-not (Test-Path $selected.Model)) {
  throw "No existe el modelo $($selected.Model). Descargalo en D:\ai-models antes de iniciar $Profile."
}

$args = $commonArgs + @(
  "--model", $selected.Model,
  "--port", $selected.Port
)

if ($selected.Gpu) {
  $args = $args + @("--n-gpu-layers", "99", "-fa", "auto")
} else {
  $args = $args + @("--n-gpu-layers", "0", "--threads", "6")
}

& $llamaExe @args
