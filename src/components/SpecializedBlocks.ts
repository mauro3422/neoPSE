import { Block } from "./Block";
import { workspaceState } from "../core/state/WorkspaceState";
import { DOMUtils } from "../core/DOMUtils";
import { AnimationManager } from "../core/AnimationManager";
import { eventBus, AppEvents } from "../core/EventEmitter";
import { GeometricEngine } from "../core/GeometricEngine";
import { relationshipManager } from "../core/RelationshipManager";
import { BlockType } from "../types";

export class PseudocodeBlock extends Block {
  constructor(selector: string | HTMLElement, skipAnimation: boolean = false) {
    super(selector, BlockType.PSEUDOCODE, skipAnimation);
    this.rehydrate();
    this.initEvents();
    if (!skipAnimation) AnimationManager.expand(this.element);
  }

  private initEvents() {
    const editor = this.element.querySelector<HTMLElement>('.code-area');
    if (editor) {
      editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          document.execCommand('insertText', false, '    ');
        }
      });
    }
  }

  private rehydrate() {
    const data = this.getStateData();
    const editor = this.element.querySelector<HTMLElement>('.code-area');
    if (editor) {
      if (data && data.content) editor.textContent = data.content;
      editor.setAttribute('contenteditable', 'true');
    }
  }

  public getContent(): string {
    return this.element.querySelector('.code-area')?.textContent || '';
  }
}

export class NoteBlock extends Block {
  constructor(selector: string | HTMLElement, skipAnimation: boolean = false) {
    super(selector, BlockType.NOTE, skipAnimation);
    this.rehydrate();
    this.initEvents();
    if (!skipAnimation) AnimationManager.expand(this.element);
  }

  private initEvents() {
    const textArea = this.element.querySelector<HTMLElement>('textarea');
    if (textArea) {
      DOMUtils.setupAutoResize(textArea);
    }
  }

  private rehydrate() {
    const data = this.getStateData();
    const textArea = this.element.querySelector<HTMLTextAreaElement>('textarea');
    if (textArea && data && data.content) {
      textArea.value = data.content;
      DOMUtils.autoResize(textArea);
    }
  }

  public getContent(): string {
    return this.element.querySelector('textarea')?.value || '';
  }
}

export class FolderBlock extends Block {
  private children: any[] = [];
  private childLinks: any[] = [];

  constructor(selector: string | HTMLElement, skipAnimation: boolean = false) {
    super(selector, BlockType.FOLDER, skipAnimation);
    this.rehydrate();
    this.initFolderEvents();
    if (!skipAnimation) AnimationManager.expand(this.element);
  }

  private rehydrate() {
    const data = this.getStateData() as any;
    if (data && data.children) {
      this.children = data.children;
      this.childLinks = data.childLinks || [];
    }
  }

  private initFolderEvents() {
    this.element.addEventListener('dblclick', () => {
      this.openModule();
    });

    eventBus.on(AppEvents.REQUEST_OPEN_FOLDER, (id: string) => {
      if (id === this.id) this.openModule();
    });
  }

  /**
   * Almacena un bloque succionado (Guardando su posición RELATIVA a la carpeta).
   */
  public addSwallowedBlock(data: any) {
    const folderPos = GeometricEngine.getElementPos(this.element);
    
    // Calculamos el offset relativo
    const relativePos = {
      x: data.position.x - folderPos.x,
      y: data.position.y - folderPos.y
    };

    console.log(`[Folder] Guardando bloque ${data.id} con posición relativa:`, relativePos);

    this.children.push({
      ...data,
      position: relativePos
    });
  }

  public addSwallowedLink(link: any) {
    const exists = this.childLinks.some(l => l.fromId === link.fromId && l.toId === link.toId);
    if (!exists) {
      this.childLinks.push(link);
    }
  }

  private async openModule() {
    if (this.children.length === 0) {
      console.log("[FolderBlock] El módulo está vacío.");
      return;
    }

    console.log(`[FolderBlock] Abriendo módulo: ${this.id}. Expulsando ${this.children.length} bloques.`);
    
    // Feedback visual de explosión (White Hole)
    this.element.animate([
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.5)', filter: 'brightness(2) white' },
      { transform: 'scale(1)', filter: 'brightness(1)' }
    ], { duration: 500, easing: 'ease-out' });

    // Copiar datos y vaciar estado de la carpeta INMEDIATAMENTE
    const blocksToExpel = [...this.children];
    const linksToExpel = [...this.childLinks];
    this.children = [];
    this.childLinks = [];

    // Expulsar hijos
    const folderRect = GeometricEngine.getWorldRect(this.element);
    const origin = { x: folderRect.cx, y: folderRect.cy };
    const folderPos = GeometricEngine.getElementPos(this.element);

    // Pedir al Workspace que los recree con animación
    blocksToExpel.forEach((blockData, index) => {
      // Reconstruimos la posición ABSOLUTA basada en la posición ACTUAL de la carpeta
      let relX = blockData.position.x;
      let relY = blockData.position.y;

      // El primer elemento suele quedar justo encima. Lo empujamos un poco al costado.
      if (index === 0) {
        relX += 120; // 120px a la derecha
      }

      const absolutePos = {
        x: folderPos.x + relX,
        y: folderPos.y + relY
      };

      setTimeout(() => {
        eventBus.emit(AppEvents.BLOCK_CREATED, {
          ...blockData,
          position: absolutePos, // Posición reconstruida
          spawnOrigin: origin // Pasar origen para animación White Hole
        });
      }, index * 100);
    });

    // Recrear links después de que los bloques salgan
    setTimeout(() => {
      linksToExpel.forEach(link => {
        relationshipManager.addLink(link.fromId, link.toId);
        workspaceState.addLink(link.fromId, link.toId);
      });
    }, blocksToExpel.length * 100 + 500);

    // Forzar guardado para registrar que la carpeta está vacía
    workspaceState.saveToStorage();
  }

  public getContent(): string {
    return "";
  }

  public serialize(): any {
    const base = super.serialize();
    return {
      ...base,
      children: this.children,
      childLinks: this.childLinks
    };
  }
}
