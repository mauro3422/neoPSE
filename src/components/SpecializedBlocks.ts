import { Block } from "./Block";
import { DOMUtils } from "../core/DOMUtils";
import { AnimationManager } from "../core/AnimationManager";

export class EditorBlock extends Block {
  constructor(selector: string | HTMLElement) {
    super(selector);
    this.rehydrate();
  }

  private rehydrate() {
    const data = this.getStateData();
    const editor = this.element.querySelector<HTMLElement>('.pseudocode');
    if (editor) {
      if (data && data.content) editor.textContent = data.content;
      editor.setAttribute('contenteditable', 'true');
    }
  }

  public getContent(): string {
    return this.element.querySelector('.pseudocode')?.textContent || '';
  }
}

export class NoteBlock extends Block {
  constructor(selector: string | HTMLElement) {
    super(selector);
    this.rehydrate();
    this.initEvents();
  }

  private initEvents() {
    const textArea = this.element.querySelector<HTMLElement>('textarea');
    if (textArea) {
      DOMUtils.setupAutoResize(textArea);
    }
  }

  private rehydrate() {
    const data = this.getStateData();
    const textArea = this.element.querySelector<HTMLTextAreaElement>('textarea');
    if (textArea && data && data.content) {
      textArea.value = data.content;
      DOMUtils.autoResize(textArea);
    }
  }

  public getContent(): string {
    return this.element.querySelector('textarea')?.value || '';
  }
}

export class FolderBlock extends Block {
  constructor(selector: string | HTMLElement) {
    super(selector);
    this.initFolderEvents();
    // Animación inicial de "chiquito a grande" al nacer
    AnimationManager.expand(this.element);
  }

  private initFolderEvents() {
    this.element.addEventListener('dblclick', () => {
      this.openModule();
    });
  }

  private async openModule() {
    console.log(`[FolderBlock] Abriendo módulo: ${this.id}`);
    // Aquí implementaremos la lógica de expandirse y mostrar hijos
    // Por ahora, una animación de feedback
    await AnimationManager.expand(this.element, 200);
  }

  public getContent(): string {
    return "";
  }
}
