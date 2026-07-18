import { terrainTools } from "@iso-game/tools/tiles/terrainTools.ts";
import { colorTools } from "@iso-game/tools/tiles/colorTools.ts";
import { assetTools } from "@iso-game/tools/tiles/assetTools.ts";
import { structureTools } from "@iso-game/tools/building/structureTools.ts";
import { potionTools } from "@iso-game/tools/potions/potionTool.ts";
import { layerTools } from "@iso-game/tools/tiles/layerTools.ts";
import { AnyToolAction } from "@iso-game/tools/type.ts";

export const TOOL_ACTION_REGISTRY = [
  ...layerTools,
  ...terrainTools,
  ...colorTools,
  ...assetTools,
  ...structureTools,
  ...potionTools,
] as const as AnyToolAction[];

export type RegistryToolAction = typeof TOOL_ACTION_REGISTRY[number];
