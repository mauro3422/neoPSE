import { GraphParser, ExecutionStep } from "./GraphParser";
import { BlockType } from "../types";
import { ChatContextState } from "./ChatContextState";

export interface AIPackage {
  globalNotes: string[];
  executionSequence: ExecutionStep[];
  hasImplementation: boolean;
  selectedContextIds: string[];
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

    return {
      globalNotes,
      executionSequence: steps,
      hasImplementation,
      selectedContextIds: ChatContextState.getSelectedIds()
    };
  }
}
