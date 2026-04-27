import { AssistantPrompt, InlinePrompt } from "../src/core/PromptBuilder";
import { AIPackage } from "../src/core/ContextPacker";
import * as fs from 'fs';
import { SCENARIOS } from './scenarios';
import { MetricDatabase } from '../src/ai/db/MetricDatabase';


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
      const port = (this.test as any).category === 'conversational' ? 8001 : 8000;
      const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
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
      const usage = data.usage || {};
      const durationMs = Math.round(performance.now() - startTime);
      const os = await import('os');
      const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);

      const isTool = content.includes('"tool_use"');
      const isPseint = content.toLowerCase().includes("proceso") || content.toLowerCase().includes("definir") || content.toLowerCase().includes("algoritmo");
      
      let isJsonValid = true;
      if (isTool) {
        try {
          JSON.parse(content);
        } catch {
          isJsonValid = false;
        }
      }

      return {
        query: this.test.q,
        type: this.test.type,
        category: (this.test as any).category || 'logic',
        durationMs,
        isTool,
        isPseint,
        freeMemGB: freeMem,
        totalMemGB: totalMem,
        success: content.length > 10,
        response: content,
        systemPrompt: systemPrompt,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        contextSizeChars: systemPrompt.length,
        isJsonValid
      };
    } catch (e) {
      return {
        query: this.test.q,
        type: this.test.type,
        category: (this.test as any).category || 'logic',
        durationMs: 0,
        isTool: false,
        isPseint: false,
        success: false,
        error: true,
        errorMessage: (e as Error).message || String(e)
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

    // Guardar en SQLite
    try {
      const db = new MetricDatabase();
      const total = results.length;
      const passed = results.filter(r => r.success).length;
      const avgTime = Math.round(results.reduce((acc, r) => acc + r.durationMs, 0) / (total || 1));

      const snapshotId = db.saveSnapshot(total, passed, avgTime);

      for (const res of results) {
        db.saveTestResult({
          snapshotId,
          query: res.query,
          category: res.category,
          durationMs: res.durationMs,
          isTool: res.isTool,
          isPseint: res.isPseint,
          responseText: res.response || "",
          systemPrompt: res.systemPrompt || "",
          freeMemGB: res.freeMemGB || 0,
          totalMemGB: res.totalMemGB || 0,
          serviceType: res.category === 'conversational' ? 'cpu' : 'gpu',
          promptTokens: res.promptTokens,
          completionTokens: res.completionTokens,
          totalTokens: res.totalTokens,
          contextSizeChars: res.contextSizeChars,
          errorMessage: res.errorMessage,
          isJsonValid: res.isJsonValid
        });
      }
      console.log(`\n💾 Métricas guardadas en SQLite (Snapshot ID: ${snapshotId})`);
    } catch (e) {
      console.error("❌ Error al guardar métricas en SQLite:", e);
    }
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
