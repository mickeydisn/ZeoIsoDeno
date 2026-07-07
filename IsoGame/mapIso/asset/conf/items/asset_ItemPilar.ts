import { TypeAssetGroupConfig } from "../../assetOptiConfig.ts";
import { list_to_asset } from "../../assetUtils.ts";

export const asset_ItemPilar: TypeAssetGroupConfig = {
  "src": "./img/asset-opti/items/ItemPilar.png",
  "group": "ItemPilar",
  "images": list_to_asset([
    "statue_column",
    "statue_ring",
    "statue_obelisk",
    "pillarSquare",
    "statue_head",
    "pillarObelisk",
    "statue_block",
    "pillarLarge",
    "borderPillar",
    "pillarSmall",
    "statue_columnDamaged",
    "columnLarge",
  ]),
  "imgHeight": 224,
  "imgWidth": 192,
};
