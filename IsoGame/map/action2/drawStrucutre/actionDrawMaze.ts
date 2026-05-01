/**
 * actionDrawMaze.ts
 *
 * Generative maze built with Recursive Backtracker (DFS) from (x, y).
 *
 * Fixed params:
 *   wallThick  = 1 tile   lvl +3
 *   wallHeight = 3        (lvl offset above path)
 *   pathThick  = 3 tiles  lvl +0
 *   roomSizeMax = 9 tiles (placed at dead ends)
 *
 * Cell grid:
 *   Each logical cell occupies (pathThick + wallThick) = 4 tiles.
 *   The maze origin maps to tile (x, y) — top-left of cell (0, 0).
 *
 * Layout per cell (4×4 tile block):
 *   [W][W][W][W]    W = wall tile (1 thick on each edge)
 *   [W][P][P][P]    P = path tile (3×3 interior)
 *   [W][P][P][P]
 *   [W][P][P][P]
 *
 * When two adjacent cells are connected, the shared wall segment is carved.
 */

import { BaseTileActionConfig } from "../utils/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";

// ─── Fixed structural constants ───────────────────────────────────────────────

const WALL_THICK  = 2;
const WALL_HEIGHT = 6;
const PATH_THICK  = 4;
const ROOM_MAX    = 11;
const CELL_SIZE   = PATH_THICK + WALL_THICK; // 4 tiles per cell

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  PATH:  [90,  85,  78,  255] as number[],
  WALL:  [58,  54,  52,  255] as number[],
  ROOM:  [255, 0,  0,  255] as number[],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Dir = "N" | "S" | "E" | "W";

type Cell = {
  col: number;
  row: number;
  visited: boolean;
  // walls present on each side (true = wall exists)
  walls: Record<Dir, boolean>;
  isDeadEnd: boolean;
};

const OPPOSITE: Record<Dir, Dir> = { N: "S", S: "N", E: "W", W: "E" };

const DIR_DELTA: Record<Dir, { dc: number; dr: number }> = {
  N: { dc:  0, dr: -1 },
  S: { dc:  0, dr:  1 },
  E: { dc:  1, dr:  0 },
  W: { dc: -1, dr:  0 },
};

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
// Deterministic per (x, y) so the maze is stable and reproducible.

function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Maze generation ──────────────────────────────────────────────────────────

function buildCellGrid(cols: number, rows: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      col, row,
      visited: false,
      walls: { N: true, S: true, E: true, W: true },
      isDeadEnd: false,
    }))
  );
}

function carve(
  grid: Cell[][],
  col: number,
  row: number,
  cols: number,
  rows: number,
  rng: () => number,
): void {
  const cell = grid[row][col];
  cell.visited = true;

  const dirs = shuffle<Dir>(["N", "S", "E", "W"], rng);
  let carved = 0;

  for (const dir of dirs) {
    const { dc, dr } = DIR_DELTA[dir];
    const nc = col + dc;
    const nr = row + dr;

    if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
    const neighbour = grid[nr][nc];
    if (neighbour.visited) continue;

    // Remove wall between current and neighbour
    cell.walls[dir]                  = false;
    neighbour.walls[OPPOSITE[dir]]   = false;
    carved++;

    carve(grid, nc, nr, cols, rows, rng);
  }

  cell.isDeadEnd = carved === 0 || (carved === 1 && !grid[row][col].visited);
}

// ─── Tile coordinate helpers ──────────────────────────────────────────────────

/** Top-left tile of a cell's path interior (excludes the N and W wall) */
function cellOrigin(
  col: number, row: number,
  ox: number, oy: number,
): { x: number; y: number } {
  return {
    x: ox + col * CELL_SIZE + WALL_THICK,
    y: oy + row * CELL_SIZE + WALL_THICK,
  };
}

/** Centre tile of a cell's path interior */
function cellCenter(
  col: number, row: number,
  ox: number, oy: number,
): { x: number; y: number } {
  const o = cellOrigin(col, row, ox, oy);
  return {
    x: o.x + Math.floor(PATH_THICK / 2),
    y: o.y + Math.floor(PATH_THICK / 2),
  };
}

// ─── Command builders ─────────────────────────────────────────────────────────

function pushPath(b: TileCommandBuilder, x: number, y: number, size: number, color = C.PATH) {
  b.push(
    cmd.setFriseSquare({ x, y, size, shape: "square", isFrise: false }),
    cmd.colorSquare     ({ x, y, size, color }),
    cmd.clearItemSquare ({ x, y, size , shape: "square"}  ),
    cmd.colorNoiseShape ({ x, y, size, shape: "square", color, noiseAmp: 6 }),
    cmd.lvlAvgSquare   ({ x, y, size }),
    cmd.lvlAvgSquare   ({ x, y, size }),
    cmd.setFriseSquare({ x, y, size, shape: "square", isFrise: true }),
  );
}


function pushRoom(b: TileCommandBuilder, cx: number, cy: number, size: number) {
  b.push(
    cmd.setFriseSquare({x:cx, y:cy, size, shape: "square", isFrise: false }),
    cmd.colorSquare     ({ x: cx, y: cy, size, color: C.ROOM }),
    cmd.colorNoiseShape ({ x: cx, y: cy, size, shape: "square", color: C.ROOM, noiseAmp: 8 }),
    cmd.colorSmoothShape({ x: cx, y: cy, size, shape: "square", smoothRadius: 1, strength: 0.3 }),
    cmd.lvlAvgSquare   ({ x: cx, y: cy, size }),
    cmd.lvlAvgSquare   ({ x: cx, y: cy, size }),
    cmd.setFriseSquare({x:cx, y:cy, size, shape: "square", isFrise: true }),
  );
}

// ─── Main script ──────────────────────────────────────────────────────────────

export type MazeParams = {
  cols?:    number;   // number of cells wide  (default: 10)
  rows?:    number;   // number of cells tall  (default: 10)
  baseLvl?: number;
  seed?:    number;   // explicit seed (default: derived from x, y)
};

export function actionDrawMaze(
  x: number,
  y: number,
  { cols = 20, rows = 20, baseLvl = 0, seed }: MazeParams = {},
): BaseTileActionConfig[] {
  const b   = new TileCommandBuilder();
  const rng = makePrng(seed ?? (x * 73856093 ^ y * 19349663));

  // Total tile dimensions
  const totalW = cols * CELL_SIZE + WALL_THICK;
  const totalH = rows * CELL_SIZE + WALL_THICK;
  const cx     = x + Math.floor(totalW / 2);
  const cy     = y + Math.floor(totalH / 2);

  // ── 1. Flood fill the entire maze area with wall color + height
  b.push(
    // cmd.lvlFlatSquare ({ x: cx, y: cy, size: Math.max(totalW, totalH) / 2 }),
    // cmd.lvlUpSquare   ({ x: cx, y: cy, size: Math.max(totalW, totalH) / 2, lvl: baseLvl + WALL_HEIGHT }),
    cmd.colorSquare   ({ x: cx, y: cy, size: Math.max(totalW, totalH) / 2, color: C.WALL }),
  );

  // ── 2. Generate cell grid via DFS from (0, 0)
  const grid = buildCellGrid(cols, rows);
  carve(grid, 0, 0, cols, rows, rng);

  // ── 3. Carve paths — iterate every cell and paint its interior + open walls
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      const o    = cellOrigin(col, row, x, y);
      const c    = cellCenter(col, row, x, y);

      // Paint the cell's path interior (always)
      pushPath(b, c.x, c.y, Math.floor(PATH_THICK / 2));

      // Carve E passage (horizontal wall between this cell and right neighbour)
      if (!cell.walls.E && col + 1 < cols) {
        const passX = o.x + PATH_THICK;      // the wall column to the right
        const passY = o.y;
        pushPath(b, passX, passY + Math.floor(PATH_THICK / 2), Math.floor(PATH_THICK / 2));
      }

      // Carve S passage (vertical wall between this cell and bottom neighbour)
      if (!cell.walls.S && row + 1 < rows) {
        const passX = o.x;
        const passY = o.y + PATH_THICK;      // the wall row below
        pushPath(b, passX + Math.floor(PATH_THICK / 2), passY, Math.floor(PATH_THICK / 2));
      }

      // ── 4. Dead ends — place a room
      if (cell.isDeadEnd) {
        const maxR  = Math.floor(ROOM_MAX / 2);
        const roomR = Math.floor(rng() * (maxR - 1)) + 1; // 1..maxR
        pushRoom(b, c.x, c.y, roomR);
      }
    }
  }

  // ── 5. Outer border smoothing
  b.push(
    // cmd.lvlSmoothBorder({ x: cx, y: cy, size: Math.max(totalW, totalH), shape: "square", avgRadius: 3 }),
    // cmd.lvlAvgBorder   ({ x: cx, y: cy, size: Math.max(totalW, totalH) }),
    cmd.lvlUpSquare   ({ x: cx, y: cy, size: Math.max(totalW, totalH) / 2, lvl: baseLvl + WALL_HEIGHT }),

  );

  return b.build();
}
