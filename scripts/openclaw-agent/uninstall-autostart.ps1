$ErrorActionPreference = "Stop"

$startupDir = [Environment]::GetFolderPath("Startup")
$launcher = Join-Path $startupDir "NeoPSE OpenClaw Local Agent.cmd"

if (Test-Path -LiteralPath $launcher) {
  Remove-Item -LiteralPath $launcher -Force
  Write-Output "Removed startup launcher:"
  Write-Output $launcher
} else {
  Write-Output "Startup launcher not found:"
  Write-Output $launcher
}
