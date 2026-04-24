import { Vector2 } from "./Constants";

export class GeometryUtils {
  /**
   * Calcula la distancia euclidiana entre dos puntos.
   */
  public static distance(p1: Vector2, p2: Vector2): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  /**
   * Determina si dos rectángulos colisionan.
   */
  public static intersects(r1: any, r2: any): boolean {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.h + r1.y > r2.y;
  }

  /**
   * Calcula el punto más cercano en un set de puntos.
   */
  public static findClosestPair(points1: any[], points2: any[]) {
    let minDistance = Infinity;
    let bestPair = { p1: points1[0], p2: points2[0] };

    for (const p1 of points1) {
      for (const p2 of points2) {
        const dist = this.distance(p1, p2);
        if (dist < minDistance) {
          minDistance = dist;
          bestPair = { p1, p2 };
        }
      }
    }
    return bestPair;
  }
}
