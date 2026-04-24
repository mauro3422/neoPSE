# Decisiones Arquitectónicas (NeoPSE)

## 1. GeometricEngine (Single Source of Truth)
**Problema**: Cálculos de coordenadas dispersos y discrepancias en zoom/pan.
**Solución**: Se centraliza toda la matemática en `GeometricEngine`. Ningún componente debe calcular `getBoundingClientRect` manualmente para lógica de negocio; debe usar el motor.

## 2. FrameTicker (Performance)
**Problema**: Múltiples `requestAnimationFrame` compitiendo y causando jitter.
**Solución**: Un solo latido global en `FrameTicker`. Las animaciones se registran y desregistran, garantizando que todo se dibuje en el mismo ciclo.

## 3. Physics vs Visuals
**Problema**: Las animaciones eran meramente estéticas y difíciles de coordinar con los cables.
**Solución**: Separación de `PhysicsEngine` (cálculo de trayectoria) de `AnimationManager` (aplicación de estilos). Esto permite que los cables sigan posiciones "reales" calculadas por la física.

## 4. Staggered Parallel Suction (The Noodle Effect)
**Problema**: La succión secuencial se sentía estática y falsa.
**Solución**: Implementación de una onda de succión con retrasos mínimos (60ms) que permite que todos los bloques se muevan simultáneamente pero en orden, simulando tensión en los enlaces.

## 5. Persistence SRP
**Problema**: `localStorage` invadía la lógica de los controladores.
**Solución**: `StorageManager` centraliza el guardado, permitiendo cambiar la estrategia de persistencia (ej. a una DB) sin tocar los bloques.
