# OpenClaw Session Config

Date: 2026-06-06

This note records the OpenClaw/Gemma local-agent setup used alongside NeoPSE. It is not Omni system documentation and should not be treated as NeoPSE core runtime behavior.

## Purpose

We configured OpenClaw as a separate local assistant that can keep running even when NeoPSE is not open. The current goal is to validate Gemma 4 as a personal local agent for chat, task support, memory curation, PDF/work extraction, and offline study help.

## Current Runtime

```text
OpenClaw: 2026.6.1
Gateway: ws://127.0.0.1:18789
Dashboard: http://127.0.0.1:18789/
Model endpoint: http://127.0.0.1:8003/v1
Runtime: D:\ai-runtime\llama-b9360\llama.exe server
Model: D:\ai-models\gemma-4-E2B_q4_0-it.gguf
Context: 131072
Max output in OpenClaw: 2048
Tool profile: coding
Web search provider: duckduckgo
```

OpenClaw state/config lives under:

```text
C:\Users\mauro\.openclaw
```

The OpenClaw workspace is:

```text
C:\Users\mauro\.openclaw\workspace
```

Do not assume the agent can write to arbitrary user folders such as Desktop. It can write to its workspace when the write tool is exposed and the request is scoped clearly.

## NeoPSE Scripts

Main scripts added for the OpenClaw local agent:

```text
scripts/openclaw-agent/start-all.ps1
scripts/openclaw-agent/stop-all.ps1
scripts/openclaw-agent/start-gemma-qat.ps1
scripts/openclaw-agent/stop-gemma-qat.ps1
scripts/openclaw-agent/start-gateway.ps1
scripts/openclaw-agent/stop-gateway.ps1
scripts/openclaw-agent/health.ps1
scripts/openclaw-agent/configure-openclaw.ps1
scripts/openclaw-agent/install-autostart.ps1
scripts/openclaw-agent/uninstall-autostart.ps1
```

Package commands:

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
npm run agent:autostart:install
npm run agent:autostart:uninstall
```

## Thinking Mode

Default mode is reasoning off:

```text
--reasoning off --reasoning-budget 0
```

Thinking mode starts the same GGUF with:

```text
--reasoning on --reasoning-budget 512 --reasoning-format auto
```

Thinking is not a second model file. It is a llama.cpp/Gemma runtime mode using the model chat template and a reasoning budget. It improves some planning/tool-decision behavior, but increases latency because hidden reasoning tokens are generated before the final answer.

Do not expose normal and thinking as two simultaneous OpenClaw dropdown choices unless we deliberately run two llama.cpp servers. Two servers would duplicate model memory/VRAM use.

## Benchmarks Observed

Benchmark profile added:

```text
gemmaQatThink
```

Small comparison results:

```text
gemmaQat normal:    5/5 conversational, 5/5 canvas/action JSON
gemmaQat thinking: 5/5 conversational, 5/5 canvas/action JSON
```

Initial thinking budget of `2048` was too high for short benchmark outputs: the model spent the output budget on hidden reasoning and returned empty/too-short final text. Budget `512` worked better.

Observed warm local speed for the current Gemma QAT server:

```text
short answer: ~9.7 tok/s
medium answer: ~10.8 tok/s
```

A slow response around 77s was explained by active OpenClaw use/queued work and the single llama.cpp slot:

```text
--parallel 1
```

## System Resource Snapshot

Approximate system state during this session:

```text
RAM total: ~15.9 GB
RAM free: ~2.9-3.3 GB
llama.exe private RAM: ~3.2 GB
llama.exe dedicated VRAM: ~2.45 GB
```

Other notable memory/GPU users:

```text
VS Code: ~2.5-3.5 GB RAM
Chrome: ~2.2 GB RAM
Discord: ~1.1 GB RAM, possible inflated VRAM counter
Wallpaper Engine: ~900 MB VRAM and visible GPU 3D load
OpenClaw gateway node: ~0.37 GB RAM
```

Recommendation for serious model tests: pause Wallpaper Engine and close/restart Discord if GPU/RAM pressure looks odd.

## Tool Behavior Learned

Gemma 4 E2B QAT can use OpenClaw tools, but it needs clear scope.

Good prompt:

```text
Usa una herramienta de escritura si esta disponible. Crea el archivo tp3_test.svg dentro del workspace de OpenClaw, no en mi Escritorio. Si no puedes usar una herramienta, dime el nombre exacto de las herramientas disponibles y el error exacto.
```

This produced real tool use:

```text
Write -> tp3_test.svg
Read -> tp3_test.svg
```

Poor/ambiguous prompt:

```text
Crea el archivo en mi Escritorio.
```

The model replied with generic limitations instead of using tools. Likely causes:

```text
Desktop is outside the OpenClaw workspace.
The model is cautious about filesystem access.
Small models may choose text answers instead of tool calls unless the instruction is explicit.
```

Important: do not confuse the model naming tools with actually calling tools. Check the OpenClaw Activity panel or raw stream log.

## Quality Notes On Gemma 4 E2B QAT

The model is surprisingly strong for its size:

```text
Good Spanish chat continuity
PDF understanding through OpenClaw attachments
Markdown generation
PSeInt/pseudocode assistance
SVG generation
Web search tool use after DuckDuckGo setup
Workspace file write/read when prompted correctly
Long chat continuity at ~25k/131k tokens
```

Weak points:

```text
Can overstate or deny tool capabilities depending on prompt wording
Can produce visual layout bugs in SVG
Can emit encoding artifacts in pasted/logged text
Needs validation for generated files and structured outputs
Not safe yet for broad filesystem/email/calendar automation
```

Current stance: Gemma 4 E2B QAT is good enough for a local personal assistant and study helper when constrained to a workspace and validated. It should not be trusted blindly for irreversible actions.

## Text-Only / Mobile Model Lead

Google's Gemma 4 QAT mobile/text-only direction is promising for a future memory cell. Official notes mention E2B text-only deployment under 1 GB memory when unused modalities and PLE are omitted. This is probably not the same as the current GGUF path.

Likely split:

```text
Current OpenClaw assistant:
  Gemma 4 E2B QAT Q4_0 GGUF via llama.cpp

Future memory cell:
  Gemma 4 E2B mobile/text-only via LiteRT-LM, Transformers, Transformers.js, or another supported runtime
```

## Multimodal Add-On

The official Google QAT GGUF repo also provides the multimodal projector:

```text
Repo: google/gemma-4-E2B-it-qat-q4_0-gguf
URL: https://huggingface.co/google/gemma-4-E2B-it-qat-q4_0-gguf
File: gemma-4-E2B-it-mmproj.gguf
Local path: D:\ai-models\gemma-4-E2B-it-mmproj.gguf
Approx size: 0.919 GB
```

Google's Gemma 4 model card lists E2B as text/image/audio input with text output. Video understanding is handled as sampled frames, not native video generation.

The stable OpenClaw server remains text-only on port `8003`. Multimodal should be tested separately on port `8007`:

```powershell
npm run agent:gemma:multimodal
```

Expected capabilities are text output from text/image/audio/video-frame inputs. It is not image, video, or audio generation.

Local smoke test results:

```text
Image fixture: benchmarks/fixtures/multimodal-test.png
Prompt: Describe colors and shapes.
Result: The model identified a red circle and blue square.

Audio fixture: benchmarks/fixtures/multimodal-test.wav
Prompt: Transcribe original language.
Result: The model accepted WAV input and produced a Spanish transcription with minor wording error.
```

Run:

```powershell
npm run agent:gemma:multimodal
npm run agent:gemma:multimodal:test
```

Use the memory cell for:

```text
Session summaries
Task/date extraction
Study reminders
Context cleanup
Prompt-injection filtering
User-memory curation
Embedding/RAG preparation
```

## Next Steps

1. Keep OpenClaw primary agent on one llama.cpp server.
2. Continue manual intelligence/tool tests and collect failures in `logs/openclaw-agent/`.
3. Add a small reproducible OpenClaw tool-use test suite.
4. Investigate Gemma 4 E2B mobile/text-only runtime and download path separately from the GGUF setup.
5. Design the memory-cell pipeline before granting mail/calendar/filesystem automation.
6. Consider a smaller context mode for the background memory cell, e.g. `8192`, `16384`, or `32768`.

## Related Docs

```text
docs/OPENCLAW_LOCAL_AGENT.md
docs/PromptEngineering_LocalLLM.md
benchmarks/results/latest-summary.md
logs/openclaw-agent/
```
