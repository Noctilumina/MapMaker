import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types/index';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class CopyStampTool implements Tool {
  name = 'copy-stamp';

  getCursor() { return 'copy'; }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const { stampTemplate, activeLayerId, snapToGrid } = useEditorStore.getState();
    if (!stampTemplate || stampTemplate.length === 0) return;

    const { cellSize } = useMapStore.getState().grid;

    let originX: number, originY: number;

    if (snapToGrid) {
      originX = gridPos.col * cellSize;
      originY = gridPos.row * cellSize;
    } else {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pos = transform.point(pointer);
      originX = Math.round(pos.x);
      originY = Math.round(pos.y);
    }

    useHistoryStore.getState().captureSnapshot();

    useMapStore.getState().addElements(stampTemplate.map(entry => ({
      type: 'tile' as const,
      layerId: activeLayerId,
      assetId: entry.assetId,
      groupId: null,
      x: originX + entry.dx,
      y: originY + entry.dy,
      width: entry.width,
      height: entry.height,
      rotation: entry.rotation,
      flipX: entry.flipX,
      flipY: entry.flipY,
      tint: entry.tint,
      opacity: entry.opacity,
    })));
  }

  onMouseMove() {}
  onMouseUp() {}
}
