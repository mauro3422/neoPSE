import { Vector2 } from "../Constants";

export enum BlockType {
  PSEUDOCODE = 'pseudocode',
  NOTE = 'note',
  ASSISTANT = 'assistant'
}

export interface BlockData {
  id: string;
  type: BlockType;
  position: Vector2;
  size?: { width: number; height: number };
  content: string;
}

export interface LinkData {
  fromId: string;
  toId: string;
}

export interface WorkspaceData {
  blocks: BlockData[];
  links: LinkData[];
}
