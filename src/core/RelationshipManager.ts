export interface Link {
  fromId: string;
  toId: string;
}

export class RelationshipManager {
  private svg: SVGSVGElement;
  private links: Link[] = [];

  constructor(svgId: string) {
    const svg = document.getElementById(svgId) as unknown as SVGSVGElement;
    if (!svg) throw new Error("Relationship layer not found");
    this.svg = svg;

    window.addEventListener('blockMove', () => this.draw());
    window.addEventListener('viewportChange', () => this.draw());
  }

  public addLink(fromId: string, toId: string) {
    // Avoid duplicates
    if (this.links.some(l => l.fromId === fromId && l.toId === toId)) return;
    
    this.links.push({ fromId, toId });
    this.draw();
  }

  public draw() {
    this.svg.innerHTML = '';
    
    // Filter out links with missing elements (e.g. deleted blocks)
    this.links = this.links.filter(link => {
      const fromEl = document.getElementById(link.fromId);
      const toEl = document.getElementById(link.toId);
      return fromEl && toEl;
    });

    this.links.forEach(link => {
      const fromEl = document.getElementById(link.fromId)!;
      const toEl = document.getElementById(link.toId)!;
      const path = this.createBezierPath(fromEl, toEl);
      this.svg.appendChild(path);
    });
  }

  private createBezierPath(from: HTMLElement, to: HTMLElement): SVGPathElement {
    const fromRect = {
      x: from.offsetLeft,
      y: from.offsetTop,
      w: from.offsetWidth,
      h: from.offsetHeight
    };
    
    const toRect = {
      x: to.offsetLeft,
      y: to.offsetTop,
      w: to.offsetWidth,
      h: to.offsetHeight
    };

    // Smart connection points: link to the nearest vertical center of the sides
    const startX = fromRect.x + fromRect.w;
    const startY = fromRect.y + fromRect.h / 2;
    const endX = toRect.x;
    const endY = toRect.y + toRect.h / 2;

    // Control points for the Bézier curve
    const distance = Math.abs(endX - startX) * 0.5;
    const controlX1 = startX + distance;
    const controlX2 = endX - distance;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
    
    path.setAttribute("d", d);
    path.setAttribute("class", "link-path");
    
    return path;
  }
}

export const relationshipManager = new RelationshipManager('relationship-layer');
