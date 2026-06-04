# NeoPSE AI Findings

Actualizado: 2026-06-04

## Runtime

- `llama.cpp b7306` no sirve para Gemma 4: falla con `unknown model architecture: gemma4`.
- `llama.cpp b9360` carga Gemma 4 y soporta tool calling.
- El runtime estable queda fuera del repo en `D:\ai-runtime\llama-b9360`.
- El zip de respaldo queda en `%TEMP%\neopse-llama-b9360\llama-b9360-bin-win-vulkan-x64.zip`.
- Avast puso en cuarentena los launchers durante las pruebas. Al desactivarlo/restaurar los archivos, el server HTTP funciono.

## Modelos

| Modelo | Archivo | Estado |
| --- | --- | --- |
| Gemma 4 E2B Q4_K_M | `D:\ai-models\google_gemma-4-E2B-it-Q4_K_M.gguf` | Default, tool calling validado |
| WhiteRabbitNeo 2.5 Q4_K_M | `D:\ai-models\WhiteRabbitNeo-2.5-Qwen-2.5-Coder-7B-Q4_K_M.gguf` | Perfil WR CPU/GPU |
| Liquid Thinking Q4_K_M | `D:\ai-models\LFM2.5-1.2B-Thinking-Q4_K_M.gguf` | Experimental |

## Flags validadas

Base:

```text
--ctx-size 8192
--parallel 1
-cb
--temp 0.2
--reasoning off
--reasoning-budget 0
--cache-type-k q8_0
--cache-type-v q8_0
--cache-ram 0
```

Gemma GPU:

```text
--n-gpu-layers 99
-fa auto
```

WR CPU:

```text
--n-gpu-layers 0
--threads 6
```

No usar:

- `--chat-template` con Gemma 4.
- `--no-display-prompt` en b9360.
- TurboQuant/Turbo cache flags para Gemma 4.
- `response_format: { type: "json_object" }` hasta revalidarlo con prompts chicos.

## Tool Calling

Gemma 4 E2B produce `tool_calls[]` real via API OpenAI-compatible.

Prueba validada:

```powershell
npm run test:toolcall
```

Resultado:

```json
{
  "name": "sumar",
  "arguments": "{\"a\":15,\"b\":27}"
}
```

## Benchmark corto

La suite corta ya llega a ejecutar Gemma y WR. El bloqueo restante no es runtime sino contrato de salida:

- Gemma tool call pasa.
- Algunas respuestas textuales fallan por `invalid_json`.
- WR CPU puede fallar por formato o keywords.

Esto sugiere que el siguiente trabajo debe enfocarse en PromptBuilder/evaluador, no en binarios.

## TheStage edge-lm

TheStageAI publico modelos Gemma 4 comprimidos para `edge-lm`.

Decision actual:

- No migrar NeoPSE todavia.
- No es GGUF ni `llama.cpp` directo.
- Requiere MLX/Apple Silicon y loader propio.
- Si aparece un GGUF compatible, probar primero `test:toolcall` y la suite corta.

Fuentes:

- https://github.com/TheStageAI/edge-lm
- https://app.thestage.ai/blog/7x-size-reduction-for-Gemma4-Edge-models?id=14
