$ErrorActionPreference = "Stop"

$targets = Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -eq "node.exe" -or $_.Name -eq "openclaw.cmd") -and
    $_.CommandLine -match "openclaw" -and
    $_.CommandLine -match "gateway"
  }

if (-not $targets) {
  Write-Output "No OpenClaw gateway process found."
  exit 0
}

foreach ($proc in $targets) {
  Stop-Process -Id $proc.ProcessId -Force
  Write-Output "Stopped OpenClaw gateway PID $($proc.ProcessId)."
}
