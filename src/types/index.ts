import { Vector2 } from "../core/Config";

export enum BlockType {
  PSEUDOCODE = 'pseudocode',
  NOTE = 'note',
  ASSISTANT = 'assistant',
  FOLDER = 'folder'
}

export interface BlockDefinition {
  type: BlockType;
  title: string;
  className: string;
  structureHtml: string;
  useHeader?: boolean;
  useResizer?: boolean;
  mass?: number; // 1 = estándar, >1 = pesado, <1 = ligero
}

export interface BlockData {
  id: string;
  type: BlockType;
  position: Vector2;
  size?: { width: number; height: number };
  content: string;
}

export interface FolderData extends BlockData {
  children: BlockData[];
  childLinks: LinkData[];
}

export interface LinkData {
  fromId: string;
  toId: string;
}

export interface WorkspaceData {
  blocks: BlockData[];
  links: LinkData[];
}
