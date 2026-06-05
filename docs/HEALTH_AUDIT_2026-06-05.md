# NeoPSE Health Audit - 2026-06-05

Estado base antes de esta auditoria:

- Git estaba limpio y sincronizado.
- `npm run test:guardrails`: `12/12`.
- `npm run build`: OK.
- `npm run test:toolcall`: OK.
- `npm run test:ai:historical`: `50/50`, snapshot `25`.

Esta auditoria fue read-only sobre codigo y repo. No se hicieron arreglos funcionales durante la auditoria.

## Resumen ejecutivo

NeoPSE ya tiene estable el contrato IA principal, pero todavia hay deuda importante alrededor de seguridad de mutaciones, persistencia, legacy y portabilidad.

Prioridad recomendada para manana:

1. Cerrar rutas donde IA o UI pueden mutar canvas fuera del contrato seguro.
2. Arreglar fallos de runtime probables en carpetas/drag/menu contextual.
3. Limpiar legacy claramente roto o no conectado.
4. Ordenar docs y scripts para que haya una sola fuente de verdad.
5. Endurecer Tauri/DOM y preparar una suite minima de calidad.

## Riesgos altos

### 1. `tool_use` puede ejecutarse aunque el modo no sea `canvas_action_json`

Evidencia:

- `src/core/AIService.ts` parsea respuestas y puede ejecutar `parsed.toolUse`.
- `src/core/AIToolbox.ts` mantiene `parseAndExecute`.
- `src/components/AssistantBlock.ts` e `src/components/InlineAIPrompt.ts` vuelven a parsear/ejecutar respuestas.

Riesgo:

Una respuesta conversacional que accidentalmente incluya JSON/tool_use podria mutar el canvas aunque NeoPSE no haya habilitado una accion.

Accion recomendada:

- Ejecutar tools solo si `requiresCanvasJson === true`.
- Quitar o encapsular `AIToolbox.parseAndExecute`.
- Evitar que componentes UI vuelvan a ejecutar tool_use; la ejecucion debe vivir en `AIService`.

### 2. Inline AI no fuerza `params.blockId` al bloque actual

Evidencia:

- `src/core/AIResponseGuardrails.ts` bloquea acciones inline que no sean `edit_block_content`, pero no fuerza que `params.blockId` coincida con el bloque inline.
- `src/core/AIToolbox.ts` edita el ID recibido.

Riesgo:

Un prompt inline podria editar otro bloque por error del modelo.

Accion recomendada:

- En modo inline, sobrescribir siempre `params.blockId = blockId`.
- Agregar test unitario: si el modelo manda `blockId: node-2` desde inline de `node-1`, debe terminar editando `node-1` o bloquearse.

### 3. Carpetas pueden romper drag en runtime

Evidencia:

- `src/components/Block.ts` asigna `this.header = null as any` si no encuentra header.
- Luego usa `this.header.style`.
- Las carpetas se registran sin header en `src/core/BlocksRegistration.ts`.

Riesgo:

Arrastrar o inicializar carpetas podria romper por `null.style`.

Accion recomendada:

- Separar `dragHandle` de `header`.
- Agregar null-check.
- Probar manualmente crear carpeta, arrastrarla, meter bloques y sacarlos.

### 4. Dos sistemas de menu contextual compiten

Evidencia:

- `src/components/ContextMenu.ts` crea/remueve `.context-menu`.
- `src/core/ContextMenuManager.ts` reutiliza `.context-menu`.
- Ambos tienen acciones parecidas como eliminar.

Riesgo:

Handlers globales cruzados, opciones inconsistentes y bugs segun donde se haga click.

Accion recomendada:

- Elegir un unico sistema canonico.
- Migrar acciones a un registro comun.
- Si no se puede borrar ya, renombrar clases DOM para que no se pisen.

### 5. Links creados por AI pueden no persistirse

Evidencia:

- `src/core/AIToolbox.ts` usa `relationshipManager.addLink`.
- El flujo manual en `src/core/ConnectionManager.ts` tambien actualiza `workspaceState.addLink`.

Riesgo:

La IA puede crear un link visible que no queda guardado al recargar.

Accion recomendada:

- Crear un servicio unico `LinkService`/`WorkspaceCommandService`.
- Todas las rutas deben actualizar visual y estado persistente juntas.

### 6. Resolucion difusa de IDs puede tocar el bloque equivocado

Evidencia:

- `src/core/AIToolbox.ts` resuelve IDs por alias y fallback de contenido parcial.
- `delete_block` y `link_blocks` usan esa resolucion.

Riesgo:

Un alias inventado por el modelo podria borrar, editar o linkear un bloque incorrecto.

Accion recomendada:

- Para acciones destructivas y links, exigir ID exacto existente.
- Si no existe o hay ambiguedad, no mutar y pedir aclaracion.
- Mantener alias solo para casos no destructivos y con coincidencia unica.

## Seguridad y Tauri

### 7. Superficie Tauri/DOM demasiado permisiva

Evidencia:

- CSP desactivada en `src-tauri/tauri.conf.json`.
- `withGlobalTauri: true`.
- Permiso `opener:default`.
- Uso de `innerHTML` con datos dinamicos en varios puntos, incluyendo debugger, background suggestions y chat/context UI.

Riesgo:

XSS local dentro del WebView y APIs nativas expuestas de mas.

Accion recomendada:

- Activar CSP estricta.
- Eliminar `withGlobalTauri` si no es necesario.
- Revisar/remover `opener:default`.
- Reemplazar `innerHTML` dinamico por nodos DOM y `textContent`.

### 8. Acciones destructivas de IA necesitan friccion UI

Evidencia:

- `clear_workspace` elimina todos los bloques.
- `delete_block` borra directo.

Riesgo:

Aunque hay guardrails, una mutacion destructiva deberia tener confirmacion o undo.

Accion recomendada:

- Confirmacion UI para `clear_workspace` y deletes ambiguos.
- Undo real antes de habilitar acciones destructivas sin friccion.

## Legacy, duplicados y limpieza

### 9. Cliente LLM legacy roto/no usado

Evidencia:

- `src/ai/llm/client/analysis/analyzer.js` y `batch.js` importan `../../../../utils/logger.js`.
- Ese logger no existe.
- El arbol parece duplicar `src/core/AIService.ts`.

Riesgo:

Si alguien consume `src/ai/llm-client.js`, falla en runtime.

Accion recomendada:

- Decidir: reparar, mover a `legacy/`, o eliminar.
- Si `AIService` es canonico, documentarlo y retirar el cliente viejo.

### 10. Dos generaciones de runtime AI conviven

Evidencia:

- Runtime actual: `src/ai/scripts/start-ai-server.ps1`.
- Scripts viejos `.bat`: `brain_gpu.bat`, `start_brain_gpu.bat`, `start_brain_gpu_instruct.bat`.
- Algunos usan `src/ai/server/llama-server.exe`; otros usan `D:\ai-runtime\llama-b9360`.

Riesgo:

Levantar modelo, puerto o binario equivocado.

Accion recomendada:

- Mantener un launcher canonico.
- Mover wrappers viejos a `legacy/` o hacer que deleguen al `.ps1`.

### 11. Base SQLite historica versionada y duplicada

Evidencia:

- Runtime actual usa `benchmarks/data/benchmarks.db`, ignorado por Git.
- Existe `src/ai/data/benchmarks.db` versionado con pocos snapshots.

Riesgo:

Fuente de verdad confusa.

Accion recomendada:

- Si no es fixture, remover del tracking.
- Dejar benchmarks vivos solo en `benchmarks/data/`, ignorado.

### 12. Reporte generado versionado con datos invalidos

Evidencia:

- `stress_test_report.md` contiene respuestas `undefined` y tiempos `0ms`.

Riesgo:

Documento parece resultado valido pero no lo es.

Accion recomendada:

- Mover a `benchmarks/results/` o `logs/`, o regenerarlo como documento curado.

### 13. Basura local grande en `.git`

Evidencia:

- `git count-objects -vH` reporto `size-garbage: 795.05 MiB`.
- Archivo local: `.git/objects/8d/tmp_obj_0O3phH`, aproximadamente 833 MB.

Riesgo:

Repo local pesado, backups/copias lentas.

Accion recomendada:

- Cuando no haya procesos Git activos, correr limpieza controlada:

```powershell
git gc --prune=now
```

No hace falta commitear nada para esto; es limpieza local.

## Arquitectura y mantenibilidad

### 14. `Block`, `DragManager` y `main.ts` son demasiado grandes en responsabilidades

Evidencia:

- `Block` mezcla UI, destruccion, estado, relaciones y reglas de carpeta.
- `DragManager` maneja gesto, geometria, suction/folder logic, estado y DOM.
- `main.ts` inicializa casi todo el workspace.

Riesgo:

Dificil testear y dificil cambiar una parte sin romper otra.

Accion recomendada:

- Extraer servicios chicos:
  - `BlockSpawner`
  - `FolderContainmentService`
  - `WorkspaceCommandService`
  - `PersistenceCoordinator`
  - `DebugPanelController`

### 15. Undo/redo existe pero no esta integrado

Evidencia:

- Hay atajos para undo/redo.
- `CommandManager` no parece ser usado por las operaciones reales.

Riesgo:

UX promete una capacidad que no existe y las acciones destructivas quedan sin red.

Accion recomendada:

- O desactivar atajos hasta implementar comandos reales.
- O migrar crear/mover/eliminar/link a comandos.

### 16. Persistencia local sin version ni validacion

Evidencia:

- `WorkspaceState` usa `localStorage` directo.
- Parse sin schema.
- `getData()` devuelve referencia mutable interna.

Riesgo:

Corrupcion silenciosa y migraciones dificiles.

Accion recomendada:

- Versionar schema.
- Validar al cargar.
- Devolver snapshots inmutables.
- Pensar storage Tauri/archivo para proyectos reales.

## Portabilidad y scripts

### 17. Rutas absolutas machine-specific

Evidencia:

- `D:\ai-runtime\llama-b9360`.
- `D:\ai-models`.
- `Modelfile` apunta a `C:\Users\mauro\.lmstudio\...`.

Riesgo:

Onboarding y CI fragiles.

Accion recomendada:

- `.env.example` o config local ignorada.
- Preflight que explique que falta y como configurarlo.
- Separar `dev` frontend de `dev:full` con AI.

### 18. Falta suite estandar de calidad/CI

Evidencia:

- Hay build y tests AI, pero no scripts canonicos tipo `typecheck`, `check`, `lint`, `cargo check`.

Accion recomendada:

- Agregar:

```json
"typecheck": "tsc --noEmit",
"check": "npm run typecheck && npm run test:guardrails",
"tauri:check": "cd src-tauri && cargo check"
```

- Luego sumar CI basico.

### 19. Dependencias posiblemente innecesarias en runtime

Evidencia:

- `better-sqlite3` se usa para benchmarks/metricas, no necesariamente para la app.
- `@tauri-apps/api`, `@tauri-apps/plugin-opener`, `serde`, `serde_json` parecen poco usados o no usados.

Accion recomendada:

- Revisar antes de quitar.
- Separar dependencias de benchmark si empaquetado se vuelve fragil.

## Documentacion desalineada

### 20. Docs AI viejas contradicen estado actual

Evidencia:

- `src/ai/README.md` y `src/ai/FINDINGS.md` todavia dicen no usar `response_format`.
- Estado actual: usar `json_object` solo para `canvas_action_json` y repair.
- `src/ai/BENCHMARKS.md` menciona fallas antiguas y criterios viejos.

Accion recomendada:

- Actualizar docs AI.
- Marcar documentos historicos como historicos.
- Dejar `src/ai/AI_STATUS_SUMMARY.md` como fuente canonica del estado actual.

### 21. Roadmaps duplicados y README con mojibake

Evidencia:

- `roadmap.md` y `docs/ROADMAP.md`.
- `README.md` tiene texto mojibake visible.

Accion recomendada:

- Elegir roadmap canonico.
- Corregir encoding/README.

## Plan recomendado para manana

### Bloque 1 - Seguridad del contrato AI

Objetivo: que nada ejecute herramientas fuera del modo permitido.

1. Ejecutar tools solo si `requiresCanvasJson`.
2. Quitar doble parseo en componentes.
3. Forzar `blockId` inline.
4. Tests nuevos para esos casos.

Validar:

```powershell
npm run test:guardrails
npm run build
npm run test:ai
```

### Bloque 2 - Persistencia y runtime de canvas

Objetivo: evitar bugs visibles al probar manualmente.

1. Fix de drag/header en carpetas.
2. Unificar o aislar menus contextuales.
3. Persistir links AI igual que links manuales.

Validar manualmente:

- Crear carpeta.
- Arrastrar carpeta.
- Meter/sacar bloques.
- Crear link manual.
- Crear link con IA.
- Recargar y verificar persistencia.

### Bloque 3 - Limpieza de legacy

Objetivo: bajar ruido y evitar rutas rotas.

1. Decidir destino de `src/ai/llm/client`.
2. Mover/remover DB vieja `src/ai/data/benchmarks.db`.
3. Mover/remover `stress_test_report.md`.
4. Ordenar scripts `.bat` legacy.

Validar:

```powershell
npm run build
npm run test:guardrails
git status --short
```

### Bloque 4 - Docs y portabilidad

Objetivo: una sola fuente de verdad.

1. Actualizar `src/ai/README.md`, `FINDINGS.md`, `BENCHMARKS.md`.
2. Crear `.env.example` para runtime/modelos.
3. Separar `dev` frontend de `dev:full`.

## Decision sugerida

No seguir agregando features hasta resolver primero:

1. ejecucion de tools solo bajo contrato,
2. inline blockId,
3. carpetas/drag,
4. persistencia de links AI,
5. limpieza de legacy roto.

Con eso, NeoPSE queda mucho mas confiable para la prueba manual de manana.
