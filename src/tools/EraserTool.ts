import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useMapStore } from '../stores/mapStore';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';

export class EraserTool implements Tool {
  name = 'eraser';
  private erasing = false;

  getCursor() { return 'not-allowed'; }

  onMouseDown(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    this.erasing = true;
    this.eraseAt(gridPos, e);
  }

  onMouseMove(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.erasing) return;
    this.eraseAt(gridPos, e);
  }

  onMouseUp() {
    this.erasing = false;
  }

  private eraseAt(gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const target = e.target;
    const elementId = target.id?.();
    const activeLayerId = useEditorStore.getState().activeLayerId;
    const elements = useMapStore.getState().elements;
    const hit = elements.find((el) => el.id === elementId && el.layerId === activeLayerId);

    if (hit) {
      useHistoryStore.getState().captureSnapshot();
      useMapStore.getState().removeElement(hit.id);
    }
  }
}
