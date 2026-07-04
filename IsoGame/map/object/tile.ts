import { CityEntity } from "../../entity/cityEntity.ts";
import {
  WcBuildTile,
  WcBuildTileInfo,
} from "../generator/wcBuilding2/wcBuildTile.ts";
import { FactoryMap } from "../factory/factoryMap.ts";
import { RecordRawItem } from "../factory/factoryTileGenerator.ts";
import { RawTile } from "./tileRaw.ts";
import { AXE_DIRECTION, AXE_DIRECTION2 } from "./const.ts";

export type TileInfo = {
  x: number;
  y: number;
  currentLvl: number;
  currentColor: [number, number, number];
  isBlock: boolean;
  isFrise: boolean;
  wcBuildTile: WcBuildTileInfo | null;
  // cityNode: this.cityNode?.toJson() ?? null,
  // items: this.items,
};

export class Tile extends RawTile {
  cx: number;
  cy: number;

  _currentLvl: number;
  _currentColor: Uint8Array;

  isBlock: boolean = false;
  isFrise: boolean = false;

  items: RecordRawItem[] = [];

  entities: CityEntity[] = [];
  temporatyItems: any[] = [];

  itemsBox?: string;
  cityNode?: any;
  wcBuild?: WcBuildTile;

  constructor(x: number, y: number, cx: number, cy: number) {
    super(x, y);
    this.cx = cx;
    this.cy = cy;
    this._currentLvl = this.genLvl2;
    this._currentColor = this.genColor;
    this.items = this.genItems;
    if (Math.random() < .01) {
      this.itemsBox = "Hello";
    }
    // this.lvlGen();
  }

  toJsonInfo(): TileInfo {
    return {
      x: this.x,
      y: this.y,
      currentLvl: this._currentLvl,
      currentColor: [...this._currentColor] as [number, number, number],
      isBlock: this.isBlock,
      isFrise: this.isFrise,
      wcBuildTile: this.wcBuild?.toJsonInfo() ?? null,
      // cityNode: this.cityNode?.toJson() ?? null,
      // items: this.items,
    };
  }
  // ---

  get lvl() {
    return this._currentLvl;
  }
  set lvl(lvl: number) {
    if (this.isFrise) return;
    if (this._currentLvl !== lvl) {
      this._currentLvl = lvl;
    }
  }
  clearLvl() {
    if (this.isFrise) return;
    this.lvl = this.genLvl2;
  }

  get color() {
    return [...this._currentColor];
  }
  set color([r, g, b, a]: number[]) {
    if (this.isFrise) return;
    this._currentColor = new Uint8Array([r, g, b, a]);
  }
  clearColor() {
    if (this.isFrise) return;
    this._currentColor = this.genColor;
  }

  // ==============================
  addEntity(entity: CityEntity) {
    // if (this.isFrise) return;
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }
  removeEntity(entity: CityEntity) {
    // if (this.isFrise) return;
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }
  // ==============================

  clearItem() {
    if (this.isFrise) return;
    if (!this.isFrise) this.items.splice(0, this.items.length);
  }
  clearTemporatyItem() {
    this.temporatyItems.splice(0, this.temporatyItems.length);
  }

  checkDirty(): boolean {
    const isLvlDirty = this._currentLvl !== this.genLvl2;
    const isColorDirty = this._currentColor.some((v, i) =>
      v !== this.genColor[i]
    );
    const isBlockDirty = this.isBlock !== false;
    const isFriseDirty = this.isFrise !== false;
    const isItemsDirty = !this._itemsEqual(this.items, this.genItems);

    return isLvlDirty || isColorDirty || isBlockDirty || isFriseDirty ||
      isItemsDirty;
  }

  /**
   * Deterministic comparison of two RecordRawItem arrays, ignoring object key ordering.
   */
  private _itemsEqual(a: RecordRawItem[], b: RecordRawItem[]): boolean {
    if (a.length !== b.length) return false;
    const canon = (item: RecordRawItem): string =>
      JSON.stringify(item, Object.keys(item).sort());
    return a.every((item, i) => canon(item) === canon(b[i]));
  }

  toDeltaJson() {
    const delta: any = {};
    if (this._currentLvl !== this.genLvl2) delta.lvl = this._currentLvl;
    if (this._currentColor.some((v, i) => v !== this.genColor[i])) {
      delta.color = [...this._currentColor];
    }
    if (this.isBlock !== false) delta.isBlock = this.isBlock;
    if (this.isFrise !== false) delta.isFrise = this.isFrise;
    if (!this._itemsEqual(this.items, this.genItems)) {
      delta.items = this.items;
    }

    if (Object.keys(delta).length === 0) return null;

    return {
      x: this.x,
      y: this.y,
      ...delta,
    };
  }

  applyDelta(delta: any) {
    const data = delta.data || delta; // Support both {data: {...}} and direct {...} formats
    if (data === undefined) {
      console.error("Invalid delta format: missing 'data' property", delta);
      return;
    }
    if (data.lvl !== undefined) {
      this._currentLvl = data.lvl;
    }
    if (data.color !== undefined) {
      const colorArr = Array.isArray(data.color)
        ? data.color.slice()
        : Array.from(data.color);
      const normColor = colorArr.length === 3 ? [...colorArr, 255] : colorArr;
      this._currentColor = new Uint8Array(normColor);
    }
    if (data.isBlock !== undefined) {
      this.isBlock = data.isBlock;
    }
    if (data.isFrise !== undefined) {
      this.isFrise = data.isFrise;
    }
    if (data.items !== undefined) {
      this.items = data.items;
    }
    // Do NOT modify gen* baselines here — they need to stay as the original
    // generated reference for dirty detection and clearLvl()/clearColor().
  }

  fromJsonSave(data: any) {
    this.color = data.currentColor;
    this.lvl = data.currentLvl;
    this.isBlock = data.isBlock;
    this.isFrise = data.isFrise;
    this.items = data.items ?? [];
  }

  toJsonSave() {
    return {
      id: `${this.x}_${this.y}`,
      x: this.x,
      y: this.y,
      chunkId: `${this.cx}_${this.cy}`,
      cx: this.cx,
      cy: this.cy,
      currentLvl: this._currentLvl,
      currentColor: [...this._currentColor],
      isBlock: this.isBlock,
      isFrise: this.isFrise,
      items: this.items ?? [],
    };
  }

  get nearTiles() {
    return [0, 1, 2, 3].map((axe) => {
      const [dx, dy] = AXE_DIRECTION[axe];
      return FactoryMap.getInstance().getTile(this.x + dx, this.y + dy);
    });
  }

  get nearCrossTiles() {
    return [0, 1, 2, 3].map((axe) => {
      const [dx, dy] = AXE_DIRECTION2[axe];
      return FactoryMap.getInstance().getTile(this.x + dx, this.y + dy);
    });
  }
  nearTilesAxe(size = 1) {
    return [0, 1, 2, 3].map((axe) => {
      const [dx, dy] = AXE_DIRECTION[axe];
      return FactoryMap.getInstance().getTile(
        this.x + dx * size,
        this.y + dy * size,
      );
    });
  }
  get nearSquareTiles() {
    return [...this.nearTiles, ...this.nearCrossTiles];
  }

  get getChuck() {
    return FactoryMap.getInstance().getChunk(this.cx, this.cy);
  }
  get isLoaded() {
    return this.getChuck?.isLoaded ?? false;
  }
}
