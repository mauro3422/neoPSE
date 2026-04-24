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

  private onMouseUp(e: MouseEvent) {
    if (this.isDragging && this.activeDraggable) {
      const el = this.activeDraggable.getElement();
      
      // Solo si es un bloque (no el viewport)
      if (el.classList.contains('world-block') && !el.classList.contains('folder-block')) {
        const dropTarget = document.elementsFromPoint(e.clientX, e.clientY)
          .find(target => target.closest('.folder-block')) as HTMLElement;

        if (dropTarget) {
          const folder = dropTarget.closest('.folder-block') as HTMLElement;
          this.suckBlockAndConnections(el, folder);
        }
      }

      this.activeDraggable.onDragEnd();
    }
    
    this.activeDraggable = null;
    this.pendingDraggable = null;
    this.isDragging = false;
  }

  private async suckBlockAndConnections(el: HTMLElement, folder: HTMLElement) {
    const blockId = el.id;
    const { relationshipManager } = await import("../RelationshipManager");
    const { AnimationManager } = await import("../AnimationManager");

    // 1. Obtener TODO el componente conectado (Red completa)
    const allConnectedIds = relationshipManager.getConnectedComponent(blockId);
    
    // 2. Definir función de actualización de cables
    const updateLinks = () => {
      allConnectedIds.forEach(id => relationshipManager.drawLinksForBlock(id));
    };

    // 3. Tragar bloques en paralelo con retraso (Wave Effect)
    // Usamos una promesa global para saber cuando termina TODA la succión
    const suckPromises: Promise<void>[] = [];

    // Primero el que arrastramos
    folder.classList.add('is-eating');
    suckPromises.push(
      AnimationManager.blackHoleSuck(el, folder, 600, updateLinks).then(() => {
        relationshipManager.removeLinksForBlock(blockId);
        el.remove();
      })
    );

    // Luego el resto con un delay muy corto para que parezca que todos tiran
    const others = allConnectedIds.filter(id => id !== blockId);
    others.forEach((id, index) => {
      const connectedEl = document.getElementById(id);
      if (connectedEl) {
        const promise = new Promise<void>(async (resolve) => {
          // Delay incremental muy pequeño para el efecto fideo
          await new Promise(r => setTimeout(r, (index + 1) * 60));
          
          await AnimationManager.blackHoleSuck(connectedEl, folder, 700, updateLinks);
          relationshipManager.removeLinksForBlock(id);
          connectedEl.remove();
          resolve();
        });
        suckPromises.push(promise);
      }
    });

    // Limpiar el estado de la carpeta al terminar todo
    Promise.all(suckPromises).then(() => {
      setTimeout(() => folder.classList.remove('is-eating'), 300);
    });
  }
}

export const dragManager = new DragManager();
