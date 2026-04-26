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

console.log("🚀 Consola Interactiva de Depuración de IA iniciada.");
askQuestion();
