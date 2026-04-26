export interface TestCase {
  q: string;
  type: 'assistant' | 'inline';
  category: 'logic' | 'syntax' | 'conversational';
}

export const SCENARIOS: TestCase[] = [
  // GRUPO A: Conversacional Puro (1-15)
  { q: "Hola, ¿cómo estás?", type: "assistant", category: "conversational" },
  { q: "¿Qué es un bucle?", type: "assistant", category: "conversational" },
  { q: "¿Cuál es la diferencia entre un bucle Mientras y un bucle Para?", type: "assistant", category: "conversational" },
  { q: "No entiendo nada de programación, ¿me ayudas?", type: "assistant", category: "conversational" },
  { q: "¿De qué color es el cielo?", type: "assistant", category: "conversational" },
  { q: "Quiero una metáfora para entender qué es una Pila (Stack).", type: "assistant", category: "conversational" },
  { q: "¿Por qué usamos pseudocódigo en lugar de código real?", type: "assistant", category: "conversational" },
  { q: "¿Qué lenguajes puedo exportar desde aquí?", type: "assistant", category: "conversational" },
  { q: "Explícame qué significa la complejidad algorítmica O(N).", type: "assistant", category: "conversational" },
  { q: "¿Para qué sirve la palabra clave Definir?", type: "assistant", category: "conversational" },
  { q: "Dame consejos sobre cómo depurar código manualmente.", type: "assistant", category: "conversational" },
  { q: "¿Te gusta la música?", type: "assistant", category: "conversational" },
  { q: "Hazme un resumen de lo que llevo aprendido.", type: "assistant", category: "conversational" },
  { q: "¡Adiós, gracias por todo!", type: "assistant", category: "conversational" },
  { q: "¿Qué es una función recursiva?", type: "assistant", category: "conversational" },

  // GRUPO B: Lógica y Lienzo (16-30)
  { q: "Crea un bloque de pseudocódigo que calcule el área de un círculo pidiéndole el radio al usuario.", type: "assistant", category: "logic" },
  { q: "Modifica el bloque node-1 para cambiar el valor inicial a 100.", type: "inline", category: "syntax" },
  { q: "Conecta el bloque node-1 con el bloque node-2 mediante un enlace directo.", type: "assistant", category: "logic" },
  { q: "Limpia el espacio de trabajo eliminando todos los bloques existentes.", type: "assistant", category: "logic" },
  { q: "Diseña una matriz bidimensional 3x3 para un juego de Tres en Línea (Tic-Tac-Toe).", type: "assistant", category: "logic" },
  { q: "Escribe un algoritmo de ordenamiento por inserción (Insertion Sort) en PSeInt.", type: "assistant", category: "logic" },
  { q: "Crea un menú interactivo con opciones: 1. Sumar, 2. Restar, 3. Salir usando un bucle Repetir.", type: "assistant", category: "syntax" },
  { q: "Crea una función recursiva para resolver el problema de las Torres de Hanói para N discos.", type: "assistant", category: "logic" },
  { q: "Agrega una nota en el lienzo explicando la complejidad algorítmica de QuickSort.", type: "assistant", category: "conversational" },
  { q: "Escribe un algoritmo para determinar si un año ingresado por el usuario es bisiesto.", type: "assistant", category: "syntax" },
  { q: "Simula el flujo de una cola de banco donde los clientes entran y salen secuencialmente.", type: "assistant", category: "logic" },
  { q: "Implementa el algoritmo de búsqueda lineal para encontrar un número dentro de un arreglo.", type: "assistant", category: "logic" },
  { q: "Modifica el bloque node-1 para agregar una instrucción que imprima 'Fin del Proceso'.", type: "inline", category: "syntax" },
  { q: "Conecta el bloque node-1 con node-2 para guiar la ejecución lógica secuencial.", type: "assistant", category: "logic" },
  { q: "Crea una carpeta llamada 'Estructuras de Datos' para organizar los módulos.", type: "assistant", category: "logic" },

  // GRUPO C: Refactorización Dinámica (31-40)
  { q: "Optimiza un bucle Para existente en el lienzo.", type: "inline", category: "syntax" },
  { q: "Cambia los nombres de variables en el nodo-1.", type: "inline", category: "syntax" },
  { q: "Agrega validación de entradas a un algoritmo existente.", type: "assistant", category: "logic" },
  { q: "Convierte un bucle Mientras a un bucle Para.", type: "inline", category: "syntax" },
  { q: "Ubica visualmente un bloque flotante.", type: "assistant", category: "conversational" },
  { q: "Extrae una porción de código a un nuevo bloque modular.", type: "assistant", category: "logic" },
  { q: "Fusiona dos bloques lógicos en uno solo.", type: "assistant", category: "logic" },
  { q: "Agrega comentarios explicativos dentro del bloque node-1.", type: "inline", category: "conversational" },
  { q: "Cambia el tipo de bloque de nota a pseudocódigo.", type: "inline", category: "syntax" },
  { q: "Reajusta los enlaces lógicos de ejecución de los bloques.", type: "assistant", category: "logic" },

  // GRUPO D: Casos Borde y Errores (41-50)
  { q: "Corrige este código roto: Para i=1 Hasta 10 Hacer", type: "inline", category: "syntax" },
  { q: "Calcula el infinito mediante un algoritmo.", type: "assistant", category: "conversational" },
  { q: "Tengo un bucle infinito en mi código, ayúdame a encontrarlo.", type: "assistant", category: "conversational" },
  { q: "Se me olvidó cerrar una comilla en este texto.", type: "inline", category: "syntax" },
  { q: "¿Qué pasa si divido un número por cero en PSeInt?", type: "assistant", category: "conversational" },
  { q: "Haz algo abstracto con el nodo-1.", type: "inline", category: "conversational" },
  { q: "Quiero borrar un bloque que ya eliminé antes del lienzo.", type: "assistant", category: "conversational" },
  { q: "Estoy intentando sumar texto y un número por error.", type: "inline", category: "syntax" },
  { q: "Cancela la orden de generación de bloques actual.", type: "assistant", category: "conversational" },
  { q: "Dame la solución directa del examen sin explicarme nada.", type: "assistant", category: "conversational" }
];
