# NeoPSE AI status summary

Last updated: 2026-06-05

## Current state

The local AI stack is stable again. The llama.cpp runtime launches, Gemma can answer through the OpenAI-compatible server, native tool calling works, and the app build passes.

The important architectural fix was separating output contracts:

- `assistant_text`: normal chat, explanations, tutoring, summaries, and cases that need more context.
- `canvas_action_json`: strict JSON for canvas/workspace actions such as create, edit, connect, delete, clear, save, rename, or layout.
- `native_tool_call`: OpenAI-style tool calls supported by the local llama.cpp server.

NeoPSE should not require JSON for every assistant response. JSON is required only when the user is asking for an actual canvas/workspace action.

The current prompt strategy keeps a lightweight tool catalog visible as context, but only exposes executable JSON schemas when NeoPSE has enabled canvas-action mode. This avoids overloading small local models while still letting them understand what the workspace can do.

## Runtime and models

Runtime:

- llama.cpp b9360 runtime at `D:\ai-runtime\llama-b9360`
- server binary: `llama.exe` / `llama-server.exe`
- launcher script: `src/ai/scripts/start-ai-server.ps1`

Models currently used:

- Gemma: `D:\ai-models\google_gemma-4-E2B-it-Q4_K_M.gguf`
- WhiteRabbitNeo: `D:\ai-models\WhiteRabbitNeo-2.5-Qwen-2.5-Coder-7B-Q4_K_M.gguf`
- Liquid: `D:\ai-models\LFM2.5-1.2B-Thinking-Q4_K_M.gguf`

Ports:

- Gemma GPU: `8000`
- WhiteRabbitNeo: `8001`
- Liquid: `8002`

## Validation results

Smoke suite:

- Command: `npm run test:ai`
- Last known result: `5/5`
- Latest snapshot: `24`

Guardrail unit tests:

- Command: `npm run test:guardrails`
- Last known result: `12/12`

Native tool calling:

- Command: `npm run test:toolcall`
- Gemma successfully called the `sumar` tool with arguments `15` and `27`.

Historical suite:

- Command: `npm run test:ai:historical`
- Last full Gemma run: `50/50`
- Latest snapshot: `23`
- Average duration: `14897ms`
- Result files are written to `benchmarks/results/latest.json`.
- SQLite snapshots are stored under `benchmarks/data/benchmarks.db`.

The historical suite can be sliced:

```powershell
npx tsx scripts\debugger-llm.ts historical --from 16 --limit 15 --profile gemma
```

## What improved

- The benchmark no longer marks plain text as `invalid_json`.
- Historical scenarios are classified by expected output contract.
- The runner supports `--from`, `--limit`, and `--profile`.
- Accent-insensitive keyword matching avoids false negatives such as unaccented vs accented Spanish terms.
- `AIService` now enables `response_format: { type: "json_object" }` only for expected canvas actions.
- `AIService` validates tool use before execution.
- `PromptBuilder` separates lightweight tool awareness from executable tool schemas.
- `AIService` and the benchmark runner now perform a structured repair pass when canvas-action JSON is malformed or incomplete.
- Guardrails are covered by a small local unit test script that does not require starting the AI runtime.

## Current guardrails

Before executing a tool, `AIService` now blocks or rewrites unsafe/ambiguous actions:

- Blocks placeholder blocks such as "esperando especificacion" or "waiting for user".
- Blocks `clear_workspace` or `delete_block` when the user only said cancel.
- Requires explicit destructive language before clearing or deleting.
- Forces inline interactions to edit the current block instead of creating new blocks.
- Blocks incomplete `Para ... Hacer` inline edits if they omit `FinPara`.

These guardrails are production-facing. They protect the app even when the model emits an over-eager `tool_use`.

## Remaining known edge cases

The latest full historical benchmark did not find remaining failures.

The previously failing cases now pass:

- `H36-Extraer-Modulo`: handled as plain text when the user has not provided enough extraction detail.
- `H49-Cancelar-Generacion`: handled as cancellation text, not `clear_workspace`.
- `H27-Busqueda-Lineal`: protected by the structured repair pass when Gemma emits malformed JSON.
- `H33-Validacion-Entradas`: reclassified as plain text because the request lacks enough validation detail to force a canvas mutation.

Because Gemma E2B is small and quantized, occasional stochastic JSON issues are still possible. Runtime guardrails and the repair pass are meant to prevent those from causing bad workspace mutations.

## Recommended next steps

1. Add unit tests for the `AIService` tool-use validator and repair path.
2. Compare Gemma against WhiteRabbitNeo on the same historical suite.
3. Add a small dashboard/report command that summarizes latest benchmark failures by flag.
4. Consider native tool calling for internal canvas actions once schemas are stable.

## Useful commands

```powershell
npm run build
npm run test:guardrails
npm run test:toolcall
npm run test:ai
npm run test:ai:historical
npx tsx scripts\debugger-llm.ts historical --from 36 --limit 15 --profile gemma
```
