import Konva from 'konva';
import type { Tool } from './types';
import type { GridPos } from '../types';
import { useEditorStore } from '../stores/editorStore';

export class MeasureTool implements Tool {
  name = 'measure';
  private dragging = false;

  private getPixelPos(e: Konva.KonvaEventObject<MouseEvent>): { x: number; y: number } | null {
    const stage = e.target.getStage();
    if (!stage) return null;
    const ptr = stage.getPointerPosition();
    if (!ptr) return null;
    return stage.getAbsoluteTransform().copy().invert().point(ptr);
  }

  onMouseDown(_gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    const pos = this.getPixelPos(e);
    if (!pos) return;
    this.dragging = true;
    useEditorStore.getState().setMeasureStart(pos);
    useEditorStore.getState().setMeasureEnd(pos);
  }

  onMouseMove(_gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.dragging) return;
    const pos = this.getPixelPos(e);
    if (!pos) return;
    useEditorStore.getState().setMeasureEnd(pos);
  }

  onMouseUp(_gridPos: GridPos, e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.dragging) return;
    this.dragging = false;
    const pos = this.getPixelPos(e);
    if (!pos) return;
    useEditorStore.getState().setMeasureEnd(pos);
  }

  getCursor() { return 'crosshair'; }
}
