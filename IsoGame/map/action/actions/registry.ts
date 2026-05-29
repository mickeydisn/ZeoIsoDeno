
// ─── Block / Frise ────────────────────────────────────────────────────────────
import { setBlocked, setBlockedSquare } from "./block/setBlocked.action.ts";
import { setFrise, setFriseSquare } from "./block/setFrise.action.ts";
import { clearAll, clearAllSquare } from "./block/clearAll.action.ts";

// ─── Item ─────────────────────────────────────────────────────────────────────
import {
  itemAddKey,
  itemForceKey,
  clearItem,
  clearItemSquare,
  temporaryItemsForceKey,
} from "./item/item.actions.ts";

// ─── Level ────────────────────────────────────────────────────────────────────
import {
  clearLvl,
  clearLvlSquare,
  lvlSet,
  lvlUp,
  lvlUpSquare,
  lvlFlatSquare,
  lvlAvgSquare,
  lvlAvgBorder,
  lvlSetShape,
  lvlSetLine,
} from "./lvl/lvl.actions.ts";

// ─── Color ────────────────────────────────────────────────────────────────────
import {
  color,
  colorSquare,
  clearColor,
  clearColorSquare,
  colorLine,
} from "./color/color.actions.ts";

// ─── Color ────────────────────────────────────────────────────────────────────
import {
  colorNoise,
  colorNoiseLine,
  colorNoiseShape,
  colorSmoothShape,
} from "./color/colorNoise.actions.ts";
import { lvlRampShape } from "./lvl/lvlRamp.actions.ts";
import { lvlSmoothBorder } from "./lvl/lvlSmoothBorder.actions.ts";
import { colorGradientShape } from "./color/colorGradientShape.actions.ts";
import { lvlGradientShape } from "./lvl/lvlGradientShape.action.ts";
// ─── Catalogue ────────────────────────────────────────────────────────────────
// Adding a new action = create its module above, then append it here.

export const ACTION_REGISTRY = [
  // block / frise
  setBlocked, 
  setBlockedSquare,
  setFrise, 
  setFriseSquare,
  clearAll, 
  clearAllSquare,
  // item
  itemAddKey,
  itemForceKey,
  clearItem, 
  clearItemSquare,
  temporaryItemsForceKey,

  // level
  clearLvl, 
  clearLvlSquare,
  lvlSet, 
  lvlSetShape,
  lvlSetLine,
  lvlUp, 
  lvlUpSquare,
  lvlFlatSquare,
  lvlAvgSquare,
  lvlAvgBorder,
  // lvlRamp, 
  lvlRampShape,
  lvlSmoothBorder,
  lvlGradientShape,
  // color
  color, 
  colorSquare,
  colorLine,
  clearColor, 
  clearColorSquare,
  // color noise
  colorNoise, 
  colorNoiseShape,
  colorNoiseLine,
  colorSmoothShape,
  colorGradientShape,
 ] as const;


export type RegistryAction = typeof ACTION_REGISTRY[number];

