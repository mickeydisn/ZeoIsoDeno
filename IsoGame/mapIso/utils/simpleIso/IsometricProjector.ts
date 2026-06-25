// --- 1. Copied Point Class ---

import { TilesMatrix } from "../../../map/object/tilesMatrix.ts";

// Configure the main LVL Diff factor display on the grid ( Transform real Lvl Diff to Pixel Diff)
const ISO_LVL_SCALE = 39;
const LVL_Z_SCALE_FACTOR = 1 / 3;

export interface IPointIso {
  x: number;
  y: number;
  z: number;
}
/**
 * Represents a 3D point (x, y, z) in the isometric space.
 */
export class PointIso implements IPointIso {
  x: number;
  y: number;
  z: number;

  static ORIGIN = new PointIso(0, 0, 0);

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /** Translate a point from a given dx, dy, and dz */
  translate(dx: number = 0, dy: number = 0, dz: number = 0): PointIso {
    return new PointIso(this.x + dx, this.y + dy, this.z + dz);
  }

  depth(): number {
    return this.x + this.y - 2 * this.z;
  }
}

// --- 2. Configuration Defaults ---

const IsometricConfDefaults = {
  mapGridTileScale: 1,
  mapGridMod: 1,
  ISO_LVL_SCALE: 39,
  originX: 0,
  originY: 660,
  offsetX: 0,
  offsetY: 0,
};

export type IsometricConf = typeof IsometricConfDefaults;

// --- 3. Isometric Projector Class ---

export class IsometricProjector {
  public conf: IsometricConf;
  private transformation!: number[][];

  constructor(overrides: Partial<IsometricConf> = {}) {
    this.conf = { ...IsometricConfDefaults, ...overrides };
    this.updateConf();
  }

  updateConf(overrides: Partial<IsometricConf> = {}) {
    this.conf = { ...this.conf, ...overrides };
    this.transformation = [
      [32 * this.conf.mapGridTileScale, 16 * this.conf.mapGridTileScale],
      [-32 * this.conf.mapGridTileScale, 16 * this.conf.mapGridTileScale],
    ];
  }

  translatePoint(_point: PointIso): PointIso {
    const point = _point.translate(-this.conf.offsetX, -this.conf.offsetY, 0);
    const xMap = new PointIso(
      point.x * this.transformation[0][0],
      point.x * this.transformation[0][1],
    );

    const yMap = new PointIso(
      point.y * this.transformation[1][0],
      point.y * this.transformation[1][1],
    );

    const x = this.conf.originX + xMap.x + yMap.x;
    const y = this.conf.originY - xMap.y - yMap.y -
      point.z * ISO_LVL_SCALE / this.conf.mapGridMod;

    return new PointIso(x, y);
  }

  tileToScreen(isoPoint: PointIso): { x: number; y: number } {
    const point = this.translatePoint(isoPoint);
    return { x: point.x, y: point.y };
  }

  screenToTile(
    screenX: number,
    screenY: number,
    tileZ: number = 0,
  ): PointIso | null {
    const { originX, originY, offsetX, offsetY, mapGridTileScale, mapGridMod } =
      this.conf;

    const sx = 32 * mapGridTileScale;
    const sy = 16 * mapGridTileScale;

    const adjustedDx = screenX - originX;
    const adjustedDy = originY - screenY - (tileZ * ISO_LVL_SCALE / mapGridMod);

    const tileXRaw = (adjustedDx / sx + adjustedDy / sy) / 2;
    const tileYRaw = (adjustedDy / sy - adjustedDx / sx) / 2;

    const tileX = Math.floor(tileXRaw + offsetX);
    const tileY = Math.floor(tileYRaw + offsetY);

    return new PointIso(tileX, tileY, tileZ);
  }

  // Point-in-triangle test using barycentric coordinates
  private _pointInTriangle(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ): boolean {
    const v0x = cx - ax, v0y = cy - ay;
    const v1x = bx - ax, v1y = by - ay;
    const v2x = px - ax, v2y = py - ay;
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    return u >= 0 && v >= 0 && u + v <= 1;
  }

  /**
   * Tests if a screen point falls within the visible faces of a tile.
   * @param tile - The tile with normalized z (height offset from avg)
   * @param wallBottomZ - The normalized z at which the wall-bottom sits (e.g. neighbor's z, or 0 for ground)
   * @returns true if the point is on any visible part of this tile
   */
  private _isPointInTileFace(
    tile: PointIso,
    screenX: number,
    screenY: number,
    wallSEbottomZ?: number, // bottom z of SE wall (neighbor at ty-1's z, or undefined if same height)
    wallSWbottomZ?: number, // bottom z of SW wall (neighbor at tx-1's z, or undefined if same height)
  ): boolean {
    const { x: tx, y: ty, z } = tile;

    const top = this.translatePoint(new PointIso(tx, ty, z));
    const right = this.translatePoint(new PointIso(tx + 1, ty, z));
    const bottom = this.translatePoint(new PointIso(tx + 1, ty + 1, z));
    const left = this.translatePoint(new PointIso(tx, ty + 1, z));

    // Diamond center and half-extents (top face)
    const cx = (top.x + bottom.x) / 2;
    const botY = bottom.y;
    const halfW = (right.x - left.x) / 2;
    const cy = (top.y + botY) / 2;
    const halfH = (botY - top.y) / 2;

    const u = (screenX - cx) / halfW;
    const v = (screenY - cy) / halfH;

    // 1. Top face (diamond)
    if (Math.abs(u) + Math.abs(v) <= 1.0) return true;

    // 2. Side walls: when tile is higher than a neighbor, the wall is visible
    // The visible front walls are two parallelograms:
    //   SE wall: right→bottom→b_se→r_se  (neighbor at ty-1)
    //   SW wall: left→bottom→b_sw→l_sw  (neighbor at tx-1)
    // Each wall is split into 2 triangles for point-in-triangle test.

    if (wallSEbottomZ !== undefined && wallSEbottomZ < z) {
      const r0 = this.translatePoint(new PointIso(tx + 1, ty, wallSEbottomZ));
      const b0 = this.translatePoint(
        new PointIso(tx + 1, ty + 1, wallSEbottomZ),
      );
      if (
        this._pointInTriangle(
          screenX,
          screenY,
          right.x,
          right.y,
          bottom.x,
          bottom.y,
          b0.x,
          b0.y,
        ) ||
        this._pointInTriangle(
          screenX,
          screenY,
          right.x,
          right.y,
          b0.x,
          b0.y,
          r0.x,
          r0.y,
        )
      ) return true;
    }

    if (wallSWbottomZ !== undefined && wallSWbottomZ < z) {
      const b0 = this.translatePoint(
        new PointIso(tx + 1, ty + 1, wallSWbottomZ),
      );
      const l0 = this.translatePoint(new PointIso(tx, ty + 1, wallSWbottomZ));
      if (
        this._pointInTriangle(
          screenX,
          screenY,
          left.x,
          left.y,
          bottom.x,
          bottom.y,
          b0.x,
          b0.y,
        ) ||
        this._pointInTriangle(
          screenX,
          screenY,
          left.x,
          left.y,
          b0.x,
          b0.y,
          l0.x,
          l0.y,
        )
      ) return true;
    }

    return false;
  }

  getNESWDiagonalCoords(
    screenX: number,
    screenY: number,
    mapSize: number,
  ): PointIso[] {
    const coords: PointIso[] = [];

    const tile = this.screenToTile(screenX, screenY, 0);
    if (!tile) return coords;

    const xx = Math.round(tile.x);
    const yy = Math.round(tile.y);

    const diagConstant = xx - yy;

    const maxDx = (mapSize - 1) - xx;
    const minDx = -xx;
    const minDxGy = -yy;
    const maxDxGy = (mapSize - 1) - yy;
    const finalMinDx = Math.max(minDx, minDxGy);
    const finalMaxDx = Math.min(maxDx, maxDxGy);

    for (let dx = finalMinDx + 1; dx < finalMaxDx; dx++) {
      const gx = xx + dx;
      const gy = yy + dx;
      coords.push(new PointIso(gx, gy));
    }

    return coords;
  }

  screenToTileWithHeight(
    screenX: number,
    screenY: number,
    tilesMatrix: TilesMatrix,
  ): PointIso | null {
    const lvlfactor = LVL_Z_SCALE_FACTOR * this.conf.mapGridTileScale /
      this.conf.mapGridMod;

    const { originX, offsetX, offsetY, mapGridTileScale, mapGridMod } =
      this.conf;
    const sx = 32 * mapGridTileScale;
    const ratio = ISO_LVL_SCALE / mapGridMod / (2 * 16 * mapGridTileScale);

    interface TileCandidate {
      tile: PointIso;
      wallSEbottomZ: number; // normalized z of neighbor at (tx, ty-1)
      wallSWbottomZ: number; // normalized z of neighbor at (tx-1, ty)
    }

    const candidates: TileCandidate[] = [];
    for (let ty = 0; ty < tilesMatrix.size; ty++) {
      for (let tx = 0; tx < tilesMatrix.size; tx++) {
        const metaTile = tilesMatrix.tiles[tx][ty];
        const z = (metaTile.lvl - tilesMatrix.avgLvl) * lvlfactor;

        // Fast pre-filter on X
        const cx = originX + sx * ((tx - offsetX) - (ty - offsetY));
        if (Math.abs(screenX - cx) > sx) continue;

        // Compute neighbor z for wall tests
        // SE wall: visible when this tile is higher than ty-1 (Y neighbor)
        const zSE = ty > 0
          ? (tilesMatrix.tiles[tx][ty - 1].lvl - tilesMatrix.avgLvl) * lvlfactor
          : z;
        // SW wall: visible when this tile is higher than tx-1 (X neighbor)
        const zSW = tx > 0
          ? (tilesMatrix.tiles[tx - 1][ty].lvl - tilesMatrix.avgLvl) * lvlfactor
          : z;

        candidates.push({
          tile: new PointIso(tx, ty, z),
          wallSEbottomZ: zSE,
          wallSWbottomZ: zSW,
        });
      }
    }
    // Sort front-to-back: lower depth = visually closer to viewer
    // depth = x + y - 2·z·ratio
    candidates.sort((a, b) => {
      const da = a.tile.x + a.tile.y - 2 * a.tile.z * ratio;
      const db = b.tile.x + b.tile.y - 2 * b.tile.z * ratio;
      return da - db;
    });

    for (const c of candidates) {
      if (
        this._isPointInTileFace(
          c.tile,
          screenX,
          screenY,
          c.wallSEbottomZ,
          c.wallSWbottomZ,
        )
      ) {
        return c.tile;
      }
    }

    return null;
  }
}
