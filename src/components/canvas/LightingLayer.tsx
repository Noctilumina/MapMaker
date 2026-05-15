import { Layer, Rect, Line, Group, Shape } from 'react-konva';
import React, { useMemo, useCallback } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { computeVisibilityPolygon, getWallSegments, transformHull } from '../../utils/visibility';
import type { PolygonElement, LightSource } from '../../types';

function getAmbientLight(time: number): { color: string; darkness: number } {
  if (time >= 10 && time <= 16) return { color: 'rgba(0,0,0,0)', darkness: 0 };
  if (time >= 7 && time < 10) {
    const t = (time - 7) / 3;
    return { color: `rgba(255, 200, 100, ${0.15 * (1 - t)})`, darkness: 0.05 * (1 - t) };
  }
  if (time > 16 && time <= 18) {
    const t = (time - 16) / 2;
    return { color: `rgba(255, 140, 50, ${0.2 * t})`, darkness: 0.05 * t };
  }
  if (time > 18 && time <= 20) {
    const t = (time - 18) / 2;
    return { color: `rgba(30, 20, 80, ${0.3 + 0.4 * t})`, darkness: 0.2 + 0.5 * t };
  }
  if (time > 20 || time < 5) {
    return { color: 'rgba(10, 10, 40, 0.75)', darkness: 0.75 };
  }
  if (time >= 5 && time < 7) {
    const t = (time - 5) / 2;
    return { color: `rgba(255, 160, 70, ${0.4 * (1 - t)})`, darkness: 0.5 * (1 - t) };
  }
  return { color: 'rgba(0,0,0,0)', darkness: 0 };
}

function getSunAngle(time: number): { dx: number; dy: number; length: number; visible: boolean } {
  if (time < 6 || time > 19) return { dx: 0, dy: 0, length: 0, visible: false };
  // Sun rises east (right), arcs south (bottom in top-down), sets west (left)
  // Shadows point OPPOSITE to sun direction
  // t=0 (6am): sun east → shadow points west (dx negative)
  // t=0.5 (noon): sun south → shadow points north (dy negative, short)
  // t=1 (18pm): sun west → shadow points east (dx positive)
  const t = (time - 6) / 12; // 0 to 1 across the day
  const sunAngle = t * Math.PI; // 0 (east) to PI (west)
  // Shadow direction is opposite to sun
  const shadowDx = -Math.cos(sunAngle); // sunrise: points left, sunset: points right
  const shadowDy = -Math.abs(Math.sin(sunAngle)) * 0.5; // always points somewhat north (up)
  const noon = Math.abs(time - 12) / 6; // 0 at noon, 1 at sunrise/sunset
  const length = 0.3 + noon * 1.5;
  return {
    dx: shadowDx * length,
    dy: shadowDy * length - length * 0.2, // bias shadows slightly north
    length,
    visible: true,
  };
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 255;
  const g = parseInt(h.substring(2, 4), 16) || 200;
  const b = parseInt(h.substring(4, 6), 16) || 100;
  return `${r}, ${g}, ${b}`;
}



// Render a single light — with wall occlusion if inside a building, full circle if outside
function LightWithOcclusion({ light, wallSegments, darkness }: {
  light: LightSource;
  wallSegments: ReturnType<typeof getWallSegments>;
  darkness: number;
  polygons?: PolygonElement[];
}) {
  const effectiveIntensity = light.intensity * (0.3 + darkness * 0.7);
  if (effectiveIntensity < 0.05) return null;

  // Use all wall segments — visibility algorithm handles inside/outside correctly
  const useOcclusion = wallSegments.length > 0;

  const visPolygons = useMemo(() => {
    if (!useOcclusion) return [];
    const shape = light.lightShape || 'point';
    if (shape === 'bar') {
      const x2 = light.x2 ?? light.x + 64;
      const y2 = light.y2 ?? light.y;
      const dx = x2 - light.x;
      const dy = y2 - light.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(3, Math.ceil(len / (light.radius * 0.4)));
      return Array.from({ length: steps }, (_, i) => {
        const t = steps === 1 ? 0.5 : i / (steps - 1);
        return computeVisibilityPolygon(light.x + dx * t, light.y + dy * t, wallSegments, light.radius);
      });
    }
    return [computeVisibilityPolygon(light.x, light.y, wallSegments, light.radius)];
  }, [light.x, light.y, light.x2, light.y2, light.lightShape, wallSegments, light.radius, useOcclusion]);

  const clipFunc = useCallback((ctx: any) => {
    ctx.beginPath();
    for (const poly of visPolygons) {
      if (poly.length < 6) continue;
      ctx.moveTo(poly[0], poly[1]);
      for (let i = 2; i < poly.length; i += 2) {
        ctx.lineTo(poly[i], poly[i + 1]);
      }
      ctx.closePath();
    }
  }, [visPolygons]);

  const rgb = hexToRgb(light.color);
  const shape = light.lightShape || 'point';

  const colorStops = (intensity: number): (number | string)[] => [
    0, `rgba(${rgb}, ${intensity})`,
    0.3, `rgba(${rgb}, ${intensity * 0.5})`,
    0.7, `rgba(${rgb}, ${intensity * 0.15})`,
    1, `rgba(${rgb}, 0)`,
  ];

  // Generate light gradient element(s) based on shape
  let lightElements: React.JSX.Element;

  if (shape === 'point') {
    lightElements = (
      <Rect
        x={light.x - light.radius} y={light.y - light.radius}
        width={light.radius * 2} height={light.radius * 2}
        fillRadialGradientStartPoint={{ x: light.radius, y: light.radius }}
        fillRadialGradientEndPoint={{ x: light.radius, y: light.radius }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={light.radius}
        fillRadialGradientColorStops={colorStops(effectiveIntensity)}
        listening={false} globalCompositeOperation="lighter"
      />
    );
  } else if (shape === 'bar') {
    // Bar light — true capsule via sceneFunc with clipped non-overlapping regions
    const x2 = light.x2 ?? light.x + 64;
    const y2 = light.y2 ?? light.y;
    const dx = x2 - light.x;
    const dy = y2 - light.y;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    const r = light.radius;
    const ei = effectiveIntensity;
    const x1 = light.x, y1 = light.y;

    lightElements = (
      <Shape
        sceneFunc={(ctx) => {
          const nctx = (ctx as any)._context as CanvasRenderingContext2D;

          // Cap stops mirror tube's perpendicular half-profile so junction is seamless:
          // tube at d=0 → ei, d=r/2 (stop 0.75) → ei*0.15, d=r → 0
          const addCapStops = (grad: CanvasGradient) => {
            grad.addColorStop(0,   `rgba(${rgb}, ${ei})`);
            grad.addColorStop(0.5, `rgba(${rgb}, ${ei * 0.15})`);
            grad.addColorStop(1,   `rgba(${rgb}, 0)`);
          };

          // Tube body — perpendicular linear gradient, x ∈ [-1, len+1] (1px overlap at each end to avoid boundary gaps)
          nctx.save();
          nctx.translate(x1, y1);
          nctx.rotate(angle);
          nctx.beginPath();
          nctx.rect(-1, -r, len + 2, r * 2);
          nctx.clip();
          const tubeGrad = nctx.createLinearGradient(0, -r, 0, r);
          tubeGrad.addColorStop(0,    `rgba(${rgb}, 0)`);
          tubeGrad.addColorStop(0.25, `rgba(${rgb}, ${ei * 0.15})`);
          tubeGrad.addColorStop(0.5,  `rgba(${rgb}, ${ei})`);
          tubeGrad.addColorStop(0.75, `rgba(${rgb}, ${ei * 0.15})`);
          tubeGrad.addColorStop(1,    `rgba(${rgb}, 0)`);
          nctx.fillStyle = tubeGrad;
          nctx.fillRect(-1, -r, len + 2, r * 2);
          nctx.restore();

          // Start cap — half-disc at x1,y1 — x ∈ [-r, 0] in bar-local space
          nctx.save();
          nctx.translate(x1, y1);
          nctx.rotate(angle);
          nctx.beginPath();
          nctx.rect(-r, -r, r, r * 2);
          nctx.clip();
          const startGrad = nctx.createRadialGradient(0, 0, 0, 0, 0, r);
          addCapStops(startGrad);
          nctx.fillStyle = startGrad;
          nctx.fillRect(-r, -r, r, r * 2);
          nctx.restore();

          // End cap — half-disc at x2,y2 — x ∈ [0, r] in bar-local space
          nctx.save();
          nctx.translate(x2, y2);
          nctx.rotate(angle);
          nctx.beginPath();
          nctx.rect(0, -r, r, r * 2);
          nctx.clip();
          const endGrad = nctx.createRadialGradient(0, 0, 0, 0, 0, r);
          addCapStops(endGrad);
          nctx.fillStyle = endGrad;
          nctx.fillRect(0, -r, r, r * 2);
          nctx.restore();
        }}
        listening={false}
        globalCompositeOperation="lighter"
      />
    );
  } else {
    // Polygon light — render point lights at centroid + vertices
    const pts = light.shapePoints || [];
    const numVerts = pts.length / 2;
    if (numVerts < 3) return null;
    // Centroid
    let cx = 0, cy = 0;
    for (let i = 0; i < numVerts; i++) { cx += pts[i * 2]; cy += pts[i * 2 + 1]; }
    cx /= numVerts; cy /= numVerts;

    const positions = [{ x: cx, y: cy }];
    for (let i = 0; i < numVerts; i++) {
      positions.push({ x: (pts[i * 2] + cx) / 2, y: (pts[i * 2 + 1] + cy) / 2 });
    }
    const perLight = effectiveIntensity / Math.sqrt(positions.length) * 1.5;

    lightElements = (
      <>{positions.map((p, i) => (
        <Rect key={`poly-${i}`}
          x={p.x - light.radius} y={p.y - light.radius}
          width={light.radius * 2} height={light.radius * 2}
          fillRadialGradientStartPoint={{ x: light.radius, y: light.radius }}
          fillRadialGradientEndPoint={{ x: light.radius, y: light.radius }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={light.radius}
          fillRadialGradientColorStops={colorStops(perLight)}
          listening={false} globalCompositeOperation="lighter"
        />
      ))}</>
    );
  }

  if (useOcclusion && visPolygons.some(p => p.length >= 6)) {
    return <Group clipFunc={clipFunc}>{lightElements}</Group>;
  }

  return lightElements;
}

export default function LightingLayer() {
  const grid = useMapStore((s) => s.grid);
  const elements = useMapStore((s) => s.elements);
  const assets = useMapStore((s) => s.assets);
  const cellSize = useMapStore((s) => s.grid.cellSize);
  const [showHullDebug, setShowHullDebug] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.key === 'd' || e.key === 'D') && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setShowHullDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!grid.lightingEnabled) return null;

  const time = grid.timeOfDay ?? 14;
  const totalWidth = grid.width * grid.cellSize;
  const totalHeight = grid.height * grid.cellSize;
  const ambient = getAmbientLight(time);
  const sun = getSunAngle(time);

  const polygons = elements.filter((el): el is PolygonElement => el.type === 'polygon' && (el.wallsBlockLight ?? true));
  const lights = elements.filter((el): el is LightSource => el.type === 'light');

  // Polygon wall segments
  const polySegments = useMemo(() => {
    const segs: ReturnType<typeof getWallSegments> = [];
    for (const poly of polygons) {
      const polySegs = getWallSegments(poly.points, poly.openings || [], poly.innerWalls || [], poly.wallsBlockLight ?? true);
      segs.push(...polySegs);
    }
    return segs;
  }, [polygons]);

  // Tile hull segments (from blocksLight asset occlusion hulls)
  const tileSegments = useMemo(() => {
    const segs: ReturnType<typeof getWallSegments> = [];
    for (const el of elements) {
      if (el.type !== 'tile' || !el.blocksLight) continue;
      const asset = assets[el.assetId];
      if (!asset?.occlusionHull || asset.occlusionHull.length < 6) continue;
      const hull = transformHull(asset.occlusionHull, el, cellSize);
      for (let i = 0; i < hull.length; i += 2) {
        const ni = (i + 2) % hull.length;
        segs.push({ x1: hull[i], y1: hull[i + 1], x2: hull[ni], y2: hull[ni + 1] });
      }
    }
    return segs;
  }, [elements, assets, cellSize]);


  // All wall segments merged
  const allWallSegments = useMemo(
    () => [...polySegments, ...tileSegments],
    [polySegments, tileSegments]
  );

  // Window glows at night
  const windowGlows = useMemo(() => {
    if (ambient.darkness < 0.3) return [];
    const glows: { x: number; y: number; radius: number }[] = [];
    for (const poly of polygons) {
      const numVerts = poly.points.length / 2;
      for (const opening of (poly.openings || [])) {
        if (opening.type !== 'window') continue;
        const i = opening.edgeIndex;
        const nextI = (i + 1) % numVerts;
        const x1 = poly.points[i * 2], y1 = poly.points[i * 2 + 1];
        const x2 = poly.points[nextI * 2], y2 = poly.points[nextI * 2 + 1];
        glows.push({
          x: x1 + (x2 - x1) * opening.position,
          y: y1 + (y2 - y1) * opening.position,
          radius: grid.cellSize * 2,
        });
      }
    }
    return glows;
  }, [polygons, ambient.darkness, grid.cellSize]);

  // Building shadows — connected to building, daytime only
  const shadows = useMemo(() => {
    if (!sun.visible) return [];
    const cs = grid.cellSize;
    const sdx = sun.dx * cs;
    const sdy = sun.dy * cs;

    return polygons.map(poly => {
      const pts = poly.points;
      const numPts = pts.length / 2;
      // Build shadow: original polygon + offset polygon, connected along silhouette edges
      const shadowPts: number[] = [];
      // Forward: original polygon
      for (let i = 0; i < numPts; i++) {
        shadowPts.push(pts[i * 2], pts[i * 2 + 1]);
      }
      // Backward: offset polygon (connects at last vertex, goes back)
      for (let i = numPts - 1; i >= 0; i--) {
        shadowPts.push(pts[i * 2] + sdx, pts[i * 2 + 1] + sdy);
      }
      return shadowPts;
    });
  }, [polygons, sun, grid.cellSize]);

  return (
    <Layer listening={false}>
      {/* DEBUG: Tile hull visualization (Ctrl+Shift+D to toggle) */}
      {showHullDebug && (
        <>
          {tileSegments.map((seg, idx) => (
            <React.Fragment key={`hull-debug-${idx}`}>
              <Line
                points={[seg.x1, seg.y1, seg.x2, seg.y2]}
                stroke="rgba(255, 0, 255, 0.8)"
                strokeWidth={3}
                listening={false}
              />
              <Rect
                x={seg.x1 - 4}
                y={seg.y1 - 4}
                width={8}
                height={8}
                fill="rgba(255, 0, 255, 1)"
                listening={false}
              />
            </React.Fragment>
          ))}
          {tileSegments.length === 0 && (
            <Rect
              x={0}
              y={0}
              width={100}
              height={30}
              fill="rgba(255, 0, 0, 0.3)"
              listening={false}
            />
          )}
        </>
      )}

      {/* Building shadows — daytime only */}
      {sun.visible && shadows.map((pts, idx) => (
        <Line key={`shadow-${idx}`}
          points={pts}
          closed
          fill={`rgba(0,0,0,${0.15 + (1 - sun.length / 2) * 0.1})`}
          listening={false}
        />
      ))}

      {/* Point light sources with wall occlusion */}
      {lights.map(light => (
        <LightWithOcclusion
          key={`light-occ-${light.id}`}
          light={light}
          wallSegments={allWallSegments}
          darkness={ambient.darkness}
          polygons={polygons}
        />
      ))}

      {/* Window glow at night */}
      {windowGlows.map((glow, idx) => (
        <Rect
          key={`wglow-${idx}`}
          x={glow.x - glow.radius}
          y={glow.y - glow.radius}
          width={glow.radius * 2}
          height={glow.radius * 2}
          fillRadialGradientStartPoint={{ x: glow.radius, y: glow.radius }}
          fillRadialGradientEndPoint={{ x: glow.radius, y: glow.radius }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={glow.radius}
          fillRadialGradientColorStops={[
            0, `rgba(255, 200, 100, ${ambient.darkness * 0.6})`,
            0.4, `rgba(255, 180, 80, ${ambient.darkness * 0.3})`,
            1, 'rgba(255, 180, 80, 0)',
          ]}
          listening={false}
          globalCompositeOperation="lighter"
        />
      ))}

      {/* Global ambient overlay */}
      {ambient.darkness > 0 && (
        <Rect
          x={-totalWidth}
          y={-totalHeight}
          width={totalWidth * 3}
          height={totalHeight * 3}
          fill={ambient.color}
          listening={false}
        />
      )}
    </Layer>
  );
}
