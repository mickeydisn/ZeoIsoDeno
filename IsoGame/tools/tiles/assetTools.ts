import { defineTool, ToolConfigBrush } from "@iso-game/tools/type.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";

import { toolRegistry } from "@iso-game/tools/toolRegistry.ts";

import { cmd } from "@iso-game/map/action/builder/cmd.ts";
import { TilesActions } from "@iso-game/map/action/tilesActions.ts";

const tilesActions = TilesActions.getInstance();

export const assetPickerTool = defineTool<"asset_picker", ToolConfigBrush>(
  "asset_picker",
  "Asset Picker",
  "📂",
  "asset",
  (_conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    // Asset picker doesn't execute on click - it shows the asset browser
    // The actual placement is done by placeAssetTool
    const activeAsset = toolRegistry.getActiveAssetId();
    console.log(`Asset Picker active with asset: ${activeAsset}`);
    return { activeAsset };
  },
);

export const placeAssetTool = defineTool<"place_asset", ToolConfigBrush>(
  "place_asset",
  "Place Asset",
  "🖼️",
  "asset",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    const assetId = toolRegistry.getActiveAssetId();
    console.log(
      `Place Asset tool called with asset${assetId}, x: ${conf.x}, y: ${conf.y}`,
    );
    if (assetId) {
      console.log(`Placing asset ${assetId} at (${conf.x}, ${conf.y})`);
      tilesActions.doAction(cmd.itemForceKey({
        x: conf.x,
        y: conf.y,
        assetKey: assetId,
      }));
    } else {
      console.log("No asset selected!");
    }
  },
);

export const clearItemsTool = defineTool<"clear_items", ToolConfigBrush>(
  "clear_items",
  "Clear Items",
  "🧹",
  "asset",
  (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    tilesActions.doAction(cmd.clearItemSquare({
      x: conf.x,
      y: conf.y,
      size: conf.brushSize,
    }));
  },
);

export const assetTools = [
  assetPickerTool,
  placeAssetTool,
  clearItemsTool,
];
