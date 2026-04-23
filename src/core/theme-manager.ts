export type Theme = 'obsidian' | 'nordic';

export class ThemeManager {
  private currentTheme: Theme = 'obsidian';

  constructor() {
    this.applyTheme(this.currentTheme);
  }

  public toggleTheme() {
    this.currentTheme = this.currentTheme === 'obsidian' ? 'nordic' : 'obsidian';
    this.applyTheme(this.currentTheme);
  }

  public setTheme(theme: Theme) {
    this.currentTheme = theme;
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
    console.log(`Theme applied: ${theme}`);
  }

  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }
}

export const themeManager = new ThemeManager();
