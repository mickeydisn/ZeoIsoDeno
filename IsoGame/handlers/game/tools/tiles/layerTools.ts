import { defineTool, ToolConfigBrush } from "../type.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";

import { cmd } from "@iso-game/map/action/builder/cmd.ts";
import { TilesActions } from "@iso-game/map/action/tilesActions.ts";
const tilesActions = TilesActions.getInstance();

export const BlockLayerTool = defineTool<"block_layer", ToolConfigBrush>(
  "block_layer",
  "Block Layer",
  "❌",
  "layer",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.setBlocked({
        x: conf.x,
        y: conf.y,
        isBlock: true,
      }));
    } else {
      tilesActions.doAction(cmd.setBlockedSquare({
        x: conf.x,
        y: conf.y,
        isBlock: true,
        size: conf.brushSize,
      }));
    }
  },
);
export const UnBlockLayerTool = defineTool<"unblock_layer", ToolConfigBrush>(
  "unblock_layer",
  "UnBlock Layer",
  "❎",
  "layer",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.setBlocked({
        x: conf.x,
        y: conf.y,
        isBlock: false,
      }));
    } else {
      tilesActions.doAction(cmd.setBlockedSquare({
        x: conf.x,
        y: conf.y,
        isBlock: false,
        size: conf.brushSize,
      }));
    }
  },
);

export const FriseLayerTool = defineTool<"frise_layer", ToolConfigBrush>(
  "frise_layer",
  "Frise Layer",
  "❄️",
  "layer",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.setFrise({
        x: conf.x,
        y: conf.y,
        isFrise: true,
      }));
    } else {
      tilesActions.doAction(cmd.setFriseSquare({
        x: conf.x,
        y: conf.y,
        isFrise: true,
        size: conf.brushSize,
      }));
    }
  },
);

export const UnFriseLayerTool = defineTool<"unfrise_layer", ToolConfigBrush>(
  "unfrise_layer",
  "UnFrise Layer",
  "☀️",
  "layer",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    if (conf.brushSize <= 1) {
      tilesActions.doAction(cmd.setFrise({
        x: conf.x,
        y: conf.y,
        isFrise: false,
      }));
    } else {
      tilesActions.doAction(cmd.setFriseSquare({
        x: conf.x,
        y: conf.y,
        isFrise: false,
        size: conf.brushSize,
      }));
    }
  },
);
export const layerTools = [
  BlockLayerTool,
  UnBlockLayerTool,
  FriseLayerTool,
  UnFriseLayerTool,
];

/*

raise_terrain
lower_terrain
flatten
smooth
plateau
*/
