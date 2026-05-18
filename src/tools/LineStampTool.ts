import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

function bresenham(x0: number, y0: number, x1: number, y1: number): GridPos[] {
  const cells: GridPos[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0, cy = y0;
  while (true) {
    cells.push({ col: cx, row: cy });
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
  return cells;
}

export class LineStampTool implements Tool {
  name = 'line-stamp';
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

  private constrain(end: GridPos, e: Konva.KonvaEventObject<MouseEvent>): GridPos {
    const lock = useEditorStore.getState().lineStampAxisLock;
    const dc = Math.abs(end.col - this.startPos.col);
    const dr = Math.abs(end.row - this.startPos.row);
    const shiftLock = e.evt.shiftKey ? (dc >= dr ? 'h' : 'v') : null;
    const effective = shiftLock ?? lock;
    if (effective === 'h') return { col: end.col, row: this.startPos.row };
    if (effective === 'v') return { col: this.startPos.col, row: end.row };
    return end;
  }

  onMouseMove(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.dragging) return;
    this._preview = { start: this.startPos, end: this.constrain(gridPos, e) };
  }

  onMouseUp(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.dragging) return;
    this.dragging = false;
    this._preview = null;
    this.fillLine(this.startPos, this.constrain(gridPos, e));
  }

  private fillLine(start: GridPos, end: GridPos) {
    const { stampAssetId, activeLayerId, stampRotation } = useEditorStore.getState();
    if (!stampAssetId) return;
    const asset = useMapStore.getState().assets[stampAssetId];
    if (!asset) return;
    const { cellSize } = useMapStore.getState().grid;

    const tileW = asset.gridSize[0];
    const tileH = asset.gridSize[1];

    // Bresenham stepping by tile size
    const stepCols = tileW;
    const stepRows = tileH;

    // Scale down coords so each step = one tile
    const sc = Math.floor(start.col / stepCols);
    const sr = Math.floor(start.row / stepRows);
    const ec = Math.floor(end.col / stepCols);
    const er = Math.floor(end.row / stepRows);

    const cells = bresenham(sc, sr, ec, er);
    const seen = new Set<string>();
    const inputs = [];

    for (const cell of cells) {
      const col = cell.col * stepCols;
      const row = cell.row * stepRows;
      const key = `${col},${row}`;
      if (seen.has(key)) continue;
      seen.add(key);
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

    useMapStore.getState().addElements(inputs);
  }
}
