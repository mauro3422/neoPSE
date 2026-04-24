import { BlockType } from "../types";
import type { Block } from "../components/Block";

interface BlockDefinition {
  type: BlockType;
  title: string;
  className: string;
  structureHtml: string; // El esqueleto físico del contenido
  controller: new (selector: string | HTMLElement) => Block;
  useHeader?: boolean;
  useResizer?: boolean;
  mass: number;
}

export class BlockRegistry {
  private static definitions: Map<BlockType, BlockDefinition> = new Map();

  public static register(def: BlockDefinition) {
    this.definitions.set(def.type, def);
  }

  public static getDefinition(type: BlockType): BlockDefinition | undefined {
    return this.definitions.get(type);
  }

  public static getAllDefinitions(): BlockDefinition[] {
    return Array.from(this.definitions.values());
  }
}

