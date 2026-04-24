import { BlockData, LinkData, WorkspaceData, BlockType } from "../../types";
import { eventBus, AppEvents } from "../EventEmitter";
import { APP_CONFIG } from "../Constants";

export interface ExtendedWorkspaceData extends WorkspaceData {
  theme: string;
}

export class WorkspaceState {
  private static instance: WorkspaceState;
  private saveTimeout: number | null = null;
  
  private data: ExtendedWorkspaceData = {
    blocks: [],
    links: [],
    theme: 'obsidian'
  };

  private constructor() {
    this.loadFromStorage();
    eventBus.on(AppEvents.BLOCK_MOVE, () => this.requestSave());
    eventBus.on(AppEvents.VIEWPORT_CHANGE, () => this.requestSave());
    eventBus.on(AppEvents.THEME_CHANGE, (theme: string) => {
      this.data.theme = theme;
      this.requestSave();
    });
  }

  public static getInstance(): WorkspaceState {
    if (!WorkspaceState.instance) {
      WorkspaceState.instance = new WorkspaceState();
    }
    return WorkspaceState.instance;
  }

  public getTheme(): string {
    return this.data.theme;
  }

  public addBlock(block: BlockData) {
    if (!this.data.blocks.find(b => b.id === block.id)) {
      this.data.blocks.push(block);
      this.requestSave();
    }
  }

  public removeBlock(id: string) {
    this.data.blocks = this.data.blocks.filter(b => b.id !== id);
    this.data.links = this.data.links.filter(l => l.fromId !== id && l.toId !== id);
    this.requestSave();
  }

  public addLink(fromId: string, toId: string) {
    if (!this.data.links.some(l => l.fromId === fromId && l.toId === toId)) {
      this.data.links.push({ fromId, toId });
      this.requestSave();
    }
  }

  public updateBlockContent(id: string, content: string) {
    const block = this.data.blocks.find(b => b.id === id);
    if (block) {
      block.content = content;
      this.requestSave();
    }
  }

  public getData(): ExtendedWorkspaceData {
    return this.data;
  }

  private requestSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = window.setTimeout(() => this.saveToStorage(), 500);
  }

  private saveToStorage() {
    this.data.blocks = this.data.blocks.map(block => {
      const el = document.getElementById(block.id);
      if (el) {
        const { x, y } = { x: parseFloat(el.style.left) || 0, y: parseFloat(el.style.top) || 0 };
        return { ...block, position: { x, y } };
      }
      return block;
    });

    localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(this.data));
  }

  private loadFromStorage() {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (saved) {
      try {
        this.data = { ...this.data, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to load workspace state", e);
      }
    }
  }
}

export const workspaceState = WorkspaceState.getInstance();
