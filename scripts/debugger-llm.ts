import { AssistantPrompt, InlinePrompt } from "../src/core/PromptBuilder";
import { AIPackage } from "../src/core/ContextPacker";
import * as fs from 'fs';
import * as path from 'path';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import { MetricDatabase } from '../src/ai/db/MetricDatabase';

// Config

const ROOT = path.resolve(import.meta.dirname ?? process.cwd(), '..');
const LLAMA_ZIP = path.join(process.env.TEMP || '', 'neopse-llama-b9360', 'llama-b9360-bin-win-vulkan-x64.zip');
const SERVER_RUNTIME_DIR = process.env.LLAMA_RUNTIME_DIR || 'D:\\ai-runtime\\llama-b9360';
const MODELS_DIR = 'D:\\ai-models';
const LLAMA_EXE = process.env.LLAMA_SERVER_BIN || path.join(SERVER_RUNTIME_DIR, 'llama.exe');
const LLAMA_SERVER_EXE = path.join(SERVER_RUNTIME_DIR, 'llama-server.exe');
const BENCHMARK_RESULTS_DIR = path.join(ROOT, 'benchmarks', 'results');
let serverBin = LLAMA_EXE;

const MODELS = {
  gemma:  path.join(MODELS_DIR, 'google_gemma-4-E2B-it-Q4_K_M.gguf'),
  wr:     path.join(MODELS_DIR, 'WhiteRabbitNeo-2.5-Qwen-2.5-Coder-7B-Q4_K_M.gguf'),
  liquid: path.join(MODELS_DIR, 'LFM2.5-1.2B-Thinking-Q4_K_M.gguf'),
} as const;

interface Profile {
  model: string;
  port: number;
  gpu: boolean;
  ctx: number;
  label: string;
}

const PROFILES: Record<string, Profile> = {
  gemma:   { model: MODELS.gemma,  port: 8000, gpu: true,  ctx: 8192, label: 'Gemma 4 GPU' },
  wrGpu:   { model: MODELS.wr,     port: 8001, gpu: true,  ctx: 8192, label: 'WR GPU' },
  wrCpu:   { model: MODELS.wr,     port: 8001, gpu: false, ctx: 8192, label: 'WR CPU' },
  liquid:  { model: MODELS.liquid, port: 8002, gpu: false, ctx: 8192,  label: 'Liquid CPU' },
};

function buildArgs(p: Profile): string[] {
  const args = [
    '--model', p.model,
    '--port', String(p.port),
    '--host', '127.0.0.1',
    '--ctx-size', String(p.ctx),
    '--parallel', '1',
    '-cb',
    '--temp', '0.2',
    '--reasoning', 'off',
    '--reasoning-budget', '0',
    '--cache-type-k', 'q8_0',
    '--cache-type-v', 'q8_0',
    '--cache-ram', '0',
  ];
  if (p.gpu) {
    args.push('--n-gpu-layers', '99', '-fa', 'auto');
  } else {
    args.push('--threads', '6', '-ngl', '0');
  }
  return args;
}

function psLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function ensureServerLauncher(): boolean {
  if (fs.existsSync(LLAMA_EXE)) {
    serverBin = LLAMA_EXE;
    return true;
  }
  if (fs.existsSync(LLAMA_SERVER_EXE)) {
    serverBin = LLAMA_SERVER_EXE;
    return true;
  }

  if (!fs.existsSync(LLAMA_ZIP)) return false;
  fs.mkdirSync(SERVER_RUNTIME_DIR, { recursive: true });

  const command = [
    `Expand-Archive -Path ${psLiteral(LLAMA_ZIP)} -DestinationPath ${psLiteral(SERVER_RUNTIME_DIR)} -Force`
  ].join(' ');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
    encoding: 'utf8',
    windowsHide: true
  });

  if (result.status !== 0) {
    console.log(`FAIL restaurando launcher: ${result.stderr || result.stdout}`);
    return false;
  }

  if (fs.existsSync(LLAMA_EXE)) {
    serverBin = LLAMA_EXE;
    return true;
  }
  if (fs.existsSync(LLAMA_SERVER_EXE)) {
    serverBin = LLAMA_SERVER_EXE;
    return true;
  }

  return false;
}

// Server manager

const serverProcesses: ChildProcess[] = [];

function startServer(profile: Profile): ChildProcess {
  const args = buildArgs(profile);
  const finalArgs = path.basename(serverBin).toLowerCase() === 'llama.exe'
    ? ['server', ...args]
    : args;
  const proc = spawn(serverBin, finalArgs, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  serverProcesses.push(proc);

  proc.stdout?.on('data', (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[${profile.label}] ${line}`);
  });
  proc.stderr?.on('data', (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[${profile.label}] ${line}`);
  });
  proc.on('exit', (code) => console.log(`[${profile.label}] exit ${code}`));
  return proc;
}

function killServers(): void {
  for (const proc of serverProcesses) {
    try { proc.kill(); } catch { /* ignore */ }
  }
  serverProcesses.length = 0;
}

async function checkServer(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch { return false; }
}

async function waitForServer(port: number, timeoutMs = 120000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkServer(port)) return true;
    await new Promise(r => setTimeout(r, 3000));
  }
  return false;
}

async function ensureServer(profile: Profile, maxWaitMs = 120000): Promise<boolean> {
  if (await checkServer(profile.port)) {
    console.log(`OK ${profile.label} ya corriendo en puerto ${profile.port}`);
    return true;
  }
  if (!ensureServerLauncher()) {
    console.log(`FAIL ${profile.label}: no pude restaurar launcher b9360 desde ${LLAMA_ZIP}. Revisa Windows Security/quarantine para llama.exe o llama-server.exe.`);
    return false;
  }
  if (!fs.existsSync(profile.model)) {
    console.log(`FAIL ${profile.label}: falta modelo en ${profile.model}`);
    return false;
  }
  console.log(`Iniciando ${profile.label} en puerto ${profile.port}...`);
  startServer(profile);
  const ok = await waitForServer(profile.port, maxWaitMs);
  if (ok) console.log(`OK ${profile.label} listo`);
  else console.log(`FAIL ${profile.label} no respondio`);
  return ok;
}

async function query(port: number, systemPrompt: string, userQuery: string, timeoutMs = 60000, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userQuery }
          ],
          temperature: 0.2,
          max_tokens: 600,
          stream: false
        })
      });
      if (!res.ok) {
        const body = await res.text();
        if (res.status === 503 && attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function queryWithTools(port: number, userQuery: string, tools: any[], timeoutMs = 60000): Promise<any> {
  const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      messages: [{ role: 'user', content: userQuery }],
      tools,
      temperature: 0.1,
      max_tokens: 300,
      stream: false
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function getMemInfo(): Promise<{ totalMemGB: number; freeMemGB: number }> {
  const os = await import('os');
  return {
    totalMemGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    freeMemGB: Math.round(os.freemem() / 1024 / 1024 / 1024)
  };
}

// Mock context for PromptBuilder tests

const mockContext: AIPackage = {
  globalNotes: ['Prueba de sistema'],
  executionSequence: [
    { blockId: 'node-1', title: 'Inicializar', type: 'pseudocode' as any, content: 'Definir X = 50' }
  ],
  hasImplementation: true,
  selectedContextIds: ['node-1'],
  allBlocks: [
    { blockId: 'node-1', title: 'Inicializar', type: 'pseudocode' as any, content: 'Definir X = 50' }
  ]
};

// Test runner

interface TestCase {
  name: string;
  query: string;
  type: 'assistant' | 'inline' | 'toolcall';
  category: 'logic' | 'syntax' | 'conversational' | 'toolcall';
  profile: keyof typeof PROFILES;
  expectedResponse: 'assistant_text' | 'canvas_action_json' | 'native_tool_call';
  expectedKeywords?: string[];
  expectedAction?: string;
  expectedTool?: string;
}

interface TestResult {
  name: string;
  type: string;
  category: string;
  profile: string;
  success: boolean;
  durationMs: number;
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  speedTokS: number;
  error?: string;
  freeMemGB: number;
  totalMemGB: number;
  isToolCall?: boolean;
  isJsonValid?: boolean;
  qualityFlags?: string[];
}

function parseJsonObject(content: string): { ok: boolean; parsed?: any } {
  try {
    let jsonStr = content.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    return { ok: true, parsed: JSON.parse(jsonStr) };
  } catch {
    return { ok: false };
  }
}

function hasCorruptOutput(content: string): boolean {
  const suspiciousFragments = ['?--long-Say', '\\text{', 'undefined'];
  if (suspiciousFragments.some(fragment => content.includes(fragment))) return true;

  const replacementChars = (content.match(/\uFFFD/g) || []).length;
  if (replacementChars > 0) return true;

  const nonLatinMatches = content.match(/[\u3040-\u30ff\u3130-\u318f\uac00-\ud7af\u0e00-\u0e7f\u0600-\u06ff]/g) || [];
  return nonLatinMatches.length > 20;
}

function evaluateTextResponse(content: string, tc: TestCase): { success: boolean; isJsonValid: boolean; flags: string[] } {
  const flags: string[] = [];
  const json = parseJsonObject(content);
  const parsedMessage = typeof json.parsed?.message === 'string' ? json.parsed.message : '';
  const parsedPayload = json.ok ? JSON.stringify(json.parsed) : '';
  const textForChecks = [parsedMessage, parsedPayload, content].filter(Boolean).join('\n');

  if (content.trim().length <= 10) flags.push('too_short');
  if (hasCorruptOutput(content)) flags.push('corrupt_output');

  if (tc.expectedResponse === 'assistant_text') {
    if (json.ok && json.parsed?.tool_use) flags.push('unexpected_tool_use');
  }

  if (tc.expectedResponse === 'canvas_action_json') {
    if (!json.ok) {
      flags.push('invalid_json');
    } else {
      const trimmed = content.trim();
      const toolUse = json.parsed?.tool_use;
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) flags.push('extraneous_text_around_json');
      if (!json.parsed?.message || typeof json.parsed.message !== 'string') flags.push('missing_message');
      if (!toolUse || typeof toolUse.action !== 'string') flags.push('missing_tool_use');
      if (toolUse && !('params' in toolUse)) flags.push('tool_without_params');
      if (tc.expectedAction && toolUse?.action !== tc.expectedAction) flags.push(`missing_action:${tc.expectedAction}`);
    }
  }

  for (const keyword of tc.expectedKeywords || []) {
    if (!textForChecks.toLowerCase().includes(keyword.toLowerCase())) {
      flags.push(`missing_keyword:${keyword}`);
    }
  }

  return {
    success: flags.length === 0,
    isJsonValid: tc.expectedResponse === 'assistant_text' ? !json.ok || !!json.parsed : json.ok,
    flags
  };
}

function evaluateToolCall(msg: any, tc: TestCase): { success: boolean; flags: string[] } {
  const flags: string[] = [];
  const toolCalls = msg?.tool_calls || [];
  if (toolCalls.length === 0) flags.push('missing_tool_call');
  if (tc.expectedTool && !toolCalls.some((call: any) => call?.function?.name === tc.expectedTool)) {
    flags.push(`missing_tool:${tc.expectedTool}`);
  }
  return { success: flags.length === 0, flags };
}

async function runSingleTest(tc: TestCase): Promise<TestResult> {
  const profile = PROFILES[tc.profile];
  const start = performance.now();
  const mem = await getMemInfo();

  try {
    if (tc.type === 'toolcall') {
      const data = await queryWithTools(profile.port, tc.query, [
        { type: 'function', function: { name: 'sumar', description: 'Suma dos numeros', parameters: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] } } }
      ]);
      const elapsed = performance.now() - start;
      const msg = data.choices?.[0]?.message;
      const isToolCall = msg?.tool_calls?.length > 0;
      const quality = evaluateToolCall(msg, tc);
      return {
        name: tc.name, type: tc.type, category: tc.category, profile: tc.profile,
        success: quality.success,
        durationMs: Math.round(elapsed),
        response: JSON.stringify(isToolCall ? msg.tool_calls : msg?.content),
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        speedTokS: data.timings?.predicted_per_second ?? 0,
        isToolCall,
        isJsonValid: true,
        qualityFlags: quality.flags,
        ...mem
      };
    }

    const builder = tc.type === 'inline'
      ? new InlinePrompt(mockContext, 'node-1')
      : new AssistantPrompt(mockContext);
    const systemPrompt = builder.buildSystemPrompt();
    const data = await query(profile.port, systemPrompt, tc.query);
    const elapsed = performance.now() - start;
    const content = data.choices?.[0]?.message?.content ?? '';
    const quality = evaluateTextResponse(content, tc);

    return {
      name: tc.name, type: tc.type, category: tc.category, profile: tc.profile,
      success: quality.success,
      durationMs: Math.round(elapsed),
      response: content,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
      speedTokS: data.timings?.predicted_per_second ?? 0,
      isJsonValid: quality.isJsonValid,
      qualityFlags: quality.flags,
      ...mem
    };
  } catch (err) {
    return {
      name: tc.name, type: tc.type, category: tc.category, profile: tc.profile,
      success: false, durationMs: Math.round(performance.now() - start),
      response: '', promptTokens: 0, completionTokens: 0, totalTokens: 0, speedTokS: 0,
      error: (err as Error).message,
      isJsonValid: false,
      qualityFlags: ['request_failed'],
      ...mem
    };
  }
}

// Benchmark engine

class BenchmarkEngine {
  private tests: TestCase[] = [];

  add(tc: TestCase): void {
    this.tests.push(tc);
  }

  async runAll(concurrency = 1, persist = true): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const pool = [...this.tests];

    const worker = async () => {
      while (pool.length > 0) {
        const tc = pool.shift();
        if (!tc) break;
        console.log(`\n> ${tc.name} (${tc.profile}/${tc.category})`);
        const result = await runSingleTest(tc);
        results.push(result);
        const status = result.success ? 'PASS' : 'FAIL';
        const flags = result.qualityFlags?.length ? ` | ${result.qualityFlags.join(', ')}` : '';
        console.log(`  ${status} ${result.durationMs}ms | ${result.completionTokens}t out | ${result.speedTokS} tok/s${flags}${result.error ? ' | ' + result.error : ''}`);
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    if (persist) this.recordResults(results);
    return results;
  }

  public recordResults(results: TestResult[]): void {
    this.printSummary(results);
    this.saveMetrics(results);
  }

  private printSummary(results: TestResult[]): void {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const avgMs = Math.round(results.reduce((a, r) => a + r.durationMs, 0) / total);
    const toolRate = Math.round((results.filter(r => r.isToolCall).length / total) * 100);

    console.log('\n======================================');
    console.log('BENCHMARK SUMMARY');
    console.log(`  ${passed}/${total} passed`);
    console.log(`  ${avgMs}ms avg`);
    console.log(`  ${toolRate}% tool calls`);
    console.log('======================================\n');
  }

  private saveMetrics(results: TestResult[]): void {
    try {
      const db = new MetricDatabase();
      const snapshotId = db.saveSnapshot(results.length, results.filter(r => r.success).length, Math.round(results.reduce((a, r) => a + r.durationMs, 0) / results.length));
      for (const r of results) {
        db.saveTestResult({
          snapshotId,
          query: r.name,
          category: r.category,
          durationMs: r.durationMs,
          isTool: r.isToolCall ?? false,
          isPseint: false,
          responseText: r.response,
          systemPrompt: '',
          freeMemGB: r.freeMemGB,
          totalMemGB: r.totalMemGB,
          serviceType: r.profile,
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          contextSizeChars: 0,
          errorMessage: r.error || (r.qualityFlags?.length ? r.qualityFlags.join(', ') : undefined),
          isJsonValid: r.isJsonValid
        });
      }
      console.log(`Saved to SQLite (snapshot ${snapshotId})`);
    } catch (e) {
      console.log(`SQLite save skipped: ${(e as Error).message}`);
    }
  }
}

// CLI

function saveBenchmarkResults(results: TestResult[]): void {
  fs.mkdirSync(BENCHMARK_RESULTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const payload = JSON.stringify(results, null, 2);
  fs.writeFileSync(path.join(BENCHMARK_RESULTS_DIR, 'latest.json'), payload);
  fs.writeFileSync(path.join(BENCHMARK_RESULTS_DIR, `${timestamp}.json`), payload);
  console.log(`\nResultados guardados en ${path.relative(ROOT, BENCHMARK_RESULTS_DIR)}\\latest.json`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] || 'benchmark';

  if (mode === 'toolcall') {
    const port = Number(args[1]) || 8000;
    console.log(`Testing tool calling on port ${port}...`);
    if (!await ensureServer(PROFILES.gemma)) { process.exit(1); }
    const result = await queryWithTools(port, 'Suma 15 y 27', [
      { type: 'function', function: { name: 'sumar', description: 'Suma dos numeros', parameters: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] } } }
    ]);
    const msg = result.choices?.[0]?.message;
    if (msg?.tool_calls) {
      console.log('Tool call received:', JSON.stringify(msg.tool_calls, null, 2));
    } else {
      console.log('No tool call. Response:', msg?.content);
    }
    killServers();
    return;
  }

  if (mode === 'server') {
    const name = args[1] as keyof typeof PROFILES;
    if (!name || !PROFILES[name]) {
      console.log('Perfiles:', Object.keys(PROFILES).join(', '));
      process.exit(1);
    }
    const ok = await ensureServer(PROFILES[name]);
    if (!ok) process.exit(1);
    console.log(`Presiona Ctrl+C para detener ${name}`);
    await new Promise(() => {});
    return;
  }

  if (mode === 'benchmark') {
    const tests: TestCase[] = [{
      name: 'Gemma-PSeInt-Bisiesto',
      query: 'Crea un bloque de pseudocodigo PSeInt que determine si un anio es bisiesto.',
      type: 'assistant',
      category: 'logic',
      profile: 'gemma',
      expectedResponse: 'canvas_action_json',
      expectedAction: 'create_block',
      expectedKeywords: ['bisiesto', 'Algoritmo']
    }, {
      name: 'Gemma-Inline-Editar',
      query: "Modifica el bloque node-1 para agregar una instruccion que imprima 'Fin del Proceso'.",
      type: 'inline',
      category: 'syntax',
      profile: 'gemma',
      expectedResponse: 'canvas_action_json',
      expectedAction: 'edit_block_content',
      expectedKeywords: ['Fin del Proceso']
    }, {
      name: 'Gemma-Conversacional',
      query: 'Explicame la diferencia entre un bucle Mientras y un bucle Para en PSeInt.',
      type: 'assistant',
      category: 'conversational',
      profile: 'gemma',
      expectedResponse: 'assistant_text',
      expectedKeywords: ['Mientras', 'Para']
    }, {
      name: 'WR-Seguridad-Conceptual',
      query: 'Explica que es un buffer overflow a nivel conceptual y como mitigarlo, sin dar pasos ofensivos.',
      type: 'assistant',
      category: 'conversational',
      profile: 'wrCpu',
      expectedResponse: 'assistant_text',
      expectedKeywords: ['buffer', 'mitig']
    }, {
      name: 'ToolCall-Gemma',
      query: 'Suma 15 y 27',
      type: 'toolcall',
      category: 'toolcall',
      profile: 'gemma',
      expectedResponse: 'native_tool_call',
      expectedTool: 'sumar'
    }];

    const results: TestResult[] = [];
    const profiles = Array.from(new Set(tests.map(t => t.profile)));

    for (const profileName of profiles) {
      const profile = PROFILES[profileName];
      const profileTests = tests.filter(t => t.profile === profileName);
      const ready = await ensureServer(profile);
      if (!ready) {
        const mem = await getMemInfo();
        for (const tc of profileTests) {
          results.push({
            name: tc.name, type: tc.type, category: tc.category, profile: tc.profile,
            success: false, durationMs: 0, response: '',
            promptTokens: 0, completionTokens: 0, totalTokens: 0, speedTokS: 0,
            error: `server_not_ready:${profileName}`,
            isJsonValid: false,
            qualityFlags: ['server_not_ready'],
            ...mem
          });
        }
        continue;
      }

      const engine = new BenchmarkEngine();
      profileTests.forEach(t => engine.add(t));
      results.push(...await engine.runAll(1, false));
      killServers();
      await new Promise(r => setTimeout(r, 2000));
    }

    const finalEngine = new BenchmarkEngine();
    finalEngine.recordResults(results);

    saveBenchmarkResults(results);
    return;
  }

  console.log('Uso: npx tsx scripts/debugger-llm.ts [benchmark|toolcall|server] [profile]');
  console.log('  benchmark        - ejecuta todos los tests');
  console.log('  toolcall [port]  - prueba tool calling de Gemma');
  console.log('  server <perfil>  - inicia server de un perfil');
  console.log('  Perfiles: ' + Object.keys(PROFILES).join(', '));
}

main().catch(e => {
  console.error('FAIL', e);
  killServers();
  process.exit(1);
});
