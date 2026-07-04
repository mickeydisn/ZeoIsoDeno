import { asset_AstroBase } from "@iso-game/mapIso/asset/conf/asset_AstroBase.ts";
import {
  asset_AstroBase3,
  asset_AstroBase5,
} from "@iso-game/mapIso/asset/conf/asset_AstroBase2.ts";
import { asset_AstroPlatform } from "@iso-game/mapIso/asset/conf/asset_AstroPlatform.ts";
import { asset_AstroRocket } from "@iso-game/mapIso/asset/conf/asset_AstroRocket.ts";
import { asset_ItemGrave } from "@iso-game/mapIso/asset/conf/asset_ItemGrave.ts";
import { asset_ItemOther } from "@iso-game/mapIso/asset/conf/asset_ItemOther.ts";
import { asset_ItemPilar } from "@iso-game/mapIso/asset/conf/asset_ItemPilar.ts";
import { asset_ItemTech } from "@iso-game/mapIso/asset/conf/asset_ItemTech.ts";
import { asset_NatureFlower } from "@iso-game/mapIso/asset/conf/asset_NatureFlower.ts";
import { asset_NatureRock } from "@iso-game/mapIso/asset/conf/asset_NatureRock.ts";
import { asset_NatureTree } from "@iso-game/mapIso/asset/conf/asset_NatureTree.ts";
import { asset_Town1 } from "@iso-game/mapIso/asset/conf/asset_Town1.ts";
import { asset_Town2 } from "@iso-game/mapIso/asset/conf/asset_Town2.ts";
import { asset_Train } from "@iso-game/mapIso/asset/conf/asset_Train.ts";
import { asset_persoUserAstro } from "@iso-game/mapIso/asset/confPerso/asset_UserAstro.ts";
import { asset_Wall } from "@iso-game/mapIso/asset/conf/asset_Wall.ts";
import { asset_Grok5 } from "@iso-game/mapIso/asset/conf/grok_a.ts";
import { asset_persoCity } from "@iso-game/mapIso/asset/confPerso/perso_city.ts";
import { asset_persoKenny } from "@iso-game/mapIso/asset/confPerso/perso_kenny.ts";

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
  asset_AstroBase,
  // asset_AstroBase2,
  asset_AstroBase3,
  asset_AstroBase,
  asset_AstroBase5,
  asset_Town1,
  asset_Town2,
  asset_Wall,
  // asset_edited_fences,
  asset_NatureTree,
  asset_NatureFlower,
  asset_NatureRock,
  asset_ItemTech,
  asset_ItemPilar,
  asset_ItemOther,
  asset_ItemGrave,
  asset_AstroPlatform,
  asset_Train,
  asset_AstroRocket,
  asset_Grok5,
];

export const assetPersoConfig: TypeAssetGroupConfig[] = [
  // asset_MyTower,
  // ----------- 8 axes
  asset_persoUserAstro,
  asset_persoKenny,
  asset_persoCity,
];
