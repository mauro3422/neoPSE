import * as fs from 'fs';
import * as os from 'os';

function printDashboard() {
  const benchPath = 'prompt_benchmarks.json';
  let total = 0, passed = 0, avgTime = 0;

  if (fs.existsSync(benchPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(benchPath, 'utf8'));
      total = data.length;
      passed = data.filter((r: any) => r.success).length;
      avgTime = total > 0 ? Math.round(data.reduce((acc: number, r: any) => acc + r.durationMs, 0) / total) : 0;
    } catch (e) {
      // Ignorar errores de lectura
    }
  }

  const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);
  const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);

  console.log("\n==============================================");
  console.log("🖥️  SISTEMA NEO-PSE: INFORMACIÓN DE ARRANQUE");
  console.log(`🤖 Agentes GPU Concurrentes: 2 (Puerto 8000)`);
  console.log(`🤖 Agentes CPU Concurrentes: 1 (Puerto 8001)`);
  console.log(`📊 Último Benchmark: ${passed}/${total} Casos Exitosos (${avgTime}ms prom)`);
  console.log(`📈 Estado del Hardware: ${freeMem}GB Libres de ${totalMem}GB RAM`);
  console.log("==============================================\n");
}

printDashboard();
