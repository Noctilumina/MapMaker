import { Line, Circle, Group, Image as KonvaImage, Rect } from 'react-konva';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { PolygonElement as PolygonElementType } from '../../types';
import { useMapStore } from '../../stores/mapStore';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';
import Konva from 'konva';

// Cardinal spline through points (same algorithm Konva uses for tension)
function getSplinePoints(pts: number[], tension: number, closed: boolean): number[] {
  const n = pts.length;
  if (n < 4) return pts;

  const allPts: number[] = [];
  const numPoints = n / 2;

  for (let i = 0; i < numPoints; i++) {
    const prev = closed ? ((i - 1 + numPoints) % numPoints) : Math.max(0, i - 1);
    const curr = i;
    const next = closed ? ((i + 1) % numPoints) : Math.min(numPoints - 1, i + 1);
    const next2 = closed ? ((i + 2) % numPoints) : Math.min(numPoints - 1, i + 2);

    const p0x = pts[prev * 2], p0y = pts[prev * 2 + 1];
    const p1x = pts[curr * 2], p1y = pts[curr * 2 + 1];
    const p2x = pts[next * 2], p2y = pts[next * 2 + 1];
    const p3x = pts[next2 * 2], p3y = pts[next2 * 2 + 1];

    const steps = 16;
    for (let t = 0; t <= steps; t++) {
      const s = t / steps;
      const s2 = s * s;
      const s3 = s2 * s;

      const t1 = tension;
      const h1 = 2 * s3 - 3 * s2 + 1;
      const h2 = -2 * s3 + 3 * s2;
      const h3 = s3 - 2 * s2 + s;
      const h4 = s3 - s2;

      const x = h1 * p1x + h2 * p2x + h3 * (p2x - p0x) * t1 + h4 * (p3x - p1x) * t1;
      const y = h1 * p1y + h2 * p2y + h3 * (p2y - p0y) * t1 + h4 * (p3y - p1y) * t1;

      allPts.push(x, y);
    }
  }
  return allPts;
}

// Seeded PRNG (same as BackgroundLayer)
function seededRandom(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Props {
  element: PolygonElementType;
}

export default function PolygonElement({ element }: Props) {
  const asset = useMapStore((s) => s.assets[element.assetId]);
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
  const updateElement = useMapStore((s) => s.updateElement);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [draggingVertex, setDraggingVertex] = useState<number | null>(null);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [ghostOpening, setGhostOpening] = useState<{ x: number; y: number; angle: number; width: number; type: 'door' | 'window' } | null>(null);
  const [ghostWallEnd, setGhostWallEnd] = useState<{ x: number; y: number } | null>(null);

  const isSelected = selectedIds.includes(element.id);

  useEffect(() => {
    if (!asset) return;
    const img = new window.Image();
    img.src = asset.src;
    img.onload = () => setImage(img);
  }, [asset?.src]);

  if (!asset) return null;

  const scale = element.fillScale || 1;
  const grid = useMapStore.getState().grid;
  const tileSize = grid.cellSize * scale;
  const snap = useEditorStore.getState().snapToGrid;
  const cellSize = grid.cellSize;
  const randomize = element.fillRandomize ?? false;
  const seed = element.fillRandomSeed ?? 42;
  const tension = element.tension || 0;
  const borderWidth = element.borderWidth || 0;
  const borderColor = element.borderColor || '#000000';

  // Compute bounding box of polygon for tiling
  const bounds = useMemo(() => {
    const xs = element.points.filter((_, i) => i % 2 === 0);
    const ys = element.points.filter((_, i) => i % 2 === 1);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }, [element.points]);

  // Generate fill tiles within the polygon bounding box
  // Used for both randomized and non-randomized fills
  const fillTiles = (() => {
    if (!image) return [];

    const rand = randomize ? seededRandom(seed) : null;
    const rotations = [0, 90, 180, 270];
    const tiles: { x: number; y: number; rotation: number; scaleX: number; scaleY: number; size: number }[] = [];

    const offsetX = element.fillOffsetX || 0;
    const offsetY = element.fillOffsetY || 0;
    const fillRot = element.fillRotation || 0;
    const startCol = Math.floor((bounds.minX - offsetX) / tileSize) - 1;
    const startRow = Math.floor((bounds.minY - offsetY) / tileSize) - 1;
    const endCol = Math.ceil((bounds.maxX - offsetX) / tileSize) + 1;
    const endRow = Math.ceil((bounds.maxY - offsetY) / tileSize) + 1;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const baseX = c * tileSize + offsetX;
        const baseY = r * tileSize + offsetY;

        if (rand) {
          // Randomized: jitter, random rotation/flip, scale up
          const jitterRange = tileSize * 0.1;
          tiles.push({
            x: baseX + tileSize / 2 + (rand() - 0.5) * 2 * jitterRange,
            y: baseY + tileSize / 2 + (rand() - 0.5) * 2 * jitterRange,
            rotation: fillRot + rotations[Math.floor(rand() * 4)],
            scaleX: rand() > 0.5 ? -1 : 1,
            scaleY: rand() > 0.5 ? -1 : 1,
            size: tileSize * 1.2,
          });
        } else {
          // Non-randomized: clean tiling with fill rotation
          tiles.push({
            x: baseX + tileSize / 2,
            y: baseY + tileSize / 2,
            rotation: fillRot,
            scaleX: 1,
            scaleY: 1,
            size: tileSize,
          });
        }
      }
    }
    return tiles;
  })();

  const handleVertexDragStart = useCallback((index: number) => {
    if (!snapshotTaken) {
      useHistoryStore.getState().captureSnapshot();
      setSnapshotTaken(true);
    }
    setDraggingVertex(index);
  }, [snapshotTaken]);

  const handleVertexDragMove = useCallback((index: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let newX = node.x();
    let newY = node.y();

    if (snap) {
      newX = Math.round(newX / cellSize) * cellSize;
      newY = Math.round(newY / cellSize) * cellSize;
      node.x(newX);
      node.y(newY);
    }

    const newPoints = [...element.points];
    newPoints[index * 2] = newX;
    newPoints[index * 2 + 1] = newY;
    updateElement(element.id, { points: newPoints });
  }, [element.id, element.points, updateElement, snap, cellSize]);

  const handleVertexDragEnd = useCallback(() => {
    setDraggingVertex(null);
    setSnapshotTaken(false);
  }, []);

  // Clip function that follows the smoothed/tensioned shape
  const clipFunc = useCallback((ctx: any) => {
    if (element.points.length < 6) return;

    ctx.beginPath();
    if (tension > 0) {
      // Use cardinal spline interpolation to match Konva's tension rendering
      const spline = getSplinePoints(element.points, tension, true);
      if (spline.length >= 2) {
        ctx.moveTo(spline[0], spline[1]);
        for (let i = 2; i < spline.length; i += 2) {
          ctx.lineTo(spline[i], spline[i + 1]);
        }
      }
    } else {
      // Straight lines
      ctx.moveTo(element.points[0], element.points[1]);
      for (let i = 2; i < element.points.length; i += 2) {
        ctx.lineTo(element.points[i], element.points[i + 1]);
      }
    }
    ctx.closePath();
  }, [element.points, tension]);

  // Selection stroke color (overridden by border when not selected)
  const strokeColor = isSelected ? '#89b4fa' : (borderWidth > 0 ? borderColor : 'rgba(255,255,255,0.15)');
  const strokeW = isSelected ? Math.max(2, borderWidth) : (borderWidth > 0 ? borderWidth : 1);

  return (
    <>
      {/* Invisible hit area for click detection on the polygon interior */}
      <Line
        id={element.id}
        points={element.points}
        closed
        tension={tension}
        listening={true}
        fillEnabled={false}
        strokeEnabled={false}
        hitFunc={(context, shape) => {
          context.beginPath();
          const pts = element.points;
          context.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) context.lineTo(pts[i], pts[i + 1]);
          context.closePath();
          context.fillStrokeShape(shape);
        }}
        onMouseDown={(e) => {
          // Handle inner wall clicks inside polygon body
          const { pendingInnerWall } = useEditorStore.getState();
          if (!pendingInnerWall || !isSelected) return;
          e.cancelBubble = true;
          const stage = e.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;
          const transform = stage.getAbsoluteTransform().copy().invert();
          const pos = transform.point(pointer);
          const cs = useMapStore.getState().grid.cellSize;
          let wx = pos.x, wy = pos.y;
          if (useEditorStore.getState().snapToGrid) {
            wx = Math.round(wx / cs) * cs;
            wy = Math.round(wy / cs) * cs;
          }
          const pendingStart = (window as any).__pendingInnerWallStart;
          if (pendingStart && pendingStart.elementId === element.id) {
            useHistoryStore.getState().captureSnapshot();
            updateElement(element.id, {
              innerWalls: [...(element.innerWalls || []), {
                id: crypto.randomUUID(),
                x1: pendingStart.x, y1: pendingStart.y,
                x2: wx, y2: wy,
                width: borderWidth || 4,
                color: borderColor,
              }],
            });
            (window as any).__pendingInnerWallStart = null;
            setGhostWallEnd(null);
          } else {
            (window as any).__pendingInnerWallStart = { elementId: element.id, x: wx, y: wy };
          }
        }}
        onMouseMove={(e) => {
          const pendingStart = (window as any).__pendingInnerWallStart;
          if (!pendingStart || pendingStart.elementId !== element.id || !isSelected) {
            setGhostWallEnd(null);
            return;
          }
          const stage = e.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;
          const transform = stage.getAbsoluteTransform().copy().invert();
          const pos = transform.point(pointer);
          let gx = pos.x, gy = pos.y;
          if (useEditorStore.getState().snapToGrid) {
            const cs = useMapStore.getState().grid.cellSize;
            gx = Math.round(gx / cs) * cs;
            gy = Math.round(gy / cs) * cs;
          }
          setGhostWallEnd({ x: gx, y: gy });
        }}
      />

      {/* Fill — clipped tiled images (works for both randomized and non-randomized) */}
      {element.opacity > 0 && image && fillTiles.length > 0 && (
        <Group clipFunc={clipFunc} opacity={element.opacity}>
          {fillTiles.map((tile, idx) => (
            <KonvaImage
              key={`ft-${idx}`}
              image={image}
              x={tile.x}
              y={tile.y}
              offsetX={tile.size / 2}
              offsetY={tile.size / 2}
              width={tile.size}
              height={tile.size}
              rotation={tile.rotation}
              scaleX={tile.scaleX}
              scaleY={tile.scaleY}
              listening={false}
            />
          ))}
        </Group>
      )}

      {/* Tint overlay — colored layer on top of fill, clipped to polygon */}
      {element.tint && element.opacity > 0 && (
        <Group clipFunc={clipFunc} opacity={element.opacity * 0.5}>
          <Rect
            x={bounds.minX - 10}
            y={bounds.minY - 10}
            width={bounds.maxX - bounds.minX + 20}
            height={bounds.maxY - bounds.minY + 20}
            fill={element.tint}
            listening={false}
            globalCompositeOperation="multiply"
          />
        </Group>
      )}

      {/* Border/outline — rendered edge by edge with gaps for openings */}
      {(() => {
        const openings = element.openings || [];
        const numVerts = element.points.length / 2;
        const edges: JSX.Element[] = [];

        for (let i = 0; i < numVerts; i++) {
          const nextI = (i + 1) % numVerts;
          const x1 = element.points[i * 2];
          const y1 = element.points[i * 2 + 1];
          const x2 = element.points[nextI * 2];
          const y2 = element.points[nextI * 2 + 1];

          // Find openings on this edge
          const edgeOpenings = openings
            .filter(o => o.edgeIndex === i)
            .sort((a, b) => a.position - b.position);

          if (edgeOpenings.length === 0) {
            // Full edge, no gaps
            edges.push(
              <Line key={`border-${i}`} points={[x1, y1, x2, y2]}
                stroke={strokeColor} strokeWidth={strokeW} listening={false} />
            );
          } else {
            // Draw edge segments between openings
            const edgeLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const dx = (x2 - x1) / edgeLen;
            const dy = (y2 - y1) / edgeLen;
            let cursor = 0;

            for (const opening of edgeOpenings) {
              const halfW = opening.width / 2;
              const openStart = Math.max(0, opening.position * edgeLen - halfW);
              const openEnd = Math.min(edgeLen, opening.position * edgeLen + halfW);

              // Segment before opening
              if (openStart > cursor) {
                edges.push(
                  <Line key={`border-${i}-pre-${opening.id}`}
                    points={[x1 + dx * cursor, y1 + dy * cursor, x1 + dx * openStart, y1 + dy * openStart]}
                    stroke={strokeColor} strokeWidth={strokeW} listening={false} />
                );
              }

              // Window: thinner dashed line
              if (opening.type === 'window') {
                edges.push(
                  <Line key={`opening-${opening.id}`}
                    points={[x1 + dx * openStart, y1 + dy * openStart, x1 + dx * openEnd, y1 + dy * openEnd]}
                    stroke="#74c7ec" strokeWidth={Math.max(1, strokeW * 0.3)} dash={[4, 4]} listening={false} />
                );
              }

              // Door: draw a door panel swinging open
              if (opening.type === 'door') {
                const doorColor = opening.doorColor || '#6c7086';
                const openAngle = (opening.doorOpenAngle ?? 45) * (Math.PI / 180);
                const hinge = opening.doorHinge || 'left';
                const swing = opening.doorSwing || 'inward';
                // Wall normal — perpendicular to edge, flip for outward
                const normalSign = swing === 'outward' ? -1 : 1;
                const nx = -dy * normalSign;
                const ny = dx * normalSign;
                // Hinge position
                const hingePos = hinge === 'left' ? openStart : openEnd;
                const hingeX = x1 + dx * hingePos;
                const hingeY = y1 + dy * hingePos;
                // Door swings inward from the hinge
                const doorLen = opening.width;
                // Direction along wall from hinge
                const wallDirX = hinge === 'left' ? dx : -dx;
                const wallDirY = hinge === 'left' ? dy : -dy;
                // Rotate the door direction by openAngle inward
                const cosA = Math.cos(openAngle);
                const sinA = Math.sin(openAngle);
                // Rotate wall direction toward interior (normal direction)
                const doorDirX = wallDirX * cosA + nx * sinA;
                const doorDirY = wallDirY * cosA + ny * sinA;
                const doorEndX = hingeX + doorDirX * doorLen;
                const doorEndY = hingeY + doorDirY * doorLen;

                // Door panel
                edges.push(
                  <Line key={`door-panel-${opening.id}`}
                    points={[hingeX, hingeY, doorEndX, doorEndY]}
                    stroke={doorColor} strokeWidth={Math.max(3, strokeW * 0.6)}
                    lineCap="round" listening={false} />
                );
                // Door arc (quarter circle showing swing range)
                const arcPoints: number[] = [];
                const arcSteps = 12;
                for (let s = 0; s <= arcSteps; s++) {
                  const a = (s / arcSteps) * openAngle;
                  const adx = wallDirX * Math.cos(a) + nx * Math.sin(a);
                  const ady = wallDirY * Math.cos(a) + ny * Math.sin(a);
                  arcPoints.push(hingeX + adx * doorLen, hingeY + ady * doorLen);
                }
                edges.push(
                  <Line key={`door-arc-${opening.id}`}
                    points={arcPoints}
                    stroke={doorColor} strokeWidth={1} dash={[3, 3]}
                    opacity={0.4} listening={false} />
                );
              }

              cursor = openEnd;
            }

            // Segment after last opening
            if (cursor < edgeLen) {
              edges.push(
                <Line key={`border-${i}-post`}
                  points={[x1 + dx * cursor, y1 + dy * cursor, x2, y2]}
                  stroke={strokeColor} strokeWidth={strokeW} listening={false} />
              );
            }
          }
        }

        return <>{edges}</>;
      })()}

      {/* Inner walls */}
      {(element.innerWalls || []).map(wall => (
        <Line key={`iw-${wall.id}`}
          points={[wall.x1, wall.y1, wall.x2, wall.y2]}
          stroke={wall.color || borderColor}
          strokeWidth={wall.width || borderWidth}
          lineCap="round"
          listening={false}
        />
      ))}

      {/* Inner wall endpoint handles when selected */}
      {isSelected && (element.innerWalls || []).map(wall => {
        const handleDragWallPoint = (wallId: string, point: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
          e.cancelBubble = true;
          let nx = e.target.x();
          let ny = e.target.y();
          if (snap) {
            nx = Math.round(nx / cellSize) * cellSize;
            ny = Math.round(ny / cellSize) * cellSize;
            e.target.x(nx);
            e.target.y(ny);
          }
          const updates = point === 'start' ? { x1: nx, y1: ny } : { x2: nx, y2: ny };
          updateElement(element.id, {
            innerWalls: (element.innerWalls || []).map(w =>
              w.id === wallId ? { ...w, ...updates } : w
            ),
          });
        };

        return [
          <Circle key={`iw-p1-${wall.id}`}
            x={wall.x1} y={wall.y1} radius={5}
            fill="#f9e2af" stroke="#1e1e2e" strokeWidth={2}
            draggable
            onMouseDown={(e) => { e.cancelBubble = true; }}
            onDragStart={(e) => { e.cancelBubble = true; useHistoryStore.getState().captureSnapshot(); }}
            onDragMove={(e) => handleDragWallPoint(wall.id, 'start', e)}
            onDragEnd={(e) => { e.cancelBubble = true; }}
            onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = 'grab'; }}
            onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
            hitStrokeWidth={10}
            onContextMenu={(e) => {
              e.cancelBubble = true;
              e.evt.preventDefault();
              useHistoryStore.getState().captureSnapshot();
              updateElement(element.id, {
                innerWalls: (element.innerWalls || []).filter(w => w.id !== wall.id),
              });
            }}
          />,
          <Circle key={`iw-p2-${wall.id}`}
            x={wall.x2} y={wall.y2} radius={5}
            fill="#f9e2af" stroke="#1e1e2e" strokeWidth={2}
            draggable
            onMouseDown={(e) => { e.cancelBubble = true; }}
            onDragStart={(e) => { e.cancelBubble = true; useHistoryStore.getState().captureSnapshot(); }}
            onDragMove={(e) => handleDragWallPoint(wall.id, 'end', e)}
            onDragEnd={(e) => { e.cancelBubble = true; }}
            onMouseEnter={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = 'grab'; }}
            onMouseLeave={(e) => { const s = (e.target as any).getStage(); if (s) s.container().style.cursor = ''; }}
            hitStrokeWidth={10}
            onContextMenu={(e) => {
              e.cancelBubble = true;
              e.evt.preventDefault();
              useHistoryStore.getState().captureSnapshot();
              updateElement(element.id, {
                innerWalls: (element.innerWalls || []).filter(w => w.id !== wall.id),
              });
            }}
          />,
        ];
      })}

      {/* Ghost preview for inner wall being drawn */}
      {isSelected && (window as any).__pendingInnerWallStart?.elementId === element.id && (
        <>
          <Circle
            x={(window as any).__pendingInnerWallStart.x}
            y={(window as any).__pendingInnerWallStart.y}
            radius={5}
            fill="#f9e2af"
            stroke="#1e1e2e"
            strokeWidth={2}
            listening={false}
          />
          {ghostWallEnd && (
            <>
              <Line
                points={[
                  (window as any).__pendingInnerWallStart.x,
                  (window as any).__pendingInnerWallStart.y,
                  ghostWallEnd.x,
                  ghostWallEnd.y,
                ]}
                stroke="#f9e2af"
                strokeWidth={borderWidth || 4}
                dash={[6, 4]}
                opacity={0.5}
                lineCap="round"
                listening={false}
              />
              <Circle
                x={ghostWallEnd.x}
                y={ghostWallEnd.y}
                radius={5}
                fill="#f9e2af"
                stroke="#1e1e2e"
                strokeWidth={2}
                opacity={0.5}
                listening={false}
              />
            </>
          )}
        </>
      )}

      {/* Edge hit zones - click to add vertex */}
      {isSelected && element.points.length >= 4 &&
        Array.from({ length: element.points.length / 2 }, (_, i) => {
          const nextI = (i + 1) % (element.points.length / 2);
          const x1 = element.points[i * 2];
          const y1 = element.points[i * 2 + 1];
          const x2 = element.points[nextI * 2];
          const y2 = element.points[nextI * 2 + 1];
          return (
            <Line
              key={`edge-${element.id}-${i}`}
              points={[x1, y1, x2, y2]}
              stroke="transparent"
              strokeWidth={1}
              hitStrokeWidth={16}
              onMouseDown={(e) => {
                e.cancelBubble = true;
                const stage = e.target.getStage();
                if (!stage) return;
                const pointer = stage.getPointerPosition();
                if (!pointer) return;
                const transform = stage.getAbsoluteTransform().copy().invert();
                const pos = transform.point(pointer);

                const { pendingOpening, pendingInnerWall } = useEditorStore.getState();

                // Place an opening on this edge
                if (pendingOpening) {
                  const ex1 = element.points[i * 2];
                  const ey1 = element.points[i * 2 + 1];
                  const ex2 = element.points[nextI * 2];
                  const ey2 = element.points[nextI * 2 + 1];
                  const edgeLen = Math.sqrt((ex2 - ex1) ** 2 + (ey2 - ey1) ** 2);
                  // Project click onto edge to get position (0-1)
                  const t = Math.max(0.05, Math.min(0.95,
                    ((pos.x - ex1) * (ex2 - ex1) + (pos.y - ey1) * (ey2 - ey1)) / (edgeLen * edgeLen)
                  ));
                  const cs = useMapStore.getState().grid.cellSize;
                  useHistoryStore.getState().captureSnapshot();
                  const newOpening = {
                    id: crypto.randomUUID(),
                    type: pendingOpening,
                    edgeIndex: i,
                    position: t,
                    width: pendingOpening === 'door' ? cs * 1.2 : cs * 0.8,
                    doorColor: '#6c7086',
                    doorOpenAngle: 45,
                    doorHinge: 'left' as const,
                    doorSwing: 'inward' as const,
                  };
                  updateElement(element.id, {
                    openings: [...(element.openings || []), newOpening],
                  });
                  return;
                }

                // Start/finish inner wall
                if (pendingInnerWall) {
                  const cs = useMapStore.getState().grid.cellSize;
                  let wx = pos.x;
                  let wy = pos.y;
                  if (useEditorStore.getState().snapToGrid) {
                    wx = Math.round(wx / cs) * cs;
                    wy = Math.round(wy / cs) * cs;
                  }
                  // Check if we have a pending start point stored in a data attribute
                  const existingWalls = element.innerWalls || [];
                  const pendingStart = (window as any).__pendingInnerWallStart;
                  if (pendingStart && pendingStart.elementId === element.id) {
                    useHistoryStore.getState().captureSnapshot();
                    updateElement(element.id, {
                      innerWalls: [...existingWalls, {
                        id: crypto.randomUUID(),
                        x1: pendingStart.x, y1: pendingStart.y,
                        x2: wx, y2: wy,
                        width: borderWidth || 4,
                        color: borderColor,
                      }],
                    });
                    (window as any).__pendingInnerWallStart = null;
                  } else {
                    (window as any).__pendingInnerWallStart = { elementId: element.id, x: wx, y: wy };
                  }
                  return;
                }

                // Default: add vertex
                useHistoryStore.getState().captureSnapshot();
                const newPoints = [...element.points];
                const insertIdx = (i + 1) * 2;
                let nx = pos.x;
                let ny = pos.y;
                if (useEditorStore.getState().snapToGrid) {
                  const cs = useMapStore.getState().grid.cellSize;
                  nx = Math.round(nx / cs) * cs;
                  ny = Math.round(ny / cs) * cs;
                }
                newPoints.splice(insertIdx, 0, nx, ny);
                updateElement(element.id, { points: newPoints });
              }}
              onMouseMove={(e) => {
                const { pendingOpening } = useEditorStore.getState();
                if (!pendingOpening) {
                  setGhostOpening(null);
                  return;
                }
                const stage = e.target.getStage();
                if (!stage) return;
                const pointer = stage.getPointerPosition();
                if (!pointer) return;
                const transform = stage.getAbsoluteTransform().copy().invert();
                const pos = transform.point(pointer);

                const ex1 = element.points[i * 2];
                const ey1 = element.points[i * 2 + 1];
                const ex2 = element.points[nextI * 2];
                const ey2 = element.points[nextI * 2 + 1];
                const edgeLen = Math.sqrt((ex2 - ex1) ** 2 + (ey2 - ey1) ** 2);
                const t = Math.max(0.05, Math.min(0.95,
                  ((pos.x - ex1) * (ex2 - ex1) + (pos.y - ey1) * (ey2 - ey1)) / (edgeLen * edgeLen)
                ));
                const gx = ex1 + (ex2 - ex1) * t;
                const gy = ey1 + (ey2 - ey1) * t;
                const angle = Math.atan2(ey2 - ey1, ex2 - ex1) * (180 / Math.PI);
                const cs = useMapStore.getState().grid.cellSize;
                const w = pendingOpening === 'door' ? cs * 1.2 : cs * 0.8;
                setGhostOpening({ x: gx, y: gy, angle, width: w, type: pendingOpening });
              }}
              onMouseEnter={(e) => {
                const stage = (e.target as any).getStage();
                const { pendingOpening } = useEditorStore.getState();
                if (stage) stage.container().style.cursor = pendingOpening ? 'copy' : 'cell';
              }}
              onMouseLeave={(e) => {
                const stage = (e.target as any).getStage();
                if (stage) stage.container().style.cursor = '';
                setGhostOpening(null);
              }}
            />
          );
        })
      }
      {isSelected && element.points.length >= 2 &&
        Array.from({ length: element.points.length / 2 }, (_, i) => (
          <Circle
            key={`v-${element.id}-${i}`}
            x={element.points[i * 2]}
            y={element.points[i * 2 + 1]}
            radius={6}
            fill={draggingVertex === i ? '#a6e3a1' : '#89b4fa'}
            stroke="#1e1e2e"
            strokeWidth={2}
            draggable
            onMouseDown={(e) => { e.cancelBubble = true; }}
            onDragStart={(e) => { e.cancelBubble = true; handleVertexDragStart(i); }}
            onDragMove={(e) => { e.cancelBubble = true; handleVertexDragMove(i, e); }}
            onDragEnd={(e) => { e.cancelBubble = true; handleVertexDragEnd(); }}
            onMouseEnter={(e) => { (e.target as Konva.Circle).getStage()!.container().style.cursor = 'grab'; }}
            onMouseLeave={(e) => { (e.target as Konva.Circle).getStage()!.container().style.cursor = ''; }}
            hitStrokeWidth={10}
            onContextMenu={(e) => {
              e.cancelBubble = true;
              e.evt.preventDefault();
              if (element.points.length <= 6) return;
              useHistoryStore.getState().captureSnapshot();
              const newPoints = [...element.points];
              newPoints.splice(i * 2, 2);
              updateElement(element.id, { points: newPoints });
            }}
          />
        ))
      }

      {/* Ghost opening preview */}
      {isSelected && ghostOpening && (
        <Rect
          x={ghostOpening.x}
          y={ghostOpening.y}
          offsetX={ghostOpening.width / 2}
          offsetY={(borderWidth || 4) / 2}
          width={ghostOpening.width}
          height={borderWidth || 4}
          rotation={ghostOpening.angle}
          fill={ghostOpening.type === 'door' ? 'rgba(166, 227, 161, 0.5)' : 'rgba(137, 180, 250, 0.5)'}
          stroke={ghostOpening.type === 'door' ? '#a6e3a1' : '#89b4fa'}
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}

      {/* Ghost inner wall start point */}
      {isSelected && (window as any).__pendingInnerWallStart?.elementId === element.id && (
        <Circle
          x={(window as any).__pendingInnerWallStart.x}
          y={(window as any).__pendingInnerWallStart.y}
          radius={5}
          fill="#f9e2af"
          stroke="#1e1e2e"
          strokeWidth={2}
          dash={[3, 3]}
          listening={false}
        />
      )}
    </>
  );
}
