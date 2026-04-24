export class AnimationManager {
  /**
   * Anima la aparición de un elemento desde un punto (escala 0 -> 1)
   */
  public static async expand(el: HTMLElement, duration: number = 400) {
    el.style.transformOrigin = 'center center';
    
    const animation = el.animate([
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.8 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards'
    });

    return animation.finished;
  }

  /**
   * Anima la desaparición hacia un punto (escala 1 -> 0)
   */
  public static async collapse(el: HTMLElement, duration: number = 300) {
    const animation = el.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0)', opacity: 0 }
    ], {
      duration,
      easing: 'ease-in',
      fill: 'forwards'
    });

    return animation.finished;
  }

  /**
   * Suaviza el movimiento de un elemento a una nueva posición
   */
  public static async moveSmooth(el: HTMLElement, startPos: {x: number, y: number}, endPos: {x: number, y: number}, duration: number = 500) {
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;

    const animation = el.animate([
      { transform: `translate(${-dx}px, ${-dy}px)` },
      { transform: 'translate(0, 0)' }
    ], {
      duration,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    });

    return animation.finished;
  }

  /**
   * Efecto "Agujero Negro": El elemento se achica y viaja hacia un destino
   */
  /**
   * Efecto "Succión de Fideo": El elemento viaja físicamente y se encoge gradualmente.
   */
  public static async blackHoleSuck(el: HTMLElement, destination: HTMLElement, duration: number = 800, onUpdate?: () => void) {
    const startPos = {
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      w: el.offsetWidth,
      h: el.offsetHeight
    };

    const destRect = destination.getBoundingClientRect();
    const { viewport } = await import("./viewport/Viewport");
    const zoom = viewport.getZoom();
    const offset = viewport.getOffset();
    
    // Destino en coordenadas de mundo
    const destWorld = {
      x: (destRect.left + destRect.width / 2 - offset.x) / zoom,
      y: (destRect.top + destRect.height / 2 - offset.y) / zoom
    };

    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = progress * progress; // Aceleración (ease-in)

        // 1. Calcular tamaño actual
        const curW = startPos.w * (1 - progress);
        const curH = startPos.h * (1 - progress);
        
        // 2. Calcular centro actual del bloque viajando al destino
        const startCenterX = startPos.x + startPos.w / 2;
        const startCenterY = startPos.y + startPos.h / 2;
        
        const curCenterX = startCenterX + (destWorld.x - startCenterX) * ease;
        const curCenterY = startCenterY + (destWorld.y - startCenterY) * ease;

        // 3. Aplicar estilos (Posicionar desde el centro corregido)
        el.style.left = `${curCenterX - curW / 2}px`;
        el.style.top = `${curCenterY - curH / 2}px`;
        el.style.width = `${curW}px`;
        el.style.height = `${curH}px`;
        el.style.opacity = `${1 - progress * 0.8}`; 

        if (onUpdate) onUpdate();

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }
}
