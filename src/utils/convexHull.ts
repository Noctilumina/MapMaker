/**
 * Computes a convex hull of non-transparent pixels in an image.
 * Used to determine light-blocking occlusion geometry for tile elements.
 *
 * Returns normalized coordinates [0, 1] where (0,0) = top-left, (1,1) = bottom-right.
 */

interface Point {
  x: number;
  y: number;
}

/**
 * Compute the signed area of a triangle formed by three points.
 * Positive = counter-clockwise, negative = clockwise, zero = collinear.
 */
function cross(O: Point, A: Point, B: Point): number {
  return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
}

/**
 * Graham Scan convex hull algorithm.
 * Inputs: array of points in normalized [0,1] space.
 * Returns: array of hull vertices in counter-clockwise order.
 */
function grahamScan(points: Point[]): Point[] {
  if (points.length < 3) return [];

  // Find the pivot: bottom-most point, ties broken by leftmost
  let pivot = points[0];
  for (const p of points) {
    if (p.y > pivot.y || (p.y === pivot.y && p.x < pivot.x)) {
      pivot = p;
    }
  }

  // Sort points by polar angle relative to pivot
  const sorted = points
    .filter((p) => p !== pivot)
    .sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
      if (angleA !== angleB) return angleA - angleB;
      // Tie-break by distance (closer first)
      const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2;
      const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2;
      return distA - distB;
    });

  // Build hull using a stack
  const hull: Point[] = [pivot];
  for (const p of sorted) {
    // Remove points that make a right turn (cross product <= 0)
    while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
      hull.pop();
    }
    hull.push(p);
  }

  return hull;
}

/**
 * Load an image and return it as an HTML Image element.
 * Wraps in a Promise that rejects on load error.
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Compute the convex hull of non-transparent pixels in an image.
 *
 * @param src - Image source (URL or data URI)
 * @returns Promise resolving to a flat [x0,y0,x1,y1,...] array of normalized hull vertices,
 *          or [] if the image has fewer than 3 non-transparent pixels.
 */
export async function computeOcclusionHull(src: string): Promise<number[]> {
  try {
    const img = await loadImage(src);

    // Create a 64x64 canvas for sampling
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(64, 64);
      ctx = canvas.getContext('2d')!;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      ctx = canvas.getContext('2d')!;
    }

    // Draw the image scaled to 64x64
    ctx.drawImage(img, 0, 0, 64, 64);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;

    // Collect all pixel centers where alpha > 64 (roughly 25% opacity)
    const points: Point[] = [];
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const alpha = data[(y * 64 + x) * 4 + 3];
        if (alpha > 64) {
          points.push({
            x: (x + 0.5) / 64,  // Normalized [0, 1]
            y: (y + 0.5) / 64,
          });
        }
      }
    }

    if (points.length < 3) {
      return [];
    }

    // Compute convex hull
    const hull = grahamScan(points);

    // Flatten to [x0,y0,x1,y1,...]
    const result: number[] = [];
    for (const point of hull) {
      result.push(point.x, point.y);
    }

    return result;
  } catch (error) {
    // Silently fail — asset occlusion is optional
    console.warn('Failed to compute occlusion hull:', error);
    return [];
  }
}
