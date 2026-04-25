import { BlockRegistry } from "../BlockRegistry";
import { GeometricEngine } from "../GeometricEngine";
import { relationshipManager } from "../RelationshipManager";
import { blockManager } from "../BlockManager";
import { workspaceState } from "../state/WorkspaceState";
import { SelectionManager } from "../SelectionManager";
import { chainPhysicsEngine } from "../ChainPhysicsEngine";

export interface Draggable {
  onDragStart(x: number, y: number): void;
  onDragMove(dx: number, dy: number): void;
  onDragEnd(x: number, y: number): void;
  getElement?(): HTMLElement;
}

export class DragManager {
  private activeDraggable: Draggable | null = null;
  private startMousePos = { x: 0, y: 0 };
  private isDragging = false;

  constructor() {
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  public register(draggable: Draggable, el: HTMLElement) {
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.activeDraggable = draggable;
      this.startMousePos = { x: e.clientX, y: e.clientY };
      this.isDragging = false;
    });
  }

  private onMouseDown(_e: MouseEvent) {
    // Si no es un bloque, drag del viewport
    // (Esto se maneja en el ViewportController usualmente)
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.activeDraggable) return;

    if (!this.isDragging) {
      const dist = Math.sqrt(Math.pow(e.clientX - this.startMousePos.x, 2) + Math.pow(e.clientY - this.startMousePos.y, 2));
      if (dist > 5) {
        this.isDragging = true;
        this.activeDraggable.onDragStart(this.startMousePos.x, this.startMousePos.y);
      }
    }

    if (this.isDragging) {
      const dx = e.clientX - this.startMousePos.x;
      const dy = e.clientY - this.startMousePos.y;
      this.activeDraggable.onDragMove(dx, dy);
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (this.activeDraggable) {
      if (this.isDragging) {
        this.activeDraggable.onDragEnd(e.clientX, e.clientY);
      }
      this.activeDraggable = null;
    }
    this.isDragging = false;
  }

  /**
   * Lógica de succión de red de bloques hacia una carpeta.
   */
  public async suckConnectedNetwork(blockId: string, folder: HTMLElement, allConnectedData: { id: string, level: number }[]) {
    const el = document.getElementById(blockId);
    if (!el) return;

    folder.classList.add('is-eating');

    const folderRect = GeometricEngine.getWorldRect(folder);
    const destination = { x: folderRect.cx, y: folderRect.cy };
    const folderInstance = blockManager.getBlocks().find(b => b.getElement() === folder) as any;

    const chainData: { id: string, element: HTMLElement, mass: number, serializeData: any }[] = [];

    allConnectedData.forEach(({ id }) => {
      const blockEl = document.getElementById(id);
      const blockInstance = blockManager.getBlocks().find(b => b.getElement().id === id);
      if (blockEl && blockInstance) {
        const type = id.split('_')[0] as any;
        const def = BlockRegistry.getDefinition(type);
        const mass = def ? def.mass : 1;

        chainData.push({
          id,
          element: blockEl,
          mass,
          serializeData: blockInstance.serialize()
        });
      }
    });

    const allConnectedIds = chainData.map(d => d.id);

    const updateLinks = () => {
      allConnectedIds.forEach(id => {
        relationshipManager.drawLinksForBlock(id);
        relationshipManager.highlightLinks(id, true);
      });
    };

    // Capturar data de bloques y links ANTES de succionar
    if (folderInstance && folderInstance.addSwallowedBlock) {
      chainData.forEach(({ id, serializeData }) => {
        folderInstance.addSwallowedBlock(serializeData);
        const links = relationshipManager.getLinksForBlock(id);
        links.forEach(l => folderInstance.addSwallowedLink({ fromId: l.fromId, toId: l.toId }));
        
        // BORRADO LÓGICO INMEDIATO (Para evitar duplicados en guardados concurrentes)
        blockManager.forgetBlock(id);
        workspaceState.removeBlock(id);
      });
    }

    // EJECUTAR FÍSICA DE RESORTES (Efecto Espagueti Real)
    await chainPhysicsEngine.startSuction(
      chainData.map(d => ({ id: d.id, element: d.element })),
      destination,
      updateLinks
    );

    // CLEANUP FINAL (Solo cuando todo el espagueti ha entrado)
    chainData.forEach((data, index) => {
      relationshipManager.removeLinksForBlock(data.id);
      data.element.remove(); // Borrado físico del DOM
      if (index === 0 && SelectionManager.getSelected() === data.element) {
        SelectionManager.clear();
      }
    });
    folder.classList.remove('is-eating');
  }
}

export const dragManager = new DragManager();
