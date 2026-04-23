import { Block } from "../components/Block";

export class BlockFactory {
  private static counter = 0;

  public static createPseudocodeBlock(x: number, y: number): string {
    const id = `block-${this.counter++}`;
    const html = `
      <div id="${id}" class="block world-block editor-block" style="top: ${y}px; left: ${x}px;">
        <div class="block-header">
          <span class="block-title">Nueva Función</span>
          <div class="header-actions">
            <button class="link-btn" title="Enlazar">🔗</button>
            <button class="close-btn" title="Cerrar">×</button>
          </div>
        </div>
        <div class="block-content">
          <div class="pseudocode" contenteditable="true">Algoritmo NuevaFuncion
  // Escribe aquí...
FinAlgoritmo</div>
        </div>
      </div>
    `;
    
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.insertAdjacentHTML('beforeend', html);
      return id;
    }
    throw new Error("Canvas not found");
  }

  public static createNoteBlock(x: number, y: number): string {
    const id = `block-${this.counter++}`;
    const html = `
      <div id="${id}" class="block world-block notes-block" style="top: ${y}px; left: ${x}px;">
        <div class="block-header">
          <span class="block-title">Nota</span>
          <div class="header-actions">
            <button class="link-btn" title="Enlazar">🔗</button>
            <button class="close-btn" title="Cerrar">×</button>
          </div>
        </div>
        <div class="block-content">
          <textarea class="notes-area" placeholder="Escribe algo..."></textarea>
        </div>
      </div>
    `;
    
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.insertAdjacentHTML('beforeend', html);
      return id;
    }
    throw new Error("Canvas not found");
  }
}
