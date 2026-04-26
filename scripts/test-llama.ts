import { AssistantPrompt, InlinePrompt } from "../src/core/PromptBuilder";
import { AIPackage } from "../src/core/ContextPacker";
import * as readline from 'readline';

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
  console.log("\n🎮 INICIANDO PIPELINE DE EVALUACIÓN DE CALIDAD IA...");
  printWorkspace();

  const prompts = [
    {
      query: "Crea un algoritmo premium en pseudocódigo para un Personaje Guerrero de la Tribu Agua (Vida=100, Fuerza=80, Control Elemento=Agua)",
      assertions: [
        (res: string) => res.includes("tool_use") || res.includes('"action"'),
        (res: string) => res.length > 150, // No respuestas perezosas
        (res: string) => res.toLowerCase().includes("guerrero") || res.toLowerCase().includes("tribu")
      ]
    },
    {
      query: "Quiero un sistema de herencia completo en JS para transferir stats de un Avatar a un discípulo.",
      assertions: [
        (res: string) => res.includes("class ") || res.includes("prototype") || res.includes(".stats"),
        (res: string) => res.length > 200
      ]
    }
  ];

  let passedAll = true;

  for (const test of prompts) {
    console.log(`\n==============================================\n💬 ORDEN: "${test.query}"`);
    
    const builder = new AssistantPrompt(mockContext);
    const systemPrompt = builder.buildSystemPrompt();

    try {
      const res = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "fallback-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: test.query }
          ],
          temperature: 0.2
        })
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "VACÍO";
      
      console.log("\n🤖 RESPUESTA DE LA IA:");
      console.log(content);
      
      processTools(content);
      printWorkspace();

      // Correr validaciones estrictas de calidad
      console.log("🕵️ Evaluando métricas de calidad...");
      let testPassed = true;
      test.assertions.forEach((assertion, index) => {
        const ok = assertion(content);
        console.log(`  🔍 Criterio #${index + 1}: ${ok ? "✅ PASADO" : "❌ FALLADO"}`);
        if (!ok) testPassed = false;
      });

      if (!testPassed) passedAll = false;
      
    } catch(e) {
      console.error("💥 Error en el pipeline:", e);
      passedAll = false;
    }
  }

  console.log("\n==============================================");
  if (passedAll) {
    console.log("🏆 RESULTADO GLOBAL: TODOS LOS TESTS PASADOS (Calidad Certificada) 🟢");
  } else {
    console.log("⚠️ RESULTADO GLOBAL: ALGUNOS TESTS NO PASARON LAS MÉTRICAS DE RIGOR 🔴");
  }
}

if (process.argv.includes('--automated') || process.argv.includes('--simulate')) {
  runSimulation();
} else {
  console.log("🚀 Consola Interactiva de Depuración de IA iniciada.");
  askQuestion();
}
