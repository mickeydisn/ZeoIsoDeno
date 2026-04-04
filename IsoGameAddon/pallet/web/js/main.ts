/*


import { initializeEmptyEditor } from "./pallet/ImageEditorModule.ts";
import { AssetLoaderPallet, TypeAsset, TypeAssetRow, TypeAssetSheet } from "./pallet/assetLoaderPallet.ts";
import { AssetSelectorModule } from "./pallet/assetPalletInterface.ts";
import { AssetWorkspaceModule } from "./pallet/assetWorkspace.ts";
import { initializePaletteEditor } from "./pallet/ImageEditorColorPaletteModule.ts";
import { initializeTransformerEditor } from "./pallet/ImageEditorTransformerModule.ts";
import { initializeColorEditor } from "./pallet/ImageEditorColorModule.ts";
import { initializeOutlineEditor } from "./pallet/ImageEditorOutlineModule.ts";
import { initializeLineEditor } from "./pallet/ImageEditorPixelArtLineModule.ts";
import { initializeColorLineEditor } from "./pallet/ImageEditorPixelArtOutlineModule.ts";
import { TypeImage } from "./pallet/ProjectType.ts";
// import { initializeEnhanceEditor } from "./pallet/ImageEditorEnhanceModule.ts";
import { initializeWarpEditor } from "./pallet/ImageEditorWarpModule.ts";
import { initializeFilterEditor } from "./pallet/ImageEditorFilterModule.ts";
import { initializeMaskBuilder } from "./pallet/MaskBuilderModule.ts";
import { MenuIconModule } from "./pallet/MenuIconModule.ts";
import { Uploader } from "./pallet/upload.ts";
import { ImageActionModule } from "./pallet/imageActionModule.ts";

import "../../IsoGame/worker/main/InterfaceModule.ts";
import { initializeActionInterfaceModule } from "../../IsoGame/worker/main/InterfaceModule.ts";
*/
import { World } from "../../../../IsoGame/word.ts";
import { CanvasMiniMap } from "../../../../IsoGame/mapIso/canvasMiniMap.ts";

import { MenuIconModule } from "./pallet/MenuIconModule.ts";


// ----------------------------------------------------------------------------
// Init Header Menu
// ----------------------------------------------------------------------------
const editorMenu = new MenuIconModule({
    divId: "menu-icon-container"
});
editorMenu.addIcon('I', 'isogame-module', 'main-content');
editorMenu.addIcon('T', 'isometric-grid-container', 'main-content');
editorMenu.addIcon('S', 'sheet-editor-module', 'main-content');

editorMenu.addIcon('M', 'menu2', 'action-content');

// ----------------------------------------------------------------------------
// Init MiniMap
// ----------------------------------------------------------------------------
const miniMapContainer = document.getElementById("canva-mini-map") as HTMLCanvasElement;

const world = new World();
const minimap = new CanvasMiniMap(world,
    miniMapContainer.width,
    miniMapContainer.height,
    miniMapContainer.transferControlToOffscreen()
)
minimap.drawUpdate(0, 0)
