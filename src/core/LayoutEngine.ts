import { GeometricEngine } from "./GeometricEngine";

export class LayoutEngine {
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
      return GeometricEngine.intersectRects(targetRect, rect);
    });
  }
}
