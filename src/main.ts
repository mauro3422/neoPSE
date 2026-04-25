import "./style.css";
import { themeManager } from "./core/theme-manager";
import { AssistantBlock } from "./components/AssistantBlock";
import { ViewportController } from "./core/viewport/ViewportController";
import { relationshipManager } from "./core/RelationshipManager";
import { BlockFactory } from "./core/BlockFactory";
import { eventBus, AppEvents } from "./core/EventEmitter";
import { Block } from "./components/Block";
import { workspaceState } from "./core/state/WorkspaceState";
import { BlockType } from "./types";
import { InputSystem } from "./core/InputSystem";
import { BlockRegistry } from "./core/BlockRegistry";
import { initBlockRegistry } from "./core/BlocksRegistration";
import { ParticleSystem } from "./core/ParticleSystem";
import { GeometricEngine } from "./core/GeometricEngine";
import { ContextMenu } from "./components/ContextMenu";
import { blockManager } from "./core/BlockManager";
import { AnimationManager } from "./core/AnimationManager";

initBlockRegistry();

class Workspace {
  // @ts-ignore
  private _contextMenu: ContextMenu | null = null;

  constructor() {
    this.init();
    this.setupContextMenu(); 
  }

  private init() {
    try {
      InputSystem.init();
      ParticleSystem.init('canvas');
      new ViewportController('board');

      new AssistantBlock('#assistant-panel');

      this.rehydrateWorkspace();
      this.setupThemeToggle();
      this.setupProjectTitle();
      this.setupRecentering();
      this.listenToEvents();
      
      console.log('NeoPSE Workspace 0.6.0 (Hardened) Initialized');
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

    const canvas = document.getElementById('canvas');

    data.blocks
      .filter(b => b.type !== BlockType.ASSISTANT)
      .forEach(b => {
        const instance = this.spawnBlockInstance(b.type, b.position.x, b.position.y, b.id, b.content, b.size);
        if (instance && canvas) canvas.appendChild(instance.getElement());
      });
    data.links.forEach(l => relationshipManager.addLink(l.fromId, l.toId));
  }

  private listenToEvents() {
    // Escuchar cambios globales de guardado
    eventBus.on(AppEvents.WORKSPACE_SAVE, () => workspaceState.saveToStorage());

    // Escuchar creación de bloques (para White Hole Burst)
    eventBus.on(AppEvents.BLOCK_CREATED, (data: any) => {
      const { type, position, id, content, size, spawnOrigin } = data;
      
      // Asegurar que el bloque existe en el estado ANTES de instanciarlo
      // Esto es CRÍTICO para que el constructor (rehydrate) funcione
      if (id && !workspaceState.getData().blocks.find(b => b.id === id)) {
        workspaceState.addBlock({ id, type, position, content, size });
      }

      const instance = this.spawnBlockInstance(type, position.x, position.y, id, content, size);
      
      if (instance) {
        const canvas = document.getElementById('canvas');
        if (canvas) canvas.appendChild(instance.getElement());

        if (spawnOrigin) {
          AnimationManager.whiteHoleBurst(instance.getElement(), spawnOrigin, position);
        }
      }
    });
  }

  private spawnBlockInstance(type: BlockType, x: number, y: number, id?: string, content?: string, size?: { width: number, height: number }): Block | null {
    const def = BlockRegistry.getDefinition(type);
    if (!def) return null;

    const el = BlockFactory.createBlock(type, x, y, id);
    if (!el) return null;

    const finalId = el.id;
    el.setAttribute('tabindex', '-1'); // Permitir foco para captura de eventos
    if (size) {
      // Migración: Si es una carpeta y tiene el tamaño viejo (120 o 80), forzar a 64
      if (type === BlockType.FOLDER && (size.width > 64)) {
        el.style.width = `64px`;
        el.style.height = `64px`;
      } else {
        el.style.width = `${size.width}px`;
        el.style.height = `${size.height}px`;
      }
    }

    const instance = new def.controller(el);
    blockManager.registerBlock(instance);
    
    if (!id) {
       workspaceState.addBlock({ 
         id: finalId, 
         type, 
         position: { x, y }, 
         content: content || '' 
       });
       document.getElementById('canvas')?.appendChild(el);
    }

    return instance;
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
    this._contextMenu = new ContextMenu(
      (type, screenPos) => {
        const worldPos = GeometricEngine.screenToWorld(screenPos);
        const instance = this.spawnBlockInstance(type as BlockType, worldPos.x, worldPos.y);
        if (instance) {
          const canvas = document.getElementById('canvas');
          if (canvas) canvas.appendChild(instance.getElement());
        }
      },
      (targetEl) => {
        const instance = blockManager.findBlockByElement(targetEl);
        if (instance) instance.destroy();
      }
    );
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
