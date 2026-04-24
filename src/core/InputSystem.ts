import { eventBus, AppEvents } from "./EventEmitter";
import { commandManager } from "./CommandManager";

export class InputSystem {
  private static instance: InputSystem;

  private constructor() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  public static init() {
    if (!InputSystem.instance) InputSystem.instance = new InputSystem();
  }

  private handleKeyDown(e: KeyboardEvent) {
    // 1. Atajos de una sola tecla
    switch (e.key) {
      case 'Escape':
        this.handleEscape();
        break;
    }

    // 2. Atajos con modificadores (Ctrl / Meta)
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

  private handleEscape() {
    document.body.classList.remove('linking-mode');
    document.querySelectorAll('.is-linking-source').forEach(el => el.classList.remove('is-linking-source'));
    // En el futuro: cerrar modales, cancelar arrastres, etc.
  }
}
