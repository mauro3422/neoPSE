# NeoPSE

NeoPSE es una evolucion local-first del flujo de PSeInt, pensada para escribir pseudocodigo, generar diagramas de flujo, agregar notas y asistir con IA local sin perder el valor pedagogico del pseudocodigo.

## Estado actual

- Proyecto en fase de definicion.
- Stack elegido: `Tauri + TypeScript`.
- No se crean carpetas ni modulos aun.
- El trabajo avanza por pasos pequenos y controlados.

## Objetivo

Construir una aplicacion de escritorio para:

- escribir pseudocodigo de forma simple
- visualizar diagramas de flujo
- guardar notas y contexto del proyecto
- integrar IA local mas adelante
- mantener el pseudocodigo como pieza central

## Regla general del proyecto

- Ir despacio.
- No generar de mas.
- No agregar dependencias, carpetas ni modulos fuera del paso pedido.
- Cada etapa debe ser pequena, verificable y reversible.

## Stack base

- `Tauri` para escritorio
- `TypeScript` para la capa principal
- `CSS` para el control visual
- `React` solo si la complejidad de UI lo justifica mas adelante
- `Rust` solo si mas adelante hace falta en el nucleo

## Criterio de UI

- Arrancar con la capa mas simple posible.
- No meter framework de UI por costumbre.
- Si el problema se resuelve bien con TypeScript, HTML y CSS, se queda asi.
- Si la cantidad de vistas y estado crece, reevaluar `React` o una alternativa liviana.

## Flujo de trabajo

1. Definir el alcance minimo.
2. Escribir requisitos.
3. Ejecutar una etapa pequena.
4. Verificar.
5. Recien despues pasar al siguiente modulo.

## Documentos del proyecto

- `requirements.md`
- `roadmap.md`
- `visual-system.md`

## Nota

Este proyecto todavia no entra en fase de implementacion. Primero se fija la base de trabajo.
