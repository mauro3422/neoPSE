import { relationshipManager } from "./RelationshipManager";
import { workspaceState } from "./state/WorkspaceState";
import { GeometricEngine } from "./GeometricEngine";

/**
 * Gestiona el proceso de creación de conexiones entre componentes.
 */
export class ConnectionManager {
  private static instance: ConnectionManager;
  private sourceId: string | null = null;
  private isLinking: boolean = false;
  private currentHoverId: string | null = null;

  private constructor() {
    this.initGlobalEvents();
  }

  public static getInstance(): ConnectionManager {
    if (!this.instance) this.instance = new ConnectionManager();
    return this.instance;
  }

  private initGlobalEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isLinking) this.cancel();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isLinking || !this.sourceId) return;

      const worldPos = GeometricEngine.screenToWorld({ x: e.clientX, y: e.clientY });
      
      // Detectar si el mouse está sobre un bloque (Hover Detection)
      const target = e.target as HTMLElement;
      const blockEl = target.closest('.world-block');
      this.currentHoverId = blockEl ? blockEl.id : null;

      // Si el hover es el mismo que el origen, lo ignoramos para la previsualización
      const previewId = (this.currentHoverId !== this.sourceId) ? this.currentHoverId : null;

      relationshipManager.drawGhostLink(this.sourceId, worldPos.x, worldPos.y, previewId);
    });
  }

  public start(sourceId: string) {
    this.sourceId = sourceId;
    this.isLinking = true;
    document.body.classList.add('linking-mode');
  }

  public complete(targetId: string) {
    if (!this.isLinking || !this.sourceId || this.sourceId === targetId) return;

    const sourceIsFolder = this.sourceId.startsWith('folder');
    const targetIsFolder = targetId.startsWith('folder');

    if (sourceIsFolder && !targetIsFolder) {
      console.warn("[ConnectionManager] Un módulo solo puede conectarse a otro módulo.");
      this.cancel();
      return;
    }
    if (!sourceIsFolder && targetIsFolder) {
      console.warn("[ConnectionManager] Los bloques no pueden conectarse a módulos directamente.");
      this.cancel();
      return;
    }

    relationshipManager.addLink(this.sourceId, targetId);
    workspaceState.addLink(this.sourceId, targetId);
    
    this.cancel();
  }

  public cancel() {
    this.sourceId = null;
    this.isLinking = false;
    this.currentHoverId = null;
    document.body.classList.remove('linking-mode');
    document.querySelectorAll('.is-linking-source').forEach(el => el.classList.remove('is-linking-source'));
    relationshipManager.clearGhostLink();
  }

  public getIsLinking() { return this.isLinking; }
}

export const connectionManager = ConnectionManager.getInstance();
