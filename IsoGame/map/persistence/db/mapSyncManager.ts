/**
 * MapSyncManager handles the synchronization of map deltas and potion inventory.
 * Flow: Memory -> WebPersistence (IndexedDB) -> RemotePersistence (SQLite)
 */

import { mapWebPersistence } from "../map/mapWebPersistence.ts";
import { mapServerPersistence } from "../map/mapServerPersistence.ts";
import { potionServerPersistence } from "../user/potionServerPersistence.ts";
import { Chunk } from "../../object/chunk.ts";
import type { Potion } from "../../../handlers/game/gameState.ts";

export class MapSyncManager {
  private static instance: MapSyncManager;
  private dirtyChunks: Set<Chunk> = new Set();
  private dirtyPotions: Map<
    string,
    { username: string; potion?: Potion; action: "save" | "delete" }
  > = new Map();
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
      console.error(
        `[MapSyncManager] Failed to load deltas for chunk ${chunk.cx}_${chunk.cy} from server:`,
        error,
      );
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

  // ============================================================================
  // POTION SYNC METHODS
  // ============================================================================

  /**
   * Marks a potion as dirty (created or updated) for server sync.
   */
  markPotionDirty(username: string, potion: Potion): void {
    this.dirtyPotions.set(potion.id, { username, potion, action: "save" });
  }

  /**
   * Marks a potion as deleted for server sync.
   */
  markPotionDeleted(username: string, potionId: string): void {
    this.dirtyPotions.set(potionId, { username, action: "delete" });
  }

  /**
   * Loads all potions for a user from the server.
   * Returns potions array or throws on failure.
   */
  async loadPotionsFromServer(username: string): Promise<Potion[]> {
    try {
      const potions = await potionServerPersistence.getAllPotions(username);
      return potions;
    } catch (error) {
      console.error(
        `[MapSyncManager] Failed to load potions from server:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Pushes all local deltas and dirty potions to the remote server.
   */
  async syncToRemote(): Promise<void> {
    const hadChunks = this.dirtyChunks.size > 0;
    const hadPotions = this.dirtyPotions.size > 0;

    if (!hadChunks && !hadPotions) return;

    // --- Sync chunks ---
    if (hadChunks) {
      const chunksToSync = Array.from(this.dirtyChunks);
      this.dirtyChunks.clear();

      console.log(
        `[MapSyncManager] Syncing ${chunksToSync.length} chunks to remote...`,
      );

      for (const chunk of chunksToSync) {
        const deltas = chunk.getDeltas();
        if (deltas.length > 0) {
          try {
            await mapServerPersistence.saveChunkDeltas(
              chunk.cx,
              chunk.cy,
              deltas,
            );
            console.log(
              `[MapSyncManager] Remote sync successful for chunk ${chunk.cx}_${chunk.cy}`,
            );
          } catch (error) {
            console.error(
              `[MapSyncManager] Remote sync failed for chunk ${chunk.cx}_${chunk.cy}:`,
              error,
            );
            // If remote sync fails, add it back to dirty chunks for next attempt
            this.dirtyChunks.add(chunk);
          }
        }
      }
    }

    // --- Sync potions ---
    if (hadPotions) {
      const potionsToSync = Array.from(this.dirtyPotions);
      this.dirtyPotions.clear();

      for (const [id, entry] of potionsToSync) {
        try {
          if (entry.action === "delete") {
            await potionServerPersistence.deletePotion(id);
          } else if (entry.potion) {
            await potionServerPersistence.savePotion(
              entry.username,
              entry.potion,
            );
          }
        } catch (error) {
          console.error(
            `[MapSyncManager] Remote sync failed for potion ${id}:`,
            error,
          );
          // Add back on failure for next attempt
          this.dirtyPotions.set(id, entry);
        }
      }
    }
  }

  /**
   * Forces immediate synchronization of chunks and potions.
   */
  async forceSync(): Promise<void> {
    await mapWebPersistence.flushSaveQueue();
    await this.syncToRemote();
  }
}

export const mapSyncManager = MapSyncManager.getInstance();
