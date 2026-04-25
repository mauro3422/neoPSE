import { GraphParser, ExecutionStep } from "./GraphParser";
import { BlockType } from "../types";
import { ChatContextState } from "./ChatContextState";
import { blockManager } from "./BlockManager";

export interface AIPackage {
  globalNotes: string[];
  executionSequence: ExecutionStep[];
  hasImplementation: boolean;
  selectedContextIds: string[];
  allBlocks: ExecutionStep[];
}

/**
 * Empaquetador de Contexto: Traduce el grafo a un payload estructurado para la IA.
 */
export class ContextPacker {
  /**
   * Genera el paquete de datos unificado basado en el estado actual del tablero.
   */
  public static pack(): AIPackage {
    const steps = GraphParser.parseExecutionFlow();
    
    const globalNotes: string[] = [];
    let hasImplementation = false;

    steps.forEach(step => {
      if (step.type === BlockType.NOTE) {
        globalNotes.push(step.content);
      }
      if (step.type === BlockType.PSEUDOCODE) {
        hasImplementation = true;
      }
    });

    const liveBlocks = blockManager.getBlocks().map((b: any) => {
      const data = b.serialize();
      return {
        blockId: data.id,
        type: data.type,
        content: b.getContent() || data.content || ""
      };
    });

    return {
      globalNotes,
      executionSequence: steps,
      hasImplementation,
      selectedContextIds: ChatContextState.getSelectedIds(),
      allBlocks: liveBlocks
    };
  }
}
