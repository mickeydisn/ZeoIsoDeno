// =========================================================================
// === UTILITY TYPES AND FUNCTIONS (Copied for consistency) ===
// =========================================================================

/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

interface RGB { r: number; g: number; b: number; a: number; }

/** * Type definition for a potential color replacement candidate.
 * This structure holds color data and scoring metrics.
 */
type ColorCandidate = { 
    color: RGB; 
    iso_count: number;    // Count of 30/60 degree segments this color completes
    ortho_count: number;  // Count of 0/90 degree segments this color completes
    count: number;        // Total neighbor count in the 3x3 kernel
    luminance: number;    // Calculated luminance for dark/light priority
};

/** Type alias for line orientation/type. */
type LineType = 'O' | 'I'; // O=Orthogonal (0/90), I=Isometric (30/60)

/** Type definition for a line segment pair. */
interface LineSegment {
    pair: [{ dx: number, dy: number }, { dx: number, dy: number }];
    type: LineType;
}


/** Checks if two RGB colors are exactly the same (strict comparison). */
function isSameColor(rgb1: RGB, rgb2: RGB): boolean {
    return rgb1.r === rgb2.r && rgb1.g === rgb2.g && rgb1.b === rgb2.b && rgb1.a === rgb2.a;
}

/** * Calculates the relative luminance (a measure of perceived brightness/darkness).
 * Lower value means darker color. (Formula: L = 0.2126R + 0.7152G + 0.0722B)
 */
function getColorLuminance(rgb: RGB): number {
    return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b);
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
// === INTERFACES & STATE ===
// =========================================================================

export interface ImageEditorPixelArtOutlineModuleParams {
    image?: TypeImage;
    divId: string;
}


// =========================================================================
// === PIXEL ART DARK LINE MODULE ===
// =========================================================================

export class ImageEditorPixelArtOutlineModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 

    private onChange?: (image: TypeImage) => void;
    
    // State for the color priority (dark or light)
    private smoothingState = {
        priority: 'dark' as 'dark' | 'light',
    };
    
    // DOM References
    private darkPrioCheckbox!: HTMLInputElement;
    private lightPrioCheckbox!: HTMLInputElement;
    private smoothBtn!: HTMLButtonElement;


    constructor(params: ImageEditorPixelArtOutlineModuleParams) {
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
        this.canvas = this.containerDiv.querySelector('#color-line-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        const idSuffix = this.containerDiv.id;
        this.smoothBtn = this.containerDiv.querySelector(`#smoothColorLineBtn-${idSuffix}`) as HTMLButtonElement;
        this.darkPrioCheckbox = this.containerDiv.querySelector(`#darkPrio-${idSuffix}`) as HTMLInputElement;
        this.lightPrioCheckbox = this.containerDiv.querySelector(`#lightPrio-${idSuffix}`) as HTMLInputElement;
        
        // Sync DOM with current state
        if (this.smoothingState.priority === 'dark') {
            this.darkPrioCheckbox.checked = true;
        } else {
            this.lightPrioCheckbox.checked = true;
        }
    }

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        return `
            <style>
                .control-section { margin-bottom: 20px; padding: 10px; border: 1px solid #34495e; border-radius: 4px; }
                .section-header { font-weight: bold; margin-bottom: 10px; color: #e67e22; }
                .control-row { display: flex; align-items: center; gap: 20px; margin-bottom: 8px; }
                .control-row label { cursor: pointer; }
                
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
                
                #color-line-canvas { display:none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Pixel Art Color Boundary Smoothing</summary>
                
                <canvas id="color-line-canvas"></canvas>

                <div class="control-section">
                    <div class="section-header">1. Isometric Line Smoothing (3x3 Kernel & Slope Priority)</div>
                    
                    <div class="control-row">
                        <label>
                            <input type="radio" name="colorPrio-${idSuffix}" id="darkPrio-${idSuffix}" value="dark" ${this.smoothingState.priority === 'dark' ? 'checked' : ''}> 
                            Prioritize Darkest Line Color
                        </label>
                        <label>
                            <input type="radio" name="colorPrio-${idSuffix}" id="lightPrio-${idSuffix}" value="light" ${this.smoothingState.priority === 'light' ? 'checked' : ''}> 
                            Prioritize Lightest Line Color
                        </label>
                    </div>

                    <div class="apply-button-container">
                        <button id="smoothColorLineBtn-${idSuffix}" disabled>Run Line Smoothing</button>
                    </div>
                </div>
            </details></div>
        `;
    }

    private attachEventListeners() {
        this.smoothBtn.addEventListener('click', () => this.handleColorLineSmoothing());
        
        const idSuffix = this.containerDiv.id;
        const radioGroup = this.containerDiv.querySelectorAll(`input[name="colorPrio-${idSuffix}"]`);
        
        radioGroup.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.smoothingState.priority = (e.target as HTMLInputElement).value as 'dark' | 'light';
                console.log(`Priority set to: ${this.smoothingState.priority}`);
            });
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
        this.smoothBtn.disabled = !enabled;
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
            console.log(`Color line smoothing committed`);
        } else {
            console.log('No color line smoothing changes committed.');
        }
    }


    // =========================================================================
    // === 1. ISOMETRIC COLOR BOUNDARY SMOOTHING LOGIC (Single-Pass) ===
    // =========================================================================

    /**
     * Defines all 8 neighbor positions in a 3x3 kernel.
     */
    private readonly NEIGHBORS_3X3 = (() => {
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                neighbors.push({ dx, dy });
            }
        }
        return neighbors;
    })();

    /**
     * Structural pairs defining 0/90 (orthogonal) and 30/60 (isometric) line segments.
     */
    private readonly LINE_SEGMENTS: LineSegment[] = [
        // 0 / 90 degrees (Orthogonal - Type 'O')
        { pair: [{dx: -1, dy: 0}, {dx: 1, dy: 0}], type: 'O' }, // Horizontal (W-E)
        { pair: [{dx: 0, dy: -1}, {dx: 0, dy: 1}], type: 'O' }, // Vertical (N-S)
        
        // 30 degrees (1:2 slope - Type 'I')
        { pair: [{dx: -1, dy: 0}, {dx: 1, dy: 1}], type: 'I' },  // W to BR (1:2 Positive)
        { pair: [{dx: 1, dy: 0}, {dx: -1, dy: -1}], type: 'I' }, // E to TL (1:2 Positive Reverse)
        { pair: [{dx: -1, dy: 0}, {dx: 1, dy: -1}], type: 'I' }, // W to TR (1:2 Negative)
        { pair: [{dx: 1, dy: 0}, {dx: -1, dy: 1}], type: 'I' },  // E to BL (1:2 Negative Reverse)
        
        // 60 degrees (2:1 slope - Type 'I')
        { pair: [{dx: 0, dy: -1}, {dx: 1, dy: 1}], type: 'I' },  // N to BR (2:1 Positive)
        { pair: [{dx: 0, dy: 1}, {dx: -1, dy: -1}], type: 'I' }, // S to TL (2:1 Positive Reverse)
        { pair: [{dx: 0, dy: -1}, {dx: -1, dy: 1}], type: 'I' }, // N to BL (2:1 Negative)
        { pair: [{dx: 0, dy: 1}, {dx: 1, dy: -1}], type: 'I' },  // S to TR (2:1 Negative Reverse)
    ];


    private handleColorLineSmoothing() {
        this.commitMutation((imageData) => {
            const { width, height, data: originalData } = imageData;
            const priority = this.smoothingState.priority;
            let changed = false;

            // Use a copy of the original data for all reading operations
            const sourceData = new Uint8ClampedArray(originalData);
            const updatesToChangeColor: Map<number, RGB> = new Map(); 

            // Helper to check neighbor opacity
            const checkNeighborOpaque = (data: Uint8ClampedArray, nx: number, ny: number): boolean => {
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                    return false; // Out-of-bounds is non-opaque
                }
                const ni4D = (ny * width + nx) * 4;
                return data[ni4D + 3] > 0;
            };

            // Limit processing area to account for the 3x3 kernel (1-pixel border)
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const pixelIndex4D = (y * width + x) * 4;
                    const currentPixel = getPixelRgba(sourceData, pixelIndex4D);
                    
                    if (currentPixel.a === 0) continue; 

                    let isColorBoundary = false;
                    let isStructural = false;
                    
                    // Map to store potential replacement colors and their line segment scores
                    const neighborColors: Map<string, ColorCandidate> = new Map();
                    
                    // Helper function to update the neighbor color map
                    // NOTE: 'type' is correctly restricted to 'O' | 'I' here.
                    const updateColorGroup = (color: RGB, type: LineType) => {
                        const key = `${color.r},${color.g},${color.b},${color.a}`;
                        const existing = neighborColors.get(key);

                        // If color already tracked, update the scores
                        if (existing) {
                            if (type === 'I') existing.iso_count++;
                            if (type === 'O') existing.ortho_count++;
                            existing.count++;
                        } else {
                            // If new color, create a new candidate entry
                            const newCandidate: ColorCandidate = { 
                                color, 
                                iso_count: type === 'I' ? 1 : 0, 
                                ortho_count: type === 'O' ? 1 : 0, 
                                count: 1, 
                                luminance: getColorLuminance(color) 
                            };
                            neighborColors.set(key, newCandidate);
                        }
                    };

                    // --- INITIAL CHECK: STRUCTURAL PRESERVATION & IDENTIFY BOUNDARY ---
                    
                    // Analyze line segments for preservation and to tally non-matching segments
                    for (const { pair, type } of this.LINE_SEGMENTS) {
                        const [p1, p2] = pair;
                        const p1x = x + p1.dx;
                        const p1y = y + p1.dy;
                        const p2x = x + p2.dx;
                        const p2y = y + p2.dy;

                        const isP1Opaque = checkNeighborOpaque(sourceData, p1x, p1y);
                        const isP2Opaque = checkNeighborOpaque(sourceData, p2x, p2y);

                        if (isP1Opaque && isP2Opaque) {
                            const p1Color = getPixelRgba(sourceData, (p1y * width + p1x) * 4);
                            const p2Color = getPixelRgba(sourceData, (p2y * width + p2x) * 4);
                            
                            // Check for color boundary
                            if (!isSameColor(currentPixel, p1Color) || !isSameColor(currentPixel, p2Color)) {
                                isColorBoundary = true;
                            }
                            
                            // 1. Structural Preservation: If the center pixel completes a line of ITS OWN color.
                            if (isSameColor(currentPixel, p1Color) && isSameColor(currentPixel, p2Color)) {
                                isStructural = true;
                                break; // Stop checking for structural support
                            }

                            // 2. Candidate Scoring: If p1 and p2 are the SAME non-matching color, 
                            // they represent a line that the current pixel could complete.
                            if (isSameColor(p1Color, p2Color) && !isSameColor(p1Color, currentPixel)) {
                                // 'type' is now correctly inferred as LineType, resolving the TS error.
                                updateColorGroup(p1Color, type);
                            }
                        }
                    }

                    if (isStructural) {
                        continue; // Structural lines are always preserved.
                    }
                    if (!isColorBoundary) {
                        continue; // If no boundary detected, nothing to smooth.
                    }
                    
                    // --- SMOOTHING / COLOR CHANGE (Non-Structural Jaggy) ---
                    
                    let bestColor: RGB | null = null;
                    
                    // Filter candidates to only include non-matching colors
                    const candidateColors = Array.from(neighborColors.values()).filter(c => !isSameColor(c.color, currentPixel));
                    
                    if (candidateColors.length === 0) continue; 
                    
                    // Priority 1: Max Isometric Score (30/60 degree)
                    const maxIsoScore = candidateColors.reduce((max, c) => Math.max(max, c.iso_count), -1);
                    let finalCandidates = candidateColors.filter(c => c.iso_count === maxIsoScore);

                    // Priority 2: Max Orthogonal Score (0/90 degree) - only if no better ISO score found
                    if (finalCandidates.length > 1 && maxIsoScore <= 0) {
                        const maxOrthoScore = finalCandidates.reduce((max, c) => Math.max(max, c.ortho_count), -1);
                        finalCandidates = finalCandidates.filter(c => c.ortho_count === maxOrthoScore);
                    }
                    
                    // Priority 3: Dark/Light Priority (Final Tiebreaker)
                    if (finalCandidates.length > 0) {
                        let bestCandidate: ColorCandidate | null = null;
                        
                        if (priority === 'dark') {
                            // Find the darkest (min luminance)
                            bestCandidate = finalCandidates.reduce((best, c) => 
                                best === null || c.luminance < best.luminance ? c : best, 
                                null as ColorCandidate | null
                            );
                        } else {
                            // Find the lightest (max luminance)
                            bestCandidate = finalCandidates.reduce((best, c) => 
                                best === null || c.luminance > best.luminance ? c : best, 
                                null as ColorCandidate | null
                            );
                        }
                        
                        bestColor = bestCandidate ? bestCandidate.color : null;
                    }
                    
                    // --- Final Assignment ---
                    if (bestColor) { 
                        updatesToChangeColor.set(pixelIndex4D, bestColor);
                        changed = true;
                    }
                }
            }

            // 2. Apply all collected changes to the final image data
            if (updatesToChangeColor.size > 0) {
                updatesToChangeColor.forEach((newColor, index) => {
                    setPixelRgba(originalData, index, newColor);
                });
            }

            return changed;
        });
    }
}


// --- Example setup for running the class ---

export function initializeColorLineEditor(
    container_id : string = "editor-color-line-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const colorLineEditorInstance = new ImageEditorPixelArtOutlineModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET,
        
    });
    colorLineEditorInstance.setHandlers({
        onChange: (image) => {
            if (image) {
                console.log(`[Color Line Editor Change] New image version committed.`);
            }
        },
    })
    return colorLineEditorInstance;
}

// Start the module initialization
// initializeColorLineEditor();