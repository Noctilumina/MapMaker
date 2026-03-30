import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';
import { generateCircle, generateRect, generateHexagon } from '../utils/shapes';

export class PolygonTool implements Tool {
  name = 'polygon';
  private points: number[] = [];
  private isDrawing = false;

  getCursor() { return 'crosshair'; }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const { cellSize } = useMapStore.getState().grid;
    const { snapToGrid: snap, pendingShape } = useEditorStore.getState();

    let x = pos.x;
    let y = pos.y;
    if (snap) {
      x = Math.round(x / cellSize) * cellSize;
      y = Math.round(y / cellSize) * cellSize;
    }

    // If a predefined shape is pending, place it immediately
    if (pendingShape) {
      const radius = cellSize * 3; // 3 cells radius default
      let shapePoints: number[];
      switch (pendingShape) {
        case 'circle':
          shapePoints = generateCircle(x, y, radius);
          break;
        case 'rect':
          shapePoints = generateRect(x, y, radius * 2, radius * 2);
          break;
        case 'hexagon':
          shapePoints = generateHexagon(x, y, radius);
          break;
      }
      useEditorStore.getState().setPendingShape(null);
      this.placeShape(shapePoints);
      return;
    }

    // Close to first point: finish polygon
    if (this.points.length >= 4) {
      const dx = x - this.points[0];
      const dy = y - this.points[1];
      const closeDist = snap ? cellSize : 30;
      if (Math.sqrt(dx * dx + dy * dy) < closeDist) {
        if (this.points.length >= 6) {
          this.finishPolygon();
          return;
        }
      }
    }

    this.points.push(x, y);
    this.isDrawing = true;
    useEditorStore.getState().setSelectionBox(null);
  }

  onMouseMove(_gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {}

  onMouseUp() {}

  onKeyDown(key: string) {
    if ((key === 'Enter' || key === 'Return') && this.points.length >= 6) {
      this.finishPolygon();
    }
    if (key === 'Escape') {
      this.points = [];
      this.isDrawing = false;
      useEditorStore.getState().setPendingShape(null);
    }
    if (key === 'Backspace' && this.points.length >= 2) {
      this.points.pop();
      this.points.pop();
    }
  }

  getPoints() {
    return this.points;
  }

  isActive() {
    return this.isDrawing && this.points.length > 0;
  }

  private placeShape(points: number[]) {
    const { stampAssetId, activeLayerId } = useEditorStore.getState();
    if (!stampAssetId) return;

    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement({
      type: 'polygon',
      layerId: activeLayerId,
      assetId: stampAssetId,
      groupId: null,
      points,
      fillScale: 1,
      fillRotation: 0,
      fillOffsetX: 0,
      fillOffsetY: 0,
      fillRandomize: false,
      fillRandomSeed: 42,
      tension: 0,
      borderWidth: 0,
      borderColor: '#000000',
      openings: [],
      innerWalls: [],
      wallsBlockLight: true,
      tint: null,
      opacity: 1.0,
    });
  }

  private finishPolygon() {
    if (this.points.length < 6) return;

    const { stampAssetId, activeLayerId } = useEditorStore.getState();
    if (!stampAssetId) {
      this.points = [];
      this.isDrawing = false;
      return;
    }

    useHistoryStore.getState().captureSnapshot();
    useMapStore.getState().addElement({
      type: 'polygon',
      layerId: activeLayerId,
      assetId: stampAssetId,
      groupId: null,
      points: [...this.points],
      fillScale: 1,
      fillRotation: 0,
      fillOffsetX: 0,
      fillOffsetY: 0,
      fillRandomize: false,
      fillRandomSeed: 42,
      tension: 0,
      borderWidth: 0,
      borderColor: '#000000',
      openings: [],
      innerWalls: [],
      wallsBlockLight: true,
      tint: null,
      opacity: 1.0,
    });

    this.points = [];
    this.isDrawing = false;
  }
}
