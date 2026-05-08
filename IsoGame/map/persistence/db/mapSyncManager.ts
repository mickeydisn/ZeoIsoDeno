/**
 * MapSyncManager handles the synchronization of map deltas.
 * Flow: Memory -> WebPersistence (IndexedDB) -> RemotePersistence (SQLite)
 */

import { mapWebPersistence } from "./mapWebPersistence.ts";
import { mapServerPersistence } from "./mapServerPersistence.ts";
import { Chunk } from "../../object/chunk.ts";

export class MapSyncManager {
  private static instance: MapSyncManager;
  private dirtyChunks: Set<Chunk> = new Set();
  private syncInterval: number | null = null;
  private readonly SYNC_PERIOD_MS = 5000; // Sync to remote every 5 seconds

  static getInstance(): MapSyncManager {
    return MapSyncManager.instance ??= new MapSyncManager();
  }

  constructor() {
    this.startSyncLoop();
  }

  /**
   * Marks a chunk as dirty, triggering a local save and scheduling remote sync.
   */
  loadChunkServer(chunk: Chunk): void {
    // Save to local storage immediately (debounced in WebPersistence)
    mapServerPersistence.loadChunkDeltas(chunk.cx, chunk.cy).then((deltas) => {
      chunk.applyDeltas(deltas);
    }).catch((error) => {
      console.error(`[MapSyncManager] Failed to load deltas for chunk ${chunk.cx}_${chunk.cy} from server:`, error);
    });
  }

  /**
   * Marks a chunk as dirty, triggering a local save and scheduling remote sync.
   */
  markChunkDirty(chunk: Chunk): void {
    this.dirtyChunks.add(chunk);
    
    // Save to local storage immediately (debounced in WebPersistence)
    const deltas = chunk.getDeltas();
    if (deltas.length > 0) {
      mapWebPersistence.saveChunkDeltas(chunk.cx, chunk.cy, deltas);
    }
  }

  /**
   * Starts the background synchronization loop.
   */
  private startSyncLoop(): void {
    if (this.syncInterval !== null) return;
    
    this.syncInterval = setInterval(async () => {
      await this.syncToRemote();
    }, this.SYNC_PERIOD_MS) as unknown as number;
  }

  /**
   * Pushes all local deltas to the remote server.
   */
  async syncToRemote(): Promise<void> {
    if (this.dirtyChunks.size === 0) return;

    const chunksToSync = Array.from(this.dirtyChunks);
    this.dirtyChunks.clear();

    console.log(`[MapSyncManager] Syncing ${chunksToSync.length} chunks to remote...`);

    for (const chunk of chunksToSync) {
      const deltas = chunk.getDeltas();
      if (deltas.length > 0) {
        try {
          await mapServerPersistence.saveChunkDeltas(chunk.cx, chunk.cy, deltas);
          console.log(`[MapSyncManager] Remote sync successful for chunk ${chunk.cx}_${chunk.cy}`);
        } catch (error) {
          console.error(`[MapSyncManager] Remote sync failed for chunk ${chunk.cx}_${chunk.cy}:`, error);
          // If remote sync fails, add it back to dirty chunks for next attempt
          this.dirtyChunks.add(chunk);
        }
      }
    }
  }

  /**
   * Forces immediate synchronization.
   */
  async forceSync(): Promise<void> {
    await mapWebPersistence.flushSaveQueue();
    await this.syncToRemote();
  }
}

export const mapSyncManager = MapSyncManager.getInstance();
