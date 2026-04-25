import { blockManager } from "./BlockManager";
import { ChatContextState } from "./ChatContextState";

/**
 * Gestiona el menú contextual unificado para todos los bloques.
 */
export class ContextMenuManager {
  private static menuEl: HTMLElement | null = null;
  private static currentBlockId: string | null = null;

  public static init() {
    // Buscar si ya existe en el DOM para evitar duplicados por recargas HMR
    const existing = document.querySelector('.context-menu') as HTMLElement;
    if (existing) {
      this.menuEl = existing;
    } else {
      this.menuEl = document.createElement('div');
      this.menuEl.className = 'context-menu';
      this.menuEl.style.display = 'none';
      document.body.appendChild(this.menuEl);
    }
  }

  public static show(blockId: string, x: number, y: number, isFolder: boolean = false) {
    this.init();
    this.currentBlockId = blockId;

    if (!this.menuEl) return;

    // Limpiar contenido previo SIEMPRE para evitar duplicación de opciones
    this.menuEl.innerHTML = '';

    // 1. Opción: Preguntar a IA (Inline)
    const askAiOpt = document.createElement('div');
    askAiOpt.className = 'context-menu-item';
    askAiOpt.innerHTML = '🤖 Preguntar a IA (Inline)';
    askAiOpt.onclick = (e) => {
      e.stopPropagation();
      this.triggerInlineAI();
    };
    this.menuEl.appendChild(askAiOpt);

    // 2. Opción: Añadir al Contexto
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

    // 3. Opción: Renombrar (Solo carpetas)
    if (isFolder) {
      const renameOpt = document.createElement('div');
      renameOpt.className = 'context-menu-item';
      renameOpt.innerHTML = '✏️ Renombrar';
      renameOpt.onclick = (e) => {
        e.stopPropagation();
        this.triggerRename();
      };
      this.menuEl.appendChild(renameOpt);
    }

    // 4. Opción: Eliminar
    const deleteOpt = document.createElement('div');
    deleteOpt.className = 'context-menu-item delete-item';
    deleteOpt.innerHTML = '🗑️ Eliminar';
    deleteOpt.onclick = (e) => {
      e.stopPropagation();
      this.deleteBlock();
    };
    this.menuEl.appendChild(deleteOpt);

    this.menuEl.style.left = `${x}px`;
    this.menuEl.style.top = `${y}px`;
    this.menuEl.style.display = 'flex';

    // Eventos globales para cerrar (Se reasignan sin duplicar)
    window.onclick = () => this.hide();
    window.oncontextmenu = () => this.hide();
  }

  public static hide() {
    if (this.menuEl) this.menuEl.style.display = 'none';
  }

  private static triggerInlineAI() {
    this.hide();
    console.log(`[AI] Preguntando inline para el bloque ${this.currentBlockId}`);
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
