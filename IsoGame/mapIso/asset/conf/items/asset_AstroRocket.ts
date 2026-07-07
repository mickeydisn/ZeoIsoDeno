import { TypeAssetGroupConfig } from "../../assetOptiConfig.ts";
import { list_to_asset } from "../../assetUtils.ts";

export const asset_AstroRocket: TypeAssetGroupConfig = {
  "src": "./img/asset-opti/items/AstroRocket.png",
  "group": "AstroRocket",
  "images": list_to_asset([
    "rocket_fuelB",
    "rocket_sidesA",
    "rocket_finsA",
    "rocket_baseB",
    "rocket_topA",
    "rocket_sidesB",
    "rocket_fuelA",
    "rocket_topB",
    "rocket_finsB",
    "rocket_baseA",
  ]),
  "imgHeight": 224,
  "imgWidth": 192,
};
