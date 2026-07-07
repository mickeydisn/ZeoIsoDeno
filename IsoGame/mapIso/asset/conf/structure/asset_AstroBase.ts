import { TypeAssetGroupConfig } from "../../assetOptiConfig.ts";
import { list_to_asset } from "../../assetUtils.ts";

export const asset_AstroBase: TypeAssetGroupConfig = {
  "src": "./img/asset-opti/structure/AstroBase.png",
  "group": "AstroBase",
  "images": list_to_asset([
    "corridor_open",
    "corridor_windowClosed",
    "corridor_",
    "corridor_cornerRoundWindow",
    "corridor_cross",
    "corridor_corner",
    "corridor_window",
    "corridor_detailed",
    "corridor_end",
    "corridor_cornerRound",
    "corridor_roof",
    "corridor_split",
    "corridor_wallCorner",
    "corridor_wall",
  ]),
  "imgHeight": 224,
  "imgWidth": 192,
};
