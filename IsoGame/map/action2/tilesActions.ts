// import { World } from "../../word.ts";
import { FactoryMap } from "../factory/factoryMap.ts";
import { Tile } from "../object/tile.ts";
import { ACTION_REGISTRY } from "./actions/registry.ts";
import { ActionContext, BaseTileActionConfig } from "./actions/types.ts";


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
    }
  }

  doActions(confs: BaseTileActionConfig[]): void {
    for (const conf of confs) {
      this.doAction(conf);
    }
  }

  /** Clears every transient preview item placed on tiles */
  clearAllTemporaryItems(): void {
    this.ctx.listTilesWithTempItems.forEach((tile) =>
      tile.clearTemporatyItem()
    );
    this.ctx.listTilesWithTempItems = [];
  }
}
