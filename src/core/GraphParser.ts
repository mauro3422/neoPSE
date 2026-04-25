import { workspaceState } from "./state/WorkspaceState";
import { BlockType } from "../types";

export interface ExecutionStep {
  blockId: string;
  type: BlockType;
  content: string;
}

/**
 * Lector de Grafos: Convierte el mapa visual en un flujo secuencial.
 */
export class GraphParser {
  private static getAllBlocks(blocks: any[]): any[] {
    let result: any[] = [];
    blocks.forEach(b => {
      result.push(b);
      if (b.children && Array.isArray(b.children)) {
        result = result.concat(this.getAllBlocks(b.children));
      }
    });
    return result;
  }

  /**
   * Ordena los bloques del tablero en una secuencia lógica de ejecución usando Ordenamiento Topológico.
   */
  public static parseExecutionFlow(): ExecutionStep[] {
    const data = workspaceState.getData();
    const blocks = this.getAllBlocks(data.blocks);
    const links = [...data.links];

    // Incluir links internos de carpetas
    data.blocks.forEach((b: any) => {
      if (b.childLinks && Array.isArray(b.childLinks)) {
        links.push(...b.childLinks);
      }
    });

    // 1. Construir Lista de Adyacencia y Grados de Entrada
    const adjList: Map<string, string[]> = new Map();
    const inDegree: Map<string, number> = new Map();

    blocks.forEach(b => {
      adjList.set(b.id, []);
      inDegree.set(b.id, 0);
    });

    links.forEach(l => {
      if (adjList.has(l.fromId) && adjList.has(l.toId)) {
        adjList.get(l.fromId)!.push(l.toId);
        inDegree.set(l.toId, (inDegree.get(l.toId) || 0) + 1);
      }
    });

    // 2. Encontrar nodos de inicio (In-degree = 0)
    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    // Fallback: Si no hay nodos con grado 0 (ciclo cerrado), tomar el primero
    if (queue.length === 0 && blocks.length > 0) {
      queue.push(blocks[0].id);
    }

    const orderedIds: string[] = [];

    // 3. Algoritmo de Kahn
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      orderedIds.push(currentId);

      const neighbors = adjList.get(currentId) || [];
      neighbors.forEach(neighborId => {
        const newDegree = inDegree.get(neighborId)! - 1;
        inDegree.set(neighborId, newDegree);
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      });
    }

    // 4. Mapear a Pasos de Ejecución
    return orderedIds.map(id => {
      const block = blocks.find(b => b.id === id)!;
      return {
        blockId: id,
        type: block.type,
        content: block.content || ""
      };
    });
  }
}
