import { Vector2 } from "./Constants";
import { viewport } from "./viewport/Viewport";

export class SpaceManager {
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
   * Convierte una posición de pantalla (ej. clic del mouse) a posición de mundo.
   * Tiene en cuenta el Zoom y el Panning actual del Viewport.
   */
  public static screenToWorld(screenX: number, screenY: number): Vector2 {
    const zoom = viewport.getZoom();
    const offset = viewport.getOffset();

    return {
      x: (screenX - offset.x) / zoom,
      y: (screenY - offset.y) / zoom
    };
  }

  /**
   * Obtiene una posición de spawn "segura" en el centro de la vista actual.
   */
  public static getViewportCenter(): Vector2 {
    const vw = window.innerWidth / 2;
    const vh = window.innerHeight / 2;
    return this.screenToWorld(vw, vh);
  }
}
