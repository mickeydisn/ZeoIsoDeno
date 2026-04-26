/**
 * geometry.ts
 * Low-level coordinate helpers shared by withShape and withLine.
 * All functions are pure — no tile or context access.
 */

export type Point = { x: number; y: number };

export type Shape = "square" | "diamond" | "circle";

// ─── Shape iterators ──────────────────────────────────────────────────────────

/**
 * Yields every integer point that belongs to the given shape,
 * centred on (cx, cy) with the given radius/size.
 *
 * size = half-extent (radius for circle/diamond, half-side for square).
 * A size of 1 always yields at least the centre tile.
 */
export function* iterShape(
  cx: number,
  cy: number,
  size: number,
  shape: Shape,
): Generator<Point> {
  const r = Math.max(0, Math.floor(size));

  switch (shape) {
    case "square": {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          yield { x: cx + dx, y: cy + dy };
        }
      }
      break;
    }

    case "diamond": {
      // Manhattan distance ≤ r
      for (let dy = -r; dy <= r; dy++) {
        const xSpan = r - Math.abs(dy);
        for (let dx = -xSpan; dx <= xSpan; dx++) {
          yield { x: cx + dx, y: cy + dy };
        }
      }
      break;
    }

    case "circle": {
      // Euclidean distance ≤ r  (pixel-circle / disc)
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            yield { x: cx + dx, y: cy + dy };
          }
        }
      }
      break;
    }
  }
}

// ─── Bresenham line ───────────────────────────────────────────────────────────

/**
 * Yields every integer point along the line from (x0,y0) to (x1,y1)
 * using Bresenham's algorithm.
 */
export function* bresenham(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Generator<Point> {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  let x = x0;
  let y = y0;

  while (true) {
    yield { x, y };
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

// ─── Interpolation helpers ────────────────────────────────────────────────────

/** Linear interpolation between a and b, t ∈ [0, 1] */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Projects point (px, py) onto the axis defined by the vector from
 * (ax, ay) to (bx, by) and returns t ∈ [0, 1] (clamped).
 * Used by lvlRamp to assign a gradient value to each tile.
 */
export function projectOntoAxis(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq === 0) return 0;
  const t = ((px - ax) * vx + (py - ay) * vy) / lenSq;
  return Math.min(1, Math.max(0, t));
}