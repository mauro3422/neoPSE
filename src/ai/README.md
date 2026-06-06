# NeoPSE AI Runtime

NeoPSE usa modelos locales GGUF servidos por `llama.cpp` con API compatible con OpenAI.

## Runtime actual

- Runtime: `D:\ai-runtime\llama-b9360`
- Binario principal: `D:\ai-runtime\llama-b9360\llama.exe server`
- Zip de respaldo: `%TEMP%\neopse-llama-b9360\llama-b9360-bin-win-vulkan-x64.zip`
- Launcher del proyecto: `src/ai/scripts/start-ai-server.ps1`

El script restaura el runtime desde el zip si `llama.exe` falta. Esto fue necesario porque Avast puso en cuarentena `llama.exe`, `llama-server.exe` y launchers temporales durante las pruebas.

## Modelos

Los modelos viven fuera del repo:

| Perfil | Archivo | Puerto | Uso |
| --- | --- | --- | --- |
| Gemma | `D:\ai-models\google_gemma-4-E2B-it-Q4_K_M.gguf` | 8000 | Default, PSeInt, tool calling |
| Gemma QAT | `D:\ai-models\gemma-4-E2B_q4_0-it.gguf` | 8003 | Candidato oficial QAT, comparacion A/B |
| Gemma E4 QAT | `D:\ai-models\gemma-4-E4B_q4_0-it.gguf` | 8004 | Preparado para prueba futura |
| Gemma 12B QAT | `D:\ai-models\gemma-4-12b-it-qat-q4_0.gguf` | 8005 | Preparado para modo calidad futuro |
| WhiteRabbitNeo | `D:\ai-models\WhiteRabbitNeo-2.5-Qwen-2.5-Coder-7B-Q4_K_M.gguf` | 8001 | Seguridad/conversacional en CPU |
| Liquid | `D:\ai-models\LFM2.5-1.2B-Thinking-Q4_K_M.gguf` | 8002 | Perfil experimental |

## Comandos

```powershell
npm run dev       # Vite + Gemma
npm run dev:ai    # Gemma en 127.0.0.1:8000
npm run dev:wr    # WhiteRabbitNeo en 127.0.0.1:8001

npm run test:toolcall
npm run test:ai
npm run test:ai:historical
npm run test:ai:compare -- --profiles gemma,gemmaQat
```

## Flags actuales

Gemma y WR se levantan con:

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

Gemma agrega:

```text
--n-gpu-layers 99
-fa auto
```

WR CPU agrega:

```text
--n-gpu-layers 0
--threads 6
```

Notas:

- No usar `--chat-template` con Gemma 4; el GGUF trae template nativo `peg-gemma4`.
- No usar `response_format: { type: "json_object" }` en el cliente por ahora; con Gemma 4 + llama-server fue inestable en pruebas anteriores.
- `-cb` esta validado con `npm run test:toolcall`.
- `--no-display-prompt` ya no existe en b9360.

## Gemma 4 QAT

Google publico checkpoints QAT oficiales de Gemma 4 en GGUF. NeoPSE ya tiene preparado el perfil `gemmaQat` para comparar el reemplazo equivalente del default actual:

- Baseline: `google_gemma-4-E2B-it-Q4_K_M.gguf`
- QAT oficial: `gemma-4-E2B_q4_0-it.gguf`

Resultado local del 2026-06-06 en RX 570/Vulkan, contexto 8192:

| Perfil | Pass | Avg ms | P95 ms | Avg tok/s | Invalid JSON |
| --- | ---: | ---: | ---: | ---: | ---: |
| `gemma` | 50/50 | 15249 | 34795 | 12.11 | 0 |
| `gemmaQat` | 50/50 | 16510 | 38392 | 12.09 | 0 |

Conclusion actual: `gemmaQat` es compatible y oficial, pero no desplaza al default todavia. En esta maquina empato en calidad y quedo apenas mas lento en latencia total. Mantener `gemma` como default y usar `gemmaQat` como candidato reproducible para pruebas nuevas.

## Tool Calling

Gemma 4 E2B funciona con tool calling nativo via `/v1/chat/completions`.

Validado con:

```powershell
npm run test:toolcall
```

Resultado esperado: respuesta con `tool_calls[]`, herramienta `sumar` y argumentos `{"a":15,"b":27}`.

## TheStage edge-lm

TheStageAI publico variantes comprimidas de Gemma 4 E2B/E4B usando `edge-lm`, MLX y `safetensors`.

Decision actual: no migrar. NeoPSE corre Windows + RX 570/Vulkan + GGUF/llama.cpp. `edge-lm` no expone un reemplazo GGUF/OpenAI-compatible directo para este stack. Si aparece un GGUF compatible, primero debe pasar `npm run test:toolcall` y la suite de benchmarks de NeoPSE.

Fuentes:

- https://github.com/TheStageAI/edge-lm
- https://app.thestage.ai/blog/7x-size-reduction-for-Gemma4-Edge-models?id=14

## Mas detalles

Ver:

- `src/ai/BENCHMARKS.md`
- `src/ai/FINDINGS.md`
