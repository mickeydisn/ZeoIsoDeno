import { Chunk, CHUNK_SIZE } from "../object/chunk.ts";
import { RawTile } from "../object/tileRaw.ts";
import { Tile } from "../object/tile.ts";

export class FactoryMap {
  private static instance: FactoryMap;
  public static getInstance(): FactoryMap {
    return FactoryMap.instance ??= new FactoryMap();
  }

  chunkIndex: Map<number, Map<number, Chunk>> = new Map();

  constructor() {
    this.getChunk(0, 0);
  }

  getExistingChunk(cx: number, cy: number): Chunk | null {
    return this.chunkIndex.get(cx)?.get(cy) ?? null;
  }

  getChunk(cx: number, cy: number): Chunk {
    if (!this.chunkIndex.has(cx)) {
      this.chunkIndex.set(cx, new Map());
    }
    const chunkRow = this.chunkIndex.get(cx)!;
    if (!chunkRow.has(cy)) {
      chunkRow.set(cy, new Chunk(cx, cy));
    }
    return chunkRow.get(cy)!;
  }

  chunkPoint(x: number, y: number): [number, number, number, number] {
    const modx = (CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE;
    const mody = (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE;
    const xx = x - modx;
    const yy = y - mody;
    return [
      Math.floor(xx / CHUNK_SIZE),
      Math.floor(yy / CHUNK_SIZE),
      modx,
      mody,
    ];
  }

  getRoundTile(x: number, y: number) {
    return this.getTile(Math.round(x), Math.round(y));
  }

  getTile(x: number, y: number) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    return this.getChunk(cx, cy).get(modx, mody);
  }

  getTileNoGen(x: number, y: number) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    const chunk = this.getExistingChunk(cx, cy);
    return chunk ? chunk.get(modx, mody) : new Tile(x, y, cx, cy);
  }

  getTileColor(x: number, y: number) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    const chunk = this.getExistingChunk(cx, cy);
    return chunk
      ? chunk.get(modx, mody)?.color
      : new RawTile(x, y).genColor;
  }

  getTileLvl(x: number, y: number) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    const chunk = this.getExistingChunk(cx, cy);
    return chunk
      ? chunk.get(modx, mody)?.lvl
      : new RawTile(x, y).genLvl2;
  }
}
