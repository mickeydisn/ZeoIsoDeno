
import { TypeAssetSheet, TypeAssetRow, TypeAsset } from "./assetLoaderPallet.ts";

/**
 * Interface for the selection event payload (for the main onSelect handler).
 */
export type TypeAssetSelection = {
  type: "sheet" | "row" | "item";
  sheetName: string;
  rowIndex?: number;
  itemLabel?: string;
  asset?: TypeAsset; // Only present for 'item' selection
};

/**
 * Defines the parameters for initializing the AssetSelectorModule,
 * including new optional click handlers.
 */
export interface AssetSelectorModuleParams {
  assetSheets: TypeAssetSheet[];
  divId: string;
  // Main, required callback for state change/selection notification
  onSelect: (selection: TypeAssetSelection) => void; 
  
  // New Optional Callbacks (User-defined functions for specific click actions)
  onClickSheet?: (sheet: TypeAssetSheet) => void;
  onClickRow?: (row: TypeAssetRow) => void;
  onClickItem?: (asset: TypeAsset) => void;
}




export class AssetSelectorModule {
    private assetSheets: TypeAssetSheet[];
    private containerDiv: HTMLElement;
    private onSelect: (selection: TypeAssetSelection) => void;
    private readonly zoomScale = 0.5; // 50% zoom as required
  
    // New optional handler properties
    private onClickSheet?: (sheet: TypeAssetSheet) => void;
    private onClickRow?: (row: TypeAssetRow) => void;
    private onClickItem?: (asset: TypeAsset) => void;
  
    /**
     * Initializes the module and stores the optional callbacks.
     */
    constructor(params: AssetSelectorModuleParams) {
      const container = document.getElementById(params.divId);
      if (!container) {
        throw new Error(`DOM element with ID "${params.divId}" not found.`);
      }
  
      this.assetSheets = params.assetSheets;
      this.containerDiv = container;
      this.onSelect = params.onSelect;
      
      // Store optional callbacks
      this.onClickSheet = params.onClickSheet;
      this.onClickRow = params.onClickRow;
      this.onClickItem = params.onClickItem;
  
      this.containerDiv.innerHTML = this.getInitialStyles();
      this.renderSheets();
    }
  
    public clearHandler(): void  {
        this.onClickItem = undefined;
        this.onClickRow = undefined;
        this.onClickSheet = undefined;
    }

    /**
     * Provides the necessary CSS styles (unchanged, but included for completeness).
     */
    private getInitialStyles(): string {
      return `
        <style>
          .asset-sheet-summary {
            container-type: inline-size;
            margin-bottom: 15px;
            border: 1px solid #555;
            border-radius: 4px;
          }
          .asset-sheet-header {
              display: inline-flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px;
              cursor: pointer;
          }
          .sheet-action-button {
              padding: 4px 8px;
              margin-left: 10px;
              background-color: #00796b; /* Teal */
              border: none;
              color: white;
              border-radius: 3px;
              cursor: pointer;
          }
          .sheet-action-button:hover {
              background-color: #004d40;
          }


          .asset-sheet-content {
            padding: 5px;
            display: grid;
            grid-template-columns: repeat(4, auto); 
            gap: 0;
            overflow-x: auto;
            border-top: 1px solid #555;
            zoom:1;
            min-width:100px;
          }
          @container (max-width: 500px) {
            .asset-sheet-content {
              zoom:.8;
            }
          }
          @container (max-width: 430px) {
            .asset-sheet-content {
              zoom:.6;
            }
          }
          @container (max-width: 273px) {
            .asset-sheet-content {
              zoom:.5;
            }
          }

          .asset-row {
            display: contents;
          }
          .asset-item-wrapper {
            border: 1px solid transparent;
            transition: border-color 0.1s;
            cursor: pointer;
          }
          /* Selection Styles */
          .selected-sheet > summary, .selected-row {
            background-color: #004d40;
          }
          .selected-item {
            border-color: #4db6ac !important;
            background-color: #263238;
          }
          /* Hover Styles */
          .asset-item-wrapper:hover {
            border-color: #90a4ae;
          }
          /* Ensure row-level click targets the wrappers for hover feedback */
          .asset-row:hover > .asset-item-wrapper {
              background-color: #444;
          }
        </style>
        <div class="module-card">
          <h2>Asset Palette Selector</h2>
          <div id="sheet-list"></div>
        </div>
      `;
    }
  
    /**
     * Renders the list of asset sheets, adding a button if onClickSheet is defined.
     */
    private renderSheets(): void {
      const listContainer = this.containerDiv.querySelector('#sheet-list');
      if (!listContainer) return;
      
      this.assetSheets.forEach((sheet) => {
        const sheetDetails = document.createElement('details');
        sheetDetails.className = 'asset-sheet-summary';
        sheetDetails.dataset.sheetName = sheet.name;
        
        const summary = document.createElement('summary');
        const headerDiv = document.createElement('div');
        headerDiv.className = 'asset-sheet-header';
        
        // Sheet Title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = `Sheet: ${sheet.name} (${sheet.assets.length} rows)`;
        headerDiv.appendChild(titleSpan);
  
        // 1. Add optional button for onClickSheet
        if (this.onClickSheet) {
          const button = document.createElement('button');
          button.textContent = "Use Sheet";
          button.className = 'sheet-action-button';
          button.onclick = (e) => {
            e.stopPropagation(); // Prevent <details> toggle
            this.onClickSheet!(sheet); // Execute user-defined callback
          };
          headerDiv.appendChild(button);
        }
  
        // Default selection handler for the entire sheet (clicking the title/header area)
        headerDiv.onclick = () => this.handleSheetSelection(sheet, sheetDetails);
  
        summary.appendChild(headerDiv);
        sheetDetails.appendChild(summary);
  
        // ... (Grid Container rendering logic remains the same)
        const gridContainer = document.createElement('div');
        gridContainer.className = 'asset-sheet-content';
  
        sheet.assets.forEach((row, rowIndex) => {
          const rowDiv = document.createElement('div');
          rowDiv.className = 'asset-row';
          rowDiv.dataset.rowIndex = String(rowIndex);
          
          // 2. Row           
          row.forEach((asset) => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = 'asset-item-wrapper';
            itemWrapper.dataset.itemLabel = asset.label;
            
            const canvas = asset.cimage;
            const displayCanvas = document.createElement('canvas');
            displayCanvas.width = canvas.width * this.zoomScale;
            displayCanvas.height = canvas.height * this.zoomScale;
            
            const ctx = displayCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
            }
  
            // 3. Item Click Handler
            itemWrapper.onclick = (e) => this.handleItemSelection(e, sheet, rowIndex, asset, itemWrapper);
  
            itemWrapper.appendChild(displayCanvas);
            rowDiv.appendChild(itemWrapper);
          });
  
          gridContainer.appendChild(rowDiv);
        });
  
        sheetDetails.appendChild(gridContainer);
        listContainer.appendChild(sheetDetails);
      });
    }
    
    // --- Selection Handlers (Modified to use optional callbacks) ---
  
    private handleSheetSelection(sheet: TypeAssetSheet, sheetElement: HTMLElement): void {
      // Note: The onClickSheet is now handled by the button, this handles clicking the title area.
      
      // Clear existing selections and apply new visual selection
      this.clearSelections();
      sheetElement.classList.add('selected-sheet');
      
      // Call main selection handler
      this.onSelect({
        type: 'sheet',
        sheetName: sheet.name,
      });
    }
    
    private handleItemSelection(e: MouseEvent, sheet: TypeAssetSheet, rowIndex: number, asset: TypeAsset, itemElement: HTMLElement): void {
      e.stopPropagation();
      
      // Execute user-defined callback if provided
      if (this.onClickItem) {
        this.onClickItem(asset);
      }
      if (this.onClickRow) {
        this.onClickRow(sheet.assets[rowIndex]);
      }
      
      // Clear existing selections and apply new visual selection
      this.clearSelections();
      itemElement.classList.add('selected-item');
  
      // Call main selection handler
      this.onSelect({
        type: 'item',
        sheetName: sheet.name,
        rowIndex: rowIndex,
        itemLabel: asset.label,
        asset: asset,
      });
    }
  
    /**
     * Removes all selection classes from all elements (unchanged).
     */
    private clearSelections(): void {
      this.containerDiv.querySelectorAll('.selected-sheet').forEach(el => 
          el.classList.remove('selected-sheet')
      );
      this.containerDiv.querySelectorAll('.selected-row, .selected-item').forEach(el => 
          el.classList.remove('selected-row', 'selected-item')
      );
    }
  }