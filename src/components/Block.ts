import { APP_CONFIG } from "../core/Constants";
import { relationshipManager } from "../core/RelationshipManager";

export abstract class UIComponent {
  protected element: HTMLElement;
  constructor(selector: string | HTMLElement) {
    const el = typeof selector === 'string' ? document.querySelector<HTMLElement>(selector) : selector;
    if (!el) throw new Error(`Component not found`);
    this.element = el;
  }
}

export class Block extends UIComponent {
  private header: HTMLElement;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private initialLeft: number = 0;
  private initialTop: number = 0;

  private static linkingSource: string | null = null;

  constructor(selector: string | HTMLElement) {
    super(selector);
    const header = this.element.querySelector<HTMLElement>('.block-header');
    if (!header) throw new Error(`Header not found`);
    this.header = header;
    this.initEvents();
    this.initActions();
  }

  private initEvents() {
    this.header.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Click on block to complete a link
    this.element.addEventListener('click', (e) => {
      if (Block.linkingSource && Block.linkingSource !== this.element.id) {
        relationshipManager.addLink(Block.linkingSource, this.element.id);
        Block.linkingSource = null;
        document.body.classList.remove('linking-mode');
        e.stopPropagation();
      }
    });
  }

  private initActions() {
    const linkBtn = this.element.querySelector('.link-btn');
    const closeBtn = this.element.querySelector('.close-btn');

    linkBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      Block.linkingSource = this.element.id;
      document.body.classList.add('linking-mode');
      console.log(`Linking source set to: ${this.element.id}`);
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.element.remove();
      relationshipManager.draw(); // Clean up links
    });
  }

  private onMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('link-btn') || (e.target as HTMLElement).classList.contains('close-btn')) return;

    e.stopPropagation();
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.initialLeft = this.element.offsetLeft;
    this.initialTop = this.element.offsetTop;

    this.bringToFront();
    this.header.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    
    const zoom = parseFloat(document.documentElement.style.getPropertyValue('--zoom')) || 1;
    const dx = (e.clientX - this.startX) / zoom;
    const dy = (e.clientY - this.startY) / zoom;

    this.element.style.left = `${this.initialLeft + dx}px`;
    this.element.style.top = `${this.initialTop + dy}px`;

    window.dispatchEvent(new CustomEvent('blockMove'));
  }

  private onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.header.style.cursor = 'grab';
    document.body.style.userSelect = '';
  }

  private bringToFront() {
    const allBlocks = document.querySelectorAll<HTMLElement>('.block');
    allBlocks.forEach(b => b.style.zIndex = APP_CONFIG.Z_INDEX_INACTIVE);
    this.element.style.zIndex = APP_CONFIG.Z_INDEX_ACTIVE;
  }
}
