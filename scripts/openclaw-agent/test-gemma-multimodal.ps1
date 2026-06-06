param(
  [int]$Port = 8007
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$fixtures = Join-Path $root "benchmarks\fixtures"
$pngPath = Join-Path $fixtures "multimodal-test.png"
$wavPath = Join-Path $fixtures "multimodal-test.wav"

if (-not (Test-Path $pngPath)) {
  throw "No existe fixture de imagen: $pngPath"
}

if (-not (Test-Path $wavPath)) {
  throw "No existe fixture de audio: $wavPath"
}

function Invoke-ChatCompletion($Body) {
  $json = $Body | ConvertTo-Json -Depth 20
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $res = Invoke-RestMethod `
    -Uri "http://127.0.0.1:$Port/v1/chat/completions" `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body $bytes `
    -TimeoutSec 180
  $sw.Stop()

  [PSCustomObject]@{
    elapsedMs = $sw.ElapsedMilliseconds
    content = $res.choices[0].message.content
    promptTokens = $res.usage.prompt_tokens
    completionTokens = $res.usage.completion_tokens
    totalTokens = $res.usage.total_tokens
  }
}

$imageDataUri = "data:image/png;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes($pngPath))
$imageResult = Invoke-ChatCompletion @{
  model = "gemma-4-E2B_q4_0-it.gguf"
  messages = @(
    @{
      role = "user"
      content = @(
        @{ type = "image_url"; image_url = @{ url = $imageDataUri } },
        @{ type = "text"; text = "Describe the image in one short sentence. Mention colors and shapes." }
      )
    }
  )
  temperature = 0.2
  max_tokens = 768
  stream = $false
}

$audioB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($wavPath))
$audioResult = Invoke-ChatCompletion @{
  model = "gemma-4-E2B_q4_0-it.gguf"
  messages = @(
    @{
      role = "user"
      content = @(
        @{ type = "text"; text = "Transcribe the following speech segment in its original language. Only output the transcription." },
        @{ type = "input_audio"; input_audio = @{ data = $audioB64; format = "wav" } }
      )
    }
  )
  temperature = 0.2
  max_tokens = 768
  stream = $false
}

[PSCustomObject]@{
  endpoint = "http://127.0.0.1:$Port/v1"
  image = $imageResult
  audio = $audioResult
} | ConvertTo-Json -Depth 8
