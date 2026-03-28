import { WcFace, WcKeyFace, WcKeyTileFace } from "./wcBuildFace.ts";
import {
  confsGroup_to_confsTile,
  confsRawTile_to_confsTile,
  pickRandomWeightedObject,
} from "./wcUtils.ts";

interface BuildConfOptions {
  growLoopCount?: number;
  endLoopMax?: number;
}

export interface WcConfRawGroup {
  face: WcFace;
  items: WcConfRawTile[];
  weight?: number;
  //  [key: string]: any;
}

export interface WcConfTileAsset {
  key?: string;
  keyR?: number;
  sufix?: string;
  h?: number;
  off?: { x: number; y: number };
}

export interface WcConfTileFunction {
  key?: string;
  keyR?: number;
  sufix?: string;
  size?: number;
  off?: { x: number; y: number };
  // [key: string]: any;
}

export interface WcConfRawTile {
  face?: WcFace;
  weight?: number;

  keyR?: number;
  sufix?: string;

  allowMove?: boolean;
  isFrise?: boolean;

  t?: string;
  // items?: WcConfRawTile[];
  assets?: WcConfTileAsset[];
  functions?: WcConfTileFunction[];

  colorT?: [number, number, number];
  color?: [number, number, number];

  key?: string;
  empty?: boolean;

  h?: number;
  lvl?: number;
}

export interface WcConfTile extends WcConfRawTile {
  face: WcFace;
  weight: number;
}

export class WcAbstractBuildConf {
  growLoopCount: number;
  endLoopMax: number;

  faceLinkWeight: Record<string, number>;
  faceLinks: [string, string][];

  listTileOptions: WcConfTile[];

  indexTileOptions_KeyFaceKey: Record<WcKeyTileFace, WcConfTile[]>;
  listFaceKey: WcFace[];

  startTileOptions: WcConfTile[];
  mainLvl?: number;

  constructor(conf: BuildConfOptions) {
    this.growLoopCount = conf.growLoopCount || conf.growLoopCount === 0
      ? conf.growLoopCount
      : 10;
    this.endLoopMax = conf.endLoopMax || conf.endLoopMax === 0
      ? conf.endLoopMax
      : 2000;

    this.faceLinkWeight = {};
    this.faceLinks = [];

    this.startTileOptions = [];
    this.listTileOptions = [];

    this.indexTileOptions_KeyFaceKey = {};
    this.listFaceKey = [];
    this.preInit();
  }

  preInit(): void {
    // To be implemented by subclasses
  }

  init(): void {
    if (this.__TILE_START.length > 0) {
      this.startTileOptions = confsGroup_to_confsTile(this.__TILE_START).map(
        (conf) => {
          conf.lvl = this.mainLvl;
          return conf;
        },
      );
    } else {
      this.startTileOptions = confsRawTile_to_confsTile(this.__TILE_START_RAW)
        .map(
          (conf) => {
            conf.lvl = this.mainLvl;
            return conf;
          },
        );
    }

    if (this.__TILE_LIST.length > 0) {
      this.listTileOptions = confsGroup_to_confsTile(this.__TILE_LIST).map(
        (conf) => {
          conf.lvl = this.mainLvl;
          return conf;
        },
      );
    } else {
      this.listTileOptions = confsRawTile_to_confsTile(this.__TILE_LIST_RAW)
        .map(
          (conf) => {
            conf.lvl = this.mainLvl;
            return conf;
          },
        );
    }

    this.faceLinks = this.faceLinks.map((link) => [
      [link[0], link[1]] as [string, string],
      [link[1], link[0]] as [string, string],
    ]).flat();

    // console.log(this.listTileOptions.map((x) => `${x.weight} -- ${x.face}`));
    /*
    if (this.mainLvl !== undefined) {
      this.listTileOptions.forEach((tconf) => {
        tconf.lvl = this.mainLvl;
      });
    }
    */
    const keyFaceKeyEntrie = this.listTileOptions
      .map((tileOpt) =>
        [
          tileOpt.face.map((k) => k === null ? "null" : k).join("|"),
          tileOpt,
        ] as [string, WcConfTile]
      );

    this.indexTileOptions_KeyFaceKey = keyFaceKeyEntrie.reduce(
      (acc: Record<WcKeyTileFace, WcConfTile[]>, v) => {
        if (!acc[v[0]]) acc[v[0]] = [];
        acc[v[0]].push(v[1]);
        return acc;
      },
      {},
    );

    this.listFaceKey = Object.entries(this.indexTileOptions_KeyFaceKey)
      .map(([key, _]) => {
        const face = key
          .split("|")
          .map((key) => "null".localeCompare(key) === 0 ? null : key) as WcFace;
        return face;
      });
  }

  get __TILE_START_RAW(): WcConfTile[] {
    return [];
  }

  get __TILE_LIST_RAW(): WcConfTile[] {
    return [];
  }

  get __TILE_START(): WcConfRawGroup[] {
    return [];
  }

  get __TILE_LIST(): WcConfRawGroup[] {
    return [];
  }

  get TILE_START_OPTIONS(): WcConfTile[] {
    return this.startTileOptions;
  }

  get TILE_START(): WcConfTile | null {
    return pickRandomWeightedObject(this.startTileOptions);
  }

  /**
   * Get a List a FaceKey that can be linked to the Original Face
   * @param face Original FaceKey
   * @returns
   */
  linkedFaceKey(face: WcKeyFace): WcKeyFace[] | [] {
    const filterLink = this.faceLinks.filter((x) =>
      face === null ? x[0] === null : x[0].localeCompare(face) === 0
    );
    return filterLink.length ? filterLink.map((l) => l[1]) : [];
  }
}