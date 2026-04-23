# Requirements

## Vision

NeoPSE sera una aplicacion de escritorio para pseudocodigo asistido por IA local, con foco en claridad, control y avance incremental.

## Alcance funcional

### 1. Editor de pseudocodigo

- Permitir crear y editar pseudocodigo.
- Mantener una experiencia simple y centrada en texto.
- Soportar guardado local de contenido.

### 2. Proyectos locales

- Crear y abrir proyectos locales.
- Guardar el estado del trabajo sin depender de la nube.

### 3. Notas y contexto

- Asociar notas al proyecto.
- Mantener contexto util para el usuario y para la IA.

### 4. Diagramas de flujo

- Derivar diagramas de flujo desde pseudocodigo o estructura equivalente.
- Mostrar una vista clara y legible.

### 5. IA local

- Integrar un proveedor local mas adelante.
- Permitir ayudas como sugerencias, explicaciones o conversiones.
- No asumir conexion externa como requisito base.

## Requisitos no funcionales

- Debe funcionar como app de escritorio.
- Debe priorizarse el trabajo offline.
- Debe ser facil de mantener.
- Debe evitarse la complejidad prematura.
- La arquitectura debe permitir crecer por modulos.

## Restricciones

- No crear carpetas ni estructura extra antes de tiempo.
- No sumar dependencias sin justificacion puntual.
- No implementar todo de golpe.
- No mezclar fases de definicion con fases de construccion.

## Fuera de alcance por ahora

- Synchronizacion en la nube
- Colaboracion multiusuario
- Plugins complejos
- IA remota como dependencia principal
- Exportaciones avanzadas

## Criterios de avance

Un paso solo se considera listo si:

- resuelve una necesidad concreta
- no abre mas alcance del pedido
- se puede revisar facilmente
- no obliga a rehacer la base

## MVP minimo

El primer MVP del proyecto debe incluir solo lo necesario para abrir la app y dejar preparada la base de trabajo:

- ventana de escritorio vacia
- stack `Tauri + TypeScript`
- UI base con `HTML + CSS` y estado minimo
- estructura minima para desarrollo local
- sin editor todavia
- sin IA todavia
- sin diagramas todavia
- sin persistencia compleja todavia

## Dependencias base previstas

Estas son las dependencias que se evaluaran primero, una por una y sin agregar extras:

- `tauri`
- `typescript`
- `vite`
- `@tauri-apps/api`
- `react` solo si se necesita para escalar la UI

## Estrategia de diagramas

La visualizacion de diagramas no debe depender primero de Markdown como motor principal.

Orden de evaluacion:

1. Modelo propio de nodos y conexiones.
2. Renderizado simple sobre grilla o canvas/SVG.
3. Layout automatico si se vuelve necesario.
4. Exportacion o compatibilidad con Markdown solo como apoyo, no como base.

## Estrategia de notas e IA

- Las notas deben ser una pieza propia del proyecto, no un texto suarse.
- Las notas deben poder ser leidas por la IA como contexto.
- Debe existir una vista tipo panel o tablero, no solo un archivo plano.
- El chat con IA debe convivir con notas y pseudocodigo en la misma pantalla o en un flujo muy cercano.

## Estrategia visual

- La aplicacion debe sentirse como un espacio de trabajo dividido en zonas y bloques.
- El editor de pseudocodigo es el centro.
- El chat de IA debe poder desplegarse, moverse y cambiar de ancho.
- Las notas deben ser visibles y reutilizables como contexto.
- La vista de diagrama debe acompanar la estructura, no reemplazar la escritura.
- El tablero debe soportar reorganizacion visual de los bloques.
