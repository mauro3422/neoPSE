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

        setTimeout(() => {
          this.addMessage('ai', 'Estoy analizando tu estructura de datos...');
          this.syncState(this.serializeChat());
        }, 1000);
      }
    });
  }

  private addMessage(role: 'user' | 'ai', text: string) {
    if (!this.messageArea) return;
    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    msg.textContent = text;
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
