import { Tile } from "./tile.ts";

export const CHUNK_SIZE = 32;

export class Chunk {
  size: number = CHUNK_SIZE;
  cx: number;
  cy: number;
  x: number;
  y: number;
  sizeBorder: number = 2;
  sizeFull: number;
  matrixGen: Tile[][];
  matrix: Tile[][];

  constructor(cx: number, cy: number) {
    this.cx = cx;
    this.cy = cy;
    this.x = cx * this.size;
    this.y = cy * this.size;
    this.sizeFull = this.size + 2 * this.sizeBorder;

    this.matrixGen = Array.from(
      { length: this.sizeFull },
      () => Array(this.sizeFull).fill(null),
    );
    this.matrix = Array.from(
      { length: this.size },
      () => Array(this.size).fill(null),
    );

    this.initGenMatrix();
    this.smoothMatrix();
    this.smoothMatrix();
    //this.smoothMatrix();
    // this.smoothMatrix();
    this.copyMatrix();
    this.matrixGen = null!;
  }

  get(x: number, y: number): Tile {
    return this.matrix[x][y];
  }

  initGenMatrix() {
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
    /*
    (async () => {
      const isLoaded = await this.load();
      if (!isLoaded) {
        await this.save();
      }
    })();
    */
  }

  copyMatrix() {
    const k = this.sizeBorder;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.matrix[i][j] = this.matrixGen[i + k][j + k];
      }
    }
  }

  smoothMatrix() {
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
  /*
  async load(): Promise<boolean> {
    const chunkId = `${this.cx}_${this.cy}`;
    const loadDataTiles = await db.MapTiles.where({ chunkId }).toArray();
    if (loadDataTiles.length === this.size * this.size) {
      loadDataTiles.forEach((tileData) => {
        const xx = tileData.x >= 0
          ? tileData.x % this.size
          : this.size + (tileData.x % this.size) - 1;
        const yy = tileData.y >= 0
          ? tileData.y % this.size
          : this.size + (tileData.y % this.size) - 1;
        if (this.matrix[xx] && this.matrix[xx][yy]) {
          this.matrix[xx][yy]!.fromJsonSave(tileData);
        }
      });
      return true;
    }
    return false;
  }

  async save() {
    const chunkId = `${this.cx}_${this.cy}`;
    const tileSaveList = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        tileSaveList.push(this.matrix[i][j]!.toJsonSave());
      }
    }

    try {
      await window.db.MapTiles.bulkPut(tileSaveList);
    } catch (e) {
      console.error("DB Put Not OK", e);
    }

    try {
      await window.db.MapChunks.bulkPut([{
        id: chunkId,
        cx: this.cx,
        cy: this.cy,
      }]);
    } catch (e) {
      console.error("DB Put Not OK", e);
    }
  }
  */
}
