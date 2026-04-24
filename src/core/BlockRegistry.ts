import { BlockType } from "../types";
import { Block } from "../components/Block";
import { EditorBlock, NoteBlock } from "../components/SpecializedBlocks";

interface BlockDefinition {
  type: BlockType;
  title: string;
  className: string;
  structureHtml: string; // El esqueleto físico del contenido
  controller: new (selector: string | HTMLElement) => Block;
}

export class BlockRegistry {
  private static definitions: Map<BlockType, BlockDefinition> = new Map();

  public static register(def: BlockDefinition) {
    this.definitions.set(def.type, def);
  }

  public static getDefinition(type: BlockType): BlockDefinition | undefined {
    return this.definitions.get(type);
  }
}

// Registro centralizado: Ahora el registro es el DUEÑO de cómo se ve el bloque
BlockRegistry.register({
  type: BlockType.PSEUDOCODE,
  title: 'Nueva Función',
  className: 'editor-block',
  structureHtml: '<div class="pseudocode" contenteditable="true">Algoritmo NuevaFuncion\n  // Escribe aquí...\nFinAlgoritmo</div>',
  controller: EditorBlock
});

BlockRegistry.register({
  type: BlockType.NOTE,
  title: 'Nota',
  className: 'notes-block',
  structureHtml: '<textarea class="notes-area" placeholder="Escribe algo..."></textarea>',
  controller: NoteBlock
});
