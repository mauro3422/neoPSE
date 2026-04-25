import { ContextPacker } from "../core/ContextPacker";

export interface Message {
  role: 'user' | 'ai';
  content: string;
}

/**
 * Chat Inline temporal enlazado a un bloque específico.
 */
export class InlineAIPrompt {
  private static activeEl: HTMLElement | null = null;
  private static currentBlockId: string | null = null;
  private static conversations: Map<string, Message[]> = new Map();

  public static show(blockId: string) {
    this.hide();
    
    this.currentBlockId = blockId;
    const blockEl = document.getElementById(blockId);
    if (!blockEl) return;

    // Inicializar conversación si no existe
    if (!this.conversations.has(blockId)) {
      this.conversations.set(blockId, [
        { role: 'ai', content: '¡Hola! Soy tu copiloto para este bloque. ¿Quieres que te explique la lógica, que genere código o prefieres reformular la idea?' }
      ]);
    }

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
      <div class="prompt-messages"></div>
      <div class="prompt-body">
        <textarea placeholder="Pregunta o pide una acción..." class="prompt-input"></textarea>
        <button class="generate-btn">Enviar 📨</button>
      </div>
    `;

    document.body.appendChild(this.activeEl);

    this.renderMessages();

    // Eventos
    const closeBtn = this.activeEl.querySelector('.close-prompt');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    this.activeEl.addEventListener('click', (e) => e.stopPropagation());

    const input = this.activeEl.querySelector('.prompt-input') as HTMLTextAreaElement;
    const sendBtn = this.activeEl.querySelector('.generate-btn') as HTMLElement;

    const sendMessage = () => {
      const text = input.value.trim();
      if (!text) return;
      this.handleUserMessage(text);
      input.value = '';
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    setTimeout(() => input.focus(), 50);
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private static renderMessages() {
    if (!this.activeEl || !this.currentBlockId) return;
    const container = this.activeEl.querySelector('.prompt-messages') as HTMLElement;
    if (!container) return;

    const messages = this.conversations.get(this.currentBlockId) || [];
    
    let html = '';
    messages.forEach(m => {
      let thinkText = '';
      let mainText = m.content;
      
      if (m.content.includes('<think>') && m.content.includes('</think>')) {
        const thinkStart = m.content.indexOf('<think>');
        const thinkEnd = m.content.indexOf('</think>');
        thinkText = m.content.substring(thinkStart + 7, thinkEnd).trim();
        mainText = (m.content.substring(0, thinkStart) + m.content.substring(thinkEnd + 8)).trim();
      }

      let thinkHtml = '';
      if (thinkText) {
        thinkHtml = `
          <details style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 4px; margin-bottom: 6px; border-left: 3px solid var(--accent-color); font-size: 0.75rem; color: #aaa;">
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 2px;">🧠 Razonamiento</summary>
            <div style="white-space: pre-wrap; padding-left: 8px; opacity: 0.8;">\${this.escapeHtml(thinkText)}</div>
          </details>
        `.replace('\${this.escapeHtml(thinkText)}', this.escapeHtml(thinkText));
      }

      html += `
        <div class="inline-msg \${m.role}">
          <div class="msg-content">
            \${thinkHtml}
            <div style="white-space: pre-wrap;">\${this.escapeHtml(mainText)}</div>
          </div>
        </div>
      `.replace('\${m.role}', m.role)
       .replace('\${thinkHtml}', thinkHtml)
       .replace('\${this.escapeHtml(mainText)}', this.escapeHtml(mainText));
    });

    container.innerHTML = html;
    
    container.scrollTop = container.scrollHeight;
  }

  private static handleUserMessage(text: string) {
    if (!this.currentBlockId) return;
    const messages = this.conversations.get(this.currentBlockId) || [];
    
    messages.push({ role: 'user', content: text });
    this.renderMessages();

    const btn = this.activeEl?.querySelector('.generate-btn') as HTMLElement;
    if (btn) {
      btn.textContent = 'Pensando... 🧠';
      btn.style.opacity = '0.7';
      btn.style.pointerEvents = 'none';
    }

    // Empaquetar contexto
    const aiContext = ContextPacker.pack();
    console.log(`[Inline Chat] Enviando contexto para el bloque ${this.currentBlockId}:`, aiContext);

    // Llamada real al servicio de IA
    import("../core/AIService").then(({ AIService }) => {
      AIService.sendMessage(text, aiContext, this.currentBlockId || undefined).then(response => {
        messages.push({ role: 'ai', content: response.message });
        this.renderMessages();
        if (btn) {
          btn.textContent = 'Enviar 📨';
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        }
      });
    }).catch(err => {
      console.error("[Inline Chat] Error en AIService:", err);
      messages.push({ role: 'ai', content: '❌ Ocurrió un error interno al intentar procesar tu mensaje.' });
      this.renderMessages();
      if (btn) {
        btn.textContent = 'Enviar 📨';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    });
  }

  public static hide() {
    if (this.activeEl) {
      this.activeEl.remove();
      this.activeEl = null;
      this.currentBlockId = null;
    }
  }
}
