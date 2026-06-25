import { asset_AstroBase } from "./conf/asset_AstroBase.ts";
import {
  asset_AstroBase2,
  asset_AstroBase3,
  asset_AstroBase5,
} from "./conf/asset_AstroBase2.ts";
import { asset_AstroPlatform } from "./conf/asset_AstroPlatform.ts";
import { asset_AstroRocket } from "./conf/asset_AstroRocket.ts";
import { asset_edited_fences } from "./conf/asset_edited_Fences.ts";
import { asset_ItemGrave } from "./conf/asset_ItemGrave.ts";
import { asset_ItemOther } from "./conf/asset_ItemOther.ts";
import { asset_ItemPilar } from "./conf/asset_ItemPilar.ts";
import { asset_ItemTech } from "./conf/asset_ItemTech.ts";
import { asset_MyTower } from "./conf/asset_MyTower.ts";
import { asset_NatureFlower } from "./conf/asset_NatureFlower.ts";
import { asset_NatureRock } from "./conf/asset_NatureRock.ts";
import { asset_NatureTree } from "./conf/asset_NatureTree.ts";
import { asset_Town1 } from "./conf/asset_Town1.ts";
import { asset_Town2 } from "./conf/asset_Town2.ts";
import { asset_Train } from "./conf/asset_Train.ts";
import { asset_UserAstro } from "./conf/asset_UserAstro.ts";
import { asset_Wall } from "./conf/asset_Wall.ts";
import { asset_Grok5 } from "./conf/grok_a.ts";
import { asset_persoCity } from "@iso-game/mapIso/asset/conf/perso_city.ts";

export type TypeAssetImageConfig = {
  label: string;
  top: number;
  "8axes"?: boolean;
};
export type TypeAssetGroupConfig = {
  src: string;
  group: string;
  images: TypeAssetImageConfig[];
  imgHeight: number;
  imgWidth: number;
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
  asset_persoCity,

  // asset_MyTower,
  asset_UserAstro,

  // ----------- 8 axes
  {
    "src": "./img/asset-opti/UserAstro.png",
    "group": "UserAstro",
    "images": [
      {
        "label": "astronautA-1",
        "8axes": true,
        "top": 0,
      },
      {
        "label": "astronautA-3",
        "8axes": true,
        "top": 224,
      },
      {
        "label": "astronautA-2",
        "8axes": true,
        "top": 448,
      },
    ],
    "imgHeight": 224,
    "imgWidth": 192,
  },
  {
    "src": "./img/asset-opti/MyPerso2.png",
    "group": "MyPerso2",
    "images": [
      {
        "label": "astronautB",
        "8axes": true,
        "top": 0,
      },
      {
        "label": "digger",
        "8axes": true,
        "top": 224,
      },
      {
        "label": "vampire",
        "8axes": true,
        "top": 448,
      },
      {
        "label": "zombie",
        "8axes": true,
        "top": 672,
      },
      {
        "label": "astronautA",
        "8axes": true,
        "top": 896,
      },
      {
        "label": "ghost",
        "8axes": true,
        "top": 1120,
      },
      {
        "label": "skeleton",
        "8axes": true,
        "top": 1344,
      },
      {
        "label": "alien",
        "8axes": true,
        "top": 1568,
      },
    ],
    "imgHeight": 224,
    "imgWidth": 192,
  },
];
