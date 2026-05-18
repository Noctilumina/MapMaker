import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';

export class ReplaceTool implements Tool {
  name = 'replace';

  getCursor() { return 'crosshair'; }

  onMouseDown(gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {
    // Find tile at clicked grid position
    const { cellSize } = useMapStore.getState().grid;
    const px = gridPos.col * cellSize;
    const py = gridPos.row * cellSize;

    const elements = useMapStore.getState().elements;
    // Find topmost tile overlapping this pixel
    const hit = [...elements]
      .reverse()
      .find(el => {
        if (el.type !== 'tile') return false;
        const ew = el.width * cellSize;
        const eh = el.height * cellSize;
        return px >= el.x && px < el.x + ew && py >= el.y && py < el.y + eh;
      });

    if (hit && hit.type === 'tile') {
      useEditorStore.getState().setReplaceSource(hit.assetId);
    }
  }

  onMouseMove(_gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {}
  onMouseUp(_gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {}
}
