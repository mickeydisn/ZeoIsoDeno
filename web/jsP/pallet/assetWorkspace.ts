import { TypeAssetSheet, TypeAssetRow, TypeAsset } from "./assetLoaderPallet.ts";
import { 
    TypeAssetSelection, 
    AssetSelectorModuleParams // Re-use the parameter type structure
} from "./assetPalletInterface.ts";

// Define the core parameters for the Workspace Module
export interface AssetWorkspaceModuleParams extends Omit<AssetSelectorModuleParams, 'assetSheets'> {
    // We only take a single sheet for editing
    assetSheet: TypeAssetSheet; 
    
    // Callbacks are the same as before
    onClickSheet?: (sheet: TypeAssetSheet) => void;
    onClickRow?: (row: TypeAssetRow) => void;
    onClickItem?: (asset: TypeAsset) => void;
}


const DEFAULT_ASSET: TypeAsset = {
    group: "empty",
    label: "empty_cell",
    cimage: new OffscreenCanvas(256, 256), // Placeholder empty canvas
};
const EMPTY_ROW: TypeAssetRow = [
    DEFAULT_ASSET, 
    DEFAULT_ASSET, 
    DEFAULT_ASSET, 
    DEFAULT_ASSET
];

export class AssetWorkspaceModule {
  // Renaming to be consistent with sheet editor structure (TypeSheetAsset is TypeAssetSheet here)
  private sheet: TypeAssetSheet; 
  private containerDiv: HTMLElement;
  private onSelect: (selection: TypeAssetSelection) => void;
  private readonly zoomScale = 0.5;

  private onClickSheet?: (sheet: TypeAssetSheet) => void;
  private onClickRow?: (row: TypeAssetRow) => void;
  private onClickItem?: (asset: TypeAsset) => void;

  private activeSelection: { rowIndex?: number; itemIndex?: number; asset?: TypeAsset } = {};


  constructor(params: AssetWorkspaceModuleParams) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }

    this.sheet = params.assetSheet;
    this.containerDiv = container;
    this.onSelect = params.onSelect;

    this.onClickSheet = params.onClickSheet;
    this.onClickRow = params.onClickRow;
    this.onClickItem = params.onClickItem;
    
    this.containerDiv.innerHTML = this.getInitialStyles();
    this.renderWorkspace();
  }

  public clearHandler(): void  {
    this.onClickItem = undefined;
    this.onClickRow = undefined;
    this.onClickSheet = undefined;
  }
  
  /**
   * PUBLIC METHOD: Returns the currently active selected asset.
   */
  public activAsset() : TypeAsset | undefined {
    return this.activeSelection.asset;
  }
  
  /**
   * PUBLIC METHOD: Returns the current active selection object.
   */
  public activSection() : { rowIndex?: number; itemIndex?: number; asset?: TypeAsset } | undefined {
    return this.activeSelection;
  }

  /**
   * PUBLIC METHOD: Replaces the entire workspace sheet with a new sheet.
   * This is the requested 'loadSheet(TypeSheetAsset)' function.
   * Note: TypeSheetAsset is aliased as TypeAssetSheet in this module.
   */
  public loadSheet(newSheet: TypeAssetSheet): void {
    console.log(`Loading new sheet: ${newSheet.name}`);
    this.sheet = newSheet;
    this.activeSelection = {}; // Clear selection upon new sheet load
    
    // Re-render the workspace to display the new sheet contents
    this.renderWorkspace();
    
    // Update the summary text for the new sheet name
    const summary = this.containerDiv.querySelector('summary');
    if (summary) {
        summary.textContent = `Workspace: ${this.sheet.name}`;
    }
  }

  /**
   * PUBLIC METHOD: Returns the current sheet data.
   * Rebuilds the combined sheet image (cimage) from all individual asset canvases.
   */
  public getSheet(): TypeAssetSheet {
      // MANDATORY: Rebuild the sheet's combined cimage before returning
      this.rebuildSheetCImage();
      return this.sheet;
  }

  /**
   * PRIVATE METHOD: Rebuilds the single combined image (cimage) for the entire sheet 
   * by drawing all individual assets onto it.
   */
  private rebuildSheetCImage(): void {
    if (this.sheet.assets.length === 0) {
        // Handle empty sheet case
        this.sheet.cimage = new OffscreenCanvas(256, 256);
        return;
    }
    
    // Assuming all assets are 256x256, and sheet is 4 columns wide.
    const assetWidth = this.sheet.assets[0][0]?.cimage?.width || 256;
    const assetHeight = this.sheet.assets[0][0]?.cimage?.height || 256;
    const cols = 4;
    const rows = this.sheet.assets.length;
    
    const totalWidth = cols * assetWidth;
    const totalHeight = rows * assetHeight;

    // Create a new OffscreenCanvas for the combined image
    const combinedCanvas = new OffscreenCanvas(totalWidth, totalHeight);
    const ctx = combinedCanvas.getContext('2d');

    if (!ctx) {
        console.error("Could not get 2D context for combined sheet image.");
        return;
    }

    // Iterate through the rows and assets and draw them onto the combined canvas
    this.sheet.assets.forEach((row, rowIndex) => {
        row.forEach((asset, colIndex) => {
            const sourceCanvas = asset.cimage;
            
            // Check if the asset has a valid canvas to draw
            if (sourceCanvas) {
                const drawX = colIndex * assetWidth;
                const drawY = rowIndex * assetHeight;
                
                // Draw the individual asset canvas onto the combined canvas
                ctx.drawImage(sourceCanvas, drawX, drawY);
            }
        });
    });

    // Update the sheet object's cimage with the newly created combined image
    this.sheet.cimage = combinedCanvas;
    console.log(`Sheet image rebuilt: ${totalWidth}x${totalHeight} pixels.`);
  }

  /**
   * PUBLIC METHOD: Clears and rebuilds the this.sheet.assets array based on the 
   * current combined sheet image (this.sheet.cimage).
   * * NOTE: This assumes all assets are 256x256 and the grid is 4 columns wide.
   */
  public loadSheetCImage(cimage: OffscreenCanvas): void {
    this.sheet.cimage = cimage;
    const sourceCanvas = cimage;
    if (!sourceCanvas) {
        console.warn("Cannot load sheet from cimage: cimage is null or undefined.");
        this.sheet.assets = [];
        this.renderWorkspace();
        return;
    }

    const assetWidth = 256; // Standard asset width as per rebuildSheetCImage logic
    const assetHeight = 256; // Standard asset height as per rebuildSheetCImage logic
    const cols = 4;
    const totalWidth = sourceCanvas.width;
    const totalHeight = sourceCanvas.height;

    // Check if total width is a multiple of 4 columns of 256px
    if (totalWidth % assetWidth !== 0 || totalWidth !== cols * assetWidth) {
        console.error(`CImage width (${totalWidth}px) is not compatible with a ${cols}-column grid of ${assetWidth}px assets.`);
        // Clear assets but do not attempt to rebuild
        this.sheet.assets = [];
        this.renderWorkspace();
        return;
    }

    // Clear the existing assets array
    this.sheet.assets = [];
    
    // Calculate the number of rows
    const rows = Math.floor(totalHeight / assetHeight);

    console.log(`Rebuilding sheet assets from cimage: ${rows} rows detected.`);

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        const newRow: TypeAsset[] = [];
        const y = rowIndex * assetHeight;

        for (let colIndex = 0; colIndex < cols; colIndex++) {
            const x = colIndex * assetWidth;
            
            // 1. Create a new OffscreenCanvas by slicing the combined image
            const assetCanvas = createOffscreenCanvasFromImage(
                sourceCanvas, 
                x, y, 
                assetWidth, assetHeight
            );
            
            // 2. Create a new TypeAsset object
            const newAsset: TypeAsset = {
                group: this.sheet.name, // Use sheet name as default group
                label: `cell_${rowIndex}_${colIndex}`, // Generate a temporary label
                cimage: assetCanvas,
            };
            newRow.push(newAsset);
        }
        this.sheet.assets.push(newRow as TypeAssetRow);
    }

    // Re-render the workspace to display the new grid contents
    this.renderWorkspace();
    console.log(`Sheet assets array rebuilt with ${this.sheet.assets.length} rows.`);
  }

  // --- UI Rendering ---

  private getInitialStyles(): string {
    return `
      <style>
        .sheet-control-panel {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .sheet-control-panel button {
            padding: 8px 15px;
            background-color: #00796b; /* Teal */
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
        }
        .sheet-control-panel button:hover {
            background-color: #004d40;
        }
        .asset-grid-container {
            container-type: inline-size;
            border: 1px solid #555;
            padding: 5px;
            max-height: 70vh;
            overflow-y: auto;
        }
        .asset-row-wrapper {
            display: flex;
            border-bottom: 1px solid #333;
        }
        @container (max-width: 500px) {
          .asset-row-wrapper {
            zoom:.8;
          }
        }
        @container (max-width: 430px) {
          .asset-row-wrapper {
            zoom:.6;
          }
        }
        @container (max-width: 273px) {
          .asset-row-wrapper {
            zoom:.5;
          }
        }
        .asset-grid {
            display: grid;
            grid-template-columns: repeat(4, auto);
            gap: 0;
            flex-grow: 1; /* Takes up most space */
        }
        .row-controls {
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            padding: 0 5px;
            background: #333;
        }
        .row-controls button {
            background: #555;
            color: white;
            border: none;
            padding: 4px;
            margin: 2px 0;
            cursor: pointer;
        }
        .row-controls button:hover {
            background: #777;
        }
        /* Selection Styles (Same as before) */
        .selected-row .asset-item-wrapper {
          background-color: #004d40;
        }
        .selected-item {
          border: 2px solid #4db6ac !important;
          background-color: #263238;
        }
        .asset-item-wrapper {
          border: 1px solid transparent;
          transition: border-color 0.1s;
        }
      </style>
      <details class="module-card">
        <summary>Workspace: ${this.sheet.name}</summary>
        
        <div class="sheet-control-panel">
            <button id="add-row-btn">Add Empty Row</button>
            <button id="use-sheet-btn" ${!this.onClickSheet ? 'disabled' : ''}>Use Sheet</button>
        </div>
        
        <div id="asset-grid-view" class="asset-grid-container"></div>
      </details>
    `;
  }

  /**
   * Main render function to draw the grid and controls.
   */
  private renderWorkspace(): void {
    const gridContainer = this.containerDiv.querySelector('#asset-grid-view');
    const addRowBtn = this.containerDiv.querySelector('#add-row-btn') as HTMLButtonElement;
    
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    
    // Update summary text in case it changed (e.g., after loading a new sheet)
    const summary = this.containerDiv.querySelector('summary');
    if (summary) {
        summary.textContent = `Workspace: ${this.sheet.name}`;
    }

    // Attach sheet-level controls
    if (addRowBtn) {
        addRowBtn.onclick = () => this.addRow(EMPTY_ROW);
    }

    // Attach Use Sheet button if callback exists
    const useSheetBtn = this.containerDiv.querySelector('#use-sheet-btn') as HTMLButtonElement;
    if (useSheetBtn) {
        if (this.onClickSheet) {
            useSheetBtn.onclick = (e) => {
                e.preventDefault();
                this.rebuildSheetCImage();
                this.onClickSheet!(this.sheet);
            };
            useSheetBtn.disabled = false;
        } else {
            useSheetBtn.disabled = true;
        }
    }

    // Render Rows
    this.sheet.assets.forEach((row, rowIndex) => {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'asset-row-wrapper';
      rowWrapper.dataset.rowIndex = String(rowIndex);
      
      const gridDiv = document.createElement('div');
      gridDiv.className = 'asset-grid';
      
      // Attach row click handler (to the grid part)
      gridDiv.onclick = (e) => this.handleRowSelection(e, row, rowIndex);

      // Render cells
      row.forEach((asset, itemIndex) => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'asset-item-wrapper';
        itemWrapper.dataset.itemIndex = String(itemIndex);
        
        // Use the OffscreenCanvas directly
        const canvas = asset.cimage;
        const displayCanvas = document.createElement('canvas');
        // Set display size based on zoomScale
        displayCanvas.width = canvas.width * this.zoomScale;
        displayCanvas.height = canvas.height * this.zoomScale;
        
        const ctx = displayCanvas.getContext('2d');
        if (ctx) {
          // Draw the OffscreenCanvas content onto the visible canvas
          ctx.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
        }

        // Attach item click handler
        itemWrapper.onclick = (e) => this.handleItemSelection(e, asset, rowIndex, itemIndex, itemWrapper);

        itemWrapper.appendChild(displayCanvas);
        gridDiv.appendChild(itemWrapper);
      });
      
      // Render row manipulation controls
      rowWrapper.appendChild(gridDiv);
      rowWrapper.appendChild(this.renderRowControls(rowIndex));
      gridContainer.appendChild(rowWrapper);
    });
    
    // Re-apply selection state after re-render
    this.applySelectionStyles();
  }

  /**
   * Renders the Move/Delete buttons for a row.
   */
  private renderRowControls(rowIndex: number): HTMLElement {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'row-controls';

    const maxIndex = this.sheet.assets.length - 1;
    
    // Up Button
    const upBtn = document.createElement('button');
    upBtn.textContent = '▲';
    upBtn.disabled = rowIndex === 0;
    upBtn.onclick = (e) => {
      e.stopPropagation();
      this.moveRowUp(rowIndex);
    };

    // Down Button (using Up function logic for simplicity)
    const downBtn = document.createElement('button');
    downBtn.textContent = '▼';
    downBtn.disabled = rowIndex === maxIndex;
    downBtn.onclick = (e) => {
      e.stopPropagation();
      this.moveRowUp(rowIndex + 1); // Move the row below up to the current position
    };

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✖';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.deleteRow(rowIndex);
    };

    controlsDiv.appendChild(upBtn);
    controlsDiv.appendChild(downBtn);
    controlsDiv.appendChild(deleteBtn);
    
    return controlsDiv;
  }
  
  // --- Workspace Manipulation Methods ---

  /**
   * Moves a row from the source index up one position.
   */
  moveRowUp(sourceIndex: number): void {
    if (sourceIndex > 0 && sourceIndex < this.sheet.assets.length) {
      const [movedRow] = this.sheet.assets.splice(sourceIndex, 1);
      this.sheet.assets.splice(sourceIndex - 1, 0, movedRow);
      this.renderWorkspace(); // Re-render the entire grid
    }
  }

  /**
   * Deletes a row at the specified index.
   */
  deleteRow(index: number): void {
    if (index >= 0 && index < this.sheet.assets.length) {
      this.sheet.assets.splice(index, 1);
      this.renderWorkspace();
    }
  }

  /**
   * Adds a TypeAssetRow to the end of the sheet.
   */
  addRow(row: TypeAssetRow): void {
    this.sheet.assets.push(row);
    this.renderWorkspace();
  }

  /**
   * Replaces the content of a specific cell (TypeAsset) at coordinates (x, y).
   * @param asset The new TypeAsset to insert.
   * @param x The column index (0-3).
   * @param y The row index.
   */
  replaceCell(asset: TypeAsset, x: number, y: number): void {
    if (y >= 0 && y < this.sheet.assets.length && x >= 0 && x < 4) {
      this.sheet.assets[y][x] = asset;
      this.renderWorkspace(); // Re-render to show the new cell content
    }
  }
  
  // --- Selection and Event Handling ---
  
  private clearSelections(): void {
    this.containerDiv.querySelectorAll('.selected-row, .selected-item').forEach(el => 
        el.classList.remove('selected-row', 'selected-item')
    );
  }

  private handleRowSelection(e: MouseEvent, row: TypeAssetRow, rowIndex: number): void {
    e.stopPropagation();

    // Execute user-defined callback if provided
    if (this.onClickRow) {
      this.onClickRow(row);
    }
    
    // Clear existing selections and apply new visual selection
    this.clearSelections();
    // Select all 4 cells within the clicked row-wrapper
    (e.currentTarget as HTMLElement)
        .closest('.asset-row-wrapper')!
        .querySelectorAll('.asset-item-wrapper')
        .forEach(el => el.classList.add('selected-row'));

    this.activeSelection = { rowIndex };
    
    // Call main selection handler
    this.onSelect({
      type: 'row',
      sheetName: this.sheet.name,
      rowIndex: rowIndex,
    });
  }

  private handleItemSelection(e: MouseEvent, asset: TypeAsset, rowIndex: number, itemIndex: number, itemElement: HTMLElement): void {
    e.stopPropagation();
    
    // Execute user-defined callback if provided
    if (this.onClickItem) {
      this.onClickItem(asset);
    }
    
    // Clear existing selections and apply new visual selection
    this.clearSelections();
    itemElement.classList.add('selected-item');
    
    this.activeSelection = { rowIndex, itemIndex, asset };

    // Call main selection handler
    this.onSelect({
      type: 'item',
      sheetName: this.sheet.name,
      rowIndex: rowIndex,
      itemLabel: asset.label,
      asset: asset,
    });
  }
  
  private applySelectionStyles(): void {
      this.clearSelections();
      const { rowIndex, itemIndex } = this.activeSelection;
      
      if (rowIndex !== undefined && itemIndex !== undefined) {
          // Re-apply item selection
          const itemElement = this.containerDiv.querySelector(
              `.asset-row-wrapper[data-row-index="${rowIndex}"] .asset-item-wrapper[data-item-index="${itemIndex}"]`
          );
          if (itemElement) {
              itemElement.classList.add('selected-item');
          }
      } else if (rowIndex !== undefined) {
          // Re-apply row selection
          const rowElement = this.containerDiv.querySelector(
              `.asset-row-wrapper[data-row-index="${rowIndex}"]`
          );
          if (rowElement) {
               rowElement.querySelectorAll('.asset-item-wrapper').forEach(el => el.classList.add('selected-row'));
          }
      }
  }
}


// Add new utility function to create an OffscreenCanvas from a source image/canvas
// This is needed to populate the new TypeAsset with a canvas slice.
function createOffscreenCanvasFromImage(source: OffscreenCanvas | HTMLImageElement | HTMLCanvasElement, x: number, y: number, width: number, height: number): OffscreenCanvas {
  const newCanvas = new OffscreenCanvas(width, height);
  const ctx = newCanvas.getContext('2d');
  if (ctx) {
      // Draw the specific section of the source onto the new canvas
      ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
  }
  return newCanvas;
}