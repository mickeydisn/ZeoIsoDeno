

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

/*
import "../../IsoGame/worker/main/InterfaceModule.ts";
import { initializeActionInterfaceModule } from "../../IsoGame/worker/main/InterfaceModule.ts";
import { World } from "../../IsoGame/word.ts";
import { CanvasMiniMap } from "../../IsoGame/mapIso/canvasMiniMap.ts";
*/

// Global reference to the Workspace instance
let workspaceModuleInstance: AssetWorkspaceModule | null = null;

// --- Helper function to simulate a minimal empty canvas ---
const createEmptyAsset = (label: string): TypeAsset => ({
    group: "empty",
    label: label,
    cimage: new OffscreenCanvas(256, 256),
});

// --- Helper function to create an empty sheet for the workspace ---
const createEmptySheet = (name: string): TypeAssetSheet => ({
    name: name,
    cimage: new OffscreenCanvas(256, 256),
    assets: [
        [
            createEmptyAsset("empty_a"), 
            createEmptyAsset("empty_b"), 
            createEmptyAsset("empty_c"), 
            createEmptyAsset("empty_d")
        ]
    ] as TypeAssetRow[],
});



const editorMenu = new MenuIconModule({
    divId: "menu-icon-container"
});
editorMenu.addIcon('I', 'isogame-module', 'main-content');
editorMenu.addIcon('T', 'isometric-grid-container', 'main-content');
editorMenu.addIcon('S', 'sheet-editor-module', 'main-content');

editorMenu.addIcon('M', 'menu2', 'action-content');




/**
 * 💡 Custom handler for when a user clicks a row in the AssetSelectorModule (Palette).
 * * When triggered, it calls the addRow method on the AssetWorkspaceModule.
 * * @param row The TypeAssetRow selected in the palette.
 */
const handlePaletteRowClickToAdd = (row: TypeAssetRow): void => {
    if (workspaceModuleInstance) {
        
        // 1. Create a deep copy of the row
        // This is crucial! You must copy the row items to avoid modifying the 
        // original palette data when editing the workspace.
        const rowCopy: TypeAssetRow = row.map(asset => ({ ...asset })) as TypeAssetRow;

        // 2. Call the public method on the workspace instance
        workspaceModuleInstance.addRow(rowCopy);

        console.log(`✅ Added new row to workspace from palette! (Row starts with: ${row[0].label})`);
    } else {
        console.error("Workspace module not initialized or accessible.");
    }
};

async function initializeAppWithLinkedModules() {
    // 1. Load assets (The source data for the palette)
    console.log("Loading assets...");
    const assetPalette = await AssetLoaderPallet.create();
    
    // Check if the loader returned any usable sheet
    if (assetPalette.assetSheets.length === 0) {
        console.error("Asset Loader returned no sheets.");
        return;
    }
    // const sourceSheet = assetPalette.assetSheets[0]; 

    // 2. Prepare the Workspace Sheet (The destination data)
    const workspaceSheet = createEmptySheet("My_Custom_Workspace");


    // --- Setup Workspace Module (Destination) ---
    const workspaceDivId = "workspace-container";
    workspaceModuleInstance = new AssetWorkspaceModule({
        assetSheet: workspaceSheet,
        divId: workspaceDivId,
        onSelect: (s) => console.log(`[Workspace State] Selected: ${s.type}`),
        onClickSheet: (asset) => {
            const up = new Uploader();
            up.uploadCanvasImage(asset.cimage, "save/image/", "workspace.png")
        } 
    });
    console.log("Workspace Module Initialized.");


    // --- Setup Palette Selector Module (Source) ---
    const paletteDivId = "palette-container";
    const selectorModuleInstance = new AssetSelectorModule({
        assetSheets: assetPalette.assetSheets,
        divId: paletteDivId,
        onSelect: (s) => console.log(`[Palette State] Selected: ${s.type}`),
        onClickRow: handlePaletteRowClickToAdd,
    });
    console.log("Palette Module Initialized. Click any row in the palette to add it to the workspace!");

    /*
    ISO GRID 
    const isoGrid = initializeIsometricGrid( "isometric-grid-container")
    isoGrid.setHandlers({
        onClick: (x:number, y:number, z:number)  => {
            const asset = workspaceModuleInstance?.activAsset()
            if (asset) {
                return isoGrid.set(x, y, z, asset)
            }
        }
    })
    */

    // --------------
    const sheetModulDiv = document.getElementById("sheet-editor-module") as HTMLElement
    sheetModulDiv.innerHTML = `
        <div id="sheet-editor-container"></div>
    `;
    const assetSheetEditor = createImageEditor("sheet")
    assetSheetEditor.setHandlers({
        onSave: (image) => {
            const sheet : TypeAssetSheet = {
                assets: [],
                name: "Edited Sheet",
                cimage: image.cimage,
            }
            workspaceModuleInstance?.loadSheetCImage(sheet.cimage)
        },
        onLoad:  () => { 
            const sheet = workspaceModuleInstance?.getSheet()
            if (! sheet) return;
            const image : TypeImage = {cimage: sheet.cimage}
            return image
        },
    });


    // initializeActionInterfaceModule('action-module')
    /*
    imageEditor.setHandlers({
        onSave: (_) => console.log(`[Demo Save] image data ready for storage.`),
        onLoad: () : TypeAsset | undefined => { 
            console.log(`[Demo Load] Simulating asynchronous image loading...`);
            return workspaceModuleInstance?.activAsset();
        },
    })
    */

    /*
    const miniMapContainer = document.getElementById("canva-mini-map") as HTMLCanvasElement;

    const world = new World();
    const minimap = new CanvasMiniMap(world,
        miniMapContainer.width,
        miniMapContainer.height,
        miniMapContainer.transferControlToOffscreen()
    )
    minimap.drawUpdate(0, 0)
    */

}


// -----------------------
// -----------------------
// --------------
function createImageEditor(prefix="") {

    const imageModulDiv = document.getElementById(`${prefix}-editor-module`) as HTMLElement
    imageModulDiv.innerHTML = `
    <style>
        .editor-container {
            display:grid;
            grid-template-columns: 1fr .5fr;
            height: calc(100vh - 50px - 54px);
            overflow: hidden;
            gap: 1rem;
        }
        .editor-controle-container {
            height: 100%;
            overflow: scroll;
            padding-right: 1.5rem;             
        }
    </style>
    <div class="editor-container">

        <div id="${prefix}-editor-container" class="editor-pannel-container"></div>
    
        <div class="editor-controle-container">
            <div id="${prefix}-action-butt-container"></div>
    
            <details class="detail-group" open>
                <summary>Mask</summary>
                <div>
                    <div id="${prefix}-mask-one-container"></div>
                </div>
            </details>
            <details class="detail-group">
                <summary>Color Filtering</summary>
                <div>
                    <div id="${prefix}-editor-color-container"></div>
                    <div id="${prefix}-editor-palette-container"></div>
                    <div id="${prefix}-editor-wrap-container"></div>
                    <div id="${prefix}-editor-filter-container"></div>
                    <div id="${prefix}-editor-enhance-container"></div>
                </div>
            </details>
            <details class="detail-group">
                <summary>OutLine</summary>
                <div>
                    <div id="${prefix}-editor-outline-container"></div>
                    <div id="${prefix}-editor-line-container"></div>
                    <div id="${prefix}-editor-color-line-container"></div>
                </div>
            </details>
            <details class="detail-group">
                <summary>Transforme</summary>
                <div>
                    <div id="${prefix}-editor-transformer-container"></div>
                </div>
            </details>
        </div>
    </div>
    `;
    

    const actionButt = new ImageActionModule(`${prefix}-action-butt-container`)
    actionButt.addButton('save', 'Save', ()=> {})

    const imageEditor = initializeEmptyEditor(`${prefix}-editor-container`);

    const plugins = [
        initializeOutlineEditor(`${prefix}-editor-outline-container`),
        initializeLineEditor(`${prefix}-editor-line-container`),
        initializeColorLineEditor(`${prefix}-editor-color-line-container`),
        initializePaletteEditor(`${prefix}-editor-palette-container`),
        initializeColorEditor(`${prefix}-editor-color-container`),
        initializeTransformerEditor(`${prefix}-editor-transformer-container`),
        // initializeEnhanceEditor(`${prefix}-editor-enhance-container`),
        initializeWarpEditor(`${prefix}-editor-wrap-container`),
        initializeFilterEditor(`${prefix}-editor-filter-container`)
    ]

    const masks = [
        initializeMaskBuilder(`${prefix}-mask-one-container`)
    ]

    
    imageEditor.setHandlers({
        onImageChange: (image) => {
            plugins.forEach(p => p.loadImage(image))
        }
    });

    plugins.forEach(p => {
        p.setHandlers({
            onChange: (image) => {
                imageEditor.loadImage(image)
            },
        })   
    });
    masks.forEach(p => {
        p.setHandlers({
            onApply: (image) => {
                imageEditor.loadMask(image)
            },
        })   
    });

    return imageEditor        
}

// -----------------------

// execute this in your main entry point
initializeAppWithLinkedModules();
// -----------------------
// -----------------------
