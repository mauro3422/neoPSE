export interface Vector2 {
  x: number;
  y: number;
}

export type AnchorSide = 'top' | 'bottom' | 'left' | 'right';

export const IDE_CONFIG = {
  TRANSITIONS: {
    DEFAULT_SPEED: "0.2s",
    SUCTION_DURATION: 800,
    FOLDER_PULSE: 400
  },
  GEOMETRY: {
    GRID_SIZE: 40,
    MAX_ZOOM: 5.0,
    MIN_ZOOM: 0.2,
    SVG_OFFSET: 50000,
    SVG_INFINITE_SIZE: 100000
  },
  PHYSICS: {
    STAGGER_DELAY: 60,
    DRAG_THRESHOLD: 5
  },
  UI: {
    CONTEXT_MENU_WIDTH: 180,
    HEADER_HEIGHT: 60,
    Z_INDEX_HUD: 5000,
    Z_INDEX_BLOCK_ACTIVE: 1000,
    Z_INDEX_BLOCK_INACTIVE: 100,
    Z_INDEX_RELATIONSHIPS: 5
  },
  STORAGE: {
    KEY: 'neopse_workspace_data'
  }
};
