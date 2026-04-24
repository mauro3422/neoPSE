import { viewport } from "../viewport/Viewport";

export interface Resizable {
  onResizeStart(): void;
  onResize(width: number, height: number): void;
  onResizeEnd(): void;
  getElement(): HTMLElement;
}

export class ResizeManager {
  private activeResizable: Resizable | null = null;
  private startX: number = 0;
  private startY: number = 0;
  private startWidth: number = 0;
  private startHeight: number = 0;

  constructor() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this), { capture: true });
    window.addEventListener('mouseup', this.onMouseUp.bind(this), { capture: true });
  }

  public register(resizable: Resizable, handle: HTMLElement) {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const el = resizable.getElement();
      this.activeResizable = resizable;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startWidth = el.offsetWidth;
      this.startHeight = el.offsetHeight;

      resizable.onResizeStart();
    });
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.activeResizable) return;

    const zoom = viewport.getZoom();
    const dx = (e.clientX - this.startX) / zoom;
    const dy = (e.clientY - this.startY) / zoom;

    const newWidth = Math.max(100, this.startWidth + dx);
    const newHeight = Math.max(50, this.startHeight + dy);

    this.activeResizable.onResize(newWidth, newHeight);
  }

  private onMouseUp() {
    if (this.activeResizable) {
      this.activeResizable.onResizeEnd();
      this.activeResizable = null;
    }
  }
}

export const resizeManager = new ResizeManager();
