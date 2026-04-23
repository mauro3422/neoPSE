import { APP_CONFIG } from "../core/Constants";

export interface BlockPosition {
  x: number;
  y: number;
}

export class Block {
  protected element: HTMLElement;
  protected header: HTMLElement;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private initialLeft: number = 0;
  private initialTop: number = 0;

  constructor(selector: string) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`Block with selector ${selector} not found`);
    this.element = el;

    const header = el.querySelector<HTMLElement>('.block-header');
    if (!header) throw new Error(`Header not found for block ${selector}`);
    this.header = header;

    this.initEvents();
  }

  private initEvents() {
    this.header.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    
    const rect = this.element.getBoundingClientRect();
    this.initialLeft = rect.left;
    this.initialTop = rect.top;

    this.bringToFront();
    this.header.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    this.element.style.left = `${this.initialLeft + dx}px`;
    this.element.style.top = `${this.initialTop + dy}px`;
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
