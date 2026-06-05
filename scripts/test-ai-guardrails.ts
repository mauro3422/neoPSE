import assert from 'node:assert/strict';
import { AssistantPrompt, InlinePrompt } from '../src/core/PromptBuilder';
import { AIPackage } from '../src/core/ContextPacker';
import { validateToolUse, wantsCanvasAction } from '../src/core/AIResponseGuardrails';

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

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run('cancel generation is not treated as a canvas action', () => {
  assert.equal(wantsCanvasAction('Cancela la orden de generacion de bloques actual.'), false);
});

run('direct creation is treated as a canvas action', () => {
  assert.equal(wantsCanvasAction('Crea un bloque de pseudocodigo.'), true);
});

run('placeholder create_block is blocked', () => {
  const result = validateToolUse('Extrae una porcion de codigo a un nuevo bloque modular.', undefined, {
    action: 'create_block',
    params: { type: 'pseudocode', content: 'Esperando especificacion del usuario' }
  });
  assert.equal(result.ok, false);
});

run('cancel does not clear workspace', () => {
  const result = validateToolUse('Cancela la orden de generacion de bloques actual.', undefined, {
    action: 'clear_workspace',
    params: {}
  });
  assert.equal(result.ok, false);
});

run('explicit clear workspace is allowed', () => {
  const result = validateToolUse('Limpia el espacio de trabajo eliminando todos los bloques existentes.', undefined, {
    action: 'clear_workspace',
    params: {}
  });
  assert.equal(result.ok, true);
});

run('inline create_block is rewritten into edit_block_content', () => {
  const result = validateToolUse('Agrega comentarios dentro del bloque.', 'node-1', {
    action: 'create_block',
    params: { type: 'pseudocode', content: 'Definir X = 50\n// Comentario' }
  });
  assert.equal(result.ok, true);
  assert.equal(result.toolUse?.action, 'edit_block_content');
  assert.equal(result.toolUse?.params?.blockId, 'node-1');
});

run('inline non-edit actions are blocked', () => {
  const result = validateToolUse('Conecta este bloque con otro.', 'node-1', {
    action: 'link_blocks',
    params: { fromId: 'node-1', toId: 'node-2' }
  });
  assert.equal(result.ok, false);
});

run('incomplete Para loop edit is blocked', () => {
  const result = validateToolUse('Corrige este codigo roto.', 'node-1', {
    action: 'edit_block_content',
    params: { blockId: 'node-1', content: 'Para i=1 Hasta 10 Hacer\n  Escribir i' }
  });
  assert.equal(result.ok, false);
});

run('complete Para loop edit is allowed', () => {
  const result = validateToolUse('Corrige este codigo roto.', 'node-1', {
    action: 'edit_block_content',
    params: { blockId: 'node-1', content: 'Para i=1 Hasta 10 Hacer\n  Escribir i\nFinPara' }
  });
  assert.equal(result.ok, true);
});

run('tool awareness prompt includes catalog but not executable schema', () => {
  const prompt = new AssistantPrompt(mockContext, 'tool_awareness').buildSystemPrompt();
  assert.match(prompt, /Workspace tool catalog reference/);
  assert.doesNotMatch(prompt, /Executable canvas action schema/);
  assert.doesNotMatch(prompt, /Required JSON structure/);
});

run('canvas action prompt includes executable schema', () => {
  const prompt = new AssistantPrompt(mockContext, 'canvas_action_json').buildSystemPrompt();
  assert.match(prompt, /Workspace tool catalog reference/);
  assert.match(prompt, /Executable canvas action schema/);
  assert.match(prompt, /Required JSON structure/);
});

run('inline prompt supports executable edit schema', () => {
  const prompt = new InlinePrompt(mockContext, 'node-1', 'canvas_action_json').buildSystemPrompt();
  assert.match(prompt, /Block ID: \[node-1\]/);
  assert.match(prompt, /edit_block_content/);
  assert.match(prompt, /Executable canvas action schema/);
});
