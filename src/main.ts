import "./style.css";
import { themeManager } from "./core/theme-manager";
import { AssistantBlock } from "./components/AssistantBlock";
import { ViewportController } from "./core/viewport/ViewportController";
import { relationshipManager } from "./core/RelationshipManager";
import { BlockFactory } from "./core/BlockFactory";
import { eventBus, AppEvents, BlockCreatedPayload } from "./core/EventEmitter";
import { Block } from "./components/Block";
import { workspaceState } from "./core/state/WorkspaceState";
import { BlockType } from "./types";
import { InputSystem } from "./core/InputSystem";
import { BlockRegistry } from "./core/BlockRegistry";
import { initBlockRegistry } from "./core/BlocksRegistration";
import { ParticleSystem } from "./core/ParticleSystem";
import { GeometricEngine } from "./core/GeometricEngine";
import { ChatContextState } from "./core/ChatContextState";
import { ContextMenu } from "./components/ContextMenu";
import { blockManager } from "./core/BlockManager";
import { AnimationManager } from "./core/AnimationManager";
import { backgroundSynthesizer } from "./core/BackgroundSynthesizer";

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
      ChatContextState.init();

      this.rehydrateWorkspace();
      this.setupThemeToggle();
      this.setupAIDebugger();
      this.setupProjectTitle();
      this.setupRecentering();
      this.listenToEvents();
      
      backgroundSynthesizer.triggerCooldown();
      console.log('NeoPSE Workspace 0.8.0 (Hardened) Initialized');
    } catch (error) {
      console.error('Failed to initialize Workspace:', error);
    }
  }

  private rehydrateWorkspace() {
    const data = workspaceState.getData();
    const tutorialSpawned = localStorage.getItem('neopse_tutorial_spawned');

    if (data.blocks.length === 0 && !tutorialSpawned) {
      localStorage.setItem('neopse_tutorial_spawned', 'true');
      this.spawnInitialTutorial();
      return;
    }

    data.blocks
      .filter(b => b.type !== BlockType.ASSISTANT)
      .forEach(b => {
        this.spawnBlockInstance(b.type, b.position.x, b.position.y, b.id, b.content, b.size);
      });
    data.links.forEach(l => relationshipManager.addLink(l.fromId, l.toId));
  }

  private listenToEvents() {
    // Escuchar cambios globales de guardado
    eventBus.on(AppEvents.WORKSPACE_SAVE, () => workspaceState.saveToStorage());

    // Escuchar creación de bloques (para White Hole Burst)
    eventBus.on(AppEvents.BLOCK_CREATED, (data: BlockCreatedPayload) => {
      const { type, position, id, content, size, spawnOrigin } = data;
      console.log(`[App] BLOCK_CREATED recibido: ${id} (${type})`, { position, size, hasOrigin: !!spawnOrigin });
      
      if (id && !workspaceState.getData().blocks.find(b => b.id === id)) {
        workspaceState.addBlock({ id: id as string, type, position, content: content || '', size });
      }

      const instance = this.spawnBlockInstance(type, position.x, position.y, id, content, size, !!spawnOrigin);
      
      if (instance) {
        if (spawnOrigin) {
          console.log(`[App] Iniciando White Hole Burst para ${id}`);
          AnimationManager.whiteHoleBurst(instance.getElement(), spawnOrigin, position);
        }
      } else {
        console.error(`[App] Error: No se pudo instanciar el bloque ${id} de tipo ${type}`);
      }
    });
  }

  private spawnBlockInstance(type: BlockType, x: number, y: number, id?: string, content?: string, size?: { width: number, height: number }, skipAnimation: boolean = false): Block | null {
    const def = BlockRegistry.getDefinition(type);
    if (!def) return null;

    const el = BlockFactory.createBlock(type, x, y, id);
    if (!el) return null;

    const finalId = el.id;
    el.setAttribute('tabindex', '-1'); // Permitir foco para captura de eventos
    if (size) {
      // Migración: Si es una carpeta y tiene el tamaño viejo (120 o 80), forzar a 64
      if (type === BlockType.FOLDER) {
        el.style.width = `64px`;
        el.style.height = `80px`;
      } else {
        el.style.width = `${size.width}px`;
        el.style.height = `${size.height}px`;
      }
    }

    document.getElementById('canvas')?.appendChild(el);

    const instance = new def.controller(el, skipAnimation);
    blockManager.registerBlock(instance);
    
    if (!id) {
       workspaceState.addBlock({ 
         id: finalId, 
         type, 
         position: { x, y }, 
         content: content || '' 
       });
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

  private setupAIDebugger() {
    const debugBtn = document.getElementById("debug-ai-btn");
    const modal = document.getElementById("ai-debugger-modal");
    const closeBtn = document.getElementById("close-debugger-btn");
    const refreshBtn = document.getElementById("refresh-debugger-btn");
    const content = document.getElementById("debug-content");

    if (debugBtn && modal) {
      debugBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        this.updateAIDebuggerContent(content);
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    if (refreshBtn && content) {
      refreshBtn.addEventListener("click", () => {
        this.updateAIDebuggerContent(content);
      });
    }
  }

  private updateAIDebuggerContent(el: HTMLElement | null) {
    if (!el) return;
    import("./core/ContextPacker").then(({ ContextPacker }) => {
      const pkg = ContextPacker.pack();
      import("./core/PromptBuilder").then(({ AssistantPrompt }) => {
        const builder = new AssistantPrompt(pkg);
        const prompt = builder.buildSystemPrompt();
        
        el.innerHTML = `
          <h3 style="color: var(--accent-color); margin-top: 0;">📦 Context Pack (Payload):</h3>
          <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; overflow-x: auto;">\${JSON.stringify(pkg, null, 2)}</pre>
          
          <h3 style="color: var(--accent-color); margin-top: 20px;">📜 Final System Prompt:</h3>
          <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; white-space: pre-wrap; overflow-x: auto;">\${prompt}</pre>
        `.replace('\${JSON.stringify(pkg, null, 2)}', JSON.stringify(pkg, null, 2))
         .replace('\${prompt}', prompt);
      });
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new Workspace();
});
