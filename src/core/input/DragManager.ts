import { viewport } from "../viewport/Viewport";

export interface Draggable {
  onDragStart(x: number, y: number): void;
  onDragMove(dx: number, dy: number): void;
  onDragEnd(): void;
  getElement(): HTMLElement;
}

export class DragManager {
  private activeDraggable: Draggable | null = null;
  private pendingDraggable: Draggable | null = null;
  private startX: number = 0;
  private startY: number = 0;
  private threshold: number = 5; // Píxeles de umbral
  private isDragging: boolean = false;

  constructor() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this), { capture: true });
    window.addEventListener('mouseup', this.onMouseUp.bind(this), { capture: true });
  }

  public register(draggable: Draggable, handle: HTMLElement) {
    handle.style.pointerEvents = 'auto';
    
    handle.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      // No interferir con botones, inputs o el resizer
      if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.isContentEditable || target.closest('.resizer')) {
        return;
      }

      e.stopPropagation(); // <--- EVITA QUE EL BOARD REACCIONE SI CLICKAS UN BLOQUE
      
      this.pendingDraggable = draggable;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.isDragging = false;
    });
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.pendingDraggable) return;

    if (!this.isDragging) {
      const dist = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
      if (dist > this.threshold) {
        this.isDragging = true;
        this.activeDraggable = this.pendingDraggable;
        this.activeDraggable.onDragStart(e.clientX, e.clientY);
      }
    }

    if (this.isDragging && this.activeDraggable) {
      e.preventDefault(); // Ahora sí bloqueamos para el arrastre
      const zoom = viewport.getZoom();
      const dx = (e.clientX - this.startX) / zoom;
      const dy = (e.clientY - this.startY) / zoom;
      this.activeDraggable.onDragMove(dx, dy);
    }
  }

  private onMouseUp() {
    if (this.isDragging && this.activeDraggable) {
      this.activeDraggable.onDragEnd();
    }
    
    this.activeDraggable = null;
    this.pendingDraggable = null;
    this.isDragging = false;
  }
}

export const dragManager = new DragManager();
