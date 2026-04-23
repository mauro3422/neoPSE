export const APP_CONFIG = {
  VERSION: '0.1.0',
  DEFAULT_THEME: 'obsidian',
  GRID_SIZE: 40,
  Z_INDEX_ACTIVE: '10',
  Z_INDEX_INACTIVE: '1',
} as const;

export const BLOCK_TYPES = {
  EDITOR: 'editor',
  NOTES: 'notes',
  CHAT: 'chat',
  DIAGRAM: 'diagram',
} as const;
