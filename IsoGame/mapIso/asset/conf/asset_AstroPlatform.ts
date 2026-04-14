import { TypeAssetGroupConfig } from "../assetOptiConfig.ts";
import { list_to_asset } from "../assetUtils.ts";

export const asset_AstroPlatform : TypeAssetGroupConfig = {
  "src": "./img/asset_opti/AstroPlatform.png",
  "group": "AstroPlatform",
  "images": list_to_asset([
    "platform_center",
    "platform_small",
    "structure_closed",
    "platform_corner",
    "platform_cornerOpen",
    "platform_side",
    "platform_high",
    "platform_low",
    "platform_cornerRound",
    "structure",
    "platform_smallDiagonal",
    "platform_end",
    "structure_diagonal",
    "supports_high",
    "platform_straight",
    "structure_detailed",
    "supports_low",
    "platform_cornerDot",
    "platform_centerA",
  ]),
  "imgHeight": 224,
  "imgWidth": 192,
}