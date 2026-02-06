// =========================================================================
// === UTILITY TYPES AND FUNCTIONS (Self-Contained for Standalone Use) ===
// =========================================================================

/** Placeholder for the TypeImage structure used by the editor ecosystem. */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

/** Converts a hex color string (#RRGGBB) to an RGB object. */
function hexToRgb(hex: string): RGB {
    // Ensure hex is valid and has a # prefix
    const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);
    return { r, g, b };
}

/** Converts an RGB object (0-255) to HSL object (H: 0-360, S/L: 0-100). */
function rgbToHsl(r: number, g: number, b: number): HSL {
    // Normalize to 0-1
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

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
        h: Math.round(h * 360), // Hue 0-360
        s: Math.round(s * 100), // Saturation 0-100
        l: Math.round(l * 100)  // Lightness 0-100
    };
}

/** Calculates the distance between two RGB colors (Euclidean distance). */
function colorDistance(rgb1: RGB, rgb2: RGB): number {
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

// =========================================================================
// === INTERFACES ===
// =========================================================================

export interface ImageEditorColorPaletteModuleParams {
    image?: TypeImage;
    divId: string;
}


// =========================================================================
// === STANDALONE COLOR PALETTE MODULE ===
// =========================================================================

export class ImageEditorColorPaletteModule {
    private currentImage: TypeImage = DEFAULT_EMPTY_ASSET;
    private containerDiv: HTMLElement;
    
    // Internal canvas and context for drawing the image and extracting data
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D; 

    // Handlers
    private onChange?: (image: TypeImage) => void;

    // Palette state
    private colorPalette: { [hex: string]: number } = {};
    private selectedColors: Set<string> = new Set(); // Stores the hex colors currently selected
    private currentSort: 'count' | 'hue' | 'brightness' = 'count';
    private targetReplacementColor: string = '#ffffff'; 

    // DOM References
    private grid!: HTMLElement;
    private mergeBtn!: HTMLButtonElement;
    private replaceBtn!: HTMLButtonElement;
    private autoMergeBtn!: HTMLButtonElement;
    private mergeSmallBtn!: HTMLButtonElement; // NEW
    private mergeThresholdInput!: HTMLInputElement;
    private thresholdValueSpan!: HTMLElement;
    private smallMergeCountInput!: HTMLInputElement; // NEW
    private smallMergeCountSpan!: HTMLElement; // NEW
    private targetColorInput!: HTMLInputElement;

    constructor(params: ImageEditorColorPaletteModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }
        
        this.containerDiv = container;
        this.currentImage = params.image || DEFAULT_EMPTY_ASSET;

        this.containerDiv.innerHTML = this.renderInitialStructure();
        
        // 1. Setup Canvas and Context
        this.canvas = this.containerDiv.querySelector('#palette-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        // 2. Get DOM References
        this.reinitializeDOMReferences();

        // 3. Setup Listeners and Initial Load
        this.attachEventListeners();
        this.loadImage(this.currentImage);
    }
    

    public setHandlers(handlers: { 
        onChange?: (image: TypeImage) => void;
        }): void {
        this.onChange = handlers.onChange;
    }

    // Helper to re-get DOM elements after innerHTML update
    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        this.grid = this.containerDiv.querySelector(`#paletteGrid-${idSuffix}`) as HTMLElement;
        this.mergeBtn = this.containerDiv.querySelector(`#mergeColorsBtn-${idSuffix}`) as HTMLButtonElement;
        this.replaceBtn = this.containerDiv.querySelector(`#replaceColorBtn-${idSuffix}`) as HTMLButtonElement;
        this.autoMergeBtn = this.containerDiv.querySelector(`#autoMergeBtn-${idSuffix}`) as HTMLButtonElement;
        this.mergeSmallBtn = this.containerDiv.querySelector(`#mergeSmallBtn-${idSuffix}`) as HTMLButtonElement; // NEW
        this.mergeThresholdInput = this.containerDiv.querySelector(`#mergeThreshold-${idSuffix}`) as HTMLInputElement;
        this.thresholdValueSpan = this.containerDiv.querySelector(`#thresholdValue-${idSuffix}`) as HTMLElement;
        this.targetColorInput = this.containerDiv.querySelector(`#targetColor-${idSuffix}`) as HTMLInputElement;
        
        this.smallMergeCountInput = this.containerDiv.querySelector(`#smallMergeCount-${idSuffix}`) as HTMLInputElement; // NEW
        this.smallMergeCountSpan = this.containerDiv.querySelector(`#smallMergeCountValue-${idSuffix}`) as HTMLElement; // NEW
    }

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        
        return `
            <style>
                .sort-buttons { display: flex; gap: 5px; margin-bottom: 10px; }
                .transform-buttons, .replace-controls { display: flex; gap: 5px; margin-bottom: 10px; align-items: center; }
                .sort-buttons button, .transform-buttons button, .replace-controls button {
                    padding: 6px 10px;
                    background-color: #34495e;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.1s;
                }
                .sort-buttons button { flex-grow: 1; background-color: #4a627a; }
                .sort-buttons button.active { background-color: #1abc9c; }
                
                .transform-buttons button, .replace-controls button { 
                    background-color: #e67e22; 
                    box-shadow: 0 2px #d35400; 
                }
                .transform-buttons button:active, .replace-controls button:active { transform: translateY(1px); box-shadow: 0 1px #d35400; }

                .replace-controls { 
                    margin-top: 10px; 
                    border-top: 1px dashed #34495e; 
                    padding-top: 10px;
                }
                .replace-controls label { font-size: 0.9em; white-space: nowrap; }
                .replace-controls input[type="color"] {
                    width: 30px;
                    height: 30px;
                    padding: 0;
                    border: none;
                    cursor: pointer;
                }
                .replace-controls button { flex-grow: 1; }

                .palette-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    padding: 5px;
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid #34495e;
                    border-radius: 4px;
                    margin-bottom: 10px;
                }
                .palette-color {
                    width: 40px;
                    height: 40px;
                    border-radius: 4px;
                    cursor: pointer;
                    box-shadow: 0 0 0 2px transparent;
                    transition: box-shadow 0.1s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .palette-color.selected {
                    box-shadow: 0 0 0 2px #f1c40f;
                }
                .palette-color .count {
                    position: absolute;
                    font-size: 0.7em;
                    color: #bdc3c7;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 2px;
                    padding: 0 2px 0 2px;
                }
                .slider-control {
                    margin-bottom: 10px;
                    padding: 5px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                #palette-canvas { display:none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Color Palette Editor</summary>

                <canvas id="palette-canvas"></canvas>

                <div class="sort-buttons">
                    <button class="sort-btn active" data-sort="count">Count</button>
                    <button class="sort-btn" data-sort="hue">Hue</button>
                    <button class="sort-btn" data-sort="brightness">Bright</button>
                </div>
                <div class="palette-grid" id="paletteGrid-${idSuffix}"></div>
                
                <div class="slider-control">
                    <label>Auto-merge Threshold (0-50):</label>
                    <input type="range" id="mergeThreshold-${idSuffix}" min="0" max="50" value="10">
                    <span id="thresholdValue-${idSuffix}">10</span>
                </div>
                
                <div class="transform-buttons">
                    <button class="btn" id="mergeColorsBtn-${idSuffix}">Merge to First Selected</button>
                    <button class="btn" id="autoMergeBtn-${idSuffix}" >Auto-Merge</button>
                </div>

                <div class="slider-control">
                    <label>Max Count for Small Colors:</label>
                    <input type="range" id="smallMergeCount-${idSuffix}" min="1" max="100" value="5">
                    <span id="smallMergeCountValue-${idSuffix}">5 pixels</span>
                </div>
                <div class="transform-buttons" style="margin-top: -5px;">
                    <button class="btn" id="mergeSmallBtn-${idSuffix}" >Merge Small Colors</button>
                </div>
                <div class="replace-controls">
                    <label for="targetColor-${idSuffix}">Target Color:</label>
                    <input type="color" id="targetColor-${idSuffix}" value="${this.targetReplacementColor}">
                    <button class="btn" id="replaceColorBtn-${idSuffix}" >Replace Selected Color</button>
                </div>
            </details></div>
        `;
    }

    private attachEventListeners() {
        // Removed: Load button listener
        
        this.mergeBtn.addEventListener('click', () => this.handleMergeSelected());
        this.replaceBtn.addEventListener('click', () => this.handleReplaceColor());

        this.targetColorInput.addEventListener('input', (e) => { 
            this.targetReplacementColor = (e.target as HTMLInputElement).value;
        });

        this.autoMergeBtn.addEventListener('click', () => this.handleAutoMerge());
        this.mergeSmallBtn.addEventListener('click', () => this.handleMergeSmallCount()); // NEW

        this.mergeThresholdInput.addEventListener('input', (e) => {
            this.thresholdValueSpan.textContent = (e.target as HTMLInputElement).value;
        });
        
        this.smallMergeCountInput.addEventListener('input', (e) => { // NEW
            this.smallMergeCountSpan.textContent = `${(e.target as HTMLInputElement).value} pixels`;
        });
        
        this.containerDiv.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSort(e.target as HTMLButtonElement));
        });
    }
    
    /**
     * PUBLIC METHOD: Loads a new TypeImage into the internal state and redraws.
     */
    public loadImage(image: TypeImage): void {
        this.currentImage = image;
        this.canvas.width = this.currentImage.cimage.width;
        this.canvas.height = this.currentImage.cimage.height;

        this.drawImageToCanvas();
        this.updateMetadata();
    }
    
    private updateMetadata(): void {
        this.extractPaletteFromCanvas();
        this.updateControlStates();
    }
    
    /**
     * Updates the disabled state of control buttons based on the current state.
     */
    private updateControlStates(): void {
        const isImageLoaded = this.currentImage !== DEFAULT_EMPTY_ASSET;
    }

    private drawImageToCanvas(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.currentImage.cimage) {
            this.ctx.drawImage(this.currentImage.cimage as unknown as CanvasImageSource, 0, 0);
        }
    }
    
    /** Extracts the color palette from the current canvas content. */
    private extractPaletteFromCanvas() {
        this.drawImageToCanvas(); // Ensure canvas is up to date
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.colorPalette = {};
        this.selectedColors.clear();
        
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const a = pixels[i + 3];
            if (a > 0) {
                // Ensure correct hex format by padding to 2 digits
                const hex = '#' + [pixels[i], pixels[i + 1], pixels[i + 2]]
                    .map(v => v.toString(16).padStart(2, '0')).join('');
                this.colorPalette[hex] = (this.colorPalette[hex] || 0) + 1;
            }
        }
        this.displayPalette();
    }

    private displayPalette() {
        this.grid.innerHTML = '';
        const sortedColors = Object.entries(this.colorPalette); 

        // Sorting logic
        if (this.currentSort === 'hue' || this.currentSort === 'brightness') {
            sortedColors.sort((a, b) => {
                const rgbA = hexToRgb(a[0]);
                const rgbB = hexToRgb(b[0]);
                const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
                const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);

                if (this.currentSort === 'hue') {
                    // Sort by Hue, then Lightness for tie-breaking
                    return hslA.h - hslB.h || hslB.l - hslA.l;
                } else { 
                    // Sort by Brightness (Lightness), then Hue for tie-breaking
                    return hslB.l - hslA.l || hslA.h - hslB.h;
                }
            });
        } else { // 'count'
            sortedColors.sort((a, b) => b[1] - a[1]);
        }


        sortedColors.forEach(([color, count]) => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'palette-color' + (this.selectedColors.has(color) ? ' selected' : '');
            colorDiv.style.backgroundColor = color;
            colorDiv.title = `Count: ${count}\nColor: ${color}`;
            colorDiv.dataset.color = color; // Store color for selection
            colorDiv.innerHTML = `<span class="count">${count}</span>`;
            colorDiv.addEventListener('click', () => this.handleColorSelection(color, colorDiv));
            this.grid.appendChild(colorDiv);
        });
        this.updateControlStates();
    }

    private handleColorSelection(color: string, colorDiv: HTMLElement) {
        if (this.selectedColors.has(color)) {
            this.selectedColors.delete(color);
            colorDiv.classList.remove('selected');
        } else {
            this.selectedColors.add(color);
            colorDiv.classList.add('selected');
        }
        this.updateControlStates(); // Update button state
    }
    
    private handleSort(targetBtn: HTMLButtonElement) {
        this.containerDiv.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        this.currentSort = targetBtn.dataset.sort as 'count' | 'hue' | 'brightness';
        this.displayPalette();
    }
    
    /** * Mutates the ImageData array, replacing an array of source colors with a single target color.
     * @param {ImageData} imageData - The current image data object to mutate.
     * @param {string} targetColor - The hex color to change all merged colors to.
     * @param {string[]} colorsToMerge - Array of hex colors to replace.
     * @returns {boolean} True if a mutation occurred.
     */
    private replaceColorsInImageData(imageData: ImageData, targetColor: string, colorsToMerge: string[]): boolean {
        const pixels = imageData.data;
        const targetRGB = hexToRgb(targetColor);
        let changed = false;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const a = pixels[i + 3];
            if (a > 0) { // Only check non-transparent pixels
                // Read current pixel color
                const hex = '#' + [pixels[i], pixels[i + 1], pixels[i + 2]]
                    .map(v => v.toString(16).padStart(2, '0')).join('');
                
                if (colorsToMerge.includes(hex)) {
                    pixels[i] = targetRGB.r;
                    pixels[i + 1] = targetRGB.g;
                    pixels[i + 2] = targetRGB.b;
                    changed = true;
                }
            }
        }
        return changed; 
    }

    /** Commits the pixel mutation, updates internal image, and calls onChange. */
    private commitMutation(mutationFn: (imageData: ImageData) => boolean): void {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        if (mutationFn(imageData)) {
            // 1. Apply changes to the displayed canvas
            this.ctx.putImageData(imageData, 0, 0);

            // 2. Update the internal TypeImage (OffscreenCanvas) by copying the main canvas
            const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
            newOffscreenCanvas.getContext('2d')!.drawImage(this.canvas as unknown as CanvasImageSource, 0, 0);
            
            this.currentImage = {
                ...this.currentImage,
                cimage: newOffscreenCanvas,
            };
            
            // 3. Re-extract palette and update controls
            this.extractPaletteFromCanvas();
            
            // 4. Notify parent/external system of the change
            this.onChange?.(this.currentImage);
            console.log(`Image modification committed and onChange event triggered`);
        }
    }

    /** * Handles merging of all selected colors into the first selected color.
     */
    private handleMergeSelected() {
        if (this.selectedColors.size < 2) return;
        const colors = Array.from(this.selectedColors);
        const targetColor = colors[0]; // Use the first selected color as the target
        const colorsToReplace = colors.slice(1);
        
        this.commitMutation(imageData => 
            this.replaceColorsInImageData(imageData, targetColor, colorsToReplace)
        );
        
        this.selectedColors.clear();
        this.updateControlStates();
    }

    /**
     * Replaces the one selected source color with the user-defined target color.
     */
    private handleReplaceColor() {
        if (this.selectedColors.size !== 1) return;
        
        const sourceColor = Array.from(this.selectedColors)[0];
        const targetColor = this.targetReplacementColor;

        if (sourceColor === targetColor) {
            console.log("Source and target colors are the same. No replacement needed.");
            return;
        }

        this.commitMutation(imageData => 
            this.replaceColorsInImageData(imageData, targetColor, [sourceColor])
        );

        this.selectedColors.clear();
        this.updateControlStates();
    }

    /**
     * Handles automatic merging of similar colors based on threshold.
     */
    private handleAutoMerge() {
        const threshold = parseInt(this.mergeThresholdInput.value, 10);
        
        // Sort colors by count (highest first) to prioritize merging into more frequent colors
        const colors = Object.entries(this.colorPalette)
            .sort((a, b) => b[1] - a[1]) 
            .map(e => e[0]);
        
        const mergedColors: Set<string> = new Set();
        const allColorsToMerge: Array<{ target: string, sources: string[] }> = []; 
        
        for (let i = 0; i < colors.length; i++) {
            const targetColor = colors[i];
            if (mergedColors.has(targetColor)) continue;
            
            const mergeGroup = { target: targetColor, sources: [] as string[] };
            const targetRGB = hexToRgb(targetColor);
            
            for (let j = i + 1; j < colors.length; j++) {
                const otherColor = colors[j];
                if (mergedColors.has(otherColor)) continue;

                const otherRGB = hexToRgb(otherColor);
                if (colorDistance(targetRGB, otherRGB) <= threshold) {
                    mergeGroup.sources.push(otherColor);
                }
            }

            if (mergeGroup.sources.length > 0) {
                allColorsToMerge.push(mergeGroup);
            }
            mergedColors.add(targetColor); // Mark the target as processed
            mergeGroup.sources.forEach(c => mergedColors.add(c)); // Mark sources as processed
        }
        
        if (allColorsToMerge.length > 0) {
            this.commitMutation(imageData => {
                let changed = false;
                
                allColorsToMerge.forEach(group => {
                    if(this.replaceColorsInImageData(imageData, group.target, group.sources)) {
                        changed = true;
                    }
                });
                return changed;
            });
        } else {
            console.log('No colors found within threshold to auto-merge.');
        }
    }
    
    /**
     * NEW FEATURE: Merges colors with a count <= the specified maximum into the closest, most frequent color.
     */
    private handleMergeSmallCount() {
        const maxCount = parseInt(this.smallMergeCountInput.value, 10);
        if (isNaN(maxCount) || maxCount < 1) return;

        // 1. Separate small-count colors (sources) and large-count colors (potential targets)
        const smallCountColors = Object.entries(this.colorPalette)
            .filter(([, count]) => count <= maxCount)
            .map(([hex]) => hex);

        if (smallCountColors.length === 0) {
            console.log(`No colors found with count <= ${maxCount} to merge.`);
            return;
        }

        const largeCountColors = Object.entries(this.colorPalette)
            .filter(([, count]) => count > maxCount)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency (highest count first)
            .map(([hex]) => ({ hex, rgb: hexToRgb(hex) }));

        if (largeCountColors.length === 0) {
             console.log("Only small count colors remain. Cannot merge.");
             return;
        }

        // 2. Determine the best target for each small-count color
        const replacementMap: { [sourceHex: string]: string } = {};

        smallCountColors.forEach(sourceHex => {
            const sourceRGB = hexToRgb(sourceHex);
            let bestTarget = '';
            let minDistance = Infinity;

            for (const target of largeCountColors) {
                const distance = colorDistance(sourceRGB, target.rgb);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    bestTarget = target.hex;
                } else if (distance === minDistance && target.hex === largeCountColors[0].hex) {
                    // Tie-breaker: If distances are equal, prefer the globally most frequent color (already sorted to the front)
                    bestTarget = target.hex;
                }
            }
            replacementMap[sourceHex] = bestTarget;
        });

        // 3. Perform the mutation
        this.commitMutation(imageData => {
            let changed = false;
            
            // Collect all source colors grouped by their target color
            const groupsByTarget: { [targetHex: string]: string[] } = {};
            for (const [source, target] of Object.entries(replacementMap)) {
                if (!groupsByTarget[target]) groupsByTarget[target] = [];
                groupsByTarget[target].push(source);
            }

            // Perform replacement for each group
            for (const [target, sources] of Object.entries(groupsByTarget)) {
                 if (this.replaceColorsInImageData(imageData, target, sources)) {
                     changed = true;
                 }
            }
            return changed;
        });
        
        this.selectedColors.clear();
        this.updateControlStates();
        console.log(`Successfully merged ${smallCountColors.length} small-count colors.`);
    }
}

// --- Example setup for running the class ---
export function initializePaletteEditor(
    container_id : string = "editor-palette-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const paletteEditorInstance = new ImageEditorColorPaletteModule({
        divId: container_id,
        image: DEFAULT_EMPTY_ASSET, // Start with the example image
        
    });
    paletteEditorInstance.setHandlers({
        // This handler will be called whenever a color merge/change is committed
        onChange: (image) => {
            if (image) {
                console.log(`[Palette Editor Change] New image version committed`);
            }
        },
    })
    return paletteEditorInstance;
}

// Start the module initialization
// initializePaletteEditor();