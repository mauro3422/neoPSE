import "./style.css";
import { themeManager } from "./core/theme-manager";
import { AssistantBlock } from "./components/AssistantBlock";
import { ViewportController } from "./core/viewport/ViewportController";
import { relationshipManager } from "./core/RelationshipManager";
import { BlockFactory } from "./core/BlockFactory";
import { CollisionSystem } from "./core/CollisionSystem";
import { eventBus, AppEvents } from "./core/EventEmitter";
import { Block } from "./components/Block";
import { workspaceState } from "./core/state/WorkspaceState";
import { BlockType } from "./types";
import { InputSystem } from "./core/InputSystem";
import { BlockRegistry } from "./core/BlockRegistry";
import { SpaceManager } from "./core/SpaceManager";
import { ContextMenu } from "./components/ContextMenu";

class Workspace {
  private blocks: Block[] = [];
  private contextMenu!: ContextMenu;

  constructor() {
    this.init();
    this.setupContextMenu();
  }

  private init() {
    try {
      InputSystem.init();
      new ViewportController('board');
      CollisionSystem.init();

      new AssistantBlock('#assistant-panel');

      this.rehydrateWorkspace();
      this.setupThemeToggle();
      this.setupProjectTitle();
      this.setupRecentering();
      
      console.log('NeoPSE Workspace 3.2 (Bugfix Ready) Initialized');
    } catch (error) {
      console.error('Failed to initialize Workspace:', error);
    }
  }

  private rehydrateWorkspace() {
    const data = workspaceState.getData();
    if (data.blocks.length === 0) {
      this.spawnInitialTutorial();
      return;
    }

    data.blocks
      .filter(b => b.type !== BlockType.ASSISTANT)
      .forEach(b => this.spawnBlockInstance(b.type, b.position.x, b.position.y, b.id, b.content, b.size));
    
    data.links.forEach(l => relationshipManager.addLink(l.fromId, l.toId));
  }

  private spawnBlockInstance(type: BlockType, x: number, y: number, id?: string, content?: string, size?: { width: number, height: number }) {
    const def = BlockRegistry.getDefinition(type);
    if (!def) return;

    // CAPTURAMOS EL ID REAL (Importante para bloques nuevos)
    let finalId = id;
    if (!id || !document.getElementById(id)) {
      finalId = BlockFactory.createBlock(type, x, y, id);
    }

    const el = document.getElementById(finalId!);
    if (el && size) {
      el.style.width = `${size.width}px`;
      el.style.height = `${size.height}px`;
    }

    const instance = new def.controller(`#${finalId}`);
    this.blocks.push(instance);
    
    // Si el bloque es nuevo, lo registramos en el estado
    if (!id) {
       workspaceState.addBlock({ 
         id: finalId!, 
         type, 
         position: { x, y }, 
         content: content || '' 
       });
    }
  }

  private spawnInitialTutorial() {
    const tutorialBlocks = [
      { id: 'fn-main', type: BlockType.PSEUDOCODE, x: 100, y: 100 },
      { id: 'fn-sum', type: BlockType.PSEUDOCODE, x: 700, y: 100 },
      { id: 'note-context', type: BlockType.NOTE, x: 400, y: 500 }
    ];

    tutorialBlocks.forEach(b => {
      this.spawnBlockInstance(b.type, b.x, b.y, b.id);
    });
    
    workspaceState.addLink('fn-main', 'fn-sum');
    workspaceState.addLink('note-context', 'fn-sum');
    relationshipManager.addLink('fn-main', 'fn-sum');
    relationshipManager.addLink('note-context', 'fn-sum');
  }

  private setupProjectTitle() {
    const titleEl = document.querySelector('.project-info');
    if (titleEl) {
      titleEl.setAttribute('contenteditable', 'true');
    }
  }

  private setupRecentering() {
    document.getElementById("recenter-btn")?.addEventListener("click", () => {
      import("./core/viewport/Viewport").then(({ viewport }) => {
        viewport.setZoom(1.0);
        viewport.setOffset(0, 0);
        eventBus.emit(AppEvents.VIEWPORT_CHANGE, undefined as any);
      });
    });
  }

  private setupContextMenu() {
    this.contextMenu = new ContextMenu((type, screenPos) => {
      const worldPos = SpaceManager.screenToWorld(screenPos.x, screenPos.y);
      this.spawnBlockInstance(type as BlockType, worldPos.x, worldPos.y);
    });
  }

  private setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        themeManager.toggleTheme();
      });
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new Workspace();
});
