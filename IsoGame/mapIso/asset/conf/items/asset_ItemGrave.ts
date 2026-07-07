import { TypeAssetGroupConfig } from "../../assetOptiConfig.ts";
import { list_to_asset } from "../../assetUtils.ts";

export const asset_ItemGrave: TypeAssetGroupConfig = {
  "src": "./img/asset-opti/items/ItemGrave.png",
  "group": "ItemGrave",
  "images": list_to_asset([
    "gravestoneDecorative",
    "coffinOld",
    "gravestoneRound",
    "altarStone",
    "gravestoneBevel",
    "crypt",
    "gravestoneFlat",
    "gravestoneRoof",
    "gravestoneFlatOpen",
    "gravestoneWide",
    "coffin",
    "altarWood",
  ]),
  "imgHeight": 224,
  "imgWidth": 192,
};
