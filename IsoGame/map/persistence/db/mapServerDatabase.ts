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
    
    this.db.execute(`CREATE INDEX IF NOT EXISTS idx_chunk ON map_deltas (cx, cy)`);
  }

  public saveDeltas(cx: number, cy: number, deltas: any[]) {
    this.db.transaction(() => {
      for (const delta of deltas) {
        this.db.query(
          `INSERT OR REPLACE INTO map_deltas (cx, cy, x, y, data) VALUES (?, ?, ?, ?, ?)`,
          [cx, cy, delta.x, delta.y, JSON.stringify(delta.data)]
        );
      }
    });
  }

  public getDeltas(cx: number, cy: number) {
    const rows = this.db.query(
      `SELECT x, y, data FROM map_deltas WHERE cx = ? AND cy = ?`,
      [cx, cy]
    );
    
    return rows.map(([x, y, data]) => ({
      x: x as number,
      y: y as number,
      data: JSON.parse(data as string)
    }));
  }

  public close() {
    this.db.close();
  }
}
