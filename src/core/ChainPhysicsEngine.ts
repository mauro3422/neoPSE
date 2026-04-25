import { Vector2 } from "./Config";
import { frameTicker } from "./FrameTicker";
import { GeometricEngine } from "./GeometricEngine";

interface VerletNode {
  id: string;
  element: HTMLElement;
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  locked: boolean;
}

export class ChainPhysicsEngine {
  private nodes: VerletNode[] = [];
  private target: Vector2 = { x: 0, y: 0 };
  private onUpdateCallback?: () => void;
  private resolvePromise?: () => void;
  private isRunning: boolean = false;

  public startSuction(
    nodesData: { id: string, element: HTMLElement }[],
    targetPos: Vector2,
    onUpdate?: () => void
  ): Promise<void> {
    this.nodes = nodesData.map(d => {
      const rect = GeometricEngine.getWorldRect(d.element);
      return {
        id: d.id,
        element: d.element,
        x: rect.cx,
        y: rect.cy,
        oldX: rect.cx,
        oldY: rect.cy,
        locked: false
      };
    });

    this.target = targetPos;
    this.onUpdateCallback = onUpdate;
    this.isRunning = true;

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      frameTicker.register(this.update);
    });
  }

  private update = (_deltaTime: number, _timestamp: number) => {
    if (!this.isRunning) return;

    // 1. Integración de Verlet
    const friction = 0.95;
    
    this.nodes.forEach((node, index) => {
      if (node.locked) return;

      let vx = (node.x - node.oldX) * friction;
      let vy = (node.y - node.oldY) * friction;

      node.oldX = node.x;
      node.oldY = node.y;

      node.x += vx;
      node.y += vy;

      // Gravedad del Agujero Negro solo en el nodo 0
      if (index === 0) {
        const dx = this.target.x - node.x;
        const dy = this.target.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          node.x += (dx / dist) * 6; // Velocidad de succión aún más reducida
          node.y += (dy / dist) * 6;
        } else {
          node.x = this.target.x;
          node.y = this.target.y;
          node.locked = true;
        }
      }
    });

    // 2. Resolver Restricciones de Distancia (Verlet Constraints)
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < this.nodes.length - 1; j++) {
        const p1 = this.nodes[j];
        const p2 = this.nodes[j + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);

        // El cable se encoge a medida que se acercan al agujero negro
        const distToTarget = Math.sqrt((this.target.x - p1.x) ** 2 + (this.target.y - p1.y) ** 2);
        const currentRestLength = Math.max(5, 150 * Math.min(1, distToTarget / 400));

        if (currentDist > currentRestLength) {
          const diff = currentDist - currentRestLength;
          const percent = diff / currentDist / 2;
          const offsetX = dx * percent;
          const offsetY = dy * percent;

          if (!p1.locked) {
            p1.x += offsetX;
            p1.y += offsetY;
          }
          if (!p2.locked) {
            p2.x -= offsetX;
            p2.y -= offsetY;
          }
        }
      }
    }

    // 3. Renderizar en el DOM y actualizar escala
    let allSwallowed = true;
    this.nodes.forEach((node) => {
      const dx = this.target.x - node.x;
      const dy = this.target.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const scale = Math.max(0, Math.min(1, dist / 400));
      node.element.style.left = `${node.x - node.element.offsetWidth / 2}px`;
      node.element.style.top = `${node.y - node.element.offsetHeight / 2}px`;
      node.element.style.transform = `scale(${scale})`;
      node.element.style.opacity = `${Math.max(0.1, scale)}`;

      if (dist > 30) {
        allSwallowed = false;
      }
    });

    if (this.onUpdateCallback) this.onUpdateCallback();

    if (allSwallowed) {
      this.isRunning = false;
      frameTicker.unregister(this.update);
      if (this.resolvePromise) this.resolvePromise();
    }
  };
}

export const chainPhysicsEngine = new ChainPhysicsEngine();
