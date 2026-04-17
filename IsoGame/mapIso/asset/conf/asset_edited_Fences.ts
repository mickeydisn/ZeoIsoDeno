import { TypeAssetGroupConfig } from "../assetOptiConfig.ts";
import { list_to_asset } from "../assetUtils.ts";

/*
FenceSingle_
FenceCorner_
FenceCornerInner_
FenceWall_
FenceWallDoor_
*/
export const asset_edited_fences : TypeAssetGroupConfig = {
  "src": "./img/asset-edited/fences_fixed.png",
  "group": "Fences",
  "images": list_to_asset([
    // Plein
    "FenceWall_Plein",
    "FenceCorner_Plein",
    // Metal
    "FenceWall_Metal1",
    "FenceWall_Metal2",
    "FenceWall_Metal3",
    "FenceCorner_Metal1",
    // Grille
    "FenceWall_Grille1",
    "FenceWall_Grille2",
    "FenceWall_Grille3",
    "FenceCorner_Grille1",
    "FenceCorner_Grille2",
    // Beton
    "FenceWall_Beton1",
    "FenceWall_Beton2",
    "FenceWall_Beton3",
    "FenceCorner_Beton1",
    "FenceCorner_Beton2",

    "FenceWallDoor_Beton1",
    "FenceWallDoor_Beton2",

    // Door
    "FenceWallDoor_Door1",
    "FenceWallDoor_Door2",

    // Wood
    "FenceWall_WoodPalice1",
    "FenceWall_WoodPalice2",
    "FenceWall_WoodPalice3",
    "FenceWall_Wood1",
    "FenceWall_Wood2",
    "FenceWall_Wood3",
    "FenceWall_Wood4",
    "FenceWall_Wood5",
    "FenceWall_Wood6",

    "FenceCorner_Wood1",
    "FenceCorner_Wood2",
    "FenceCorner_Wood3",
    "FenceCorner_Wood4",
    "FenceCorner_Wood5",
  ]),
  "imgHeight": 224,
  "imgWidth": 192,
}