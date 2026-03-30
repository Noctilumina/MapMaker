import Konva from 'konva';
import { useEditorStore } from '../stores/editorStore';
import type { ToolName } from '../stores/editorStore';
import { useMapStore } from '../stores/mapStore';
import { pixelToCell } from '../utils/grid';
import type { Tool } from '../tools/types';
import { SelectTool } from '../tools/SelectTool';
import { StampTool } from '../tools/StampTool';
import { EraserTool } from '../tools/EraserTool';
import { PanTool } from '../tools/PanTool';
import { PolygonTool } from '../tools/PolygonTool';
import { PathTool } from '../tools/PathTool';

const polygonTool = new PolygonTool();
const pathTool = new PathTool();

const toolInstances: Record<ToolName, Tool> = {
  select: new SelectTool(),
  stamp: new StampTool(),
  eraser: new EraserTool(),
  pan: new PanTool(),
  polygon: polygonTool,
  path: pathTool,
};

export function getPolygonTool() { return polygonTool; }
export function getPathTool() { return pathTool; }

export function useCanvasInteraction() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const tool = toolInstances[activeTool];

  const getGridPos = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return { col: 0, row: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { col: 0, row: 0 };
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    const cellSize = useMapStore.getState().grid.cellSize;
    return pixelToCell(pos.x, pos.y, cellSize);
  };

  return {
    cursor: tool.getCursor(),
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'pan') return;
      tool.onMouseDown(getGridPos(e), e);
    },
    onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'pan') return;
      tool.onMouseMove(getGridPos(e), e);
    },
    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'pan') return;
      tool.onMouseUp(getGridPos(e), e);
    },
    onKeyDown: (key: string) => {
      tool.onKeyDown?.(key);
    },
  };
}
