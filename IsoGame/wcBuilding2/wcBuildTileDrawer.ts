import { FactoryGenerator } from "../map/factory/factoryGenerator.ts";
import { FactoryMap } from "../map/factory/factoryMap.ts";
import { TilesActions } from "../map/action/tileActions.ts";
import { World } from "../word.ts";
import {
  WcConfTile,
  WcConfTileAsset,
  WcConfTileFunction,
} from "./wcAbstractBuildConf.ts";

export class WcBuildTileDrawer {
  protected world: World;
  protected fm: FactoryMap;
  protected fg: FactoryGenerator;
  protected ta: TilesActions;
  public x: number;
  public y: number;
  // protected drawConf: WcConfTile;

  constructor(world: World, x: number, y: number) {
    this.world = world;
    this.fm = FactoryMap.getInstance();
    this.fg = FactoryGenerator.getInstance();
    this.ta = TilesActions.getInstance();

    this.x = x;
    this.y = y;
  }

  protected _applyBuildItemList(drawConf: WcConfTile): void {
    this.ta.clearItem({ x: this.x, y: this.y });

    (drawConf.assets || []).forEach((item: WcConfTileAsset) => {
      const h = item.h ? item.h : 0;
      if (item.key) {
        this.ta.itemAddKey({
          x: this.x,
          y: this.y,
          assetKey: item.key,
          h: h,
          off: item.off,
        });
      }
    });
  }

  protected _applyBuildFunction(drawConf: WcConfTile): void {
    (drawConf.functions || []).forEach((conf: WcConfTileFunction) => {
      this.ta.doAction({ x: this.x, y: this.y, ...conf });
    });
  }

  applyBuildError(color: [number, number, number] = [128, 128, 128]): void {
    this.ta.doAction({
      func: "colorSquare",
      x: this.x,
      y: this.y,
      size: 1,
      color: color,
    });
  }

  applyBuild(drawConf: WcConfTile): void {
    if (drawConf.colorT) {
      this.ta.doAction({
        func: "colorSquare",
        x: this.x,
        y: this.y,
        size: 1,
        color: drawConf.colorT,
      });
    }
    if (drawConf.color) {
      this.ta.doAction({
        func: "colorSquare",
        x: this.x,
        y: this.y,
        size: 1,
        color: drawConf.color,
      });
    }

    if (drawConf.functions) {
      this._applyBuildFunction(drawConf);
    }

    if (drawConf.empty) {
      this.ta.doAction({ func: "clearItem", x: this.x, y: this.y });
    }
    if (drawConf.assets) {
      this.ta.doAction({ func: "clearItem", x: this.x, y: this.y });
      this._applyBuildItemList(drawConf);
    } else {
      if (drawConf.key) {
        this.ta.doAction({ func: "clearItem", x: this.x, y: this.y });
        const h = drawConf.h ? drawConf.h : 0;
        this.ta.doAction({
          func: "itemForceKey",
          x: this.x,
          y: this.y,
          assetKey: drawConf.key,
          h: h,
        });
      }
    }
    if (drawConf.lvl) {
      this.ta.doAction({
        func: "lvlSet",
        x: this.x,
        y: this.y,
        lvl: drawConf.lvl,
      });
    }

    if (!drawConf.allowMove) {
      this.ta.doAction({
        func: "setBlocked",
        x: this.x,
        y: this.y,
        isBlock: true,
      });
    }

    if (drawConf.isFrise) {
      this.ta.doAction({
        func: "setFrise",
        x: this.x,
        y: this.y,
        isFrise: true,
      });
    }
  }
}
