import { Chunk, CHUNK_SIZE } from "../object/chunk.ts";
import { RawTile } from "../object/tileRaw.ts";
import { Tile } from "../object/tile.ts";
import type { IMapPersistence } from "../interface.ts";
import { mapServerPersistence } from "../persistence/map/mapServerPersistence.ts";

export class FactoryMap {
  private static instance: FactoryMap;
  public static getInstance(): FactoryMap {
    return FactoryMap.instance ??= new FactoryMap();
  }

  chunkIndex: Map<number, Map<number, Chunk>> = new Map();

  private persistence: IMapPersistence | null = null;

  constructor() {
    // this.getChunk(0, 0);
  }

  /**
   * Set the persistence provider for loading/saving tile deltas.
   * Called once by the worker initialization.
   */
  setPersistence(persistence: IMapPersistence): void {
    this.persistence = persistence;
    // force load of initial chunk to apply any saved deltas
    const chuck = this.getChunk(0, 0);
    this.loadChunkDeltas(chuck);
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
      console.log(`[FactoryMap] Requesting chunk (${cx}, ${cy})`);
      const chunk = new Chunk(cx, cy);
      chunkRow.set(cy, chunk);
      // Fire-and-forget: load saved deltas after chunk generation
      this.loadChunkDeltas(chunk).then(() => {
        console.log(
          `[FactoryMap] Finished loading deltas for chunk (${cx}, ${cy})`,
        );
        chunk.isLoaded = true; // Mark chunk as fully loaded after applying deltas
      });
      console.log(`[FactoryMap] Returning chunk (${cx}, ${cy})`);
    }
    return chunkRow.get(cy)!;
  }

  /**
   * Asynchronously load saved deltas from the persistence layer
   * and apply them to the chunk after generation.
   *
   * Priority order: Web (IndexedDB) is the authoritative local source
   * because it contains the most recent unsynced changes.
   * Server is only used as fallback when there is no local data.
   */
  private async loadChunkDeltas(chunk: Chunk): Promise<void> {
    console.log(
      `[FactoryMap] Loading deltas for chunk (${chunk.cx}, ${chunk.cy})`,
    );
    if (!this.persistence) return;
    try {
      // 1. Load from web persistence (IndexedDB) — this is the most recent local state
      const webDeltas = await this.persistence.loadChunkDeltas(
        chunk.cx,
        chunk.cy,
      );
      if (webDeltas && webDeltas.length > 0) {
        chunk.applyDeltas(webDeltas);
        // console.log(
        //   `[FactoryMap] WEB Applied ${webDeltas.length} deltas to chunk ${chunk.cx}_${chunk.cy}`,
        // );
        return; // Web is authoritative — stop here. Server may not have the latest changes yet.
      }

      // 2. Fallback: load from server (SQLite) only if web had nothing
      const serverDeltas = await mapServerPersistence.loadChunkDeltas(
        chunk.cx,
        chunk.cy,
      );
      if (serverDeltas && serverDeltas.length > 0) {
        chunk.applyDeltas(serverDeltas);
        // console.log(
        //   `[FactoryMap] SERVER Applied ${serverDeltas.length} deltas to chunk ${chunk.cx}_${chunk.cy}`,
        // );
      }
    } catch (error) {
      console.error(
        `[FactoryMap] Failed to load deltas for chunk ${chunk.cx}_${chunk.cy}:`,
        error,
      );
    }
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
    return chunk ? chunk.get(modx, mody)?.color : new RawTile(x, y).genColor;
  }

  getTileLvl(x: number, y: number) {
    const [cx, cy, modx, mody] = this.chunkPoint(x, y);
    const chunk = this.getExistingChunk(cx, cy);
    return chunk ? chunk.get(modx, mody)?.lvl : new RawTile(x, y).genLvl2;
  }
}
