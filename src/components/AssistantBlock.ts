import { UIComponent } from "./Block";

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export class AssistantBlock extends UIComponent {
  private chatInput: HTMLInputElement | null;
  private messageArea: HTMLElement | null;

  constructor(selector: string | HTMLElement) {
    super(selector);
    this.chatInput = this.element.querySelector('.chat-input');
    this.messageArea = this.element.querySelector('.chat-messages');
    
    this.rehydrate();
    this.initEvents();
  }

  private initEvents() {
    this.chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.chatInput?.value) {
        const text = this.chatInput.value;
        this.addMessage('user', text);
        this.chatInput.value = '';
        this.syncState(this.serializeChat());

        import("../core/ContextPacker").then(({ ContextPacker }) => {
          const aiContext = ContextPacker.pack();
          import("../core/AIService").then(({ AIService }) => {
            AIService.sendMessage(text, aiContext).then(response => {
              this.addMessage('ai', response.message);
              this.syncState(this.serializeChat());
            }).catch(err => {
              console.error("[AssistantBlock] Error:", err);
              this.addMessage('ai', '❌ Error al conectar con el cerebro de IA.');
              this.syncState(this.serializeChat());
            });
          });
        });
      }
    });
  }

  private addMessage(role: 'user' | 'ai', text: string) {
    if (!this.messageArea) return;
    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    
    let thinkText = '';
    let mainText = text;
    
    if (text.includes('<think>') && text.includes('</think>')) {
      const thinkStart = text.indexOf('<think>');
      const thinkEnd = text.indexOf('</think>');
      thinkText = text.substring(thinkStart + 7, thinkEnd).trim();
      mainText = (text.substring(0, thinkStart) + text.substring(thinkEnd + 8)).trim();
    }

    if (thinkText) {
      const thinkBox = document.createElement('details');
      thinkBox.style.background = 'rgba(255,255,255,0.05)';
      thinkBox.style.padding = '8px';
      thinkBox.style.borderRadius = '4px';
      thinkBox.style.marginBottom = '8px';
      thinkBox.style.borderLeft = '3px solid var(--accent-color)';
      thinkBox.style.fontSize = '0.8rem';
      thinkBox.style.color = '#aaa';
      
      const summary = document.createElement('summary');
      summary.style.cursor = 'pointer';
      summary.style.fontWeight = 'bold';
      summary.style.marginBottom = '4px';
      summary.style.outline = 'none';
      summary.textContent = '🧠 Pensamiento del modelo (Razonamiento)';
      
      const content = document.createElement('div');
      content.style.whiteSpace = 'pre-wrap';
      content.style.paddingLeft = '12px';
      content.style.opacity = '0.85';
      content.textContent = thinkText;
      
      thinkBox.appendChild(summary);
      thinkBox.appendChild(content);
      msg.appendChild(thinkBox);
    }

    const mainContent = document.createElement('div');
    mainContent.style.whiteSpace = 'pre-wrap';
    mainContent.textContent = mainText;
    msg.appendChild(mainContent);

    this.messageArea.appendChild(msg);
    this.messageArea.scrollTop = this.messageArea.scrollHeight;
  }

  private rehydrate() {
    const data = this.getStateData();
    if (data && data.content && data.content.startsWith('[')) {
      try {
        const history: ChatMessage[] = JSON.parse(data.content);
        if (history.length > 0 && this.messageArea) {
          this.messageArea.innerHTML = ''; 
          history.forEach(msg => this.addMessage(msg.role, msg.text));
        }
      } catch (e) {
        console.warn("[AssistantBlock] Invalid chat history.");
      }
    }
  }

  private serializeChat(): string {
    if (!this.messageArea) return '';
    const messages = Array.from(this.messageArea.querySelectorAll('.message')).map(msg => ({
      role: msg.classList.contains('user') ? 'user' : 'ai',
      text: msg.textContent
    }));
    return JSON.stringify(messages);
  }
}
