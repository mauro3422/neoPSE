import { Vector2 } from "./Constants";
import { IDE_CONFIG } from "./Config";
import { GeometricEngine } from "./GeometricEngine";
import { PhysicsEngine, Easings } from "./PhysicsEngine";
import { frameTicker } from "./FrameTicker";
import { ParticleSystem } from "./ParticleSystem";
import { viewport } from "./viewport/Viewport";

export class AnimationManager {
  /**
   * Animación de expansión (Pop-in).
   */
  public static async expand(el: HTMLElement, duration: number = 300) {
    el.style.transform = 'scale(0)';
    el.style.opacity = '0';
    
    const startTime = performance.now();
    el.style.willChange = 'transform, opacity';

    return new Promise<void>((resolve) => {
      const tickerCallback = (_: number, timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const t = Easings.easeOutBack(progress);

        el.style.transform = `scale(${t})`;
        el.style.opacity = `${progress}`;

        if (progress >= 1) {
          frameTicker.unregister(tickerCallback);
          el.style.willChange = 'auto';
          resolve();
        }
      };
      frameTicker.register(tickerCallback);
    });
  }

  /**
   * Efecto "Succión de Fideo": El elemento viaja físicamente y se encoge gradualmente.
   */
  public static async blackHoleSuck(
    el: HTMLElement, 
    destination: HTMLElement | Vector2, 
    duration: number = IDE_CONFIG.TRANSITIONS.SUCTION_DURATION, 
    onUpdate?: () => void,
    emitEffects: boolean = true
  ) {
    const startPos = {
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      w: el.offsetWidth,
      h: el.offsetHeight
    };

    let destWorld: Vector2;
    if ('x' in (destination as any)) {
      destWorld = destination as Vector2;
    } else {
      const destRect = GeometricEngine.getWorldRect(destination as HTMLElement);
      destWorld = { x: destRect.cx, y: destRect.cy };
    }

    const startTime = performance.now();
    el.style.willChange = 'transform, opacity, width, height';

    return new Promise<void>((resolve) => {
      const tickerCallback = (_deltaTime: number, timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Usamos el motor de física para calcular la transformación
        const physics = PhysicsEngine.calculateSuctionPath(
          { x: startPos.x + startPos.w / 2, y: startPos.y + startPos.h / 2 },
          destWorld,
          progress,
          Easings.easeInCubic
        );

        const curW = startPos.w * (1 - progress);
        const curH = startPos.h * (1 - progress);

        el.style.left = `${physics.pos.x - curW / 2}px`;
        el.style.top = `${physics.pos.y - curH / 2}px`;
        el.style.width = `${curW}px`;
        el.style.height = `${curH}px`;
        el.style.opacity = `${1 - progress * 0.8}`;

        if (onUpdate) onUpdate();

        if (progress >= 1) {
          frameTicker.unregister(tickerCallback);
          el.style.willChange = 'auto';
          
          if (emitEffects) {
            ParticleSystem.emit(destWorld, 'var(--accent-color)', 15);
            viewport.shake(2, 200);
          }
          
          resolve();
        }
      };

      frameTicker.register(tickerCallback);
    });
  }
}
