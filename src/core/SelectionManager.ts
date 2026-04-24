import { APP_CONFIG } from "./Constants";

export class SelectionManager {
  private static activeBlock: HTMLElement | null = null;

  public static select(el: HTMLElement) {
    if (this.activeBlock === el) return;

    // Deseleccionar anterior
    if (this.activeBlock) {
      this.activeBlock.classList.remove('is-selected');
      this.activeBlock.style.zIndex = APP_CONFIG.Z_INDEX_BLOCK_INACTIVE;
    }

    // Seleccionar nuevo
    this.activeBlock = el;
    this.activeBlock.classList.add('is-selected');
    this.activeBlock.style.zIndex = APP_CONFIG.Z_INDEX_BLOCK_ACTIVE;
  }

  public static clear() {
    if (this.activeBlock) {
      this.activeBlock.classList.remove('is-selected');
      this.activeBlock.style.zIndex = APP_CONFIG.Z_INDEX_BLOCK_INACTIVE;
      this.activeBlock = null;
    }
  }
}
