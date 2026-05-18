import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos, MapElement } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

function pointInPolygon(px: number, py: number, points: number[]): boolean {
  const n = points.length / 2;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i * 2], yi = points[i * 2 + 1];
    const xj = points[j * 2], yj = points[j * 2 + 1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function hitTest(px: number, py: number, el: MapElement, cellSize: number): boolean {
  if (el.type === 'tile') {
    const w = el.width * cellSize;
    const h = el.height * cellSize;
    return px >= el.x && px <= el.x + w && py >= el.y && py <= el.y + h;
  }
  if (el.type === 'polygon') {
    return pointInPolygon(px, py, el.points);
  }
  if (el.type === 'path') {
    if (el.pathPoints.length === 0) return false;
    const xs = el.pathPoints.map(p => p.x);
    const ys = el.pathPoints.map(p => p.y);
    const pad = el.pathWidth / 2;
    return px >= Math.min(...xs) - pad && px <= Math.max(...xs) + pad
        && py >= Math.min(...ys) - pad && py <= Math.max(...ys) + pad;
  }
  if (el.type === 'light') {
    const dx = px - el.x;
    const dy = py - el.y;
    return Math.sqrt(dx * dx + dy * dy) <= Math.max(el.radius, 20);
  }
  return false;
}

function getCanvasPos(e: Konva.KonvaEventObject<MouseEvent>): { x: number; y: number } | null {
  const stage = e.target.getStage();
  if (!stage) return null;
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  const transform = stage.getAbsoluteTransform().copy().invert();
  return transform.point(pointer);
}

export class SelectTool implements Tool {
  name = 'select';
  private dragging = false;
  private dragElementId: string | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private boxStartX = 0;
  private boxStartY = 0;
  private boxing = false;

  // Click-through cycling state
  private lastClickPos: { x: number; y: number } | null = null;
  private clickCycleIndex = 0;
  private clickCandidates: string[] = [];

  getCursor() { return 'default'; }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const pos = getCanvasPos(e);
    const canvasX = pos ? pos.x : gridPos.col * useMapStore.getState().grid.cellSize;
    const canvasY = pos ? pos.y : gridPos.row * useMapStore.getState().grid.cellSize;

    const { cellSize } = useMapStore.getState().grid;
    const elements = useMapStore.getState().elements;
    const shiftKey = e.evt.shiftKey;

    // Find all elements under click, sorted by zIndex descending (topmost first)
    const candidates = elements
      .filter(el => hitTest(canvasX, canvasY, el, cellSize))
      .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
      .map(el => el.id);

    if (candidates.length === 0) {
      useEditorStore.getState().deselect();
      this.boxing = true;
      this.lastClickPos = null;
      this.clickCandidates = [];
      this.clickCycleIndex = 0;
      if (pos) {
        this.boxStartX = pos.x;
        this.boxStartY = pos.y;
      }
      return;
    }

    const selected = useEditorStore.getState().selectedElementIds;

    if (shiftKey) {
      // Shift-click: toggle topmost candidate, reset cycle
      const hitId = candidates[0];
      const newIds = selected.includes(hitId)
        ? selected.filter(id => id !== hitId)
        : [...selected, hitId];
      useEditorStore.getState().select(newIds);
      this.lastClickPos = { x: canvasX, y: canvasY };
      this.clickCandidates = candidates;
      this.clickCycleIndex = 0;
      const hit = elements.find(el => el.id === hitId);
      if (hit && !hit.locked) {
        this.dragging = true;
        this.dragElementId = hitId;
      }
      this.dragStartX = canvasX;
      this.dragStartY = canvasY;
      useHistoryStore.getState().captureSnapshot();
      return;
    }

    // Determine if this is a same-spot repeat click for cycling
    const CYCLE_THRESHOLD = 5;
    const sameSpot = this.lastClickPos !== null
      && Math.abs(canvasX - this.lastClickPos.x) < CYCLE_THRESHOLD
      && Math.abs(canvasY - this.lastClickPos.y) < CYCLE_THRESHOLD;

    let hitId: string;
    if (sameSpot && this.clickCandidates.length > 1) {
      this.clickCycleIndex = (this.clickCycleIndex + 1) % this.clickCandidates.length;
      hitId = this.clickCandidates[this.clickCycleIndex];
    } else {
      this.clickCycleIndex = 0;
      this.clickCandidates = candidates;
      hitId = candidates[0];
    }

    this.lastClickPos = { x: canvasX, y: canvasY };

    if (!selected.includes(hitId)) {
      useEditorStore.getState().select([hitId]);
    }

    const hit = elements.find(el => el.id === hitId);
    if (hit && !hit.locked) {
      this.dragging = true;
      this.dragElementId = hitId;
    }
    this.dragStartX = canvasX;
    this.dragStartY = canvasY;
    useHistoryStore.getState().captureSnapshot();
  }

  onMouseMove(_gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (this.boxing) {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (pointer) {
        const transform = stage!.getAbsoluteTransform().copy().invert();
        const pos = transform.point(pointer);
        const x = Math.min(this.boxStartX, pos.x);
        const y = Math.min(this.boxStartY, pos.y);
        const width = Math.abs(pos.x - this.boxStartX);
        const height = Math.abs(pos.y - this.boxStartY);
        useEditorStore.getState().setSelectionBox({ x, y, width, height });
      }
      return;
    }

    if (!this.dragging || !this.dragElementId) return;

    const { cellSize } = useMapStore.getState().grid;
    const { snapToGrid: snap } = useEditorStore.getState();

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const transform = stage!.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    let currentX = pos.x;
    let currentY = pos.y;
    if (snap) {
      currentX = Math.floor(currentX / cellSize) * cellSize;
      currentY = Math.floor(currentY / cellSize) * cellSize;
    }

    const deltaX = currentX - this.dragStartX;
    const deltaY = currentY - this.dragStartY;
    if (deltaX === 0 && deltaY === 0) return;

    // Reset cycle state on drag — position is changing
    this.lastClickPos = null;

    const selected = useEditorStore.getState().selectedElementIds;
    const elements = useMapStore.getState().elements;

    const moves = selected
      .map(id => elements.find(e => e.id === id))
      .filter((el): el is NonNullable<typeof el> => !!el && !el.locked)
      .map(el => ({ id: el.id, dx: deltaX, dy: deltaY }));

    if (moves.length > 0) {
      useMapStore.getState().moveElements(moves);
    }

    this.dragStartX = currentX;
    this.dragStartY = currentY;
  }

  onMouseUp(_gridPos: GridPos, _e: Konva.KonvaEventObject<MouseEvent>) {
    if (this.boxing) {
      this.boxing = false;
      const box = useEditorStore.getState().selectionBox;
      if (box && box.width > 5 && box.height > 5) {
        const { elements } = useMapStore.getState();
        const { cellSize } = useMapStore.getState().grid;
        const hits = elements.filter((el) => {
          if (el.type === 'polygon') {
            const xs = el.points.filter((_, i) => i % 2 === 0);
            const ys = el.points.filter((_, i) => i % 2 === 1);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            return minX < box.x + box.width && maxX > box.x && minY < box.y + box.height && maxY > box.y;
          }
          if (el.type === 'path') {
            const xs = el.pathPoints.map(p => p.x);
            const ys = el.pathPoints.map(p => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            return minX < box.x + box.width && maxX > box.x && minY < box.y + box.height && maxY > box.y;
          }
          const elX = el.x;
          const elY = el.y;
          const elW = (el.type === 'tile' ? el.width : 1) * cellSize;
          const elH = (el.type === 'tile' ? el.height : 1) * cellSize;
          return elX < box.x + box.width && elX + elW > box.x && elY < box.y + box.height && elY + elH > box.y;
        });
        useEditorStore.getState().select(hits.map((el) => el.id));
      }
      useEditorStore.getState().setSelectionBox(null);
      return;
    }

    this.dragging = false;
    this.dragElementId = null;
  }
}
