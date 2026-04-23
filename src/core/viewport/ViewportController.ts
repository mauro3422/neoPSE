import { viewport } from "./Viewport";

export class ViewportController {
  private isPanning: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private initialOffset = { x: 0, y: 0 };

  constructor(targetId: string) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    target.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
  }

  private onMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.id !== 'board' && target.id !== 'canvas' && !target.classList.contains('canvas')) return;

    this.isPanning = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.initialOffset = viewport.getOffset();
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isPanning) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    viewport.setOffset(this.initialOffset.x + dx, this.initialOffset.y + dy);
  }

  private onMouseUp() {
    this.isPanning = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    
    const zoomIntensity = 0.001;
    const delta = -e.deltaY;
    const oldZoom = viewport.getZoom();
    const newZoom = oldZoom * (1 + delta * zoomIntensity);

    // Zoom centered on mouse position
    const offset = viewport.getOffset();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Math to keep mouse over the same world-space coordinate
    const dx = (mouseX - offset.x) / oldZoom;
    const dy = (mouseY - offset.y) / oldZoom;

    viewport.setZoom(newZoom);
    
    const actualNewZoom = viewport.getZoom();
    viewport.setOffset(
      mouseX - dx * actualNewZoom,
      mouseY - dy * actualNewZoom
    );

    // Dispatch event for other components (like links) to update
    window.dispatchEvent(new CustomEvent('viewportChange'));
  }
}
