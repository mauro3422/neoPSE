import { BlockRegistry } from "../core/BlockRegistry";
import { Vector2 } from "../core/Config";

export class ContextMenu {
  private element: HTMLElement | null = null;
  private onItemSelected: (type: string, position: Vector2) => void;
  private onDeleteRequested: (el: HTMLElement) => void;
  private targetElement: HTMLElement | null = null;

  constructor(
    onItemSelected: (type: string, position: Vector2) => void,
    onDeleteRequested: (el: HTMLElement) => void
  ) {
    this.onItemSelected = onItemSelected;
    this.onDeleteRequested = onDeleteRequested;
    this.initListeners();
  }

  private initListeners() {
    const board = document.querySelector('.board') as HTMLElement;
    if (!board) return;

    board.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.targetElement = (e.target as HTMLElement).closest('.block');
      this.show(e.clientX, e.clientY);
    });

    document.addEventListener('click', () => this.hide());
  }

  private show(x: number, y: number) {
    this.hide();

    this.element = document.createElement('div');
    this.element.className = 'context-menu';
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.zIndex = "10000";

    if (this.targetElement) {
      const item = document.createElement('div');
      item.className = 'context-menu-item delete-item';
      item.innerHTML = `<span>Eliminar</span>`;
      item.onclick = () => {
        if (this.targetElement) this.onDeleteRequested(this.targetElement);
        this.hide();
      };
      this.element.appendChild(item);
    } else {
      const definitions = BlockRegistry.getAllDefinitions();
      definitions.forEach(def => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.innerHTML = `<span>${def.title}</span>`;
        item.onclick = () => {
          this.onItemSelected(def.type, { x, y });
          this.hide();
        };
        this.element?.appendChild(item);
      });
    }

    document.body.appendChild(this.element);
  }

  private hide() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
