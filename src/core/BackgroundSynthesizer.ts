import { eventBus, AppEvents } from "./EventEmitter";
import { ContextPacker } from "./ContextPacker";
import { AIService } from "./AIService";

export class BackgroundSynthesizer {
  private static instance: BackgroundSynthesizer;
  private cooldownTimeout: number | null = null;
  private extendedCooldown: boolean = false;
  private isProcessing: boolean = false;

  private constructor() {
    this.initListeners();
  }

  public static getInstance(): BackgroundSynthesizer {
    if (!this.instance) this.instance = new BackgroundSynthesizer();
    return this.instance;
  }

  private initListeners() {
    // Escuchar cambios de movimiento de bloques o guardados
    eventBus.on(AppEvents.BLOCK_MOVE, () => this.triggerCooldown());
    eventBus.on(AppEvents.WORKSPACE_SAVE, () => this.triggerCooldown());
  }

  public triggerCooldown() {
    if (this.extendedCooldown || this.isProcessing) return;

    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
    }

    // 10 segundos de inactividad
    this.cooldownTimeout = window.setTimeout(() => {
      this.runAnalysis();
    }, 10000);
  }

  private async runAnalysis() {
    if (this.extendedCooldown || this.isProcessing) return;

    this.isProcessing = true;
    console.log("[BackgroundSynthesizer] 🧠 Iniciando análisis de fondo...");

    try {
      const contextPack = ContextPacker.pack();

      // Llamamos al servicio de IA pasándole la marca especial BACKGROUND_AGENT
      const response = await AIService.sendMessage(
        "Analiza el flujo actual del canvas y devuelve sugerencias.", 
        contextPack, 
        "BACKGROUND_AGENT"
      );

      // Si tiene una sugerencia estructurada
      let parsed: any = null;
      try {
        let jsonStr = response.message;
        // Limpieza básica de markdown
        jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch {
        // Fallback si no es JSON válido
      }

      if (parsed && parsed.hasSuggestion) {
        this.showPopup(parsed);
      } else {
        console.log("[BackgroundSynthesizer] ✨ No hay sugerencias urgentes en este ciclo.");
      }

    } catch (e) {
      console.error("[BackgroundSynthesizer] Error en análisis:", e);
    } finally {
      this.isProcessing = false;
    }
  }

  private showPopup(data: any) {
    console.log("[BackgroundSynthesizer] 🔔 Sugerencia disponible:", data);
    
    // Evitar duplicados de popups en pantalla
    const existing = document.querySelector('.ai-floating-popup');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'ai-floating-popup';
    container.innerHTML = `
      <div class="ai-popup-header">
        <span class="ai-popup-icon">🧠</span>
        <span class="ai-popup-title">${data.title || 'Sugerencia de IA'}</span>
      </div>
      <div class="ai-popup-body">
        <p class="ai-popup-desc">${data.problem || ''}</p>
        ${data.correction ? `<pre class="ai-popup-code"><code>${data.correction}</code></pre>` : ''}
      </div>
      <div class="ai-popup-actions">
        <button class="ai-popup-btn accept">Aceptar</button>
        <button class="ai-popup-btn ignore">Ignorar</button>
      </div>
    `;

    document.body.appendChild(container);

    const removePopup = () => {
      container.classList.add('fade-out');
      setTimeout(() => container.remove(), 300);
      
      // Aplicar Sueño Profundo (Cooldown Extendido) de 60 segundos
      this.extendedCooldown = true;
      console.log("[BackgroundSynthesizer] 💤 Entrando en sueño profundo (60s)");
      setTimeout(() => {
        this.extendedCooldown = false;
        this.triggerCooldown();
      }, 60000);
    };

    container.querySelector('.accept')?.addEventListener('click', () => {
      if (data.blockId && data.correction) {
        // Actualizar UI del bloque de manera reactiva
        const blockEl = document.getElementById(data.blockId);
        if (blockEl) {
          const contentArea = blockEl.querySelector('.code-area') || blockEl.querySelector('textarea');
          if (contentArea) {
            if (contentArea.tagName === 'TEXTAREA') {
              (contentArea as HTMLTextAreaElement).value = data.correction;
            } else {
              contentArea.textContent = data.correction;
            }
            // Emitir evento de modificación de bloque para que WorkspaceState guarde
            eventBus.emit(AppEvents.BLOCK_MOVE, data.blockId);
          }
        }
      }
      removePopup();
    });

    container.querySelector('.ignore')?.addEventListener('click', () => {
      removePopup();
    });
  }
}

export const backgroundSynthesizer = BackgroundSynthesizer.getInstance();
