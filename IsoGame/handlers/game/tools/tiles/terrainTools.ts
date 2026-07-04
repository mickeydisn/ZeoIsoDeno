import { FactoryMap } from "../../../../map/factory/factoryMap.ts";
import { defineTool, ToolConfigBrush } from "../type.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";

import { cmd } from "@iso-game/map/action/builder/cmd.ts";
import { TilesActions } from "@iso-game/map/action/tilesActions.ts";
const tilesActions = TilesActions.getInstance();

export const raiseTerrainTool = defineTool<"raise_terrain", ToolConfigBrush>(
  "raise_terrain",
  "Raise Terrain",
  "⬆️",
  "terrain",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.lvlUp({
        x: conf.x,
        y: conf.y,
        lvl: 1,
      }));
    } else {
      tilesActions.doAction(cmd.lvlUpSquare({
        x: conf.x,
        y: conf.y,
        lvl: 1,
        size: conf.brushSize,
      }));
    }
  },
);

export const lowerTerrainTool = defineTool<"lower_terrain", ToolConfigBrush>(
  "lower_terrain",
  "Lower Terrain",
  "⬇️",
  "terrain",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.lvlUp({
        x: conf.x,
        y: conf.y,
        lvl: -1,
      }));
    } else {
      tilesActions.doAction(cmd.lvlUpSquare({
        x: conf.x,
        y: conf.y,
        lvl: -1,
        size: conf.brushSize,
      }));
    }
  },
);

export const flattenTool = defineTool<"flatten", ToolConfigBrush>(
  "flatten",
  "Flatten",
  "⏹️",
  "terrain",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    tilesActions.doAction(cmd.lvlFlatSquare({
      x: conf.x,
      y: conf.y,
      size: conf.brushSize,
    }));
  },
);

export const smoothTool = defineTool<"smooth", ToolConfigBrush>(
  "smooth",
  "Smooth",
  "〰️",
  "terrain",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    tilesActions.doAction(cmd.lvlAvgSquare({
      x: conf.x,
      y: conf.y,
      size: conf.brushSize,
    }));
  },
);

export const byStepTool = defineTool<"lvlByStep", ToolConfigBrush>(
  "lvlByStep",
  "lvlByStep",
  "📶",
  "terrain",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    tilesActions.doAction(cmd.lvlByStep({
      x: conf.x,
      y: conf.y,
      size: conf.brushSize,
    }));
  },
);

// Plateau tool uses two-click interaction
let plateauTargetLevel: number | null = null;
let _plateauStartPos: { x: number; y: number } | null = null;

export const plateauTool = defineTool<"plateau", ToolConfigBrush>(
  "plateau",
  "Plateau",
  "🏔️",
  "terrain",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    const fm = FactoryMap.getInstance();
    if (plateauTargetLevel === null) {
      // First click: store target level
      const tile = fm.getTile(conf.x, conf.y);
      plateauTargetLevel = tile.lvl;
      _plateauStartPos = { x: conf.x, y: conf.y };
      console.log(`Plateau: Target level set to ${plateauTargetLevel}`);
    } else {
      // Second click: flatten to target level
      tilesActions.doAction(cmd.lvlFlatSquare({
        x: conf.x,
        y: conf.y,
        size: conf.brushSize,
      }));
      // Then set all tiles in area to target level
      tilesActions.doAction(cmd.lvlUpSquare({
        x: conf.x,
        y: conf.y,
        lvl: plateauTargetLevel - fm.getTile(conf.x, conf.y).lvl,
        size: conf.brushSize,
      }));

      console.log(`Plateau: Flattened to level ${plateauTargetLevel}`);
      // Reset state
      plateauTargetLevel = null;
      _plateauStartPos = null;
    }
  },
);

export function resetPlateauState() {
  plateauTargetLevel = null;
  _plateauStartPos = null;
}

export const terrainTools = [
  raiseTerrainTool,
  lowerTerrainTool,
  flattenTool,
  byStepTool,
  smoothTool,
  plateauTool,
];

/*

raise_terrain
lower_terrain
flatten
smooth
plateau
*/
