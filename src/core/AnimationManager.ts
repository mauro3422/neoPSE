import { Vector2 } from "./Config";
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
    el.style.willChange = 'transform, opacity';

    return new Promise<void>((resolve) => {
      const tickerCallback = (_deltaTime: number, timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Usamos el motor de física para calcular la trayectoria
        const physics = PhysicsEngine.calculateSuctionPath(
          { x: startPos.x + startPos.w / 2, y: startPos.y + startPos.h / 2 },
          destWorld,
          progress,
          Easings.easeInExpo
        );

        // Escala pura: se achica progresivamente
        // NOTA DE DISEÑO: NO agregar 'rotate()' ni mutar width/height aquí.
        // Esto causa reflows costosos y hace que el texto se rompa de forma fea (wrapping).
        // El efecto de arrastre premium se logra manteniendo el elemento estable.
        const scale = 1 - progress;

        // Posicionamiento basado en el centro original
        el.style.left = `${physics.pos.x - startPos.w / 2}px`;
        el.style.top = `${physics.pos.y - startPos.h / 2}px`;
        el.style.opacity = `${1 - progress * 0.9}`;
        el.style.transform = `scale(${scale})`; 

        if (onUpdate) onUpdate();

        if (progress >= 1) {
          frameTicker.unregister(tickerCallback);
          el.style.willChange = 'auto';
          
          if (emitEffects) {
            ParticleSystem.emit(destWorld, 'var(--accent-color)', 25);
            viewport.shake(3, 300);
            
            // Feedback visual en la carpeta (Vibe Upgrade)
            if (!(destination as any).x) {
              const folder = destination as HTMLElement;
              folder.animate([
                { transform: 'scale(1)', filter: 'brightness(1)' },
                { transform: 'scale(1.3)', filter: 'brightness(1.5) drop-shadow(0 0 15px var(--accent-color))' },
                { transform: 'scale(1)', filter: 'brightness(1)' }
              ], { duration: 400, easing: 'ease-out' });
            }
          }
          
          resolve();
        }
      };

      frameTicker.register(tickerCallback);
    });
  }

  /**
   * Efecto "White Hole": El elemento nace en un punto y sale disparado a su posición.
   */
  public static async whiteHoleBurst(el: HTMLElement, origin: Vector2, destination: Vector2, duration: number = 600) {
    // Inicializar estado invisible/centrado en el origen
    el.style.transform = 'scale(0)';
    el.style.opacity = '0';
    el.style.left = `${origin.x}px`;
    el.style.top = `${origin.y}px`;
    el.style.willChange = 'transform, opacity, left, top';

    // Efecto visual de "explosión" inicial
    ParticleSystem.emit(origin, 'var(--accent-color)', 20);

    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      const tickerCallback = (_: number, timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const t = Easings.easeOutBack(progress);

        // Interpolar posición (de origen a destino)
        const curX = origin.x + (destination.x - origin.x) * progress;
        const curY = origin.y + (destination.y - origin.y) * progress;

        el.style.left = `${curX}px`;
        el.style.top = `${curY}px`;
        el.style.transform = `scale(${t})`;
        el.style.opacity = `${progress}`;
        el.style.filter = `brightness(${1 + (1 - progress) * 2})`; 

        if (progress >= 1) {
          console.log(`[Animation] White Hole Burst completado para ${el.id}`);
          frameTicker.unregister(tickerCallback);
          el.style.willChange = 'auto';
          el.style.filter = 'none';
          el.style.left = `${destination.x}px`;
          el.style.top = `${destination.y}px`;
          resolve();
        }
      };
      console.log(`[Animation] Registrando ticker para White Hole Burst: ${el.id}`);
      frameTicker.register(tickerCallback);
    });
  }
}
