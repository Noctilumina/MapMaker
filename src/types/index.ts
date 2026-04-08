export interface MapProject {
  id: string;
  name: string;
  version: number;
  grid: GridConfig;
  layers: Layer[];
  elements: MapElement[];
  assets: Record<string, AssetDef>;
  groups: Group[];
}

export interface GridConfig {
  cellSize: number;
  width: number;
  height: number;
  scale: string;
  visible: boolean;
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundTile: boolean;
  backgroundTileSize: number;    // cells per tile (default 1)
  backgroundOffsetX: number;     // pixel offset X (default 0)
  backgroundOffsetY: number;     // pixel offset Y (default 0)
  backgroundRotation: number;    // degrees (default 0)
  backgroundRandomize: boolean;  // randomize rotation/flip per tile
  backgroundRandomSeed: number;  // seed for deterministic randomization
  timeOfDay: number;             // 0-24 hours (e.g. 14.5 = 2:30 PM)
  lightingEnabled: boolean;      // toggle lighting system
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface TileElement {
  id: string;
  type: 'tile';
  layerId: string;
  assetId: string;
  groupId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  tint: string | null;
  opacity: number;
  blocksLight?: boolean;
}

export interface PolygonElement {
  id: string;
  type: 'polygon';
  layerId: string;
  assetId: string;
  groupId: string | null;
  points: number[];          // flat array of [x1,y1, x2,y2, ...] in pixels
  fillScale: number;         // texture tile scale (default 1)
  fillRotation: number;      // texture rotation in degrees
  fillOffsetX: number;
  fillOffsetY: number;
  fillRandomize: boolean;
  fillRandomSeed: number;
  tension: number;
  borderWidth: number;         // border stroke width in pixels (0 = none)
  borderColor: string;         // border color (default '#000000')
  wallsBlockLight: boolean;    // if false, walls are transparent to light (glass walls)
  openings: Opening[];         // doors/windows as gaps in the border
  innerWalls: InnerWall[];     // internal wall segments
  tint: string | null;
  opacity: number;
}

export interface Opening {
  id: string;
  type: 'door' | 'window';
  edgeIndex: number;           // which edge (0 = edge between vertex 0 and 1)
  position: number;            // 0-1 along the edge
  width: number;               // width in pixels
  doorColor: string;           // door panel color (default '#6c7086')
  doorOpenAngle: number;       // 0 = closed, 90 = fully open. degrees from the wall
  doorHinge: 'left' | 'right'; // which side the hinge is on
  doorSwing: 'inward' | 'outward'; // which direction the door opens
}

export interface InnerWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;               // wall thickness
  color: string;
}

export interface PathPoint {
  x: number;
  y: number;
  handleInX: number;    // incoming bezier handle (relative to point)
  handleInY: number;
  handleOutX: number;   // outgoing bezier handle (relative to point)
  handleOutY: number;
}

export interface PathElement {
  id: string;
  type: 'path';
  layerId: string;
  assetId: string;       // texture for the road surface
  groupId: string | null;
  pathPoints: PathPoint[];
  pathWidth: number;     // road width in pixels
  fillScale: number;
  fillRotation: number;
  borderWidth: number;   // curb/edge width (0 = none)
  borderColor: string;
  closed: boolean;       // closed path (loop) or open
  tint: string | null;
  opacity: number;
}

export interface LightSource {
  id: string;
  type: 'light';
  layerId: string;
  groupId: string | null;
  x: number;
  y: number;
  radius: number;             // light radius in pixels
  color: string;              // light color (default warm yellow)
  intensity: number;          // 0-1
  flickerAmount: number;      // 0-1, how much the light flickers (0 = steady)
  lightShape: 'point' | 'bar' | 'polygon';  // shape of the light emitter
  x2?: number;                // bar end X (pixels)
  y2?: number;                // bar end Y (pixels)
  shapePoints?: number[];     // polygon light shape [x1,y1, x2,y2, ...]
}

export type MapElement = TileElement | PolygonElement | PathElement | LightSource;

export interface AssetDef {
  src: string;
  category: string;
  gridSize: [number, number];
  name: string;
  source: 'preset' | 'imported';
  occlusionHull?: number[];  // normalized [x0,y0, x1,y1, ...], convex hull of opaque pixels
}

export interface Group {
  id: string;
  name: string;
  parentId: string | null;
  collapsed: boolean;
  visible: boolean;
  locked: boolean;
}

export interface GridPos {
  col: number;
  row: number;
}

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'floor', name: 'Floor', visible: true, locked: false, opacity: 1.0 },
  { id: 'walls', name: 'Walls', visible: true, locked: false, opacity: 1.0 },
  { id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1.0 },
  { id: 'gm-notes', name: 'GM Notes', visible: true, locked: false, opacity: 0.5 },
];

export const DEFAULT_GRID: GridConfig = {
  cellSize: 64,
  width: 50,
  height: 40,
  scale: '2m',
  visible: true,
  backgroundColor: '#1a1a1a',
  backgroundImage: 'textures/misc/stone 2.png',
  backgroundTile: true,
  backgroundTileSize: 1,
  backgroundOffsetX: 0,
  backgroundOffsetY: 0,
  backgroundRotation: 0,
  backgroundRandomize: true,
  backgroundRandomSeed: 42,
  timeOfDay: 20,
  lightingEnabled: true,
};
