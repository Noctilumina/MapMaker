import { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer as KonvaLayer, Group, Line, Circle, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import BackgroundLayer from './BackgroundLayer';
import GridLayer from './GridLayer';
import TileElement from './TileElement';
import PolygonElement from './PolygonElement';
import PathElement from './PathElement';
import LightElement from './LightElement';
import LightingLayer from './LightingLayer';
import TransformHandles from './TransformHandles';
import SelectionBox from './SelectionBox';
import { useEditorStore } from '../../stores/editorStore';
import { useMapStore } from '../../stores/mapStore';
import { useCanvasInteraction, getPolygonTool, getPathTool } from '../../hooks/useCanvasInteraction';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

function MapLayers() {
  const layers = useMapStore((s) => s.layers);
  const elements = useMapStore((s) => s.elements);
  const grid = useMapStore((s) => s.grid);
  const totalWidth = grid.width * grid.cellSize;
  const totalHeight = grid.height * grid.cellSize;

  return (
    <>
      {layers.map((layer) => (
        <KonvaLayer key={layer.id} visible={layer.visible} opacity={layer.opacity}>
          <Group
            clipX={0} clipY={0}
            clipWidth={totalWidth} clipHeight={totalHeight}
          >
            {elements
              .filter((el) => el.layerId === layer.id)
              .map((el) => {
                if (el.type === 'polygon') {
                  return <PolygonElement key={el.id} element={el} />;
                }
                if (el.type === 'path') {
                  return <PathElement key={el.id} element={el} />;
                }
                if (el.type === 'light') {
                  return <LightElement key={el.id} element={el} />;
                }
                return <TileElement key={el.id} element={el} />;
              })}
          </Group>
        </KonvaLayer>
      ))}
    </>
  );
}

// Stamp preview — ghost wireframe showing where the asset will be placed
let stampPreviewSetPos: ((pos: { x: number; y: number } | null) => void) | null = null;

function StampPreviewWrapper() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const stampAssetId = useEditorStore((s) => s.stampAssetId);
  const stampRotation = useEditorStore((s) => s.stampRotation);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const grid = useMapStore((s) => s.grid);
  const assets = useMapStore((s) => s.assets);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);
  const prevSrcRef = useRef<string>('');

  useEffect(() => {
    stampPreviewSetPos = setPos;
    return () => { stampPreviewSetPos = null; };
  }, []);

  // Load preview image when asset changes
  const asset = stampAssetId ? assets[stampAssetId] : null;
  useEffect(() => {
    if (!asset || asset.src === prevSrcRef.current) return;
    prevSrcRef.current = asset.src;
    const img = new window.Image();
    img.src = asset.src;
    img.onload = () => setPreviewImage(img);
  }, [asset?.src]);

  if (activeTool !== 'stamp' || !stampAssetId || !pos || !asset) return null;

  const cs = grid.cellSize;
  const w = asset.gridSize[0] * cs;
  const h = asset.gridSize[1] * cs;

  let px = pos.x, py = pos.y;
  if (snapToGrid) {
    px = Math.floor(px / cs) * cs;
    py = Math.floor(py / cs) * cs;
  }

  const cx = px + w / 2;
  const cy = py + h / 2;

  return (
    <KonvaLayer listening={false}>
      <Group x={cx} y={cy} rotation={stampRotation} opacity={0.5}>
        {/* Ghost image of the asset */}
        {previewImage && (
          <KonvaImage
            image={previewImage}
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            listening={false}
          />
        )}
        {/* Outline border */}
        <Line
          points={[-w/2, -h/2, w/2, -h/2, w/2, h/2, -w/2, h/2]}
          closed
          stroke="#66ffaa"
          strokeWidth={2}
          dash={[6, 4]}
          listening={false}
        />
      </Group>
    </KonvaLayer>
  );
}

function TransformOverlay() {
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const elements = useMapStore((s) => s.elements);

  if (selectedIds.length !== 1) return null;
  const el = elements.find(e => e.id === selectedIds[0]);
  if (!el || el.type !== 'tile') return null;

  return (
    <KonvaLayer>
      <TransformHandles element={el} />
    </KonvaLayer>
  );
}

function SelectionOverlay() {
  const selectionBox = useEditorStore((s) => s.selectionBox);
  return (
    <KonvaLayer listening={false}>
      <SelectionBox rect={selectionBox} />
    </KonvaLayer>
  );
}

function PolygonPreview() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const [, forceUpdate] = useState(0);

  // Re-render periodically while polygon tool is active to show preview
  useEffect(() => {
    if (activeTool !== 'polygon') return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 100);
    return () => clearInterval(interval);
  }, [activeTool]);

  if (activeTool !== 'polygon') return null;

  const polyTool = getPolygonTool();
  const points = polyTool.getPoints();
  if (points.length < 2) return null;

  return (
    <KonvaLayer listening={false}>
      <Line
        points={points}
        stroke="#a6e3a1"
        strokeWidth={2}
        dash={[6, 4]}
        closed={false}
        listening={false}
      />
      {Array.from({ length: points.length / 2 }, (_, i) => (
        <Circle
          key={`preview-${i}`}
          x={points[i * 2]}
          y={points[i * 2 + 1]}
          radius={5}
          fill={i === 0 ? '#a6e3a1' : '#89b4fa'}
          stroke="#1e1e2e"
          strokeWidth={1}
          listening={false}
        />
      ))}
    </KonvaLayer>
  );
}

function PathPreview() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (activeTool !== 'path') return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 100);
    return () => clearInterval(interval);
  }, [activeTool]);

  if (activeTool !== 'path') return null;

  const pathToolInst = getPathTool();
  const points = pathToolInst.getPoints();
  if (points.length === 0) return null;

  // Draw bezier preview
  const pathData: number[] = [];
  for (const pt of points) {
    pathData.push(pt.x, pt.y);
  }

  return (
    <KonvaLayer listening={false}>
      <Line
        points={pathData}
        stroke="#f9e2af"
        strokeWidth={2}
        dash={[6, 4]}
        tension={0.5}
        listening={false}
      />
      {points.map((pt, i) => (
        <Circle
          key={`path-preview-${i}`}
          x={pt.x}
          y={pt.y}
          radius={5}
          fill={i === 0 ? '#f9e2af' : '#89b4fa'}
          stroke="#1e1e2e"
          strokeWidth={1}
          listening={false}
        />
      ))}
    </KonvaLayer>
  );
}

let stageInstance: Konva.Stage | null = null;
export function getStageInstance() { return stageInstance; }

export default function MapCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);
  const interaction = useCanvasInteraction();

  useEffect(() => {
    stageInstance = stageRef.current;
    return () => { stageInstance = null; };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const oldZoom = viewport.zoom;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * (direction > 0 ? factor : 1 / factor)));

      const mousePointTo = {
        x: (pointer.x - viewport.panX) / oldZoom,
        y: (pointer.y - viewport.panY) / oldZoom,
      };

      setViewport({
        zoom: newZoom,
        panX: pointer.x - mousePointTo.x * newZoom,
        panY: pointer.y - mousePointTo.y * newZoom,
      });
    },
    [viewport, setViewport]
  );

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        x={viewport.panX}
        y={viewport.panY}
        draggable={useEditorStore((s) => s.activeTool) === 'pan'}
        onDragEnd={(e) => {
          setViewport({ panX: e.target.x(), panY: e.target.y() });
        }}
        onWheel={handleWheel}
        onMouseDown={interaction.onMouseDown}
        onMouseMove={(e) => {
          interaction.onMouseMove(e);
          // Update stamp preview position
          const stage = e.target.getStage();
          if (stage && stampPreviewSetPos) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              const transform = stage.getAbsoluteTransform().copy().invert();
              const pos = transform.point(pointer);
              stampPreviewSetPos({ x: pos.x, y: pos.y });
            }
          }
        }}
        onMouseUp={interaction.onMouseUp}
        style={{ cursor: interaction.cursor }}
      >
        <BackgroundLayer />
        <GridLayer />
        <MapLayers />
        <LightingLayer />
        <PolygonPreview />
        <PathPreview />
        <StampPreviewWrapper />
        <TransformOverlay />
        <SelectionOverlay />
      </Stage>
    </div>
  );
}
