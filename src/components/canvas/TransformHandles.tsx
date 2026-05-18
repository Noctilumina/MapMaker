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
  const [mode, setMode] = useState<'resize' | 'clip'>('resize');

  const cs = grid.cellSize;
  const cx = element.x + (element.width * cs) / 2;
  const cy = element.y + (element.height * cs) / 2;
  const hw = (element.width * cs) / 2;
  const hh = (element.height * cs) / 2;
  const rot = element.rotation * (Math.PI / 180);

  const cl = element.clipLeft ?? 0;
  const cr = element.clipRight ?? 0;
  const ct = element.clipTop ?? 0;
  const cb = element.clipBottom ?? 0;

  // Rotate a local point around canvas center
  const rotPt = (lx: number, ly: number) => ({
    x: cx + lx * Math.cos(rot) - ly * Math.sin(rot),
    y: cy + lx * Math.sin(rot) + ly * Math.cos(rot),
  });

  // Corner handles (full bounding box)
  const corners = [
    rotPt(-hw, -hh),
    rotPt(hw, -hh),
    rotPt(hw, hh),
    rotPt(-hw, hh),
  ];

  // Edge midpoints for resize handles
  const edgeMids = [
    rotPt(-hw, 0),   // left
    rotPt(hw, 0),    // right
    rotPt(0, -hh),   // top
    rotPt(0, hh),    // bottom
  ];

  // Clip edge positions (at the clipped boundary)
  const clipEdges = [
    rotPt(-hw + cl * 2 * hw, 0),
    rotPt(hw - cr * 2 * hw, 0),
    rotPt(0, -hh + ct * 2 * hh),
    rotPt(0, hh - cb * 2 * hh),
  ];

  const rotHandle = rotPt(0, -hh - 20);
  const rotLineStart = rotPt(0, -hh);

  const captureOnce = useCallback(() => {
    if (!snapshotTaken) {
      useHistoryStore.getState().captureSnapshot();
      setSnapshotTaken(true);
    }
  }, [snapshotTaken]);

  // Get stage-space pointer position
  const getLocalPos = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return null;
    const ptr = stage.getPointerPosition();
    if (!ptr) return null;
    return stage.getAbsoluteTransform().copy().invert().point(ptr);
  };

  // Unrotate canvas-space delta to local space
  const toLocal = (pos: { x: number; y: number }) => {
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    return {
      lx: dx * Math.cos(-rot) - dy * Math.sin(-rot),
      ly: dx * Math.sin(-rot) + dy * Math.cos(-rot),
    };
  };

  // Corner scale drag (keeps center fixed)
  const handleScaleDrag = useCallback((_i: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    captureOnce();
    const pos = getLocalPos(e);
    if (!pos) return;
    const { lx, ly } = toLocal(pos);
    const snap = useEditorStore.getState().snapToGrid;
    let newW = Math.max(0.5, snap ? Math.round(Math.abs(lx * 2) / cs * 2) / 2 : Math.abs(lx * 2) / cs);
    let newH = Math.max(0.5, snap ? Math.round(Math.abs(ly * 2) / cs * 2) / 2 : Math.abs(ly * 2) / cs);
    updateElement(element.id, { width: newW, height: newH, x: cx - (newW * cs) / 2, y: cy - (newH * cs) / 2 });
  }, [element, cx, cy, rot, cs, captureOnce, updateElement]);

  // Edge resize drag — one axis only, opposite edge fixed
  const handleEdgeResizeDrag = useCallback((edge: 'left' | 'right' | 'top' | 'bottom', e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    captureOnce();
    const pos = getLocalPos(e);
    if (!pos) return;
    const { lx, ly } = toLocal(pos);
    const snap = useEditorStore.getState().snapToGrid;
    const minPx = 0.5 * cs;

    if (edge === 'left') {
      // right edge stays; left edge moves to lx
      const rawW = Math.max(minPx, hw - lx);
      const newW = snap ? Math.round(rawW / cs * 2) / 2 : rawW / cs;
      const clamped = Math.max(0.5, newW);
      const newHwPx = clamped * cs / 2;
      // new center shifts in local X: shift = hw - newHwPx (toward right edge)
      const shift = hw - newHwPx;
      const newCx = cx + shift * Math.cos(rot);
      const newCy = cy + shift * Math.sin(rot);
      updateElement(element.id, { width: clamped, height: element.height, x: newCx - newHwPx, y: newCy - hh });
    } else if (edge === 'right') {
      // left edge stays; right edge moves to lx
      const rawW = Math.max(minPx, lx + hw);
      const newW = snap ? Math.round(rawW / cs * 2) / 2 : rawW / cs;
      const clamped = Math.max(0.5, newW);
      const newHwPx = clamped * cs / 2;
      const shift = newHwPx - hw;
      const newCx = cx + shift * Math.cos(rot);
      const newCy = cy + shift * Math.sin(rot);
      updateElement(element.id, { width: clamped, height: element.height, x: newCx - newHwPx, y: newCy - hh });
    } else if (edge === 'top') {
      // bottom edge stays; top edge moves to ly
      const rawH = Math.max(minPx, hh - ly);
      const newH = snap ? Math.round(rawH / cs * 2) / 2 : rawH / cs;
      const clamped = Math.max(0.5, newH);
      const newHhPx = clamped * cs / 2;
      const shift = hh - newHhPx;
      const newCx = cx - shift * Math.sin(rot);
      const newCy = cy + shift * Math.cos(rot);
      updateElement(element.id, { width: element.width, height: clamped, x: newCx - hw, y: newCy - newHhPx });
    } else {
      // top edge stays; bottom edge moves to ly
      const rawH = Math.max(minPx, ly + hh);
      const newH = snap ? Math.round(rawH / cs * 2) / 2 : rawH / cs;
      const clamped = Math.max(0.5, newH);
      const newHhPx = clamped * cs / 2;
      const shift = newHhPx - hh;
      const newCx = cx - shift * Math.sin(rot);
      const newCy = cy + shift * Math.cos(rot);
      updateElement(element.id, { width: element.width, height: clamped, x: newCx - hw, y: newCy - newHhPx });
    }
  }, [element, cx, cy, rot, hw, hh, cs, captureOnce, updateElement]);

  const handleRotationDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    captureOnce();
    const pos = getLocalPos(e);
    if (!pos) return;
    let angle = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI) + 90;
    angle = ((angle % 360) + 360) % 360;
    if (useEditorStore.getState().snapToGrid) angle = Math.round(angle / 15) * 15;
    updateElement(element.id, { rotation: Math.round(angle) });
  }, [element.id, cx, cy, captureOnce, updateElement]);

  const makeClipDragHandler = useCallback((edge: 'left' | 'right' | 'top' | 'bottom') => {
    return (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      captureOnce();
      const pos = getLocalPos(e);
      if (!pos) return;
      const { lx, ly } = toLocal(pos);
      if (edge === 'left')   updateElement(element.id, { clipLeft:   Math.min(Math.max((lx + hw) / (2 * hw), 0), 1 - cr - 0.01) });
      if (edge === 'right')  updateElement(element.id, { clipRight:  Math.min(Math.max((hw - lx) / (2 * hw), 0), 1 - cl - 0.01) });
      if (edge === 'top')    updateElement(element.id, { clipTop:    Math.min(Math.max((ly + hh) / (2 * hh), 0), 1 - cb - 0.01) });
      if (edge === 'bottom') updateElement(element.id, { clipBottom: Math.min(Math.max((hh - ly) / (2 * hh), 0), 1 - ct - 0.01) });
    };
  }, [element.id, cx, cy, rot, hw, hh, cl, cr, ct, cb, captureOnce, updateElement]);

  const blue = { fill: '#89b4fa', stroke: '#1e1e2e', strokeWidth: 1.5 };
  const orange = { fill: '#fab387', stroke: '#1e1e2e', strokeWidth: 1.5 };
  const locked = element.locked ?? false;
  const lockHandle = { x: rotHandle.x + 18, y: rotHandle.y };
  const modeHandle = { x: rotHandle.x - 22, y: rotHandle.y };

  const edgeKeys = ['left', 'right', 'top', 'bottom'] as const;
  const edgeCursors = ['ew-resize', 'ew-resize', 'ns-resize', 'ns-resize'];

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

      {!locked && mode === 'resize' && (
        <>
          {/* Corner scale handles */}
          {corners.map((c, i) => (
            <Rect
              key={`corner-${i}`}
              x={c.x} y={c.y}
              offsetX={4} offsetY={4}
              width={8} height={8}
              {...blue}
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
          {/* Edge resize handles */}
          {edgeMids.map((pt, i) => (
            <Circle
              key={`edge-${edgeKeys[i]}`}
              x={pt.x} y={pt.y}
              radius={5}
              {...blue}
              draggable
              onMouseDown={(e) => { e.cancelBubble = true; }}
              onDragStart={(e) => { e.cancelBubble = true; captureOnce(); }}
              onDragMove={(e) => handleEdgeResizeDrag(edgeKeys[i], e)}
              onDragEnd={(e) => { e.cancelBubble = true; setSnapshotTaken(false); }}
              onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = edgeCursors[i]; }}
              onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
              hitStrokeWidth={10}
            />
          ))}
        </>
      )}

      {!locked && mode === 'clip' && (
        <>
          {/* Clip handles at clipped-edge midpoints */}
          {clipEdges.map((pt, i) => (
            <Circle
              key={`clip-${edgeKeys[i]}`}
              x={pt.x} y={pt.y}
              radius={5}
              {...orange}
              draggable
              onMouseDown={(e) => { e.cancelBubble = true; }}
              onDragStart={(e) => { e.cancelBubble = true; captureOnce(); }}
              onDragMove={makeClipDragHandler(edgeKeys[i])}
              onDragEnd={(e) => { e.cancelBubble = true; setSnapshotTaken(false); }}
              onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = edgeCursors[i]; }}
              onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
              hitStrokeWidth={10}
            />
          ))}
        </>
      )}

      {/* Rotation handle line */}
      {!locked && (
        <Line
          points={[rotLineStart.x, rotLineStart.y, rotHandle.x, rotHandle.y]}
          stroke="#89b4fa" strokeWidth={1} listening={false} opacity={0.5}
        />
      )}

      {/* Rotation handle */}
      {!locked && (
        <Circle
          x={rotHandle.x} y={rotHandle.y}
          radius={6}
          fill="#cba6f7" stroke="#1e1e2e" strokeWidth={1.5}
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

      {/* Mode toggle: ✂ = clip mode, ⤡ = resize mode */}
      {!locked && (
        <Text
          x={modeHandle.x} y={modeHandle.y}
          text={mode === 'resize' ? '✂' : '⤡'}
          fontSize={14}
          offsetX={7} offsetY={7}
          listening={true}
          onClick={(e) => { e.cancelBubble = true; setMode(m => m === 'resize' ? 'clip' : 'resize'); }}
          onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = 'pointer'; }}
          onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
          hitStrokeWidth={10}
        />
      )}

      {/* Lock toggle */}
      <Text
        x={lockHandle.x} y={lockHandle.y}
        text={locked ? '🔒' : '🔓'}
        fontSize={14}
        offsetX={7} offsetY={7}
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
