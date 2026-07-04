import { Tile } from "./tile.ts";
import { RawTile } from "@iso-game/map/object/tileRaw.ts";

export const CHUNK_SIZE = 32;

export type BaseTile = {
  x: number;
  y: number;
  lvl: number;
};

export class BaseChunk<ITile extends BaseTile> {
  size: number = CHUNK_SIZE;
  cx: number;
  cy: number;
  matrix: ITile[][];
  loaded: boolean = false;

  get x(): number {
    return this.cx * this.size;
  }
  get y(): number {
    return this.cy * this.size;
  }

  constructor(cx: number, cy: number) {
    this.cx = cx;
    this.cy = cy;
    this.matrix = Array.from(
      { length: this.size },
      () => Array(this.size).fill(null),
    );
  }

  get(x: number, y: number): ITile {
    return this.matrix[x][y];
  }
}

export class ChunkGen extends BaseChunk<Tile> {
  sizeFull: number;
  matrixGen: Tile[][];
  sizeBorder: number = 2;

  constructor(cx: number, cy: number) {
    super(cx, cy);

    this.sizeFull = this.size + 2 * this.sizeBorder;
    this.matrixGen = Array.from(
      { length: this.sizeFull },
      () => Array(this.sizeFull).fill(null),
    );

    this._initGenMatrix();
    this._smoothMatrix();
    this._smoothMatrix();
    //this.smoothMatrix();
    // this.smoothMatrix();
    this._copyMatrix();
    this.matrixGen = null!;
  }

  _initGenMatrix() {
    for (let i = 0; i < this.sizeFull; i++) {
      for (let j = 0; j < this.sizeFull; j++) {
        this.matrixGen[i][j] = new Tile(
          this.x + i - this.sizeBorder,
          this.y + j - this.sizeBorder,
          this.cx,
          this.cy,
        );
      }
    }
  }
  _smoothMatrix() {
    for (let i = 1; i < this.sizeFull - 1; i++) {
      for (let j = 1; j < this.sizeFull - 1; j++) {
        const sum = [
          // this.matrixGen[i][j].lvl,
          this.matrixGen[i + 1][j].lvl,
          this.matrixGen[i - 1][j].lvl,
          this.matrixGen[i][j + 1].lvl,
          this.matrixGen[i][j - 1].lvl,
          this.matrixGen[i + 1][j + 1].lvl,
          this.matrixGen[i - 1][j - 1].lvl,
          this.matrixGen[i - 1][j + 1].lvl,
          this.matrixGen[i + 1][j - 1].lvl,
        ].reduce((a: number, b: number) => a + (b || 0), 0);
        this.matrixGen[i][j].lvl = sum / 8;
      }
    }
  }
  _copyMatrix() {
    const k = this.sizeBorder;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.matrix[i][j] = this.matrixGen[i + k][j + k];
      }
    }
  }
}

export class Chunk extends ChunkGen {
  isLoaded: boolean = false;
  /* Delta system for synchronizing tile changes */

  getDeltas(): any[] {
    const deltas: any[] = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const tile = this.matrix[i][j];
        if (tile.checkDirty()) {
          const delta = tile.toDeltaJson();
          if (delta) deltas.push(delta);
        }
      }
    }
    return deltas;
  }

  applyDeltas(deltas: any[]) {
    deltas.forEach((delta) => {
      try {
        // Ensure positive modulo for negative coordinates
        const rx = ((delta.x % this.size) + this.size) % this.size;
        const ry = ((delta.y % this.size) + this.size) % this.size;

        // Normalize color to RGBA array if present
        if (delta.color !== undefined) {
          const arr = Array.isArray(delta.color)
            ? delta.color.slice()
            : Array.from(delta.color);
          if (arr.length === 3) arr.push(255);
          delta.color = arr;
        }

        // Ensure items is an array if present
        if (delta.items === undefined) delta.items = [];

        if (this.matrix[rx] && this.matrix[rx][ry]) {
          this.matrix[rx][ry].applyDelta(delta);
        } else {
          console.warn(
            `[Chunk ${this.cx}_${this.cy}] applyDelta target missing for rx:${rx} ry:${ry}`,
          );
        }
      } catch (e) {
        console.error(
          `[Chunk ${this.cx}_${this.cy}] applyDelta error for delta:`,
          delta,
          e,
        );
      }
    });
  }
}
