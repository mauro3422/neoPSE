import { BlockRegistry } from "./BlockRegistry";
import { BlockType } from "../types";

export class BlockFactory {
  private static readonly TEMPLATE_HEADER = (title: string) => `
    <div class="block-header">
      <span class="block-title">${title}</span>
      <div class="header-actions">
        <button class="link-btn" title="Enlazar">🔗</button>
        <button class="close-btn" title="Cerrar">×</button>
      </div>
    </div>
  `;

  /**
   * Crea un bloque inyectando la estructura definida en el Registro.
   * La Factory es ahora agnóstica al contenido (SOLID).
   */
  public static createBlock(type: BlockType, x: number, y: number, customId?: string): string {
    const def = BlockRegistry.getDefinition(type);
    if (!def) throw new Error(`Block type ${type} not registered`);

    const id = customId || `${type}-${Date.now()}`;
    const headerHtml = def.useHeader !== false ? this.TEMPLATE_HEADER(def.title) : '';

    const html = `
      <div id="${id}" class="block world-block ${def.className}" style="top: ${y}px; left: ${x}px;">
        ${headerHtml}
        <div class="block-content">${def.structureHtml}</div>
      </div>
    `;
    
    this.appendToCanvas(html);
    return id;
  }

  private static appendToCanvas(html: string) {
    const canvas = document.getElementById("canvas");
    if (canvas) {
      canvas.insertAdjacentHTML('beforeend', html);
    }
  }
}
