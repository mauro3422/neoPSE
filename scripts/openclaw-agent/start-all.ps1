param(
  [int]$ContextSize = 131072,
  [switch]$Multimodal,
  [int]$ModelPort = 8003,
  [ValidateSet("minimal", "coding", "messaging", "full")]
  [string]$ToolProfile = "full",
  [ValidateSet("off", "auto", "on")]
  [string]$Reasoning = "off",
  [int]$ReasoningBudget = 0,
  [ValidateSet("auto", "none", "deepseek", "deepseek-legacy")]
  [string]$ReasoningFormat = "auto"
)

$ErrorActionPreference = "Stop"

if ($Multimodal) {
  if ($ModelPort -eq 8003) {
    $ModelPort = 8007
  }
  & (Join-Path $PSScriptRoot "start-gemma-multimodal.ps1") -ContextSize $ContextSize -Port $ModelPort -Reasoning $Reasoning -ReasoningBudget $ReasoningBudget -ReasoningFormat $ReasoningFormat
} else {
  & (Join-Path $PSScriptRoot "start-gemma-qat.ps1") -ContextSize $ContextSize -Port $ModelPort -Reasoning $Reasoning -ReasoningBudget $ReasoningBudget -ReasoningFormat $ReasoningFormat
}
Start-Sleep -Seconds 8
& (Join-Path $PSScriptRoot "health.ps1") -Port $ModelPort
& (Join-Path $PSScriptRoot "configure-openclaw.ps1") -ContextSize $ContextSize -ModelPort $ModelPort -Reasoning $Reasoning -ToolProfile $ToolProfile -Multimodal:$Multimodal
& (Join-Path $PSScriptRoot "start-gateway.ps1")
