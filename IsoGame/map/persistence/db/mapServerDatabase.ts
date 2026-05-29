import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { SERVER_DB_PATH } from "../const.ts";

export class mapServerDatabase {
  private db: DB;

  constructor(dbPath = SERVER_DB_PATH) {
    this.db = new DB(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.execute(`
      CREATE TABLE IF NOT EXISTS map_deltas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cx INTEGER,
        cy INTEGER,
        x INTEGER,
        y INTEGER,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cx, cy, x, y)
      )
    `);

    this.db.execute(
      `CREATE INDEX IF NOT EXISTS idx_chunk ON map_deltas (cx, cy)`,
    );

    this.db.execute(`
      CREATE TABLE IF NOT EXISTS potion_inventory (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        potion_data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private writeLock: Promise<void> = Promise.resolve();

  // Serialize all writes through a lock
  private async withLock(fn: () => void): Promise<void> {
    const release = this.writeLock;
    let resolve!: () => void;
    this.writeLock = new Promise((r) => resolve = r);
    await release;
    try {
      fn();
    } finally {
      resolve();
    }
  }

  public async saveDeltas(cx: number, cy: number, deltas: any[]) {
    await this.withLock(() => {
      console.log("SaveDelta");
      this.db.execute("BEGIN");
      try {
        for (const delta of deltas) {
          this.db.query(
            `INSERT OR REPLACE INTO map_deltas (cx, cy, x, y, data) VALUES (?, ?, ?, ?, ?)`,
            [cx, cy, delta.x, delta.y, JSON.stringify(delta.data)],
          );
        }
        this.db.execute("COMMIT");
      } catch (e) {
        try {
          this.db.execute("ROLLBACK");
        } catch (_) {}
        throw e;
      }
      console.log("-ENDSaveDelta");
    });
  }

  public getDeltas(cx: number, cy: number) {
    const rows = this.db.query(
      `SELECT x, y, data FROM map_deltas WHERE cx = ? AND cy = ?`,
      [cx, cy],
    );

    return rows.map(([x, y, data]) => ({
      x: x as number,
      y: y as number,
      data: JSON.parse(data as string),
    }));
  }

  public savePotion(
    username: string,
    potion: {
      id: string;
      name: string;
      icon: string;
      actions: unknown[];
      remainingUses: number;
      createdAt: number;
    },
  ) {
    this.db.query(
      `INSERT OR REPLACE INTO potion_inventory (id, username, potion_data, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [potion.id, username, JSON.stringify(potion)],
    );
  }

  public getAllPotions(username: string) {
    const rows = this.db.query(
      `SELECT id, potion_data FROM potion_inventory WHERE username = ? ORDER BY updated_at DESC`,
      [username],
    );

    return rows.map(([id, data]) => ({
      id: id as string,
      ...JSON.parse(data as string),
    }));
  }

  public deletePotion(id: string) {
    this.db.query(`DELETE FROM potion_inventory WHERE id = ?`, [id]);
  }

  public close() {
    this.db.close();
  }
}
