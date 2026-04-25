import { IDE_CONFIG } from "../Config";
import { BlockRegistry } from "../BlockRegistry";
import { GeometricEngine } from "../GeometricEngine";
import { relationshipManager } from "../RelationshipManager";
import { AnimationManager } from "../AnimationManager";
import { blockManager } from "../BlockManager";

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
  public async suckConnectedNetwork(blockId: string, folder: HTMLElement, allConnectedIds: string[]) {
    const el = document.getElementById(blockId);
    if (!el) return;

    const suckPromises: Promise<void>[] = [];
    folder.classList.add('is-eating');

    const updateLinks = () => {
      allConnectedIds.forEach(id => {
        relationshipManager.drawLinksForBlock(id);
        relationshipManager.highlightLinks(id, true);
      });
    };

    const folderRect = GeometricEngine.getWorldRect(folder);
    const destination = { x: folderRect.cx, y: folderRect.cy };
    const folderInstance = blockManager.getBlocks().find(b => b.getElement() === folder) as any;

    // Capturar data de bloques y links ANTES de succionar
    if (folderInstance && folderInstance.addSwallowedBlock) {
      allConnectedIds.forEach(id => {
        const block = blockManager.getBlocks().find(b => b.getElement().id === id);
        if (block) {
          folderInstance.addSwallowedBlock(block.serialize());
          // Capturar links relacionados
          const links = relationshipManager.getLinksForBlock(id);
          links.forEach(l => folderInstance.addSwallowedLink({ fromId: l.fromId, toId: l.toId }));
        }
      });
    }

    suckPromises.push(
      AnimationManager.blackHoleSuck(el, destination, IDE_CONFIG.TRANSITIONS.SUCTION_DURATION, updateLinks).then(() => {
        relationshipManager.removeLinksForBlock(blockId);
        blockManager.deleteBlock(blockId);
      })
    );

    const others = allConnectedIds.filter(id => id !== blockId);
    others.forEach((id, index) => {
      const connectedEl = document.getElementById(id);
      if (connectedEl) {
        const type = id.split('_')[0] as any;
        const def = BlockRegistry.getDefinition(type);
        const mass = def ? def.mass : 1;
        const duration = IDE_CONFIG.TRANSITIONS.SUCTION_DURATION * mass;

        const promise = new Promise<void>(async (resolve) => {
          await new Promise(r => setTimeout(r, (index + 1) * IDE_CONFIG.PHYSICS.STAGGER_DELAY));
          await AnimationManager.blackHoleSuck(connectedEl, destination, duration, updateLinks, false);
          relationshipManager.removeLinksForBlock(id);
          blockManager.deleteBlock(id);
          resolve();
        });
        suckPromises.push(promise);
      }
    });

    await Promise.all(suckPromises);
    folder.classList.remove('is-eating');
  }
}

export const dragManager = new DragManager();
