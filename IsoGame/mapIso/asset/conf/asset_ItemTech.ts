import { TypeAssetGroupConfig } from "../assetOptiConfig.ts";
import { list_to_asset } from "../assetUtils.ts";

export const asset_ItemTech : TypeAssetGroupConfig = {
  "src": "./img/asset_opti/ItemTech.png",
  "group": "ItemTech",
  "images": list_to_asset([
    "barrels_rail",
    "satelliteDish_large",
    "barrels",
    "machine_barrel",
    "gate_simple",
    "satelliteDish",
    "machine_generator",
    "gate_complex",
    "machine_wirelessCable",
    "machine_generatorLarge",
    "satelliteDish_detailed",
    "machine_wireless",
    "machine_barrelLarge",
  ]),
  "imgHeight": 224,
  "imgWidth": 192,
}