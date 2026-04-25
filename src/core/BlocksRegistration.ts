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
    structureHtml: `
      <div class="folder-inner">
        <svg class="folder-icon" viewBox="0 0 24 24">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="folder-label">Módulo</span>
      </div>
    `,
    controller: FolderBlock,
    useHeader: false,
    useResizer: false,
    mass: 2.0
  });
}
