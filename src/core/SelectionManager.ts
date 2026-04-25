import { IDE_CONFIG } from "./Config";

export class SelectionManager {
  private static activeBlock: HTMLElement | null = null;

  public static select(el: HTMLElement) {
    if (this.activeBlock === el) return;

    // Deseleccionar anterior
    if (this.activeBlock) {
      this.activeBlock.classList.remove('is-selected');
      this.activeBlock.style.zIndex = IDE_CONFIG.UI.Z_INDEX_BLOCK_INACTIVE.toString();
    }

    // Seleccionar nuevo
    this.activeBlock = el;
    this.activeBlock.classList.add('is-selected');
    this.activeBlock.style.zIndex = IDE_CONFIG.UI.Z_INDEX_BLOCK_ACTIVE.toString();
  }

  public static clear() {
    if (this.activeBlock) {
      this.activeBlock.classList.remove('is-selected');
      this.activeBlock.style.zIndex = IDE_CONFIG.UI.Z_INDEX_BLOCK_INACTIVE.toString();
      this.activeBlock = null;
    }
  }

  public static getSelected(): HTMLElement | null {
    return this.activeBlock;
  }
}
