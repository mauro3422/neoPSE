import { BlockRegistry } from "./BlockRegistry";
import { BlockType } from "../types";
import { EditorBlock, NoteBlock, FolderBlock } from "../components/SpecializedBlocks";

export function initBlockRegistry() {
  BlockRegistry.register({
    type: BlockType.PSEUDOCODE,
    title: 'Nueva Función',
    className: 'editor-block',
    structureHtml: '<div class="pseudocode" contenteditable="true">Algoritmo NuevaFuncion\n  // Escribe aquí...\nFinAlgoritmo</div>',
    controller: EditorBlock,
    useHeader: true,
    useResizer: true
  });

  BlockRegistry.register({
    type: BlockType.NOTE,
    title: 'Nota',
    className: 'notes-block',
    structureHtml: '<textarea class="notes-area" placeholder="Escribe algo..."></textarea>',
    controller: NoteBlock,
    useHeader: true,
    useResizer: true
  });

  BlockRegistry.register({
    type: BlockType.FOLDER,
    title: 'Módulo / Carpeta',
    className: 'folder-block',
    structureHtml: `
      <div class="folder-inner">
        <svg viewBox="0 0 24 24" class="folder-icon">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <span class="folder-label">Módulo</span>
      </div>
    `,
    controller: FolderBlock,
    useHeader: false,
    useResizer: false
  });
}
