// =========================================================================
// === TYPE DEFINITIONS ===
// =========================================================================

/**
 * Defines the structure for a tile asset, which includes an OffscreenCanvas
 * for drawing the visual component.
 */
export type TypeAsset = {
    group: string;
    label: string;
    cimage: OffscreenCanvas;
  };
  
  /**
   * Defines a cell in the isometric grid.
   * NOTE: The asset is only non-null for items stored in the internal 'assetGrid'.
   */
  interface GridItem {
      asset: TypeAsset | null;
      x: number;
      y: number;
      z: number; // Layer/Height index
  }
  
  /**
   * Parameters for initializing the IsometricGridModule.
   */
  export interface IsometricGridModuleParams {
      divId: string;
  }
  
  // =========================================================================
  // === CONSTANTS & ISOMETRIC MATH ===
  // =========================================================================
  
  const GRID_SIZE = 30; // 30x30 grid (X and Y dimensions)
  const LAYER_COUNT = 4; // Number of layers (Z dimension)
  const TILE_WIDTH = 128; // 128px tile width
  const TILE_HEIGHT = 64; // 64px tile height (2:1 isometric projection)
  const HALF_WIDTH = TILE_WIDTH / 2; // 64
  const HALF_HEIGHT = TILE_HEIGHT / 2; // 32
  const ASSET_BOTTOM_OFFSET = 36; // 36px vertical offset for assets
  const LAYER_HEIGHT = 58; // 58px height difference between layers
  
  // Canvas size calculation: needs to accommodate the diagonal span of the grid
  const CANVAS_WIDTH = GRID_SIZE * TILE_WIDTH; 
  // Height must accommodate the grid + all layers stacked vertically
  const CANVAS_HEIGHT = (GRID_SIZE * TILE_HEIGHT) * 1.5 + (LAYER_COUNT - 1) * LAYER_HEIGHT; 
  
  /**
   * Converts grid coordinates (x, y, z) to screen coordinates (px, py).
   * This transformation centers the grid origin (0, 0) in the middle-top of the screen.
   * py here is the screen Y coordinate of the diamond's *top point*.
   * @param x The grid X coordinate.
   * @param y The grid Y coordinate.
   * @param z The grid Z coordinate (layer index).
   * @returns { px, py } Screen coordinates for the diamond center point of the tile.
   * * */
  function gridToScreen(x: number, y: number, z: number): { px: number; py: number } {
      // Offset to center the grid horizontally on the canvas
      const originXOffset = CANVAS_WIDTH / 2 - HALF_WIDTH;
      
      // Isometric transformation for X and Y coordinates:
      const px = (x - y) * HALF_WIDTH + originXOffset;
      let py = (x + y) * HALF_HEIGHT;
      
      // Apply Z (Layer) offset: higher layers (higher Z index) are drawn higher (lower Y screen coordinate)
      py -= z * LAYER_HEIGHT;
      
      return { px, py };
  }
  
  /**
   * Converts screen coordinates (px, py) to grid coordinates (x, y).
   * py is expected to be the Y coordinate of the tile's top point, NOT the click point.
   * @param px Screen X coordinate.
   * @param py Screen Y coordinate (adjusted to represent the tile's top point).
   * @param z The current active layer index.
   * @returns { x, y } Grid coordinates (rounded).
   */
  function screenToGrid(px: number, py: number, z: number): { x: number; y: number } {
      // Reverse the origin offset
      const originXOffset = CANVAS_WIDTH / 2 - HALF_WIDTH;
      const shiftedPx = px - originXOffset;
      
      // Inverse Z (Layer) offset for accurate X/Y calculation:
      // We add the offset back to py to calculate the coordinate as if it were on the base layer (Z=0)
      const pyAdjustedForZ = py + z * LAYER_HEIGHT;
      
      // Inverse isometric transformation:
      const x = Math.round((shiftedPx / HALF_WIDTH + pyAdjustedForZ / HALF_HEIGHT) / 2);
      const y = Math.round((pyAdjustedForZ / HALF_HEIGHT - shiftedPx / HALF_WIDTH) / 2);
      
      return { x, y };
  }
  
  
  // =========================================================================
  // === ISOMETRIC GRID MODULE ===
  // =========================================================================
  
  export class IsometricGridModule {
      private containerDiv: HTMLElement;
      private canvas!: HTMLCanvasElement;
      private ctx!: CanvasRenderingContext2D;
      private layerSelector!: HTMLSelectElement;
  
      // Grid is now a flat array (sparse representation)
      private assetGrid: GridItem[] = []; 
      
      private activeLayer: number = 0;
      
      private onClickHandler?: (x: number, y: number, z: number) => void;
  
      constructor(params: IsometricGridModuleParams) {
          const container = document.getElementById(params.divId);
          if (!container) {
              throw new Error(`DOM element with ID "${params.divId}" not found.`);
          }
          
          this.containerDiv = container;
          this.initializeGrid();
  
          this.containerDiv.innerHTML = this.renderInitialStructure();
          
          this.reinitializeDOMReferences();
          this.attachEventListeners();
          
          // Initial draw
          this.draw();
          console.log(`Isometric Grid Module initialized (${GRID_SIZE}x${GRID_SIZE}x${LAYER_COUNT}).`);
      }
  
      private initializeGrid(): void {
          // With a flat, sparse array, we initialize it as empty.
          this.assetGrid = [];
      }
  
      public setHandlers(handlers: { 
          onClick: (x: number, y: number, z: number) => void;
      }): void {
          this.onClickHandler = handlers.onClick;
      }
  
      /**
       * Sets an asset at the specified coordinates by adding or updating an item in the flat assetGrid.
       * @param asset must be non-null to be stored.
       */
      public set(x: number, y: number, z: number, asset: TypeAsset): void {
          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || z < 0 || z >= LAYER_COUNT) {
              console.error(`Invalid grid coordinates: (${x}, ${y}, ${z}). Grid is ${GRID_SIZE}x${GRID_SIZE}x${LAYER_COUNT}.`);
              return;
          }
          
          // Find existing item by coordinates (x, y, z)
          const item = this.assetGrid.find(i => i.x === x && i.y === y && i.z === z);
  
          if (item) {
              // Update existing item's asset
              item.asset = asset;
          } else {
              // Create and push new item. Asset is guaranteed non-null here.
              this.assetGrid.push({ asset, x, y, z }); 
          }
          
          this.draw();
          console.log(`Asset set at grid coordinates (${x}, ${y}, ${z}).`);
      }
      
      private renderInitialStructure(): string {
          const idSuffix = this.containerDiv.id;
  
          const layerOptions = Array.from({ length: LAYER_COUNT }, (_, i) => 
              `<option value="${i}">Layer ${i} (Z=${i})</option>`
          ).join('');
          
          return `
              <style>
                  .iso-container { 
                    overflow: auto;
                    /* max-width: 60vw; */
                    /* border: 2px solid #34495e; */
                    border-radius: 12px;
                    height: calc(100vh - 50px - 54px);

                  }
                  .controls {
                    display: flex;
                    position: absolute;
                    bottom: 18px;
                    right: 16px;
                    border: 1px solid #00000099;
                    padding: 0px 10px;
                    border-radius: 10px;
                    justify-content: center;
                    align-items: center;
                  }

                .controls-info {
                    position: absolute;
                    top: 18px;
                    left: 16px;
                    color: #7b7b7b;
                    text-align: center;
                    font-family: monospace;
                }

                  #isometric-canvas-${idSuffix} {
                      background-color: #34495e;
                      display: block;
                      cursor: crosshair;
                  }
                
                  .controls label {
                      color: #ecf0f1;
                      font-size: 0.9em;
                  }
                  .controls select {
                      padding: 4px 8px;
                      border-radius: 4px;
                      border: 1px solid #34495e;
                      background-color: #34495e;
                      color: #ecf0f1;
                  }
                  #isogrid-${idSuffix}-container {
                      position:relative;  
                  }
              </style>
              
              <div id="isogrid-${idSuffix}-container">
                  <div id="coordinate-display-${idSuffix}" class="controls-info">
                      Click to place an asset.
                  </div>
                  <div class="controls">
                      <label for="layer-selector-${idSuffix}">Editing Layer:</label>
                      <select id="layer-selector-${idSuffix}" title="Select Active Layer">
                          ${layerOptions}
                      </select>
                  </div>
                  <div class="iso-container">
                      <canvas 
                          id="isometric-canvas-${idSuffix}" 
                          width="${CANVAS_WIDTH}" 
                          height="${CANVAS_HEIGHT}"
                      ></canvas>
                  </div>
              </div>
          `;
      }
  
      private reinitializeDOMReferences(): void {
          const idSuffix = this.containerDiv.id;
          this.canvas = this.containerDiv.querySelector(`#isometric-canvas-${idSuffix}`) as HTMLCanvasElement;
          this.ctx = this.canvas.getContext('2d')!;
          this.layerSelector = this.containerDiv.querySelector(`#layer-selector-${idSuffix}`) as HTMLSelectElement;
      }
  
      private attachEventListeners(): void {
          this.canvas.addEventListener('click', this.handleCanvasClick);
          this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove);
          this.layerSelector.addEventListener('change', this.handleLayerChange);
      }
      
      private handleLayerChange = (e: Event): void => {
          this.activeLayer = parseInt((e.target as HTMLSelectElement).value, 10);
          console.log(`Active layer set to: ${this.activeLayer}`);
          this.draw();
      }
  
      /**
       * Handles mouse movement, using e.offsetX/Y for scroll-aware positioning.
       */
      private handleCanvasMouseMove = (e: MouseEvent): void => {
          const px = e.offsetX;
          const py = e.offsetY;
          
          // Adjust py upwards by HALF_HEIGHT (32px) to align the click/hover
          const pyAdjusted = py - HALF_HEIGHT;
  
          // Use the active layer for grid calculation
          const { x, y } = screenToGrid(px, pyAdjusted, this.activeLayer);
          
          const display = this.containerDiv.querySelector(`#coordinate-display-${this.containerDiv.id}`) as HTMLElement;
  
          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
              display.textContent = `Hovering: Grid (${x}, ${y}, Z=${this.activeLayer}) | Canvas (${Math.round(px)}, ${Math.round(py)})`;
              this.draw(x, y, this.activeLayer); // Redraw to highlight the hovered tile
          } else {
              display.textContent = `Hovering: Outside Grid | Canvas (${Math.round(px)}, ${Math.round(py)})`;
              this.draw(); // Redraw without highlight
          }
      }
  
      /**
       * Handles clicks, using e.offsetX/Y for scroll-aware positioning.
       */
      private handleCanvasClick = (e: MouseEvent): void => {
          const px = e.offsetX;
          const py = e.offsetY;
          
          // Adjust py upwards by HALF_HEIGHT (32px) to align the click/hover
          const pyAdjusted = py - HALF_HEIGHT;
  
          // Use the active layer for grid calculation
          const { x, y } = screenToGrid(px, pyAdjusted, this.activeLayer);
  
          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
              console.log(`Tile clicked: (${x}, ${y}, Z=${this.activeLayer})`);
              if (this.onClickHandler) {
                  this.onClickHandler(x, y, this.activeLayer);
              }
          }
      }
      
      /**
       * Draws a projection (shadow box) from the highlighted tile down to Z=0.
       */
      private drawProjection(x: number, y: number, z: number): void {
          if (z === 0 || z !== this.activeLayer) return; // Only show projection from the active layer
  
          // Coordinates of the top tile (highlighted)
          const { px: hPx, py: hPy } = gridToScreen(x, y, z);
          // Coordinates of the base tile (Z=0)
          const { px: bPx, py: bPy } = gridToScreen(x, y, 0);
  
          // Vertices of the highlighted tile (Top Layer)
          const hV = [
              { x: hPx, y: hPy },                                     // V0: Top point
              { x: hPx + HALF_WIDTH, y: hPy + HALF_HEIGHT },          // V1: Right point
              { x: hPx, y: hPy + TILE_HEIGHT },                       // V2: Bottom point
              { x: hPx - HALF_WIDTH, y: hPy + HALF_HEIGHT },          // V3: Left point
          ];
  
          // Vertices of the Base Layer tile (Z=0)
          const bV = [
              { x: bPx, y: bPy },                                     // V0: Top point
              { x: bPx + HALF_WIDTH, y: bPy + HALF_HEIGHT },          // V1: Right point
              { x: bPx, y: bPy + TILE_HEIGHT },                       // V2: Bottom point
              { x: bPx - HALF_WIDTH, y: bPy + HALF_HEIGHT },          // V3: Left point
          ];
          
          // Style for the projection box
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Light, visible dashed line
          this.ctx.lineWidth = 1.5;
          this.ctx.setLineDash([5, 5]); // Dashed line
  
          this.ctx.beginPath();
          
          // Draw the 4 vertical lines connecting top to bottom
          for (let i = 0; i < 4; i++) {
              this.ctx.moveTo(hV[i].x, hV[i].y);
              this.ctx.lineTo(bV[i].x, bV[i].y);
          }
          
          // Draw the diamond outline on the base layer (bPy) for the shadow base
          this.ctx.moveTo(bV[0].x, bV[0].y);
          this.ctx.lineTo(bV[1].x, bV[1].y);
          this.ctx.lineTo(bV[2].x, bV[2].y);
          this.ctx.lineTo(bV[3].x, bV[3].y);
          this.ctx.lineTo(bV[0].x, bV[0].y);
  
          this.ctx.stroke();
          this.ctx.setLineDash([]); // Reset line dash
          
          // Optional: Draw a semi-transparent fill for the base tile projection
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          this.ctx.fill();
      }
      
      /**
       * Draws the entire grid and all assets with correct depth order.
       */
      private draw(highlightX: number = -1, highlightY: number = -1, highlightZ: number = -1): void {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
          // Assets to Draw are simply the contents of the flat assetGrid
          const assetsToDraw: GridItem[] = this.assetGrid;
  
          // Tiles to draw: Must include all Z=0 tiles + tiles from assetGrid + the highlighted tile.
          const tilesToDrawMap = new Map<string, GridItem>(); // Key: "x,y,z"
  
          // 1. Add all Z=0 (Base Layer) tiles. These are empty data holders that ensure the grid outline is always drawn on Layer 0.
          for (let y = 0; y < GRID_SIZE; y++) {
              for (let x = 0; x < GRID_SIZE; x++) {
                  const key = `${x},${y},0`;
                  // Create a dummy GridItem for Z=0
                  tilesToDrawMap.set(key, { asset: null, x, y, z: 0 });
              }
          }
          
          // 2. Add all tiles corresponding to placed assets
          for (const item of this.assetGrid) {
              const key = `${item.x},${item.y},${item.z}`;
              tilesToDrawMap.set(key, item);
          }
          
          // 3. Add the highlighted tile (if it exists and is on the active layer)
          const isHighlighted = highlightX !== -1 && highlightY !== -1 && highlightZ !== -1;
          if (isHighlighted && highlightZ === this.activeLayer) {
              const key = `${highlightX},${highlightY},${highlightZ}`;
              // If this specific tile is not already an asset tile, create a dummy for highlighting
              if (!tilesToDrawMap.has(key)) {
                   tilesToDrawMap.set(key, { asset: null, x: highlightX, y: highlightY, z: highlightZ });
              }
          }
  
          const tilesToDraw: GridItem[] = Array.from(tilesToDrawMap.values());
  
          // Sort assets and tiles for correct z-depth rendering (low Z first, then low X+Y)
          tilesToDraw.sort((a, b) => {
              if (a.z !== b.z) {
                  return a.z - b.z; 
              }
              return (a.x + a.y) - (b.x + b.y); 
          });
  
          assetsToDraw.sort((a, b) => {
              if (a.z !== b.z) {
                  return a.z - b.z; 
              }
              return (a.x + a.y) - (b.x + b.y); 
          });
  
          // === 2. Draw Hover Projection / Shadow (Dashed Box) ===
          if (isHighlighted && highlightZ === this.activeLayer && highlightZ !== 0) {
              this.drawProjection(highlightX, highlightY, highlightZ);
          }
  
          // === 3. Draw Tiles (Depth Sorted) ===
          for (const item of tilesToDraw) {
              // Need to check against original highlight coordinates 
              const isCurrentlyHighlighted = item.x === highlightX && item.y === highlightY && item.z === highlightZ; 
              const { px, py } = gridToScreen(item.x, item.y, item.z);
              const isBaseLayer = item.z === 0;
  
              this.drawTile(px, py, isCurrentlyHighlighted, item.z === this.activeLayer, isBaseLayer);
          }
          
          // === 4. Draw Assets (Depth Sorted) ===
          for (const item of assetsToDraw) {
              // Asset is guaranteed to be non-null in assetGrid
              const { px, py } = gridToScreen(item.x, item.y, item.z);
              this.drawAsset(px, py, item.asset as TypeAsset);
          }
      }
  
      /**
       * Draws a single isometric tile (diamond shape).
       * The stroke (grid line) is only drawn if it's the base layer or currently highlighted.
       */
      private drawTile(px: number, py: number, highlight: boolean, isActiveLayer: boolean, isBaseLayer: boolean): void {
          this.ctx.beginPath();
          
          // Define the diamond shape vertices relative to the top point (px, py)
          this.ctx.moveTo(px, py);
          this.ctx.lineTo(px + HALF_WIDTH, py + HALF_HEIGHT);
          this.ctx.lineTo(px, py + TILE_HEIGHT);
          this.ctx.lineTo(px - HALF_WIDTH, py + HALF_HEIGHT);
          this.ctx.lineTo(px, py);
          
          this.ctx.closePath();
          
          let strokeColor = '#7f8c8d'; 
          let fillColor = 'rgba(52, 152, 219, 0.05)'; 
          
          // Grid line rule: ONLY stroke on base layer OR if highlighted
          let shouldStroke = isBaseLayer || highlight; 
  
          if (highlight) {
              strokeColor = '#f39c12'; // Highlighted color (Hover)
              fillColor = 'rgba(243, 156, 18, 0.1)'; 
          } else if (isActiveLayer) {
              strokeColor = '#3498db'; // Active layer color (only used for stroke if on Z=0)
              fillColor = 'rgba(52, 152, 219, 0.1)';
          } else {
               // For tiles with assets on non-active, non-base layers.
               strokeColor = '#7f8c8d';
               fillColor = 'rgba(127, 140, 141, 0.05)';
          }
          
          this.ctx.strokeStyle = strokeColor;
          this.ctx.lineWidth = highlight ? 2 : 1;
          this.ctx.fillStyle = fillColor; 
          
          // Fill is always applied if the tile is collected (asset, Z=0, or highlight)
          this.ctx.fill();
          
          // Only stroke if it meets the criteria (Z=0 or Highlighted)
          if (shouldStroke) {
              this.ctx.stroke(); 
          }
      }
      
      /**
       * Draws an asset's image centered on the tile, applying the vertical offset.
       */
      private drawAsset(px: number, py: number, asset: TypeAsset): void {
          const image = asset.cimage;
          const imgWidth = image.width;
          const imgHeight = image.height;
          
          // X: Tile center (px) minus half the image width
          const drawX = px - imgWidth / 2;
          
          // Y: Tile bottom point (py + TILE_HEIGHT) minus image height.
          // Then ADD ASSET_BOTTOM_OFFSET to shift the image DOWN (positive Y direction) relative to the tile's base.
          const drawY = py + TILE_HEIGHT - imgHeight + ASSET_BOTTOM_OFFSET;
  
          this.ctx.drawImage(image as unknown as CanvasImageSource, drawX, drawY, imgWidth, imgHeight);
      }
  }
  
  // --- Example setup for running the class ---
  export function initializeIsometricGrid(
      container_id : string = "isometric-grid-container"
  ) {
      const container = document.getElementById(container_id);
      if (!container) {
          const tempDiv = document.createElement('div');
          tempDiv.id = container_id;
          document.body.appendChild(tempDiv);
      }
  
      const gridModule: IsometricGridModule = new IsometricGridModule({
          divId: container_id,
      });
      
      const displayElement = document.getElementById(`coordinate-display-${container_id}`) as HTMLElement;
  
      gridModule.setHandlers({
          onClick: (x, y, z) => {
              console.log(`CLICK: Grid (${x}, ${y}, ${z})`);
              displayElement.textContent = `Asset placed at (${x}, ${y}, Z=${z}).`;
  
              // --- Example Asset Creation (Cube-like) ---
              const w = 96, h = 96;
              const assetCanvas = new OffscreenCanvas(w, h);
              const assetCtx = assetCanvas.getContext('2d')!;
  
              const randomHue = Math.random() * 360;
              assetCtx.fillStyle = `hsl(${randomHue}, 70%, 60%)`;
              
              // Draw a slightly randomized cube shape for demonstration
              assetCtx.beginPath();
              assetCtx.moveTo(w/2, 0);
              assetCtx.lineTo(w, h/4);
              assetCtx.lineTo(w, h*3/4);
              assetCtx.lineTo(w/2, h);
              assetCtx.lineTo(0, h*3/4);
              assetCtx.lineTo(0, h/4);
              assetCtx.closePath();
              assetCtx.fill();
              
              assetCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              assetCtx.font = '14px monospace';
              assetCtx.textAlign = 'center';
              assetCtx.fillText(`${x}, ${y}`, w / 2, h / 2 + 5);
              // ------------------------------
              
              const newAsset: TypeAsset = {
                  group: 'test',
                  label: `Item ${x},${y}`,
                  cimage: assetCanvas,
              };
              
              gridModule.set(x, y, z, newAsset);
          },
  
      });
      return gridModule;
  }