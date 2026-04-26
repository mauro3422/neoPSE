import { eventBus, AppEvents } from "./EventEmitter";
import { blockManager } from "./BlockManager";
import { relationshipManager } from "./RelationshipManager";
import { BlockType } from "../types";

export interface AITool {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any) => void;
}

/**
 * Caja de Herramientas de IA: Ejecuta acciones en el lienzo solicitadas por el LLM.
 */
export class AIToolbox {
  private static tools: Map<string, AITool> = new Map();

  private static resolveBlockId(id: string): string {
    const blocks = blockManager.getBlocks().map((b: any) => b.serialize());
    
    // 1. Si el ID es real, retornarlo
    if (blocks.find(b => b.id === id)) return id;

    // 2. Resolver alias estilo "node-1" o "bloque-2"
    const typeMatch = id.match(/(pseudocode|note|folder|node|bloque)[\-_]?(\d+)/i);
    if (typeMatch) {
      const index = parseInt(typeMatch[2], 10) - 1;
      const requestedType = typeMatch[1].toLowerCase();
      
      if (requestedType === 'node' || requestedType === 'bloque') {
        if (blocks[index]) return blocks[index].id;
      } else {
        const typeMap: Record<string, string> = {
          'pseudocode': 'pseudocode',
          'note': 'note',
          'folder': 'folder'
        };
        const mappedType = typeMap[requestedType];
        if (mappedType) {
          const typedBlocks = blocks.filter(b => b.type === mappedType);
          if (typedBlocks[index]) return typedBlocks[index].id;
        }
      }
    }

    // 3. Fallback: Buscar por coincidencia parcial de contenido
    const matchByContent = blocks.find(b => 
      b.content.toLowerCase().includes(id.toLowerCase()) || 
      id.toLowerCase().includes(b.content.toLowerCase())
    );
    if (matchByContent) return matchByContent.id;

    return id;
  }

  public static init() {
    this.tools.clear();

    this.registerTool({
      name: "create_block",
      description: "Crea un nuevo bloque de lógica, nota o módulo en el lienzo.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["pseudocode", "note", "folder"] },
          content: { type: "string" },
          x: { type: "number" },
          y: { type: "number" }
        },
        required: ["type"]
      },
      execute: (args: any) => {
        let type = args.type as BlockType;
        if (!type || !['pseudocode', 'note', 'folder'].includes(type)) {
          const looksLikeCode = args.content && (args.content.includes('=') || args.content.includes('si ') || args.content.includes('para '));
          type = looksLikeCode ? 'pseudocode' as BlockType : 'note' as BlockType;
        }
        const content = args.content || "";
        const x = typeof args.x === 'number' ? args.x : Math.floor(Math.random() * 300) + 150;
        const y = typeof args.y === 'number' ? args.y : Math.floor(Math.random() * 300) + 150;
        const id = `${type}_${Math.random().toString(36).substr(2, 9)}`;
        
        eventBus.emit(AppEvents.BLOCK_CREATED, {
          type,
          position: { x, y },
          id,
          content
        });
      }
    });

    this.registerTool({
      name: "edit_block_content",
      description: "Edita el texto o pseudocódigo interno de un bloque existente.",
      parameters: {
        type: "object",
        properties: {
          blockId: { type: "string" },
          content: { type: "string" }
        },
        required: ["blockId", "content"]
      },
      execute: (args: any) => {
        const realId = this.resolveBlockId(args.blockId);
        const { content } = args;
        const block = blockManager.getBlocks().find(b => b.serialize().id === realId);
        if (block) {
          const el = document.getElementById(realId);
          const editor = el?.querySelector('.code-area') || el?.querySelector('.note-input');
          if (editor) {
            editor.textContent = content;
            if (editor.tagName === 'TEXTAREA') {
              (editor as HTMLTextAreaElement).value = content;
            }
          }
          // @ts-ignore
          if (typeof block.syncState === 'function') {
            // @ts-ignore
            block.syncState(content);
          }
        }
      }
    });

    this.registerTool({
      name: "link_blocks",
      description: "Enlaza dos bloques secuencialmente (desde -> hacia).",
      parameters: {
        type: "object",
        properties: {
          fromId: { type: "string" },
          toId: { type: "string" }
        },
        required: ["fromId", "toId"]
      },
      execute: (args: any) => {
        const fromRealId = this.resolveBlockId(args.fromId);
        const toRealId = this.resolveBlockId(args.toId);
        relationshipManager.addLink(fromRealId, toRealId);
      }
    });

    this.registerTool({
      name: "delete_block",
      description: "Elimina un bloque del espacio de trabajo.",
      parameters: {
        type: "object",
        properties: {
          blockId: { type: "string" }
        },
        required: ["blockId"]
      },
      execute: (args: any) => {
        const realId = this.resolveBlockId(args.blockId);
        blockManager.deleteBlock(realId);
      }
    });

    this.registerTool({
      name: "clear_workspace",
      description: "Elimina TODOS los bloques del lienzo para dejarlo completamente vacío.",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: () => {
        const blocks = [...blockManager.getBlocks()];
        blocks.forEach(b => blockManager.deleteBlock(b.serialize().id));
      }
    });
  }

  public static registerTool(tool: AITool) {
    this.tools.set(tool.name, tool);
  }

  public static getToolDefinitions() {
    const defs: any[] = [];
    this.tools.forEach(t => {
      defs.push({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      });
    });
    return defs;
  }

  public static executeTool(name: string, args: any): boolean {
    const tool = this.tools.get(name);
    if (tool) {
      try {
        tool.execute(args);
        return true;
      } catch (e) {
        console.error(`[AIToolbox] Error ejecutando ${name}:`, e);
      }
    }
    return false;
  }

  public static parseAndExecute(response: string): string {
    const regex = /\{\s*"tool_use"\s*:\s*\{\s*"action"\s*:\s*"([^"]+)"\s*,\s*"params"\s*:\s*(\{[\s\S]*?\})\s*\}\s*\}/g;
    let modifiedResponse = response;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      const action = match[1];
      try {
        const params = JSON.parse(match[2]);
        const success = this.executeTool(action, params);
        if (success) {
          modifiedResponse = modifiedResponse.replace(match[0], `\n⚡ *[Acción ejecutada correctamente: ${action}]*`);
        }
      } catch (e) {
        console.error("[AIToolbox] Error parseando parámetros JSON:", e);
      }
    }
    return modifiedResponse;
  }
}
