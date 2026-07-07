import { asset_AstroBase } from "./conf/structure/asset_AstroBase.ts";
import {
  asset_AstroBase3,
  asset_AstroBase5,
} from "./conf/structure/asset_AstroBase2.ts";
import { asset_AstroPlatform } from "./conf/items/asset_AstroPlatform.ts";
import { asset_AstroRocket } from "./conf/items/asset_AstroRocket.ts";
import { asset_ItemGrave } from "./conf/items/asset_ItemGrave.ts";
import { asset_ItemOther } from "./conf/items/asset_ItemOther.ts";
import { asset_ItemPilar } from "./conf/items/asset_ItemPilar.ts";
import { asset_ItemTech } from "./conf/items/asset_ItemTech.ts";
import { asset_NatureFlower } from "./conf/environement/asset_NatureFlower.ts";
import { asset_NatureRock } from "./conf/environement/asset_NatureRock.ts";
import { asset_NatureTree } from "./conf/environement/asset_NatureTree.ts";
import { asset_Town1 } from "./conf/structure/asset_Town1.ts";
import { asset_Town2 } from "./conf/structure/asset_Town2.ts";
import { asset_Train } from "./conf/items/asset_Train.ts";
import { asset_persoUserAstro } from "./conf/perso/asset_UserAstro.ts";
import { asset_Wall } from "./conf/structure/asset_Wall.ts";
import { asset_Grok5 } from "./conf/items-single/grok_a.ts";
import { asset_persoCity } from "./conf/perso/perso_city.ts";
import { asset_persoKenny } from "./conf/perso/perso_kenny.ts";
import { asset_fences } from "@iso-game/mapIso/asset/conf/structure/asset_fences.ts";
import { asset_Gemini_Arme } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini_arme.ts";
import { asset_Gemini_Drone } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini_drone.ts";
import { asset_Gemini_ItemOther } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini_items_other.ts";
import { asset_Gemini_Item } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini_items.ts";
import { asset_Gemini_Box } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini_box.ts";
import { asset_Gemini_Organic } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini_organic.ts";
import { asset_Gemini2_G2_1 } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini2_G2.ts";
import { asset_Gemini2_G3_1 } from "@iso-game/mapIso/asset/conf/items-single/asset_gemini2_G3.ts";
import {
  asset_Gemini2_G4_1,
  asset_Gemini2_G4_2,
  asset_Gemini2_G4_3,
} from "@iso-game/mapIso/asset/conf/items-single/asset_gemini2_G4.ts";

export type TypeAssetImageConfig = {
  label: string;
  top?: number;
  "8axes"?: boolean;
};
export type TypeAssetGroupConfig = {
  src: string;
  group: string;
  images: TypeAssetImageConfig[];
  imgHeight: number;
  imgWidth: number;
  imgType?: string;
  scall?: boolean;
};

export const assetOptiConfig: TypeAssetGroupConfig[] = [
  // ---------------
  // environement
  asset_NatureTree,
  asset_NatureFlower,
  asset_NatureRock,
  // ---------------
  // structure
  asset_AstroBase,
  // ---------------
  // asset_AstroBase2,
  asset_AstroBase3,
  asset_AstroBase,
  asset_AstroBase5,
  asset_Town1,
  asset_Town2,
  asset_Wall,
  asset_fences,
  // ---------------
  // items
  asset_ItemTech,
  asset_ItemPilar,
  asset_ItemOther,
  asset_ItemGrave,
  asset_AstroPlatform,
  asset_Train,
  asset_AstroRocket,
  // ---------------
  // items-single
  asset_Grok5,
  asset_Gemini_Arme,
  asset_Gemini_Box,
  asset_Gemini_Drone,
  asset_Gemini_Item,
  asset_Gemini_ItemOther,
  asset_Gemini_Organic,
  asset_Gemini2_G2_1,
  asset_Gemini2_G3_1,
  asset_Gemini2_G4_1,
  asset_Gemini2_G4_2,
  asset_Gemini2_G4_3,
];

export const assetPersoConfig: TypeAssetGroupConfig[] = [
  // ---------------
  // perso
  // ----------- 8 axes
  asset_persoUserAstro,
  asset_persoKenny,
  asset_persoCity,
];
