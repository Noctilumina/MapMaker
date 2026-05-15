import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class LightTool implements Tool {
  name = 'light';

  getCursor() { return 'crosshair'; }

  onMouseDown(_gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const { activeLayerId } = useEditorStore.getState();
    const { cellSize } = useMapStore.getState().grid;

    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement({
      type: 'light',
      layerId: activeLayerId,
      groupId: null,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      radius: cellSize * 3,
      color: '#ffcc66',
      intensity: 0.8,
      flickerAmount: 0,
      lightShape: 'point',
    });
  }

  onMouseMove() {}
  onMouseUp() {}
}
