/**
 * 2D Visibility Polygon — computes the area visible from a point given wall segments.
 * Used for light occlusion: light only illuminates what it can "see".
 */

export interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
}

interface RayHit {
  angle: number;
  x: number;
  y: number;
  dist: number;
}

// Cast a ray from origin in direction (dx,dy), find nearest intersection with segments
function raycast(
  ox: number, oy: number,
  angle: number,
  segments: Segment[],
  maxDist: number
): { x: number; y: number; dist: number } {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  let closestDist = maxDist;
  let closestX = ox + dx * maxDist;
  let closestY = oy + dy * maxDist;

  for (const seg of segments) {
    const ex = seg.x2 - seg.x1;
    const ey = seg.y2 - seg.y1;
    const fx = seg.x1 - ox;
    const fy = seg.y1 - oy;

    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-10) continue; // parallel

    const t1 = (fx * ey - fy * ex) / denom;  // distance along ray
    if (t1 < 0.001) continue; // behind ray

    const t2 = (fx * dy - fy * dx) / denom;  // position along segment (0-1)
    if (t2 < -0.001 || t2 > 1.001) continue; // outside segment (with tolerance for endpoints)

    if (t1 < closestDist) {
      closestDist = t1;
      closestX = ox + dx * t1;
      closestY = oy + dy * t1;
    }
  }

  return { x: closestX, y: closestY, dist: closestDist };
}

/**
 * Compute the visibility polygon from a light source.
 * Returns a flat array of [x1,y1, x2,y2, ...] forming the visible area polygon.
 */

export function computeVisibilityPolygon(
  lightX: number,
  lightY: number,
  segments: Segment[],
  maxRadius: number
): number[] {
  if (segments.length === 0) {
    // No walls — full circle visibility
    const pts: number[] = [];
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push(lightX + Math.cos(a) * maxRadius, lightY + Math.sin(a) * maxRadius);
    }
    return pts;
  }

  // Filter segments: only include those within range of the light
  const relevantSegments = segments.filter(seg => {
    const mx = (seg.x1 + seg.x2) / 2;
    const my = (seg.y1 + seg.y2) / 2;
    const dist = Math.sqrt((mx - lightX) ** 2 + (my - lightY) ** 2);
    // Include segments within light radius plus some margin
    return dist < maxRadius * 1.5;
  });

  if (relevantSegments.length === 0) {
    const pts: number[] = [];
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push(lightX + Math.cos(a) * maxRadius, lightY + Math.sin(a) * maxRadius);
    }
    return pts;
  }

  // Collect unique endpoints
  const pointSet = new Set<string>();
  const uniquePoints: { x: number; y: number }[] = [];
  for (const seg of relevantSegments) {
    const k1 = `${Math.round(seg.x1)},${Math.round(seg.y1)}`;
    const k2 = `${Math.round(seg.x2)},${Math.round(seg.y2)}`;
    if (!pointSet.has(k1)) { pointSet.add(k1); uniquePoints.push({ x: seg.x1, y: seg.y1 }); }
    if (!pointSet.has(k2)) { pointSet.add(k2); uniquePoints.push({ x: seg.x2, y: seg.y2 }); }
  }

  // Cast rays to each endpoint with small angular offsets
  const angles: number[] = [];
  const epsilon = 0.0001;
  for (const pt of uniquePoints) {
    const a = Math.atan2(pt.y - lightY, pt.x - lightX);
    angles.push(a - epsilon, a, a + epsilon);
  }

  // Circle rays for smooth edges in open areas
  const circleRays = 72;
  for (let i = 0; i < circleRays; i++) {
    angles.push((i / circleRays) * Math.PI * 2);
  }

  // Cast rays and collect hits
  const hits: RayHit[] = [];
  for (const angle of angles) {
    const hit = raycast(lightX, lightY, angle, relevantSegments, maxRadius);
    hits.push({ angle, x: hit.x, y: hit.y, dist: hit.dist });
  }

  // Sort by angle
  hits.sort((a, b) => a.angle - b.angle);

  // Remove duplicate angles (keep closest)
  const filtered: RayHit[] = [];
  for (let i = 0; i < hits.length; i++) {
    if (filtered.length === 0 || Math.abs(hits[i].angle - filtered[filtered.length - 1].angle) > 1e-8) {
      filtered.push(hits[i]);
    } else if (hits[i].dist < filtered[filtered.length - 1].dist) {
      filtered[filtered.length - 1] = hits[i];
    }
  }

  // Build polygon
  const pts: number[] = [];
  for (const hit of filtered) {
    pts.push(hit.x, hit.y);
  }

  return pts;
}

/**
 * Extract wall segments from a polygon element, excluding openings.
 * Returns segments for the outer walls (with gaps for doors/windows).
 */
export function getWallSegments(
  points: number[],
  openings: Array<{ edgeIndex: number; position: number; width: number; type: string; doorOpenAngle?: number; doorHinge?: string; doorSwing?: string }>,
  innerWalls: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  wallsBlockLight: boolean = true
): Segment[] {
  const segments: Segment[] = [];
  const numVerts = points.length / 2;

  // Outer walls — skip entirely if glass walls (light passes through)
  if (wallsBlockLight) {
  for (let i = 0; i < numVerts; i++) {
    const nextI = (i + 1) % numVerts;
    const x1 = points[i * 2];
    const y1 = points[i * 2 + 1];
    const x2 = points[nextI * 2];
    const y2 = points[nextI * 2 + 1];

    // Find openings on this edge
    const edgeOpenings = openings
      .filter(o => o.edgeIndex === i)
      .sort((a, b) => a.position - b.position);

    if (edgeOpenings.length === 0) {
      segments.push({ x1, y1, x2, y2 });
    } else {
      const edgeLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const dx = (x2 - x1) / edgeLen;
      const dy = (y2 - y1) / edgeLen;
      let cursor = 0;

      for (const opening of edgeOpenings) {
        const halfW = opening.width / 2;
        const openStart = Math.max(0, opening.position * edgeLen - halfW);
        const openEnd = Math.min(edgeLen, opening.position * edgeLen + halfW);

        // Wall segment before opening
        if (openStart > cursor + 1) {
          segments.push({
            x1: x1 + dx * cursor, y1: y1 + dy * cursor,
            x2: x1 + dx * openStart, y2: y1 + dy * openStart,
          });
        }

        // Windows let light through (glass) — no wall segment added

        // Doors: add the door panel as a blocking segment at its current open angle
        if (opening.type === 'door') {
          const openAngle = ((opening.doorOpenAngle ?? 45) * Math.PI) / 180;
          const hinge = opening.doorHinge || 'left';
          const swing = opening.doorSwing || 'inward';
          const doorLen = opening.width;

          // Wall normal — perpendicular to edge
          const normalSign = swing === 'outward' ? -1 : 1;
          const nx = -dy * normalSign;
          const ny = dx * normalSign;

          // Hinge position on the wall
          const hingePos = hinge === 'left' ? openStart : openEnd;
          const hingeX = x1 + dx * hingePos;
          const hingeY = y1 + dy * hingePos;

          // Direction along wall from hinge
          const wallDirX = hinge === 'left' ? dx : -dx;
          const wallDirY = hinge === 'left' ? dy : -dy;

          // Rotate by open angle toward interior
          const cosA = Math.cos(openAngle);
          const sinA = Math.sin(openAngle);
          const doorDirX = wallDirX * cosA + nx * sinA;
          const doorDirY = wallDirY * cosA + ny * sinA;

          // Door panel segment
          segments.push({
            x1: hingeX,
            y1: hingeY,
            x2: hingeX + doorDirX * doorLen,
            y2: hingeY + doorDirY * doorLen,
          });
        }

        cursor = openEnd;
      }

      // Wall segment after last opening
      if (cursor < edgeLen - 1) {
        segments.push({
          x1: x1 + dx * cursor, y1: y1 + dy * cursor,
          x2, y2,
        });
      }
    }
  }
  } // end if (wallsBlockLight)

  // Inner walls always block light regardless of glass wall setting
  for (const wall of innerWalls) {
    segments.push({ x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 });
  }

  return segments;
}

/**
 * Transform a normalized convex hull [0,1] to world coordinates.
 * Applies scale, flip, rotation (around element center), and translation.
 */
export function transformHull(
  hull: number[],
  el: { x: number; y: number; width: number; height: number; rotation: number; flipX: boolean; flipY: boolean },
  cellSize: number
): number[] {
  const pixelW = el.width * cellSize;
  const pixelH = el.height * cellSize;
  const centerX = el.x + pixelW / 2;
  const centerY = el.y + pixelH / 2;

  const angle = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const result: number[] = [];
  for (let i = 0; i < hull.length; i += 2) {
    const nx = hull[i];
    const ny = hull[i + 1];

    // Scale and center at origin
    let sx = (nx - 0.5) * pixelW;
    let sy = (ny - 0.5) * pixelH;

    // Apply flip
    if (el.flipX) sx = -sx;
    if (el.flipY) sy = -sy;

    // Rotate around origin
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;

    // Translate to world position
    result.push(centerX + rx, centerY + ry);
  }

  return result;
}
