// -------------------------------------

import {
  setActiveTool,
  setBrushSize,
  setBuildingConfig,
  setBuildingParams,
  setColor,
} from "./toolHandlers-attr.ts";
import { getAsset, setActiveAsset } from "./toolHandlers-asset.ts";
import { toolClick } from "./toolHandlers-action.ts";
import {
  deletePotion,
  savePotion,
  syncInventory,
} from "./toolHandlers-potion.ts";

export const toolHandlers = [
  // action handlers
  toolClick,
  // attribute handlers
  setActiveTool,
  setBrushSize,
  setColor,
  setBuildingConfig,
  setBuildingParams,
  // asset handlers
  setActiveAsset,
  getAsset,
  // potion handlers
  syncInventory,
  savePotion,
  deletePotion,
] as const;
