param(
  [int]$ContextSize = 131072,
  [int]$MaxTokens = 2048,
  [int]$ModelPort = 8003,
  [int]$GatewayPort = 18789,
  [ValidateSet("minimal", "coding", "messaging", "full")]
  [string]$ToolProfile = "full",
  [switch]$Multimodal,
  [ValidateSet("off", "auto", "on")]
  [string]$Reasoning = "off"
)

$ErrorActionPreference = "Stop"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
$openclaw = (Get-Command openclaw.cmd -ErrorAction Stop).Source
$baseUrl = "http://127.0.0.1:$ModelPort/v1"
$reasoningEnabled = $Reasoning -ne "off"
$modelInput = if ($Multimodal) { @("text", "image", "audio") } else { @("text") }
$modelName = if ($reasoningEnabled) {
  if ($Multimodal) {
    "Gemma 4 E2B QAT local multimodal thinking via llama.cpp"
  } else {
    "Gemma 4 E2B QAT local thinking via llama.cpp"
  }
} else {
  if ($Multimodal) {
    "Gemma 4 E2B QAT local multimodal via llama.cpp"
  } else {
    "Gemma 4 E2B QAT local via llama.cpp"
  }
}

$patch = @{
  agents = @{
    defaults = @{
      workspace = "C:\Users\mauro\.openclaw\workspace"
      model = @{
        primary = "local/gemma-4-E2B_q4_0-it.gguf"
      }
      models = @{
        "local/gemma-4-E2B_q4_0-it.gguf" = @{
          alias = "gemma-qat-local"
        }
      }
      experimental = @{
        localModelLean = $true
      }
    }
  }
  gateway = @{
    mode = "local"
    port = $GatewayPort
    bind = "loopback"
    tailscale = @{
      mode = "off"
      resetOnExit = $false
    }
  }
  models = @{
    mode = "merge"
    providers = @{
      local = @{
        baseUrl = $baseUrl
        api = "openai-completions"
        apiKey = "sk-local"
        timeoutSeconds = 300
        models = @(
          @{
            id = "gemma-4-E2B_q4_0-it.gguf"
            name = $modelName
            contextWindow = $ContextSize
            maxTokens = $MaxTokens
            input = $modelInput
            cost = @{
              input = 0
              output = 0
              cacheRead = 0
              cacheWrite = 0
            }
            reasoning = $reasoningEnabled
            compat = @{
              requiresStringContent = -not $Multimodal
            }
          }
        )
      }
    }
  }
  tools = @{
    profile = $ToolProfile
    web = @{
      search = @{
        enabled = $true
        provider = "duckduckgo"
        maxResults = 5
        timeoutSeconds = 30
        cacheTtlMinutes = 15
      }
    }
  }
  plugins = @{
    entries = @{
      duckduckgo = @{
        enabled = $true
        config = @{
          webSearch = @{
            region = "ar-es"
            safeSearch = "moderate"
          }
        }
      }
    }
  }
} | ConvertTo-Json -Depth 12

$patch | & $openclaw config patch --stdin
& $openclaw config validate
