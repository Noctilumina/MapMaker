import { Circle, Line, Rect, Text } from 'react-konva';
import { useCallback, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';
import type { TileElement } from '../../types';
import type Konva from 'konva';

interface Props {
  element: TileElement;
}

export default function TransformHandles({ element }: Props) {
  const grid = useMapStore((s) => s.grid);
  const updateElement = useMapStore((s) => s.updateElement);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  const cs = grid.cellSize;
  const cx = element.x + (element.width * cs) / 2;
  const cy = element.y + (element.height * cs) / 2;
  const hw = (element.width * cs) / 2;
  const hh = (element.height * cs) / 2;
  const rot = element.rotation * (Math.PI / 180);

  // Rotate a point around center
  const rotPt = (lx: number, ly: number) => ({
    x: cx + lx * Math.cos(rot) - ly * Math.sin(rot),
    y: cy + lx * Math.sin(rot) + ly * Math.cos(rot),
  });

  // Corner positions (for scale handles)
  const corners = [
    rotPt(-hw, -hh), // top-left
    rotPt(hw, -hh),  // top-right
    rotPt(hw, hh),   // bottom-right
    rotPt(-hw, hh),  // bottom-left
  ];

  // Rotation handle — above top edge
  const rotHandle = rotPt(0, -hh - 20);
  const rotLineStart = rotPt(0, -hh);

  const captureOnce = useCallback(() => {
    if (!snapshotTaken) {
      useHistoryStore.getState().captureSnapshot();
      setSnapshotTaken(true);
    }
  }, [snapshotTaken]);

  const handleScaleDrag = useCallback((_cornerIdx: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    captureOnce();

    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    // Calculate new size based on distance from center to dragged corner
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    // Unrotate the delta
    const udx = dx * Math.cos(-rot) - dy * Math.sin(-rot);
    const udy = dx * Math.sin(-rot) + dy * Math.cos(-rot);

    const snap = useEditorStore.getState().snapToGrid;
    let newW = Math.abs(udx * 2) / cs;
    let newH = Math.abs(udy * 2) / cs;

    if (snap) {
      newW = Math.round(newW * 2) / 2; // snap to 0.5 cells
      newH = Math.round(newH * 2) / 2;
    }

    newW = Math.max(0.5, newW);
    newH = Math.max(0.5, newH);

    // Recalculate position to keep center stable
    const newX = cx - (newW * cs) / 2;
    const newY = cy - (newH * cs) / 2;

    updateElement(element.id, { width: newW, height: newH, x: newX, y: newY });
  }, [element, cx, cy, rot, cs, captureOnce, updateElement]);

  const handleRotationDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    captureOnce();

    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    let angle = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI) + 90;
    angle = ((angle % 360) + 360) % 360;

    const snap = useEditorStore.getState().snapToGrid;
    if (snap) {
      angle = Math.round(angle / 15) * 15;
    }

    updateElement(element.id, { rotation: Math.round(angle) });
  }, [element.id, cx, cy, captureOnce, updateElement]);

  const handleStyle = { fill: '#89b4fa', stroke: '#1e1e2e', strokeWidth: 1.5 };
  const locked = element.locked ?? false;
  const lockHandle = { x: rotHandle.x + 18, y: rotHandle.y };

  return (
    <>
      {/* Bounding box outline */}
      <Line
        points={[...corners.flatMap(c => [c.x, c.y])]}
        closed
        stroke={locked ? '#f38ba8' : '#89b4fa'}
        strokeWidth={1}
        dash={[4, 4]}
        listening={false}
        opacity={0.5}
      />

      {/* Scale handles at corners — hidden when locked */}
      {!locked && corners.map((c, i) => (
        <Rect
          key={`scale-${i}`}
          x={c.x}
          y={c.y}
          offsetX={4}
          offsetY={4}
          width={8}
          height={8}
          {...handleStyle}
          draggable
          onMouseDown={(e) => { e.cancelBubble = true; }}
          onDragStart={(e) => { e.cancelBubble = true; captureOnce(); }}
          onDragMove={(e) => handleScaleDrag(i, e)}
          onDragEnd={(e) => { e.cancelBubble = true; setSnapshotTaken(false); }}
          onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = 'nwse-resize'; }}
          onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
          hitStrokeWidth={8}
        />
      ))}

      {/* Rotation handle line */}
      {!locked && (
        <Line
          points={[rotLineStart.x, rotLineStart.y, rotHandle.x, rotHandle.y]}
          stroke="#89b4fa"
          strokeWidth={1}
          listening={false}
          opacity={0.5}
        />
      )}

      {/* Rotation handle — hidden when locked */}
      {!locked && (
        <Circle
          x={rotHandle.x}
          y={rotHandle.y}
          radius={6}
          fill="#cba6f7"
          stroke="#1e1e2e"
          strokeWidth={1.5}
          draggable
          onMouseDown={(e) => { e.cancelBubble = true; }}
          onDragStart={(e) => { e.cancelBubble = true; captureOnce(); }}
          onDragMove={handleRotationDrag}
          onDragEnd={(e) => { e.cancelBubble = true; setSnapshotTaken(false); }}
          onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = 'crosshair'; }}
          onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
          hitStrokeWidth={8}
        />
      )}

      {/* Lock toggle button */}
      <Text
        x={lockHandle.x}
        y={lockHandle.y}
        text={locked ? '🔒' : '🔓'}
        fontSize={14}
        offsetX={7}
        offsetY={7}
        listening={true}
        onClick={(e) => {
          e.cancelBubble = true;
          useHistoryStore.getState().captureSnapshot();
          updateElement(element.id, { locked: !locked });
        }}
        onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = 'pointer'; }}
        onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
        hitStrokeWidth={10}
      />
    </>
  );
}
