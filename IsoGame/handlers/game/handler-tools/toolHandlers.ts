// -------------------------------------

import {
  setActiveTool,
  setBrushSize,
  setBuildingConfig,
  setBuildingParams,
  setColor,
} from "@iso-game/handlers/game/handler-tools/toolHandlers-attr.ts";
import {
  getAsset,
  setActiveAsset,
} from "@iso-game/handlers/game/handler-tools/toolHandlers-asset.ts";
import { toolClick } from "@iso-game/handlers/game/handler-tools/toolHandlers-action.ts";
import {
  deletePotion,
  savePotion,
  syncInventory,
} from "@iso-game/handlers/game/handler-tools/toolHandlers-potion.ts";
import { setIsoConfigLayer } from "@iso-game/handlers/game/handler/handlers-view.ts";

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
  // view handlers
  setIsoConfigLayer,
] as const;
