import { viewport } from "./Viewport";
import { Draggable, dragManager } from "../input/DragManager";
import { eventBus, AppEvents } from "../EventEmitter";
import { Vector2 } from "../Config";
import { SelectionManager } from "../SelectionManager";

export class ViewportController implements Draggable {
  private board: HTMLElement;
  private initialOffset: Vector2 = { x: 0, y: 0 };

  constructor(targetId: string) {
    const target = document.getElementById(targetId);
    if (!target) {
      throw new Error(`Viewport target ${targetId} not found`);
    }

    this.board = target;
    dragManager.register(this, this.board);
    this.board.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
  }

  public getElement() { return this.board; }

  public onDragStart() {
    SelectionManager.clear();
    this.initialOffset = viewport.getOffset();
  }

  public onDragMove(dx: number, dy: number) {
    const zoom = viewport.getZoom();
    viewport.setOffset(this.initialOffset.x + dx * zoom, this.initialOffset.y + dy * zoom);
    eventBus.emit(AppEvents.VIEWPORT_CHANGE);
  }

  public onDragEnd(_x: number, _y: number) {}

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    
    const zoomIntensity = 0.001;
    const delta = -e.deltaY;
    const oldZoom = viewport.getZoom();
    const newZoom = oldZoom * (1 + delta * zoomIntensity);

    const offset = viewport.getOffset();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const dx = (mouseX - offset.x) / oldZoom;
    const dy = (mouseY - offset.y) / oldZoom;

    viewport.setZoom(newZoom);
    
    const actualNewZoom = viewport.getZoom();
    viewport.setOffset(
      mouseX - dx * actualNewZoom,
      mouseY - dy * actualNewZoom
    );

    eventBus.emit(AppEvents.VIEWPORT_CHANGE);
  }
}
