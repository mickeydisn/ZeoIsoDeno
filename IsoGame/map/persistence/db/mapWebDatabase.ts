/**
 * IndexedDB wrapper for tile delta persistence.
 * Stores chunk metadata and tile deltas for offline persistence.
 */

import { WEB_DB_NAME, WEB_DB_VERSION } from "../const.ts";
import type { Potion } from "@iso-game/mapIso/mapState.ts";


export interface MapChunkMeta {
  id: string; // "cx_cy"
  cx: number;
  cy: number;
  timestamp: number;
}

export interface MapDelta {
  id?: number;
  chunkId: string; // "cx_cy"
  cx: number;
  cy: number;
  x: number;
  y: number;
  data: any; // Delta object from Tile.toDeltaJson()
  timestamp: number;
}

class MapWebDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(WEB_DB_NAME, WEB_DB_VERSION);

      request.onerror = () => {
        console.error("[MapDB] Failed to open database:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[MapDB] Database opened successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // MapChunks store: metadata about saved chunks
        if (!db.objectStoreNames.contains("MapChunks")) {
          const chunkStore = db.createObjectStore("MapChunks", { keyPath: "id" });
          chunkStore.createIndex("cx", "cx", { unique: false });
          chunkStore.createIndex("cy", "cy", { unique: false });
          chunkStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // MapDeltas store: individual tile deltas
        if (!db.objectStoreNames.contains("MapDeltas")) {
          const deltaStore = db.createObjectStore("MapDeltas", { keyPath: "id", autoIncrement: true });
          deltaStore.createIndex("chunkId", "chunkId", { unique: false });
          deltaStore.createIndex("cx", "cx", { unique: false });
          deltaStore.createIndex("cy", "cy", { unique: false });
          deltaStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // PotionInventory store: player potion data
        if (!db.objectStoreNames.contains("PotionInventory")) {
          const potionStore = db.createObjectStore("PotionInventory", { keyPath: "id" });
          potionStore.createIndex("username", "username", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureReady(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error("[MapDB] Database not initialized");
    return this.db;
  }

  // ---- MapChunks operations ----

  async saveChunkMeta(cx: number, cy: number): Promise<void> {
    const db = await this.ensureReady();
    const chunkId = `${cx}_${cy}`;
    const tx = db.transaction("MapChunks", "readwrite");
    const store = tx.objectStore("MapChunks");

    store.put({
      id: chunkId,
      cx,
      cy,
      timestamp: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getChunkMeta(cx: number, cy: number): Promise<MapChunkMeta | null> {
    const db = await this.ensureReady();
    const chunkId = `${cx}_${cy}`;
    const tx = db.transaction("MapChunks", "readonly");
    const store = tx.objectStore("MapChunks");

    return new Promise((resolve, reject) => {
      const request = store.get(chunkId);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllChunkIds(): Promise<string[]> {
    const db = await this.ensureReady();
    const tx = db.transaction("MapChunks", "readonly");
    const store = tx.objectStore("MapChunks");

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  // ---- MapDeltas operations ----

  async saveDeltas(cx: number, cy: number, deltas: any[]): Promise<void> {
    if (deltas.length === 0) return;

    const db = await this.ensureReady();
    const chunkId = `${cx}_${cy}`;
    const timestamp = Date.now();

    const tx = db.transaction("MapDeltas", "readwrite");
    const store = tx.objectStore("MapDeltas");
    const index = store.index("chunkId");

    return new Promise((resolve, reject) => {
      // 1. Get all primary keys for existing deltas in this chunk
      const keyRequest = index.getAllKeys(IDBKeyRange.only(chunkId));

      keyRequest.onsuccess = () => {
        const oldKeys = keyRequest.result as IDBValidKey[];

        // 2. Delete old records by primary key (ordered before adds)
        for (const key of oldKeys) {
          store.delete(key);
        }

        // 3. Add new deltas
        for (const delta of deltas) {
          store.add({
            chunkId,
            cx,
            cy,
            x: delta.x,
            y: delta.y,
            data: delta,
            timestamp,
          });
        }

        tx.oncomplete = () => {
          this.saveChunkMeta(cx, cy);
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };

      keyRequest.onerror = () => reject(keyRequest.error);
    });
  }

  async loadDeltas(cx: number, cy: number): Promise<any[]> {
    const db = await this.ensureReady();
    const chunkId = `${cx}_${cy}`;
    const tx = db.transaction("MapDeltas", "readonly");
    const store = tx.objectStore("MapDeltas");
    const index = store.index("chunkId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(chunkId));
      request.onsuccess = () => {
        const results = request.result as MapDelta[];
        resolve(results.map((r) => r.data));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async hasDeltas(cx: number, cy: number): Promise<boolean> {
    const meta = await this.getChunkMeta(cx, cy);
    return meta !== null;
  }

  // ---- PotionInventory operations ----

  async savePotion(username: string, potion: Potion): Promise<void> {
    const db = await this.ensureReady();
    const tx = db.transaction("PotionInventory", "readwrite");
    const store = tx.objectStore("PotionInventory");

    store.put({
      id: potion.id,
      username,
      potion,
      updatedAt: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllPotions(username: string): Promise<Potion[]> {
    const db = await this.ensureReady();
    const tx = db.transaction("PotionInventory", "readonly");
    const store = tx.objectStore("PotionInventory");
    const index = store.index("username");

    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(username));
      request.onsuccess = () => {
        const records = request.result as Array<{ potion: Potion }>;
        resolve(records.map((r) => r.potion));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deletePotion(id: string): Promise<void> {
    const db = await this.ensureReady();
    const tx = db.transaction("PotionInventory", "readwrite");
    const store = tx.objectStore("PotionInventory");

    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Singleton instance
export const mapDB = new MapWebDatabase();