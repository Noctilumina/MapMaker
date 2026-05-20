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
import { LightTool } from '../tools/LightTool';
import { RectStampTool } from '../tools/RectStampTool';
import { LineStampTool } from '../tools/LineStampTool';
import { ScatterTool } from '../tools/ScatterTool';
import { ReplaceTool } from '../tools/ReplaceTool';
import { FillTool } from '../tools/FillTool';
import { CopyStampTool } from '../tools/CopyStampTool';
import { MeasureTool } from '../tools/MeasureTool';
import { RandomStampTool } from '../tools/RandomStampTool';

const polygonTool = new PolygonTool();
const pathTool = new PathTool();
const rectStampTool = new RectStampTool();
const lineStampTool = new LineStampTool();
const randomStampTool = new RandomStampTool();

const toolInstances: Record<ToolName, Tool> = {
  select: new SelectTool(),
  stamp: new StampTool(),
  eraser: new EraserTool(),
  pan: new PanTool(),
  polygon: polygonTool,
  path: pathTool,
  light: new LightTool(),
  'rect-stamp': rectStampTool,
  'line-stamp': lineStampTool,
  scatter: new ScatterTool(),
  replace: new ReplaceTool(),
  fill: new FillTool(),
  'copy-stamp': new CopyStampTool(),
  measure: new MeasureTool(),
  'random-stamp': randomStampTool,
};

export function getPolygonTool() { return polygonTool; }
export function getPathTool() { return pathTool; }
export function getRectStampTool() { return rectStampTool; }
export function getLineStampTool() { return lineStampTool; }
export function getRandomStampTool() { return randomStampTool; }

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

      // Alt+click: eyedropper — pick topmost tile asset
      if (e.evt.altKey) {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (stage) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const transform = stage.getAbsoluteTransform().copy().invert();
            const pos = transform.point(pointer);
            const { elements } = useMapStore.getState();
            const activeLayerId = useEditorStore.getState().activeLayerId;
            const tiles = elements.filter(el =>
              el.type === 'tile' &&
              el.layerId === activeLayerId &&
              pos.x >= el.x && pos.x < el.x + (el as any).width * useMapStore.getState().grid.cellSize &&
              pos.y >= el.y && pos.y < el.y + (el as any).height * useMapStore.getState().grid.cellSize
            ).sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
            if (tiles.length > 0 && tiles[0].type === 'tile') {
              const pickedId = (tiles[0] as any).assetId as string;
              if (activeTool === 'random-stamp') {
                // Add to random stamp pool instead of switching tools
                useEditorStore.getState().toggleRandomStampAsset(pickedId);
              } else {
                useEditorStore.getState().setStampAsset(pickedId);
                useEditorStore.getState().setTool('stamp');
              }
            }
          }
        }
        return;
      }

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
