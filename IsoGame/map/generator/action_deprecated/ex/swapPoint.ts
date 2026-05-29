import { TypeTileActionConfig } from "../tileActions.ts";

export function actionDrawSpawn(x: number, y: number): TypeTileActionConfig[] {
  return [
    { func: "clearItemSquare", x: x, y: y, size: 5 },
    { func: "colorSquare", x: x, y: y, size: 5, color: [128, 128, 128, 255] },

    { func: "lvlFlatSquare", x: x, y: y, size: 5, color: [128, 128, 128, 255] },

    { func: "itemAddKey", x: x, y: y, assetKey: "crypt_NE#_C110_S40_B90" },
    // {func:'setBlocked',  x:x, y:y, isBlock:true},

    {
      func: "itemAddKey",
      x: x + 2,
      y: y,
      assetKey: "fence_planksDouble_NE#_C110_S40_B90",
    },
    {
      func: "itemAddKey",
      x: x + 2,
      y: y,
      assetKey: "columnLarge_NE#_C110_S40_B90",
    },
    { func: "setBlocked", x: x + 2, y: y, isBlock: true },

    {
      func: "itemAddKey",
      x: x - 2,
      y: y,
      assetKey: "columnLarge_SW#_C110_S40_B90",
    },
    {
      func: "itemAddKey",
      x: x - 2,
      y: y,
      assetKey: "fence_planksDouble_SW#_C110_S40_B90",
    },
    { func: "setBlocked", x: x - 2, y: y, isBlock: true },

    {
      func: "itemAddKey",
      x: x,
      y: y + 2,
      assetKey: "fence_planksDouble_NW#_C110_S40_B90",
    },
    {
      func: "itemAddKey",
      x: x,
      y: y + 2,
      assetKey: "columnLarge_NW#_C110_S40_B90",
    },
    { func: "setBlocked", x: x, y: y + 2, isBlock: true },

    {
      func: "itemAddKey",
      x: x,
      y: y - 2,
      assetKey: "columnLarge_SE#_C110_S40_B90",
    },
    {
      func: "itemAddKey",
      x: x,
      y: y - 2,
      assetKey: "fence_planksDouble_SE#_C110_S40_B90",
    },
    { func: "setBlocked", x: x, y: y - 2, isBlock: true },

    { func: "setFriseSquare", x: x, y: y, size: 5, isFrise: true },

    { func: "setFrise", x: x + 2, y: y + 2, isFrise: false },
    { func: "setFrise", x: x + 2, y: y - 2, isFrise: false },
    { func: "setFrise", x: x - 2, y: y + 2, isFrise: false },
    { func: "setFrise", x: x - 2, y: y - 2, isFrise: false },

    { func: "setFrise", x: x + 3, y: y, isFrise: false },
    { func: "setFrise", x: x - 3, y: y, isFrise: false },
    { func: "setFrise", x: x, y: y + 3, isFrise: false },
    { func: "setFrise", x: x, y: y - 3, isFrise: false },


    { func: "clearColorSquare", x: x, y: y, size: 25 },

    { func: "lvlFlatSquare", x: x, y: y, size: 55, color: [128, 128, 128, 255] },
    { func: "lvlAvgBorder", x: x, y: y, size: 55, color: [128, 128, 128, 255] },
    { func: "lvlAvgBorder", x: x, y: y, size: 55, color: [128, 128, 128, 255] },
    { func: "lvlAvgBorder", x: x, y: y, size: 55, color: [128, 128, 128, 255] },
    { func: "lvlAvgBorder", x: x, y: y, size: 55, color: [128, 128, 128, 255] },

  ];
}
