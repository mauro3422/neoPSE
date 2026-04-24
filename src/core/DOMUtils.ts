export class DOMUtils {
  /**
   * Ajusta automáticamente la altura de un elemento (textarea) según su contenido.
   */
  public static autoResize(el: HTMLElement) {
    if (el instanceof HTMLTextAreaElement || el.getAttribute('contenteditable') === 'true') {
      el.style.height = 'auto';
      const newHeight = el.scrollHeight;
      el.style.height = `${newHeight}px`;
    }
  }

  /**
   * Configura un listener de auto-resize persistente.
   */
  public static setupAutoResize(el: HTMLElement) {
    const handler = () => this.autoResize(el);
    el.addEventListener('input', handler);
    // Ejecución inicial con delay para asegurar que el DOM esté listo
    setTimeout(handler, 50);
  }
}
