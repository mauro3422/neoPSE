param(
  [int]$ContextSize = 131072,
  [ValidateSet("off", "auto", "on")]
  [string]$Reasoning = "off",
  [int]$ReasoningBudget = 0,
  [ValidateSet("auto", "none", "deepseek", "deepseek-legacy")]
  [string]$ReasoningFormat = "auto"
)

$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "start-gemma-qat.ps1") -ContextSize $ContextSize -Reasoning $Reasoning -ReasoningBudget $ReasoningBudget -ReasoningFormat $ReasoningFormat
Start-Sleep -Seconds 8
& (Join-Path $PSScriptRoot "health.ps1")
& (Join-Path $PSScriptRoot "configure-openclaw.ps1") -ContextSize $ContextSize -Reasoning $Reasoning
& (Join-Path $PSScriptRoot "start-gateway.ps1")
