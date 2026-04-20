import { FactoryMap } from "../../map/factory/factoryMap.ts";
import type { Tile } from "../../map/object/tile.ts";
import type { World } from "../../word.ts";
import { CITIZEN_NAME } from "../CitizenTrais.ts";
import { ScriptRunner } from "./goal.ts";
import type { Script } from "./goal.ts";
import { defaultMemory } from "./entityMemory.ts";
import type { EntityMemory } from "./entityMemory.ts";
import type { EntityConfig } from "./entityConfig.ts";
import { randomMove } from "./goals/goals.ts";

const DEFAULT_SCRIPT: Script = {
  mode: "loop",
  entries: [{ factory: randomMove, waitAfter: 80 }],
};

export class CityEntity {
  readonly world: World;
  readonly name:  string;

  // ── Rendering ────────────────────────────────────────────
  tile:      Tile;
  offset     = { x: 0, y: 0 };
  direction  = "S";
  lvl        = 0;
  assetKey:  string;
  assetFilter: string;

  // ── Movement ─────────────────────────────────────────────
  speed: number;

  // ── Memory (long-term, cross-goal) ────────────────────────
  readonly mem: EntityMemory;

  // ── Script runner ─────────────────────────────────────────
  private runner: ScriptRunner;

  constructor(world: World, config: EntityConfig = {}) {
    this.world = world;
    this.world.entities.push(this);

    this.tile       = FactoryMap.getInstance().getTile(0, 0);
    this.name       = config.name ?? CITIZEN_NAME.rand();
    this.assetKey   = config.assetKey ?? "ghost";
    this.speed      = config.speed   ?? 0.015;

    const hue       = config.hue ?? Math.floor(Math.random() * 16) * 16;
    this.assetFilter = config.colorFilter ?? `#_H${hue}_C165_S225`;

    this.mem        = { ...defaultMemory(), ...config.memory };
    this.runner     = new ScriptRunner(config.script ?? DEFAULT_SCRIPT);
  }

  // ── Rendering ─────────────────────────────────────────────

  get renderItem() {
    return {
      t: "Svg",
      key: `${this.assetKey}_${this.direction}${this.assetFilter}`,
      lvl: this.lvl,
      off: { ...this.offset },
      z: 1000,
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────

  teleport(tile: Tile): void {
    this.tile.removeEntity(this);
    this.tile = tile;
    this.tile.addEntity(this);
  }

  kill(): void {
    this.tile.removeEntity(this);
    const i = this.world.entities.indexOf(this);
    if (i > -1) this.world.entities.splice(i, 1);
  }

  // ── Script control ────────────────────────────────────────

  setScript(script: Script): void {
    this.runner.replace(script);
  }

  // ── Main tick ──────────────────────────────────────────────

  doTick(): void {
    this.runner.tick(this, this.mem);
  }

  // ── Movement helpers (called by goals) ────────────────────

  snapToTile(): void {
    this.offset.x = 0;
    this.offset.y = 0;
    this.direction = "S";
  }

  moveToward(tile: Tile): void {
    const dx = tile.x - this.tile.x;
    const dy = tile.y - this.tile.y;
    this._updateDirection(dx, dy);

    const [ox, oy] = dx !== 0 && dy !== 0
      ? [dx * 1.25, dy * 1.25]
      : [dx, dy];

    this.offset.x += ox * this.speed;
    this.offset.y += oy * this.speed;
    if (Math.abs(this.offset.x) < this.speed / 2) this.offset.x = 0;
    if (Math.abs(this.offset.y) < this.speed / 2) this.offset.y = 0;

    const cx = this.offset.x > 0.5 ? 1 : this.offset.x < -0.5 ? -1 : 0;
    const cy = this.offset.y > 0.5 ? 1 : this.offset.y < -0.5 ? -1 : 0;
    if (cx !== 0 || cy !== 0) {
      this.offset.x -= cx;
      this.offset.y -= cy;
      this.tile.removeEntity(this);
      this.tile = FactoryMap.getInstance().getTile(this.tile.x + cx, this.tile.y + cy);
      this.tile.addEntity(this);
    }
  }

  private _updateDirection(dx: number, dy: number): void {
    const dirs: [number, number, string][] = [
      [0, 1, "NW"], [1, 1, "N"],   [1, 0, "NE"],  [1, -1, "E"],
      [0, -1, "SE"], [-1, -1, "S"], [-1, 0, "SW"], [-1, 1, "W"],
    ];
    const hit = dirs.find(([x, y]) => Math.sign(dx) === x && Math.sign(dy) === y);
    if (hit) this.direction = hit[2];
  }
}
