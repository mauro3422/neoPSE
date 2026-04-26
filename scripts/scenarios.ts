export interface TestCase {
  q: string;
  type: 'assistant' | 'inline';
  category: 'logic' | 'syntax' | 'conversational';
}

export const SCENARIOS: TestCase[] = [
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
  { q: "Escribe el algoritmo de la Criba de Eratóstenes para encontrar números primos hasta el 200.", type: "assistant", category: "logic" },
  { q: "Calcula el Máximo Común Divisor (MCD) de dos números usando el algoritmo de Euclides.", type: "assistant", category: "logic" },
  { q: "Desarrolla la lógica para validar si una tarjeta de crédito es válida usando el Algoritmo de Luhn.", type: "assistant", category: "logic" },
  { q: "Diseña un conversor de moneda de Pesos a Dólares pidiendo la tasa de cambio actual.", type: "assistant", category: "syntax" },
  { q: "Escribe un algoritmo que invierta una cadena de texto ingresada por el usuario.", type: "assistant", category: "syntax" },
  { q: "Implementa una pila (Stack) utilizando un arreglo con operaciones Apilar y Desapilar.", type: "assistant", category: "logic" },
  { q: "Calcula el sueldo neto de un empleado restando los impuestos de ley según su rango.", type: "assistant", category: "logic" },
  { q: "Agrega una nota recordando que los arreglos en PSeInt por defecto son base 1.", type: "assistant", category: "conversational" },
  { q: "Genera la tabla de multiplicar de un número N del 1 al 12.", type: "assistant", category: "syntax" },
  { q: "Escribe un algoritmo que determine la calificación final en base a 3 exámenes parciales.", type: "assistant", category: "syntax" },
  { q: "Encuentra el elemento mayor y el menor dentro de un arreglo desordenado.", type: "assistant", category: "logic" },
  { q: "Crea un bloque que simule el juego de adivinar un número aleatorio entre 1 y 100.", type: "assistant", category: "logic" },
  { q: "Determina si un número entero ingresado es par o impar usando el operador Mod.", type: "assistant", category: "syntax" },
  { q: "Escribe el pseudocódigo para resolver una ecuación de segundo grado (Fórmula general).", type: "assistant", category: "logic" },
  { q: "Construye una solución para verificar si una matriz dada es simétrica.", type: "assistant", category: "logic" }
];
