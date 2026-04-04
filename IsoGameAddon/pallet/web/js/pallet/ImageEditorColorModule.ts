// =========================================================================
// === INTERFACES & UTILITY TYPES (copied/adapted for HSL calculation) ===
// =========================================================================


/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

/**
 * Defines the parameters for initializing the ImageColorModule.
 */
export interface ImageColorModuleParams {
    image?: TypeImage;
    divId: string;
}

interface RGB { r: number; g: number; b: number; a?: number; }
interface HSL { h: number; s: number; l: number; }

/** Converts an RGB object (0-255) to HSL object (H: 0-360, S/L: 0-100). */
function rgbToHsl(r: number, g: number, b: number): HSL {
    // Normalize to 0-1
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Convert to target ranges (H: 0-360, S/L: 0-100)
    return { 
        h: Math.round(h * 360), 
        s: Math.round(s * 100), 
        l: Math.round(l * 100) 
    };
}


// =========================================================================
// === ASSET COLOR MODULE ===
// =========================================================================

export class ImageEditorColorModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    // Internal canvas and context for COMMITTING changes (hidden)
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 
    
    // Handlers
    private onChange?: (image: TypeImage) => void;

    // Color transformation state
    private colorState = {
        hue: 0, // 0-360 degrees
        saturation: 100, // 0-200 percentage (100 is default)
        contrast: 100, // 0-200 percentage (100 is default)
        brightness: 100, // <--- ADDED: 0-200 percentage (100 is default)
        invert: false, // boolean
        grayscale: false, // boolean (simplified equalizer)
    };

    // DOM References (UPDATED)
    private hueAvgSpan!: HTMLElement;
    private saturationAvgSpan!: HTMLElement;
    private contrastAvgSpan!: HTMLElement;
    private brightnessAvgSpan!: HTMLElement; // <--- ADDED
    private invertBtn!: HTMLButtonElement; 
    private grayscaleBtn!: HTMLButtonElement;
    private removeAlphaBtn!: HTMLButtonElement; // NEW
    private adjustmentsContainer!: HTMLElement;


    constructor(params: ImageColorModuleParams) {
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
        console.log('Transformer handlers updated.');
        
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

        // Reset controls to default color state (UPDATED)
        this.colorState = { 
            hue: 0, 
            saturation: 100, 
            contrast: 100, 
            brightness: 100, // <--- ADDED RESET
            invert: false, 
            grayscale: false 
        };
        this.updateControlValues();
        
        this.updateMetadata();
        this.updateAverageHSLDisplay(); // NEW: Calculate and display average HSL
    }
    
    /**
     * Calculates the average Hue, Saturation, and Luminosity of all opaque pixels.
     * @returns An HSL object with average values.
     */
    private calculateAverageHSL(): HSL {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) {
            return { h: 0, s: 0, l: 0 };
        }

        const canvas = this.currentImage.cimage;
        // Use a temp canvas to safely read data from the OffscreenCanvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return { h: 0, s: 0, l: 0 };
        
        tempCtx.drawImage(canvas as unknown as CanvasImageSource, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalH = 0;
        let totalS = 0;
        let totalL = 0;
        let opaquePixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            // Only count opaque pixels (Alpha > 0)
            if (data[i + 3] > 0) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                const hsl = rgbToHsl(r, g, b);
                
                // Simple summation for averaging
                totalH += hsl.h;
                totalS += hsl.s;
                totalL += hsl.l;
                opaquePixelCount++;
            }
        }
        
        if (opaquePixelCount === 0) {
            return { h: 0, s: 0, l: 0 };
        }
        
        const avgH = Math.round(totalH / opaquePixelCount);
        const avgS = Math.round(totalS / opaquePixelCount);
        const avgL = Math.round(totalL / opaquePixelCount);
        
        // Note: Simple average for Hue is mathematically inaccurate for circular data, 
        // but is often acceptable for visual average representation.
        return { h: avgH % 360, s: avgS, l: avgL };
    }


    private updateControlValues(): void {
        // Update button appearance (invert/grayscale)
        this.invertBtn.classList.toggle('active-transform', this.colorState.invert);
        this.grayscaleBtn.classList.toggle('active-transform', this.colorState.grayscale);
    }
    
    /**
     * Updates the DOM to show the calculated average HSL/Luminosity values.
     */
    private updateAverageHSLDisplay(): void {
        const avgHSL = this.calculateAverageHSL();
        
        if (this.hueAvgSpan) {
            this.hueAvgSpan.textContent = `${avgHSL.h}° (Avg Hue)`;
        }
        if (this.saturationAvgSpan) {
            this.saturationAvgSpan.textContent = `${avgHSL.s}% (Avg Sat)`;
        }
        if (this.contrastAvgSpan) {
            // Display average Luminosity/Lightness (L)
            this.contrastAvgSpan.textContent = `${avgHSL.l}% (Avg Lum)`; 
        }
        // <--- ADDED: Display current brightness value for consistency
        if (this.brightnessAvgSpan) {
            this.brightnessAvgSpan.textContent = `${this.colorState.brightness}% (Current)`;
        }
    }

    private updateMetadata(): void {
        // const idSuffix = this.containerDiv.id;
    }
    

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        // Removed the apply-button-container and input[type="number"] elements
        return `
            <style>
                .color-control { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; justify-content: space-between; }
                .color-control label { width: 80px; font-weight: bold; }
                
                .adjust-buttons { display: flex; gap: 3px; align-items: center; }
                .adjust-buttons button {
                    padding: 3px 6px;
                    background-color: #34495e;
                    color: white;
                    border: 1px solid #2c3e50;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 1.4em;
                    min-width: 30px;
                }
                .adjust-buttons button:hover { background-color: #2c3e50; }
                
                .value-display { font-size: 0.85em; font-style: italic; color: #aaa; width: 140px; text-align: right;}

                .color-buttons { display: flex; gap: 10px; margin-top: 15px; }
                .color-buttons button { flex-grow: 1; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
                .color-buttons button:hover { background-color: #2980b9; }
                .color-buttons .active-transform { background-color: #e74c3c; } 
                
                .single-button-container { margin-top: 10px; }
                .single-button-container button { 
                    width: 100%; padding: 8px; background-color: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer; 
                }
                .single-button-container button:hover { background-color: #d35400; }
                
                #color-canvas { display: none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Image Color Adjustment</summary>
                
                <div style="display:none">
                    <canvas id="color-canvas"></canvas>
                </div>
                
                <div id="adjustments-container-${idSuffix}" class="adjustments-container">
                    
                    <div class="color-control">
                        <label>Hue:</label>
                        <div class="adjust-buttons">
                            <button data-key="hue" data-delta="-10">-10</button>
                            <button data-key="hue" data-delta="-5">-5</button>
                            <button data-key="hue" data-delta="-1">-1</button>
                            <span id="hue-avg-value-${idSuffix}" class="value-display">${this.colorState.hue}° (Avg Hue)</span>
                            <button data-key="hue" data-delta="1">+1</button>
                            <button data-key="hue" data-delta="5">+5</button>
                            <button data-key="hue" data-delta="10">+10</button>
                        </div>
                    </div>
                    
                    <div class="color-control">
                        <label>Saturation:</label>
                        <div class="adjust-buttons">
                            <button data-key="saturation" data-delta="-10">-10</button>
                            <button data-key="saturation" data-delta="-5">-5</button>
                            <button data-key="saturation" data-delta="-1">-1</button>
                            <span id="saturation-avg-value-${idSuffix}" class="value-display">${this.colorState.saturation}% (Avg Sat)</span>
                            <button data-key="saturation" data-delta="1">+1</button>
                            <button data-key="saturation" data-delta="5">+5</button>
                            <button data-key="saturation" data-delta="10">+10</button>
                        </div>
                    </div>
                    
                    <div class="color-control">
                        <label>Contrast:</label>
                        <div class="adjust-buttons">
                            <button data-key="contrast" data-delta="-10">-10</button>
                            <button data-key="contrast" data-delta="-5">-5</button>
                            <button data-key="contrast" data-delta="-1">-1</button>
                            <span id="contrast-avg-value-${idSuffix}" class="value-display">${this.colorState.contrast}% (Avg Lum)</span>
                            <button data-key="contrast" data-delta="1">+1</button>
                            <button data-key="contrast" data-delta="5">+5</button>
                            <button data-key="contrast" data-delta="10">+10</button>
                        </div>
                    </div>
                    
                    <div class="color-control">
                        <label>Brightness:</label>
                        <div class="adjust-buttons">
                            <button data-key="brightness" data-delta="-10">-10</button>
                            <button data-key="brightness" data-delta="-5">-5</button>
                            <button data-key="brightness" data-delta="-1">-1</button>
                            <span id="brightness-avg-value-${idSuffix}" class="value-display">${this.colorState.brightness}% (Current)</span>
                            <button data-key="brightness" data-delta="1">+1</button>
                            <button data-key="brightness" data-delta="5">+5</button>
                            <button data-key="brightness" data-delta="10">+10</button>
                        </div>
                    </div>
                    </div>
                
                <div class="color-buttons">
                    <button id="invertBtn-${idSuffix}" class="btn">Inverse Color</button>
                    <button id="grayscaleBtn-${idSuffix}" class="btn">Grayscale</button>
                </div>
                
                <div class="single-button-container">
                    <button id="removeAlphaBtn-${idSuffix}">Fix Alpha/Opacity (Set Opaque)</button>
                </div>

            </details></div>
        `;
    }

    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        
        // References for the displayed AVERAGE values (UPDATED)
        this.hueAvgSpan = this.containerDiv.querySelector(`#hue-avg-value-${idSuffix}`) as HTMLElement;
        this.saturationAvgSpan = this.containerDiv.querySelector(`#saturation-avg-value-${idSuffix}`) as HTMLElement;
        this.contrastAvgSpan = this.containerDiv.querySelector(`#contrast-avg-value-${idSuffix}`) as HTMLElement;
        this.brightnessAvgSpan = this.containerDiv.querySelector(`#brightness-avg-value-${idSuffix}`) as HTMLElement; // <--- ADDED
        
        // References for the toggle buttons
        this.invertBtn = this.containerDiv.querySelector(`#invertBtn-${idSuffix}`) as HTMLButtonElement; 
        this.grayscaleBtn = this.containerDiv.querySelector(`#grayscaleBtn-${idSuffix}`) as HTMLButtonElement;
        this.removeAlphaBtn = this.containerDiv.querySelector(`#removeAlphaBtn-${idSuffix}`) as HTMLButtonElement; // NEW
        
        // Reference for the container of the adjustment buttons
        this.adjustmentsContainer = this.containerDiv.querySelector(`#adjustments-container-${idSuffix}`) as HTMLElement;
        
        // Re-get canvases and contexts
        const commitCanvasElement = this.containerDiv.querySelector('#color-canvas') as HTMLCanvasElement;
        if (commitCanvasElement) {
             this.canvas = commitCanvasElement;
             this.ctx = commitCanvasElement.getContext('2d', { willReadFrequently: true })!;
             this.canvas.width = this.currentImage.cimage.width;
             this.canvas.height = this.currentImage.cimage.height;
        }
    }

    private attachEventListeners() {
        // Event delegation for all Hue/Saturation/Contrast/Brightness buttons (UPDATED)
        this.adjustmentsContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            // Check if the clicked element is a button and has the necessary data attributes
            if (target.tagName === 'BUTTON' && target.dataset.key && target.dataset.delta) {
                const key = target.dataset.key as 'hue' | 'saturation' | 'contrast' | 'brightness'; // <--- UPDATED KEY TYPE
                const delta = parseInt(target.dataset.delta, 10);
                this.handleAdjustment(key, delta);
            }
        });

        // Buttons now call their handlers, which will commit immediately
        this.invertBtn.addEventListener('click', () => this.handleInvert());
        this.grayscaleBtn.addEventListener('click', () => this.handleGrayscale());
        this.removeAlphaBtn.addEventListener('click', () => this.handleRemoveAlpha()); // NEW
    }
    
    /**
     * Handles the incremental adjustment of color properties based on button clicks.
     * Commits the change immediately.
     */
    private handleAdjustment(key: 'hue' | 'saturation' | 'contrast' | 'brightness', delta: number): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        const currentValue = this.colorState[key];
        let newValue = currentValue + delta;
        
        let min: number;
        let max: number;
        
        if (key === 'hue') {
            min = 0;
            max = 360; 
            
            // Handle Hue wrap-around (360 -> 0, -1 -> 359)
            if (newValue > max) {
                newValue -= max; 
            } else if (newValue < min) {
                newValue += max; 
            }
            
        } else { // saturation, contrast, or brightness (0-200%)
            min = 0;
            max = 200;
            
            // Clamp for Saturation, Contrast, and Brightness (UPDATED)
            newValue = Math.min(Math.max(newValue, min), max);
        }
        
        // Only commit if the value changed
        if (newValue !== currentValue) {
            this.colorState[key] = newValue;
            // Commit the transformation immediately
            this.handleColorTransformCommit();
        }
    }


    private handleInvert(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;
        this.colorState.invert = !this.colorState.invert;
        this.updateControlValues();
        this.handleColorTransformCommit();
    }

    private handleGrayscale(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;
        this.colorState.grayscale = !this.colorState.grayscale;
        this.updateControlValues();
        this.handleColorTransformCommit();
    }
    
    /**
     * Sets the alpha channel to 255 (opaque) for any pixel that is not fully transparent (alpha > 0).
     */
    private handleRemoveAlpha(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        // 1. Get image data from the current image (safely using a temp canvas)
        const originalCanvas = this.currentImage.cimage;
        const tempCanvas = new OffscreenCanvas(originalCanvas.width, originalCanvas.height);
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) return;
        
        tempCtx.drawImage(originalCanvas as unknown as CanvasImageSource, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        let changed = false;

        // 2. Iterate and update alpha channel
        for (let i = 3; i < data.length; i += 4) {
            // If the alpha channel is between (0, 255), set it to 255.
            if (data[i] > 0 && data[i] < 255) {
                data[i] = 255; // Set to fully opaque
                changed = true;
            }
        }
        
        if (changed) {
            // 3. Put modified data back onto the temp canvas
            tempCtx.putImageData(imageData, 0, 0);
            
            // 4. Create new OffscreenCanvas (temp is already Offscreen in modern browsers, but creating a new one for clarity)
            const newOffscreenCanvas = new OffscreenCanvas(tempCanvas.width, tempCanvas.height);
            newOffscreenCanvas.getContext('2d')!.drawImage(tempCanvas as unknown as CanvasImageSource, 0, 0);
            
            // 5. Update internal image
            this.currentImage = {
                ...this.currentImage,
                cimage: newOffscreenCanvas,
            };
            
            // 6. Reload (to reset color state and update avg HSL display)
            this.loadImage(this.currentImage);
            
            // 7. Notify parent
            this.onChange?.(this.currentImage);
            console.log(`Image alpha color fixed (set opaque)`);
        } else {
            console.log(`Image already fully opaque or transparent. No change.`);
        }
    }
    
    /**
     * Constructs the CSS filter string based on the current colorState.
     */
    private buildFilterString(): string {
        const { hue, saturation, contrast, brightness, invert, grayscale } = this.colorState; // <--- ADDED BRIGHTNESS
        
        let filter = '';
        
        // Add basic adjustments
        if (hue !== 0) filter += `hue-rotate(${hue}deg) `;
        if (saturation !== 100) filter += `saturate(${saturation}%) `;
        if (contrast !== 100) filter += `contrast(${contrast}%) `;
        if (brightness !== 100) filter += `brightness(${brightness}%) `; // <--- ADDED BRIGHTNESS FILTER
        
        // Add toggle effects
        if (invert) filter += `invert(100%) `;
        if (grayscale) filter += `grayscale(100%) `;
        
        return filter.trim();
    }


    /**
     * Applies the stored color transformations to the image's OffscreenCanvas
     * and notifies the parent module. This uses the hidden 'commit' canvas.
     */
    private handleColorTransformCommit(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        const originalCanvas = this.currentImage.cimage;
        
        // 1. Clear the internal working canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 2. Apply CSS filters to the commit context
        this.ctx.filter = this.buildFilterString();
        
        // 3. Draw the original image onto the commit canvas with filters applied
        this.ctx.drawImage(
            originalCanvas as unknown as CanvasImageSource, 
            0, 
            0,
            originalCanvas.width, 
            originalCanvas.height 
        );
        
        // 4. Reset filter
        this.ctx.filter = 'none';
        
        // 5. Create a new OffscreenCanvas with the transformed image
        const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        newOffscreenCanvas.getContext('2d')!.drawImage(this.canvas as unknown as CanvasImageSource, 0, 0);
        
        // 6. Update internal image
        this.currentImage = {
            ...this.currentImage,
            cimage: newOffscreenCanvas,
        };
        
        // 7. Reset color state and display by reloading the new image
        this.loadImage(this.currentImage);
        
        // 8. Notify parent/external system of the change
        this.onChange?.(this.currentImage);
        console.log(`Image color transform committed`);
    }
}

// --- Example setup for running the class ---
export function initializeColorEditor(
    container_id : string = "image-color-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const colorTransformerInstance: ImageEditorColorModule = new ImageEditorColorModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET, // Start with the example image
        
    });
    colorTransformerInstance.setHandlers({
        // This handler will be called whenever a transform is applied
        onChange: (image) => {
            if (image) {
                console.log(`[Color Change] New image version committed.`);
            }
        },

    })
    return colorTransformerInstance;
}

// Start the module initialization (optional)
// initializeColorEditor();