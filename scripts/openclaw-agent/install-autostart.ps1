param(
  [int]$ContextSize = 131072
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$startupDir = [Environment]::GetFolderPath("Startup")
$launcher = Join-Path $startupDir "NeoPSE OpenClaw Local Agent.cmd"
$logDir = Join-Path $root "logs\openclaw-agent"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$content = @"
@echo off
cd /d "$root"
powershell -NoProfile -ExecutionPolicy Bypass -File "$root\scripts\openclaw-agent\start-all.ps1" -ContextSize $ContextSize >> "$logDir\autostart.log" 2>&1
"@

Set-Content -Path $launcher -Value $content -Encoding ASCII
Write-Output "Installed startup launcher:"
Write-Output $launcher
Write-Output "It will start Gemma QAT + OpenClaw Gateway at user login."
