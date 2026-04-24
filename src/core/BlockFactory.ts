import { BlockType } from "../types";
import { BlockRegistry } from "./BlockRegistry";

export class BlockFactory {
  /**
   * Crea un bloque inyectando toda la lógica definida en el Registry.
   */
  public static createBlock(type: BlockType, x: number, y: number, id?: string): HTMLElement | null {
    const definition = BlockRegistry.getDefinition(type);
    if (!definition) return null;

    const finalId = id || `block_${Math.random().toString(36).substr(2, 9)}`;
    const el = document.createElement('div');
    el.id = finalId;
    el.classList.add('world-block', 'block', definition.className);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = definition.structureHtml;

    if (definition.useHeader) {
      this.injectHeader(el, definition.title);
    }

    return el;
  }

  private static injectHeader(el: HTMLElement, title: string) {
    const header = document.createElement('div');
    header.className = 'block-header';
    header.innerHTML = `
      <span class="block-title">${title}</span>
      <div class="block-actions">
        <button class="block-btn link-btn" title="Conectar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        </button>
        <button class="block-btn close-btn" title="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `;
    el.prepend(header);
  }
}
