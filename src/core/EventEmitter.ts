export enum AppEvents {
  BLOCK_MOVE = 'BLOCK_MOVE',
  VIEWPORT_CHANGE = 'VIEWPORT_CHANGE',
  THEME_CHANGE = 'THEME_CHANGE',
  WORKSPACE_SAVE = 'WORKSPACE_SAVE',
  BLOCK_CREATED = 'BLOCK_CREATED',
  BLOCK_DELETED = 'BLOCK_DELETED',
  REQUEST_DELETE = 'REQUEST_DELETE'
}

/**
 * Mapa de tipos para los eventos.
 */
interface EventMap {
  [AppEvents.BLOCK_MOVE]: string; // blockId
  [AppEvents.VIEWPORT_CHANGE]: void;
  [AppEvents.THEME_CHANGE]: string; // theme name
  [AppEvents.WORKSPACE_SAVE]: void;
  [AppEvents.BLOCK_CREATED]: string; // blockId
  [AppEvents.BLOCK_DELETED]: string; // blockId
  [AppEvents.REQUEST_DELETE]: void;
}

type Callback<T> = (data: T) => void;

class EventEmitter {
  private events: Map<string, Set<Callback<any>>> = new Map();

  public on<K extends keyof EventMap>(event: K, callback: Callback<EventMap[K]>) {
    if (!this.events.has(event)) this.events.set(event, new Set());
    this.events.get(event)!.add(callback);
  }

  public off<K extends keyof EventMap>(event: K, callback: Callback<EventMap[K]>) {
    this.events.get(event)?.delete(callback);
  }

  // Sobrecarga para permitir omitir data si es void
  public emit<K extends keyof EventMap>(event: EventMap[K] extends void ? K : never): void;
  public emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
  public emit<K extends keyof EventMap>(event: K, data?: EventMap[K]) {
    this.events.get(event)?.forEach(cb => cb(data as any));
  }
}

export const eventBus = new EventEmitter();
