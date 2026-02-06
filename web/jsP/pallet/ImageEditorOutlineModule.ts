// =========================================================================
// === UTILITY TYPES AND FUNCTIONS (Copied for consistency) ===
// =========================================================================

/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

interface RGB { r: number; g: number; b: number; a: number; }

/** Converts a hex color string (#RRGGBB) to an RGB object (A=255). */
function hexToRgb(hex: string): RGB {
    const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);
    return { r, g, b, a: 255 };
}

/** Calculates the distance between two RGB colors (Euclidean distance). */
function colorDistance(rgb1: RGB, rgb2: RGB): number {
    // Note: Alpha is ignored for color distance in this context
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

/** Extracts RGB values from an ImageData array at a specific index. */
function getPixelRgba(data: Uint8ClampedArray, index: number): RGB {
    return {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2],
        a: data[index + 3]
    };
}

/** Writes RGB values to an ImageData array at a specific index. */
function setPixelRgba(data: Uint8ClampedArray, index: number, color: RGB): void {
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = color.a;
}

// =========================================================================
// === INTERFACES ===
// =========================================================================

export interface ImageEditorOutlineModuleParams {
    image?: TypeImage;
    divId: string;
}

// =========================================================================
// === ASSET OUTLINE MODULE ===
// =========================================================================

export class ImageEditorOutlineModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 

    private onChange?: (image: TypeImage) => void;

    // State for various sections (Thickness is implicitly 1)
    private removeEdgeState = {
        color: '#000000', 
        tolerance: 10,
        thickness: 1, // Fixed at 1
    };
    private addEdgeState = {
        color: '#ff0000', 
        thickness: 1, // Fixed at 1
    };

    // DOM References
    private removeColorInput!: HTMLInputElement;
    private removeToleranceInput!: HTMLInputElement;
    private removeBtn!: HTMLButtonElement;
    
    private addColorInput!: HTMLInputElement;
    private addBtn!: HTMLButtonElement;
    
    constructor(params: ImageEditorOutlineModuleParams) {
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
        this.canvas = this.containerDiv.querySelector('#outline-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        const idSuffix = this.containerDiv.id;
        
        // 1. Remove Edge
        this.removeColorInput = this.containerDiv.querySelector(`#removeColor-${idSuffix}`) as HTMLInputElement;
        this.removeToleranceInput = this.containerDiv.querySelector(`#removeTolerance-${idSuffix}`) as HTMLInputElement;
        this.removeBtn = this.containerDiv.querySelector(`#removeEdgeBtn-${idSuffix}`) as HTMLButtonElement;
        
        // 2. Add Edge
        this.addColorInput = this.containerDiv.querySelector(`#addColor-${idSuffix}`) as HTMLInputElement;
        this.addBtn = this.containerDiv.querySelector(`#addEdgeBtn-${idSuffix}`) as HTMLButtonElement;
    }

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        return `
            <style>
                .control-section { margin-bottom: 20px; padding: 10px; border: 1px solid #34495e; border-radius: 4px; }
                .section-header { font-weight: bold; margin-bottom: 10px; color: #e67e22; }
                .control-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
                .control-row label { width: 140px; font-size: 0.9em; }
                .control-row input[type="range"], .control-row input[type="number"] { flex-grow: 1; }
                .control-row input[type="color"] { width: 40px; height: 25px; padding: 0; border: none; cursor: pointer; }
                .control-row .value-span { width: 50px; text-align: right; font-weight: bold; }

                .apply-button-container { margin-top: 10px; }
                .apply-button-container button {
                    width: 100%;
                    padding: 8px;
                    background-color: #2ecc71;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.1s;
                }
                .apply-button-container button:hover:not(:disabled) { background-color: #27ae60; }
                .apply-button-container button:disabled { background-color: #bdc3c7; cursor: not-allowed; }
                
                #outline-canvas { display:none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Edge Manipulation Tools</summary>

                
                <canvas id="outline-canvas"></canvas>

                <div class="control-section">
                    <div class="section-header">1. Remove Edge (Anti-Outline, 1px)</div>
                    <div class="control-row">
                        <label for="removeColor-${idSuffix}">Outline Color:</label>
                        <input type="color" id="removeColor-${idSuffix}" value="${this.removeEdgeState.color}">
                    </div>
                    <div class="control-row">
                        <label>Tolerance (Color Match):</label>
                        <input type="range" id="removeTolerance-${idSuffix}" min="0" max="50" step="1" value="${this.removeEdgeState.tolerance}">
                        <span id="removeToleranceValue-${idSuffix}" class="value-span">${this.removeEdgeState.tolerance}</span>
                    </div>
                    <div class="apply-button-container">
                        <button id="removeEdgeBtn-${idSuffix}" disabled>Remove 1px Edges</button>
                    </div>
                </div>

                <div class="control-section">
                    <div class="section-header">2. Add Edge (External Outline, 1px)</div>
                    <div class="control-row">
                        <label for="addColor-${idSuffix}">New Edge Color:</label>
                        <input type="color" id="addColor-${idSuffix}" value="${this.addEdgeState.color}">
                    </div>
                    <div class="apply-button-container">
                        <button id="addEdgeBtn-${idSuffix}" disabled>Add 1px External Edge</button>
                    </div>
                </details></div>
            </div>
        `;
    }

    private attachEventListeners() {
        // Helper to update span and state for range/number inputs
        const setupInput = (input: HTMLInputElement, stateKey: keyof typeof this.removeEdgeState, stateObject: any, valueSpan: HTMLElement) => {
            const update = () => {
                const value = parseInt(input.value, 10);
                stateObject[stateKey] = value;
                valueSpan.textContent = String(value);
            };
            input.addEventListener('input', update);
            update(); // Initial sync
        };

        // 1. Remove Edge Listeners
        this.removeColorInput.addEventListener('input', (e) => this.removeEdgeState.color = (e.target as HTMLInputElement).value);
        setupInput(this.removeToleranceInput, 'tolerance', this.removeEdgeState, this.containerDiv.querySelector(`#removeToleranceValue-${this.containerDiv.id}`) as HTMLElement);
        this.removeBtn.addEventListener('click', () => this.handleRemoveEdge());

        // 2. Add Edge Listeners
        this.addColorInput.addEventListener('input', (e) => this.addEdgeState.color = (e.target as HTMLInputElement).value);
        this.addBtn.addEventListener('click', () => this.handleAddEdge());
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
        this.removeBtn.disabled = !enabled;
        this.addBtn.disabled = !enabled;
    }

    private drawImageToCanvas(source: OffscreenCanvas): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (source) {
            this.ctx.drawImage(source as unknown as CanvasImageSource, 0, 0);
        }
    }
    
    /** * Applies a mutation function to a copy of the current image's pixel data.
     * The mutationFn modifies the ImageData in place and returns true if changes were made.
     * * @param mutationFn A function that modifies the passed ImageData and returns boolean (true if changed).
     */
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
        } else {
            console.log('Mutation function returned false. No changes committed.');
        }
    }


    // =========================================================================
    // === 1. REMOVE EDGE LOGIC (FIXED: Applies only to 1px outline) ===
    // =========================================================================

    private handleRemoveEdge() {
        this.commitMutation((imageData) => {
            const { width, height, data: originalData } = imageData;
            const colorToRemove = hexToRgb(this.removeEdgeState.color);
            const tolerance = this.removeEdgeState.tolerance;
            const thickness = 1; // Fixed
            let changed = false;

            const sourceData = new Uint8ClampedArray(originalData);
            const updates: { index: number, color: RGB }[] = [];

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixelIndex4D = (y * width + x) * 4;
                    const currentPixel = getPixelRgba(sourceData, pixelIndex4D);
                    
                    if (currentPixel.a === 0) continue; 

                    // 1. Only proceed if the pixel matches the color to remove
                    if (colorDistance(currentPixel, colorToRemove) <= tolerance) {
                        
                        let isEdgePixel = false;
                        let bestReplacementColor: RGB | null = null;
                        let minDistance = Infinity;

                        // 2. Search neighbors within the fixed 1px thickness radius (i.e., immediate 8-neighbors)
                        for (let dy = -thickness; dy <= thickness; dy++) {
                            for (let dx = -thickness; dx <= thickness; dx++) {
                                if (dx === 0 && dy === 0) continue; 
                                
                                const nx = x + dx;
                                const ny = y + dy;

                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    const ni4D = (ny * width + nx) * 4;
                                    const neighbor = getPixelRgba(sourceData, ni4D);
                                    
                                    // CRITICAL: Check if neighbor is transparent (to confirm it's an external edge pixel)
                                    if (neighbor.a === 0) {
                                        isEdgePixel = true;
                                    }

                                    // 3. Find the best SOLID, NON-OUTLINE neighbor for replacement
                                    if (neighbor.a > 0 && colorDistance(neighbor, colorToRemove) > tolerance) {
                                        const distToSource = colorDistance(currentPixel, neighbor);
                                        if (distToSource < minDistance) {
                                            minDistance = distToSource;
                                            bestReplacementColor = neighbor;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // 4. APPLY CONDITION: ONLY process the removal if it's confirmed as an edge pixel
                        if (isEdgePixel) {
                            // Record the update: replace or make transparent
                            if (bestReplacementColor) {
                                updates.push({ index: pixelIndex4D, color: bestReplacementColor });
                            } else {
                                // Fallback: If no valid solid neighbor is found, make the pixel transparent.
                                updates.push({ index: pixelIndex4D, color: { r: 0, g: 0, b: 0, a: 0 } });
                            }
                        }
                    }
                }
            }

            // 5. Apply all collected changes to the final image data
            if (updates.length > 0) {
                updates.forEach(({ index, color }) => {
                    setPixelRgba(originalData, index, color);
                });
                changed = true;
            }

            return changed;
        });
    }

    // =========================================================================
    // === 2. ADD EDGE LOGIC (Thickness fixed to 1) ===
    // =========================================================================

    private handleAddEdge() {
        this.commitMutation((imageData) => {
            const { width, height, data: originalData } = imageData;
            const edgeColor = hexToRgb(this.addEdgeState.color);
            const thickness = 1; // Fixed
            let changed = false;

            // Use a copy of the original data for reading
            const sourceData = new Uint8ClampedArray(originalData); 
            const updates: { index: number, color: RGB }[] = [];

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixelIndex4D = (y * width + x) * 4;
                    const currentPixel = getPixelRgba(sourceData, pixelIndex4D); 
                    
                    // We only care about transparent pixels
                    if (currentPixel.a === 0) {
                        let hasSolidNeighbor = false;
                        
                        for (let dy = -thickness; dy <= thickness; dy++) {
                            for (let dx = -thickness; dx <= thickness; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                
                                const nx = x + dx;
                                const ny = y + dy;

                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    const ni4D = (ny * width + nx) * 4;
                                    const neighbor = getPixelRgba(sourceData, ni4D); 

                                    // Check if there is a solid (alpha > 0) neighbor
                                    if (neighbor.a > 0) {
                                        hasSolidNeighbor = true;
                                        break;
                                    }
                                }
                            }
                            if (hasSolidNeighbor) break;
                        }

                        // If a solid neighbor was found, record the change
                        if (hasSolidNeighbor) {
                            updates.push({ index: pixelIndex4D, color: edgeColor });
                        }
                    }
                }
            }
            
            // Apply all collected changes
            if (updates.length > 0) {
                 updates.forEach(({ index, color }) => {
                    setPixelRgba(originalData, index, color); // Write to the primary array
                });
                changed = true;
            }
            return changed;
        });
    }
}

// --- Example setup for running the class ---
export function initializeOutlineEditor(
    container_id : string = "editor-outline-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const outlineEditorInstance = new ImageEditorOutlineModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET,
        
    });
    outlineEditorInstance.setHandlers({
        onChange: (image) => {
            if (image) {
                console.log(`[Outline Editor Change] New image version committed. `);
            }
        },
    })
    return outlineEditorInstance;
}

// Start the module initialization
// initializeOutlineEditor();