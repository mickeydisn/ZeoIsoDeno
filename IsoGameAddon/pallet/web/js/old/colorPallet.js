
import { colorDistance, hexToRgb } from "./colorUtils.js";

// =========================================================================
// === 1. INDEPENDENT COLOR PALETTE MODULE (Canvas Mutator User) ===
// =========================================================================

export class ColorPaletteModule {
    /**
     * @param {string} containerId - The ID of the div container.
     * @param {object} workspaceMutator - Utilities for canvas manipulation/data commit.
     */
    constructor(containerId, workspaceMutator) {
        this.container = document.getElementById(containerId);
        this.mutator = workspaceMutator; // Access to commit methods
        this.lastImageData = null; 
        this.colorPalette = {};
        this.selectedColors = new Set();
        this.currentSort = 'count';

        this.render();
        
        const idSuffix = this.container.id;
        this.grid = this.container.querySelector(`#paletteGrid-${idSuffix}`);
        this.extractBtn = this.container.querySelector(`#extractPaletteBtn-${idSuffix}`);
        this.mergeBtn = this.container.querySelector(`#mergeColorsBtn-${idSuffix}`);
        this.autoMergeBtn = this.container.querySelector(`#autoMergeBtn-${idSuffix}`);
        this.mergeThresholdInput = this.container.querySelector(`#mergeThreshold-${idSuffix}`);
        this.thresholdValueSpan = this.container.querySelector(`#thresholdValue-${idSuffix}`);

        this.attachEventListeners();
    }

    render() {
        const idSuffix = this.container.id;
        this.container.innerHTML = `
            <div class="module-group">
                <div class="module-group-title">Color Palette (Merge Logic Here)</div>
                <div class="sort-buttons">
                    <button class="sort-btn active" data-sort="count">Count</button>
                    <button class="sort-btn" data-sort="hue">Hue</button>
                    <button class="sort-btn" data-sort="brightness">Bright</button>
                </div>
                <div class="palette-grid" id="paletteGrid-${idSuffix}"></div>
                <div class="slider-control">
                    <label>Auto-merge threshold:</label>
                    <input type="range" id="mergeThreshold-${idSuffix}" min="0" max="50" value="10">
                    <span id="thresholdValue-${idSuffix}">10</span>
                </div>
                <div class="transform-buttons">
                    <button class="btn" id="extractPaletteBtn-${idSuffix}" disabled>Refresh Palette</button>
                    <button class="btn" id="mergeColorsBtn-${idSuffix}" disabled>Merge Selected</button>
                    <button class="btn" id="autoMergeBtn-${idSuffix}" disabled>Auto-Merge</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        this.extractBtn.addEventListener('click', () => this.extractPaletteFromData(this.lastImageData)); 
        this.mergeBtn.addEventListener('click', () => this.handleMergeSelected());
        this.autoMergeBtn.addEventListener('click', () => this.handleAutoMerge());
        this.mergeThresholdInput.addEventListener('input', (e) => {
            this.thresholdValueSpan.textContent = e.target.value;
        });
        this.container.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSort(e.target));
        });
    }
    
    /** Public method called by the orchestrator when canvas base data changes. */
    onDataUpdate(imageData) {
        this.lastImageData = imageData;
        if (!imageData) {
            this.grid.innerHTML = '';
            this.extractBtn.disabled = true;
            this.autoMergeBtn.disabled = true;
            return;
        }
        this.extractPaletteFromData(imageData);
        this.extractBtn.disabled = false;
        this.autoMergeBtn.disabled = false;
    }

    extractPaletteFromData(imageData) {
        if (!imageData) { /* ... */ } // Same as before
        this.colorPalette = {};
        this.selectedColors.clear();
        
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const a = pixels[i + 3];
            if (a > 0) {
                const hex = '#' + [pixels[i], pixels[i + 1], pixels[i + 2]]
                    .map(v => v.toString(16).padStart(2, '0')).join('');
                this.colorPalette[hex] = (this.colorPalette[hex] || 0) + 1;
            }
        }
        this.displayPalette();
    }

    displayPalette() {
        // ... (Same as before)
        this.grid.innerHTML = '';
        let sortedColors = Object.entries(this.colorPalette);
        // ... (Sorting logic)

        sortedColors.forEach(([color, count]) => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'palette-color' + (this.selectedColors.has(color) ? ' selected' : '');
            colorDiv.style.backgroundColor = color;
            colorDiv.title = `Count: ${count}\nColor: ${color}`;
            colorDiv.innerHTML = `<span class="count">${count}</span>`;
            colorDiv.addEventListener('click', () => this.handleColorSelection(color, colorDiv));
            this.grid.appendChild(colorDiv);
        });
        this.mergeBtn.disabled = this.selectedColors.size < 2;
    }

    handleColorSelection(color, colorDiv) {
        // ... (Same as before)
        if (this.selectedColors.has(color)) {
            this.selectedColors.delete(color);
            colorDiv.classList.remove('selected');
        } else {
            this.selectedColors.add(color);
            colorDiv.classList.add('selected');
        }
        this.mergeBtn.disabled = this.selectedColors.size < 2;
    }
    
    handleSort(targetBtn) {
        // ... (Same as before)
        this.container.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        this.currentSort = targetBtn.dataset.sort;
        this.displayPalette();
    }

    /** * Merges colors by manipulating the ImageData array.
     * This function is passed to the orchestrator's commit utility.
     * @param {ImageData} imageData - The current image data object to mutate.
     */
    mergeColorsCallback(imageData, targetColor, colorsToMerge) {
        const pixels = imageData.data;
        const targetRGB = hexToRgb(targetColor);
        
        for (let i = 0; i < pixels.length; i += 4) {
            const a = pixels[i + 3];
            if (a > 0) {
                const hex = '#' + [pixels[i], pixels[i + 1], pixels[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
                
                if (colorsToMerge.includes(hex)) {
                    pixels[i] = targetRGB.r;
                    pixels[i + 1] = targetRGB.g;
                    pixels[i + 2] = targetRGB.b;
                }
            }
        }
        // Return true to signal that the data was mutated and needs to be committed
        return true; 
    }

    handleMergeSelected() {
        if (this.selectedColors.size < 2) return;
        const colors = Array.from(this.selectedColors);
        const targetColor = colors[0]; 
        
        // Module uses the mutator to apply the change directly to the canvas context
        this.mutator.commitPixelDataMutation(imageData => 
            this.mergeColorsCallback(imageData, targetColor, colors)
        );
        
        this.selectedColors.clear();
        this.displayPalette();
    }

    handleAutoMerge() {
        const threshold = parseInt(this.mergeThresholdInput.value);
        const colors = Object.entries(this.colorPalette)
            .sort((a, b) => b[1] - a[1]) 
            .map(e => e[0]);
        
        // ... (Auto-merge grouping logic - Same as before)
        const mergedColors = new Set();
        let allColorsToMerge = [];
        
        for (let i = 0; i < colors.length; i++) {
            const targetColor = colors[i];
            if (mergedColors.has(targetColor)) continue;
            
            const mergeGroup = [targetColor];
            const targetRGB = hexToRgb(targetColor);
            
            for (let j = i + 1; j < colors.length; j++) {
                const otherColor = colors[j];
                if (mergedColors.has(otherColor)) continue;

                const otherRGB = hexToRgb(otherColor);
                if (colorDistance(targetRGB, otherRGB) <= threshold) {
                    mergeGroup.push(otherColor);
                }
            }

            if (mergeGroup.length > 1) {
                allColorsToMerge.push(mergeGroup);
                mergeGroup.forEach(c => mergedColors.add(c));
            }
            mergedColors.add(targetColor);
        }
        
        if (allColorsToMerge.length > 0) {
            // Apply all merges sequentially using the mutator
            this.mutator.commitPixelDataMutation(imageData => {
                let data = imageData;
                let changed = false;
                
                allColorsToMerge.forEach(group => {
                    const targetColor = group[0];
                    // Apply merge directly to the ImageData array
                    if(this.mergeColorsCallback(data, targetColor, group)) {
                        changed = true;
                    }
                });
                return changed;
            });
            
            this.selectedColors.clear();
            this.displayPalette();
        } else {
            // alert('No colors found within threshold to auto-merge.');
        }
    }
}