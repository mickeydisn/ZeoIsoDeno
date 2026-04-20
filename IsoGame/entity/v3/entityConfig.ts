import type { Script } from "./goal.ts";
import type { EntityMemory } from "./entityMemory.ts";

// ─────────────────────────────────────────────────────────────
//  EntityConfig
//
//  Everything needed to define a specific kind of entity.
//  Pass to CityEntity constructor. All fields are optional —
//  omitted fields fall back to sensible defaults.
// ─────────────────────────────────────────────────────────────

export interface EntityConfig {
  // ── Identity ──────────────────────────────────────────────
  name?:         string;           // fixed name, or random if omitted
  assetKey?:     string;           // sprite key (default: "ghost")
  hue?:          number;           // 0-255, random if omitted
  colorFilter?:  string;           // full override, e.g. "#_H128_C165_S225"

  // ── Movement ──────────────────────────────────────────────
  speed?:        number;           // tile-units per tick (default: 0.015)

  // ── Memory ────────────────────────────────────────────────
  memory?:       Partial<EntityMemory>;  // initial long-term memory

  // ── Script ────────────────────────────────────────────────
  script?:       Script;           // default: loop of randomMove
}
