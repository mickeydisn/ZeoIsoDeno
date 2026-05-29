import { World } from "../../../word.ts";
import { FactoryMap } from "../../factory/factoryMap.ts";
import { RecordRawItem } from "../../factory/factoryTileGenerator.ts";
import { Tile } from "../../object/tile.ts";
import { TilesMatrix } from "../../object/tilesMatrix.ts";

export type TypeTileAction = {
  func: (conf: TypeTileActionConfig) => void;
  conf: TypeTileActionConfig;
};

export type TypeTileActionConfig = {
  func?: string;
  x: number;
  y: number;
  off?: { x: number; y: number };
  size?: number;
  h?: number;
  lvl?: number;
  color?: number[];
  assetKey?: string;
  isBlock?: boolean;
  isFrise?: boolean;
};

export class TilesActions {
  private static instance: TilesActions;
  public static getInstance(): TilesActions {
    return TilesActions.instance ??= new TilesActions();
  }

  world: World;
  fm: FactoryMap;
  index: Record<string, (conf: TypeTileActionConfig) => void>;

  listTilesUpdated: Set<Tile>;
  listTilesWithTempItems: Tile[];

  constructor() {
    this.world = World.getInstance();
    this.fm = FactoryMap.getInstance();

    // List to store pointer on Tiles containe temporaty display item (like for selection / preview .. )
    this.listTilesWithTempItems = [];

    this.listTilesUpdated = new Set();

    this.index = {
      // doFunction: this.doFunction.bind(this),
      setBlocked: this.setBlocked.bind(this),
      setBlockedSquare: this.setBlockedSquare.bind(this),

      setFrise: this.setFrise.bind(this),
      setFriseSquare: this.setFriseSquare.bind(this),

      itemForceKey: this.itemForceKey.bind(this),
      itemAddKey: this.itemAddKey.bind(this),

      clearItem: this.clearItem.bind(this),
      clearItemSquare: this.clearItemSquare.bind(this),
      clearColor: this.clearColor.bind(this),
      clearColorSquare: this.clearColorSquare.bind(this),
      clearLvl: this.clearLvl.bind(this),
      clearLvlSquare: this.clearLvlSquare.bind(this),

      clearAll: this.clearAll.bind(this),
      clearAllSquare: this.clearAllSquare.bind(this),

      lvlSet: this.lvlSet.bind(this),
      lvlUp: this.lvlUp.bind(this),
      lvlUpSquare: this.lvlUpSquare.bind(this),
      lvlFlatSquare: this.lvlFlatSquare.bind(this),
      lvlAvgSquare: this.lvlAvgSquare.bind(this),
      lvlAvgBorder: this.lvlAvgBorder.bind(this),

      colorSquare: this.colorSquare.bind(this),

      temporatyItemsForceKey: this.temporatyItemsForceKey.bind(this),
      // clearAllTemporatyItems: this.clearAllTemporatyItems.bind(this),
    };
  }
  //--------------------

  doAction(conf: TypeTileActionConfig) {
    if (conf.func && this.index[conf.func]) {
      this.index[conf.func](conf);
    }
  }
  doActions(confs: TypeTileActionConfig[]) {
    for (const conf of confs) {
      if (conf.func && this.index[conf.func]) {
        this.index[conf.func](conf);
      }
    }
  }
  // ---------------------
  // Add item to a Tiles
  // ---------------------

  setBlocked(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.isBlock = conf.isBlock || false;
    this.listTilesUpdated.add(tile);
  }
  setBlockedSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.isBlock = conf.isBlock || false;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }

  setFrise(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.isFrise = conf.isFrise || false;
    this.listTilesUpdated.add(tile);
  }

  setFriseSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.isFrise = conf.isFrise || false;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }

  clearAllTile(tile: Tile) {
    tile.isBlock = false;
    tile.isFrise = false;
    tile.clearColor();
    tile.clearItem();
    this.listTilesUpdated.add(tile);
  }
  clearAll(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    this.clearAllTile(tile);
  }
  clearAllSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        this.clearAllTile(cellTile);
      });
    });
  }

  // ---------------------
  // Add item to a Tiles
  // ---------------------

  itemAddKey(conf: TypeTileActionConfig) {
    // console.log("this.itemAddKey", conf);
    if (!conf.assetKey) return;
    const tile = this.fm.getTile(conf.x, conf.y);
    const h = conf.h ? conf.h : 0;
    tile.items.push({
      t: "Asset",
      key: conf.assetKey,
      lvl: h,
      off: conf.off,
    });
    this.listTilesUpdated.add(tile);
  }

  itemForceKey(conf: TypeTileActionConfig) {
    if (!conf.assetKey) return;
    const tile = this.fm.getTile(conf.x, conf.y);
    const h = conf.h ? conf.h : 0;
    tile.clearItem();
    tile.items.push({ t: "Asset", key: conf.assetKey, lvl: h, off: conf.off });
    this.listTilesUpdated.add(tile);
  }

  clearItem(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.clearItem();
    this.listTilesUpdated.add(tile);
  }

  // Temporaty
  _tileTemporatyItemsForceKey(tile: Tile, conf: RecordRawItem) {
    tile.temporatyItems.splice(0, tile.temporatyItems.length);
    tile.temporatyItems.push(conf);
    // Cause is a temps we want to store a link to the tile.
    this.listTilesWithTempItems.push(tile);
  }

  //assetKey
  temporatyItemsForceKey(conf: TypeTileActionConfig) {
    if (!conf.assetKey) return;
    const tile = this.fm.getTile(conf.x, conf.y);
    const h = conf.h ? conf.h : 0;
    this._tileTemporatyItemsForceKey(tile, {
      t: "Asset",
      key: conf.assetKey,
      lvl: h,
    });
  }

  clearAllTemporatyItems(_conf: TypeTileActionConfig) {
    this.listTilesWithTempItems.forEach((tile) => {
      tile.clearTemporatyItem();
    });
    this.listTilesWithTempItems = [];
  }

  clearItemSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.clearItem();
        this.listTilesUpdated.add(cellTile);
      });
    });
  }

  // ---------------------
  // Lvl of Tiles
  // ---------------------

  clearLvl(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.clearLvl();
    this.listTilesUpdated.add(tile);
  }

  clearLvlSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.clearLvl();
        this.listTilesUpdated.add(cellTile);
      });
    });
  }

  // -------------------

  lvlSet(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.lvl = conf.lvl || tile.lvl;
    this.listTilesUpdated.add(tile);
  }

  lvlUp(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.lvl += conf.lvl || 0;
    this.listTilesUpdated.add(tile);
  }

  lvlUpSquare(conf: TypeTileActionConfig) {
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.lvl += conf.lvl || 0;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }

  lvlFlatSquare(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.lvl = tile.lvl;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }

  lvlAvg(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    let sumLvl = 0;
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        sumLvl += cellTile.lvl;
        this.listTilesUpdated.add(cellTile);
      });
    });
    const size = conf.size || 1;
    const avgLvl = sumLvl / (size * size);
    tile.lvl = avgLvl;
  }

  lvlAvgSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        this.lvlAvg({ x: cellTile.x, y: cellTile.y, size: 3 });
      });
    });
  }

  lvlAvgBorder(conf: TypeTileActionConfig) {
    const x = conf.x;
    const y = conf.y;
    const size = conf.size || 1;

    const fCenter = Math.floor(size / 2);
    const rangeX = Array.from(
      { length: size },
      (_, index) => index - fCenter + x,
    );
    const rangeY = Array.from(
      { length: size },
      (_, index) => index - fCenter + y,
    );

    rangeX.forEach((xx: number) => {
      this.lvlAvg({ x: xx, y: y - fCenter - 1, size: 5 });
      this.lvlAvg({ x: xx, y: y + (size - fCenter), size: 5 });
    });
    rangeY.forEach((yy) => {
      this.lvlAvg({ x: x - fCenter - 1, y: yy, size: 5 });
      this.lvlAvg({ x: x + (size - fCenter), y: yy, size: 5 });
    });
  }

  // ---------------------
  // Color of Tiles
  // ---------------------

  clearColor(conf: TypeTileActionConfig) {
    const tile = this.fm.getTile(conf.x, conf.y);
    tile.clearColor();
    this.listTilesUpdated.add(tile);
  }

  clearColorSquare(conf: TypeTileActionConfig) {
    conf.size = conf.size ? conf.size : 1;
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.clearColor();
        this.listTilesUpdated.add(cellTile);
      });
    });
  }

  color(conf: TypeTileActionConfig) {
    const confColor = conf.color || [0, 0, 0, 1];
    // add alpha is not exist
    if (confColor.length == 3) confColor.push(255);

    const tile = this.fm.getTile(conf.x, conf.y);
    tile.color = confColor;
    this.listTilesUpdated.add(tile);
  }

  colorSquare(conf: TypeTileActionConfig) {
    const confColor = conf.color || [0, 0, 0, 255];
    // add alpha is not exist
    if (confColor.length == 3) confColor.push(255);
    const box = new TilesMatrix(conf.size, conf.x, conf.y);
    box.tiles.forEach((row) => {
      row.forEach((cellTile) => {
        cellTile.color = confColor;
        this.listTilesUpdated.add(cellTile);
      });
    });
  }
}
