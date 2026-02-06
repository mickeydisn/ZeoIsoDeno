import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_Fence {
  WALL_PREFIX: string;

  constructor(WALL_PREFIX = "#H40") {
    this.WALL_PREFIX = WALL_PREFIX;
  }

  // ==========================================================================
  get Corner_A(): WcConfTileAsset[] {
    return [
      { h: 0, key: "fence_corner", keyR: 2, sufix: this.WALL_PREFIX },
    ];
  }
  get Flat_A(): WcConfTileAsset[] {
    return [
      { h: 0, key: "fence_simple", keyR: 1, sufix: this.WALL_PREFIX },
    ];
  }

  // ["Bin", "Bin", "Bl", "Br"],
  get InnerCorner_A(): WcConfTileAsset[] {
    return [];
  }

  // ==========================================================================
}
