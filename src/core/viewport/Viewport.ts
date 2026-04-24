import { Vector2, APP_CONFIG } from "../Constants";

export class Viewport {
  private offset: Vector2 = { x: 0, y: 0 };
  private zoom: number = 1.0;

  public setOffset(x: number, y: number) {
    this.offset.x = x;
    this.offset.y = y;
    this.render();
  }

  public getOffset(): Vector2 {
    return { ...this.offset };
  }

  public getZoom(): number {
    return this.zoom;
  }

  public setZoom(newZoom: number) {
    this.zoom = Math.min(Math.max(newZoom, APP_CONFIG.MIN_ZOOM), APP_CONFIG.MAX_ZOOM);
    this.render();
  }

  private render() {
    document.documentElement.style.setProperty('--pan-x', `${this.offset.x}px`);
    document.documentElement.style.setProperty('--pan-y', `${this.offset.y}px`);
    document.documentElement.style.setProperty('--zoom', `${this.zoom}`);
  }
}

export const viewport = new Viewport();
