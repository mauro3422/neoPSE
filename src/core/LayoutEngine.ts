import { Rect, GeometricEngine } from "./GeometricEngine";

export class LayoutEngine {
  /**
   * Detecta si dos rectángulos se solapan.
   */
  public static isOverlapping(r1: Rect, r2: Rect): boolean {
    return !(r2.x > r1.x + r1.w || 
             r2.x + r2.w < r1.x || 
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  /**
   * Encuentra todos los bloques que colisionan con el bloque dado.
   */
  public static getCollisions(targetId: string, allBlocks: HTMLElement[]): HTMLElement[] {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return [];

    const targetRect = GeometricEngine.getWorldRect(targetEl);
    
    return allBlocks.filter(el => {
      if (el.id === targetId) return false;
      const rect = GeometricEngine.getWorldRect(el);
      return this.isOverlapping(targetRect, rect);
    });
  }
}
