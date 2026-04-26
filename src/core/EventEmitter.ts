import { BlockType } from "../types";

export enum AppEvents {
  BLOCK_MOVE = 'BLOCK_MOVE',
  VIEWPORT_CHANGE = 'VIEWPORT_CHANGE',
  THEME_CHANGE = 'THEME_CHANGE',
  WORKSPACE_SAVE = 'WORKSPACE_SAVE',
  BLOCK_CREATED = 'BLOCK_CREATED',
  BLOCK_DELETED = 'BLOCK_DELETED',
  REQUEST_DELETE = 'REQUEST_DELETE',
  REQUEST_OPEN_FOLDER = 'REQUEST_OPEN_FOLDER',
  REQUEST_SUCTION = 'REQUEST_SUCTION',
  MODULE_CREATED = 'MODULE_CREATED'
}

export interface BlockCreatedPayload {
  type: BlockType;
  position: { x: number; y: number };
  id?: string;
  content?: string;
  size?: { width: number; height: number };
  spawnOrigin?: { x: number; y: number };
}

/**
 * Mapa de tipos para los eventos.
 */
interface EventMap {
  [AppEvents.BLOCK_MOVE]: string; // blockId
  [AppEvents.VIEWPORT_CHANGE]: void;
  [AppEvents.THEME_CHANGE]: string; // theme name
  [AppEvents.WORKSPACE_SAVE]: void;
  [AppEvents.BLOCK_CREATED]: BlockCreatedPayload;
  [AppEvents.BLOCK_DELETED]: string; // blockId
  [AppEvents.REQUEST_DELETE]: void;
  [AppEvents.REQUEST_OPEN_FOLDER]: string; // folderId
  [AppEvents.REQUEST_SUCTION]: { firstId: string, folderEl: HTMLElement, connectedData: { id: string, level: number }[] };
  [AppEvents.MODULE_CREATED]: { filename: string, content: string };
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
