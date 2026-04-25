import { blockManager } from "./BlockManager";
import { ChatContextState } from "./ChatContextState";

/**
 * Gestiona el menú contextual unificado para todos los bloques.
 */
export class ContextMenuManager {
  private static menuEl: HTMLElement | null = null;
  private static currentBlockId: string | null = null;
  private static renameOpt: HTMLElement | null = null;

  public static init() {
    if (this.menuEl) return;

    this.menuEl = document.createElement('div');
    this.menuEl.className = 'context-menu';
    this.menuEl.style.display = 'none';
    
    // Crear opciones estáticas una sola vez
    const askAiOpt = document.createElement('div');
    askAiOpt.className = 'context-menu-item';
    askAiOpt.innerHTML = '🤖 Preguntar a IA (Inline)';
    askAiOpt.onclick = (e) => {
      e.stopPropagation();
      this.triggerInlineAI();
    };
    this.menuEl.appendChild(askAiOpt);

    const addCtxOpt = document.createElement('div');
    addCtxOpt.className = 'context-menu-item';
    addCtxOpt.innerHTML = '💬 Añadir al Contexto';
    addCtxOpt.onclick = (e) => {
      e.stopPropagation();
      this.addToChatContext();
    };
    this.menuEl.appendChild(addCtxOpt);

    const divider = document.createElement('div');
    divider.className = 'context-menu-divider';
    this.menuEl.appendChild(divider);

    this.renameOpt = document.createElement('div');
    this.renameOpt.className = 'context-menu-item';
    this.renameOpt.innerHTML = '✏️ Renombrar';
    this.renameOpt.onclick = (e) => {
      e.stopPropagation();
      this.triggerRename();
    };
    this.menuEl.appendChild(this.renameOpt);

    const deleteOpt = document.createElement('div');
    deleteOpt.className = 'context-menu-item delete-item';
    deleteOpt.innerHTML = '🗑️ Eliminar';
    deleteOpt.onclick = (e) => {
      e.stopPropagation();
      this.deleteBlock();
    };
    this.menuEl.appendChild(deleteOpt);

    document.body.appendChild(this.menuEl);

    // Eventos globales robustos
    window.addEventListener('click', () => this.hide());
    window.addEventListener('contextmenu', () => this.hide());
  }

  public static show(blockId: string, x: number, y: number, isFolder: boolean = false) {
    this.init();
    this.currentBlockId = blockId;

    if (!this.menuEl) return;

    // Mostrar/Ocultar Renombrar
    if (this.renameOpt) {
      this.renameOpt.style.display = isFolder ? 'flex' : 'none';
    }

    this.menuEl.style.left = `${x}px`;
    this.menuEl.style.top = `${y}px`;
    this.menuEl.style.display = 'flex';
  }

  public static hide() {
    if (this.menuEl) this.menuEl.style.display = 'none';
  }

  private static triggerInlineAI() {
    this.hide();
    console.log(`[AI] Preguntando inline para el bloque ${this.currentBlockId}`);
    // TODO: Implementar overlay de pregunta
  }

  private static addToChatContext() {
    this.hide();
    if (this.currentBlockId) {
      ChatContextState.add(this.currentBlockId);
    }
  }

  private static triggerRename() {
    this.hide();
    if (!this.currentBlockId) return;
    const block = blockManager.getBlock(this.currentBlockId);
    if (block && 'enableRenaming' in block) {
      (block as any).enableRenaming();
    }
  }

  private static deleteBlock() {
    this.hide();
    if (!this.currentBlockId) return;
    const block = blockManager.getBlock(this.currentBlockId);
    if (block) block.destroy();
  }
}
