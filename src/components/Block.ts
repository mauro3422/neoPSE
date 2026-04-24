import { relationshipManager } from "../core/RelationshipManager";
import { Draggable, dragManager } from "../core/input/DragManager";
import { eventBus, AppEvents } from "../core/EventEmitter";
import { workspaceState } from "../core/state/WorkspaceState";
import { SpaceManager } from "../core/SpaceManager";
import { SelectionManager } from "../core/SelectionManager";
import { connectionManager } from "../core/ConnectionManager";

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

export abstract class Block extends UIComponent implements Draggable {
  protected header: HTMLElement;
  private initialX: number = 0;
  private initialY: number = 0;

  constructor(selector: string | HTMLElement) {
    super(selector);
    const header = this.element.querySelector<HTMLElement>('.block-header');
    if (!header) throw new Error(`Header not found for block ${this.id}`);
    this.header = header;
    
    dragManager.register(this, this.header);
    this.initBaseEvents();
  }

  public onDragStart() {
    const pos = SpaceManager.getElementPos(this.element);
    this.initialX = pos.x;
    this.initialY = pos.y;
    SelectionManager.select(this.element);
    this.element.classList.add('is-dragging');
    this.header.style.cursor = 'grabbing';
  }

  public onDragMove(dx: number, dy: number) {
    SpaceManager.setElementPos(this.element, {
      x: this.initialX + dx,
      y: this.initialY + dy
    });
    eventBus.emit(AppEvents.BLOCK_MOVE, this.id);
  }

  public onDragEnd() {
    this.element.classList.remove('is-dragging');
    this.header.style.cursor = 'grab';
  }

  private initBaseEvents() {
    this.element.addEventListener('mousedown', () => {
      SelectionManager.select(this.element);
    }, { capture: true });

    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button');
      
      if (!btn) {
        // Delegar lógica de enlace al ConnectionManager (SOLID)
        if (connectionManager.getIsLinking()) {
          connectionManager.complete(this.id);
          e.stopPropagation();
        }
        return;
      }

      if (btn.classList.contains('link-btn')) this.handleLinkClick(e);
      if (btn.classList.contains('close-btn')) this.destroy(e);
    });

    this.element.addEventListener('input', () => {
      this.syncState(this.getContent());
    });
  }

  private handleLinkClick(e: Event) {
    e.stopPropagation();
    this.element.classList.add('is-linking-source');
    connectionManager.start(this.id);
  }

  private destroy(e: Event) {
    e.stopPropagation();
    this.element.remove();
    workspaceState.removeBlock(this.id);
    relationshipManager.removeLinksForBlock(this.id);
    SelectionManager.clear();
  }

  public abstract getContent(): string;
}
