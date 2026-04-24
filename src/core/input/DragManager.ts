import { viewport } from "../viewport/Viewport";

export interface Draggable {
  onDragStart(x: number, y: number): void;
  onDragMove(dx: number, dy: number): void;
  onDragEnd(): void;
  getElement(): HTMLElement;
}

export class DragManager {
  private activeDraggable: Draggable | null = null;
  private startX: number = 0;
  private startY: number = 0;

  constructor() {
    // Escuchar en fase de captura para tener prioridad absoluta
    window.addEventListener('mousemove', this.onMouseMove.bind(this), true);
    window.addEventListener('mouseup', this.onMouseUp.bind(this), true);
  }

  public register(draggable: Draggable, handle: HTMLElement) {
    handle.style.pointerEvents = 'auto'; // Asegurar que reciba eventos
    
    handle.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.header-actions')) return;

      e.preventDefault();
      e.stopPropagation();
      
      this.activeDraggable = draggable;
      this.startX = e.clientX;
      this.startY = e.clientY;
      
      draggable.onDragStart(e.clientX, e.clientY);
      console.log(`[DragManager] Drag iniciado en:`, draggable.getElement().id);
    });
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.activeDraggable) return;

    const zoom = viewport.getZoom();
    const dx = (e.clientX - this.startX) / zoom;
    const dy = (e.clientY - this.startY) / zoom;

    this.activeDraggable.onDragMove(dx, dy);
  }

  private onMouseUp() {
    if (this.activeDraggable) {
      console.log(`[DragManager] Drag finalizado`);
      this.activeDraggable.onDragEnd();
      this.activeDraggable = null;
    }
  }
}

export const dragManager = new DragManager();
