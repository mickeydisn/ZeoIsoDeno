import { IMapPersistence } from "../../interface.ts";

export class MapServerPersistence implements IMapPersistence {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  async saveChunkDeltas(cx: number, cy: number, deltas: any[]): Promise<void> {
    if (deltas.length === 0) return;

    // Server expects each delta as { x, y, data }.
    // Deltas from chunk.getDeltas() already have this shape — do NOT re-wrap,
    // or the DB ends up storing { data: { x, y, data: { x, y, ... } } }.
    const serverDeltas = deltas;
    const payload = { cx, cy, deltas: serverDeltas };
    try {
      console.log("[RemotePersistence] POST /api/map/deltas", {
        cx,
        cy,
        deltasCount: serverDeltas.length,
        sample: serverDeltas.slice(0, 3),
      });
    } catch {
      // ignore logging failure in constrained environments
    }

    const response = await fetch(`${this.baseUrl}/api/map/deltas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Try parse JSON error body, fallback to text
      let errMsg = "Failed to save deltas to server";
      try {
        const parsed = await response.json();
        errMsg = parsed?.error || JSON.stringify(parsed) || errMsg;
      } catch {
        try {
          errMsg = await response.text();
        } catch {
          // keep fallback message
        }
      }
      throw new Error(errMsg);
    }
  }

  async loadChunkDeltas(cx: number, cy: number): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/map/deltas?cx=${cx}&cy=${cy}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to load deltas from server");
    }

    const data = await response.json();
    return data.deltas || [];
  }
}

export const mapServerPersistence = new MapServerPersistence();
