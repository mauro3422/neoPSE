param(
  [int]$ContextSize = 131072,
  [int]$MaxTokens = 2048,
  [int]$ModelPort = 8003,
  [int]$GatewayPort = 18789
)

$ErrorActionPreference = "Stop"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
$openclaw = (Get-Command openclaw.cmd -ErrorAction Stop).Source
$baseUrl = "http://127.0.0.1:$ModelPort/v1"

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
            name = "Gemma 4 E2B QAT local via llama.cpp"
            contextWindow = $ContextSize
            maxTokens = $MaxTokens
            input = @("text")
            cost = @{
              input = 0
              output = 0
              cacheRead = 0
              cacheWrite = 0
            }
            reasoning = $false
            compat = @{
              requiresStringContent = $true
            }
          }
        )
      }
    }
  }
} | ConvertTo-Json -Depth 12

$patch | & $openclaw config patch --stdin
& $openclaw config validate
