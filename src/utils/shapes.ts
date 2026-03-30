/**
 * Generate points for predefined polygon shapes.
 * All return flat arrays [x1,y1, x2,y2, ...] centered at (cx, cy).
 */

export function generateCircle(cx: number, cy: number, radius: number, segments = 24): number[] {
  const points: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    points.push(
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
    );
  }
  return points;
}

export function generateRect(cx: number, cy: number, width: number, height: number): number[] {
  const hw = width / 2;
  const hh = height / 2;
  return [
    cx - hw, cy - hh,
    cx + hw, cy - hh,
    cx + hw, cy + hh,
    cx - hw, cy + hh,
  ];
}

export function generateHexagon(cx: number, cy: number, radius: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    points.push(
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
    );
  }
  return points;
}
