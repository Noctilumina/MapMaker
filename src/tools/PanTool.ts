import type { Tool } from './types';

export class PanTool implements Tool {
  name = 'pan';
  getCursor() { return 'grab'; }
  onMouseDown() {}
  onMouseMove() {}
  onMouseUp() {}
}
