import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class StampTool implements Tool {
  name = 'stamp';
  private painting = false;
  private paintedCells = new Set<string>();
  private lastPlaceKey = '';

  getCursor() { return 'crosshair'; }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    this.painting = true;
    this.paintedCells.clear();
    useHistoryStore.getState().captureSnapshot();
    this.placeAt(gridPos, e);
  }

  onMouseMove(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.painting) return;
    this.placeAt(gridPos, e);
  }

  onMouseUp() {
    this.painting = false;
    this.paintedCells.clear();
    this.lastPlaceKey = '';
  }

  onKeyDown(key: string) {
    if (key === 'r' || key === 'R') {
      const store = useEditorStore.getState();
      store.setStampRotation((store.stampRotation + 90) % 360);
    }
  }

  private placeAt(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const { stampAssetId, stampRotation, activeLayerId, snapToGrid } = useEditorStore.getState();
    if (!stampAssetId) return;

    const asset = useMapStore.getState().assets[stampAssetId];
    if (!asset) return;

    const { cellSize } = useMapStore.getState().grid;
    let x: number, y: number;

    if (snapToGrid) {
      // Snap to grid
      const cellKey = `${gridPos.col},${gridPos.row}`;
      if (this.paintedCells.has(cellKey)) return;
      this.paintedCells.add(cellKey);
      x = gridPos.col * cellSize;
      y = gridPos.row * cellSize;
    } else {
      // Free placement — use exact cursor position
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pos = transform.point(pointer);
      x = Math.round(pos.x);
      y = Math.round(pos.y);
      // Deduplicate by rounded position
      const placeKey = `${x},${y}`;
      if (placeKey === this.lastPlaceKey) return;
      this.lastPlaceKey = placeKey;
    }

    const w = asset.gridSize[0] * cellSize;
    const h = asset.gridSize[1] * cellSize;

    // Check for exact duplicate
    const existing = useMapStore.getState().elements;
    const isDuplicate = existing.some(el => {
      if (el.type !== 'tile' || el.assetId !== stampAssetId) return false;
      const ew = el.width * cellSize;
      const eh = el.height * cellSize;
      return el.x === x && el.y === y && ew === w && eh === h;
    });
    if (isDuplicate) return;

    useMapStore.getState().addElement({
      type: 'tile',
      layerId: activeLayerId,
      assetId: stampAssetId,
      groupId: null,
      x,
      y,
      width: asset.gridSize[0],
      height: asset.gridSize[1],
      rotation: stampRotation,
      flipX: false,
      flipY: false,
      tint: null,
      opacity: 1.0,
    });
  }
}
