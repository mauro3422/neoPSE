import { eventBus, AppEvents } from "./EventEmitter";
import { IDE_CONFIG, AnchorSide } from "./Config";
import { GeometricEngine, Rect } from "./GeometricEngine";
import { frameTicker } from "./FrameTicker";

export interface Link {
  fromId: string;
  toId: string;
  pathElement: SVGPathElement;
}

interface Point {
  x: number;
  y: number;
  side: AnchorSide;
}

export class RelationshipManager {
  private svg: SVGSVGElement;
  private links: Link[] = [];
  private ghostPath: SVGPathElement | null = null;
  private dirtyBlocks: Set<string> = new Set();
  private needsFullRedraw: boolean = false;
  private pathPool: SVGPathElement[] = [];

  constructor(svgId: string) {
    const svg = document.getElementById(svgId) as unknown as SVGSVGElement;
    if (!svg) throw new Error("Relationship layer not found");
    this.svg = svg;

    this.initStaticDefinitions();

    eventBus.on(AppEvents.BLOCK_MOVE, (blockId: string) => {
      this.dirtyBlocks.add(blockId);
      frameTicker.register(this.tick);
    });

    eventBus.on(AppEvents.VIEWPORT_CHANGE, () => {
      this.needsFullRedraw = true;
      // Ya usamos frameTicker, lo cual es batching por naturaleza,
      // pero forzamos el registro aquí.
      frameTicker.register(this.tick);
    });

    eventBus.on(AppEvents.THEME_CHANGE, () => {
      setTimeout(() => {
        this.needsFullRedraw = true;
        frameTicker.register(this.tick);
      }, 100);
    });
  }

  private tick = () => {
    if (this.needsFullRedraw) {
      this.drawAll();
      this.needsFullRedraw = false;
    } else if (this.dirtyBlocks.size > 0) {
      this.dirtyBlocks.forEach(id => this.drawLinksForBlock(id));
      this.dirtyBlocks.clear();
    }
    frameTicker.unregister(this.tick);
  };

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
    
    let pathElement = this.pathPool.pop();
    
    if (!pathElement) {
      pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathElement.setAttribute("class", "link-path");
      pathElement.setAttribute("marker-end", "url(#arrowhead)");
      this.svg.appendChild(pathElement);
    } else {
      pathElement.style.display = ''; // Restaurar visibilidad
    }

    const newLink: Link = { fromId, toId, pathElement };
    this.links.push(newLink);
    this.updatePath(newLink);
  }

  public drawGhostLink(fromId: string, targetX: number, targetY: number, targetId?: string | null) {
    if (!this.ghostPath) {
      this.ghostPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.ghostPath.setAttribute("class", "link-path ghost-link");
      this.ghostPath.setAttribute("stroke-dasharray", "5,5");
      this.svg.appendChild(this.ghostPath);
    }

    const fromEl = document.getElementById(fromId);
    if (!fromEl) return;

    const fromRect = GeometricEngine.getWorldRect(fromEl);
    const off = IDE_CONFIG.GEOMETRY.SVG_OFFSET;

    if (targetId && document.getElementById(targetId)) {
      const toEl = document.getElementById(targetId)!;
      const toRect = GeometricEngine.getWorldRect(toEl);
      const { start, end } = this.getBestAnchorPoints(fromRect, toRect);
      this.ghostPath.setAttribute("d", this.calculateBezierPath(start, end, off));
    } else {
      const fromPoints = this.getAnchorPointsForRect(fromRect);
      const mousePoint = { x: targetX, y: targetY };
      
      let bestStart = fromPoints[0];
      let minDist = Infinity;
      
      fromPoints.forEach(p => {
        const d = GeometricEngine.distance(p, mousePoint);
        if (d < minDist) {
          minDist = d;
          bestStart = p;
        }
      });

      this.ghostPath.setAttribute("d", `M ${bestStart.x + off} ${bestStart.y + off} L ${targetX + off} ${targetY + off}`);
    }
  }

  private calculateBezierPath(start: Point, end: Point, off: number): string {
    const dist = GeometricEngine.distance(start, end);
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
        if (this.pathPool.length < 100) {
          link.pathElement.style.display = 'none';
          this.pathPool.push(link.pathElement);
        } else {
          link.pathElement.remove(); // Borrado físico si el pool está lleno
        }
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
        neighbors.forEach(n => { if (!visited.has(n)) stack.push(n); });
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

  public drawLinksForBlock(blockId: string) {
    this.links
      .filter(l => l.fromId === blockId || l.toId === blockId)
      .forEach(l => this.updatePath(l));
  }

  private updatePath(link: Link) {
    const fromEl = document.getElementById(link.fromId);
    const toEl = document.getElementById(link.toId);
    if (!fromEl || !toEl) return;

    const fromRect = GeometricEngine.getWorldRect(fromEl);
    const toRect = GeometricEngine.getWorldRect(toEl);
    const { start, end } = this.getBestAnchorPoints(fromRect, toRect);

    const off = IDE_CONFIG.GEOMETRY.SVG_OFFSET;
    link.pathElement.setAttribute("d", this.calculateBezierPath(start, end, off));
  }

  private applySideCurvature(side: AnchorSide, point: any, curvature: number) {
    if (side === 'right') point.x += curvature;
    else if (side === 'left') point.x -= curvature;
    else if (side === 'top') point.y -= curvature;
    else if (side === 'bottom') point.y += curvature;
  }

  private getAnchorPointsForRect(rect: Rect): Point[] {
    return [
      { x: rect.x + rect.w, y: rect.cy, side: 'right' },
      { x: rect.x, y: rect.cy, side: 'left' },
      { x: rect.cx, y: rect.y, side: 'top' },
      { x: rect.cx, y: rect.y + rect.h, side: 'bottom' }
    ];
  }

  private getBestAnchorPoints(from: Rect, to: Rect): { start: Point, end: Point } {
    const pair = GeometricEngine.findClosestPair(this.getAnchorPointsForRect(from), this.getAnchorPointsForRect(to));
    return { start: pair.p1, end: pair.p2 };
  }
}

export const relationshipManager = new RelationshipManager('relationship-layer');
