import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export interface ExecutionSnapshot {
  id?: number;
  timestamp: string;
  successRate: number;
  avgLatency: number;
}

export interface TestResult {
  id?: number;
  snapshotId: number;
  query: string;
  category: string;
  durationMs: number;
  isTool: boolean;
  isPseint: boolean;
  responseText: string;
  systemPrompt: string;
  freeMemGB: number;
  totalMemGB: number;
  serviceType: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  contextSizeChars?: number;
  errorMessage?: string;
  isJsonValid?: boolean;
}

export class MetricDatabase {
  private db: Database.Database;

  constructor() {
    const dataDir = path.resolve('src/ai/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'benchmarks.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_tests INTEGER,
        passed_tests INTEGER,
        avg_latency_ms INTEGER
      );

      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER,
        query TEXT,
        category TEXT,
        duration_ms INTEGER,
        is_tool INTEGER,
        is_pseint INTEGER,
        response_text TEXT,
        system_prompt TEXT,
        free_mem_gb INTEGER,
        total_mem_gb INTEGER,
        service_type TEXT,
        FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
      );
    `);

    // Migración dinámica de columnas para telemetría extendida
    const tableInfo = this.db.prepare("PRAGMA table_info(test_results)").all() as any[];
    const existingColumns = tableInfo.map(col => col.name);

    const newColumns: { name: string, type: string }[] = [
      { name: 'prompt_tokens', type: 'INTEGER' },
      { name: 'completion_tokens', type: 'INTEGER' },
      { name: 'total_tokens', type: 'INTEGER' },
      { name: 'context_size_chars', type: 'INTEGER' },
      { name: 'error_message', type: 'TEXT' },
      { name: 'is_json_valid', type: 'INTEGER' }
    ];

    newColumns.forEach(col => {
      if (!existingColumns.includes(col.name)) {
        this.db.exec(`ALTER TABLE test_results ADD COLUMN ${col.name} ${col.type}`);
      }
    });
  }

  public saveSnapshot(totalTests: number, passedTests: number, avgLatency: number): number {
    const stmt = this.db.prepare(`
      INSERT INTO snapshots (total_tests, passed_tests, avg_latency_ms)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(totalTests, passedTests, avgLatency);
    return info.lastInsertRowid as number;
  }

  public saveTestResult(result: Omit<TestResult, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT INTO test_results (
        snapshot_id, query, category, duration_ms, is_tool, is_pseint, 
        response_text, system_prompt, free_mem_gb, total_mem_gb, service_type,
        prompt_tokens, completion_tokens, total_tokens, context_size_chars,
        error_message, is_json_valid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      result.snapshotId,
      result.query,
      result.category,
      result.durationMs,
      result.isTool ? 1 : 0,
      result.isPseint ? 1 : 0,
      result.responseText,
      result.systemPrompt,
      result.freeMemGB,
      result.totalMemGB,
      result.serviceType,
      result.promptTokens || null,
      result.completionTokens || null,
      result.totalTokens || null,
      result.contextSizeChars || null,
      result.errorMessage || null,
      result.isJsonValid === undefined ? null : (result.isJsonValid ? 1 : 0)
    );
  }

  public getSnapshots(): ExecutionSnapshot[] {
    const stmt = this.db.prepare(`
      SELECT id, created_at, total_tests, passed_tests, avg_latency_ms FROM snapshots ORDER BY created_at DESC
    `);
    const rows = stmt.all() as { id: number, created_at: string, total_tests: number, passed_tests: number, avg_latency_ms: number }[];
    return rows.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      successRate: row.total_tests > 0 ? (row.passed_tests / row.total_tests) : 0,
      avgLatency: row.avg_latency_ms
    }));
  }
}
