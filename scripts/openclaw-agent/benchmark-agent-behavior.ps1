param(
  [string[]]$ThinkingLevels = @("off", "medium"),
  [int]$TimeoutSeconds = 360,
  [int]$Limit = 0
)

$ErrorActionPreference = "Stop"

$ThinkingLevels = @(
  foreach ($level in $ThinkingLevels) {
    foreach ($part in ($level -split ",")) {
      if (-not [string]::IsNullOrWhiteSpace($part)) {
        $part.Trim()
      }
    }
  }
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $root "benchmarks\results\openclaw-agent-$stamp"
$latestPath = Join-Path $root "benchmarks\results\openclaw-agent-latest.md"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$cases = @(
  @{
    id = "skill-discovery"
    prompt = "Estamos en Windows. Averigua si existe meme-maker. No uses herramientas repetidas. Si no sabes que herramienta usar, responde con lo que recuerdas del contexto de skills y di que no verificaste. Responde breve."
    mustContain = @("meme-maker")
    maxToolCalls = 2
  },
  @{
    id = "windows-shell-awareness"
    prompt = "Necesito listar el workspace de OpenClaw. Explica que comando de PowerShell usarias y no uses sintaxis Linux. Responde breve."
    mustContain = @("Get-ChildItem")
    maxToolCalls = 1
  },
  @{
    id = "memory-instruction"
    prompt = "Quiero que recuerdes que en esta PC se usa PowerShell. Dime que archivo de memoria o notas actualizarias en OpenClaw y que escribirias, sin modificar nada todavia."
    mustContain = @("MEMORY.md", "PowerShell")
    maxToolCalls = 1
  }
)

if ($Limit -gt 0) {
  $cases = $cases | Select-Object -First $Limit
}

function Get-PayloadText($Result) {
  $payloads = $Result.result.payloads
  if (-not $payloads) { return "" }
  return (($payloads | ForEach-Object { $_.text }) -join "`n").Trim()
}

function Get-ToolCalls($Result) {
  $summary = $Result.result.meta.toolSummary
  if ($summary -and $null -ne $summary.calls) {
    return [int]$summary.calls
  }
  return 0
}

function Get-Tools($Result) {
  $summary = $Result.result.meta.toolSummary
  if ($summary -and $summary.tools) {
    return @($summary.tools)
  }
  return @()
}

$results = @()

foreach ($thinking in $ThinkingLevels) {
  foreach ($case in $cases) {
    $sessionKey = "agent:main:bench-$($case.id)-$thinking-$stamp"
    $rawPath = Join-Path $outDir "$($case.id)-$thinking.json"
    $sw = [Diagnostics.Stopwatch]::StartNew()

    $args = @(
      "agent",
      "--session-key", $sessionKey,
      "--thinking", $thinking,
      "--timeout", "$TimeoutSeconds",
      "--json",
      "--message", $case.prompt
    )

    $raw = & openclaw @args 2>&1
    $sw.Stop()
    $rawText = ($raw | Out-String).Trim()
    Set-Content -LiteralPath $rawPath -Value $rawText -Encoding UTF8

    $parsed = $null
    $parseError = $null
    try {
      $parsed = $rawText | ConvertFrom-Json
    } catch {
      $parseError = $_.Exception.Message
    }

    $status = if ($parsed) { [string]$parsed.status } else { "parse_error" }
    $payloadText = if ($parsed) { Get-PayloadText $parsed } else { "" }
    $toolCalls = if ($parsed) { Get-ToolCalls $parsed } else { 0 }
    $tools = if ($parsed) { Get-Tools $parsed } else { @() }
    $containsOk = $true
    foreach ($needle in $case.mustContain) {
      if ($payloadText -notmatch [regex]::Escape($needle)) {
        $containsOk = $false
      }
    }

    $toolLoop = $toolCalls -gt [int]$case.maxToolCalls
    $ok = $parsed -and $status -eq "ok" -and $containsOk -and -not $toolLoop

    $results += [PSCustomObject]@{
      case = $case.id
      thinking = $thinking
      ok = [bool]$ok
      status = $status
      elapsedMs = $sw.ElapsedMilliseconds
      toolCalls = $toolCalls
      tools = ($tools -join ",")
      text = $payloadText
      raw = $rawPath
      parseError = $parseError
    }
  }
}

$summaryJson = Join-Path $outDir "summary.json"
$results | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $summaryJson -Encoding UTF8

$lines = @()
$lines += "# OpenClaw Agent Benchmark"
$lines += ""
$lines += "Date: $(Get-Date -Format s)"
$lines += "Timeout per case: $TimeoutSeconds seconds"
$lines += ""
$lines += "| Case | Thinking | OK | Status | Elapsed ms | Tool calls | Tools | Text |"
$lines += "|---|---:|---:|---|---:|---:|---|---|"
foreach ($r in $results) {
  $text = ($r.text -replace "\|", "/" -replace "`r?`n", " ")
  if ($text.Length -gt 120) { $text = $text.Substring(0, 120) + "..." }
  $lines += "| $($r.case) | $($r.thinking) | $($r.ok) | $($r.status) | $($r.elapsedMs) | $($r.toolCalls) | $($r.tools) | $text |"
}
$lines += ""
$lines += "Raw JSON: $outDir"

$md = $lines -join "`n"
Set-Content -LiteralPath $latestPath -Value $md -Encoding UTF8
Set-Content -LiteralPath (Join-Path $outDir "summary.md") -Value $md -Encoding UTF8

$results | Format-Table -AutoSize
Write-Output "Summary: $latestPath"
