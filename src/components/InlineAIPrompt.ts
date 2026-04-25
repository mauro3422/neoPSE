import { ContextPacker } from "../core/ContextPacker";

/**
 * Overlay flotante para prompts de IA específicos de un bloque.
 */
export class InlineAIPrompt {
  private static activeEl: HTMLElement | null = null;
  private static currentBlockId: string | null = null;

  public static show(blockId: string) {
    this.hide();
    
    this.currentBlockId = blockId;
    const blockEl = document.getElementById(blockId);
    if (!blockEl) return;

    this.activeEl = document.createElement('div');
    this.activeEl.className = 'inline-ai-prompt';
    
    // Posicionamiento inteligente
    const rect = blockEl.getBoundingClientRect();
    this.activeEl.style.position = 'fixed';
    this.activeEl.style.left = `${rect.right + 15}px`;
    this.activeEl.style.top = `${rect.top}px`;
    this.activeEl.style.zIndex = '9000';

    this.activeEl.innerHTML = `
      <div class="prompt-header">
        <span>🤖 Asistente Inline</span>
        <button class="close-prompt">✕</button>
      </div>
      <div class="prompt-body">
        <textarea placeholder="¿Qué quieres que la IA haga con este bloque?..." class="prompt-input"></textarea>
        <button class="generate-btn">Generar Lógica ✨</button>
      </div>
    `;

    document.body.appendChild(this.activeEl);

    // Eventos
    const closeBtn = this.activeEl.querySelector('.close-prompt');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    // Prevenir que el click en el prompt cierre el menú contextual (si estuviera abierto)
    this.activeEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const input = this.activeEl.querySelector('.prompt-input') as HTMLTextAreaElement;
    const generateBtn = this.activeEl.querySelector('.generate-btn') as HTMLElement;

    generateBtn.addEventListener('click', () => {
      this.handleGenerate(input.value);
    });

    // Auto focus
    setTimeout(() => input.focus(), 50);
  }

  public static hide() {
    if (this.activeEl) {
      this.activeEl.remove();
      this.activeEl = null;
      this.currentBlockId = null;
    }
  }

  private static handleGenerate(prompt: string) {
    if (!prompt.trim()) return;

    // Cambiar estado a cargando
    const btn = this.activeEl?.querySelector('.generate-btn') as HTMLElement;
    if (btn) {
      btn.textContent = 'Pensando... 🧠';
      btn.style.opacity = '0.7';
      btn.style.pointerEvents = 'none';
    }

    // Empaquetar contexto para enviárselo a la IA
    const aiContext = ContextPacker.pack();
    console.log(`[Inline AI] Enviando contexto a la IA para el bloque ${this.currentBlockId}:`, aiContext);

    // Simulación de respuesta de IA (temporal hasta conectar el backend)
    setTimeout(() => {
      this.simulateAIResponse(prompt);
    }, 1500);
  }

  private static simulateAIResponse(prompt: string) {
    this.hide();
    alert(`[NeoPSE IA] Simulación exitosa.\nPrompt: "${prompt}"\nContexto leído: OK.`);
  }
}
