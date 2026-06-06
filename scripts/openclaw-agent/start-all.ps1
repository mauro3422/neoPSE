param(
  [int]$ContextSize = 131072
)

$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "start-gemma-qat.ps1") -ContextSize $ContextSize
Start-Sleep -Seconds 8
& (Join-Path $PSScriptRoot "health.ps1")
& (Join-Path $PSScriptRoot "start-gateway.ps1")
