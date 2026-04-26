import { Block } from "./Block";
import { workspaceState } from "../core/state/WorkspaceState";
import { DOMUtils } from "../core/DOMUtils";
import { AnimationManager } from "../core/AnimationManager";
import { eventBus, AppEvents } from "../core/EventEmitter";
import { GeometricEngine } from "../core/GeometricEngine";
import { relationshipManager } from "../core/RelationshipManager";
import { BlockType, BlockData, LinkData } from "../types";

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
  private children: BlockData[] = [];
  private childLinks: LinkData[] = [];
  private associatedBlockIds: string[] = [];

  constructor(selector: string | HTMLElement, skipAnimation: boolean = false) {
    super(selector, BlockType.FOLDER, skipAnimation);
    this.rehydrate();
    this.initFolderEvents();
    if (!skipAnimation) AnimationManager.expand(this.element);
  }

  private rehydrate() {
    const data = this.getStateData() as any;
    if (data) {
      if (data.children) this.children = data.children;
      if (data.childLinks) this.childLinks = data.childLinks || [];
      if (data.associatedBlockIds) this.associatedBlockIds = data.associatedBlockIds;
      if (data.content) {
        const label = this.element.querySelector('.folder-label');
        if (label) label.textContent = data.content;
      }
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

  public enableRenaming() {
    const label = this.element.querySelector<HTMLElement>('.folder-label');
    if (!label) return;

    label.setAttribute('contenteditable', 'true');
    label.classList.add('is-editing');
    label.focus();

    const range = document.createRange();
    range.selectNodeContents(label);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const saveName = () => {
      label.removeAttribute('contenteditable');
      label.classList.remove('is-editing');
      let newName = label.textContent?.trim() || 'Módulo';
      label.textContent = newName;
      this.syncState(newName);
      workspaceState.saveToStorage();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveName();
        label.removeEventListener('keydown', onKeyDown);
        label.removeEventListener('blur', onBlur);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const data = this.getStateData();
        label.textContent = (data && data.content) ? data.content : 'Módulo';
        label.removeAttribute('contenteditable');
        label.classList.remove('is-editing');
        label.removeEventListener('keydown', onKeyDown);
        label.removeEventListener('blur', onBlur);
      }
    };

    const onBlur = () => {
      saveName();
      label.removeEventListener('keydown', onKeyDown);
      label.removeEventListener('blur', onBlur);
    };

    label.addEventListener('keydown', onKeyDown);
    label.addEventListener('blur', onBlur);
  }

  /**
   * Almacena un bloque succionado (Guardando su posición RELATIVA a la carpeta).
   */
  public addSwallowedBlock(data: BlockData) {
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

    if (!this.associatedBlockIds.includes(data.id)) {
      this.associatedBlockIds.push(data.id);
    }
  }

  public addSwallowedLink(link: LinkData) {
    const exists = this.childLinks.some(l => l.fromId === link.fromId && l.toId === link.toId);
    if (!exists) {
      this.childLinks.push(link);
    }
  }

  private async openModule() {
    if (this.children.length === 0) {
      if (this.associatedBlockIds.length > 0) {
        const firstId = this.associatedBlockIds[0];
        const firstEl = document.getElementById(firstId);
        
        if (firstEl) {
          const { relationshipManager } = await import("../core/RelationshipManager");
          const connectedData = relationshipManager.getConnectedComponentWithLevels(firstId);
          eventBus.emit(AppEvents.REQUEST_SUCTION, { firstId, folderEl: this.element, connectedData });
          return;
        }
      }

      // Modo Enlace entre carpetas
      const { connectionManager } = await import("../core/ConnectionManager");
      connectionManager.start(this.id);
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
    return this.element.querySelector('.folder-label')?.textContent || 'Módulo';
  }

  public serialize() {
    const base = super.serialize();
    return {
      ...base,
      children: this.children,
      childLinks: this.childLinks,
      associatedBlockIds: this.associatedBlockIds
    };
  }
}
