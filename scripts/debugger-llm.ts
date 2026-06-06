import { AssistantPrompt, InlinePrompt } from "../src/core/PromptBuilder";
import { AIPackage } from "../src/core/ContextPacker";
import * as fs from 'fs';
import * as path from 'path';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import { MetricDatabase } from '../src/ai/db/MetricDatabase';
import { SCENARIOS } from './scenarios';

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
  gemma:      path.join(MODELS_DIR, 'google_gemma-4-E2B-it-Q4_K_M.gguf'),
  gemmaQat:   path.join(MODELS_DIR, 'gemma-4-E2B_q4_0-it.gguf'),
  gemmaE4Qat: path.join(MODELS_DIR, 'gemma-4-E4B_q4_0-it.gguf'),
  gemma12Qat: path.join(MODELS_DIR, 'gemma-4-12b-it-qat-q4_0.gguf'),
  wr:         path.join(MODELS_DIR, 'WhiteRabbitNeo-2.5-Qwen-2.5-Coder-7B-Q4_K_M.gguf'),
  liquid:     path.join(MODELS_DIR, 'LFM2.5-1.2B-Thinking-Q4_K_M.gguf'),
} as const;

interface Profile {
  model: string;
  port: number;
  gpu: boolean;
  ctx: number;
  label: string;
  reasoning?: 'off' | 'auto' | 'on';
  reasoningBudget?: number;
  reasoningFormat?: 'auto' | 'none' | 'deepseek' | 'deepseek-legacy';
}

const PROFILES: Record<string, Profile> = {
  gemma:      { model: MODELS.gemma,      port: 8000, gpu: true,  ctx: 8192, label: 'Gemma 4 E2B Q4_K_M GPU' },
  gemmaQat:   { model: MODELS.gemmaQat,   port: 8003, gpu: true,  ctx: 8192, label: 'Gemma 4 E2B QAT Q4_0 GPU' },
  gemmaQatThink: { model: MODELS.gemmaQat, port: 8006, gpu: true, ctx: 8192, label: 'Gemma 4 E2B QAT Q4_0 GPU Thinking', reasoning: 'on', reasoningBudget: 512, reasoningFormat: 'auto' },
  gemmaE4Qat: { model: MODELS.gemmaE4Qat, port: 8004, gpu: true,  ctx: 8192, label: 'Gemma 4 E4B QAT Q4_0 GPU' },
  gemma12Qat: { model: MODELS.gemma12Qat, port: 8005, gpu: true,  ctx: 8192, label: 'Gemma 4 12B QAT Q4_0 GPU' },
  wrGpu:      { model: MODELS.wr,         port: 8001, gpu: true,  ctx: 8192, label: 'WR GPU' },
  wrCpu:      { model: MODELS.wr,         port: 8001, gpu: false, ctx: 8192, label: 'WR CPU' },
  liquid:     { model: MODELS.liquid,     port: 8002, gpu: false, ctx: 8192, label: 'Liquid CPU' },
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
    '--reasoning', p.reasoning || 'off',
    '--reasoning-budget', String(p.reasoningBudget || 0),
    '--reasoning-format', p.reasoningFormat || 'auto',
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

async function query(port: number, systemPrompt: string, userQuery: string, maxTokens = 600, jsonMode = false, timeoutMs = 90000, retries = 3): Promise<any> {
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
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
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
  maxTokens?: number;
}

interface TestResult {
  name: string;
  type: string;
  category: string;
  profile: string;
  modelPath?: string;
  modelSizeGB?: number;
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

function getModelSizeGB(modelPath: string): number {
  try {
    return Math.round((fs.statSync(modelPath).size / 1024 / 1024 / 1024) * 100) / 100;
  } catch {
    return 0;
  }
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
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

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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

  const normalizedText = normalizeForMatch(textForChecks);
  for (const keyword of tc.expectedKeywords || []) {
    if (!normalizedText.includes(normalizeForMatch(keyword))) {
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

function shouldRepairCanvasJson(quality: { flags: string[] }, tc: TestCase): boolean {
  if (tc.expectedResponse !== 'canvas_action_json') return false;
  return quality.flags.some(flag =>
    flag === 'invalid_json' ||
    flag === 'missing_tool_use' ||
    flag === 'tool_without_params' ||
    flag.startsWith('missing_action:')
  );
}

function getSpeedTokS(data: any, completionTokens: number, durationMs: number): number {
  const serverSpeed = data.timings?.predicted_per_second;
  if (typeof serverSpeed === 'number' && Number.isFinite(serverSpeed) && serverSpeed > 0) {
    return Math.round(serverSpeed * 100) / 100;
  }
  if (completionTokens > 0 && durationMs > 0) {
    return Math.round((completionTokens / (durationMs / 1000)) * 100) / 100;
  }
  return 0;
}

function baseResultFields(tc: TestCase): Pick<TestResult, 'modelPath' | 'modelSizeGB'> {
  const profile = PROFILES[tc.profile];
  return {
    modelPath: profile.model,
    modelSizeGB: getModelSizeGB(profile.model)
  };
}

function maxTokensForProfile(tc: TestCase): number {
  const profile = PROFILES[tc.profile];
  return (tc.maxTokens || 600) + (profile.reasoningBudget || 0);
}

function timeoutForMaxTokens(maxTokens: number): number {
  return Math.max(90000, maxTokens * 100);
}

function buildRepairPrompt(tc: TestCase, badResponse: string): string {
  return [
    'Repair the assistant output for NeoPSE.',
    '',
    'Return the corrected final answer only.',
    'If the user request can be executed with the available workspace context, return exactly one valid JSON object with message and tool_use.',
    'If the request cannot be executed safely because required information is missing, return plain text only and do not include JSON or tool_use.',
    'Never output an empty tool_use object.',
    'Escape all quotes and newlines inside JSON strings.',
    '',
    `User request: ${tc.query}`,
    `Expected action when executable: ${tc.expectedAction || 'any valid canvas action'}`,
    '',
    'Invalid previous output:',
    badResponse
  ].join('\n');
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
        ...baseResultFields(tc),
        success: quality.success,
        durationMs: Math.round(elapsed),
        response: JSON.stringify(isToolCall ? msg.tool_calls : msg?.content),
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        speedTokS: getSpeedTokS(data, data.usage?.completion_tokens ?? 0, Math.round(elapsed)),
        isToolCall,
        isJsonValid: true,
        qualityFlags: quality.flags,
        ...mem
      };
    }

    const responseMode = tc.expectedResponse === 'canvas_action_json' ? 'canvas_action_json' : 'tool_awareness';
    const builder = tc.type === 'inline'
      ? new InlinePrompt(mockContext, 'node-1', responseMode)
      : new AssistantPrompt(mockContext, responseMode);
    const systemPrompt = builder.buildSystemPrompt();
    const maxTokens = maxTokensForProfile(tc);
    const data = await query(profile.port, systemPrompt, tc.query, maxTokens, tc.expectedResponse === 'canvas_action_json', timeoutForMaxTokens(maxTokens));
    const elapsed = performance.now() - start;
    let content = data.choices?.[0]?.message?.content ?? '';
    let quality = evaluateTextResponse(content, tc);

    if (shouldRepairCanvasJson(quality, tc)) {
      const repairData = await query(profile.port, systemPrompt, buildRepairPrompt(tc, content), maxTokens, true, timeoutForMaxTokens(maxTokens));
      const repairedContent = repairData.choices?.[0]?.message?.content ?? '';
      const repairedQuality = evaluateTextResponse(repairedContent, tc);
      if (repairedQuality.success || repairedQuality.flags.length <= quality.flags.length) {
        content = repairedContent;
        quality = repairedQuality;
      }
    }

    return {
      name: tc.name, type: tc.type, category: tc.category, profile: tc.profile,
      ...baseResultFields(tc),
      success: quality.success,
      durationMs: Math.round(elapsed),
      response: content,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
      speedTokS: getSpeedTokS(data, data.usage?.completion_tokens ?? 0, Math.round(elapsed)),
      isJsonValid: quality.isJsonValid,
      qualityFlags: quality.flags,
      ...mem
    };
  } catch (err) {
    return {
      name: tc.name, type: tc.type, category: tc.category, profile: tc.profile,
      ...baseResultFields(tc),
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
  const markdown = buildComparisonSummary(results);
  fs.writeFileSync(path.join(BENCHMARK_RESULTS_DIR, 'latest-summary.md'), markdown);
  fs.writeFileSync(path.join(BENCHMARK_RESULTS_DIR, `${timestamp}.md`), markdown);
  console.log(`\nResultados guardados en ${path.relative(ROOT, BENCHMARK_RESULTS_DIR)}\\latest.json`);
  console.log(`Resumen guardado en ${path.relative(ROOT, BENCHMARK_RESULTS_DIR)}\\latest-summary.md`);
}

function countFlag(results: TestResult[], flag: string): number {
  return results.filter(r => r.qualityFlags?.some(f => f === flag || f.startsWith(`${flag}:`))).length;
}

function buildComparisonSummary(results: TestResult[]): string {
  const byProfile = new Map<string, TestResult[]>();
  for (const result of results) {
    const bucket = byProfile.get(result.profile) || [];
    bucket.push(result);
    byProfile.set(result.profile, bucket);
  }

  const lines = [
    '# NeoPSE AI Model Benchmark Summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Profile | Model | Size GB | Pass | Avg ms | P95 ms | Avg tok/s | Invalid JSON | Wrong/missing tool | Request failed |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|'
  ];

  for (const [profile, profileResults] of byProfile.entries()) {
    const first = profileResults[0];
    const passed = profileResults.filter(r => r.success).length;
    const avgMs = Math.round(average(profileResults.map(r => r.durationMs)));
    const p95Ms = Math.round(p95(profileResults.map(r => r.durationMs)));
    const nonZeroSpeeds = profileResults.map(r => r.speedTokS).filter(speed => speed > 0);
    const avgSpeed = Math.round(average(nonZeroSpeeds) * 100) / 100;
    const invalidJson = countFlag(profileResults, 'invalid_json');
    const wrongTool = countFlag(profileResults, 'missing_tool') + countFlag(profileResults, 'missing_tool_call') + countFlag(profileResults, 'unexpected_tool_use');
    const requestFailed = countFlag(profileResults, 'request_failed') + countFlag(profileResults, 'server_not_ready');
    lines.push([
      profile,
      path.basename(first.modelPath || ''),
      String(first.modelSizeGB ?? 0),
      `${passed}/${profileResults.length}`,
      String(avgMs),
      String(p95Ms),
      String(avgSpeed),
      String(invalidJson),
      String(wrongTool),
      String(requestFailed)
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }

  lines.push('', '## Failed Cases', '');
  const failures = results.filter(r => !r.success);
  if (failures.length === 0) {
    lines.push('All cases passed.');
  } else {
    for (const failure of failures) {
      lines.push(`- ${failure.profile} / ${failure.name}: ${(failure.qualityFlags || []).join(', ') || failure.error || 'unknown_error'}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function buildSmokeTests(): TestCase[] {
  return [{
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
}

function readOption(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = args.find(arg => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1];

  return undefined;
}

function buildHistoricalTests(args: string[]): TestCase[] {
  const profile = (readOption(args, 'profile') || 'gemma') as keyof typeof PROFILES;
  const limit = Number(readOption(args, 'limit') || SCENARIOS.length);
  const from = Math.max(1, Number(readOption(args, 'from') || 1));

  if (!PROFILES[profile]) {
    throw new Error(`Perfil invalido: ${profile}. Perfiles: ${Object.keys(PROFILES).join(', ')}`);
  }

  return SCENARIOS
  .slice(from - 1, from - 1 + (Number.isFinite(limit) ? limit : SCENARIOS.length))
  .map((scenario): TestCase => ({
    name: `${profile}-${scenario.name}`,
    query: scenario.q,
    type: scenario.type,
    category: scenario.category,
    profile,
    expectedResponse: scenario.expectedResponse,
    expectedAction: scenario.expectedAction,
    expectedKeywords: scenario.expectedKeywords,
    maxTokens: scenario.expectedResponse === 'assistant_text' ? 260 : 700
  }));
}

function buildComparisonTests(args: string[]): TestCase[] {
  const profilesArg = readOption(args, 'profiles') || 'gemma,gemmaQat';
  const profiles = profilesArg.split(/[,\s]+/).map(p => p.trim()).filter(Boolean) as Array<keyof typeof PROFILES>;
  const limit = Number(readOption(args, 'limit') || SCENARIOS.length);
  const from = Math.max(1, Number(readOption(args, 'from') || 1));

  for (const profile of profiles) {
    if (!PROFILES[profile]) {
      throw new Error(`Perfil invalido: ${profile}. Perfiles: ${Object.keys(PROFILES).join(', ')}`);
    }
  }

  const scenarios = SCENARIOS.slice(from - 1, from - 1 + (Number.isFinite(limit) ? limit : SCENARIOS.length));
  return profiles.flatMap(profile =>
    scenarios.map((scenario): TestCase => ({
      name: `${profile}-${scenario.name}`,
      query: scenario.q,
      type: scenario.type,
      category: scenario.category,
      profile,
      expectedResponse: scenario.expectedResponse,
      expectedAction: scenario.expectedAction,
      expectedKeywords: scenario.expectedKeywords,
      maxTokens: scenario.expectedResponse === 'assistant_text' ? 260 : 700
    }))
  );
}

async function runTests(tests: TestCase[]): Promise<void> {
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
          ...baseResultFields(tc),
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
    await runTests(buildSmokeTests());
    return;
  }

  if (mode === 'historical') {
    await runTests(buildHistoricalTests(args.slice(1)));
    return;
  }

  if (mode === 'compare') {
    await runTests(buildComparisonTests(args.slice(1)));
    return;
  }

  console.log('Uso: npx tsx scripts/debugger-llm.ts [benchmark|historical|compare|toolcall|server] [profile]');
  console.log('  benchmark        - ejecuta todos los tests');
  console.log('  historical       - ejecuta los 50 escenarios historicos');
  console.log('  historical --from N --limit N --profile gemma|gemmaQat|gemmaQatThink|gemmaE4Qat|gemma12Qat|wrCpu|wrGpu|liquid');
  console.log('  compare --profiles gemmaQat,gemmaQatThink --from N --limit N');
  console.log('  toolcall [port]  - prueba tool calling de Gemma');
  console.log('  server <perfil>  - inicia server de un perfil');
  console.log('  Perfiles: ' + Object.keys(PROFILES).join(', '));
}

main().catch(e => {
  console.error('FAIL', e);
  killServers();
  process.exit(1);
});
