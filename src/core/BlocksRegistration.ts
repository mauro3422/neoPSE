import { BlockType } from "../types";
import { BlockRegistry } from "./BlockRegistry";
import { PseudocodeBlock, NoteBlock, FolderBlock } from "../components/SpecializedBlocks";

export function initBlockRegistry() {
  BlockRegistry.register({
    type: BlockType.PSEUDOCODE,
    title: 'Lógica',
    className: 'logic-block',
    structureHtml: '<div class="code-area" contenteditable="true"></div>',
    controller: PseudocodeBlock,
    useHeader: true,
    mass: 1.2
  });

  BlockRegistry.register({
    type: BlockType.NOTE,
    title: 'Nota',
    className: 'note-block',
    structureHtml: '<textarea class="note-input" placeholder="Escribe aquí..."></textarea>',
    controller: NoteBlock,
    useHeader: true,
    mass: 0.5
  });

  BlockRegistry.register({
    type: BlockType.FOLDER,
    title: 'Módulo',
    className: 'folder-block',
    structureHtml: '<div class="folder-icon">📁</div>',
    controller: FolderBlock,
    useHeader: false,
    useResizer: false,
    mass: 2.0
  });
}
