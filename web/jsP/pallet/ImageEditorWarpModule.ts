// =========================================================================
// === INTERFACES & UTILITY TYPES (required for HSL <-> RGB conversion) ===
// =========================================================================

/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

/**
 * Defines the parameters for initializing the ImageWarpModule.
 */
export interface ImageWarpModuleParams {
    image?: TypeImage;
    divId: string;
}

interface HSL { h: number; s: number; l: number; }

/** Converts an RGB object (0-255) to HSL object (H: 0-360, S/L: 0-100). */
function rgbToHsl(r: number, g: number, b: number): HSL {
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

    return { 
        h: Math.round(h * 360), 
        s: Math.round(s * 100), 
        l: Math.round(l * 100) 
    };
}

/** Converts an HSL object (H: 0-360, S/L: 0-100) to RGB object (0-255). */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; 
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
    }

    return { 
        r: Math.round(r * 255), 
        g: Math.round(g * 255), 
        b: Math.round(b * 255) 
    };
}

/**
 * Calculates the Hue Histogram and the average Hue.
 */
function analyzeHueDistribution(image: TypeImage): { histogram: number[], avgH: number, maxFrequency: number } {
    if (image === DEFAULT_EMPTY_ASSET) return { histogram: new Array(360).fill(0), avgH: 0, maxFrequency: 1 };

    const canvas = image.cimage;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return { histogram: new Array(360).fill(0), avgH: 0, maxFrequency: 1 };
    
    tempCtx.drawImage(canvas as unknown as CanvasImageSource, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let totalH = 0;
    let opaquePixelCount = 0;
    const histogram = new Array(360).fill(0);
    let maxFrequency = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // Check for opaque pixels
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const hsl = rgbToHsl(r, g, b);
            const h = hsl.h;
            
            // Only count if saturation is high enough to be a meaningful color
            if (hsl.s > 5 && hsl.l > 10 && hsl.l < 90) { 
                histogram[h]++;
                totalH += h;
                opaquePixelCount++;
                if (histogram[h] > maxFrequency) {
                    maxFrequency = histogram[h];
                }
            }
        }
    }
    
    const avgH = opaquePixelCount === 0 ? 0 : Math.round(totalH / opaquePixelCount) % 360;
    
    return { histogram, avgH, maxFrequency: maxFrequency > 0 ? maxFrequency : 1 };
}

// =========================================================================
// === IMAGE WARP MODULE ===
// =========================================================================

export class ImageEditorWarpModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 
    
    private onChange?: (image: TypeImage) => void;

    // Hue Warping State 
    private warpState = {
        hueWarping: false,
        warpCenterHue: 50,      // The Hue degree to center the effect on (0-360)
        inputSpread: 30,        // The range of colors to affect (± degrees)
        stretchFactor: 1.0,     // Multiplier for stretching/compressing
    };

    // Histogram State
    private hueHistogram: number[] = new Array(360).fill(0);
    private maxHueFrequency: number = 1;
    private avgHue: number = 0;

    // DOM References 
    private hueWarpingBtn!: HTMLButtonElement;
    private warpCenterSpan!: HTMLElement;
    private inputSpreadSpan!: HTMLElement;
    private stretchFactorSpan!: HTMLElement;
    private warpCenterSlider!: HTMLInputElement;
    private warpCenterNumber!: HTMLInputElement;
    private inputSpreadSlider!: HTMLInputElement;
    private inputSpreadNumber!: HTMLInputElement;
    private stretchFactorNumber!: HTMLInputElement;
    private avgHueDisplay!: HTMLElement; 
    private centerColorSwatch!: HTMLElement; 
    private histogramCanvas!: HTMLCanvasElement;


    constructor(params: ImageWarpModuleParams) {
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

    public setHandlers(handlers: { 
        onChange?: (image: TypeImage) => void;
        }): void {
        this.onChange = handlers.onChange;
        console.log('Warp module handlers updated.');
        
        this.containerDiv.innerHTML = this.renderInitialStructure();
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        this.loadImage(this.currentImage); 
    }
    
    public loadImage(image: TypeImage): void {
        this.currentImage = image;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        // Reset state on load
        this.warpState = { 
            hueWarping: false,
            warpCenterHue: 50,
            inputSpread: 30,
            stretchFactor: 1.0,
        };
        
        // 1. Calculate Hue Histogram on load
        const { histogram, avgH, maxFrequency } = analyzeHueDistribution(this.currentImage);
        this.hueHistogram = histogram;
        this.avgHue = avgH;
        this.maxHueFrequency = maxFrequency;

        // 2. Update all UI elements
        this.updateControlValues();
        this.updateAverageHueDisplay(); 
        this.drawHueHistogram(); // Draw the histogram initially
    }
    
    /**
     * Updates the control displays, including the color swatch, value text, and input element values.
     */
    private updateControlValues(): void {
        this.hueWarpingBtn.classList.toggle('active-transform', this.warpState.hueWarping);
        
        // Calculate the color for the swatch and text
        const centerRgb = hslToRgb(this.warpState.warpCenterHue, 100, 50);
        const colorString = `rgb(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b})`;
        
        // 1. Update visual feedback
        if (this.centerColorSwatch) {
             this.centerColorSwatch.style.backgroundColor = colorString;
        }
        if (this.warpCenterSpan) {
            this.warpCenterSpan.style.color = colorString;
            this.warpCenterSpan.textContent = `${this.warpState.warpCenterHue}° Hue`;
        }
        if (this.inputSpreadSpan) {
            this.inputSpreadSpan.textContent = `±${this.warpState.inputSpread}° Range`;
        }
        if (this.stretchFactorSpan) {
            this.stretchFactorSpan.textContent = `×${this.warpState.stretchFactor.toFixed(2)} Factor`;
        }

        // 2. Update Input element values
        if (this.warpCenterSlider) this.warpCenterSlider.value = this.warpState.warpCenterHue.toString();
        if (this.warpCenterNumber) this.warpCenterNumber.value = this.warpState.warpCenterHue.toString();
        if (this.inputSpreadSlider) this.inputSpreadSlider.value = this.warpState.inputSpread.toString();
        if (this.inputSpreadNumber) this.inputSpreadNumber.value = this.warpState.inputSpread.toString();
        const stretchFactorSlider = this.containerDiv.querySelector(`#stretchFactorSlider-${this.containerDiv.id}`) as HTMLInputElement;
        if (stretchFactorSlider) stretchFactorSlider.value = this.warpState.stretchFactor.toString();
        if (this.stretchFactorNumber) this.stretchFactorNumber.value = this.warpState.stretchFactor.toFixed(2);
        
        // 3. Redraw the histogram to show the updated range
        this.drawHueHistogram();
    }
    
    /**
     * Displays the image's average hue for user context.
     */
    private updateAverageHueDisplay(): void {
        this.avgHueDisplay.textContent = `${this.avgHue}° Avg Hue (Context)`;
    }
    
    /**
     * Draws the hue histogram onto the dedicated canvas.
     */
    private drawHueHistogram(): void {
        const histCtx = this.histogramCanvas.getContext('2d');
        if (!histCtx) return;

        const width = this.histogramCanvas.width;
        const height = this.histogramCanvas.height;
        histCtx.clearRect(0, 0, width, height);
        
        const binWidth = width / 360;
        const maxFreq = this.maxHueFrequency;
        
        // Draw the background bars (the spectrum)
        for (let h = 0; h < 360; h++) {
            const barHeight = (this.hueHistogram[h] / maxFreq) * height;
            histCtx.fillStyle = `hsl(${h}, 100%, 50%)`;
            histCtx.fillRect(h * binWidth, height - barHeight, binWidth, barHeight);
        }

        // Draw the Histogram bars (frequency visualization)
        histCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let h = 0; h < 360; h++) {
            const barHeight = (this.hueHistogram[h] / maxFreq) * height;
            // Draw a semi-transparent black bar overlay to show density
            histCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            histCtx.fillRect(h * binWidth, height - barHeight, binWidth, barHeight);
        }

        // Draw the current input range highlight
        const center = this.warpState.warpCenterHue;
        const spread = this.warpState.inputSpread;
        
        // Calculate the range boundaries, wrapping around 360
        const start = (center - spread + 360) % 360;
        const end = (center + spread + 360) % 360;
        
        histCtx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Light overlay
        
        if (start < end) {
            // Standard range (e.g., 30° to 70°)
            histCtx.fillRect(start * binWidth, 0, (end - start) * binWidth, height);
        } else {
            // Wrapped range (e.g., 340° to 20°)
            // 1. Draw from start to 360
            histCtx.fillRect(start * binWidth, 0, (360 - start) * binWidth, height);
            // 2. Draw from 0 to end
            histCtx.fillRect(0, 0, end * binWidth, height);
        }
        
        // Draw the center marker
        histCtx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        histCtx.fillRect(center * binWidth - 1, 0, 2, height);
    }
    

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        return `
            <style>
                .warp-control { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; justify-content: space-between; }
                .warp-control label { width: 140px; font-weight: bold; }
                
                .value-display-group { 
                    display: flex; align-items: center; gap: 10px; 
                }
                .value-display { 
                    font-size: 0.9em; 
                    font-style: italic; 
                    color: #aaa; 
                    width: 100px; 
                    text-align: right;
                }
                
                .input-group { 
                    display: flex; 
                    flex-grow: 1; 
                    gap: 10px;
                }
                .input-group input[type="range"] {
                    flex-grow: 1;
                    min-width: 100px;
                }
                .input-group input[type="number"] {
                    width: 60px;
                    padding: 3px;
                    border: 1px solid #555;
                    background-color: #2c3e50;
                    color: white;
                    text-align: right;
                    border-radius: 2px;
                }
                /* Hue slider background for visual cue */
                .input-group input[type="range"]#warpCenterSlider-${idSuffix} {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(to right, 
                        #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%
                    );
                }
                /* Style the background of non-hue sliders (Range/Factor) */
                .input-group input.basic-slider {
                    background: #555;
                }


                .single-button-container { margin-top: 15px; }
                .single-button-container button { 
                    width: 100%; padding: 8px; background-color: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; 
                }
                .single-button-container button:hover { background-color: #8e44ad; }
                .single-button-container .active-transform { background-color: #e74c3c; } 
                
                .hue-context { 
                    display: flex; align-items: center; justify-content: space-between; 
                    padding: 8px 0; border-bottom: 1px dashed #444; margin-bottom: 10px;
                }
                .hue-context .color-swatch { width: 20px; height: 20px; border: 1px solid #ccc; margin-right: 10px; border-radius: 50%; }
                
                #warp-canvas { display: none; }
                .hue-histogram-container { margin-bottom: 15px; }
                #hue-histogram-canvas-${idSuffix} {
                    width: 100%; 
                    height: 40px; 
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 4px;
                }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Hue Warping (Color Stretching / Compression)</summary>
                
                <div style="display:none">
                    <canvas id="warp-canvas"></canvas>
                </div>
                
                <div class="hue-context">
                    <span id="avg-hue-display-${idSuffix}" style="font-weight: bold;">0° Avg Hue (Context)</span>
                </div>
                
                <div class="hue-histogram-container">
                    <canvas id="hue-histogram-canvas-${idSuffix}" width="360" height="40"></canvas>
                </div>

                <div class="warp-control">
                    <label>Warp Center Hue:</label>
                    <div class="value-display-group">
                        <span id="center-color-swatch-${idSuffix}" class="color-swatch"></span>
                        <span id="warp-center-value-${idSuffix}" class="value-display">${this.warpState.warpCenterHue}° Hue</span>
                    </div>
                </div>
                <div class="input-group">
                    <input type="range" id="warpCenterSlider-${idSuffix}" min="0" max="360" step="1" value="${this.warpState.warpCenterHue}" />
                    <input type="number" id="warpCenterNumber-${idSuffix}" min="0" max="360" step="1" value="${this.warpState.warpCenterHue}" />
                </div>
                
                <div class="warp-control" style="margin-top: 15px;">
                    <label>Input Range ($\pm$ degrees):</label> 
                    <span id="input-spread-value-${idSuffix}" class="value-display">±${this.warpState.inputSpread}° Range</span>
                </div>
                <div class="input-group">
                    <input type="range" class="basic-slider" id="inputSpreadSlider-${idSuffix}" min="1" max="180" step="1" value="${this.warpState.inputSpread}" />
                    <input type="number" id="inputSpreadNumber-${idSuffix}" min="1" max="180" step="1" value="${this.warpState.inputSpread}" />
                </div>
                
                <div class="warp-control" style="margin-top: 15px;">
                    <label>Stretch Factor:</label>
                    <span id="stretch-factor-value-${idSuffix}" class="value-display">×${this.warpState.stretchFactor.toFixed(2)} Factor</span>
                </div>
                <div class="input-group">
                    <input type="range" class="basic-slider" id="stretchFactorSlider-${idSuffix}" min="0.01" max="3.0" step="0.01" value="${this.warpState.stretchFactor}" />
                    <input type="number" id="stretchFactorNumber-${idSuffix}" min="0.01" max="3.0" step="0.01" value="${this.warpState.stretchFactor}" />
                </div>
                
                <div class="single-button-container">
                    <button id="hueWarpingBtn-${idSuffix}" class="btn">Toggle Hue Warping</button> 
                </div>

            </details></div>
        `;
    }
    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        
        this.hueWarpingBtn = this.containerDiv.querySelector(`#hueWarpingBtn-${idSuffix}`) as HTMLButtonElement;
        
        // Input References
        this.warpCenterSlider = this.containerDiv.querySelector(`#warpCenterSlider-${idSuffix}`) as HTMLInputElement;
        this.warpCenterNumber = this.containerDiv.querySelector(`#warpCenterNumber-${idSuffix}`) as HTMLInputElement;
        this.inputSpreadSlider = this.containerDiv.querySelector(`#inputSpreadSlider-${idSuffix}`) as HTMLInputElement;
        this.inputSpreadNumber = this.containerDiv.querySelector(`#inputSpreadNumber-${idSuffix}`) as HTMLInputElement;
        this.stretchFactorNumber = this.containerDiv.querySelector(`#stretchFactorNumber-${idSuffix}`) as HTMLInputElement;
        
        // Display References
        this.warpCenterSpan = this.containerDiv.querySelector(`#warp-center-value-${idSuffix}`) as HTMLElement;
        this.inputSpreadSpan = this.containerDiv.querySelector(`#input-spread-value-${idSuffix}`) as HTMLElement;
        this.stretchFactorSpan = this.containerDiv.querySelector(`#stretch-factor-value-${idSuffix}`) as HTMLElement;
        this.centerColorSwatch = this.containerDiv.querySelector(`#center-color-swatch-${idSuffix}`) as HTMLElement;
        this.avgHueDisplay = this.containerDiv.querySelector(`#avg-hue-display-${idSuffix}`) as HTMLElement;
        this.histogramCanvas = this.containerDiv.querySelector(`#hue-histogram-canvas-${idSuffix}`) as HTMLCanvasElement;
        
        const commitCanvasElement = this.containerDiv.querySelector('#warp-canvas') as HTMLCanvasElement;
        if (commitCanvasElement) {
             this.canvas = commitCanvasElement;
             this.ctx = commitCanvasElement.getContext('2d', { willReadFrequently: true })!;
             this.canvas.width = this.currentImage.cimage.width;
             this.canvas.height = this.currentImage.cimage.height;
        }
    }

    private attachEventListeners() {
        // Hue Center: Slider (updates on input for responsiveness)
        this.warpCenterSlider.addEventListener('input', (e) => this.handleInputUpdate('warpCenterHue', e.target as HTMLInputElement, this.warpCenterNumber));
        // Hue Center: Number Input (updates on change for precision)
        this.warpCenterNumber.addEventListener('change', (e) => this.handleInputUpdate('warpCenterHue', e.target as HTMLInputElement, this.warpCenterSlider));

        // Input Range: Slider
        this.inputSpreadSlider.addEventListener('input', (e) => this.handleInputUpdate('inputSpread', e.target as HTMLInputElement, this.inputSpreadNumber));
        // Input Range: Number Input
        this.inputSpreadNumber.addEventListener('change', (e) => this.handleInputUpdate('inputSpread', e.target as HTMLInputElement, this.inputSpreadSlider));

        // Stretch Factor: Slider
        const stretchFactorSlider = this.containerDiv.querySelector(`#stretchFactorSlider-${this.containerDiv.id}`) as HTMLInputElement;
        stretchFactorSlider.addEventListener('input', (e) => this.handleInputUpdate('stretchFactor', e.target as HTMLInputElement, this.stretchFactorNumber));

        // Stretch Factor: Number Input
        this.stretchFactorNumber.addEventListener('change', (e) => this.handleInputUpdate('stretchFactor', e.target as HTMLInputElement, stretchFactorSlider));


        this.hueWarpingBtn.addEventListener('click', () => this.handleWarpingToggle());
    }
    
    /**
     * Handles updates from slider or number input, clamps the value, and syncs the companion input.
     */
    private handleInputUpdate(
        key: 'warpCenterHue' | 'inputSpread' | 'stretchFactor', 
        source: HTMLInputElement, 
        companion?: HTMLInputElement
    ): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        let rawValue = parseFloat(source.value);
        let newValue = this.warpState[key] as number;
        
        // 1. Clamping and Normalization
        if (key === 'warpCenterHue') {
            newValue = Math.max(0, Math.min(360, rawValue));
            newValue = Math.round(newValue); 
            
        } else if (key === 'inputSpread') {
            newValue = Math.max(1, Math.min(180, rawValue));
            newValue = Math.round(newValue); 
            
        } else if (key === 'stretchFactor') {
            newValue = Math.max(0.01, Math.min(3.0, rawValue));
            newValue = parseFloat(newValue.toFixed(2));
        }

        if (newValue !== this.warpState[key]) {
             (this.warpState[key] as number) = newValue; 
             
            // 2. Sync companions and update display
            if (companion) {
                companion.value = (key === 'stretchFactor') ? newValue.toFixed(2) : newValue.toString();
            }
            source.value = (key === 'stretchFactor') ? newValue.toFixed(2) : newValue.toString();
            
            this.updateControlValues(); 
            
            // 3. Commit the change only if warping is explicitly enabled.
            if (this.warpState.hueWarping) {
                this.handleWarpTransformCommit();
            }
        }
    }

    private handleWarpingToggle(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;
        this.warpState.hueWarping = !this.warpState.hueWarping;
        this.updateControlValues();
        // A toggle action always triggers a commit so the state change is reflected
        this.handleWarpTransformCommit();
    }
    
    /**
     * CORE LOGIC: Applies Hue Warping pixel-by-pixel, supporting both stretch and compress.
     */
    private applyHueWarping(data: Uint8ClampedArray, centerHue: number, inputSpread: number, stretchFactor: number): void {
        if (inputSpread === 0 || stretchFactor === 1.0) return;
        
        const outputSpread = inputSpread * stretchFactor;
        const isFullCircle = inputSpread >= 180;
        
        if (isFullCircle) {
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue;

                const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
                let h_norm = (hsl.h - centerHue + 360) % 360; 
                if (h_norm > 180) h_norm -= 360; 
                
                h_norm = h_norm * stretchFactor;
                
                let h = (h_norm + centerHue);
                h = ((h % 360) + 360) % 360; 
                
                const newRgb = hslToRgb(h, hsl.s, hsl.l);
                
                data[i] = newRgb.r;
                data[i + 1] = newRgb.g;
                data[i + 2] = newRgb.b;
            }
            return; 
        }

        const inputCompressionRange = 180 - inputSpread;
        const outputCompressionRange = 180 - outputSpread;
        
        const compressionSlope = outputCompressionRange / inputCompressionRange; 
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;

            const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);

            let h_norm = (hsl.h - centerHue + 360) % 360; 
            if (h_norm > 180) h_norm -= 360; 
            
            const sign = h_norm > 0 ? 1 : -1;
            const abs_h_norm = Math.abs(h_norm);

            if (abs_h_norm <= inputSpread) {
                h_norm = h_norm * stretchFactor;
                
            } else {
                const X_start = inputSpread;
                const Y_start = outputSpread;
                
                if (compressionSlope <= 0) {
                    h_norm = Y_start * sign; 
                } else {
                    let new_abs_h_norm = Y_start + (abs_h_norm - X_start) * compressionSlope;
                    new_abs_h_norm = Math.min(180, new_abs_h_norm);
                    h_norm = new_abs_h_norm * sign;
                }
            }

            let h = (h_norm + centerHue);
            h = ((h % 360) + 360) % 360; 
            
            const newRgb = hslToRgb(h, hsl.s, hsl.l);
            
            data[i] = newRgb.r;
            data[i + 1] = newRgb.g;
            data[i + 2] = newRgb.b;
        }
    }
    
    private handleWarpTransformCommit(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        const originalCanvas = this.currentImage.cimage;
        const width = originalCanvas.width;
        const height = originalCanvas.height;
        
        // Only apply transformation if warping is ON AND the factor is non-neutral
        if (this.warpState.hueWarping && this.warpState.stretchFactor !== 1.0) {
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.drawImage(originalCanvas as unknown as CanvasImageSource, 0, 0);
            
            const imageData = this.ctx.getImageData(0, 0, width, height);
            
            this.applyHueWarping(
                imageData.data, 
                this.warpState.warpCenterHue, 
                this.warpState.inputSpread, 
                this.warpState.stretchFactor
            );
            
            const newOffscreenCanvas = new OffscreenCanvas(width, height);
            newOffscreenCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
            
            this.currentImage = {
                ...this.currentImage,
                cimage: newOffscreenCanvas,
            };
            
        } else {
             // Warping is OFF or Factor is 1.0 (no-op), no change to the image asset needed.
             console.log(`No image asset committed. Warping state: ${this.warpState.hueWarping}, Factor: ${this.warpState.stretchFactor}`);
        }
        
        this.onChange?.(this.currentImage);
        console.log(`Image warp transform committed. Status: ${this.warpState.hueWarping && this.warpState.stretchFactor !== 1.0 ? 'Active' : 'Disabled'}`);
    }
}

// --- Example setup for running the class ---
export function initializeWarpEditor(
    container_id : string = "image-warp-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const warpTransformerInstance: ImageEditorWarpModule = new ImageEditorWarpModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET, // Start with the example image
        
    });
    warpTransformerInstance.setHandlers({
        // This handler will be called whenever a transform is applied
        onChange: (image) => {
            if (image) {
                console.log(`[Warp Change] New image version committed.`);
            }
        },

    })
    return warpTransformerInstance;
}