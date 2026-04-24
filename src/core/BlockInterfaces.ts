import { Vector2 } from "./Constants";
import { BlockType } from "../types";

/**
 * Contrato estándar para cualquier controlador de bloque en NeoPSE.
 */
export interface IBlockController {
  id: string;
  type: BlockType;
  
  // Ciclo de vida
  init(): void;
  onDestroy?(): void;
  
  // Interacción
  onMove?(pos: Vector2): void;
  onResize?(size: Vector2): void;
  onFocus?(): void;
  
  // Estado
  serialize(): any;
  deserialize(data: any): void;
}
