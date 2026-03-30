import Konva from 'konva';
import type { GridPos } from '../types';

export interface Tool {
  name: string;
  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseMove(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseUp(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>): void;
  onKeyDown?(key: string): void;
  getCursor(): string;
}
