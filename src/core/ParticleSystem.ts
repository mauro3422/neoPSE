import { Vector2 } from "./Config";
import { frameTicker } from "./FrameTicker";

interface Particle {
  el: HTMLElement;
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private static particles: Set<Particle> = new Set();
  private static container: HTMLElement;

  public static init(containerId: string) {
    this.container = document.getElementById(containerId) || document.body;
  }

  public static emit(pos: Vector2, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      el.style.background = color;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      this.container.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;

      const p: Particle = {
        el,
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 1,
        maxLife: 1
      };

      this.particles.add(p);
      frameTicker.register(this.update);
    }
  }

  private static update = (deltaTime: number) => {
    this.particles.forEach(p => {
      p.life -= deltaTime / 1000;
      
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.vel.y += 0.2; // Gravedad

      p.el.style.left = `${p.pos.x}px`;
      p.el.style.top = `${p.pos.y}px`;
      p.el.style.opacity = `${p.life}`;
      p.el.style.transform = `scale(${p.life})`;

      if (p.life <= 0) {
        p.el.remove();
        this.particles.delete(p);
      }
    });

    if (this.particles.size === 0) {
      frameTicker.unregister(this.update);
    }
  };
}
