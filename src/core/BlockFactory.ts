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
    el.classList.add('world-block', definition.className);
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
        <button class="block-btn delete-btn">×</button>
      </div>
    `;
    el.prepend(header);
  }
}
