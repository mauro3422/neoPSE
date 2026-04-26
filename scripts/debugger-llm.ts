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

    try {
      const res = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
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

      const isTool = content.includes('"tool_use"');
      const isPseInt = content.toLowerCase().includes("proceso") || content.toLowerCase().includes("definir") || content.toLowerCase().includes("algoritmo");

      return {
        query: this.test.q,
        type: this.test.type,
        durationMs,
        isTool,
        isPseInt,
        success: content.length > 50
      };
    } catch (e) {
      return {
        query: this.test.q,
        type: this.test.type,
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

  public addTest(q: string, type: 'assistant' | 'inline' = 'assistant') {
    this.scenarios.push(new TestScenario({ q, type }));
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

        fs.appendFileSync(reportPath, `\n## 📝 TEST: ${res.query}\n- **Tipo:** ${res.type}\n- **Tiempo:** ${res.durationMs}ms\n- **PSeInt:** ${res.isPseInt ? "Sí" : "No"}\n- **Herramienta:** ${res.isTool ? "Sí" : "No"}\n`);
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

    console.log("\n==============================================");
    console.log("📊 RESUMEN DE BENCHMARKS OPERATIVOS");
    console.log(`🏆 Cobertura: ${passed}/${total} exitosos.`);
    console.log(`⏱️ Tiempo Promedio: ${avgTime}ms`);
    console.log(`🛠️ Uso de Herramientas: ${toolRate}%`);
    console.log(`🧠 Cumplimiento PSeInt: ${pseIntRate}%`);
    console.log("==============================================");
  }
}

// Inicializar y correr tests
const engine = new BenchmarkEngine();
SCENARIOS.forEach(s => engine.addTest(s.q, s.type));

engine.runAll(3).then(() => {
  console.log("🚀 Benchmark finalizado correctamente.");
});
