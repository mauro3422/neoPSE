import { Vector2 } from "./Constants";

export type EasingFunction = (t: number) => number;

export const Easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  // Efecto elástico para que los bloques "reboten" un poco
  elasticOut: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

export class PhysicsEngine {
  /**
   * Calcula la posición en una trayectoria Bézier (Órbita).
   */
  public static calculateSuctionPath(
    start: Vector2, 
    target: Vector2, 
    progress: number, 
    easing: EasingFunction = Easings.easeInQuad
  ): { pos: Vector2, scale: Vector2 } {
    const t = easing(progress);
    
    // Punto de control para la curva (Órbita lateral)
    const cp = {
      x: (start.x + target.x) / 2 + (target.y - start.y) * 0.2,
      y: (start.y + target.y) / 2 - (target.x - start.x) * 0.2
    };

    // Bézier Cuadrática
    const invT = 1 - t;
    const x = invT * invT * start.x + 2 * invT * t * cp.x + t * t * target.x;
    const y = invT * invT * start.y + 2 * invT * t * cp.y + t * t * target.y;

    return {
      pos: { x, y },
      scale: {
        x: 1 - t,
        y: 1 - t
      }
    };
  }
}
