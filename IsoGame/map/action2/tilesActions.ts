// import { World } from "../../word.ts";
import { FactoryMap } from "../factory/factoryMap.ts";
import { Tile } from "../object/tile.ts";
import { mapSyncManager } from "../persistence/db/mapSyncManager.ts";
import { ACTION_REGISTRY } from "./actions/registry.ts";
import { ActionContext, BaseTileActionConfig } from "./utils/types.ts";


export class TilesActions {
  private static instance: TilesActions;
  public static getInstance(): TilesActions {
    return (TilesActions.instance ??= new TilesActions());
  }

  // ─── State ──────────────────────────────────────────────────────────────────

  private ctx: ActionContext;

  /** Dispatch table built once from the registry */
  private index: Record<string, (conf: BaseTileActionConfig) => void> = {};

  // ─── Constructor ────────────────────────────────────────────────────────────

  constructor() {
    // const world = World.getInstance();
    const fm = FactoryMap.getInstance();

    this.ctx = {
      fm,
      listTilesUpdated: new Set<Tile>(),
      listTilesWithTempItems: [],
    };

    // Register every action from the catalogue
    for (const action of ACTION_REGISTRY) {
      this.index[action.key] = (conf) =>
        action.execute(conf as never, this.ctx);
    }
  }

  // ─── Public surface (unchanged API) ─────────────────────────────────────────

  get listTilesUpdated(): Set<Tile> {
    return this.ctx.listTilesUpdated;
  }

  get listTilesWithTempItems(): Tile[] {
    return this.ctx.listTilesWithTempItems;
  }

  doAction(conf: BaseTileActionConfig): void {
    if (conf.func && this.index[conf.func]) {
      this.index[conf.func](conf);
      this.handleAutoSave();
    }
  }

  doActions(confs: BaseTileActionConfig[]): void {
    for (const conf of confs) {
      this.doAction(conf);
    }
    this.handleAutoSave();
  }

  /**
   * Identifies chunks affected by recent tile updates and marks them for saving.
   */
  private handleAutoSave(): void {
    if (this.ctx.listTilesUpdated.size === 0) return;

    const affectedChunks = new Set<any>();
    this.ctx.listTilesUpdated.forEach((tile) => {
      const chunk = this.ctx.fm.getExistingChunk(tile.cx, tile.cy);
      if (chunk) {
        affectedChunks.add(chunk);
      }
    });

    affectedChunks.forEach((chunk) => {
      mapSyncManager.markChunkDirty(chunk);
    });

    // Clear the updated list after processing
    this.ctx.listTilesUpdated.clear();
  }

  /** Clears every transient preview item placed on tiles */
  clearAllTemporaryItems(): void {
    this.ctx.listTilesWithTempItems.forEach((tile) =>
      tile.clearTemporatyItem()
    );
    this.ctx.listTilesWithTempItems = [];
  }
}
