import React from 'react';
import { Shape, Circle, Line } from 'react-konva';
import { useEffect, useState, useCallback } from 'react';
import type { PathElement as PathElementType, PathPoint } from '../../types';
import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';

interface Props {
  element: PathElementType;
}

// Build a canvas path from PathPoints as a thick road shape (outline of the stroke)
function buildRoadOutline(
  ctx: any,
  points: PathPoint[],
  width: number,
  closed: boolean
) {
  if (points.length < 2) return;

  // First, collect points along the bezier centerline
  const centerPoints: { x: number; y: number }[] = [];
  const steps = 20;

  for (let i = 0; i < points.length - (closed ? 0 : 1); i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const cp1x = p0.x + p0.handleOutX;
    const cp1y = p0.y + p0.handleOutY;
    const cp2x = p1.x + p1.handleInX;
    const cp2y = p1.y + p1.handleInY;

    for (let t = 0; t <= steps; t++) {
      const s = t / steps;
      const s2 = s * s;
      const s3 = s2 * s;
      const h0 = -s3 + 3 * s2 - 3 * s + 1;
      const h1 = 3 * s3 - 6 * s2 + 3 * s;
      const h2 = -3 * s3 + 3 * s2;
      const h3 = s3;

      centerPoints.push({
        x: h0 * p0.x + h1 * cp1x + h2 * cp2x + h3 * p1.x,
        y: h0 * p0.y + h1 * cp1y + h2 * cp2y + h3 * p1.y,
      });
    }
  }

  if (centerPoints.length < 2) return;

  // Generate left and right offset paths
  const half = width / 2;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];

  for (let i = 0; i < centerPoints.length; i++) {
    const prev = centerPoints[Math.max(0, i - 1)];
    const next = centerPoints[Math.min(centerPoints.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    left.push({ x: centerPoints[i].x + nx * half, y: centerPoints[i].y + ny * half });
    right.push({ x: centerPoints[i].x - nx * half, y: centerPoints[i].y - ny * half });
  }

  // Draw the road shape
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length; i++) {
    ctx.lineTo(left[i].x, left[i].y);
  }
  if (closed) {
    ctx.lineTo(left[0].x, left[0].y);
  }
  // Go back along the right side
  for (let i = right.length - 1; i >= 0; i--) {
    ctx.lineTo(right[i].x, right[i].y);
  }
  ctx.closePath();
}


export default function PathElement({ element }: Props) {
  const asset = useMapStore((s) => s.assets[element.assetId]);
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const updateElement = useMapStore((s) => s.updateElement);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<string | null>(null);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  const isSelected = selectedIds.includes(element.id);

  useEffect(() => {
    if (!asset) return;
    const img = new window.Image();
    img.src = asset.src;
    img.onload = () => setImage(img);
  }, [asset?.src]);

  if (!asset) return null;

  const grid = useMapStore.getState().grid;
  const tileSize = grid.cellSize * (element.fillScale || 1);
  const pathWidth = element.pathWidth || 64;
  const borderWidth = element.borderWidth || 0;
  const borderColor = element.borderColor || '#000000';

  const captureOnce = useCallback(() => {
    if (!snapshotTaken) {
      useHistoryStore.getState().captureSnapshot();
      setSnapshotTaken(true);
    }
  }, [snapshotTaken]);

  const handleDragEnd = useCallback(() => {
    setDraggingHandle(null);
    setSnapshotTaken(false);
  }, []);

  const updatePoint = useCallback((index: number, updates: Partial<PathPoint>) => {
    const newPoints = [...element.pathPoints];
    newPoints[index] = { ...newPoints[index], ...updates };
    updateElement(element.id, { pathPoints: newPoints });
  }, [element.id, element.pathPoints, updateElement]);

  return (
    <>
      {/* Border/curb (rendered wider, behind the road) */}
      {borderWidth > 0 && (
        <Shape
          sceneFunc={(ctx, shape) => {
            buildRoadOutline(ctx, element.pathPoints, pathWidth + borderWidth * 2, element.closed);
            ctx.fillStrokeShape(shape);
          }}
          fill={borderColor}
          listening={false}
          opacity={element.opacity}
        />
      )}

      {/* Road surface with texture fill */}
      <Shape
        id={element.id}
        sceneFunc={(ctx, shape) => {
          buildRoadOutline(ctx, element.pathPoints, pathWidth, element.closed);
          ctx.fillStrokeShape(shape);
        }}
        fillPatternImage={image || undefined}
        fillPatternScaleX={image ? tileSize / image.width : 1}
        fillPatternScaleY={image ? tileSize / image.height : 1}
        fillPatternRotation={element.fillRotation || 0}
        fillPatternRepeat="repeat"
        stroke={isSelected ? '#89b4fa' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        opacity={element.opacity}
        listening={true}
      />

      {/* Tint overlay for road surface */}
      {element.tint && (
        <Shape
          sceneFunc={(ctx, shape) => {
            buildRoadOutline(ctx, element.pathPoints, pathWidth, element.closed);
            ctx.fillStrokeShape(shape);
          }}
          fill={element.tint}
          opacity={0.5}
          listening={false}
          globalCompositeOperation="multiply"
        />
      )}

      {/* Control points and handles when selected */}
      {isSelected && element.pathPoints.map((pt, i) => {
        const snap = useEditorStore.getState().snapToGrid;
        const cs = grid.cellSize;

        return (
          <React.Fragment key={`path-ctrl-${i}`}>
            {/* Handle lines */}
            <Line
              points={[pt.x + pt.handleInX, pt.y + pt.handleInY, pt.x, pt.y, pt.x + pt.handleOutX, pt.y + pt.handleOutY]}
              stroke="#89b4fa"
              strokeWidth={1}
              dash={[3, 3]}
              listening={false}
              opacity={0.6}
            />

            {/* Handle In */}
            <Circle
              x={pt.x + pt.handleInX}
              y={pt.y + pt.handleInY}
              radius={4}
              fill="#f9e2af"
              stroke="#1e1e2e"
              strokeWidth={1}
              draggable
              onMouseDown={(e) => { e.cancelBubble = true; }}
              onDragStart={(e) => { e.cancelBubble = true; captureOnce(); setDraggingHandle(`in-${i}`); }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                const hx = e.target.x() - pt.x;
                const hy = e.target.y() - pt.y;
                updatePoint(i, { handleInX: hx, handleInY: hy });
              }}
              onDragEnd={(e) => { e.cancelBubble = true; handleDragEnd(); }}
              hitStrokeWidth={8}
            />

            {/* Handle Out */}
            <Circle
              x={pt.x + pt.handleOutX}
              y={pt.y + pt.handleOutY}
              radius={4}
              fill="#f9e2af"
              stroke="#1e1e2e"
              strokeWidth={1}
              draggable
              onMouseDown={(e) => { e.cancelBubble = true; }}
              onDragStart={(e) => { e.cancelBubble = true; captureOnce(); setDraggingHandle(`out-${i}`); }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                const hx = e.target.x() - pt.x;
                const hy = e.target.y() - pt.y;
                // Mirror the opposite handle for smooth curves
                updatePoint(i, { handleOutX: hx, handleOutY: hy, handleInX: -hx, handleInY: -hy });
              }}
              onDragEnd={(e) => { e.cancelBubble = true; handleDragEnd(); }}
              hitStrokeWidth={8}
            />

            {/* Main control point */}
            <Circle
              x={pt.x}
              y={pt.y}
              radius={6}
              fill={draggingHandle === `pt-${i}` ? '#a6e3a1' : '#89b4fa'}
              stroke="#1e1e2e"
              strokeWidth={2}
              draggable
              onMouseDown={(e) => { e.cancelBubble = true; }}
              onDragStart={(e) => { e.cancelBubble = true; captureOnce(); setDraggingHandle(`pt-${i}`); }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                let nx = e.target.x();
                let ny = e.target.y();
                if (snap) {
                  nx = Math.round(nx / cs) * cs;
                  ny = Math.round(ny / cs) * cs;
                  e.target.x(nx);
                  e.target.y(ny);
                }
                updatePoint(i, { x: nx, y: ny });
              }}
              onDragEnd={(e) => { e.cancelBubble = true; handleDragEnd(); }}
              hitStrokeWidth={10}
              onContextMenu={(e) => {
                e.cancelBubble = true;
                e.evt.preventDefault();
                if (element.pathPoints.length <= 2) return;
                useHistoryStore.getState().captureSnapshot();
                const newPoints = [...element.pathPoints];
                newPoints.splice(i, 1);
                updateElement(element.id, { pathPoints: newPoints });
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

