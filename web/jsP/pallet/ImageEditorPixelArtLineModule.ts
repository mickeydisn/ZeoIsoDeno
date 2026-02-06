// =========================================================================
// === UTILITY TYPES AND FUNCTIONS (Copied for consistency) ===
// =========================================================================

/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";


interface RGB { r: number; g: number; b: number; a: number; }


/** Writes RGB values to an ImageData array at a specific index. */
function setPixelRgba(data: Uint8ClampedArray, index: number, color: RGB): void {
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = color.a;
}

/** Converts a hex color string (#RRGGBB) to an RGB object (A=255). */
function hexToRgba(hex: string): RGB {
    const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);
    return { r, g, b, a: 255 };
}

// =========================================================================
// === INTERFACES ===
// =========================================================================

export interface ImageEditorPixelArtLineModuleParams {
    image?: TypeImage;
    divId: string;
}


// =========================================================================
// === PIXEL ART LINE MODULE ===
// =========================================================================

export class ImageEditorPixelArtLineModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 

    private onChange?: (image: TypeImage) => void;
    
    // State for refinement settings
    private refinementState = {
        edgeFillColorHex: '#000000', // NEW: Default fill color: Black
    };

    // DOM References
    private sharpenBtn!: HTMLButtonElement;
    private edgeFillColorPicker!: HTMLInputElement; // NEW: Color picker DOM element


    constructor(params: ImageEditorPixelArtLineModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }
        
        this.containerDiv = container;
        this.currentImage = params.image || DEFAULT_EMPTY_ASSET;

        this.containerDiv.innerHTML = this.renderInitialStructure();
        
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        this.loadImage(this.currentImage);
    }
    
    /**
     * PUBLIC METHOD: Sets or updates the onChange handler.
     */
    public setHandlers(handlers: { 
        onChange?: (image: TypeImage) => void;
        }): void {
        this.onChange = handlers.onChange;
        console.log('Transformer handlers updated.');
        
        // Re-render and reinitialize DOM to ensure controls/handlers are fresh
        this.containerDiv.innerHTML = this.renderInitialStructure();
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        this.loadImage(this.currentImage); 
    }
    
    private reinitializeDOMReferences(): void {
        this.canvas = this.containerDiv.querySelector('#line-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        const idSuffix = this.containerDiv.id;
        this.sharpenBtn = this.containerDiv.querySelector(`#sharpenLineBtn-${idSuffix}`) as HTMLButtonElement;
        
        // NEW: Reference for the color picker
        this.edgeFillColorPicker = this.containerDiv.querySelector(`#edgeFillColorPicker-${idSuffix}`) as HTMLInputElement;
        this.edgeFillColorPicker.value = this.refinementState.edgeFillColorHex;
    }

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        return `
            <style>
                .control-section { margin-bottom: 20px; padding: 10px; border: 1px solid #34495e; border-radius: 4px; }
                .section-header { font-weight: bold; margin-bottom: 10px; color: #e67e22; }
                .control-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; justify-content: space-between; }
                
                .apply-button-container { margin-top: 10px; }
                .apply-button-container button {
                    width: 100%;
                    padding: 8px;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.1s;
                }
                .apply-button-container button:hover:not(:disabled) { background-color: #2980b9; }
                .apply-button-container button:disabled { background-color: #bdc3c7; cursor: not-allowed; }
                
                #line-canvas { display:none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Pixel Art Line Refinement</summary>
                
                <canvas id="line-canvas"></canvas>

                <div class="control-section">
                    <div class="section-header">1. Two-Pass Isometric Edge Reconstruction (30°/60° Priority)</div>
                    <div class="apply-button-container">
                        <button id="sharpenLineBtn-${idSuffix}" disabled>Run Two-Pass Edge Cleaning</button>
                    </div>
                </div>

                <div class="control-section">
                    <div class="section-header">2. Edge Gap Reconstruction Color</div>
                    <p>Select the color to use when filling 1-pixel gaps in 30°/60° lines during the second pass.</p>
                    <div class="control-row">
                        <label for="edgeFillColorPicker-${idSuffix}">Fill Color:</label>
                        <input type="color" id="edgeFillColorPicker-${idSuffix}" value="${this.refinementState.edgeFillColorHex}" style="width: 50px;">
                    </div>
                </div>
                
            </details></div>
        `;
    }

    private attachEventListeners() {
        this.sharpenBtn.addEventListener('click', () => this.handleLineSharpen());
        
        // NEW: Event listener for the color picker
        this.edgeFillColorPicker.addEventListener('change', (e) => {
            this.refinementState.edgeFillColorHex = (e.target as HTMLInputElement).value;
            console.log(`Edge Fill Color set to: ${this.refinementState.edgeFillColorHex}`);
        });
    }
    
    // =========================================================================
    // === CORE FRAMEWORK METHODS ===
    // =========================================================================
    
    public loadImage(image: TypeImage): void {
        this.currentImage = image;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;
        this.drawImageToCanvas(image.cimage);
        this.updateMetadata();
    }
    
    private updateMetadata(): void {
        this.updateControlStates(this.currentImage !== DEFAULT_EMPTY_ASSET);
    }
    
    private updateControlStates(enabled: boolean): void {
        this.sharpenBtn.disabled = !enabled;
    }

    private drawImageToCanvas(source: OffscreenCanvas): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (source) {
            this.ctx.drawImage(source as unknown as CanvasImageSource, 0, 0);
        }
    }
    
    /** * Applies a mutation function to a copy of the current image's pixel data. */
    private commitMutation(mutationFn: (imageData: ImageData) => boolean): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        // 1. Get original image data 
        this.drawImageToCanvas(this.currentImage.cimage); 
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // 2. Perform mutation/transformation (in-place modification)
        if (mutationFn(imageData)) {
            // 3. Apply changes to the displayed canvas
            this.ctx.putImageData(imageData, 0, 0);

            // 4. Update the internal TypeImage (OffscreenCanvas) by copying the main canvas
            const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
            newOffscreenCanvas.getContext('2d')!.drawImage(this.canvas as unknown as CanvasImageSource, 0, 0);
            
            this.currentImage = {
                ...this.currentImage,
                cimage: newOffscreenCanvas,
            };
            
            // 5. Notify parent/external system of the change
            this.onChange?.(this.currentImage);
            console.log(`Line cleaning committed`);
        } else {
            console.log('No line cleaning changes committed.');
        }
    }


    // =========================================================================
    // === 1. ISOMETRIC EDGE CLEANING CORE LOGIC (Two-Pass) ===
    // =========================================================================

    // Defines neighbor positions in a 3x3 kernel
    private readonly NEIGHBORS = [
        { dx: 0, dy: -1, type: 'O' },  // N (0)
        { dx: 0, dy: 1, type: 'O' },   // S (1)
        { dx: 1, dy: 0, type: 'O' },   // E (2)
        { dx: -1, dy: 0, type: 'O' },  // W (3)
        { dx: -1, dy: -1, type: 'D' }, // TL (4)
        { dx: 1, dy: -1, type: 'D' },  // TR (5)
        { dx: -1, dy: 1, type: 'D' },  // BL (6)
        { dx: 1, dy: 1, type: 'D' },   // BR (7)
    ];

    /**
     * Structural pairs defining 0, 90, 30, and 60 degree line segments.
     * These patterns are used for both PRESERVATION (Pass 1) and RECONSTRUCTION (Pass 2).
     */
    private readonly ISOMETRIC_LINE_PAIRS = [
        // 0 / 90 degrees (Orthogonal)
        [{dx: -1, dy: 0}, {dx: 1, dy: 0}], // Horizontal (W-E)
        [{dx: 0, dy: -1}, {dx: 0, dy: 1}], // Vertical (N-S)
        
        // 30 degrees (1:2 slope - shallow isometric, all 4 quadrants)
        [{dx: -1, dy: 0}, {dx: 1, dy: 1}],  // W to BR (1:2 Positive)
        [{dx: 1, dy: 0}, {dx: -1, dy: -1}], // E to TL (1:2 Positive Reverse)
        [{dx: -1, dy: 0}, {dx: 1, dy: -1}], // W to TR (1:2 Negative)
        [{dx: 1, dy: 0}, {dx: -1, dy: 1}],  // E to BL (1:2 Negative Reverse)
        
        // 60 degrees (2:1 slope - steep isometric, all 4 quadrants)
        [{dx: 0, dy: -1}, {dx: 1, dy: 1}],  // N to BR (2:1 Positive)
        [{dx: 0, dy: 1}, {dx: -1, dy: -1}], // S to TL (2:1 Positive Reverse)
        [{dx: 0, dy: -1}, {dx: -1, dy: 1}], // N to BL (2:1 Negative)
        [{dx: 0, dy: 1}, {dx: 1, dy: -1}],  // S to TR (2:1 Negative Reverse)
    ];


    private handleLineSharpen() {
        this.commitMutation((imageData) => {
            const { width, height, data: originalData } = imageData;
            let changed = false;

            // Helper to check neighbor opacity (color-agnostic)
            const checkNeighborOpaque = (data: Uint8ClampedArray, nx: number, ny: number): boolean => {
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                    return false; // Out-of-bounds is non-opaque
                }
                const ni4D = (ny * width + nx) * 4;
                // Opaque means Alpha > 0
                return data[ni4D + 3] > 0;
            };

            // --- PASS 1: EROSION / THINNING (Remove Noise & 45° Jaggies) ---
            
            // 1. Process for removal candidates based on original data
            const sourceDataPass1 = new Uint8ClampedArray(originalData);
            const updatesToRemove: Set<number> = new Set(); 
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixelIndex4D = (y * width + x) * 4;
                    
                    // Only process solid/opaque pixels for potential removal
                    if (!checkNeighborOpaque(sourceDataPass1, x, y)) {
                        continue; 
                    }

                    let solidNeighborCount = 0;
                    let solidDiagonalNeighbors = 0;
                    let hasTransparentNeighbor = false;
                    
                    for (const { dx, dy, type } of this.NEIGHBORS) {
                        const isOpaque = checkNeighborOpaque(sourceDataPass1, x + dx, y + dy);
                        
                        if (isOpaque) {
                            solidNeighborCount++;
                            if (type === 'D') {
                                solidDiagonalNeighbors++;
                            }
                        } else {
                            hasTransparentNeighbor = true; 
                        }
                    }

                    // Must be an edge pixel AND non-structural to be removed
                    if (!hasTransparentNeighbor) {
                        continue; // Interior pixels are safe
                    }
                    
                    // PRESERVATION CHECK: If the pixel is structural (part of 0/90/30/60 line), KEEP IT.
                    let isStructural = false;
                    for (const [p1, p2] of this.ISOMETRIC_LINE_PAIRS) {
                        const isP1Opaque = checkNeighborOpaque(sourceDataPass1, x + p1.dx, y + p1.dy);
                        const isP2Opaque = checkNeighborOpaque(sourceDataPass1, x + p2.dx, y + p2.dy);

                        if (isP1Opaque && isP2Opaque) {
                            isStructural = true;
                            break;
                        }
                    }

                    if (isStructural) {
                        continue; 
                    }
                    
                    // REMOVAL CHECK: Non-structural, non-preserved noise/jaggy
                    
                    // Condition A: Noise/Tip/Protrusion (Opaque Neighbors <= 2)
                    if (solidNeighborCount <= 2) { 
                        updatesToRemove.add(pixelIndex4D);
                        continue; 
                    }

                    // Condition B: Explicit 45° Jaggy (non-structural diagonal cross)
                    if (solidNeighborCount === 4 && solidDiagonalNeighbors === 4) {
                        updatesToRemove.add(pixelIndex4D); 
                        continue;
                    }
                }
            }
            
            // 2. Apply Pass 1 removals to `originalData`
            if (updatesToRemove.size > 0) {
                const transparentColor = { r: 0, g: 0, b: 0, a: 0 };
                updatesToRemove.forEach((index) => {
                    setPixelRgba(originalData, index, transparentColor);
                });
                changed = true;
            }
            
            // --- PASS 2: RECONSTRUCTION / DILATION (Snap Gaps) ---

            // 3. Process for fill candidates based on thinned data
            const sourceDataPass2 = new Uint8ClampedArray(originalData); // Thinned image
            const updatesToFill: Set<number> = new Set(); 
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    // Current pixel being inspected is at (x, y)
                    
                    // Only process transparent pixels for potential filling
                    if (checkNeighborOpaque(sourceDataPass2, x, y)) {
                        continue; 
                    }

                    let shouldFill = false;
                    
                    // Check all defined isometric line pairs (P1 [gap] P2)
                    for (const [p1, p2] of this.ISOMETRIC_LINE_PAIRS) {
                        const isP1Opaque = checkNeighborOpaque(sourceDataPass2, x + p1.dx, y + p1.dy);
                        const isP2Opaque = checkNeighborOpaque(sourceDataPass2, x + p2.dx, y + p2.dy);

                        // If the transparent pixel is a 1-pixel gap between two opaque structural pixels, fill it.
                        if (isP1Opaque && isP2Opaque) {
                            shouldFill = true;
                            break; 
                        }
                    }

                    if (shouldFill) { 
                        updatesToFill.add((y * width + x) * 4);
                    }
                }
            }

            // 4. Apply Pass 2 filling changes to `originalData`
            if (updatesToFill.size > 0) {
                // NEW: Use the user-defined color for filling the gap
                const fillRgba = hexToRgba(this.refinementState.edgeFillColorHex);

                updatesToFill.forEach((index) => {
                    // Fill the transparent pixel with the chosen color (and opaque alpha)
                    setPixelRgba(originalData, index, fillRgba);
                });
                changed = true;
            }

            return changed;
        });
    }
}


// --- Example setup for running the class ---

export function initializeLineEditor(
    container_id : string = "editor-line-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const lineEditorInstance = new ImageEditorPixelArtLineModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET,
        
    });
    lineEditorInstance.setHandlers({
        onChange: (_) => {
        },
    })
    return lineEditorInstance;
}

// Start the module initialization
// initializeLineEditor();