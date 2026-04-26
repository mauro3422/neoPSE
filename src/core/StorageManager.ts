export class StorageManager {
  private static PREFIX = "neopse_";

  public static save<T>(key: string, data: T) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(this.PREFIX + key, json);
    } catch (e) {
      console.error("Failed to save to storage:", e);
    }
  }

  public static load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("Failed to load from storage:", e);
      return null;
    }
  }

  public static clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
}
