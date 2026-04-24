export enum AppEvents {
  BLOCK_MOVE = 'BLOCK_MOVE',
  VIEWPORT_CHANGE = 'VIEWPORT_CHANGE',
  THEME_CHANGE = 'THEME_CHANGE',
  WORKSPACE_SAVE = 'WORKSPACE_SAVE'
}

/**
 * Mapa de tipos para los payloads de los eventos.
 * Esto garantiza que no enviemos datos incorrectos.
 */
export interface EventPayloads {
  [AppEvents.BLOCK_MOVE]: string; // transporta el ID del bloque
  [AppEvents.VIEWPORT_CHANGE]: void;
  [AppEvents.THEME_CHANGE]: string; // transporta el nombre del tema
  [AppEvents.WORKSPACE_SAVE]: void;
}

type Handler<T> = (data: T) => void;

class EventEmitter {
  private events: Map<string, Handler<any>[]> = new Map();

  public on<K extends AppEvents>(event: K, handler: Handler<EventPayloads[K]>) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event)!.push(handler);
  }

  public emit<K extends AppEvents>(event: K, data: EventPayloads[K]) {
    this.events.get(event)?.forEach(handler => handler(data));
  }
}

export const eventBus = new EventEmitter();
