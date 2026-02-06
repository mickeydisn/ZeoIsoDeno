// =========================================================================
// === INTERFACES & UTILITY TYPES (copied from imageLoaderPallet.ts and context) ===
// =========================================================================

import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

/** Placeholder for the TypeImage structure used by the editor ecosystem. 
export type TypeImage = {
    cimage: OffscreenCanvas;
}
*/
/** Placeholder for the TypeImage structure used by the editor ecosystem. */

/**
 * Defines the parameters for initializing the ImageEditorModule.
 */
export interface ImageEditorModuleParams {
    image?: TypeImage;
    divId: string;
}

const HISTORY_LIMIT = 20;
// NEW CONSTANT: The fixed size of your isometric assets/tiles (256x256)
const TILE_ASSET_SIZE = 256; 

// CHANGED: History now stores a TypeImage snapshot for complete state restoration
type CanvasHistoryState = TypeImage;

// --- OffscreenCanvas for Isometric Diamond Mask (256x256px Tile) ---
/**
 * Generates the isometric mask drawing onto a new OffscreenCanvas.
 * This canvas serves as the tile for the repeating pattern.
 */
function generateIsometricMaskCanvas(): OffscreenCanvas {
    const TILE_SIZE = 256;
    const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext('2d')!;

    // Use 0.5 offset for crisp 1px lines (pixel alignment)
    const offset = 0; 

    // Configure context for pixel-perfect drawing
    ctx.imageSmoothingEnabled = false; 
    
    // We can rely on the filter for opacity, so 'copy' is not strictly necessary here, 
    // but we ensure source-over is not used during the main draw.
    // We will let the default (source-over) handle the stroke, then filter.

    // Vertices (X, Y) for the 32px upward shifted diamond:
    const pb = 36;
    
    // Coordinates (using integers + offset)
    const X_CENTER = 128 + offset;
    const X_RIGHT = 192 + offset;
    const X_LEFT = 64 + offset;
    
    const Y_TOP = (192 - pb) + offset;      
    const Y_RIGHT_LEFT = (224 - pb) + offset; 
    const Y_BOTTOM = (256 - pb) + offset;   
    
    // Use an explicit RGBA color with alpha=1.0 
    ctx.strokeStyle = "rgba(230, 126, 34, 1.0)"; 
    ctx.lineWidth = 1;
    
    // Set line styling for sharp corners and ends
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE); // Ensure transparency

    // Draw the diamond shape 
    ctx.beginPath();
    ctx.moveTo(X_CENTER, Y_TOP);          
    ctx.lineTo(X_RIGHT, Y_RIGHT_LEFT);    
    ctx.lineTo(X_CENTER, Y_BOTTOM);       
    ctx.lineTo(X_LEFT, Y_RIGHT_LEFT);     
    ctx.closePath();
    ctx.stroke();
    
    // =================================================================
    // FIX: Apply post-processing filter to enforce 100% opacity
    // =================================================================
    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const data = imageData.data;

    // Iterate through all pixels (data is [R, G, B, A, R, G, B, A, ...])
    for (let i = 3; i < data.length; i += 4) {
        // Check the alpha component (i)
        if (data[i] > 0) {
            // If the pixel has any visibility (alpha > 0), force it to fully opaque (255)
            data[i] = 255; 
        }
    }

    ctx.putImageData(imageData, 0, 0);
    // =================================================================
    
    // Reset composite operation to default
    ctx.globalCompositeOperation = 'source-over'; 

    return canvas;
}

// Initial default mask OffscreenCanvas (the tile)
const ISOMETRIC_MASK_CANVAS_TILE = generateIsometricMaskCanvas();

export class ImageEditorModule {
    private currentImage: TypeImage;
    private containerDiv: HTMLElement;
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private zoomWrapper!: HTMLElement;
    private canvasContainer!: HTMLElement;
    
    private isometricMask: HTMLCanvasElement | null = null; 
    private maskCtx: CanvasRenderingContext2D | null = null;
    
    // NEW: Selector canvas and context
    private selectorCanvas!: HTMLCanvasElement;
    private selectorCtx!: CanvasRenderingContext2D;
    
    // UPDATED: State for multiple selected tile coordinates. Use Map for fast lookups.
    // Key: "x,y", Value: { x: number, y: number }
    private selectedTilesMap: Map<string, { x: number, y: number }> = new Map();
    // NEW: Debounce variable to prevent double clicks
    private lastSelectionToggleTime: number = 0; 
    
    // Store the current mask OffscreenCanvas tile instance
    private currentMaskCanvasTile: OffscreenCanvas; 
    
    // Handlers
    private onSave?: (image: TypeImage) => void;
    private onLoad?: () => TypeImage | undefined; 
    private onImageChange?: (image: TypeImage) => void;
    // onMaskChange handler
    private onMaskSave?: (image: TypeImage) => void;
    private onMaskLoad?: () => TypeImage | undefined; 
    private onMaskChange?: (maskTileCanvas: OffscreenCanvas) => void; 
    private isMaskEnabled: boolean = true; 

    // History management
    private undoStack: CanvasHistoryState[] = [];
    private redoStack: CanvasHistoryState[] = [];

    // Zoom state
    private currentZoom = 1.0;
    private minZoom = 0.25;
    private maxZoom = 4.0;

    constructor(params: ImageEditorModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }

        this.currentImage = params.image || DEFAULT_EMPTY_ASSET;
        this.containerDiv = container;
        // 0. Initialize mask state
        this.currentMaskCanvasTile = ISOMETRIC_MASK_CANVAS_TILE;
        
        // 1. Setup Elements
        this.containerDiv.innerHTML = this.getInitialStyles();
        this.reinitializeDOMReferences();
        
        // 2. Load the initial mask (draw the repeating pattern)
        this.loadMask(this.currentMaskCanvasTile); 
        
        // 3. Load the initial image 
        this.loadImage(this.currentImage, false); 
        
        // 4. Setup event listeners and initial zoom state
        this.setupEventListeners();
        this.handleZoom(); 
        
        // 5. Initial draw of the selector (after image is loaded)
        this.drawTileSelector();
    }

    /**
     * PUBLIC METHOD: Sets or updates the handlers.
     */
    public setHandlers(handlers: { 
            onSave?: (image: TypeImage) => void,
            onLoad?: () => TypeImage | undefined
            onImageChange?: (image: TypeImage) => void,
            onMaskSave?: (image: TypeImage) => void,
            onMaskLoad?: () => TypeImage | undefined
            onMaskChange?: (maskTileCanvas: OffscreenCanvas) => void,
            
        }): void {
        if (handlers.onSave) { this.onSave = handlers.onSave; }
        if (handlers.onLoad) this.onLoad = handlers.onLoad;
        if (handlers.onImageChange) this.onImageChange = handlers.onImageChange;
        if (handlers.onMaskSave) { this.onMaskSave = handlers.onMaskSave; }
        if (handlers.onMaskLoad) this.onMaskLoad = handlers.onMaskLoad;
        if (handlers.onMaskChange) this.onMaskChange = handlers.onMaskChange;
        this.reinitializeDOMReferences();
        this.setupEventListeners();
    }
    
    /**
     * PUBLIC METHOD: Returns the list of currently selected tile coordinates.
     * Returns an empty array if no tiles are selected.
     */
    public getSelectedAsset(): { x: number, y: number }[] {
        // Return values from the Map as an array
        return Array.from(this.selectedTilesMap.values());
    }
    
    /**
     * PUBLIC METHOD: Loads a new OffscreenCanvas (the tile) and redraws the repeating mask pattern.
     */
    public loadMask(maskTileCanvas: OffscreenCanvas): void {
        console.log("Loading new isometric mask tile from external module.");
        
        // 1. Update the local tile state
        this.currentMaskCanvasTile = maskTileCanvas;
        
        // 2. Redraw the mask pattern on the mask canvas
        this.drawCurrentMaskPattern(); 

        // 3. Inform external modules (if handler is set) that the mask tile has changed
        if (this.onMaskChange) {
            this.onMaskChange(this.currentMaskCanvasTile);
        }
    }

    /**
     * Internal helper to draw the repeating pattern using the current tile onto the mask canvas.
     */
    private drawCurrentMaskPattern(): void {
        const maskTileCanvas = this.currentMaskCanvasTile;
        
        if (!this.isometricMask || !this.maskCtx) return;

        // Ensure the mask canvas matches the dimensions of the main image canvas
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        this.isometricMask.width = canvasWidth;
        this.isometricMask.height = canvasHeight;

        this.maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        try {
            // Set properties on the mask canvas context for crisp drawing (redundant but safe)
            this.maskCtx.imageSmoothingEnabled = false;
            
            // Create a repeating pattern from the OffscreenCanvas tile
            const pattern = this.maskCtx.createPattern(maskTileCanvas, 'repeat');
            
            if (pattern) {
                this.maskCtx.fillStyle = pattern;
                // Draw the pattern across the entire mask canvas
                this.maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                console.log("Isometric mask pattern redrawn.");
            }
        } catch (error) {
             console.error("Error drawing current mask pattern:", error);
        }
    }


    // Helper to re-get DOM elements after innerHTML update
    private reinitializeDOMReferences(): void {
        this.zoomWrapper = this.containerDiv.querySelector('#canvas-zoom-wrapper') as HTMLElement;
        this.canvasContainer = this.containerDiv.querySelector('.canvas-container') as HTMLElement;
        
        // CHANGED: Get HTMLCanvasElement and its context
        this.isometricMask = this.containerDiv.querySelector('#isometric-mask') as HTMLCanvasElement;
        this.maskCtx = this.isometricMask ? this.isometricMask.getContext('2d')! : null;
        
        // NEW: Get selector canvas and context
        this.selectorCanvas = this.containerDiv.querySelector('#tile-selector') as HTMLCanvasElement;
        this.selectorCtx = this.selectorCanvas ? this.selectorCanvas.getContext('2d')! : null!;
        
        const canvasElement = this.containerDiv.querySelector('#image-canvas') as HTMLCanvasElement;
        if (canvasElement) {
             this.canvas = canvasElement;
             this.ctx = canvasElement.getContext('2d', { willReadFrequently: true })!;
             // Redraw existing image
             this.updateCanvas(this.currentImage.cimage); 
        }
    }

    /**
     * PUBLIC METHOD: Loads a new TypeImage into the editor.
     * * If tiles are selected, it copies the corresponding 256x256 area of the incoming image 
     * and pastes it into the selected tiles' locations in the current image.
     * If no tile is selected, it replaces the entire current image.
     */
    public loadImage(image: TypeImage, pushToHistory: boolean = true): void {
        console.log("Load Image ", image);

        // 1. Capture the *current* state before updating, if requested.
        if (pushToHistory) {
            this.pushHistory();
        }
        
        const incomingCanvas = image.cimage;
        
        // UPDATED: Use Map.size for active selection check
        const isSelectionActive = this.selectedTilesMap.size > 0;
        const isCurrentCanvasValid = this.currentImage.cimage.width > 0;
        
        let tilesUpdated = 0;

        if (isSelectionActive && isCurrentCanvasValid) {
            // Case 2: Selective tile update
            const ctx = this.currentImage.cimage.getContext('2d')!;
            
            // Iterate over all selected tiles (values from the map)
            for (const tile of this.selectedTilesMap.values()) {
                const targetX = tile.x * TILE_ASSET_SIZE;
                const targetY = tile.y * TILE_ASSET_SIZE;

                // Check if the tile to be updated exists in *both* the current and incoming canvas
                const isTargetInCurrentBounds = 
                    targetX < this.currentImage.cimage.width && 
                    targetY < this.currentImage.cimage.height;
                
                const isSourceAvailable = 
                    targetX < incomingCanvas.width && 
                    targetY < incomingCanvas.height;
                
                if (isTargetInCurrentBounds && isSourceAvailable) {
                    // a. Clear the selected tile's rectangular area before drawing
                    ctx.clearRect(targetX, targetY, TILE_ASSET_SIZE, TILE_ASSET_SIZE);
                    
                    // b. Draw the corresponding section from the incoming image.
                    // Source (incomingCanvas): targetX, targetY (corresponding tile coordinates)
                    // Destination (currentImage): targetX, targetY (selected tile coordinates)
                    ctx.drawImage(
                        incomingCanvas, 
                        targetX, targetY, TILE_ASSET_SIZE, TILE_ASSET_SIZE, // Source tile
                        targetX, targetY, TILE_ASSET_SIZE, TILE_ASSET_SIZE // Destination tile
                    );
                    tilesUpdated++;
                }
            }

            if (tilesUpdated > 0) {
                console.log(`Updated ${tilesUpdated} selected tile(s) content from incoming image.`);
            } else {
                 // If selection was active but no tile matched current/incoming bounds, perform full replacement.
                this.currentImage = image;
                console.log(`Selection was active but no tiles were updated. Performed full image replacement.`);
            }
            
        } else {
            // Case 1: Full Image Replacement (if no tiles selected)
            this.currentImage = image;
            console.log(`No tile selection active. Performed full image replacement.`);
        }
        
        // 3. Update all canvases (main, mask, selector)
        this.updateCanvas(this.currentImage.cimage);
        
        // 4. Update UI/metadata
        this.renderMetadata();
        this.updateHistoryButtons(); 
        
        // 5. Redraw the selector (selection state is preserved)
        this.drawTileSelector(); 

        // 6. Fire event
        if (this.onImageChange) {
            this.onImageChange(this.currentImage);
        }
    }

    private getInitialStyles(): string {
        return `
            <style>
                .editor-info { font-size: 0.9em; margin-bottom: 10px; }
                .editor-controls { display: flex; gap: 10px; margin-bottom: 15px; }
                .editor-controls button {
                    padding: 8px 12px;
                    background-color: #e67e22;
                    border: none;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .editor-controls button:disabled { background-color: #bdc3c7; cursor: not-allowed; }
                .editor-controls button:hover:not(:disabled) { background-color: #d35400; }

                .mask-toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-bottom: 15px;
                }
                
                /* --- Canvas Container: Defines Viewport of the Zoomed Content --- */
                .canvas-container {
                    overflow: scroll;; 
                    margin-bottom: 15px;
                    background: #1e293b;
                    position: relative;
                    padding: 0; 
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); 
                    border-radius: 4px;
                }

                /* --- Zoom Wrapper: Element that scales the content --- */
                #canvas-zoom-wrapper {
                    width: fit-content;
                    height: fit-content;
                    transform-origin: top left;
                    transition: transform 0.1s;
                    position: relative; 
                }

                #image-canvas {
                    image-rendering: pixelated;
                    display: block;
                }
                
                /* --- Isometric Mask Layer Styling --- */
                #isometric-mask {
                    /* Mask is a canvas */
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 10;
                    opacity:.5;
                    transition: opacity 0.2s;
                    /* Dimensions will be set dynamically to match #image-canvas */
                    pointer-events: none; /* Allows clicks to pass through to the canvas below */
                    /* Ensure the HTML canvas element itself is rendered crisply when scaled by CSS */
                    image-rendering: pixelated; 
                }      
                
                /* --- Selector Layer Styling --- */
                #tile-selector {
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 20; /* Highest z-index */
                    pointer-events: none; /* Allows clicks to pass through to the canvas below */
                    image-rendering: pixelated; 
                }
                          
                .zoom-slider-container { display: flex; align-items: center; gap: 10px; }
                #zoom-slider { flex-grow: 1; }
            </style>
            <div class="module-card">                
                <div class="editor-controls">
                    <button id="undo-btn" >Undo</button>
                    <button id="redo-btn" >Redo</button>
                    <button id="load-btn" >Load Image</button>
                    <button id="save-btn" >Save Image</button>
                    <button id="load-mask-btn" >Load Mask</button>
                    <button id="save-mask-btn" >Save Mask</button>
                    <button id="unselect-btn" >Unselect</button> </div>

                <div class="mask-toggle-container">
                    <input type="checkbox" id="mask-toggle" ${this.isMaskEnabled ? 'checked' : ''}>
                    <label for="mask-toggle">Show Isometric Mask</label>
                </div>

                <div class="canvas-container">
                    <div id="canvas-zoom-wrapper">
                        <canvas id="image-canvas"></canvas>
                        
                        <canvas id="isometric-mask"></canvas>
                        
                        <canvas id="tile-selector"></canvas>
                    </div>
                </div>
                
                <div class="zoom-slider-container">
                    <label for="zoom-slider">Zoom (x<span id="zoom-value">${this.currentZoom.toFixed(2)}</span>):</label>
                    <input type="range" id="zoom-slider" min="${this.minZoom}" max="${this.maxZoom}" step="0.25" value="${this.currentZoom}">
                </div>
            </div>
        `;
    }

    private toggleMaskVisibility(enabled: boolean): void {
        this.isMaskEnabled = enabled;
        if (this.isometricMask) {
            this.isometricMask.style.opacity = enabled ? '.5' : '0';
        }
    }
    
    private setupEventListeners(): void {
        this.containerDiv.querySelector('#undo-btn')?.addEventListener('click', () => this.undo());
        this.containerDiv.querySelector('#redo-btn')?.addEventListener('click', () => this.redo());
        
        if (this.onLoad) {
            this.containerDiv.querySelector('#load-btn')?.addEventListener('click', () => this.handleLoadClick());
        }
        if (this.onSave) {
            this.containerDiv.querySelector('#save-btn')?.addEventListener('click', () => this.saveImage());
        }
        if (this.onMaskLoad) {
            this.containerDiv.querySelector('#load-mask-btn')?.addEventListener('click', () => this.handleLoadMaskClick());
        }
        if (this.onMaskSave) {
            this.containerDiv.querySelector('#save-mask-btn')?.addEventListener('click', () => this.saveMask());
        }
        
        // NEW: Unselect button handler
        this.containerDiv.querySelector('#unselect-btn')?.addEventListener('click', () => this.unselectTile());

        const zoomSlider = this.containerDiv.querySelector('#zoom-slider') as HTMLInputElement;
        zoomSlider.addEventListener('input', (e) => this.handleZoom((e.target as HTMLInputElement).value));

        const maskToggle = this.containerDiv.querySelector('#mask-toggle') as HTMLInputElement;
        if (maskToggle) {
            this.toggleMaskVisibility(this.isMaskEnabled); 
            maskToggle.addEventListener('change', (e) => this.toggleMaskVisibility((e.target as HTMLInputElement).checked));
        }
        
        // UPDATED: Click handler for tile selection (now handles toggle logic)
        this.canvas.addEventListener('click', (e) => this.handleTileClick(e as MouseEvent));
    }
    
    /**
     * NEW: Clears the current tile selection.
     */
    private unselectTile(): void {
        this.selectedTilesMap.clear(); // Use Map.clear()
        this.drawTileSelector();
        console.log("Tile selection cleared.");
    }

    /**
     * Handles clicks on the main canvas to select/unselect a tile (toggle behavior).
     */
    private handleTileClick(event: MouseEvent): void {
        // --- NEW: Debounce logic to prevent accidental double-toggling ---
        const DEBOUNCE_THRESHOLD_MS = 250; 
        const now = Date.now();
        
        // Check for double click prevention
        if (now - this.lastSelectionToggleTime < DEBOUNCE_THRESHOLD_MS) {
            console.log("Ignored rapid click (debounce).");
            return;
        }
        // -----------------------------------------------------------------

        const rect = this.canvas.getBoundingClientRect();
        
        // 1. Get click coordinates relative to the original (non-scaled) canvas
        const clickX = (event.clientX - rect.left) / this.currentZoom;
        const clickY = (event.clientY - rect.top) / this.currentZoom;
        
        // Check if the click is outside the canvas area
        if (clickX < 0 || clickY < 0 || clickX >= this.canvas.width || clickY >= this.canvas.height) {
            return;
        }

        // 2. Calculate the tile coordinates (in TILE_ASSET_SIZE units)
        const tileX = Math.floor(clickX / TILE_ASSET_SIZE);
        const tileY = Math.floor(clickY / TILE_ASSET_SIZE);
        
        // Get maximum possible tile coordinates
        const maxTileX = Math.floor(this.canvas.width / TILE_ASSET_SIZE) - 1;
        const maxTileY = Math.floor(this.canvas.height / TILE_ASSET_SIZE) - 1;

        // Check if the calculated tile coordinates are within the image bounds
        if (tileX < 0 || tileY < 0 || tileX > maxTileX || tileY > maxTileY) {
             return;
        }

        // 3. Check if the tile is already selected (toggle logic) using a unique key for fast lookup
        const key = `${tileX},${tileY}`;
        
        if (this.selectedTilesMap.has(key)) {
            // Tile is already selected, remove it (unselect)
            this.selectedTilesMap.delete(key);
            console.log(`Tile unselected: X=${tileX}, Y=${tileY}. Total selected: ${this.selectedTilesMap.size}`);
        } else {
            // Tile is not selected, add it (select)
            this.selectedTilesMap.set(key, { x: tileX, y: tileY });
            console.log(`Tile selected: X=${tileX}, Y=${tileY}. Total selected: ${this.selectedTilesMap.size}`);
        }
        
        // 4. Update debounce time
        this.lastSelectionToggleTime = now;

        // 5. Redraw the selector
        this.drawTileSelector();
    }
    
    /**
     * Draws the red square selector around ALL currently selected tiles.
     */
    private drawTileSelector(): void {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        if (!this.selectorCtx) return;

        // 1. Ensure selector canvas matches main canvas dimensions
        this.selectorCanvas.width = canvasWidth;
        this.selectorCanvas.height = canvasHeight;
        
        this.selectorCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Check if any tiles are selected
        if (this.selectedTilesMap.size === 0) {
            return;
        }
        
        // 2. Configure the selector style
        this.selectorCtx.strokeStyle = 'red';
        this.selectorCtx.lineWidth = 4;
        this.selectorCtx.imageSmoothingEnabled = false;

        // 3. Loop over all selected tiles and draw the selection square
        for (const tile of this.selectedTilesMap.values()) {
            
            // Recalculate bounds check in case selection persisted after a resize
            const isXValid = tile.x * TILE_ASSET_SIZE < canvasWidth;
            const isYValid = tile.y * TILE_ASSET_SIZE < canvasHeight;

            if (!isXValid || !isYValid) {
                continue;
            }

            // Calculate the top-left corner of the selected tile
            const rectX = tile.x * TILE_ASSET_SIZE;
            const rectY = tile.y * TILE_ASSET_SIZE;

            // Draw the selection square (with padding to keep stroke inside the tile)
            this.selectorCtx.strokeRect(
                rectX + 2, 
                rectY + 2, 
                TILE_ASSET_SIZE - 4, 
                TILE_ASSET_SIZE - 4
            );
        }
    }

    /**
     * Internal handler for the 'Load Image' button click.
     */
    private  handleLoadClick(): void { 
        if (!this.onLoad) {
            console.warn("onLoad handler is not defined. Cannot load image.");
            return;
        }

        try {
            const loadedImage = this.onLoad();
            if (!loadedImage) return;
            
            // Load the new image. This automatically pushes the current state to history.
            this.loadImage(loadedImage); 

        } catch (error) {
            console.error("Error during image loading:", error);
        }
    }

    /**
     * Internal handler for the 'Load Image' button click.
     */
    private  handleLoadMaskClick(): void { 
        if (!this.onMaskLoad) {
            console.warn("onLoad handler is not defined. Cannot load image.");
            return;
        }

        try {
            const loadedImage = this.onMaskLoad();
            if (!loadedImage) return;
            
            // Load the new image. This automatically pushes the current state to history.
            this.loadMask(loadedImage.cimage); 

        } catch (error) {
            console.error("Error during image loading:", error);
        }
    }
    
    private renderMetadata(): void {
        this.handleZoom();
    }
    
    /**
     * Helper to create an immutable deep snapshot of the current image state.
     */
    private createImageSnapshot(): TypeImage {
        const currentImage = this.currentImage.cimage;
        // Create a new OffscreenCanvas
        const clonedCanvas = new OffscreenCanvas(currentImage.width, currentImage.height);
        // Draw the current state onto the cloned canvas to ensure a true copy
        clonedCanvas.getContext('2d')!.drawImage(currentImage, 0, 0);

        const snapshot: TypeImage = {
            ...this.currentImage,
            cimage: clonedCanvas // Use the cloned canvas
        };
        return snapshot;
    }

    /**
     * Updates the canvas display with content from an OffscreenCanvas (the image's cimage).
     */
    public updateCanvas(source: OffscreenCanvas): void {
        // Set main canvas dimensions
        this.canvas.width = source.width;
        this.canvas.height = source.height;
        
        // Update and redraw the mask pattern to match the new canvas size
        this.drawCurrentMaskPattern();
        
        // NEW: Update selector canvas size and redraw selector
        this.selectorCanvas.width = source.width;
        this.selectorCanvas.height = source.height;
        this.drawTileSelector(); 
        
        // Always draw the OffscreenCanvas onto the visible HTMLCanvas
        this.ctx.drawImage(source, 0, 0);
    }
    
    private pushHistory(): void {
        const state = this.createImageSnapshot();
        
        this.undoStack.push(state);
        console.log('PUSH HISTORY. Undo stack size:', this.undoStack.length);
        
        // Clear redo stack on any new action
        this.redoStack = []; 
        
        if (this.undoStack.length > HISTORY_LIMIT) {
            this.undoStack.shift();
            console.log("Shifted oldest state from undo history.");
        }
    }
    
    /**
     * UNDO: Moves current state to redo stack, loads previous state from undo stack.
     */
    public undo(): void {
        // We must have at least one state in the undo stack to revert to
        if (this.undoStack.length === 0) return;

        // 1. Snapshot the CURRENT state and push it to the redo stack
        this.redoStack.push(this.createImageSnapshot());

        // 2. Load the PREVIOUS state from the undo stack
        const previousImage = this.undoStack.pop()!;
        
        // 3. Update editor state without pushing to history (pushToHistory=false)
        this.currentImage = previousImage;
        this.updateCanvas(this.currentImage.cimage);
        this.renderMetadata();
        this.updateHistoryButtons();
        
        // This is the event trigger:
        if (this.onImageChange) {
            this.onImageChange(this.currentImage);
        }
        
        console.log(`UNDO complete. Undo: ${this.undoStack.length}, Redo: ${this.redoStack.length}`);
    }

    /**
     * REDO: Moves current state to undo stack, loads next state from redo stack.
     */
    public redo(): void {
        // We must have at least one state in the redo stack to move forward
        if (this.redoStack.length === 0) return;

        // 1. Snapshot the CURRENT state and push it to the undo stack
        this.undoStack.push(this.createImageSnapshot());

        // 2. Load the NEXT state from the redo stack
        const nextImage = this.redoStack.pop()!;
        
        // 3. Update editor state without pushing to history (pushToHistory=false)
        this.currentImage = nextImage;
        this.updateCanvas(this.currentImage.cimage);
        this.renderMetadata();
        this.updateHistoryButtons();

        // This is the event trigger:
        if (this.onImageChange) {
            this.onImageChange(this.currentImage);
        }
        
        console.log(`REDO complete. Undo: ${this.undoStack.length}, Redo: ${this.redoStack.length}`);
    }

    private updateHistoryButtons(): void {
        const undoBtn = this.containerDiv.querySelector('#undo-btn') as HTMLButtonElement;
        const redoBtn = this.containerDiv.querySelector('#redo-btn') as HTMLButtonElement;
        
        if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    }

    /**
     * Handles slider input to change canvas zoom level, resizing the container and scaling the wrapper.
     */
    private handleZoom(value?: string): void {
        if (value) {
            this.currentZoom = parseFloat(value);
        }
        // The zoom wrapper scales both the image, the mask, and the selector canvas simultaneously
        this.zoomWrapper.style.transform = `scale(${this.currentZoom})`;
       
        this.canvasContainer.style.width =  '100%';
        this.canvasContainer.style.height =  '100%';
        // this.canvasContainer.style.width = `${2 + Math.min(1024, this.currentImage.cimage.width * this.currentZoom)}px`;
        // this.canvasContainer.style.height = `${2 + Math.min(1024, this.currentImage.cimage.height * this.currentZoom)}px`;
        (this.containerDiv.querySelector('#zoom-value') as HTMLElement).textContent = this.currentZoom.toFixed(2);
    }
    
    private saveImage(): void {
        if (!this.onSave) {
            console.warn("onSave handler is not defined. Cannot save image.");
            return;
        }
        
        // Create a new OffscreenCanvas directly from the current image state
        const finalCanvas = this.createImageSnapshot().cimage;

        const savedImage: TypeImage = {
            ...this.currentImage,
            cimage: finalCanvas
        };
        
        this.onSave(savedImage);
    }
    private saveMask(): void {
        if (!this.onMaskSave) {
            console.warn("onSave handler is not defined. Cannot save image.");
            return;
        }
        
        // Create a new OffscreenCanvas directly from the current image state
        // const finalCanvas = this.createImageSnapshot().cimage;

        const savedMask: TypeImage = {
            cimage: this.currentMaskCanvasTile
        };
        
        this.onMaskSave(savedMask);
    }


}

// --- Example setup for running the class ---
let editorInstance: ImageEditorModule;

// --- 1. Initialize the editor without an image ---
export function initializeEmptyEditor(
    container_id : string = "editor-container"
) : ImageEditorModule{
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    editorInstance = new ImageEditorModule({
        divId: container_id,
    });
    console.log("Editor initialized. Handlers are currently undefined.");

    // --- Demo: Set handlers after initialization ---
    editorInstance.setHandlers({
        onSave: (_) => console.log(`[Demo Save] Image  data ready for storage.`),
        onLoad:  () => { 
            console.log(`[Demo Load] Simulating asynchronous image loading...`);
            
            // Create a 512x768 canvas (2x3 tiles)
            const simulatedNewImage: TypeImage = {
                cimage: new OffscreenCanvas(TILE_ASSET_SIZE * 2, TILE_ASSET_SIZE * 3),
            };
            const ctx = simulatedNewImage.cimage.getContext('2d');
            if (ctx) {
                // Draw a simple tiled pattern
                const colors = ['#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e74c3c', '#1abc9c'];
                for (let y = 0; y < 3; y++) {
                    for (let x = 0; x < 2; x++) {
                        ctx.fillStyle = colors[(y * 2 + x) % colors.length];
                        ctx.fillRect(x * TILE_ASSET_SIZE, y * TILE_ASSET_SIZE, TILE_ASSET_SIZE, TILE_ASSET_SIZE);
                    }
                }
            }
            return simulatedNewImage;
        },
        onImageChange: (image) => {
            // Demo for using the new getSelectedAsset method:
            const selectedTiles = editorInstance.getSelectedAsset();
            console.log(`[Demo Image Change] Image updated. Total selected tiles: ${selectedTiles.length}`);
        },
        onMaskChange: (maskTileCanvas) => {
             console.log(`[Demo Mask Change] Mask OffscreenCanvas tile updated. Dimensions: ${maskTileCanvas.width}x${maskTileCanvas.height}`);
        }
    });
    return editorInstance
}

// Start the module initialization
// initializeEmptyEditor();