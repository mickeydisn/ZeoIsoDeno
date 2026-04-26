/**
 * compass.ts
 * Named coordinate helpers for structured placement in action scripts.
 * Pure functions — no tile or context access.
 */

export type Point = { x: number; y: number };

export type CompassDir = "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW";

export type CompassPoints = Record<CompassDir | "C", Point>;

/**
 * Returns named compass points at a given radius around (cx, cy).
 *
 * @example
 * const c = compass(x, y, 2);
 * b.at(c.E).block();
 * b.at(c.NW).addItem("fence_NW#...");
 */
export function compass(cx: number, cy: number, radius: number): CompassPoints {
  const r = radius;
  return {
    C:  { x: cx,     y: cy     },
    N:  { x: cx,     y: cy - r },
    S:  { x: cx,     y: cy + r },
    E:  { x: cx + r, y: cy     },
    W:  { x: cx - r, y: cy     },
    NE: { x: cx + r, y: cy - r },
    NW: { x: cx - r, y: cy - r },
    SE: { x: cx + r, y: cy + r },
    SW: { x: cx - r, y: cy + r },
  };
}

/**
 * Returns all 8 compass points at a given radius (excludes centre).
 */
export function ring(cx: number, cy: number, radius: number): Point[] {
  const c = compass(cx, cy, radius);
  return [c.N, c.NE, c.E, c.SE, c.S, c.SW, c.W, c.NW];
}

/**
 * Returns only the 4 cardinal points (N, E, S, W) at a given radius.
 */
export function cardinals(cx: number, cy: number, radius: number): Point[] {
  const c = compass(cx, cy, radius);
  return [c.N, c.E, c.S, c.W];
}

/**
 * Returns only the 4 diagonal points (NE, SE, SW, NW) at a given radius.
 */
export function diagonals(cx: number, cy: number, radius: number): Point[] {
  const c = compass(cx, cy, radius);
  return [c.NE, c.SE, c.SW, c.NW];
}

/**
 * Returns the compass direction string for a given offset (dx, dy).
 * Useful when iterating known offsets and needing a label.
 */
export function dirFromOffset(dx: number, dy: number): CompassDir | null {
  const map: [number, number, CompassDir][] = [
    [ 0, -1, "N"], [ 1, -1, "NE"], [ 1,  0, "E"], [ 1,  1, "SE"],
    [ 0,  1, "S"], [-1,  1, "SW"], [-1,  0, "W"], [-1, -1, "NW"],
  ];
  const norm = (v: number) => v === 0 ? 0 : v > 0 ? 1 : -1;
  const nx = norm(dx), ny = norm(dy);
  return map.find(([x, y]) => x === nx && y === ny)?.[2] ?? null;
}
