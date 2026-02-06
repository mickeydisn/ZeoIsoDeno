// =========================================================================
// === INTERFACES & UTILITY TYPES (copied/adapted) ===
// =========================================================================

/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

/**
 * Defines the parameters for initializing the ImageEnhanceModule.
 */
export interface ImageEnhanceModuleParams {
    image?: TypeImage;
    divId: string;
}

// =========================================================================
// === PIXEL MANIPULATION UTILITIES ===
// =========================================================================

/**
 * Performs Contrast Stretching (Normalization) on the image data.
 * This expands the intensity range of each color channel (R, G, B) to the full [0, 255] range.
 */
function applyContrastStretching(data: Uint8ClampedArray): void {
    const numPixels = data.length / 4;

    // 1. Find min and max for each channel
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (let i = 0; i < data.length; i += 4) {
        // Skip fully transparent pixels (optional, but robust)
        if (data[i + 3] === 0) continue;

        minR = Math.min(minR, data[i]);
        maxR = Math.max(maxR, data[i]);
        minG = Math.min(minG, data[i + 1]);
        maxG = Math.max(maxG, data[i + 1]);
        minB = Math.min(minB, data[i + 2]);
        maxB = Math.max(maxB, data[i + 2]);
    }

    // Handle case where min == max to avoid division by zero
    const rangeR = maxR - minR > 0 ? maxR - minR : 1;
    const rangeG = maxG - minG > 0 ? maxG - minG : 1;
    const rangeB = maxB - minB > 0 ? maxB - minB : 1;

    // 2. Apply stretching transformation: P_out = (P_in - Min) * (255 / Range)
    for (let i = 0; i < data.length; i += 4) {
        // R
        data[i] = Math.round((data[i] - minR) * (255 / rangeR));
        // G
        data[i + 1] = Math.round((data[i + 1] - minG) * (255 / rangeG));
        // B
        data[i + 2] = Math.round((data[i + 2] - minB) * (255 / rangeB));
    }
}

/**
 * Performs Histogram Equalization on the image data (based on Luminosity/Grayscale).
 * This redistributes the pixel intensities to flatten the histogram and enhance contrast.
 */
function applyHistogramEqualization(data: Uint8ClampedArray): void {
    const numPixels = data.length / 4;
    // Use an average luminosity (L = 0.299R + 0.587G + 0.114B) for the histogram
    // or just the simple average (R+G+B)/3
    
    // 1. Calculate Histogram (256 bins for 0-255 intensity levels)
    const hist = new Array(256).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
        // Calculate luminosity (Grayscale intensity)
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b); // Rec. 709 Luminance
        
        hist[l]++;
    }
    
    // 2. Calculate Cumulative Distribution Function (CDF)
    const cdf = new Array(256).fill(0);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i];
    }
    
    // Find minimum non-zero CDF value (cdfMin)
    let cdfMin = 0;
    for (let i = 0; i < 256; i++) {
        if (cdf[i] > 0) {
            cdfMin = cdf[i];
            break;
        }
    }
    
    if (cdfMin === 0 || numPixels === 0) return;

    // 3. Create the transformation lookup table (Lut)
    // Formula: h(v) = round(((cdf(v) - cdfMin) / (NumPixels - cdfMin)) * 255)
    const lut = new Array(256);
    const scaleFactor = 255 / (numPixels - cdfMin);
    
    for (let i = 0; i < 256; i++) {
        lut[i] = Math.round((cdf[i] - cdfMin) * scaleFactor);
    }

    // 4. Apply the transformation to each color channel (using Luminosity for mapping)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Use the same Luminosity calculation to get the index for the LUT
        const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

        // Calculate the new intensity based on the LUT
        const newL = lut[l];
        
        // Calculate the ratio of the new Luminosity to the original Luminosity.
        // This preserves the original color hue/saturation while equalizing intensity.
        const ratio = l > 0 ? newL / l : 1;
        
        data[i] = Math.min(255, Math.max(0, Math.round(r * ratio))); // R
        data[i + 1] = Math.min(255, Math.max(0, Math.round(g * ratio))); // G
        data[i + 2] = Math.min(255, Math.max(0, Math.round(b * ratio))); // B
    }
}


// =========================================================================
// === IMAGE ENHANCEMENT MODULE ===
// =========================================================================

/**
 * Module dedicated to contrast enhancement using full image processing techniques.
 */
export class ImageEditorEnhanceModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    // Internal canvas and context for COMMITTING changes (hidden)
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 
    
    // Handlers
    private onChange?: (image: TypeImage) => void;

    // State for the Enhancement Module
    private enhanceState = {
        lastOperation: 'none', // 'equalize', 'stretch', or 'none'
    };

    // DOM References
    private equalizeBtn!: HTMLButtonElement; 
    private stretchBtn!: HTMLButtonElement; 
    private resetBtn!: HTMLButtonElement; 


    constructor(params: ImageEnhanceModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }
        
        this.containerDiv = container;
        this.currentImage = params.image || DEFAULT_EMPTY_ASSET;

        this.containerDiv.innerHTML = this.renderInitialStructure();
        
        // 3. Get DOM References
        this.reinitializeDOMReferences();
        
        // 4. Setup Listeners and Initial Load
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
        console.log('Enhancer handlers updated.');
        
        // Re-render and reinitialize DOM to ensure controls/handlers are fresh
        this.containerDiv.innerHTML = this.renderInitialStructure();
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        this.loadImage(this.currentImage); 
    }
    
    /**
     * PUBLIC METHOD: Loads a new TypeImage into the internal state and resets controls.
     */
    public loadImage(image: TypeImage): void {
        this.currentImage = image;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        // Reset state
        this.enhanceState.lastOperation = 'none';
        this.updateControlValues();
    }
    
    /**
     * Updates the active/disabled state of control buttons.
     */
    private updateControlValues(): void {
        // Visually mark the last applied operation
        this.equalizeBtn.classList.toggle('active-transform', this.enhanceState.lastOperation === 'equalize');
        this.stretchBtn.classList.toggle('active-transform', this.enhanceState.lastOperation === 'stretch');
        this.resetBtn.disabled = this.enhanceState.lastOperation === 'none';
    }
    

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        return `
            <style>
                .enhance-buttons { display: flex; gap: 10px; margin-top: 15px; }
                .enhance-buttons button { flex-grow: 1; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
                .enhance-buttons button:hover { background-color: #2980b9; }
                .enhance-buttons .active-transform { background-color: #e74c3c; } 
                
                .single-button-container { margin-top: 10px; }
                .single-button-container button { 
                    width: 100%; padding: 8px; background-color: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; 
                }
                .single-button-container button:hover:not(:disabled) { background-color: #7f8c8d; }
                .single-button-container button:disabled { cursor: not-allowed; opacity: 0.6; }
                
                #enhance-canvas { display: none; }
            </style>
            
            <div class="module-card"><details open>
                <summary class="module-group-title">Contrast Enhancement (Pixel Processing)</summary>
                
                <div style="display:none">
                    <canvas id="enhance-canvas"></canvas>
                </div>
                
                <div class="enhance-buttons">
                    <button id="equalizeBtn-${idSuffix}" class="btn">Histogram Equalization</button>
                    <button id="stretchBtn-${idSuffix}" class="btn">Contrast Stretching</button>
                </div>
                
                <div class="single-button-container">
                    <button id="resetEnhanceBtn-${idSuffix}" disabled>Undo Enhancement</button>
                </div>

            </details></div>
        `;
    }

    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        
        // References for the enhancement buttons
        this.equalizeBtn = this.containerDiv.querySelector(`#equalizeBtn-${idSuffix}`) as HTMLButtonElement; 
        this.stretchBtn = this.containerDiv.querySelector(`#stretchBtn-${idSuffix}`) as HTMLButtonElement;
        this.resetBtn = this.containerDiv.querySelector(`#resetEnhanceBtn-${idSuffix}`) as HTMLButtonElement;
        
        // Re-get canvases and contexts
        const commitCanvasElement = this.containerDiv.querySelector('#enhance-canvas') as HTMLCanvasElement;
        if (commitCanvasElement) {
             this.canvas = commitCanvasElement;
             this.ctx = commitCanvasElement.getContext('2d', { willReadFrequently: true })!;
             this.canvas.width = this.currentImage.cimage.width;
             this.canvas.height = this.currentImage.cimage.height;
        }
    }

    private attachEventListeners() {
        this.equalizeBtn.addEventListener('click', () => this.handleOperation('equalize'));
        this.stretchBtn.addEventListener('click', () => this.handleOperation('stretch'));
        this.resetBtn.addEventListener('click', () => this.handleOperation('reset'));
    }
    
    /**
     * Handles the selection of a contrast enhancement operation.
     */
    private handleOperation(operation: 'equalize' | 'stretch' | 'reset'): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        if (operation === 'reset') {
            this.handleResetEnhancement();
            return;
        }
        
        // 1. Get image data from the current image
        const originalCanvas = this.currentImage.cimage;
        const width = originalCanvas.width;
        const height = originalCanvas.height;

        // Use the internal working canvas (this.canvas/this.ctx) for manipulation
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.drawImage(originalCanvas as unknown as CanvasImageSource, 0, 0);
        
        const imageData = this.ctx.getImageData(0, 0, width, height);
        
        // 2. Apply the selected transformation
        if (operation === 'equalize') {
            applyHistogramEqualization(imageData.data);
            this.enhanceState.lastOperation = 'equalize';
            console.log('Histogram Equalization applied.');
        } else if (operation === 'stretch') {
            applyContrastStretching(imageData.data);
            this.enhanceState.lastOperation = 'stretch';
            console.log('Contrast Stretching applied.');
        }

        // 3. Put modified data back onto the working canvas
        this.ctx.putImageData(imageData, 0, 0);
        
        // 4. Commit the change (create new TypeImage asset)
        this.commitNewImageFromCanvas();
    }
    
    /**
     * Resets the image back to the state *before* the last enhancement.
     * NOTE: This implementation relies on the host application to track the original asset
     * or for the module to store a copy of the *pre-enhanced* image. Since we don't have
     * access to the original, we will notify the parent to reload the original.
     */
    private handleResetEnhancement(): void {
        // For a full implementation, you would revert to a stored 'base' image.
        // For now, we commit a 'null' operation and notify the parent system.
        
        this.enhanceState.lastOperation = 'none';
        this.updateControlValues();
        
        // The most robust way to "reset" in a standalone module like this is
        // to call the parent's handler with the original image asset (if stored)
        // or trigger a parent-level reset action.
        
        // Since we don't store the original here, we only notify.
        this.onChange?.(this.currentImage); 
        console.log(`Enhancement reset requested. Parent system needs to revert the asset.`);
    }

    /**
     * Helper to finalize the operation and notify the parent.
     */
    private commitNewImageFromCanvas(): void {
        // 1. Create a new OffscreenCanvas with the transformed image
        const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        newOffscreenCanvas.getContext('2d')!.drawImage(this.canvas as unknown as CanvasImageSource, 0, 0);
        
        // 2. Update internal image
        this.currentImage = {
            ...this.currentImage,
            cimage: newOffscreenCanvas,
        };
        
        // 3. Update controls (e.g., enable reset button)
        this.updateControlValues();
        
        // 4. Notify parent/external system of the change
        this.onChange?.(this.currentImage);
        console.log(`Image enhancement committed: ${this.enhanceState.lastOperation}`);
    }
}

// --- Example setup for running the class (similar to color module) ---
export function initializeEnhanceEditor(
    container_id : string = "image-enhance-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const enhancerInstance: ImageEditorEnhanceModule = new ImageEditorEnhanceModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET, // Start with the example image
        
    });
    enhancerInstance.setHandlers({
        // This handler will be called whenever a transform is applied
        onChange: (image) => {
            if (image) {
                console.log(`[Enhancement Change] New image version committed.`);
            }
        },

    })
    return enhancerInstance;
}