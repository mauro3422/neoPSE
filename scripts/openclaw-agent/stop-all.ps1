$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "stop-gateway.ps1")
& (Join-Path $PSScriptRoot "stop-gemma-qat.ps1") -Port 8003
& (Join-Path $PSScriptRoot "stop-gemma-qat.ps1") -Port 8007
