import "./style.css";
import { themeManager } from "./core/theme-manager";
import { Block } from "./components/Block";

class Workspace {
  private blocks: Block[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      // Initialize blocks by selector
      const selectors = ['.editor-block', '.notes-block', '.chat-block', '.diagram-block'];
      this.blocks = selectors.map(s => new Block(s));

      this.setupThemeToggle();
      console.log('NeoPSE Workspace Robustly Initialized');
    } catch (error) {
      console.error('Failed to initialize Workspace:', error);
    }
  }

  private setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => themeManager.toggleTheme());
    }
  }
}

// Start the application
window.addEventListener("DOMContentLoaded", () => {
  new Workspace();
});
