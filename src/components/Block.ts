import { relationshipManager } from "../core/RelationshipManager";
import { BlockRegistry } from "../core/BlockRegistry";
import { Draggable, dragManager } from "../core/input/DragManager";
import { Resizable, resizeManager } from "../core/input/ResizeManager";
import { eventBus, AppEvents } from "../core/EventEmitter";
import { workspaceState } from "../core/state/WorkspaceState";
import { GeometricEngine } from "../core/GeometricEngine";
import { SelectionManager } from "../core/SelectionManager";
import { viewport } from "../core/viewport/Viewport";
import { connectionManager } from "../core/ConnectionManager";
import { BlockType } from "../types";

export abstract class UIComponent {
  protected element: HTMLElement;
  protected id: string;

  constructor(selector: string | HTMLElement) {
    const el = typeof selector === 'string' ? document.querySelector<HTMLElement>(selector) : selector;
    if (!el) throw new Error(`Component not found`);
    this.element = el;
    this.id = el.id;
  }

  public getElement() { return this.element; }

  protected getStateData() {
    return workspaceState.getData().blocks.find(b => b.id === this.id);
  }

  protected syncState(content: string) {
    workspaceState.updateBlockContent(this.id, content);
  }
}

export abstract class Block extends UIComponent implements Draggable, Resizable {
  protected type: BlockType;
  protected header: HTMLElement;
  protected resizer: HTMLElement;
  private initialX: number = 0;
  private initialY: number = 0;

  constructor(selector: string | HTMLElement, type: BlockType, skipAnimation: boolean = false) {
    super(selector);
    this.type = type;
    // skipAnimation se usa en las subclases para omitir expand()
    if (skipAnimation) { /* logic in subclass */ }
    const header = this.element.querySelector<HTMLElement>('.block-header');
    this.header = header || null as any;
    
    if (this.header) {
      dragManager.register(this, this.header);
    } else {
      // Si no hay header, el cuerpo entero es el handle de drag
      dragManager.register(this, this.element);
    }

    // Obtener definición para ver si usa resizer
    const def = BlockRegistry.getDefinition(this.type);

    if (def && def.useResizer !== false) {
      let resizer = this.element.querySelector<HTMLElement>('.resizer');
      if (!resizer) {
        resizer = document.createElement('div');
        resizer.className = 'resizer';
        this.element.appendChild(resizer);
      }
      this.resizer = resizer;
      resizeManager.register(this, this.resizer);
    } else {
      this.resizer = null as any;
    }
    
    this.initBaseEvents();
  }

  public onDragStart() {
    const pos = GeometricEngine.getElementPos(this.element);
    this.initialX = pos.x;
    this.initialY = pos.y;
    SelectionManager.select(this.element);
    this.element.classList.add('is-dragging');
    this.header.style.cursor = 'grabbing';
  }

  public onDragMove(dx: number, dy: number) {
    const zoom = viewport.getZoom();
    GeometricEngine.setElementPos(this.element, {
      x: this.initialX + dx / zoom,
      y: this.initialY + dy / zoom
    });
    eventBus.emit(AppEvents.BLOCK_MOVE, this.id);
  }

  public onDragEnd(mouseX: number, mouseY: number) {
    this.element.classList.remove('is-dragging');
    this.header.style.cursor = 'grab';

    // Detección de Agujero Negro (Basada en posición del PUNTERO para máxima precisión)
    const worldMouse = GeometricEngine.screenToWorld({ x: mouseX, y: mouseY });
    const folders = document.querySelectorAll('.folder-block');
    
    for (const folder of Array.from(folders)) {
      const folderEl = folder as HTMLElement;
      if (folderEl.id === this.id) continue;

      const folderRect = GeometricEngine.getWorldRect(folderEl);
      if (GeometricEngine.isPointInRect(worldMouse, folderRect)) {
        console.log(`[BlackHole] Succionando bloque ${this.id} hacia carpeta ${folderEl.id}`);
        const connectedData = relationshipManager.getConnectedComponentWithLevels(this.id);
        dragManager.suckConnectedNetwork(this.id, folderEl, connectedData);
        break;
      }
    }
  }

  // --- RESIZABLE INTERFACE ---
  public onResizeStart() {
    this.element.classList.add('is-resizing');
  }

  public onResize(width: number, height: number) {
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    eventBus.emit(AppEvents.BLOCK_MOVE, this.id);
  }

  public onResizeEnd() {
    this.element.classList.remove('is-resizing');
  }

  private initBaseEvents() {
    this.element.addEventListener('mousedown', () => {
      SelectionManager.select(this.element);
    }, { capture: true });

    this.element.addEventListener('click', (e) => this.handleBlockClick(e));

    this.element.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      const { ContextMenuManager } = await import("../core/ContextMenuManager");
      ContextMenuManager.show(this.id, e.clientX, e.clientY, this.type === 'folder');
    });

    this.element.addEventListener('input', () => {
      this.syncState(this.getContent());
    });
  }

  private handleBlockClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    
    if (!btn) {
      this.handleContentClick(e);
      return;
    }

    if (btn.classList.contains('link-btn')) this.handleLinkClick(e);
    if (btn.classList.contains('close-btn')) this.handleDestroyClick(e);
  }

  private handleContentClick(e: MouseEvent) {
    if (connectionManager.getIsLinking()) {
      connectionManager.complete(this.id);
      e.stopPropagation();
    }
  }

  private handleLinkClick(e: Event) {
    e.stopPropagation();
    this.element.classList.add('is-linking-source');
    connectionManager.start(this.id);
  }

  public destroy() {
    eventBus.emit(AppEvents.BLOCK_DELETED, this.id);
    this.element.remove();
    workspaceState.removeBlock(this.id);
    relationshipManager.removeLinksForBlock(this.id);
    if (SelectionManager.getSelected() === this.element) {
      SelectionManager.clear();
    }
  }

  private handleDestroyClick(e: Event) {
    e.stopPropagation();
    this.destroy();
  }

  public abstract getContent(): string;

  public serialize(): any {
    const pos = GeometricEngine.getElementPos(this.element);
    return {
      id: this.id,
      type: this.type,
      position: pos,
      size: { width: this.element.offsetWidth, height: this.element.offsetHeight },
      content: this.getContent()
    };
  }
}
