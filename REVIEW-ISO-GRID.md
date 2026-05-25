# REVIEW — Isometric Grid Hit Detection: Depth Sorting & Height Impact

## 1. Coordinate Systems & Axis Conventions

### 2D Screen Space
- Origin: top-left of canvas
- **X-axis**: increases rightward (screen pixels)
- **Y-axis**: increases downward (screen pixels)

### 3D Tile Space (Grid coordinates)
- **X-axis** (tile col): increases to the **right** in the isometric projection (along the `[+X, +X]` direction → SE on screen)
- **Y-axis** (tile row): increases **down-right** (along `[-X, +X]` → SW on screen) — actually in the transformation it maps to `[-32, +16]`
- **Z-axis** (height/level): increases **upward** on screen (screen-Y decreases)

### Isometric Projection Matrix

The core 3D→2D projection is defined in `IsometricProjector.translatePoint()` (line 101–118):

```
transformation[0] = [32 * SCALE_SIZE,   16 * SCALE_SIZE]   // X-axis map
transformation[1] = [-32 * SCALE_SIZE,  16 * SCALE_SIZE]   // Y-axis map
```

For a tile `(tx, ty, tz)`:
```
screenX = originX + 32·(tx - ty)                          // tile X-Y diamond
screenY = originY - 16·(tx + ty) + 39 · tz / SCALE_MOD    // Z up = screen-Y down
```

This is a standard **2:1 isometric** projection:
- A tile is a diamond 64px wide × 32px tall (at SCALE_SIZE=1)
- `dx = 32·(tx - ty)` — NE/SW axis
- `dy = 16·(tx + ty)` — NW/SE axis (inverted because screen-Y grows downward)

---

## 2. The Click Detection Algorithm

The entry point is `screenToTileWithHeight()` in `IsometricProjector.ts` (lines 269–312).

### Step 1 — Pre-compute scale factors

```typescript
const lvlfactor = LVL_Z_SCALE_FACTOR * SCALE_SIZE / SCALE_MOD;   // = (1/3) * 1 / 1 ≈ 0.333
const sx = 32 * SCALE_SIZE;                                       // = 32
const ratio = ISO_LVL_SCALE / SCALE_MOD / (2 * 16 * SCALE_SIZE); // = 39/1/32 ≈ 1.21875
```

### Step 2 — Collect candidate tiles

Iterates **all** tiles in the visible `TilesMatrix` (a 40×40 = 1600 tile grid). For each tile:

1. Computes the **relative Z** (height offset from the visible area average):
   ```typescript
   z = (metaTile.lvl - tilesMatrix.avgLvl) * lvlfactor
   ```
   This normalizes tile heights so the "visual center" of the grid sits at Z=0.

2. **X-axis pre-filter**: checks if the mouse's screen-X is within ±32px of the tile's diamond center X (fast rejection for tiles clearly off-screen horizontally).

3. Collects the tile as a `PointIso(tx, ty, z)` candidate.

### Step 3 — Depth sort (Painter's algorithm)

```typescript
candidates.sort((a, b) => {
    const da = a.x + a.y - 2 * a.z * ratio;
    const db = b.x + b.y - 2 * b.z * ratio;
    return db - da;  // descending → larger depth first
});
```

**Depth formula**: `d = x + y - 2·z·ratio`

- `x + y` — the "grid distance from the camera" (higher = further away along the SE-NW axis)
- `-2·z·ratio` — elevation correction: elevated tiles have **lower** depth → sorted **later** (behind in iteration)

**Sort order**: descending (`db - da`). Tiles with larger `d` are iterated first (i.e., treated as "in front").

### Step 4 — Diamond hit test (front-to-back)

For each tile in sorted order (front-most first), calls `_isPointInTileFace()` which:

1. Computes the 4 projected screen corners of the **top face** of the tile at `(tx, ty, z)`
2. Checks if the mouse point falls inside the diamond (rhombus) formed by those 4 corners:
   ```typescript
   // Normalized coordinates relative to diamond center
   const u = (screenX - cx) / halfW;
   const v = (screenY - cy) / halfH;
   return Math.abs(u) + Math.abs(v) <= 1.0;  // Standard rhombus test
   ```

Returns the **first** tile whose top face contains the mouse point.

---

## 3. Why Height Breaks the Algorithm

### The Core Problem: Depth Sort ≠ Visual Overlap

Consider two tiles along the same isometric diagonal:

| Tile | X | Y | Z (height) | x+y | z·ratio | depth d |
|------|---|---|------------|------|---------|---------|
| A    | 5 | 5 | 3 (raised)  | 10   | 3×1.21875 = 3.656 | 6.344 |
| B    | 6 | 6 | 0 (ground)  | 12   | 0      | 12.0   |

**Sort order**: `db - da` → B (12.0) > A (6.344), so **B is tested first**.

But visually:

```
      /\
     /  \     ← A's top face (elevated, shifted UP on screen)
    /\  /
   /  \/     ← B's top face (ground level, further down-right)
  /  /\
 /  /  \
```

Because tile A is elevated, its top face is shifted upward on screen by `39·z_level` pixels ≈ 117 pixels (for lvl=3). This means A's elevated top face can **overlap B's visual area** — especially at the front-left edge of B's diamond where A's projection intrudes.

The depth formula `d = x + y - 2·z·ratio` does **not** have enough Z-weight to compensate:

- The Z contribution per level is only `2 × ratio = 2 × 1.21875 ≈ 2.44` depth units
- But moving one tile further away along the diagonal adds **1.0** to `x + y`
- So one elevation level lifts ≈2.44 depth units worth of "visual forwardness"

Wait — that actually seems like it **should** be enough? Let me recalculate:

For tile A (z=3 levels above average):
- z = 3 × (1/3) = 1.0 (after lvlfactor)
- depth contribution of Z: -2 × 1.0 × 1.21875 = -2.4375

For tile B (z=0):
- depth contribution of Z: 0

If A is at (5,5) and B is at (6,6):
- depth(A) = 10 - 2.4375 = 7.5625
- depth(B) = 12

B still sorts first (12 > 7.5625). So the elevated tile at (5,5) is tested **after** the ground tile at (6,6). If the mouse is on the visual overlap area, B wins.

### The Real Failure Mode

The depth formula assumes the visual "front" ordering is monotonic in `x + y - (z adjustment)`. But **isometric diamond overlap is not strictly monotonic** when heights vary:

1. The painter's algorithm for **rendering** draws back-to-front: `depth = x + y + z·const` (positive Z). This works because the renderer draws deeper tiles first, and elevated tiles are drawn later (on top).

2. For **hit detection front-to-back**, we need the **reverse** ordering: test tiles that visually appear on top first. But the correct reverse ordering requires accounting for the fact that an elevated tile's diamond is physically higher on screen, making it visually "in front" of ground tiles even when `x+y` is smaller.

3. The Z-weight in the formula `2·z·ratio` is **incorrectly calibrated**. The visual shift of an elevated tile's top face is:
   - Screen-Y offset = `39 · z_level / SCALE_MOD` pixels (from `translatePoint`)
   - This needs to be converted to "depth units" by comparing to the screen-Y change per depth step

   When moving one step along the diagonal (x+1, y+1), screen-Y changes by `16·2 = 32` pixels. One unit of Z changes screen-Y by `39` pixels (upward). So the depth-equivalent of one Z-level should be approximately `39/32 ≈ 1.21875`... which IS exactly the `ratio` value.

   **But this is only correct if the visual overlap is strictly Y-monotonic** — i.e., if "higher on screen = in front". The diamond shape means two tiles at the same screen-Y can overlap. The depth formula doesn't account for this.

### Side Walls Not Tested

The `_isPointInTileFace()` method only tests the **top face** (diamond) of the tile. When a tile is elevated, its exposed side walls are clickable (visible on screen) but are **never** valid targets. This means:

- If the mouse is on the front-left side wall of an elevated tile, **no tile** is selected (or the wrong tile behind it).
- The commented-out code at lines 197-204 shows this was known but disabled:
  ```typescript
  // Also accept clicks on the visible side walls (below the top face).
  // const wallHeight = halfH;
  // if (Math.abs(u) <= 1.0 && v < 1.0) return true;
  ```

---

## 4. Detailed Algorithm Walkthrough (with Bug)

Let's trace a concrete failure:

**Scenario**: A tall tile at (10, 10, lvl=5) and a ground tile at (11, 11, lvl=2). The grid avgLvl ≈ 3.

1. **Normalized Z**: 
   - Tile A: z = (5-3) × 1/3 = 0.667
   - Tile B: z = (2-3) × 1/3 = -0.333 (below average)

2. **Depth**:
   - depth(A) = 20 - 2 × 0.667 × 1.21875 = 20 - 1.625 = 18.375
   - depth(B) = 22 - 2 × (-0.333) × 1.21875 = 22 + 0.8125 = 22.8125

3. Sort: B (22.8) first, then A (18.4)

4. First test: **B** — its diamond is tested. If the mouse is on the elevated portion of A that overlaps B's visual area, B is hit (wrong).

5. A is never tested (B already "claimed" the click).

### Why "common" cases work

When all tiles have the same height (flat grid), `z=0` for all tiles, depth reduces to `x+y`, which is exactly the painter's algorithm ordering. Tiles with higher `x+y` are "further back" and sorted first, which is correct for rendering and hit detection.

When elevation differences are small (1–2 levels), the Z-adjustment of ~1.6–3.2 depth units is often enough to compensate. But with larger elevation differences (>3 levels), the compensating Z-adjustment may not be sufficient, especially along diagonals where `x+y` changes by 1–2.

---

## 5. Numerical Analysis of the Depth Ratio

The `ratio` constant:

```typescript
const ratio = ISO_LVL_SCALE / SCALE_MOD / (2 * 16 * SCALE_SIZE);
// = 39 / 1 / 32 = 1.21875
```

**Interpretation**: Each unit of `z` contributes approximately `2 × 1.21875 = 2.4375` to the depth value, equivalent to moving `2.4375` steps along the `x+y` diagonal.

**Is this correct?** Let's verify:

- Moving one tile along x+y (e.g., x+1, y+1): screen-Y changes by `16 × 2 = 32` pixels downward (visually further away).
- One unit of Z: screen-Y changes by `39` pixels upward (visually closer).

So Z has `39/32 ≈ 1.22` times the visual impact of one diagonal step. The formula uses `ratio = 39/32 = 1.21875` and applies it as `2 × z × ratio`, where the factor of 2 comes from the depth formula being `x + y` (both x and y contribute to screen-Y change).

Wait: moving one step in x (x+1): screen-Y changes by 16px. Moving one step in y (y+1): screen-Y changes by 16px. So `x+y` change of 1 → screen-Y change of 16px. And z change of 1 → screen-Y change of 39px. So the Z-to-(x+y) ratio should be `39/16 ≈ 2.4375`, not `39/32`.

But the code has `ratio = 39/32 = 1.21875` and applies it as `2 × z × ratio = 2 × z × 1.21875 = z × 2.4375`. So the effective correction IS `z × 2.4375`, which is `39/16`. **That part is mathematically correct**.

The problem is not the Z scale per se, but the **diamond shape overlap geometry**: the depth ordering using simple `x + y - 2·z·ratio` creates a total order, but the isometric projection only guarantees a **partial order** visually. Two tiles with equal depth can still visually overlap in complex ways, and the sort order between them can be wrong.

---

## 6. Summary of Root Causes

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Depth sort uses total order but diamond overlap is a partial order** | Two tiles with close `x+y` but different Z can sort incorrectly for hit detection |
| 2 | **Z-weight may be insufficient for large height differences** | 3+ level differences cause incorrect front-to-back ordering |
| 3 | **Side walls not tested** | Clicks on visible side faces of elevated tiles miss their intended tile |
| 4 | **Full matrix iteration is O(n²)** | 1600 tiles checked every mouse move (mitigated by 16ms throttle) |
| 5 | **X pre-filter only checks center-X** | Doesn't account for diamond's Y extent, missing some optimizations |

## 7. Potential Fix Categories

### A. Better Depth Ordering (front-to-back)
Instead of the global depth sort, implement a **proper painter's algorithm** for hit detection:
- Sort tiles by `screenY` of the diamond center (lower center = further away on screen)
- Then test tiles with **higher** screen-Y first (closer to bottom = visually in front)

This correctly handles: an elevated tile's diamond center is shifted upward → has lower screen-Y → tested later in a Y-sort. But this still has corner cases.

### B. Analytical Intersection (most robust)
Solve the inverse projection analytically:
1. Compute the mouse position in 3D space by iterating candidate Z values
2. Find which tile's diamond (at its actual Z) contains the screen point
3. Use the adjacent tiles' Z values to resolve ambiguous cases

### C. Per-pixel depth buffer
During rendering, store the tile ID at each pixel (or a depth value). Then look up the tile by reading the buffer at the mouse position.

### D. Incremental refinement
Use the current `screenToTile()` with Z=0 to get the base tile, then check the 9 neighboring tiles (including their Z-adjusted positions) and pick the one whose diamond actually contains the point. This is O(1) instead of O(n²) and avoids the deep sort issue entirely by doing a local search.

---

## 8. Code Structure Reference

```
mapState.ts           → setMouseScreen() calls isoProject.screenToTileWithHeight()
  ↓
IsometricProjector.ts → screenToTileWithHeight() — main detection algorithm
  ├── screenToTile()  — simple inverse projection (ignores height)
  ├── _isPointInTileFace() — diamond hit test for top face
  └── getNESWDiagonalCoords() — diagonal helper (unused in detection)
```

Key constants:
- `ISO_LVL_SCALE = 39` — Z-to-Pixel scale (1 level = 39 screen pixels of vertical shift)
- `LVL_Z_SCALE_FACTOR = 1/3` — Normalization factor for relative Z computation
- `ratio ≈ 1.21875` — Depth formula Z-weight
- Diamond half-extents: `halfW = 32`, `halfH = 16` (at SCALE_SIZE=1)

---

## 9. Candidate Selection Loop (Performance Note)

```typescript
for (let ty = 0; ty < tilesMatrix.size; ty++) {
    for (let tx = 0; tx < tilesMatrix.size; tx++) {
        // ... 1600 iterations
    }
}
```

This double loop iterates 1600 tiles every ~16ms (throttled in `setMouseScreen`). With the depth sort (O(n log n)) and diamond tests, this is manageable for 1600 items but would degrade with larger grids. The X pre-filter (`Math.abs(screenX - cx) > sx`) roughly halves the candidate count but is imprecise.

---

*Review generated from code analysis on 2026-05-25.*