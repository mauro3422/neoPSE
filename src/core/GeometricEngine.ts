import { Vector2 } from "./Constants";
import { viewport } from "./viewport/Viewport";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export class GeometricEngine {
  /**
   * Obtiene la posición de mundo de un elemento basada en su estilo.
   */
  public static getElementPos(el: HTMLElement): Vector2 {
    return {
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0
    };
  }

  /**
   * Establece la posición de mundo de un elemento.
   */
  public static setElementPos(el: HTMLElement, pos: Vector2) {
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
  }

  /**
   * Convierte coordenadas de pantalla a mundo (Viewport Aware).
   */
  public static screenToWorld(screen: Vector2): Vector2 {
    const zoom = viewport.getZoom();
    const offset = viewport.getOffset();
    return {
      x: (screen.x - offset.x) / zoom,
      y: (screen.y - offset.y) / zoom
    };
  }

  /**
   * Convierte coordenadas de mundo a pantalla.
   */
  public static worldToScreen(world: Vector2): Vector2 {
    const zoom = viewport.getZoom();
    const offset = viewport.getOffset();
    return {
      x: world.x * zoom + offset.x,
      y: world.y * zoom + offset.y
    };
  }

  /**
   * Obtiene el rectángulo real de un elemento en espacio de mundo.
   */
  public static getWorldRect(el: HTMLElement): Rect {
    const rect = el.getBoundingClientRect();
    const topLeft = this.screenToWorld({ x: rect.left, y: rect.top });
    const bottomRight = this.screenToWorld({ x: rect.right, y: rect.bottom });
    
    const w = bottomRight.x - topLeft.x;
    const h = bottomRight.y - topLeft.y;

    return {
      x: topLeft.x,
      y: topLeft.y,
      w: w,
      h: h,
      cx: topLeft.x + w / 2,
      cy: topLeft.y + h / 2
    };
  }

  /**
   * Obtiene una posición de spawn "segura" en el centro de la vista actual.
   */
  public static getViewportCenter(): Vector2 {
    const vw = window.innerWidth / 2;
    const vh = window.innerHeight / 2;
    return this.screenToWorld({ x: vw, y: vh });
  }

  /**
   * Calcula el centro de un elemento en espacio de mundo.
   */
  public static getElementCenter(el: HTMLElement): Vector2 {
    const pos = this.getElementPos(el);
    return {
      x: pos.x + el.offsetWidth / 2,
      y: pos.y + el.offsetHeight / 2
    };
  }

  /**
   * Verifica si un punto está dentro de un rectángulo.
   */
  public static isPointInRect(p: Vector2, r: Rect): boolean {
    return p.x >= r.x && p.x <= r.x + r.w &&
           p.y >= r.y && p.y <= r.y + r.h;
  }

  /**
   * Clamping de valor entre un rango.
   */
  public static clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
  }

  /**
   * Calcula el ángulo entre dos puntos.
   */
  public static angle(p1: Vector2, p2: Vector2): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
   * Calcula la distancia entre dos puntos.
   */
  public static distance(p1: Vector2, p2: Vector2): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Interpola linealmente entre dos puntos.
   */
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
}
