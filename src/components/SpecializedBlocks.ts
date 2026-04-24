import { Block } from "./Block";
import { DOMUtils } from "../core/DOMUtils";

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
