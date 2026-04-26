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
        const type = args.type as BlockType;
        const content = args.content || "";
        const x = typeof args.x === 'number' ? args.x : 200;
        const y = typeof args.y === 'number' ? args.y : 200;
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
        const { blockId, content } = args;
        const block = blockManager.getBlocks().find(b => b.serialize().id === blockId);
        if (block) {
          const el = document.getElementById(blockId);
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
        relationshipManager.addLink(args.fromId, args.toId);
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
        blockManager.deleteBlock(args.blockId);
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
    const regex = /\{\s*"tool_use"\s*:\s*\{\s*"action"\s*:\s*"([^"]+)"\s*,\s*"params"\s*:\s*(\{[\s\S]*?\})\s*\}\s*\}/;
    const match = response.match(regex);
    if (match) {
      const action = match[1];
      try {
        const params = JSON.parse(match[2]);
        const success = this.executeTool(action, params);
        if (success) {
          return response.replace(match[0], `\n⚡ *[Herramienta Ejecutada: ${action}]*`);
        }
      } catch (e) {}
    }
    return response;
  }
}
