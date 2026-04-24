import { eventBus, AppEvents } from "./EventEmitter";
import { APP_CONFIG } from "./Constants";
import { SpaceManager } from "./SpaceManager";
import { GeometryUtils } from "./GeometryUtils";

export interface Link {
  fromId: string;
  toId: string;
  pathElement: SVGPathElement;
}

interface Point {
  x: number;
  y: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export class RelationshipManager {
  private svg: SVGSVGElement;
  private links: Link[] = [];
  private ghostPath: SVGPathElement | null = null;

  constructor(svgId: string) {
    const svg = document.getElementById(svgId) as unknown as SVGSVGElement;
    if (!svg) throw new Error("Relationship layer not found");
    this.svg = svg;

    this.initStaticDefinitions();

    eventBus.on(AppEvents.BLOCK_MOVE, (blockId: string) => this.drawLinksForBlock(blockId));
    eventBus.on(AppEvents.VIEWPORT_CHANGE, () => this.drawAll());
    eventBus.on(AppEvents.THEME_CHANGE, () => setTimeout(() => this.drawAll(), 100));
  }

  private initStaticDefinitions() {
    if (!this.svg.querySelector('defs')) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = `
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
        refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-color)" opacity="0.6" />
        </marker>
      `;
      this.svg.appendChild(defs);
    }
  }

  public addLink(fromId: string, toId: string) {
    if (this.links.some(l => l.fromId === fromId && l.toId === toId)) return;
    
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("class", "link-path");
    pathElement.setAttribute("marker-end", "url(#arrowhead)");
    this.svg.appendChild(pathElement);

    const newLink: Link = { fromId, toId, pathElement };
    this.links.push(newLink);
    this.updatePath(newLink);
  }

  /**
   * Dibuja un "Cable Fantasma" con anclaje inteligente a bordes.
   */
  public drawGhostLink(fromId: string, targetX: number, targetY: number, targetId?: string | null) {
    if (!this.ghostPath) {
      this.ghostPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.ghostPath.setAttribute("class", "link-path ghost-link");
      this.ghostPath.setAttribute("stroke-dasharray", "5,5");
      this.svg.appendChild(this.ghostPath);
    }

    const fromEl = document.getElementById(fromId);
    if (!fromEl) return;

    const fromRect = this.getRect(fromEl);
    const off = APP_CONFIG.SVG_OFFSET;

    if (targetId && document.getElementById(targetId)) {
      const toEl = document.getElementById(targetId)!;
      const toRect = this.getRect(toEl);
      const { start, end } = this.getBestAnchorPoints(fromRect, toRect);
      this.ghostPath.setAttribute("d", this.calculateBezierPath(start, end, off));
    } else {
      // CALCULAR ANCLAJE AL AIRE (No más desde el centro)
      const fromPoints = this.getAnchorPointsForRect(fromRect);
      const mousePoint = { x: targetX, y: targetY };
      
      // Buscamos el punto del borde más cercano al mouse
      let bestStart = fromPoints[0];
      let minDist = Infinity;
      
      fromPoints.forEach(p => {
        const d = GeometryUtils.distance(p, mousePoint);
        if (d < minDist) {
          minDist = d;
          bestStart = p;
        }
      });

      this.ghostPath.setAttribute("d", `M ${bestStart.x + off} ${bestStart.y + off} L ${targetX + off} ${targetY + off}`);
    }
  }

  private calculateBezierPath(start: Point, end: Point, off: number): string {
    const dist = GeometryUtils.distance(start, end);
    const curvature = Math.min(dist / 2, 100);
    const cp1 = { x: start.x, y: start.y };
    const cp2 = { x: end.x, y: end.y };

    this.applySideCurvature(start.side, cp1, curvature);
    this.applySideCurvature(end.side, cp2, curvature);

    return `M ${start.x + off} ${start.y + off} 
            C ${cp1.x + off} ${cp1.y + off}, ${cp2.x + off} ${cp2.y + off}, ${end.x + off} ${end.y + off}`;
  }

  public clearGhostLink() {
    if (this.ghostPath) {
      this.ghostPath.remove();
      this.ghostPath = null;
    }
  }

  public removeLinksForBlock(blockId: string) {
    this.links = this.links.filter(link => {
      if (link.fromId === blockId || link.toId === blockId) {
        link.pathElement.remove();
        return false;
      }
      return true;
    });
  }

  public getConnectedComponent(rootId: string): string[] {
    const visited = new Set<string>();
    const stack = [rootId];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (!visited.has(current)) {
        visited.add(current);
        const neighbors = this.getLinkedBlockIds(current);
        neighbors.forEach(n => {
          if (!visited.has(n)) stack.push(n);
        });
      }
    }
    
    return Array.from(visited);
  }

  public getLinkedBlockIds(blockId: string): string[] {
    const ids = new Set<string>();
    this.links.forEach(l => {
      if (l.fromId === blockId) ids.add(l.toId);
      if (l.toId === blockId) ids.add(l.fromId);
    });
    return Array.from(ids);
  }

  public drawAll() {
    this.links.forEach(link => this.updatePath(link));
  }

  private drawLinksForBlock(blockId: string) {
    this.links
      .filter(l => l.fromId === blockId || l.toId === blockId)
      .forEach(l => this.updatePath(l));
  }

  private updatePath(link: Link) {
    const fromEl = document.getElementById(link.fromId);
    const toEl = document.getElementById(link.toId);

    if (!fromEl || !toEl) {
      link.pathElement.remove();
      return;
    }

    const fromRect = this.getRect(fromEl);
    const toRect = this.getRect(toEl);
    const { start, end } = this.getBestAnchorPoints(fromRect, toRect);

    const off = APP_CONFIG.SVG_OFFSET;
    link.pathElement.setAttribute("d", this.calculateBezierPath(start, end, off));
  }

  private applySideCurvature(side: string, point: any, curvature: number) {
    if (side === 'right') point.x += curvature;
    else if (side === 'left') point.x -= curvature;
    else if (side === 'top') point.y -= curvature;
    else if (side === 'bottom') point.y += curvature;
  }

  private getRect(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    // Convertimos coordenadas de pantalla a mundo (Viewport aware)
    const topLeft = SpaceManager.screenToWorld(rect.left, rect.top);
    const bottomRight = SpaceManager.screenToWorld(rect.right, rect.bottom);
    
    const w = bottomRight.x - topLeft.x;
    const h = bottomRight.y - topLeft.y;

    return {
      x: topLeft.x,
      y: topLeft.y,
      w: w,
      h: h,
      cx: topLeft.x + w / 2,
      cy: topLeft.y + h / 2
    };
  }

  private getAnchorPointsForRect(rect: any): Point[] {
    return [
      { x: rect.x + rect.w, y: rect.cy, side: 'right' },
      { x: rect.x, y: rect.cy, side: 'left' },
      { x: rect.cx, y: rect.y, side: 'top' },
      { x: rect.cx, y: rect.y + rect.h, side: 'bottom' }
    ];
  }

  private getBestAnchorPoints(from: any, to: any): { start: Point, end: Point } {
    const fromPoints = this.getAnchorPointsForRect(from);
    const toPoints = [
      { x: to.x, y: to.cy, side: 'left' },
      { x: to.x + to.w, y: to.cy, side: 'right' },
      { x: to.cx, y: to.y, side: 'top' },
      { x: to.cx, y: to.y + to.h, side: 'bottom' }
    ];
    const pair = GeometryUtils.findClosestPair(fromPoints, toPoints);
    return { start: pair.p1, end: pair.p2 };
  }
}

export const relationshipManager = new RelationshipManager('relationship-layer');
