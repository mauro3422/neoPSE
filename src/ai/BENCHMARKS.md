# NeoPSE AI Benchmarks

## Comandos

```powershell
npm run test:toolcall  # smoke test de Gemma tool calling
npm run test:ai        # suite corta Gemma + WR CPU
```

Tambien se puede levantar un perfil manualmente:

```powershell
npx tsx scripts/debugger-llm.ts server gemma
npx tsx scripts/debugger-llm.ts server wrCpu
```

## Pipeline

El runner principal es `scripts/debugger-llm.ts`.

Hace tres cosas:

1. Verifica si el puerto esperado ya tiene `/health`.
2. Si no hay server, restaura `D:\ai-runtime\llama-b9360` desde el zip de respaldo y levanta `llama.exe server`.
3. Ejecuta tests y guarda un resumen en SQLite.

Resultados y artefactos:

- `benchmarks/data/benchmarks.db`: historico SQLite local, ignorado por Git.
- `NEOPSE_BENCHMARK_DB`: variable opcional para redirigir la DB.
- `benchmarks/results/latest.json`: ultimo resultado plano local, ignorado por Git.
- `benchmarks/results/<timestamp>.json`: snapshots locales por corrida, ignorados por Git.
- `logs/`: logs locales de servidores/procesos, ignorados por Git.
- `prompt_benchmarks.json`: suite historica de 50 casos, no se actualiza en la suite corta.

## Suite corta actual

| Caso | Modelo | Objetivo |
| --- | --- | --- |
| `Gemma-PSeInt-Bisiesto` | Gemma | Generacion PSeInt reconocible |
| `Gemma-Inline-Editar` | Gemma | Edicion inline de `node-1` |
| `Gemma-Conversacional` | Gemma | Explicacion pedagogica |
| `ToolCall-Gemma` | Gemma | Tool calling nativo con `sumar` |
| `WR-Seguridad-Conceptual` | WR CPU | Explicacion conceptual de seguridad |

## Criterios

Texto normal:

- Debe ser parseable como JSON, igual que espera el flujo de `AIService`.
- No debe contener patrones de salida corrupta.
- Debe incluir keywords minimas por caso.
- Si emite `tool_use`, debe incluir `params`.

Tool calling:

- Debe llegar `tool_calls[]`.
- Debe coincidir el nombre de herramienta esperado.

## Estado validado

El 2026-06-04 se confirmo:

- Avast era quien ponia en cuarentena `llama.exe`, `llama-server.exe`, `bench.dat` y `start-ai-server.ps1`.
- Con Avast desactivado, `npm run test:toolcall` pasa.
- Gemma levanta en `127.0.0.1:8000` y genera una llamada real a `sumar({"a":15,"b":27})`.
- La suite completa llego a ejecutar modelos, pero no todo pasa: los fallos restantes son de formato/calidad (`invalid_json`), no de conexion.

## Limitaciones

- La suite corta es smoke test, no ranking de calidad.
- No ejecuta PSeInt ni valida semantica profunda.
- No simula el canvas real.
- WR CPU es lento y puede agotar el timeout si se amplia la suite.
- Exigir JSON para toda respuesta normal es deliberadamente estricto; sirve para detectar drift de contrato.

## Proximos ajustes recomendados

- Agregar schema por accion (`create_block`, `edit_block_content`, etc.).
- Separar tests de texto libre de tests JSON/tool-use.
- Agregar casos negativos donde no debe llamar herramientas.
- Crear una suite amplia versionada a partir de `scripts/scenarios.ts`.
