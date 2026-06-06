# OpenClaw Local Agent

This local agent uses OpenClaw with NeoPSE's local `llama.cpp` runtime, but it has its own launcher so NeoPSE does not need to be running.

## Model

- Model: `D:\ai-models\gemma-4-E2B_q4_0-it.gguf`
- Runtime: `D:\ai-runtime\llama-b9360\llama.exe server`
- Endpoint: `http://127.0.0.1:8003/v1`
- Context: `131072`
- Max output configured in OpenClaw: `2048`

The GGUF reports `n_ctx_train = 131072`, and the dedicated OpenClaw launcher now starts with the full context. If it becomes slow or unstable during real use, start it with a smaller value:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/openclaw-agent/start-all.ps1 -ContextSize 32768
```

## Commands

```powershell
npm run agent:start
npm run agent:start:thinking
npm run agent:stop

npm run agent:gemma
npm run agent:gemma:thinking
npm run agent:gemma:health
npm run agent:gemma:stop

npm run agent:gateway
npm run agent:gateway:stop
```

## Autostart

OpenClaw's own service installer starts the Gateway, but this setup also needs the external `llama.cpp` model server. Use the NeoPSE startup wrapper instead:

```powershell
npm run agent:autostart:install
```

This adds a user-login launcher to the Windows Startup folder. It runs:

```powershell
scripts/openclaw-agent/start-all.ps1 -ContextSize 131072
```

## Thinking Mode

The default launcher keeps llama.cpp reasoning disabled so normal chat is fast and benchmark results stay comparable. To test Gemma QAT with reasoning enabled:

```powershell
npm run agent:start:thinking
```

That restarts the model server and rewrites the OpenClaw local model metadata with:

```text
--reasoning on --reasoning-budget 512 --reasoning-format auto
```

OpenClaw still shows one local Gemma model. The mode is selected by how you start the agent, because exposing normal and thinking as two simultaneous dropdown choices would require two llama.cpp servers and two copies of the model in memory.

Use this for planning, tool decisions, or messy tasks. For quick chat, memory notes, and background watching, start with the normal `npm run agent:start` and only switch if quality is not enough.

Benchmark comparison:

```powershell
npx tsx scripts/debugger-llm.ts compare --profiles gemmaQat,gemmaQatThink --limit 10
```

Remove it with:

```powershell
npm run agent:autostart:uninstall
```

If OpenClaw config is reset, re-apply the local provider with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/openclaw-agent/configure-openclaw.ps1
```

The launcher writes logs to:

```text
logs/openclaw-agent/
```

Important files:

```text
gemma-qat.stdout.log
gemma-qat.stderr.log
openclaw-gateway.stdout.log
openclaw-gateway.stderr.log
openclaw-raw-stream.jsonl
```

## OpenClaw Config

OpenClaw should point to:

```text
provider: local
baseUrl: http://127.0.0.1:8003/v1
model: gemma-4-E2B_q4_0-it.gguf
contextWindow: 131072
maxTokens: 2048
```

Web search is configured to use DuckDuckGo:

```text
tools.web.search.provider: duckduckgo
```

This avoids the default/auto Kimi provider path, which requires `KIMI_API_KEY` or `MOONSHOT_API_KEY`.

This setup is intentionally text-only for now. Do not grant mail/calendar/filesystem automation until the base chat and tool behavior is stable.

## Next Tests

1. Start Gemma QAT with `npm run agent:gemma`.
2. Start OpenClaw gateway with `npm run agent:gateway`.
3. Talk to the agent manually for normal conversation.
4. Capture failures in `logs/openclaw-agent/` and OpenClaw gateway logs.
5. Only then add memory-curation tools.
