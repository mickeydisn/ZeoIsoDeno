import { TilesActions } from "../map/tileActions.ts";
import { MapTool, toolRegistry } from "./toolRegistry.ts";
import { World } from "../word.ts";
import { createTool } from "./toolBuilder.ts";

const tilesActions = TilesActions.getInstance();

export const assetPickerTool = createTool({
  id: "asset_picker",
  name: "Asset Picker",
  icon: "📂",
  category: "asset",
  execute(_x: number, _y: number, _brushSize: number, _world: World) {
    // Asset picker doesn't execute on click - it shows the asset browser
    // The actual placement is done by placeAssetTool
    const activeAsset = toolRegistry.getActiveAssetId();
    console.log(`Asset Picker active with asset: ${activeAsset}`);
    return { activeAsset };
  },
});

export const placeAssetTool = createTool({
  id: "place_asset",
  name: "Place Asset",
  icon: "🖼️",
  category: "asset",
  execute(x: number, y: number, _brushSize: number, _world: World) {
    const assetId = toolRegistry.getActiveAssetId();
    console.log(`Place Asset tool called with assetId: ${assetId}, x: ${x}, y: ${y}`);
    if (assetId) {
      console.log(`Placing asset ${assetId} at (${x}, ${y})`);
      tilesActions.doAction({
        func: "itemForceKey",
        x,
        y,
        assetKey: assetId,
      });
    } else {
      console.log("No asset selected!");
    }
  },
});

export const clearItemsTool = createTool({
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
});

export const assetTools: MapTool[] = [
  assetPickerTool,
  placeAssetTool,
  clearItemsTool,
];