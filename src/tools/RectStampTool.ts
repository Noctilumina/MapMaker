import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class RectStampTool implements Tool {
  name = 'rect-stamp';
  private dragging = false;
  private startPos: GridPos = { col: 0, row: 0 };
  private _preview: { start: GridPos; end: GridPos } | null = null;

  getCursor() { return 'crosshair'; }

  getPreviewState() { return this._preview; }

  onMouseDown(gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {
    this.dragging = true;
    this.startPos = { ...gridPos };
    this._preview = { start: gridPos, end: gridPos };
    useHistoryStore.getState().captureSnapshot();
  }

  onMouseMove(gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.dragging) return;
    this._preview = { start: this.startPos, end: gridPos };
  }

  onMouseUp(gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.dragging) return;
    this.dragging = false;
    this._preview = null;
    this.fillRect(this.startPos, gridPos);
  }

  private fillRect(start: GridPos, end: GridPos) {
    const { stampAssetId, activeLayerId, stampRotation } = useEditorStore.getState();
    if (!stampAssetId) return;
    const asset = useMapStore.getState().assets[stampAssetId];
    if (!asset) return;
    const { cellSize } = useMapStore.getState().grid;

    const tileW = asset.gridSize[0];
    const tileH = asset.gridSize[1];
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);

    const inputs = [];
    for (let col = minCol; col <= maxCol; col += tileW) {
      for (let row = minRow; row <= maxRow; row += tileH) {
        inputs.push({
          type: 'tile' as const,
          layerId: activeLayerId,
          assetId: stampAssetId,
          groupId: null,
          x: col * cellSize,
          y: row * cellSize,
          width: tileW,
          height: tileH,
          rotation: stampRotation,
          flipX: false,
          flipY: false,
          tint: null,
          opacity: 1.0,
        });
      }
    }
    useMapStore.getState().addElements(inputs);
  }
}
