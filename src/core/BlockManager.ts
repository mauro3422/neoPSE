import { Block } from "../components/Block";
import { eventBus, AppEvents } from "./EventEmitter";
import { SelectionManager } from "./SelectionManager";

/**
 * Gestor central de la colección de bloques y su ciclo de vida. (POO)
 */
export class BlockManager {
  private static instance: BlockManager;
  private blocks: Block[] = [];

  private constructor() {
    this.initListeners();
  }

  public static getInstance(): BlockManager {
    if (!this.instance) this.instance = new BlockManager();
    return this.instance;
  }

  public getBlock(id: string): Block | undefined {
    return this.blocks.find(b => b.getElement().id === id);
  }

  private initListeners() {
    eventBus.on(AppEvents.BLOCK_DELETED, (id: string) => {
      this.blocks = this.blocks.filter(b => b.getElement().id !== id);
    });

    // Escuchar peticiones de borrado globales (desde InputSystem o ContextMenu)
    eventBus.on(AppEvents.REQUEST_DELETE, () => {
      this.deleteSelected();
    });
  }

  public registerBlock(block: Block) {
    this.blocks.push(block);
  }

  public forgetBlock(id: string) {
    this.blocks = this.blocks.filter(b => b.getElement().id !== id);
  }

  public getBlocks(): Block[] {
    return [...this.blocks];
  }

  public findBlockByElement(el: HTMLElement): Block | undefined {
    return this.blocks.find(b => b.getElement() === el);
  }

  public deleteBlock(id: string) {
    const block = this.blocks.find(b => b.getElement().id === id);
    if (block) {
      block.destroy();
    }
  }

  public deleteSelected() {
    const selected = SelectionManager.getSelected();
    if (selected) {
      const instance = this.findBlockByElement(selected);
      if (instance) {
        console.log(`[BlockManager] Destruyendo bloque: ${instance.getElement().id}`);
        instance.destroy();
      }
    }
  }

  public clear() {
    this.blocks = [];
  }
}

export const blockManager = BlockManager.getInstance();
