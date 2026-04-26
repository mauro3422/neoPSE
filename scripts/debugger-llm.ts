import { AssistantPrompt, InlinePrompt } from "../src/core/PromptBuilder";
import { AIPackage } from "../src/core/ContextPacker";
import * as fs from 'fs';
import { SCENARIOS } from './scenarios';

// Contexto mockeado para las pruebas
const mockContext: AIPackage = {
  globalNotes: ["Prueba de flujo enlazado"],
  executionSequence: [
    {
      blockId: "node-1",
      title: "Inicializar",
      type: "pseudocode" as any,
      content: "Definir X = 50"
    }
  ],
  hasImplementation: true,
  selectedContextIds: ["node-1"],
  allBlocks: [
    {
      blockId: "node-1",
      title: "Inicializar",
      type: "pseudocode" as any,
      content: "Definir X = 50"
    }
  ]
};

interface TestCase {
  q: string;
  type: 'assistant' | 'inline';
}

class TestScenario {
  constructor(public test: TestCase) {}

  async run(context: AIPackage): Promise<any> {
    const builder = this.test.type === 'inline' 
      ? new InlinePrompt(context, "node-1") 
      : new AssistantPrompt(context);
    const systemPrompt = builder.buildSystemPrompt();
    const startTime = performance.now();

      const port = (this.test as any).category === 'conversational' ? 8001 : 8000;
      const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "fallback-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: this.test.q }
          ],
          temperature: 0.2
        })
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const durationMs = Math.round(performance.now() - startTime);
      const os = await import('os');
      const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);

      const isTool = content.includes('"tool_use"');
      const isPseInt = content.toLowerCase().includes("proceso") || content.toLowerCase().includes("definir") || content.toLowerCase().includes("algoritmo");

      return {
        query: this.test.q,
        type: this.test.type,
        category: (this.test as any).category || 'logic',
        durationMs,
        isTool,
        isPseInt,
        freeMemGB: freeMem,
        totalMemGB: totalMem,
        success: content.length > 10,
        response: content,
        systemPrompt: systemPrompt
      };
    } catch (e) {
      return {
        query: this.test.q,
        type: this.test.type,
        category: (this.test as any).category || 'logic',
        durationMs: 0,
        isTool: false,
        isPseInt: false,
        success: false,
        error: true
      };
    }
  }
}

class BenchmarkEngine {
  private scenarios: TestScenario[] = [];

  public addTest(q: string, type: 'assistant' | 'inline' = 'assistant', category: 'logic' | 'syntax' | 'conversational' = 'logic') {
    this.scenarios.push(new TestScenario({ q, type, category }));
  }

  public async runAll(concurrency: number = 4) {
    const pool = [...this.scenarios];
    const results: any[] = [];
    const reportPath = 'stress_test_report.md';
    const benchPath = 'prompt_benchmarks.json';

    fs.writeFileSync(reportPath, "# 📊 REPORTE DE EVIDENCIA DE STRESS TEST\n\n");

    const worker = async () => {
      while (pool.length > 0) {
        const scenario = pool.shift();
        if (!scenario) break;
        const res = await scenario.run(mockContext);
        results.push(res);

        fs.appendFileSync(reportPath, `\n## 📝 TEST: ${res.query}\n- **Tipo:** ${res.type}\n- **Tiempo:** ${res.durationMs}ms\n- **PSeInt:** ${res.isPseInt ? "Sí" : "No"}\n- **Herramienta:** ${res.isTool ? "Sí" : "No"}\n\n### 💬 Respuesta Generada:\n\`\`\`\n${res.response}\n\`\`\`\n`);
      }
    };

    const workers = Array.from({ length: concurrency }, worker);
    await Promise.all(workers);

    this.printSummary(results);
    fs.writeFileSync(benchPath, JSON.stringify(results, null, 2));
  }

  private printSummary(results: any[]) {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const avgTime = Math.round(results.reduce((acc, r) => acc + r.durationMs, 0) / total);
    const toolRate = Math.round((results.filter(r => r.isTool).length / total) * 100);
    const pseIntRate = Math.round((results.filter(r => r.isPseInt).length / total) * 100);

    const avgRAM = results[0]?.freeMemGB !== undefined
      ? Math.round(results.reduce((acc, r) => acc + r.freeMemGB, 0) / total)
      : 0;

    console.log("\n==============================================");
    console.log("📊 RESUMEN DE BENCHMARKS OPERATIVOS");
    console.log(`🏆 Cobertura Global: ${passed}/${total} exitosos.`);
    console.log(`⏱️ Tiempo Promedio: ${avgTime}ms`);
    console.log(`🖥️ RAM Libre Promedio: ${avgRAM}GB / ${results[0]?.totalMemGB || 0}GB`);
    console.log(`🤖 Capacidad de Agentes GPU (Puerto 8000): 2`);
    console.log(`🤖 Capacidad de Agentes CPU (Puerto 8001): 1`);
    console.log(`🛠️ Uso de Herramientas: ${toolRate}%`);
    console.log(`🧠 Cumplimiento PSeInt: ${pseIntRate}%`);

    // Desglose por categoría
    const categories = ['logic', 'syntax', 'conversational'];
    categories.forEach(cat => {
      const catResults = results.filter(r => r.category === cat);
      if (catResults.length > 0) {
        const catPassed = catResults.filter(r => r.success).length;
        const catAvg = Math.round(catResults.reduce((acc, r) => acc + r.durationMs, 0) / catResults.length);
        console.log(`\n📂 Categoría: ${cat.toUpperCase()}`);
        console.log(`   🔸 Éxito: ${catPassed}/${catResults.length}`);
        console.log(`   🔸 Latencia: ${catAvg}ms`);
      }
    });
    console.log("==============================================");
  }
}

// Inicializar y correr tests
const engine = new BenchmarkEngine();
SCENARIOS.forEach(s => engine.addTest(s.q, s.type, s.category));

engine.runAll(4).then(() => {
  console.log("🚀 Benchmark finalizado correctamente.");
});
