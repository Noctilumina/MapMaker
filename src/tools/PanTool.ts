import type { Tool } from './types';
import type { GridPos } from '../types';

export class PanTool implements Tool {
  name = 'pan';
  getCursor() { return 'grab'; }
  onMouseDown() {}
  onMouseMove() {}
  onMouseUp() {}
}
