export interface PotionActionEntry {
  func: string;
  config: Record<string, unknown>;
}

export interface Potion {
  id: string;
  name: string;
  icon: string;
  actions: PotionActionEntry[];
  remainingUses: number;
  createdAt: number;
}

// ----------------------------------------------------------------------------
export class PayerState {
  username: string = "mickey-test";

  x: number = 0;
  y: number = 0;
  xf: number = 0;
  yf: number = 0;
  direction: string = "NE";

  // inventory: Potion[] = [];
  // activePotionId: string | null = null;
}
