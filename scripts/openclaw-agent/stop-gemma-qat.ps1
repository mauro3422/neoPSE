param(
  [int]$Port = 8003
)

$ErrorActionPreference = "Stop"

$targets = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match "^llama(-server)?\.exe$" -and $_.CommandLine -match "--port $Port" }

if (-not $targets) {
  Write-Output "No llama.cpp process found on port $Port."
  exit 0
}

foreach ($proc in $targets) {
  Stop-Process -Id $proc.ProcessId -Force
  Write-Output "Stopped llama.cpp PID $($proc.ProcessId) on port $Port."
}
