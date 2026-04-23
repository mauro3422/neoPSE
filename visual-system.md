# Visual System

## Intencion

NeoPSE no debe verse como un editor de texto puro ni como un chat puro. Debe ser un espacio de trabajo hibrido donde el pseudocodigo, las notas, el contexto y la asistencia de IA convivan sin pelearse.

## Idea central

- El usuario escribe pseudocodigo libremente.
- Ese texto puede incluir estructura, ejemplos, arrays, funciones, bloques o idioma mixto.
- El sistema no obliga una sintaxis unica al inicio.
- La IA interpreta contexto y devuelve ayuda, explicacion o refinamiento.
- El contenido estructurado vive en paralelo al texto libre, no lo reemplaza.

## Enfoque: tablero con bloques

NeoPSE se va a pensar como un tablero flexible con bloques movibles.

Eso significa:

- cada bloque representa una pieza de trabajo
- los bloques se pueden organizar visualmente en el espacio
- el usuario puede agrandar, achicar y mover zonas segun necesidad
- el layout no queda clavado a una pantalla estatica
- el estilo permite evolucionar hacia temas visuales distintos sin cambiar la base

Este enfoque sirve como guino a PSeInt, pero con mas libertad para mezclar pseudocodigo, notas, ayuda de IA y diagramas en un mismo espacio.

## Modelo visual general

### Zonas principales

- Editor principal de pseudocodigo
- Panel de notas / bloques de contexto
- Panel de IA / chat
- Vista de diagrama o estructura
- Barra superior de proyecto y acciones

### Distribucion sugerida

```text
┌──────────────────────────────────────────────────────────────┐
│ Barra superior: proyecto | guardar | ejecutar | vista        │
├──────────────────────────────┬───────────────────────────────┤
│ Editor de pseudocodigo       │ Panel IA / Chat               │
│                              │                               │
│                              ├───────────────────────────────┤
│                              │ Panel de notas / contexto     │
├──────────────────────────────┴───────────────────────────────┤
│ Vista de diagrama / estructura / relaciones                  │
└──────────────────────────────────────────────────────────────┘
```

## Principios visuales

- Prioridad al texto.
- Control por bloques.
- Baja friccion para escribir.
- La estructura aparece como apoyo, no como obstaculo.
- La IA debe sentirse al lado del trabajo, no encima del trabajo.
- El tablero debe poder reordenarse por modulos o por contexto.
- La interfaz debe aceptar temas visuales alrededor del mismo modelo de bloques.

## Bloques de contenido

### Pseudocodigo

- Texto libre.
- Puede tener mezcla de idiomas.
- Puede contener estructuras como arrays, funciones o secciones de ejemplo.
- No se valida agresivamente en la primera etapa.

### Notas

- Texto libre por ahora.
- Sirven como contexto para la IA.
- Pueden resumir intencion, errores comunes, pasos o ideas.
- Mas adelante pueden evolucionar a tarjetas con titulo, cuerpo y metadatos.

### Estructura interna

- Cada bloque puede representar una funcion, una idea, un archivo mental o una seccion logica.
- Esa estructura no obliga a carpeta real al inicio.
- Puede evolucionar hacia nodos, tarjetas o grafo.

### Chat de IA

- Responde sobre el bloque activo.
- Puede explicar, resumir, refactorizar o sugerir.
- No sustituye el editor.
- Debe poder desplegarse, moverse y cambiar de ancho.

### Diagrama

- Representacion visual derivada del contenido.
- Nace del modelo propio de datos.
- Puede empezar como vista simple de nodos y conexiones.

## Comportamiento esperado

1. El usuario escribe pseudocodigo o notas.
2. El sistema detecta contexto util.
3. La IA usa ese contexto para responder mejor.
4. El usuario puede aceptar sugerencias o mantener todo como texto libre.
5. La vista de diagrama refleja la estructura si existe.

## Sobre Markdown

- Markdown puede servir como apoyo.
- Markdown no debe ser el motor central del diagrama.
- Si ayuda a editar o exportar, se puede usar como capa secundaria.

## Sobre regex y parseo

- Al inicio no se mete logica compleja.
- Mas adelante puede haber regex, parseo parcial o un mini analizador.
- Primero se define la forma visual y el modelo de datos.
- Despues se define cuanto se puede inferir automaticamente.

## Sobre bloques movibles

- Los bloques deben poder representar secciones del proyecto.
- Un bloque puede ser pseudocodigo, nota, resultado de IA o estructura de diagrama.
- El tablero debe permitir que cada bloque tenga tamano y presencia propios.
- El sistema debe ser flexible para que los temas futuros no rompan la organizacion.

## Regla de diseno

- Si algo puede resolverse con una estructura simple, se elige eso.
- Si una vista se vuelve pesada, se divide en paneles o modos.
- Si una sintaxis unificada estorba, se conserva flexibilidad.
