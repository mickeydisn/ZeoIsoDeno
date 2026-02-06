

import { ColorPaletteModule } from "./colorPallet.js";
import { ColorEditorModule } from "./colorEdit.js";
import { TransformModule } from "./tranformeModule.js"
import { AssetLoaderPallet } from "../pallet/assetLoaderPallet.ts";

// =========================================================================
// === 4. MAIN APPLICATION CLASS (The Canvas-Managing Orchestrator) ===
// =========================================================================

class SpriteSheetEditor {
    constructor(config) {
        this.SPRITE_WIDTH = config.spriteWidth;
        this.SPRITE_HEIGHT = config.spriteHeight;
        // ... (Other properties)
        this.COLS = config.cols;
        this.PIXEL_SIZE = config.initialZoom;
        
        this.sheetCanvas = document.getElementById(config.sheetCanvasId);
        this.sheetCtx = this.sheetCanvas.getContext('2d', { willReadFrequently: true });
        this.workspaceCanvas = document.getElementById(config.workspaceCanvasId);
        this.workspaceCtx = this.workspaceCanvas.getContext('2d', { willReadFrequently: true });
        
        this.originalBaseData = null; 
        this.currentBaseData = null;  // SOURCE OF TRUTH (S.O.T)
        
        this.colorState = { hue: 0, saturation: 0, contrast: 0, brightness: 0 };
        this.transformState = { translateX: 0, translateY: 0, scale: 1 };
        
        this.selectedSprite = null;
        this.isDrawing = false;
        this.rows = 0;
        this.currentTool = 'paint';
        this.currentColor = '#000000';
        this.brushSize = 1;
        
        this.workspaceCanvas.width = this.SPRITE_WIDTH;
        this.workspaceCanvas.height = this.SPRITE_HEIGHT;
        this.updateCanvasScale();
        
        this.initializeModules(config);

        this.attachAllEventListeners();
        document.getElementById('colorDisplay').style.backgroundColor = this.currentColor;
    }

    initializeModules(config) {
        
        const workspaceMutator = {
            commitPixelDataMutation: this.executePixelMutationAndCommit.bind(this),
            commitContextTransform: this.executeContextTransformAndCommit.bind(this),
            createImageData: this.workspaceCtx.createImageData.bind(this.workspaceCtx),
            getSpriteDimensions: () => ({ width: this.SPRITE_WIDTH, height: this.SPRITE_HEIGHT })
        };

        this.colorEditorModule = new ColorEditorModule(
            config.colorEditorContainerId,
            this.colorState,
            (newState) => this.handleColorStateChange(newState)
        );
        
        this.paletteModule = new ColorPaletteModule(
            config.paletteContainerId,
            workspaceMutator
        );

        this.transformModule = new TransformModule(
            config.transformModuleContainerId,
            this.transformState,
            (newState) => this.handleTransformStateChange(newState),
            (action) => this.handleTransformAction(action), 
            workspaceMutator
        );
    }
    
    // --- NEW COMMIT UTILITIES for Modules ---

    /** * Executes a function that mutates the pixel data, then updates S.O.T and redraws.
     * @param {function(ImageData): boolean} mutationFunction - Receives current ImageData. Returns true if mutated.
     */
    executePixelMutationAndCommit(mutationFunction) {
        if (!this.currentBaseData) return;
        
        // Clone the S.O.T data
        const baseData = this.workspaceCtx.createImageData(this.currentBaseData);
        baseData.data.set(this.currentBaseData.data);

        // Module performs the mutation on the copy
        const wasChanged = mutationFunction(baseData);
        
        if (wasChanged) {
            // Update S.O.T and trigger redraw
            this.currentBaseData = baseData;
            this.redrawWorkspace();
        }
    }

    /**
     * Executes a function that applies context transformations, updates S.O.T and redraws.
     * @param {function(CanvasRenderingContext2D, HTMLCanvasElement)} drawCallback - Module applies ctx changes here.
     */
    executeContextTransformAndCommit(drawCallback) {
        if (!this.currentBaseData) return;

        const width = this.SPRITE_WIDTH;
        const height = this.SPRITE_HEIGHT;
        
        // 1. Create a temp canvas holding the S.O.T
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext('2d').putImageData(this.currentBaseData, 0, 0);

        // 2. Clear the main workspace
        this.workspaceCtx.clearRect(0, 0, width, height);

        // 3. Apply the transformation provided by the module
        this.workspaceCtx.save();
        this.workspaceCtx.setTransform(1, 0, 0, 1, 0, 0); 
        drawCallback(this.workspaceCtx, tempCanvas); // Module executes changes on context
        this.workspaceCtx.restore();

        // 4. Update the S.O.T from the transformed canvas result
        this.currentBaseData = this.getWorkspaceData(); 
        
        // 5. Trigger a full redraw (to apply any remaining filter state)
        this.redrawWorkspace(); 
    }

    // --- State/Action Handlers from Modules ---

    handleColorStateChange(newState) {
        this.colorState = newState;
        this.redrawWorkspace();
    }

    handleTransformStateChange(newState) {
        this.transformState = newState;
        this.redrawWorkspace();
    }
    
    handleTransformAction(action) {
        if (!this.currentBaseData) return;
        
        if (action === 'reset') {
            this.setBaseSpriteData(this.getOriginalBaseData());
            this.transformModule.resetSliders();
            this.colorEditorModule.resetState();
        }
    }

    // --- Core Data Management & Canvas Rendering ---

    getOriginalBaseData() {
        if (!this.originalBaseData) return null;
        const copy = this.workspaceCtx.createImageData(this.originalBaseData);
        copy.data.set(this.originalBaseData.data);
        return copy;
    }

    getWorkspaceData() {
        return this.workspaceCtx.getImageData(0, 0, this.SPRITE_WIDTH, this.SPRITE_HEIGHT);
    }

    setBaseSpriteData(data) {
        this.currentBaseData = data;
        this.redrawWorkspace();
    }
    
    // This is the main pipeline: BaseData (S.O.T) -> ColorFilter (State) -> Transform (State) -> Canvas
    redrawWorkspace() {
        if (!this.currentBaseData) {
            this.workspaceCtx.clearRect(0, 0, this.SPRITE_WIDTH, this.SPRITE_HEIGHT);
            this.paletteModule.onDataUpdate(null);
            return;
        }
        
        const width = this.SPRITE_WIDTH;
        const height = this.SPRITE_HEIGHT;
        
        // 1. Apply Color Filter (on currentBaseData) - returns new ImageData (Visual Filter)
        const filteredData = ColorEditorModule.applyFilter(
            this.currentBaseData, 
            this.colorState,
            this.workspaceCtx.createImageData.bind(this.workspaceCtx)
        );
        
        // 2. Apply Transform (State) and draw to canvas
        const { translateX, translateY, scale } = this.transformState;
        this.executeCanvasDrawVisualFilter(filteredData, width, height, (ctx, tempCanvas) => {
            const sx = width / 2;
            const sy = height / 2;
            ctx.translate(sx, sy);
            ctx.scale(scale, scale);
            ctx.translate(-sx, -sy);
            ctx.translate(translateX, translateY);
            ctx.drawImage(tempCanvas, 0, 0);
        });
        
        // 3. Notify Palette Module with the PERMANENT BASE data
        this.paletteModule.onDataUpdate(this.currentBaseData);
    }
    
    executeCanvasDrawVisualFilter(imageData, width, height, drawCallback) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

        this.workspaceCtx.clearRect(0, 0, width, height);
        this.workspaceCtx.save();
        this.workspaceCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset for visual state transformations

        drawCallback(this.workspaceCtx, tempCanvas);

        this.workspaceCtx.restore();
    }
    
    // --- Drawing/File/Sheet Functions (Unchanged) ---
    
    handleFileLoad(e) {
        // ... (Same as before)
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.sheetImage = img;
                this.rows = Math.ceil(img.height / this.SPRITE_HEIGHT);
                this.sheetCanvas.width = img.width;
                this.sheetCanvas.height = img.height;
                this.sheetCtx.drawImage(img, 0, 0);
                this.drawGrid();
                document.getElementById('sheetInfo').textContent = `Image loaded: ${img.width}×${img.height}px | ${this.COLS} columns × ${this.rows} rows`;
                document.getElementById('saveBtn').disabled = false;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    handleSheetClick(e) {
        // ... (Same as before)
        if (!this.sheetImage) return;
        if (this.sheetImage.naturalWidth === 0) return;
        
        const rect = this.sheetCanvas.getBoundingClientRect();
        const col = Math.floor((e.clientX - rect.left) / this.SPRITE_WIDTH);
        const row = Math.floor((e.clientY - rect.top) / this.SPRITE_HEIGHT);
        
        if (col < this.COLS && row < this.rows) {
            this.selectedSprite = { col, row };
            const sx = col * this.SPRITE_WIDTH;
            const sy = row * this.SPRITE_HEIGHT;
            
            this.workspaceCtx.clearRect(0, 0, this.SPRITE_WIDTH, this.SPRITE_HEIGHT);
            this.workspaceCtx.drawImage(this.sheetImage, sx, sy, this.SPRITE_WIDTH, this.SPRITE_HEIGHT, 0, 0, this.SPRITE_WIDTH, this.SPRITE_HEIGHT);
            
            const tempBaseData = this.getWorkspaceData();
            this.originalBaseData = this.workspaceCtx.createImageData(tempBaseData);
            this.originalBaseData.data.set(tempBaseData.data);
            
            this.currentBaseData = tempBaseData;

            this.transformModule.resetSliders(); 
            this.colorEditorModule.resetState(); 
            
            document.getElementById('workspaceInfo').textContent = `Editing sprite: Col ${col + 1}, Row ${row + 1}`;
            document.getElementById('applyBtn').disabled = false;
            document.getElementById('clearBtn').disabled = false;
            this.redrawWorkspace(); 
        }
    }

    handleDrawStart(e) {
          // ... (Same as before)
        if (this.selectedSprite === null) return;
        this.isDrawing = true;
        this.draw(e);
    }

    handleDrawMove(e) {
          // ... (Same as before)
        if (!this.isDrawing) return;
        this.draw(e);
    }

    draw(e) {
          // ... (Same as before)
        const rect = this.workspaceCanvas.getBoundingClientRect();
        const scaleX = this.workspaceCanvas.width / rect.width;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleX);
        
        if (this.currentTool === 'pick') {
            const pixel = this.getWorkspaceData().data.slice((y * this.SPRITE_WIDTH + x) * 4, (y * this.SPRITE_WIDTH + x) * 4 + 4);
            if (pixel[3] > 0) {
                const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
                this.currentColor = hex;
                document.getElementById('colorPicker').value = hex;
                document.getElementById('colorDisplay').style.backgroundColor = hex;
            }
            return;
        }
        
        if (!this.currentBaseData) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.SPRITE_WIDTH;
        tempCanvas.height = this.SPRITE_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(this.currentBaseData, 0, 0);

        const halfSize = Math.floor(this.brushSize / 2);
        
        for (let i = -halfSize; i <= halfSize; i++) {
            for (let j = -halfSize; j <= halfSize; j++) {
                const px = x + i;
                const py = y + j;
                if (px >= 0 && px < this.SPRITE_WIDTH && py >= 0 && py < this.SPRITE_HEIGHT) {
                      if (this.currentTool === 'erase') {
                        tempCtx.clearRect(px, py, 1, 1);
                    } else {
                        tempCtx.fillStyle = this.currentColor;
                        tempCtx.fillRect(px, py, 1, 1);
                    }
                }
            }
        }
        
        this.currentBaseData = tempCtx.getImageData(0, 0, this.SPRITE_WIDTH, this.SPRITE_HEIGHT);
        this.redrawWorkspace(); 
    }
    
    applyToSheet() {
        // ... (Same as before)
        if (this.selectedSprite === null) return;
        
        const finalData = this.getWorkspaceData();
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = finalData.width;
        tempCanvas.height = finalData.height;
        tempCanvas.getContext('2d').putImageData(finalData, 0, 0);

        const sx = this.selectedSprite.col * this.SPRITE_WIDTH;
        const sy = this.selectedSprite.row * this.SPRITE_HEIGHT;
        
        this.sheetCtx.clearRect(sx, sy, this.SPRITE_WIDTH, this.SPRITE_HEIGHT);
        this.sheetCtx.drawImage(tempCanvas, sx, sy);
        
        this.drawGrid();

        const newSheetDataUrl = this.sheetCanvas.toDataURL();
        
        const updatedImage = new Image();
        updatedImage.onload = () => {
            this.sheetImage = updatedImage;
            // alert('Changes applied to sprite sheet and saved for re-selection!');
        };
        updatedImage.src = newSheetDataUrl;
    }

    clearWorkspace() {
        // ... (Same as before)
        this.workspaceCtx.clearRect(0, 0, this.SPRITE_WIDTH, this.SPRITE_HEIGHT);
        this.originalBaseData = null; 
        this.currentBaseData = null;
        this.redrawWorkspace();
        document.getElementById('applyBtn').disabled = true;
        document.getElementById('clearBtn').disabled = true;
        document.getElementById('workspaceInfo').textContent = 'Select a sprite from the sheet to edit';
    }
    
    updateCanvasScale() {
        // ... (Same as before)
        this.workspaceCanvas.style.width = (this.SPRITE_WIDTH * this.PIXEL_SIZE) + 'px';
        this.workspaceCanvas.style.height = (this.SPRITE_HEIGHT * this.PIXEL_SIZE) + 'px';
    }

    drawGrid() {
          // ... (Same as before)
        this.sheetCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.sheetCtx.lineWidth = 1;
        for (let row = 0; row <= this.rows; row++) {
            this.sheetCtx.beginPath();
            this.sheetCtx.moveTo(0, row * this.SPRITE_HEIGHT);
            this.sheetCtx.lineTo(this.sheetCanvas.width, row * this.SPRITE_HEIGHT);
            this.sheetCtx.stroke();
        }
        for (let col = 0; col <= this.COLS; col++) {
            this.sheetCtx.beginPath();
            this.sheetCtx.moveTo(col * this.SPRITE_WIDTH, 0);
            this.sheetCtx.lineTo(col * this.SPRITE_WIDTH, this.sheetCanvas.height);
            this.sheetCtx.stroke();
        }
    }
    
    saveSheet() {
          // ... (Same as before)
        const link = document.createElement('a');
        link.download = 'sprite-sheet-edited.png';
        link.href = this.sheetCanvas.toDataURL();
        link.click();
    }
    
    attachAllEventListeners() {
        // ... (Same event listeners)
        document.getElementById('fileInput').addEventListener('change', this.handleFileLoad.bind(this));
        this.sheetCanvas.addEventListener('click', this.handleSheetClick.bind(this));
        this.workspaceCanvas.addEventListener('mousedown', this.handleDrawStart.bind(this));
        this.workspaceCanvas.addEventListener('mousemove', this.handleDrawMove.bind(this));
        document.addEventListener('mouseup', () => this.isDrawing = false); 
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            document.getElementById('colorDisplay').style.backgroundColor = this.currentColor;
        });
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeValue').textContent = this.brushSize;
        });
        document.getElementById('zoomSlider').addEventListener('input', (e) => {
            this.PIXEL_SIZE = parseInt(e.target.value);
            document.getElementById('zoomValue').textContent = this.PIXEL_SIZE + 'x';
            this.updateCanvasScale();
        });
        document.querySelectorAll('.tool-btn').forEach(btn => btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            this.currentTool = e.currentTarget.dataset.tool;
        }));

        document.getElementById('applyBtn').addEventListener('click', this.applyToSheet.bind(this));
        document.getElementById('clearBtn').addEventListener('click', this.clearWorkspace.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.saveSheet.bind(this));
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const editorConfig = {
        spriteWidth: 192,
        spriteHeight: 224,
        cols: 4,
        initialZoom: 3,
        sheetCanvasId: 'sheetCanvas',
        workspaceCanvasId: 'workspaceCanvas',
        paletteContainerId: 'palette-module-container',
        colorEditorContainerId: 'color-editor-container',
        transformModuleContainerId: 'transform-module-container',
    };

    const editor = new SpriteSheetEditor(editorConfig);


});


