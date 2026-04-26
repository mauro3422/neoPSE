import { AssistantPrompt, InlinePrompt } from "../src/core/PromptBuilder";
import { AIPackage } from "../src/core/ContextPacker";
import * as readline from 'readline';
import * as fs from 'fs';

// 1. Mock payload parecido al que usa el Debugger
const mockContext: AIPackage = {
  globalNotes: ["Prueba de flujo enlazado"],
  executionSequence: [
    {
      blockId: "node-1",
      title: "Inicializar",
      type: "pseudocode" as any,
      content: "Definir X = 50"
    },
    {
      blockId: "node-2",
      title: "Operación",
      type: "pseudocode" as any,
      content: "Definir Y = 20"
    },
    {
      blockId: "node-3",
      title: "Resultado",
      type: "pseudocode" as any,
      content: "Imprimir X + Y"
    }
  ],
  hasImplementation: true,
  selectedContextIds: ["node-3"],
  allBlocks: [
    {
      blockId: "node-1",
      title: "Inicializar",
      type: "pseudocode" as any,
      content: "Definir X = 50"
    },
    {
      blockId: "node-2",
      title: "Operación",
      type: "pseudocode" as any,
      content: "Definir Y = 20"
    },
    {
      blockId: "node-3",
      title: "Resultado",
      type: "pseudocode" as any,
      content: "Imprimir X + Y"
    }
  ]
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion() {
  rl.question('\n💬 Escribe tu mensaje para la IA (o "exit" para salir): ', async (userMessage) => {
    if (userMessage.trim().toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    console.log("⏳ Enviando consulta a LLaMA Server...");
    
    const builder = new InlinePrompt(mockContext, "node-3");
    const systemPrompt = builder.buildSystemPrompt();

    try {
      const response = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "fallback-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          temperature: 0.6
        })
      });
      
      if (!response.ok) {
        console.error("❌ Error HTTP:", response.status, response.statusText);
        askQuestion();
        return;
      }
      
      const data = await response.json();
      console.log("\n🤖 RESPUESTA DE LA IA:\n");
      console.log(data.choices?.[0]?.message?.content || "Respuesta vacía.");
      
    } catch (err) {
      console.error("💥 Error de conexión con el LLaMA Server:", err);
    }

    askQuestion();
  });
}

interface MockBlock {
  id: string;
  type: string;
  content: string;
}

let mockWorkspace: MockBlock[] = [
  { id: 'node-1', type: 'pseudocode', content: 'X = 50' },
  { id: 'node-2', type: 'pseudocode', content: 'Y = 20' },
  { id: 'node-3', type: 'note', content: 'Revisión final' }
];

function printWorkspace() {
  console.log("\n📦 ESTADO ACTUAL DEL ESPACIO DE TRABAJO:");
  if (mockWorkspace.length === 0) {
    console.log("  [VACÍO]");
  } else {
    mockWorkspace.forEach(b => {
      console.log(`  🔹 [${b.id}] (${b.type}): "${b.content}"`);
    });
  }
  console.log("\n");
}

function processTools(response: string) {
  const regex = /\{\s*"tool_use"\s*:\s*\{\s*"action"\s*:\s*"([^"]+)"\s*,\s*"params"\s*:\s*(\{[\s\S]*?\})\s*\}\s*\}/g;
  let match;
  
  while ((match = regex.exec(response)) !== null) {
    const action = match[1];
    try {
      const params = JSON.parse(match[2]);
      console.log(`\n⚙️ Ejecutando Herramienta IA: "${action}"`);
      
      if (action === 'create_block') {
        const id = `node-${Math.random().toString(36).substr(2, 5)}`;
        mockWorkspace.push({ id, type: params.type || 'note', content: params.content || '' });
        console.log(`✅ Bloque ${id} creado satisfactoriamente.`);
      } 
      else if (action === 'delete_block') {
        const targetId = params.blockId;
        const initialLen = mockWorkspace.length;
        mockWorkspace = mockWorkspace.filter(b => b.id !== targetId);
        if (mockWorkspace.length < initialLen) {
          console.log(`✅ Bloque ${targetId} eliminado satisfactoriamente.`);
        } else {
          console.log(`⚠️ Bloque ${targetId} no encontrado en el lienzo.`);
        }
      } 
      else if (action === 'clear_workspace') {
        mockWorkspace = [];
        console.log(`✅ Lienzo purgado en su totalidad.`);
      }
    } catch(e) {
      console.error("❌ Error parseando JSON de herramienta:", e);
    }
  }
}

async function runSimulation() {
  console.log("\n🎮 INICIANDO PIPELINE MASIVO DE 30 TESTS CONCURRENTES...");
  printWorkspace();

  const prompts = [
    { q: "Crea un algoritmo de ordenamiento BubbleSort en pseudocódigo." },
    { q: "Quiero una función recursiva en JS para calcular el factorial." },
    { q: "Escribe la lógica para un sistema de login con 3 intentos máximos." },
    { q: "Genera un árbol binario de búsqueda en TypeScript." },
    { q: "Diseña un conversor de grados Celsius a Fahrenheit." },
    { q: "Crea una calculadora básica que sume, reste y multiplique." },
    { q: "Quiero una validación de correo electrónico usando Regex." },
    { q: "Simula el lanzamiento de un dado de 6 caras." },
    { q: "Escribe un bucle que imprima los números primos del 1 al 100." },
    { q: "Crea una clase abstracta para un Personaje RPG." },
    { q: "Escribe un algoritmo para verificar si una palabra es palíndromo." },
    { q: "Quiero un sistema de inventario simple con agregar y eliminar." },
    { q: "Genera el código para calcular la serie Fibonacci hasta N." },
    { q: "Crea un sistema de combate por turnos básico." },
    { q: "Escribe una función que cuente las vocales de un texto." },
    { q: "Genera una matriz de 3x3 rellena de ceros." },
    { q: "Crea un algoritmo para calcular el área de un círculo." },
    { q: "Escribe una lógica de juego 'Piedra, Papel o Tijera'." },
    { q: "Simula un cajero automático con retiro y consulta de saldo." },
    { q: "Quiero un script que ordene una lista alfabéticamente." },
    { q: "Escribe un algoritmo para encontrar el número mayor de un array." },
    { q: "Crea un temporizador de cuenta regresiva simple." },
    { q: "Genera una lista de tareas (To-Do) con marcar como completada." },
    { q: "Escribe una lógica de semáforo con estados Verde, Amarillo, Rojo." },
    { q: "Crea un sistema de reserva de asientos para un cine." },
    { q: "Quiero una función que determine si un año es bisiesto." },
    { q: "Genera un generador de contraseñas seguras aleatorias." },
    { q: "Escribe una cola (Queue) con enqueue y dequeue." },
    { q: "Crea un algoritmo de búsqueda binaria." },
    { q: "Genera un módulo que calcule el promedio de calificaciones." }
  ];

  let passedCount = 0;
  const CONCURRENCY = 3; 
  const pool = [...prompts];
  const reportPath = 'stress_test_report.md';
  fs.writeFileSync(reportPath, "# 📊 REPORTE DE EVIDENCIA DE STRESS TEST\n\n");

  const executeTest = async (test: any) => {
    const builder = new AssistantPrompt(mockContext);
    const systemPrompt = builder.buildSystemPrompt();

    try {
      console.log(`\n💬 EN COLA -> PROMPT: "${test.q}"`);
      const res = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "fallback-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: test.q }
          ],
          temperature: 0.2
        })
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      fs.appendFileSync(reportPath, `### 📌 Query: ${test.q}\n\n🤖 **Respuesta:**\n${content}\n\n---\n\n`);

      if (content.length > 50) {
        console.log(`✅ COMPLETADO -> "${test.q.substring(0, 30)}..."`);
        passedCount++;
      } else {
        console.log(`❌ FALLIDO -> Respuesta demasiado corta para: "${test.q}"`);
      }
    } catch (e) {
      console.error(`💥 Error en prompt "${test.q}":`, e);
    }
  };

  const worker = async () => {
    while (pool.length > 0) {
      const current = pool.shift();
      if (!current) break;
      await executeTest(current);
    }
  };

  console.log(`🚀 Lanzando ${CONCURRENCY} slots de ejecución concurrentes...`);
  const workers = Array.from({ length: CONCURRENCY }, worker);
  await Promise.all(workers);

  console.log("\n==============================================");
  console.log(`🏆 RESUMEN DE STRESS TEST: ${passedCount}/30 exitosos.`);
  if (passedCount === 30) {
    console.log("🟢 CAPACIDAD PARALELA CERTIFICADA AL 100%");
  } else {
    console.log("🔴 HUBO DEGRADACIÓN EN ALGUNAS RESPUESTAS");
  }
}

if (process.argv.includes('--automated') || process.argv.includes('--simulate')) {
  runSimulation();
} else {
  console.log("🚀 Consola Interactiva de Depuración de IA iniciada.");
  askQuestion();
}
