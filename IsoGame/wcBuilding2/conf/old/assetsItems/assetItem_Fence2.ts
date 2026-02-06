import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_Fence2 {
  WALL_PREFIX: string;

  constructor(WALL_PREFIX = "#H40") {
    this.WALL_PREFIX = WALL_PREFIX;
  }

  // ==========================================================================

  // ["Br", "Bl", "Bi", "Bi"],
  get Corner(): WcConfTileAsset[] {
    return [
      { h: 0, key: "hedgeCorner", keyR: 2, sufix: this.WALL_PREFIX },
    ];
  }

  // ["Br", "Bin", "Bl", "Bout"],
  get Flat(): WcConfTileAsset[] {
    return [
      { h: 0, key: "hedge", keyR: 1, sufix: this.WALL_PREFIX },
    ];
  }

  // ["Bin", "Bin", "Bl", "Br"],
  get InnerCorner(): WcConfTileAsset[] {
    return [];
  }

  // ==========================================================================
}
