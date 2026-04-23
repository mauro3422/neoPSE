import "./style.css";
import { themeManager } from "./core/theme-manager";
import { Block } from "./components/Block";
import { ViewportController } from "./core/viewport/ViewportController";
import { relationshipManager } from "./core/RelationshipManager";
import { BlockFactory } from "./core/BlockFactory";

class Workspace {
  private blocks: Block[] = [];
  private viewportController: ViewportController | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.viewportController = new ViewportController('board');

      // Initialize initial blocks
      ['#fn-main', '#fn-sum', '#note-context', '#assistant-panel'].forEach(s => {
        this.blocks.push(new Block(s));
      });

      relationshipManager.addLink('fn-main', 'fn-sum');
      relationshipManager.addLink('note-context', 'fn-sum');

      this.setupThemeToggle();
      this.setupCreationButtons();
      
      console.log('NeoPSE Workspace 2.1 (Interactive Links + Spawner) Initialized');
    } catch (error) {
      console.error('Failed to initialize Workspace:', error);
    }
  }

  private setupCreationButtons() {
    const addPseudoBtn = document.getElementById("add-pseudo");
    const addNoteBtn = document.getElementById("add-note");

    addPseudoBtn?.addEventListener("click", () => {
      const id = BlockFactory.createPseudocodeBlock(200, 200);
      this.blocks.push(new Block(`#${id}`));
    });

    addNoteBtn?.addEventListener("click", () => {
      const id = BlockFactory.createNoteBlock(200, 400);
      this.blocks.push(new Block(`#${id}`));
    });
  }

  private setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        themeManager.toggleTheme();
        setTimeout(() => relationshipManager.draw(), 300);
      });
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new Workspace();
});
