import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class ScatterTool implements Tool {
  name = 'scatter';
  private painting = false;
  private paintedCells = new Set<string>();

  getCursor() { return 'crosshair'; }

  onMouseDown(gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {
    this.painting = true;
    this.paintedCells.clear();
    useHistoryStore.getState().captureSnapshot();
    this.placeAt(gridPos);
  }

  onMouseMove(gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.painting) return;
    this.placeAt(gridPos);
  }

  onMouseUp() {
    this.painting = false;
    this.paintedCells.clear();
  }

  private placeAt(gridPos: GridPos) {
    const { scatterAssetIds, activeLayerId, stampRotation } = useEditorStore.getState();
    if (!scatterAssetIds || scatterAssetIds.length === 0) return;

    const assets = useMapStore.getState().assets;
    // Pick random asset from set
    const availableIds = scatterAssetIds.filter(id => assets[id]);
    if (availableIds.length === 0) return;

    const assetId = availableIds[Math.floor(Math.random() * availableIds.length)];
    const asset = assets[assetId];

    const { cellSize } = useMapStore.getState().grid;
    const tileW = asset.gridSize[0];
    const tileH = asset.gridSize[1];

    const col = Math.floor(gridPos.col / tileW) * tileW;
    const row = Math.floor(gridPos.row / tileH) * tileH;

    const cellKey = `${col},${row}`;
    if (this.paintedCells.has(cellKey)) return;
    this.paintedCells.add(cellKey);

    const x = col * cellSize;
    const y = row * cellSize;

    // Check for duplicate at exact position
    const existing = useMapStore.getState().elements;
    const isDuplicate = existing.some(el => {
      if (el.type !== 'tile' || el.assetId !== assetId) return false;
      return el.x === x && el.y === y;
    });
    if (isDuplicate) return;

    useMapStore.getState().addElement({
      type: 'tile',
      layerId: activeLayerId,
      assetId,
      groupId: null,
      x,
      y,
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
