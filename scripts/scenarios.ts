export interface TestCase {
  q: string;
  type: 'assistant' | 'inline';
  category: 'logic' | 'syntax' | 'conversational';
}

export const SCENARIOS: TestCase[] = [
  { q: "Crea un algoritmo de ordenamiento BubbleSort en pseudocódigo.", type: "assistant", category: "logic" },
  { q: "Optimiza el cálculo de factorial en JS.", type: "inline", category: "syntax" },
  { q: "Genera el algoritmo de Fibonacci hasta N.", type: "assistant", category: "logic" },
  { q: "Diseña un conversor de grados Celsius a Fahrenheit.", type: "assistant", category: "syntax" },
  { q: "Explícame cómo funciona un bucle Mientras (While) en PSeInt.", type: "assistant", category: "conversational" },
  { q: "Crea un sistema de login con 3 intentos máximos.", type: "assistant", category: "logic" },
  { q: "Corrige este fragmento: X == 10", type: "inline", category: "syntax" }
];
