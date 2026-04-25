/**
 * Estado que gestiona los bloques adjuntos al chat de IA.
 */
export class ChatContextState {
  private static selectedIds: string[] = [];

  public static add(id: string) {
    if (!this.selectedIds.includes(id)) {
      this.selectedIds.push(id);
      this.renderChips();
    }
  }

  public static getSelectedIds(): string[] {
    return this.selectedIds;
  }

  public static clear() {
    this.selectedIds = [];
    this.renderChips();
  }

  private static renderChips() {
    const sidebar = document.getElementById('assistant-panel');
    if (!sidebar) return;

    let chipsContainer = sidebar.querySelector('.context-chips') as HTMLElement;
    if (!chipsContainer) {
      chipsContainer = document.createElement('div');
      chipsContainer.className = 'context-chips';
      chipsContainer.style.display = 'flex';
      chipsContainer.style.gap = '8px';
      chipsContainer.style.padding = '12px';
      chipsContainer.style.flexWrap = 'wrap';
      chipsContainer.style.borderBottom = '1px solid var(--block-border)';
      
      const content = sidebar.querySelector('.block-content');
      if (content) {
        sidebar.insertBefore(chipsContainer, content);
      }
    }

    chipsContainer.innerHTML = '';
    
    this.selectedIds.forEach(id => {
      const chip = document.createElement('div');
      chip.className = 'context-chip';
      chip.style.background = 'var(--accent-color)';
      chip.style.color = 'white';
      chip.style.padding = '4px 10px';
      chip.style.borderRadius = '20px';
      chip.style.fontSize = '0.75rem';
      chip.style.display = 'flex';
      chip.style.alignItems = 'center';
      chip.style.gap = '6px';
      chip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

      const el = document.getElementById(id);
      const label = el?.querySelector('.folder-label')?.textContent || 
                    el?.querySelector('.block-title')?.textContent || 
                    id.substring(0, 8);

      chip.innerHTML = `<span>${label}</span><span style="cursor:pointer; opacity: 0.8; font-weight: bold;">✕</span>`;
      
      const closeBtn = chip.querySelector('span:last-child') as HTMLElement;
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedIds = this.selectedIds.filter(selectedId => selectedId !== id);
        this.renderChips();
      });

      chipsContainer.appendChild(chip);
    });
  }
}
