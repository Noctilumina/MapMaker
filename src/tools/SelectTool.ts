import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class SelectTool implements Tool {
  name = 'select';
  private dragging = false;
  private dragElementId: string | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private boxStartX = 0;
  private boxStartY = 0;
  private boxing = false;

  getCursor() { return 'default'; }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const target = e.target;
    const elementId = target.id?.();
    const elements = useMapStore.getState().elements;
    const hit = elements.find((el) => el.id === elementId);

    if (hit) {
      const shiftKey = e.evt.shiftKey;
      const selected = useEditorStore.getState().selectedElementIds;
      if (shiftKey) {
        const newIds = selected.includes(hit.id)
          ? selected.filter((id) => id !== hit.id)
          : [...selected, hit.id];
        useEditorStore.getState().select(newIds);
      } else if (!selected.includes(hit.id)) {
        useEditorStore.getState().select([hit.id]);
      }
      this.dragging = true;
      this.dragElementId = hit.id;
      this.dragStartX = gridPos.col * useMapStore.getState().grid.cellSize;
      this.dragStartY = gridPos.row * useMapStore.getState().grid.cellSize;
      useHistoryStore.getState().captureSnapshot();
    } else {
      useEditorStore.getState().deselect();
      this.boxing = true;
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (pointer) {
        const transform = stage!.getAbsoluteTransform().copy().invert();
        const pos = transform.point(pointer);
        this.boxStartX = pos.x;
        this.boxStartY = pos.y;
      }
    }
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

    const selected = useEditorStore.getState().selectedElementIds;
    const elements = useMapStore.getState().elements;

    selected.forEach((id) => {
      const el = elements.find((e) => e.id === id);
      if (el) {
        if (el.type === 'polygon') {
          useMapStore.getState().movePolygon(id, deltaX, deltaY);
        } else if (el.type === 'path') {
          useMapStore.getState().movePath(id, deltaX, deltaY);
        } else {
          useMapStore.getState().moveElement(id, el.x + deltaX, el.y + deltaY);
        }
      }
    });

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
