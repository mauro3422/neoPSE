# Roadmap

## Principios

- Ir despacio.
- No generar de mas.
- Hacer una sola cosa por vez.
- No pasar a la siguiente fase sin validar la anterior.

## Fase 0: Definicion

Objetivo:

- dejar claro que problema resuelve NeoPSE
- fijar stack base
- fijar reglas de trabajo

Entregables:

- `README.md`
- `requirements.md`
- `roadmap.md`
- regla global de avance lento

## Fase 1: Base minima de la app

Objetivo:

- preparar la estructura minima de Tauri + TypeScript
- asegurar que la app abra sin funciones extra
- validar el MVP minimo antes de agregar cualquier modulo
- decidir si la UI inicial se resuelve con HTML/CSS puro o con una libreria liviana

Entregables:

- arranque de escritorio
- ventana principal
- configuracion minima
- lista cerrada de dependencias iniciales
- criterio de UI definido para no sobredimensionar la base

## Orden de dependencias

Cuando toque instalar, el orden sera este y no se agregara nada fuera de lista sin decision explicita:

1. `tauri`
2. `typescript`
3. `vite`
4. `@tauri-apps/api`
5. `react`, solo si la UI necesita escalar mas de lo razonable con HTML/CSS

## Fase 1.1: Modelo de diagramas y notas

Objetivo:

- definir como se representan nodos, conexiones, notas y contexto para IA
- decidir si el diagrama nace de un modelo propio o de una sintaxis intermedia
- fijar el layout visual del espacio de trabajo antes de implementar logica
- dejar listo el enfoque de tablero con bloques movibles

Entregables:

- modelo de datos de notas
- modelo de datos de nodos y conexiones
- criterio para layout de diagramas
- decision sobre si Markdown sirve solo como exportacion o lectura auxiliar
- sistema visual de alto nivel
- reglas de dimension y reordenamiento del tablero

## Regla para diagramas

- Primero modelo de datos.
- Despues render.
- Despues layout automatico si hace falta.
- No usar Markdown como motor central si limita el control del diagrama.

## Fase 2: Editor de pseudocodigo

Objetivo:

- tener un editor simple para escribir pseudocodigo
- validar entrada basica

Entregables:

- area de edicion
- estado local
- guardado simple

## Fase 3: Proyectos y persistencia

Objetivo:

- crear, abrir y guardar proyectos
- preservar el estado del trabajo

Entregables:

- proyecto local
- carga y guardado
- metadatos basicos

## Fase 4: Notas y contexto

Objetivo:

- permitir notas ligadas al proyecto
- dejar contexto util para pasos posteriores

Entregables:

- panel de notas
- vinculo con el proyecto actual

## Fase 5: Diagramas de flujo

Objetivo:

- representar el pseudocodigo visualmente

Entregables:

- generacion de diagrama
- vista previa
- actualizacion sincronizada con el editor

## Fase 6: IA local

Objetivo:

- integrar ayuda local sin depender de internet

Entregables:

- adaptador de modelo local
- sugerencias
- asistencia sobre pseudocodigo

## Fase 6.1: Métricas, Desacoplamiento y Modularidad (Iteraciones Actuales)

Objetivo:

- Robustecer la IA con persistencia de datos y separación de roles.

Entregables (Completados):
- **Base de Datos de Métricas (SQLite)**: Registro de latencia, éxito, RAM y uso de herramientas por test.
- **Desacoplamiento de Prompts**: Migración de plantillas a `prompts-ide.json`.
- **Separación de Roles**:
  - *Global Orchestrator*: Filosofía 'Divide y Vencerás', modularidad y carpetas.
  - *Inline Copilot*: Optimización local y micro-tutoría.

## Fase 6.2: Renombrado Dinámico (Smart Title Agent)

Objetivo:
- Permitir que los bloques genéricos cobren significado semántico automáticamente.

Checklist:
- [ ] **Trigger Lógico**: Capturar eventos `blur` / `debounce` tras modificar código.
- [ ] **Estructura de Prompt**: Plantilla especializada para títulos ultra-cortos (3-5 palabras).
- [ ] **Inferencia Silenciosa**: Ejecución asíncrona en segundo plano sin interrumpir la edición.
- [ ] **Micro-animación**: Transición estética al actualizar el título del bloque.

## Fase 6.3: Agente Background (Sintetizador de Estado)

Objetivo:
- Proveer asistencia predictiva basada en la topología total del canvas.

Checklist:
- [ ] **Daemon del Sistema**: Ticker de análisis reactivo con umbral de inactividad (cooldown).
- [ ] **Pipeline de Datos**: Alimentar al modelo usando `GraphParser` y `ContextPacker`.
- [ ] **Consola Flotante (HUD)**: Espacio no invasivo para mostrar sugerencias, errores preventivos y snippets sugeridos.
- [ ] **Acciones Rápidas**: Botón de "Aplicar Sugerencia" de un solo clic.

## Fase 7: Refinamiento

Objetivo:

- mejorar calidad, ergonomia y estabilidad

Entregables:

- ajustes de UX
- validaciones
- exportacion si se justifica

## Regla de avance

Antes de pasar de una fase a otra:

- validar el paso actual
- no agregar extras
- mantener el alcance acotado
- confirmar el siguiente modulo con el usuario
