import { eventBus, AppEvents } from "./EventEmitter";
import { workspaceState } from "./state/WorkspaceState";

export class ThemeManager {
  private themes = ['obsidian', 'nordic', 'crimson'];
  private currentTheme: string;

  constructor() {
    this.currentTheme = workspaceState.getTheme();
    this.applyTheme(this.currentTheme);
  }

  public toggleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.currentTheme = this.themes[nextIndex];
    this.applyTheme(this.currentTheme);
    eventBus.emit(AppEvents.THEME_CHANGE, this.currentTheme);
  }

  private applyTheme(theme: string) {
    document.body.setAttribute('data-theme', theme);
  }
}

export const themeManager = new ThemeManager();
