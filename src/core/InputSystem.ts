import { eventBus, AppEvents } from "./EventEmitter";

export class InputSystem {
  private static instance: InputSystem;

  private constructor() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  public static init() {
    if (!InputSystem.instance) {
      InputSystem.instance = new InputSystem();
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Esc: Cancelar acciones globales (como el modo enlace)
    if (e.key === 'Escape') {
      eventBus.emit(AppEvents.THEME_CHANGE); // Podríamos crear un evento GLOBAL_CANCEL
      document.body.classList.remove('linking-mode');
      document.querySelectorAll('.is-linking-source').forEach(el => el.classList.remove('is-linking-source'));
    }

    // Ctrl + Space: Abrir/Cerrar Asistente (ejemplo de atajo pro)
    if (e.ctrlKey && e.code === 'Space') {
      console.log("[InputSystem] Comando de Asistente invocado");
      // Lógica de toggle asistente...
    }
  }
}
