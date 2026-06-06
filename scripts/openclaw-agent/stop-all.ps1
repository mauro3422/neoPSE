$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "stop-gateway.ps1")
& (Join-Path $PSScriptRoot "stop-gemma-qat.ps1")
