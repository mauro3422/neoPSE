export type TickCallback = (deltaTime: number, timestamp: number) => void;

/**
 * Motor central de ciclos de renderizado.
 * Evita la fragmentación de requestAnimationFrame.
 */
export class FrameTicker {
  private static instance: FrameTicker;
  private callbacks: Set<TickCallback> = new Set();
  private lastTime: number = 0;
  private running: boolean = false;

  private constructor() {}

  public static getInstance(): FrameTicker {
    if (!this.instance) this.instance = new FrameTicker();
    return this.instance;
  }

  public register(callback: TickCallback) {
    this.callbacks.add(callback);
    if (!this.running) this.start();
  }

  public unregister(callback: TickCallback) {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) this.stop();
  }

  private start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private stop() {
    this.running = false;
  }

  private loop = (timestamp: number) => {
    if (!this.running) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.callbacks.forEach(cb => cb(deltaTime, timestamp));

    requestAnimationFrame(this.loop);
  };
}

export const frameTicker = FrameTicker.getInstance();
