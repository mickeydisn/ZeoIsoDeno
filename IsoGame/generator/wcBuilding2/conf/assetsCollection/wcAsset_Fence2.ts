import { WcConfTile } from "../../wcAbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";
import { actionsEmpty, applyGroup, tagFaces } from "./wcUtils.ts";

export enum FenceCollapseType {
  Simple,
  NoSquare,
  Exclude,
}

export class WcAsset_Fence2 {
  WALL_SUFFIX: string; // '#H200_S20_C135_B105'
  collapseType: FenceCollapseType;

  tag: string;
  color: [number, number, number] = [92, 92, 92];
  defaultConf: {
    tag: string;
    suffix: string;
    collapseType: FenceCollapseType;
  } = {
    tag: "DEFAULT",
    suffix: "#H200_S20_C135_B105",
    collapseType: FenceCollapseType.Simple,
  };

  assetKey: {
    corner: { k: string; r: number; off?: { x: number; y: number } } | null;
    flat: { k: string; r: number; off?: { x: number; y: number } } | null;
    inner: { k: string; r: number; off?: { x: number; y: number } } | null;
  } = {
    corner: { k: "hedgeCorner", r: 0 },
    flat: { k: "hedge", r: 2 },
    inner: null,
  };

  constructor(conf: {
    tag?: string;
    suffix?: string;
    collapseType?: FenceCollapseType;
  }) {
    this.tag = conf.tag || this.defaultConf.tag;
    this.WALL_SUFFIX = conf.suffix || this.defaultConf.suffix;
    this.collapseType = conf.collapseType || this.defaultConf.collapseType;
  }

  public faceLinkWeight(fout: number = 1, fside: number = 1, fin: number = 1) {
    const linkWeith = this.faceLinkWeightSimple(fout, fside, fin);
    if (this.collapseType == FenceCollapseType.NoSquare) {
      return {
        ...linkWeith,
        ...this.faceLinkWeightNoSquare(fside),
      };
    }
    if (this.collapseType == FenceCollapseType.Exclude) {
      return {
        ...linkWeith,
        ...this.faceLinkWeightExclude(fside),
      };
    }
    return linkWeith;
  }

  protected faceLinkWeightSimple(
    fout: number = 1,
    fside: number = 1,
    fin: number = 1,
  ) {
    return Object.fromEntries([
      [this.tag + "out", fout],
      [this.tag + "l", fside],
      [this.tag + "r", fside],
      [this.tag + "in", fin],
    ]);
  }

  protected faceLinkWeightNoSquare(fside: number = 1) {
    return Object.fromEntries([
      [this.tag + "l#X", fside],
      [this.tag + "r#X", fside],
    ]);
  }
  protected faceLinkWeightExclude(fside: number = 1) {
    return Object.fromEntries([
      [this.tag + "l#Xi", fside],
      [this.tag + "r#Xi", fside],
      [this.tag + "l#Xc", fside],
      [this.tag + "r#Xc", fside],
    ]);
  }

  // ==================================================

  public getFaceLinks(links: {
    out: string[];
    in: string[];
  }): [string, string][] {
    const base = this.getFaceLinksBase(links);

    switch (this.collapseType) {
      case FenceCollapseType.Simple:
        return base;
      case FenceCollapseType.NoSquare:
        return [...base, ...this.getFaceLinksNoSquare()];
      case FenceCollapseType.Exclude:
        return [...base, ...this.getFaceLinksExclude()];
    }
  }
  public getFaceLinksSide(links: {
    l: string[];
    r: string[];
  }): [string, string][] {
    return [
      ...links.l.map((k: string): [string, string] => [this.tag + "l", k]),
      ...links.r.map((k: string): [string, string] => [this.tag + "r", k]),
    ];
  }

  // ------------------------------------
  protected getFaceLinksBase(links: {
    out: string[];
    in: string[];
  }): [string, string][] {
    return [
      ...links.in.map((k: string): [string, string] => [this.tag + "in", k]),
      ...links.out.map((k: string): [string, string] => [this.tag + "out", k]),
      [this.tag + "r", this.tag + "l"],
    ];
  }

  protected getFaceLinksNoSquare(): [string, string][] {
    return [
      [this.tag + "r", this.tag + "l"],
      [this.tag + "l#X", this.tag + "r"],
      [this.tag + "l", this.tag + "r#X"],
    ];
  }

  protected getFaceLinksExclude(): [string, string][] {
    return [
      [this.tag + "r", this.tag + "l"],
      [this.tag + "l#X", this.tag + "r"],
      [this.tag + "l", this.tag + "r#X"],

      [this.tag + "l", this.tag + "r#Xc"],
      [this.tag + "l", this.tag + "r#Xi"],

      [this.tag + "r", this.tag + "l#Xc"],
      [this.tag + "r", this.tag + "l#Xi"],

      [this.tag + "l#Xi", this.tag + "r#Xc"],
      [this.tag + "l#Xc", this.tag + "r#Xi"],
    ];
  }

  // -----------------------

  public groupAsset(conf: {
    flatW?: number;
    cornerW?: number;
    innerW?: number;
    isFrise?: boolean;
  }): WcConfTile[] {
    switch (this.collapseType) {
      case FenceCollapseType.Simple:
        return this.groupAssetBase(conf);
      case FenceCollapseType.NoSquare:
        return this.groupAssetNoSquare(conf);
      case FenceCollapseType.Exclude:
        return this.groupAssetExclude(conf);
    }
  }

  protected groupAssetBase(conf: {
    flatW?: number;
    cornerW?: number;
    innerW?: number;
    isFrise?: boolean;
  }): WcConfTile[] {
    return [
      ...applyGroup([
        { ...this.Corner, weight: conf.cornerW || 0 },
        { ...this.Flat, weight: conf.flatW || 0 },
        { ...this.InnerCorner, weight: conf.innerW || 0 },
      ], {
        allowMove: true,
        isFrise: conf.isFrise || false,
        functions: actionsEmpty,
        color: this.color,
      }),
    ];
  }

  // -----------------------

  protected groupAssetNoSquare(conf: {
    flatW?: number;
    cornerW?: number;
    innerW?: number;
    isFrise?: boolean;
  }): WcConfTile[] {
    return [
      ...applyGroup([
        {
          ...tagFaces(this.Corner, [["r", "#X"], ["l", "#X"]]),
          weight: conf.cornerW || 0,
        },
        { ...this.Flat, weight: conf.flatW || 0 },
        { ...this.InnerCorner, weight: conf.innerW || 0 },
      ], {
        allowMove: true,
        isFrise: conf.isFrise || false,
        functions: actionsEmpty,
        color: this.color,
      }),
    ];
  }
  // -----------------------

  protected groupAssetExclude(conf: {
    flatW?: number;
    cornerW?: number;
    innerW?: number;
    isFrise?: boolean;
  }): WcConfTile[] {
    return [
      ...applyGroup([
        {
          ...tagFaces(this.Corner, [["r", "#Xc"], ["l", "#Xc"]]),
          weight: conf.cornerW || 0,
        },
        { ...this.Flat, weight: conf.flatW || 0 },
        {
          ...tagFaces(this.InnerCorner, [["r", "#Xi"], ["l", "#Xi"]]),
          weight: conf.innerW || 0,
        },
      ], {
        allowMove: true,
        isFrise: conf.isFrise || false,
        functions: actionsEmpty,
        color: this.color,
      }),
    ];
  }

  // ==========================================================================

  get Corner(): WcConfTile {
    return {
      face: ["out", "out", "r", "l"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: !this.assetKey.corner ? [] : [
        {
          h: 0,
          key: this.assetKey.corner.k,
          keyR: this.assetKey.corner.r,
          off: this.assetKey.corner.off,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }
  get Flat(): WcConfTile {
    return {
      face: ["in", "l", "out", "r"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: !this.assetKey.flat ? [] : [
        {
          h: 0,
          key: this.assetKey.flat.k,
          keyR: this.assetKey.flat.r,
          off: this.assetKey.flat.off,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }
  get InnerCorner(): WcConfTile {
    return {
      face: ["in", "in", "l", "r"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: this.assetKey.inner === null ? [] : [
        {
          h: 0,
          key: this.assetKey.inner.k,
          keyR: this.assetKey.inner.r,
          off: this.assetKey.inner.off,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ==========================================================================
}

export class WcAsset_FenceSimple extends WcAsset_Fence2 {
  override assetKey = {
    corner: { k: "fence_corner", r: 0 },
    flat: { k: "fence_simple", r: 2 },
    inner: null,
  };
}

export class WcAsset_FencePlatform extends WcAsset_Fence2 {
  override assetKey = {
    corner: { k: "platform_cornerOpen", r: 1 },
    flat: { k: "platform_side", r: 0 },
    inner: { k: "platform_cornerDot", r: 1 },
  };
}

export class WcAsset_FenceGrave extends WcAsset_Fence2 {
  override assetKey = {
    corner: {
      off: { x: .5, y: .5 },
      k: "pillarSquare",
      r: 2,
    },
    flat: { k: "ironFenceBorder", r: 2 },
    inner: { k: "ironFenceBorderCurve", r: 3 },
  };
}

export class WcAsset_FenceEnter extends WcAsset_Fence2 {
  override color: [number, number, number] = [32, 32, 32];

  override assetKey = {
    corner: null,
    flat: null,
    inner: null,
  };
}

export class WcAsset_FGraveIn extends WcAsset_Fence2 {
  override color: [number, number, number] = [32, 32, 32];

  override assetKey = {
    corner: null,
    flat: null,
    inner: null,
  };
}

export class WcAsset_FGraveBone extends WcAsset_Fence2 {
  override color: [number, number, number] = [38, 32, 32];

  override assetKey = {
    corner: { k: "bones", r: 2 },
    flat: { k: "bones", r: 2 },
    inner: { k: "bones", r: 2 },
  };
}

export class WcAsset_FGraveAltar extends WcAsset_Fence2 {
  override color: [number, number, number] = [42, 32, 32];

  override assetKey = {
    corner: null,
    flat: { k: "altarWood", r: 2 },
    inner: null,
  };
}
