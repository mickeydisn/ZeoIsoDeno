// =========================================================================
// === INTERFACES & UTILITY TYPES ===
// =========================================================================


/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";


/** Defines the parameters for initializing the ImageEditorFilterModule. */
export interface ImageFilterModuleParams {
    image?: TypeImage;
    divId: string;
}

interface HSL { h: number; s: number; l: number; }
interface RGB { r: number; g: number; b: number; }
interface HueAnalysis {
    histogram: number[];
    avgH: number;
    maxFrequency: number;
}

// =========================================================================
// === UTILITY FUNCTIONS ===
// =========================================================================

/** Converts an RGB object (0-255) to HSL object (H: 0-360, S/L: 0-100). */
function rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }

    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Converts an HSL object (H: 0-360, S/L: 0-100) to RGB object (0-255). */
function hslToRgb(h: number, s: number, l: number): RGB {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
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
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}

/** Analyzes the hue distribution of the image data to build a histogram. */
function analyzeHueDistribution(image: TypeImage): HueAnalysis {
    const canvas = image.cimage;
    // Use the offscreen canvas to draw the image for reading pixel data
    const tempCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
    const { width, height } = canvas;

    ctx.drawImage(image.cimage as unknown as CanvasImageSource, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 360 bins for 360 degrees
    const histogram: number[] = new Array(360).fill(0);
    let totalPixels = 0;
    let totalHueSum = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        // Skip transparent pixels
        if (data[i + 3] === 0) continue; 

        // Convert RGB to HSL and get the Hue (0-360)
        const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        
        // Only count pixels with meaningful saturation and lightness (prevent grays/blacks/whites from skewing hue)
        if (s > 10 && l > 10 && l < 90) {
            const hueIndex = Math.min(h, 359);
            histogram[hueIndex]++;
            totalHueSum += h;
            totalPixels++;
        }
    }

    const maxFrequency = Math.max(...histogram);
    const avgH = totalPixels > 0 ? Math.round(totalHueSum / totalPixels) : 0;
    
    return { histogram, avgH, maxFrequency };
}


// =========================================================================
// === IMAGE FILTER MODULE ===
// =========================================================================

export class ImageEditorFilterModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    // Canvas used for actual image processing (hidden)
    private processCanvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D; 
    
    // Canvas used for histogram visualization
    private histogramCanvas!: HTMLCanvasElement;
    
    private onChange?: (image: TypeImage) => void;

    // Filter State
    private filterState = {
        filterActive: false,
        
        // Hue range selector
        centerHue: 50,          // The Hue degree to center the effect on (0-360)
        inputSpread: 30,        // The range of colors to affect (± degrees)
        
        // Filter adjustments (-100 to 100)
        satAdjustment: 0,       
        contrastAdjustment: 0,  
        brightAdjustment: 0,    
    };

    // Histogram State
    private hueHistogram: number[] = new Array(360).fill(0);
    private avgHue: number = 0;
    private maxHueFrequency: number = 0;

    // DOM References 
    private filterToggleBtn!: HTMLButtonElement;
    private satNumber!: HTMLInputElement;
    private contrastNumber!: HTMLInputElement;
    private brightNumber!: HTMLInputElement;
    private centerColorSwatch!: HTMLElement;
    private avgHueDisplay!: HTMLElement;
    
    private centerHueNumber!: HTMLInputElement;
    private spreadNumber!: HTMLInputElement;

    constructor(params: ImageFilterModuleParams) {
        this.currentImage = params.image || DEFAULT_EMPTY_ASSET;
        
        const container = document.getElementById(params.divId);
        if (!container) {
            console.error(`Container div with ID ${params.divId} not found.`);
            const tempDiv = document.createElement('div');
            tempDiv.id = params.divId;
            document.body.appendChild(tempDiv);
            this.containerDiv = tempDiv;
        } else {
            this.containerDiv = container;
        }

        this.containerDiv.innerHTML = this.renderInitialStructure();
        
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        this.loadImage(this.currentImage);
    }
    
    public setHandlers(handlers: { onChange?: (image: TypeImage) => void }): void {
        this.onChange = handlers.onChange;
    }

    public loadImage(image: TypeImage): void {
        this.currentImage = image;
        
        // Ensure canvases match image size
        this.processCanvas.width = this.currentImage.cimage.width;
        this.processCanvas.height = this.currentImage.cimage.height;

        // Reset state on load
        this.filterState = { 
            filterActive: false,
            centerHue: 50,
            inputSpread: 30,
            satAdjustment: 0,
            contrastAdjustment: 0,
            brightAdjustment: 0,
        };
        
        // 1. Calculate Hue Histogram on load
        const { histogram, avgH, maxFrequency } = analyzeHueDistribution(this.currentImage);
        this.hueHistogram = histogram;
        this.avgHue = avgH;
        this.maxHueFrequency = maxFrequency;

        // 2. Update all UI elements
        this.updateControlValues();
        this.updateAverageHueDisplay(); 
        this.drawHueHistogram();
    }
    
    /**
     * Updates the control displays, including the color swatch, value text, and input element values.
     */
    private updateControlValues(): void {
        const idSuffix = this.containerDiv.id;
        
        this.filterToggleBtn.classList.toggle('active-transform', this.filterState.filterActive);
        
        // Calculate the color for the swatch and text
        const centerRgb = hslToRgb(this.filterState.centerHue, 100, 50);
        const colorString = `rgb(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b})`;
        
        // Update visual feedback
        this.centerColorSwatch.style.backgroundColor = colorString;
        
        // Update numerical values display
        this.containerDiv.querySelector(`#center-hue-value-${idSuffix}`)!.textContent = `${this.filterState.centerHue}°`;
        this.containerDiv.querySelector(`#input-spread-value-${idSuffix}`)!.textContent = `±${this.filterState.inputSpread}°`;
        this.containerDiv.querySelector(`#sat-value-${idSuffix}`)!.textContent = `${this.filterState.satAdjustment}%`;
        this.containerDiv.querySelector(`#contrast-value-${idSuffix}`)!.textContent = `${this.filterState.contrastAdjustment}%`;
        this.containerDiv.querySelector(`#bright-value-${idSuffix}`)!.textContent = `${this.filterState.brightAdjustment}%`;

        // Sync inputs
        this.centerHueNumber.value = this.filterState.centerHue.toString();
        this.spreadNumber.value = this.filterState.inputSpread.toString();
        this.satNumber.value = this.filterState.satAdjustment.toString();
        this.contrastNumber.value = this.filterState.contrastAdjustment.toString();
        this.brightNumber.value = this.filterState.brightAdjustment.toString();
        
        // Sync sliders
        (this.containerDiv.querySelector(`#centerHueSlider-${idSuffix}`) as HTMLInputElement).value = this.filterState.centerHue.toString();
        (this.containerDiv.querySelector(`#inputSpreadSlider-${idSuffix}`) as HTMLInputElement).value = this.filterState.inputSpread.toString();
        (this.containerDiv.querySelector(`#satSlider-${idSuffix}`) as HTMLInputElement).value = this.filterState.satAdjustment.toString();
        (this.containerDiv.querySelector(`#contrastSlider-${idSuffix}`) as HTMLInputElement).value = this.filterState.contrastAdjustment.toString();
        (this.containerDiv.querySelector(`#brightSlider-${idSuffix}`) as HTMLInputElement).value = this.filterState.brightAdjustment.toString();

        // Redraw the histogram to show the updated range
        this.drawHueHistogram();
    }

    private updateAverageHueDisplay(): void {
        if (this.avgHueDisplay) {
            this.avgHueDisplay.textContent = `${this.avgHue}° Avg Hue (Context)`;
        }
    }
    
    /**
     * Draws the Hue Histogram, visualizes the image's distribution, and overlays the parabolic weight curve.
     */
    private drawHueHistogram2(): void {
        const hCtx = this.histogramCanvas.getContext('2d')!;
        const { width, height } = this.histogramCanvas;
        hCtx.clearRect(0, 0, width, height);

        const { centerHue, inputSpread } = this.filterState;
        
        // Find max value in histogram for normalization
        const maxVal = this.maxHueFrequency > 0 ? this.maxHueFrequency : 1; 

        // 1. Draw the rainbow background gradient
        const gradient = hCtx.createLinearGradient(0, 0, width, 0);
        for (let i = 0; i <= 360; i += 60) {
            const { r, g, b } = hslToRgb(i % 360, 100, 50);
            gradient.addColorStop(i / 360, `rgb(${r},${g},${b})`);
        }
        hCtx.fillStyle = gradient;
        hCtx.fillRect(0, 0, width, height);

        // 2. Draw the Histogram Bars (over the rainbow gradient)
        hCtx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Dark overlay for the bars
        for (let i = 0; i < 360; i++) {
            const barHeight = (this.hueHistogram[i] / maxVal) * height * 0.9;
            const x = (i / 360) * width;
            const barWidth = width / 360;
            hCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
        
        // 3. Draw the Weighting Function Curve (Parabolic Falloff)
        hCtx.strokeStyle = '#60a5fa'; // Blue accent for the active curve
        hCtx.lineWidth = 3;
        hCtx.beginPath();

        const max_D = inputSpread;

        for (let i = 0; i <= 360; i++) {
            // Calculate hue distance (angular distance, 0-180)
            let h_diff = Math.abs(i - centerHue);
            if (h_diff > 180) h_diff = 360 - h_diff; 
            
            let weight = 0;
            if (h_diff < max_D) {
                const normalized_D = h_diff / max_D; // 0 to 1
                // Parabolic (Gaussian-like) falloff: 1 - (D/S)^2
                weight = 1 - normalized_D * normalized_D; 
            }
            
            const x = (i / 360) * width;
            // Scale the weight (0 to 1) to be a fraction of the height, offset slightly from the bottom
            // The curve should peak near the top (weight=1) and touch the bottom (weight=0)
            const y = height - (weight * height * 0.95); 

            if (i === 0) {
                hCtx.moveTo(x, y);
            } else {
                hCtx.lineTo(x, y);
            }
        }
        hCtx.stroke();
        
        // 4. Draw the Center Hue Line (The "Normal Distribution" peak indicator)
        hCtx.strokeStyle = 'white';
        hCtx.lineWidth = 2;
        hCtx.beginPath();
        const centerLineX = (centerHue / 360) * width;
        hCtx.moveTo(centerLineX, 0);
        hCtx.lineTo(centerLineX, height);
        hCtx.stroke();
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
        const center = this.filterState.centerHue;
        const spread = this.filterState.inputSpread;
        
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
                .hue-context {
                    text-align: center;
                    margin: 10px 0 15px 0;
                    color: #999;
                    font-size: 0.9em;
                }
                .hue-histogram-container {
                    margin: 10px 0 20px 0;
                    border: 1px solid #444;
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
                }
                #hue-histogram-canvas-${idSuffix} {
                    display: block;
                    width: 100%;
                    height: 50px; /* Slightly taller */
                    background: #333;

                }
                
                .filter-control-section {
                    margin-top: 15px;
                }
                .control-label-group {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 5px;
                    font-size: 0.95em;
                }
                .value-display {
                    font-weight: 600;
                    color: #60a5fa; /* Blue accent */
                    min-width: 50px;
                    text-align: right;
                }
                .input-group {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                
                /* --- Custom Slider Style --- */
                .input-group input[type="range"] {
                    flex-grow: 1;
                    -webkit-appearance: none;
                    appearance: none;
                    height: 6px;
                    border-radius: 3px;
                    background: #333;
                    outline: none;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
                }
                .input-group input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #60a5fa; 
                    cursor: pointer;
                    border: 2px solid #1e1e1e;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
                }
                .input-group input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #60a5fa; 
                    cursor: pointer;
                    border: 2px solid #1e1e1e;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
                }
                /* End Custom Slider Style */
                
                .input-group input[type="number"] {
                    width: 55px;
                    padding: 6px;
                    border: 1px solid #444;
                    background: #2b2b2b;
                    color: #e0e0e0;
                    border-radius: 6px;
                    text-align: center;
                    font-size: 0.9em;
                }
                .center-hue-display {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .color-swatch {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid #d4d4d4;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
                }
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    background-color: #444;
                    color: white;
                    cursor: pointer;
                    transition: background-color 0.2s, box-shadow 0.2s, transform 0.1s;
                    font-weight: bold;
                    width: 100%;
                }
                .btn:hover {
                    background-color: #555;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
                }
                .btn.active-transform {
                    background-color: #10b981; /* Emerald Green for active state */
                    box-shadow: 0 0 15px #10b981;
                }
            </style>
            
            <div class="module-card">
                <details>
                    <summary class="module-group-title">Distributed Color Filtering (Sat/Con/Bright)</summary>
                    
                    <div style="display:none">
                        <canvas id="filter-process-canvas-${idSuffix}"></canvas>
                    </div>
                    
                    <div class="hue-context">
                        <span id="avg-hue-display-${idSuffix}" style="font-weight: bold;">0° Avg Hue (Context)</span>
                    </div>
                    
                    <div class="hue-histogram-container">
                        <canvas id="hue-histogram-canvas-${idSuffix}" width="360" height="50"></canvas>
                    </div>

                    <!-- === HUE RANGE SELECTOR === -->
                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <div class="center-hue-display">
                                <span id="center-color-swatch-${idSuffix}" class="color-swatch"></span>
                                <label>Center Hue (Peak Effect)</label>
                            </div>
                            <span id="center-hue-value-${idSuffix}" class="value-display">${this.filterState.centerHue}°</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="centerHueSlider-${idSuffix}" min="0" max="360" step="1" value="${this.filterState.centerHue}" />
                            <input type="number" id="centerHueNumber-${idSuffix}" min="0" max="360" step="1" value="${this.filterState.centerHue}" />
                        </div>
                    </div>
                    
                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <label>Input Spread (Range $\pm$ degrees)</label> 
                            <span id="input-spread-value-${idSuffix}" class="value-display">±${this.filterState.inputSpread}°</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="inputSpreadSlider-${idSuffix}" min="1" max="180" step="1" value="${this.filterState.inputSpread}" />
                            <input type="number" id="inputSpreadNumber-${idSuffix}" min="1" max="180" step="1" value="${this.filterState.inputSpread}" />
                        </div>
                    </div>

                    <hr style="margin: 20px 0; border-top: 1px solid #333;" />

                    <!-- === FILTER CONTROLS === -->
                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <label>Saturation ($\pm$ 100%)</label>
                            <span id="sat-value-${idSuffix}" class="value-display">${this.filterState.satAdjustment}%</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="satSlider-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.satAdjustment}" />
                            <input type="number" id="satNumber-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.satAdjustment}" />
                        </div>
                    </div>

                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <label>Contrast ($\pm$ 100%)</label>
                            <span id="contrast-value-${idSuffix}" class="value-display">${this.filterState.contrastAdjustment}%</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="contrastSlider-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.contrastAdjustment}" />
                            <input type="number" id="contrastNumber-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.contrastAdjustment}" />
                        </div>
                    </div>
                    
                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <label>Brightness ($\pm$ 100%)</label>
                            <span id="bright-value-${idSuffix}" class="value-display">${this.filterState.brightAdjustment}%</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="brightSlider-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.brightAdjustment}" />
                            <input type="number" id="brightNumber-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.brightAdjustment}" />
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <button id="filterToggleBtn-${idSuffix}" class="btn">Toggle Distributed Filters</button> 
                    </div>

                </details>
            </div>
        `;
    }

    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        
        this.filterToggleBtn = this.containerDiv.querySelector(`#filterToggleBtn-${idSuffix}`) as HTMLButtonElement;
        this.satNumber = this.containerDiv.querySelector(`#satNumber-${idSuffix}`) as HTMLInputElement;
        this.contrastNumber = this.containerDiv.querySelector(`#contrastNumber-${idSuffix}`) as HTMLInputElement;
        this.brightNumber = this.containerDiv.querySelector(`#brightNumber-${idSuffix}`) as HTMLInputElement;
        this.centerHueNumber = this.containerDiv.querySelector(`#centerHueNumber-${idSuffix}`) as HTMLInputElement;
        this.spreadNumber = this.containerDiv.querySelector(`#inputSpreadNumber-${idSuffix}`) as HTMLInputElement;
        
        this.centerColorSwatch = this.containerDiv.querySelector(`#center-color-swatch-${idSuffix}`) as HTMLElement;
        this.avgHueDisplay = this.containerDiv.querySelector(`#avg-hue-display-${idSuffix}`) as HTMLElement;
        this.histogramCanvas = this.containerDiv.querySelector(`#hue-histogram-canvas-${idSuffix}`) as HTMLCanvasElement;
        
        const processCanvasElement = this.containerDiv.querySelector(`#filter-process-canvas-${idSuffix}`) as HTMLCanvasElement;
        if (processCanvasElement) {
             this.processCanvas = processCanvasElement;
             // Ensure context is retrieved correctly
             const context = processCanvasElement.getContext('2d', { willReadFrequently: true });
             if (context) {
                 this.ctx = context;
                 this.processCanvas.width = this.currentImage.cimage.width;
                 this.processCanvas.height = this.currentImage.cimage.height;
             } else {
                 console.error("Could not get 2D context for process canvas.");
             }
        }
    }

    private attachEventListeners() {
        const idSuffix = this.containerDiv.id;
        
        // Helper to get input elements safely
        const getSlider = (id: string) => this.containerDiv.querySelector(`#${id}-${idSuffix}`) as HTMLInputElement;
        const getNumber = (id: string) => this.containerDiv.querySelector(`#${id}-${idSuffix}`) as HTMLInputElement;
        
        const centerHueSlider = getSlider('centerHueSlider');
        const spreadSlider = getSlider('inputSpreadSlider');
        const satSlider = getSlider('satSlider');
        const contrastSlider = getSlider('contrastSlider');
        const brightSlider = getSlider('brightSlider');
        
        const centerHueNumber = getNumber('centerHueNumber');
        const spreadNumber = getNumber('inputSpreadNumber');

        // Hue and Spread (Range Selector)
        centerHueSlider.addEventListener('input', (e) => this.handleInputUpdate('centerHue', e.target as HTMLInputElement, centerHueNumber));
        centerHueNumber.addEventListener('change', (e) => this.handleInputUpdate('centerHue', e.target as HTMLInputElement, centerHueSlider));
        spreadSlider.addEventListener('input', (e) => this.handleInputUpdate('inputSpread', e.target as HTMLInputElement, spreadNumber));
        spreadNumber.addEventListener('change', (e) => this.handleInputUpdate('inputSpread', e.target as HTMLInputElement, spreadSlider));

        // Filters
        satSlider.addEventListener('input', (e) => this.handleInputUpdate('satAdjustment', e.target as HTMLInputElement, this.satNumber));
        this.satNumber.addEventListener('change', (e) => this.handleInputUpdate('satAdjustment', e.target as HTMLInputElement, satSlider));
        contrastSlider.addEventListener('input', (e) => this.handleInputUpdate('contrastAdjustment', e.target as HTMLInputElement, this.contrastNumber));
        this.contrastNumber.addEventListener('change', (e) => this.handleInputUpdate('contrastAdjustment', e.target as HTMLInputElement, contrastSlider));
        brightSlider.addEventListener('input', (e) => this.handleInputUpdate('brightAdjustment', e.target as HTMLInputElement, this.brightNumber));
        this.brightNumber.addEventListener('change', (e) => this.handleInputUpdate('brightAdjustment', e.target as HTMLInputElement, brightSlider));


        this.filterToggleBtn.addEventListener('click', () => this.handleFilterToggle());
    }
    
    /**
     * Handles updates from slider or number input, clamps the value, and syncs the companion input.
     */
    private handleInputUpdate(
        key: 'centerHue' | 'inputSpread' | 'satAdjustment' | 'contrastAdjustment' | 'brightAdjustment', 
        source: HTMLInputElement, 
        companion?: HTMLInputElement
    ): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;

        let rawValue = parseFloat(source.value);
        let newValue = this.filterState[key] as number;
        
        // 1. Clamping and Normalization
        if (key === 'centerHue') {
            newValue = Math.max(0, Math.min(360, rawValue));
            newValue = Math.round(newValue); 
        } else if (key === 'inputSpread') {
            newValue = Math.max(1, Math.min(180, rawValue));
            newValue = Math.round(newValue); 
        } else if (key === 'satAdjustment' || key === 'contrastAdjustment' || key === 'brightAdjustment') {
            newValue = Math.max(-100, Math.min(100, rawValue));
            newValue = Math.round(newValue); 
        }

        if (newValue !== this.filterState[key]) {
             (this.filterState[key] as number) = newValue; 
             
            // 2. Sync companions and update display
            if (companion) {
                companion.value = newValue.toString();
            }
            source.value = newValue.toString();
            
            this.updateControlValues(); 
            
            // 3. Commit the change if filtering is explicitly enabled.
            if (this.filterState.filterActive) {
                this.handleFilterTransformCommit();
            }
        }
    }

    private handleFilterToggle(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET) return;
        this.filterState.filterActive = !this.filterState.filterActive;
        this.updateControlValues();
        this.handleFilterTransformCommit();
    }

    /**
     * Applies distributed filters based on a hue range and a smooth weighting function.
     */
    private applyDistributedFilters(
        data: Uint8ClampedArray, 
        centerHue: number, 
        inputSpread: number, 
        sat: number, 
        contrast: number, 
        bright: number
    ): void {
        const max_D = inputSpread;
        
        // Normalize filter values to a -1 to 1 range for easier math
        const sat_norm = sat / 100;
        const contrast_norm = contrast / 100;
        const bright_norm = bright / 100;

        // Pre-calculate Contrast parameters based on a global adjustment
        // The weight will then scale the magnitude of this adjustment for each pixel
        const contrast_s = 1 + contrast_norm; 
        const contrast_offset = 128 * (1 - contrast_s); 
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;

            const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            
            // 1. Calculate normalized hue distance (angular distance, 0-180)
            let h_diff = Math.abs(hsl.h - centerHue);
            // Handle wrap-around (e.g., diff between 10 and 350 is 20, not 340)
            if (h_diff > 180) h_diff = 360 - h_diff; 
            
            // 2. Calculate the Weight (W) based on distance
            // Weight is 1 at center, 0 at 'inputSpread', and 0 outside the range.
            let weight = 0;
            if (h_diff < max_D) {
                const normalized_D = h_diff / max_D; // 0 to 1
                // Parabolic (Gaussian-like) falloff: 1 - (D/S)^2. Strongest at center, fades to zero at the edge.
                weight = 1 - normalized_D * normalized_D; 
            }
            
            if (weight > 0) {
                // --- 3a. Apply Saturation (in HSL, scaled by weight) ---
                // We use hsl.s + (hsl.s * sat_norm * weight) which scales saturation by the current saturation level (making it a multiplicative effect)
                const new_s = Math.max(0, Math.min(100, hsl.s + (hsl.s * sat_norm * weight))); 
                
                // --- 3b. Re-convert HSL to get new RGB for Contrast/Brightness ---
                let { r, g, b } = hslToRgb(hsl.h, new_s, hsl.l);
                
                // --- 3c. Apply Contrast (in RGB, scaled by weight) ---
                if (contrast !== 0) {
                    // Apply contrast adjustment scaled by the calculated weight
                    const r_c = r * (1 + contrast_norm * weight) + contrast_offset * weight;
                    const g_c = g * (1 + contrast_norm * weight) + contrast_offset * weight;
                    const b_c = b * (1 + contrast_norm * weight) + contrast_offset * weight;
                    
                    r = Math.max(0, Math.min(255, r_c));
                    g = Math.max(0, Math.min(255, g_c));
                    b = Math.max(0, Math.min(255, b_c));
                }
                
                // --- 3d. Apply Brightness (in RGB, scaled by weight) ---
                if (bright !== 0) {
                    const bright_adj = 255 * bright_norm * weight;
                    r = Math.max(0, Math.min(255, r + bright_adj));
                    g = Math.max(0, Math.min(255, g + bright_adj));
                    b = Math.max(0, Math.min(255, b + bright_adj));
                }

                data[i] = Math.round(r);
                data[i + 1] = Math.round(g);
                data[i + 2] = Math.round(b);
            }
        }
    }
    
    private handleFilterTransformCommit(): void {
        if (this.currentImage === DEFAULT_EMPTY_ASSET || !this.ctx) return;

        const originalCanvas = this.currentImage.cimage;
        const width = originalCanvas.width;
        const height = originalCanvas.height;
        
        const filterParamsNeutral = this.filterState.satAdjustment === 0 && 
                                    this.filterState.contrastAdjustment === 0 && 
                                    this.filterState.brightAdjustment === 0;
        
        const filterActive = this.filterState.filterActive && !filterParamsNeutral;

        if (filterActive) {
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.drawImage(originalCanvas as unknown as CanvasImageSource, 0, 0);
            
            const imageData = this.ctx.getImageData(0, 0, width, height);
            
            // Apply Distributed Filters
            this.applyDistributedFilters(
                imageData.data,
                this.filterState.centerHue,
                this.filterState.inputSpread,
                this.filterState.satAdjustment,
                this.filterState.contrastAdjustment,
                this.filterState.brightAdjustment
            );
            
            const newOffscreenCanvas = new OffscreenCanvas(width, height);
            newOffscreenCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
            
            this.currentImage = {
                ...this.currentImage,
                cimage: newOffscreenCanvas,
            };
            
        } else {
             // Revert to original image if filter is toggled off or params are neutral
             if (this.currentImage.cimage !== originalCanvas) {
                // In a true environment, we'd need to fetch the original image data again, 
                // but for this pattern, we just keep the reference to the original source.
                this.currentImage = {
                     ...this.currentImage,
                    cimage: originalCanvas,
                };
             }
             console.log(`No image filter committed. Filter Status: Disabled or Neutral.`);
        }
        
        this.onChange?.(this.currentImage);
        console.log(`Image filter transform committed. Status: ${filterActive ? 'Active' : 'Disabled'}`);
    }
}

// --- Example setup for running the class ---
export function initializeFilterEditor(
    container_id : string = "image-filter-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const filterTransformerInstance: ImageEditorFilterModule = new ImageEditorFilterModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET, // Start with the example image
        
    });
    filterTransformerInstance.setHandlers({
        // This handler will be called whenever a transform is applied
        onChange: (image) => {
            if (image) {
                console.log(`[Filter Change] New image version committed.`);
            }
        },

    })
    return filterTransformerInstance;
}