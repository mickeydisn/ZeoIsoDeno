// -------------------------------------

import {
  setActiveTool,
  setBrushSize,
  setBuildingConfig,
  setBuildingParams,
  setColor,
} from "@iso-game/handlers/game/handler-tools.ts/toolHandlers-attr.ts";
import {
  getAsset,
  setActiveAsset,
} from "@iso-game/handlers/game/handler-tools.ts/toolHandlers-asset.ts";
import { toolClick } from "@iso-game/handlers/game/handler-tools.ts/toolHandlers-action.ts";
import {
  deletePotion,
  savePotion,
  syncInventory,
} from "@iso-game/handlers/game/handler-tools.ts/toolHandlers-potion.ts";

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
