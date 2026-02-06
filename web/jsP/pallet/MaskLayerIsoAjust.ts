// =========================================================================
// === ADJUSTABLE DIAMOND MASK LAYER ===
// =========================================================================

import { IMaskLayer } from './MaskBuilderModule.ts';

/**
 * Reads the canvas pixel data and forces any partially visible pixel (Alpha > 0) 
 * to be fully opaque (Alpha = 255).
 */
function enforceFullOpacity(canvas: OffscreenCanvas, size: number): OffscreenCanvas {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
            data[i] = 255; 
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Adjustable Diamond Layer
 * Features:
 * - Color picker for line color
 * - Height slider for floor level (0-5, float step 0.1)
 */
export class AdjustableDiamondMaskLayer implements IMaskLayer {
    readonly id = 'adjustable-diamond';
    readonly name = 'Adjustable Diamond';
    readonly tileSize = 256;
    
    private readonly defaultColor = '#DB9834';
    
    // HEIGHT CONFIGURATION
    private readonly HEIGHT_SCALE_UNIT = 1; // 1 level = 69 pixels of lift
    private readonly defaultHeightLevel = 64; 
    private readonly minHeightLevel = -64;     
    private readonly maxHeightLevel = 3 * 64;     
    private readonly stepValue = 1;       // NEW: Allows float steps

    private colorInput?: HTMLInputElement; 
    private heightInput?: HTMLInputElement; 
    private heightValueSpan?: HTMLElement; 
    private onChangeHandler?: () => void;  
    private controlContainer?: HTMLElement; 

    renderControls(parentDiv : HTMLElement, containerId: string, onChange: () => void): void {
        const container = parentDiv.querySelector(`#${containerId}`) as HTMLElement ;
        if (!container) {
            console.error(`Container #${containerId} not found!`);
            return;
        }
        
        this.onChangeHandler = onChange;
        this.controlContainer = container; 
        const colorInputId = `param-${this.id}-color`;
        const heightInputId = `param-${this.id}-height`;

        // 1. Render HTML (UPDATED SLIDER STEP TO 0.1)
        container.innerHTML = `
            <div class="layer-param">
                <label for="${colorInputId}">Line Color:</label>
                <input type="color" id="${colorInputId}" value="${this.defaultColor}">
            </div>
            <div class="layer-param">
                <label for="${heightInputId}">Floor Level (${this.minHeightLevel}-${this.maxHeightLevel}, step ${this.stepValue}):</label>
                <input 
                    type="number" 
                    id="${heightInputId}" 
                    min="${this.minHeightLevel}" 
                    max="${this.maxHeightLevel}" 
                    value="${this.defaultHeightLevel}"
                    step="${this.stepValue}" 
                    style="flex-grow: 1;">
                <span id="${heightInputId}-value">${this.defaultHeightLevel.toFixed(1)}</span>
            </div>
        `;
        
        // 2. Initialize references and listeners
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        
        console.log(`[Adjustable Diamond Layer] Controls rendered and listeners attached into #${containerId}`);
    }

    reinitializeDOMReferences(): void {
        const colorInputId = `param-${this.id}-color`;
        const heightInputId = `param-${this.id}-height`;

        this.colorInput = this.controlContainer?.querySelector(`#${colorInputId}`) as HTMLInputElement;
        this.heightInput = this.controlContainer?.querySelector(`#${heightInputId}`) as HTMLInputElement;
        this.heightValueSpan = this.controlContainer?.querySelector(`#${heightInputId}-value`) as HTMLInputElement;;
    }

    attachEventListeners(): void {
        if (this.colorInput) {
            this.colorInput.addEventListener('input', () => this.handleInputUpdate());
        }
        
        if (this.heightInput) {
            this.heightInput.addEventListener('input', (e) => {
                const floatValue = parseFloat((e.target as HTMLInputElement).value);
                // Update the visible value, formatting it to one decimal place
                if (this.heightValueSpan) {
                    this.heightValueSpan.textContent = floatValue.toFixed(1);
                }
                this.handleInputUpdate(); 
            });
        }
    }
    
    handleInputUpdate(): void {
        if (this.onChangeHandler) {
            this.onChangeHandler();
        }
    }

    draw(): OffscreenCanvas {
        const TILE_SIZE = this.tileSize;
        const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
        const ctx = canvas.getContext('2d')!;
        const BOTTOM_PADDING = 36

        const lineColor = this.colorInput?.value ?? this.defaultColor;
        
        // NEW: Use parseFloat() to read the decimal value
        const heightValue = this.heightInput?.value ? parseFloat(this.heightInput.value) : this.defaultHeightLevel;
        
        // CALCULATE VERTICAL SHIFT (float calculation)
        const verticalShiftPixels = heightValue * this.HEIGHT_SCALE_UNIT + 36; 
        
        console.log(`[Adjustable Diamond Draw] Color: ${lineColor}, Level: ${heightValue.toFixed(1)}, Shift: ${verticalShiftPixels.toFixed(1)}px`); 

        const offset = 0.5; 

        ctx.imageSmoothingEnabled = false; 
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        
        ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);

        // Calculate Y-coordinate of the diamond's bottom tip (Y_TIP)
        const Y_TIP_UNADJUSTED = TILE_SIZE - verticalShiftPixels; 
        
        // Diamond's center is 32px above its bottom tip
        const centerY = Y_TIP_UNADJUSTED - 32; 
        
        const X_CENTER = 128 + offset;
        const X_RIGHT = 192 + offset;
        const X_LEFT = 64 + offset;
        
        // Apply the drawing offset to the calculated float positions
        const Y_TOP = centerY - 32 + offset;
        const Y_RIGHT_LEFT = centerY + offset;
        const Y_BOTTOM = Y_TIP_UNADJUSTED + offset; 
        
        // Draw the diamond shape 
        ctx.beginPath();
        ctx.moveTo(X_CENTER, Y_TOP);       
        ctx.lineTo(X_RIGHT, Y_RIGHT_LEFT); 
        ctx.lineTo(X_CENTER, Y_BOTTOM);    
        ctx.lineTo(X_LEFT, Y_RIGHT_LEFT);  
        ctx.closePath();
        ctx.stroke();

        // Draw Border
        ctx.beginPath();
        ctx.moveTo(X_RIGHT +1, TILE_SIZE - BOTTOM_PADDING -32); 
        ctx.lineTo(X_RIGHT +1, Y_RIGHT_LEFT); 
        ctx.moveTo(X_LEFT -1,  TILE_SIZE - BOTTOM_PADDING -32); 
        ctx.lineTo(X_LEFT -1, Y_RIGHT_LEFT); 

        ctx.moveTo(X_CENTER,  TILE_SIZE - BOTTOM_PADDING); 
        ctx.lineTo(X_CENTER, Y_BOTTOM); 

        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.closePath();
        ctx.stroke();
        

        return enforceFullOpacity(canvas, TILE_SIZE);
    }
}