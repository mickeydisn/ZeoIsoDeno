/**
 * WebPersistence service for managing tile deltas in IndexedDB.
 * Provides save/load functionality for chunk deltas.
 */

import { mapDB } from "./mapWebDatabase.ts";

export class MapWebPersistence {
  private static instance: MapWebPersistence;
  private initialized = false;
  private saveQueue: Map<string, any[]> = new Map();
  private saveTimeout: number | null = null;
  private readonly SAVE_DEBOUNCE_MS = 1000; // Debounce saves by 1 second

  static getInstance(): MapWebPersistence {
    return MapWebPersistence.instance ??= new MapWebPersistence();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await mapDB.init();
    this.initialized = true;
    console.log("[WebPersistence] Initialized");
  }

  /**
   * Save deltas for a chunk. Uses debouncing to batch multiple saves.
   */
  async saveChunkDeltas(cx: number, cy: number, deltas: any[]): Promise<void> {
    if (!this.initialized) await this.init();
    if (deltas.length === 0) return;

    const key = `${cx}_${cy}`;
    this.saveQueue.set(key, deltas);

    // Clear existing timeout
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }

    // Debounce the save
    this.saveTimeout = setTimeout(async () => {
      await this.flushSaveQueue();
    }, this.SAVE_DEBOUNCE_MS) as unknown as number;
  }

  /**
   * Force immediate save of all queued deltas.
   */
  async flushSaveQueue(): Promise<void> {
    if (this.saveQueue.size === 0) return;

    const entries = Array.from(this.saveQueue.entries());
    this.saveQueue.clear();

    for (const [key, deltas] of entries) {
      const [cx, cy] = key.split("_").map(Number);
      try {
        await mapDB.saveDeltas(cx, cy, deltas);
        console.log(`[WebPersistence] Saved ${deltas.length} deltas for chunk ${cx}_${cy}`);
      } catch (error) {
        console.error(`[WebPersistence] Failed to save deltas for chunk ${cx}_${cy}:`, error);
      }
    }
  }

  /**
   * Load deltas for a specific chunk.
   */
  async loadChunkDeltas(cx: number, cy: number): Promise<any[]> {
    if (!this.initialized) await this.init();

    try {
      const deltas = await mapDB.loadDeltas(cx, cy);
      console.log(`[WebPersistence] Loaded ${deltas.length} deltas for chunk ${cx}_${cy}`);
      return deltas;
    } catch (error) {
      console.error(`[WebPersistence] Failed to load deltas for chunk ${cx}_${cy}:`, error);
      return [];
    }
  }

  /**
   * Check if a chunk has saved deltas.
   */
  async hasChunkDeltas(cx: number, cy: number): Promise<boolean> {
    if (!this.initialized) await this.init();
    return mapDB.hasDeltas(cx, cy);
  }

  /**
   * Get all saved chunk IDs.
   */
  async getAllSavedChunkIds(): Promise<string[]> {
    if (!this.initialized) await this.init();
    return mapDB.getAllChunkIds();
  }
}

// Singleton instance
export const mapWebPersistence = MapWebPersistence.getInstance();