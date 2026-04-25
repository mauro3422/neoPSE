import { eventBus, AppEvents } from "./EventEmitter";
import { commandManager } from "./CommandManager";

export class InputSystem {
  private static instance: InputSystem;

  private constructor() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
  }

  public static init() {
    if (!InputSystem.instance) InputSystem.instance = new InputSystem();
  }

  private handleKeyDown(e: KeyboardEvent) {
    const typing = this.isTyping();

    // 1. Acciones globales que NO dependen de estar escribiendo
    if (e.key === 'Escape') {
      this.handleEscape();
      return;
    }

    // 2. Acciones que SOLO ocurren si NO estamos escribiendo
    if (!typing) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        eventBus.emit(AppEvents.REQUEST_DELETE);
        e.preventDefault();
        return;
      }
    }

    // 3. Atajos con modificadores (Ctrl / Meta)
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.shiftKey) commandManager.redo();
          else commandManager.undo();
          e.preventDefault();
          break;
        case 'y':
          commandManager.redo();
          e.preventDefault();
          break;
        case 's':
          eventBus.emit(AppEvents.WORKSPACE_SAVE);
          e.preventDefault();
          break;
      }
    }
  }

  private isTyping(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    
    return el.tagName === 'INPUT' || 
           el.tagName === 'TEXTAREA' || 
           el.getAttribute('contenteditable') === 'true' ||
           el.classList.contains('code-area');
  }

  private handleEscape() {
    document.body.classList.remove('linking-mode');
    document.querySelectorAll('.is-linking-source').forEach(el => el.classList.remove('is-linking-source'));
  }
}
