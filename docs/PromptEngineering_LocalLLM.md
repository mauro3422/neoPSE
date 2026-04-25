# Guía de Ingeniería de Prompts para Modelos Locales (DeepSeek R1 / CoT)
*NeoPSE Architecture & Deployment Documentation*

## 🧠 Naturaleza del Modelo (Razonamiento Nativo)
Modelos como **DeepSeek R1** operan mediante el paradigma de "Chain-of-Thought" (Cadena de Pensamiento). A diferencia de los modelos tradicionales (como GPT-4 estándar o Claude), estos modelos **piensan antes de responder** y devuelven su proceso lógico dentro de etiquetas `<think>...</think>`.

### 🚨 Reglas de Oro para Prompts de Razonamiento
1. **NO obligues a razonar:** Evita frases como *"Piensa paso a paso"* o *"Razona lógicamente"*. El modelo ya lo hace por defecto. Forzarlo puede quebrar su lógica interna o generar bucles infinitos.
2. **Evita el Few-Shot (Pocos ejemplos):** Darle ejemplos de "pregunta/respuesta" suele degradar su capacidad deductiva nativa. Es mejor usar **Zero-shot** (instrucciones directas sin ejemplos previos).
3. **Mantén el Prompt Simple:** Especifica la tarea, las restricciones y el formato de salida con claridad. Los prompts extremadamente largos y adornados los confunden.
4. **Delimitadores Claros:** Utiliza etiquetas XML (ej: `<contexto></contexto>`, `<codigo></codigo>`) para estructurar los bloques de datos y separarlos de las instrucciones.

---

## 🛠️ Parámetros de Configuración Recomendados
Para evitar que el modelo alucine o repita texto en bucle al trabajar de manera local (Ollama, LM Studio):
*   **Temperatura:** `0.6` (El punto dulce entre creatividad y coherencia).
*   **Top-P:** `0.95`

---

## 🐞 Casos Típicos de Error y Solución (Debugging)

### 1. El modelo ignora su razonamiento (No usa `<think>`)
*   **Causa:** El software cliente o el System Prompt bloquea el inicio del pensamiento.
*   **Solución:** Puedes "forzarlo" pre-inyectando la etiqueta `<think>\n` al comienzo de la respuesta de la IA.

### 2. "Ruido" en la Interfaz (Texto de Razonamiento expuesto)
*   **Solución NeoPSE:** Hemos implementado soporte regex y componentes `<details>` en la interfaz para capturar el texto entre `<think>` y guardarlo en una caja colapsable de "Razonamiento" para mantener el chat limpio.

### 3. La IA no sigue restricciones de rol
*   **Solución:** Dado que a los modelos R1 no les gustan los `System Prompts` aislados, inyecta las reglas de comportamiento (ej: *"Eres un arquitecto de software"*) directamente al inicio de la consulta del usuario (`User Message`).
