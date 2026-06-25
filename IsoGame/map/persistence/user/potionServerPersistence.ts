/**
 * PotionServerPersistence handles HTTP calls for potion inventory sync.
 * Analogous to mapServerPersistence.ts but for potions.
 * Flow: Client -> HTTP POST/GET/DELETE -> Server SQLite
 */

import { Potion } from "../../../handlers/game/gameState.ts";

export class PotionServerPersistence {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all potions for a given username from the server.
   */
  async getAllPotions(username: string): Promise<Potion[]> {
    const response = await fetch(
      `${this.baseUrl}/api/potions?username=${encodeURIComponent(username)}`,
    );

    if (!response.ok) {
      let errMsg = "Failed to load potions from server";
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

    const data = await response.json();
    return data.potions || [];
  }

  /**
   * Save a potion to the server.
   */
  async savePotion(username: string, potion: Potion): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/potions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, potion }),
    });

    if (!response.ok) {
      let errMsg = "Failed to save potion to server";
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

  /**
   * Delete a potion from the server by its id.
   */
  async deletePotion(id: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/potions/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      let errMsg = "Failed to delete potion from server";
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
}

// Singleton instance
export const potionServerPersistence = new PotionServerPersistence();
