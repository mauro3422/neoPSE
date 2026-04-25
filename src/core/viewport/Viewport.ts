import { Vector2, IDE_CONFIG } from "../Config";

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

  private shakeIntensity: number = 0;

  public setZoom(newZoom: number) {
    this.zoom = Math.min(Math.max(newZoom, IDE_CONFIG.GEOMETRY.MIN_ZOOM), IDE_CONFIG.GEOMETRY.MAX_ZOOM);
    this.render();
  }

  public shake(intensity: number = 5, duration: number = 300) {
    this.shakeIntensity = intensity;
    const startTime = performance.now();
    
    const loop = (now: number) => {
      const elapsed = now - startTime;
      const progress = 1 - (elapsed / duration);
      
      if (progress > 0) {
        this.shakeIntensity = intensity * progress;
        this.render();
        requestAnimationFrame(loop);
      } else {
        this.shakeIntensity = 0;
        this.render();
      }
    };
    requestAnimationFrame(loop);
  }

  private render() {
    const sx = (Math.random() - 0.5) * this.shakeIntensity;
    const sy = (Math.random() - 0.5) * this.shakeIntensity;

    document.documentElement.style.setProperty('--pan-x', `${this.offset.x + sx}px`);
    document.documentElement.style.setProperty('--pan-y', `${this.offset.y + sy}px`);
    document.documentElement.style.setProperty('--zoom', `${this.zoom}`);
  }
}

export const viewport = new Viewport();
