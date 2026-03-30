import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos, PathPoint } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class PathTool implements Tool {
  name = 'path';
  private points: PathPoint[] = [];
  private isDrawing = false;
  private isDraggingHandle = false;

  getCursor() { return 'crosshair'; }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const { cellSize } = useMapStore.getState().grid;
    const snap = useEditorStore.getState().snapToGrid;

    let x = pos.x;
    let y = pos.y;
    if (snap) {
      x = Math.round(x / cellSize) * cellSize;
      y = Math.round(y / cellSize) * cellSize;
    }

    // Default handle length based on cell size
    const handleLen = cellSize * 1.5;

    this.points.push({
      x, y,
      handleInX: -handleLen, handleInY: 0,
      handleOutX: handleLen, handleOutY: 0,
    });
    this.isDrawing = true;
    this.isDraggingHandle = true;
  }

  onMouseMove(_gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.isDraggingHandle || this.points.length === 0) return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    // Drag sets the outgoing handle of the last point
    const last = this.points[this.points.length - 1];
    const hx = pos.x - last.x;
    const hy = pos.y - last.y;
    last.handleOutX = hx;
    last.handleOutY = hy;
    last.handleInX = -hx;
    last.handleInY = -hy;
  }

  onMouseUp() {
    this.isDraggingHandle = false;
  }

  onKeyDown(key: string) {
    if ((key === 'Enter' || key === 'Return') && this.points.length >= 2) {
      this.finishPath(false);
    }
    if (key === 'Escape') {
      this.points = [];
      this.isDrawing = false;
    }
    if (key === 'Backspace' && this.points.length > 0) {
      this.points.pop();
      if (this.points.length === 0) this.isDrawing = false;
    }
  }

  getPoints() {
    return this.points;
  }

  isActive() {
    return this.isDrawing && this.points.length > 0;
  }

  private finishPath(closed: boolean) {
    if (this.points.length < 2) return;

    const { stampAssetId, activeLayerId } = useEditorStore.getState();
    if (!stampAssetId) {
      this.points = [];
      this.isDrawing = false;
      return;
    }

    const cellSize = useMapStore.getState().grid.cellSize;

    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement({
      type: 'path',
      layerId: activeLayerId,
      assetId: stampAssetId,
      groupId: null,
      pathPoints: [...this.points],
      pathWidth: cellSize * 2,
      fillScale: 1,
      fillRotation: 0,
      borderWidth: 2,
      borderColor: '#000000',
      closed,
      tint: null,
      opacity: 1.0,
    });

    this.points = [];
    this.isDrawing = false;
  }
}
