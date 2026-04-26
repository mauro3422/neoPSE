import { workspaceState } from "./state/WorkspaceState";
import { BlockType, BlockData } from "../types";
import { blockManager } from "./BlockManager";

export interface ExecutionStep {
  blockId: string;
  title: string;
  type: BlockType;
  content: string;
  position?: { x: number, y: number };
}

/**
 * Lector de Grafos: Convierte el mapa visual en un flujo secuencial.
 */
export class GraphParser {
  private static getAllBlocks(blocks: BlockData[]): BlockData[] {
    let result: BlockData[] = [];
    blocks.forEach(b => {
      result.push(b);
      const folder = b as any;
      if (folder.children && Array.isArray(folder.children)) {
        result = result.concat(this.getAllBlocks(folder.children));
      }
    });
    return result;
  }

  /**
   * Ordena los bloques del tablero en una secuencia lógica de ejecución usando Ordenamiento Topológico.
   */
  public static parseExecutionFlow(): ExecutionStep[] {
    const liveBlocks = blockManager.getBlocks().map(b => b.serialize());
    const blocks = this.getAllBlocks(liveBlocks);
    const data = workspaceState.getData();
    const links = [...data.links];

    // Incluir links internos de carpetas
    data.blocks.forEach((b) => {
      const folder = b as any;
      if (folder.childLinks && Array.isArray(folder.childLinks)) {
        links.push(...folder.childLinks);
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
        title: block.title || "Bloque",
        type: block.type,
        content: block.content || "",
        position: block.position
      };
    });
  }
}
