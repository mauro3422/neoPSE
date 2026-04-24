import { eventBus, AppEvents } from "./EventEmitter";
import { SpaceManager } from "./SpaceManager";
import { GeometryUtils } from "./GeometryUtils";

export class CollisionSystem {
  public static init() {
    eventBus.on(AppEvents.BLOCK_MOVE, () => this.checkCollisions());
  }

  private static checkCollisions() {
    const blocks = document.querySelectorAll<HTMLElement>('.world-block');
    const rects = Array.from(blocks).map(b => {
      const pos = SpaceManager.getElementPos(b);
      return {
        id: b.id,
        x: pos.x,
        y: pos.y,
        w: b.offsetWidth,
        h: b.offsetHeight
      };
    });

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const r1 = rects[i];
        const r2 = rects[j];

        if (GeometryUtils.intersects(r1, r2)) {
          console.warn(`[CollisionSystem] Bloques colisionando: ${r1.id} y ${r2.id}`);
        }
      }
    }
  }
}
