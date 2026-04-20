// ─────────────────────────────────────────────────────────────
//  EntityMemory
//
//  Shared state that persists for the entire life of an entity,
//  across all goals. Goals read and write this — it is the
//  entity's "long-term memory" (home, known places, mood, etc.)
//
//  Extend this freely. Goals import and cast it as needed.
// ─────────────────────────────────────────────────────────────

export interface KnownLocation {
  label: string;
  x: number;
  y: number;
}

export interface EntityMemory {
  home:       KnownLocation | null;
  locations:  KnownLocation[];      // any named places the entity knows
  mood:       number;               // -1 (distressed) → 0 (neutral) → 1 (happy)
  [key: string]: unknown;           // open for custom per-entity data
}

export function defaultMemory(): EntityMemory {
  return {
    home:      null,
    locations: [],
    mood:      0,
  };
}
