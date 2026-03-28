import { TilesActions } from "../map/tileActions.ts";
import { MapTool, toolRegistry } from "./toolRegistry.ts";
import { World } from "../word.ts";

const tilesActions = TilesActions.getInstance();

export const assetPickerTool: MapTool = {
  id: "asset_picker",
  name: "Asset Picker",
  icon: "📂",
  category: "asset",
  execute(x: number, y: number, brushSize: number, _world: World) {
    // Asset picker doesn't execute on click - it shows the asset browser
    // The actual placement is done by placeAssetTool
    console.log(`Asset Picker active with asset: ${toolRegistry.getActiveAssetId()}`);
  },
};

export const placeAssetTool: MapTool = {
  id: "place_asset",
  name: "Place Asset",
  icon: "🖼️",
  category: "asset",
  execute(x: number, y: number, _brushSize: number, _world: World) {
    const assetId = toolRegistry.getActiveAssetId();
    if (assetId) {
      tilesActions.doAction({
        func: "itemAddKey",
        x,
        y,
        assetKey: assetId,
      });
    }
  },
};

export const clearItemsTool: MapTool = {
  id: "clear_items",
  name: "Clear Items",
  icon: "🧹",
  category: "asset",
  execute(x: number, y: number, brushSize: number, _world: World) {
    tilesActions.doAction({
      func: "clearItemSquare",
      x,
      y,
      size: brushSize,
    });
  },
};

export const assetTools: MapTool[] = [
  assetPickerTool,
  placeAssetTool,
  clearItemsTool,
];