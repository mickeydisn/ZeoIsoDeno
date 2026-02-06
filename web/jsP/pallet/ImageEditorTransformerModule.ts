// =========================================================================
// === INTERFACES & UTILITY TYPES (copied from other modules for consistency) ===
// =========================================================================


/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

/**
 * Defines the parameters for initializing the ImageTransformerModule.
 */
export interface ImageEditorTransformerModuleParams {
    image?: TypeImage;
    divId: string;
}

// =========================================================================
// === ASSET TRANSFORMER MODULE ===
// =========================================================================

export class ImageEditorTransformerModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    // Internal canvas and context for COMMITTING changes (hidden)
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 
    
    // Handlers
    private onChange?: (image: TypeImage) => void;

    // Transformation state (stored for persistence)
    private transformState = {
        x: 0, // Translation X (pixels)
        y: 0, // Translation Y (pixels)
        scale: 1.0, // Scale factor
        rotation: 0, // (Optional) Rotation in degrees
        flipH: false, // Horizontal flip state (left ↔ right)
    };

    // DOM References (UPDATED for button controls)
    private xValueSpan!: HTMLElement;
    private yValueSpan!: HTMLElement;
    private scaleValueSpan!: HTMLElement;
    private flipHBtn!: HTMLButtonElement; 
    private mirrorHRightBtn!: HTMLButtonElement; 
    private adjustmentsContainer!: HTMLElement;


    constructor(params: ImageEditorTransformerModuleParams) {
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
    
    // Helper to re-get DOM elements after innerHTML update
    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        
        this.xValueSpan = this.containerDiv.querySelector(`#x-value-${idSuffix}`) as HTMLElement;
        this.yValueSpan = this.containerDiv.querySelector(`#y-value-${idSuffix}`) as HTMLElement;
        this.scaleValueSpan = this.containerDiv.querySelector(`#scale-value-${idSuffix}`) as HTMLElement;
        this.flipHBtn = this.containerDiv.querySelector(`#flipHBtn-${idSuffix}`) as HTMLButtonElement; 
        this.mirrorHRightBtn = this.containerDiv.querySelector(`#mirrorHRightBtn-${idSuffix}`) as HTMLButtonElement; 
        
        // Reference for the container of the adjustment buttons (NEW)
        this.adjustmentsContainer = this.containerDiv.querySelector(`#adjustments-container-${idSuffix}`) as HTMLElement;

        // Re-get canvases and contexts just in case innerHTML wiped them
        const commitCanvasElement = this.containerDiv.querySelector('#transformer-canvas') as HTMLCanvasElement;
        if (commitCanvasElement) {
             this.canvas = commitCanvasElement;
             this.ctx = commitCanvasElement.getContext('2d', { willReadFrequently: true })!;
             this.canvas.width = this.currentImage.cimage.width;
             this.canvas.height = this.currentImage.cimage.height;
        }
    }


    /**
     * PUBLIC METHOD: Loads a new TypeImage into the internal state and resets controls.
     */
    public loadImage(image: TypeImage): void {
        this.currentImage = image;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        // Reset controls to default state (assuming the incoming image is untransformed)
        this.transformState = { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false }; 
        this.updateControlValues();
        this.updateMetadata();
        this.updateControlStates(this.currentImage !== DEFAULT_EMPTY_ASSET);
    }
    
    /**
     * Updates the text content of the display spans and the appearance of toggle buttons.
     */
    private updateControlValues(): void {
        const { x, y, scale } = this.transformState;
        
        if (this.xValueSpan) this.xValueSpan.textContent = String(x);
        if (this.yValueSpan) this.yValueSpan.textContent = String(y);
        if (this.scaleValueSpan) this.scaleValueSpan.textContent = scale.toFixed(2);
        
        this.flipHBtn.classList.toggle('active-transform', this.transformState.flipH);
    }

    private updateMetadata(): void {
        // const idSuffix = this.containerDiv.id;
    }
    
    private updateControlStates(enabled: boolean): void {
        // Disable the entire adjustment container when no image is loaded
        this.adjustmentsContainer.classList.toggle('disabled', !enabled);
        
        this.flipHBtn.disabled = !enabled; 
        this.mirrorHRightBtn.disabled = !enabled; 
    }

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        return `
            <style>
                .transform-control { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; justify-content: space-between; }
                .transform-control label { font-weight: bold; }
                
                .adjustments-container.disabled button { cursor: not-allowed; opacity: 0.5; }

                .adjust-buttons { display: flex; gap: 3px; align-items: center; }
                .adjust-buttons button {
                    padding: 3px 6px;
                    background-color: #34495e;
                    color: white;
                    border: 1px solid #2c3e50;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 0.9em; 
                    min-width: 25px;
                }
                .adjust-buttons button:hover:not(:disabled) { background-color: #2c3e50; }
                
                .value-display { font-size: 0.9em; font-style: italic; color: #aaa; width: 60px; text-align: center;}

                .transform-buttons { display: flex; gap: 10px; margin-bottom: 15px; }
                .transform-buttons button { flex-grow: 1; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
                .transform-buttons button:hover:not(:disabled) { background-color: #2980b9; }
                .transform-buttons button:disabled { background-color: #bdc3c7; cursor: not-allowed; }
                .transform-buttons .active-transform { background-color: #e74c3c; } /* Highlight for active state */
                
                /* Commit Canvas is still hidden */
                #transformer-canvas { display: none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Image Transformer</summary>
                
                <div style="display:none">
                    <canvas id="transformer-canvas"></canvas>
                </div>
                
                <div id="adjustments-container-${idSuffix}" class="adjustments-container">
                    
                    <div class="transform-control">
                        <label>Move X (px):</label>
                        <div class="adjust-buttons">
                            <button data-key="x" data-delta="-10">-10</button>
                            <button data-key="x" data-delta="-5">-5</button>
                            <button data-key="x" data-delta="-1">-1</button>
                            <span id="x-value-${idSuffix}" class="value-display">${this.transformState.x}</span>
                            <button data-key="x" data-delta="1">+1</button>
                            <button data-key="x" data-delta="5">+5</button>
                            <button data-key="x" data-delta="10">+10</button>
                        </div>
                    </div>
                    
                    <div class="transform-control">
                        <label>Move Y (px):</label>
                        <div class="adjust-buttons">
                            <button data-key="y" data-delta="-10">-10</button>
                            <button data-key="y" data-delta="-5">-5</button>
                            <button data-key="y" data-delta="-1">-1</button>
                            <span id="y-value-${idSuffix}" class="value-display">${this.transformState.y}</span>
                            <button data-key="y" data-delta="1">+1</button>
                            <button data-key="y" data-delta="5">+5</button>
                            <button data-key="y" data-delta="10">+10</button>
                        </div>
                    </div>
                    
                    <div class="transform-control">
                        <label>Scale (x):</label>
                        <div class="adjust-buttons">
                            <button data-key="scale" data-delta="-0.1">-0.1</button>
                            <button data-key="scale" data-delta="-0.05">-0.05</button>
                            <button data-key="scale" data-delta="-0.01">-0.01</button>
                            <span id="scale-value-${idSuffix}" class="value-display">${this.transformState.scale.toFixed(2)}</span>
                            <button data-key="scale" data-delta="0.01">+0.01</button>
                            <button data-key="scale" data-delta="0.05">+0.05</button>
                            <button data-key="scale" data-delta="0.1">+0.1</button>
                        </div>
                    </div>
                </div>
                
                <div class="transform-buttons">
                    <button id="flipHBtn-${idSuffix}" class="btn ${this.transformState.flipH ? 'active-transform' : ''}">Flip: (Left ↔ Right)</button>
                    <button id="mirrorHRightBtn-${idSuffix}" class="btn">Mirror: (Left → Right)</button>
                </div>

            </details></div>
        `;
    }

    private attachEventListeners() {
        // Event delegation for all X, Y, and Scale adjustment buttons
        this.adjustmentsContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            // Check if the clicked element is a button and has the necessary data attributes
            if (target.tagName === 'BUTTON' && target.dataset.key && target.dataset.delta) {
                const key = target.dataset.key as 'x' | 'y' | 'scale';
                // Use parseFloat since scale delta is non-integer
                const delta = parseFloat(target.dataset.delta); 
                this.handleAdjustment(key, delta);
            }
        });

        this.flipHBtn.addEventListener('click', () => this.handleFlipH()); 
        this.mirrorHRightBtn.addEventListener('click', () => this.handleApplyMirrorHRight()); 
        
        // Removed listeners for the old input fields (xInput, yInput, scaleInput)
    }
    
    /**
     * Handles the incremental adjustment of transform properties based on button clicks.
     * Commits the change immediately.
     */
    private handleAdjustment(key: 'x' | 'y' | 'scale', delta: number): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        const currentValue = this.transformState[key];
        let newValue = currentValue + delta;
        
        if (key === 'x' || key === 'y') {
            // Translation clamp range (based on original input max/min: -128 to 128)
            const max = 128;
            const min = -128;
            newValue = Math.min(Math.max(newValue, min), max);
        } else if (key === 'scale') {
            // Scale clamp range (based on original input max/min: 0.1 to 3.0)
            const max = 3.0;
            const min = 0.1;
            // Maintain two decimal places for scale precision
            newValue = parseFloat(newValue.toFixed(2)); 
            newValue = Math.min(Math.max(newValue, min), max);
        }
        
        // Only commit if the value changed
        if (newValue !== currentValue) {
            this.transformState[key] = newValue;
            // Commit the transformation immediately
            this.handleApplyTransform();
        }
    }
    
    /**
     * Toggles the horizontal flip state and re-renders
     */
    private handleFlipH(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;
        this.transformState.flipH = !this.transformState.flipH;
        this.updateControlValues();
        this.handleApplyTransform();
        console.log(`Flip H Toggled: ${this.transformState.flipH}`);
    }

    /**
     * Mirrors the left half of the image onto the right half, commits it, and resets transform state.
     */
    private handleApplyMirrorHRight(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        const originalCanvas = this.currentImage.cimage;
        const width = originalCanvas.width;
        const height = originalCanvas.height;
        const halfWidth = width / 2;

        // 1. Clear the internal working canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 2. Draw the original image (left half)
        this.ctx.drawImage(
            originalCanvas as unknown as CanvasImageSource, 
            0, 0, halfWidth, height, // Source: left half of original image
            0, 0, halfWidth, height  // Destination: left half of commit canvas
        );
        
        // 3. Mirror the left half onto the right half (Commit Logic)
        this.ctx.save();
        
        // Translate to the middle, flip horizontally
        this.ctx.translate(width, 0); 
        this.ctx.scale(-1, 1);
        
        // Draw the left half of the image again.
        this.ctx.drawImage(
            originalCanvas as unknown as CanvasImageSource, 
            0, 0, halfWidth, height, // Source rectangle (left half)
            0, 0, halfWidth, height // Destination rectangle (this now draws onto the right half of the canvas)
        );
        
        this.ctx.restore();
        
        // 4. Create a new OffscreenCanvas with the transformed image
        const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        newOffscreenCanvas.getContext('2d')!.drawImage(this.canvas as unknown as CanvasImageSource, 0, 0);
        
        // 5. Update internal image
        this.currentImage = {
            ...this.currentImage,
            cimage: newOffscreenCanvas,
        };
        
        // Reset transformation state as the image itself is now transformed
        this.loadImage(this.currentImage);
        
        // 6. Notify parent/external system of the change
        this.onChange?.(this.currentImage);
    }

    /**
     * Applies the stored transformations (move, scale, flipH) to the image's OffscreenCanvas
     * and notifies the parent module. This uses the hidden 'commit' canvas.
     */
    private handleApplyTransform(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        const { x, y, scale, flipH } = this.transformState;
        
        // 1. Get the original image image data
        const originalCanvas = this.currentImage.cimage;
        const width = originalCanvas.width;
        
        // 2. Clear the internal working canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 3. Apply the transformations before drawing the image (Commit Logic)
        this.ctx.save();
        
        // Apply transformations in order: Flip/Scale/Translate
        if (flipH) {
            this.ctx.scale(scale, scale);

            // Translate by the *scaled* width to position the origin correctly after the flip.
            this.ctx.translate(width, 0); 
            this.ctx.scale(-1, 1); // Flip horizontally
            
            // The position (x, y) must also be scaled down
            const drawX = x / scale;
            const drawY = y / scale;

            this.ctx.drawImage(
                originalCanvas as unknown as CanvasImageSource, 
                drawX, 
                drawY,
                originalCanvas.width, 
                originalCanvas.height 
            );
        } else {
            // Standard scale and translation
            this.ctx.scale(scale, scale);
            
            // The position (x, y) must be scaled down
            const drawX = x / scale;
            const drawY = y / scale;

            this.ctx.drawImage(
                originalCanvas as unknown as CanvasImageSource, 
                drawX, 
                drawY,
                originalCanvas.width, 
                originalCanvas.height 
            );
        }

        this.ctx.restore();
        
        // 4. Create a new OffscreenCanvas with the transformed image
        const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        newOffscreenCanvas.getContext('2d')!.drawImage(this.canvas as unknown as CanvasImageSource, 0, 0);
        
        // 5. Update internal image
        this.currentImage = {
            ...this.currentImage,
            cimage: newOffscreenCanvas,
        };
        
        // 6. Reset transformation state display by reloading (without full reset)
        this.updateControlValues();

        
        // 7. Notify parent/external system of the change
        this.onChange?.(this.currentImage);
    }
}

// --- Example setup for running the class ---

export function initializeTransformerEditor(
    container_id : string = "editor-transformer-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const transformerInstance = new ImageEditorTransformerModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET, // Start with the example image
        
        // This handler will be called whenever a transform is applied
    });
    transformerInstance.setHandlers({
        onChange: (image) => {
            if (image) {
                // console.log(`[Transformer Change] New image version committed. Label: ${image.label}`);
                // The main editor (ImageEditorModule) would consume this and display the transformed image.
            }
        },
    })
    return transformerInstance;
}

// Start the module initialization (optional)
// initializeTransformerEditor();