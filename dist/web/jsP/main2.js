// web/jsP/pallet/ProjectType.ts
var DEFAULT_EMPTY_ASSET = {
  cimage: new OffscreenCanvas(256, 256)
};

// web/jsP/pallet/ImageEditorModule.ts
var HISTORY_LIMIT = 20;
var TILE_ASSET_SIZE = 256;
function generateIsometricMaskCanvas() {
  const TILE_SIZE = 256;
  const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext("2d");
  const offset = 0;
  ctx.imageSmoothingEnabled = false;
  const pb = 36;
  const X_CENTER = 128 + offset;
  const X_RIGHT = 192 + offset;
  const X_LEFT = 64 + offset;
  const Y_TOP = 192 - pb + offset;
  const Y_RIGHT_LEFT = 224 - pb + offset;
  const Y_BOTTOM = 256 - pb + offset;
  ctx.strokeStyle = "rgba(230, 126, 34, 1.0)";
  ctx.lineWidth = 1;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  ctx.beginPath();
  ctx.moveTo(X_CENTER, Y_TOP);
  ctx.lineTo(X_RIGHT, Y_RIGHT_LEFT);
  ctx.lineTo(X_CENTER, Y_BOTTOM);
  ctx.lineTo(X_LEFT, Y_RIGHT_LEFT);
  ctx.closePath();
  ctx.stroke();
  const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      data[i] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}
var ISOMETRIC_MASK_CANVAS_TILE = generateIsometricMaskCanvas();
var ImageEditorModule = class {
  currentImage;
  containerDiv;
  canvas;
  ctx;
  zoomWrapper;
  canvasContainer;
  isometricMask = null;
  maskCtx = null;
  // NEW: Selector canvas and context
  selectorCanvas;
  selectorCtx;
  // UPDATED: State for multiple selected tile coordinates. Use Map for fast lookups.
  // Key: "x,y", Value: { x: number, y: number }
  selectedTilesMap = /* @__PURE__ */ new Map();
  // NEW: Debounce variable to prevent double clicks
  lastSelectionToggleTime = 0;
  // Store the current mask OffscreenCanvas tile instance
  currentMaskCanvasTile;
  // Handlers
  onSave;
  onLoad;
  onImageChange;
  // onMaskChange handler
  onMaskSave;
  onMaskLoad;
  onMaskChange;
  isMaskEnabled = true;
  // History management
  undoStack = [];
  redoStack = [];
  // Zoom state
  currentZoom = 1;
  minZoom = 0.25;
  maxZoom = 4;
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.currentImage = params.image || DEFAULT_EMPTY_ASSET;
    this.containerDiv = container;
    this.currentMaskCanvasTile = ISOMETRIC_MASK_CANVAS_TILE;
    this.containerDiv.innerHTML = this.getInitialStyles();
    this.reinitializeDOMReferences();
    this.loadMask(this.currentMaskCanvasTile);
    this.loadImage(this.currentImage, false);
    this.setupEventListeners();
    this.handleZoom();
    this.drawTileSelector();
  }
  /**
   * PUBLIC METHOD: Sets or updates the handlers.
   */
  setHandlers(handlers) {
    if (handlers.onSave) {
      this.onSave = handlers.onSave;
    }
    if (handlers.onLoad)
      this.onLoad = handlers.onLoad;
    if (handlers.onImageChange)
      this.onImageChange = handlers.onImageChange;
    if (handlers.onMaskSave) {
      this.onMaskSave = handlers.onMaskSave;
    }
    if (handlers.onMaskLoad)
      this.onMaskLoad = handlers.onMaskLoad;
    if (handlers.onMaskChange)
      this.onMaskChange = handlers.onMaskChange;
    this.reinitializeDOMReferences();
    this.setupEventListeners();
  }
  /**
   * PUBLIC METHOD: Returns the list of currently selected tile coordinates.
   * Returns an empty array if no tiles are selected.
   */
  getSelectedAsset() {
    return Array.from(this.selectedTilesMap.values());
  }
  /**
   * PUBLIC METHOD: Loads a new OffscreenCanvas (the tile) and redraws the repeating mask pattern.
   */
  loadMask(maskTileCanvas) {
    console.log("Loading new isometric mask tile from external module.");
    this.currentMaskCanvasTile = maskTileCanvas;
    this.drawCurrentMaskPattern();
    if (this.onMaskChange) {
      this.onMaskChange(this.currentMaskCanvasTile);
    }
  }
  /**
   * Internal helper to draw the repeating pattern using the current tile onto the mask canvas.
   */
  drawCurrentMaskPattern() {
    const maskTileCanvas = this.currentMaskCanvasTile;
    if (!this.isometricMask || !this.maskCtx)
      return;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    this.isometricMask.width = canvasWidth;
    this.isometricMask.height = canvasHeight;
    this.maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    try {
      this.maskCtx.imageSmoothingEnabled = false;
      const pattern = this.maskCtx.createPattern(maskTileCanvas, "repeat");
      if (pattern) {
        this.maskCtx.fillStyle = pattern;
        this.maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        console.log("Isometric mask pattern redrawn.");
      }
    } catch (error) {
      console.error("Error drawing current mask pattern:", error);
    }
  }
  // Helper to re-get DOM elements after innerHTML update
  reinitializeDOMReferences() {
    this.zoomWrapper = this.containerDiv.querySelector("#canvas-zoom-wrapper");
    this.canvasContainer = this.containerDiv.querySelector(".canvas-container");
    this.isometricMask = this.containerDiv.querySelector("#isometric-mask");
    this.maskCtx = this.isometricMask ? this.isometricMask.getContext("2d") : null;
    this.selectorCanvas = this.containerDiv.querySelector("#tile-selector");
    this.selectorCtx = this.selectorCanvas ? this.selectorCanvas.getContext("2d") : null;
    const canvasElement = this.containerDiv.querySelector("#image-canvas");
    if (canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext("2d", { willReadFrequently: true });
      this.updateCanvas(this.currentImage.cimage);
    }
  }
  /**
   * PUBLIC METHOD: Loads a new TypeImage into the editor.
   * * If tiles are selected, it copies the corresponding 256x256 area of the incoming image 
   * and pastes it into the selected tiles' locations in the current image.
   * If no tile is selected, it replaces the entire current image.
   */
  loadImage(image, pushToHistory = true) {
    console.log("Load Image ", image);
    if (pushToHistory) {
      this.pushHistory();
    }
    const incomingCanvas = image.cimage;
    const isSelectionActive = this.selectedTilesMap.size > 0;
    const isCurrentCanvasValid = this.currentImage.cimage.width > 0;
    let tilesUpdated = 0;
    if (isSelectionActive && isCurrentCanvasValid) {
      const ctx = this.currentImage.cimage.getContext("2d");
      for (const tile of this.selectedTilesMap.values()) {
        const targetX = tile.x * TILE_ASSET_SIZE;
        const targetY = tile.y * TILE_ASSET_SIZE;
        const isTargetInCurrentBounds = targetX < this.currentImage.cimage.width && targetY < this.currentImage.cimage.height;
        const isSourceAvailable = targetX < incomingCanvas.width && targetY < incomingCanvas.height;
        if (isTargetInCurrentBounds && isSourceAvailable) {
          ctx.clearRect(targetX, targetY, TILE_ASSET_SIZE, TILE_ASSET_SIZE);
          ctx.drawImage(
            incomingCanvas,
            targetX,
            targetY,
            TILE_ASSET_SIZE,
            TILE_ASSET_SIZE,
            // Source tile
            targetX,
            targetY,
            TILE_ASSET_SIZE,
            TILE_ASSET_SIZE
            // Destination tile
          );
          tilesUpdated++;
        }
      }
      if (tilesUpdated > 0) {
        console.log(`Updated ${tilesUpdated} selected tile(s) content from incoming image.`);
      } else {
        this.currentImage = image;
        console.log(`Selection was active but no tiles were updated. Performed full image replacement.`);
      }
    } else {
      this.currentImage = image;
      console.log(`No tile selection active. Performed full image replacement.`);
    }
    this.updateCanvas(this.currentImage.cimage);
    this.renderMetadata();
    this.updateHistoryButtons();
    this.drawTileSelector();
    if (this.onImageChange) {
      this.onImageChange(this.currentImage);
    }
  }
  getInitialStyles() {
    return `
            <style>
                .module-card-editor {
                    height: calc(100vh - 109px);
                }

                .editor-info { font-size: 0.9em; margin-bottom: 10px; }
                .editor-controls { display: flex; gap: 10px; margin-bottom: 15px; }
                .editor-controls button {
                    padding: 8px 12px;
                    background-color: #e67e22;
                    border: none;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .editor-controls button:disabled { background-color: #bdc3c7; cursor: not-allowed; }
                .editor-controls button:hover:not(:disabled) { background-color: #d35400; }

                .mask-toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-bottom: 15px;
                }
                
                /* --- Canvas Container: Defines Viewport of the Zoomed Content --- */
                .canvas-container {
                    height: calc(100vh - 262px);
                        width: 100%;
                    overflow: scroll;; 
                    margin-bottom: 15px;
                    background: #1e293b;
                    position: relative;
                    padding: 0; 
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); 
                    border-radius: 4px;
                }

                /* --- Zoom Wrapper: Element that scales the content --- */
                #canvas-zoom-wrapper {
                    width: fit-content;
                    height: fit-content;
                    transform-origin: top left;
                    transition: transform 0.1s;
                    position: relative; 
                }

                #image-canvas {
                    image-rendering: pixelated;
                    display: block;
                }
                
                /* --- Isometric Mask Layer Styling --- */
                #isometric-mask {
                    /* Mask is a canvas */
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 10;
                    opacity:.5;
                    transition: opacity 0.2s;
                    /* Dimensions will be set dynamically to match #image-canvas */
                    pointer-events: none; /* Allows clicks to pass through to the canvas below */
                    /* Ensure the HTML canvas element itself is rendered crisply when scaled by CSS */
                    image-rendering: pixelated; 
                }      
                
                /* --- Selector Layer Styling --- */
                #tile-selector {
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 20; /* Highest z-index */
                    pointer-events: none; /* Allows clicks to pass through to the canvas below */
                    image-rendering: pixelated; 
                }
                          
                .zoom-slider-container { display: flex; align-items: center; gap: 10px; }
                #zoom-slider { flex-grow: 1; }
            </style>
            <div class="module-card module-card-editor">                
                <div class="editor-controls">
                    <button id="undo-btn" >Undo</button>
                    <button id="redo-btn" >Redo</button>
                    <button id="load-btn" >Load Image</button>
                    <button id="save-btn" >Save Image</button>
                    <button id="load-mask-btn" >Load Mask</button>
                    <button id="save-mask-btn" >Save Mask</button>
                    <button id="unselect-btn" >Unselect</button> </div>

                <div class="mask-toggle-container">
                    <input type="checkbox" id="mask-toggle" ${this.isMaskEnabled ? "checked" : ""}>
                    <label for="mask-toggle">Show Isometric Mask</label>
                </div>

                <div class="canvas-container">
                    <div id="canvas-zoom-wrapper">
                        <canvas id="image-canvas"></canvas>
                        
                        <canvas id="isometric-mask"></canvas>
                        
                        <canvas id="tile-selector"></canvas>
                    </div>
                </div>
                
                <div class="zoom-slider-container">
                    <label for="zoom-slider">Zoom (x<span id="zoom-value">${this.currentZoom.toFixed(2)}</span>):</label>
                    <input type="range" id="zoom-slider" min="${this.minZoom}" max="${this.maxZoom}" step="0.25" value="${this.currentZoom}">
                </div>
            </div>
        `;
  }
  toggleMaskVisibility(enabled) {
    this.isMaskEnabled = enabled;
    if (this.isometricMask) {
      this.isometricMask.style.opacity = enabled ? ".5" : "0";
    }
  }
  setupEventListeners() {
    this.containerDiv.querySelector("#undo-btn")?.addEventListener("click", () => this.undo());
    this.containerDiv.querySelector("#redo-btn")?.addEventListener("click", () => this.redo());
    if (this.onLoad) {
      this.containerDiv.querySelector("#load-btn")?.addEventListener("click", () => this.handleLoadClick());
    }
    if (this.onSave) {
      this.containerDiv.querySelector("#save-btn")?.addEventListener("click", () => this.saveImage());
    }
    if (this.onMaskLoad) {
      this.containerDiv.querySelector("#load-mask-btn")?.addEventListener("click", () => this.handleLoadMaskClick());
    }
    if (this.onMaskSave) {
      this.containerDiv.querySelector("#save-mask-btn")?.addEventListener("click", () => this.saveMask());
    }
    this.containerDiv.querySelector("#unselect-btn")?.addEventListener("click", () => this.unselectTile());
    const zoomSlider = this.containerDiv.querySelector("#zoom-slider");
    zoomSlider.addEventListener("input", (e) => this.handleZoom(e.target.value));
    const maskToggle = this.containerDiv.querySelector("#mask-toggle");
    if (maskToggle) {
      this.toggleMaskVisibility(this.isMaskEnabled);
      maskToggle.addEventListener("change", (e) => this.toggleMaskVisibility(e.target.checked));
    }
    this.canvas.addEventListener("click", (e) => this.handleTileClick(e));
  }
  /**
   * NEW: Clears the current tile selection.
   */
  unselectTile() {
    this.selectedTilesMap.clear();
    this.drawTileSelector();
    console.log("Tile selection cleared.");
  }
  /**
   * Handles clicks on the main canvas to select/unselect a tile (toggle behavior).
   */
  handleTileClick(event) {
    const DEBOUNCE_THRESHOLD_MS = 250;
    const now = Date.now();
    if (now - this.lastSelectionToggleTime < DEBOUNCE_THRESHOLD_MS) {
      console.log("Ignored rapid click (debounce).");
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) / this.currentZoom;
    const clickY = (event.clientY - rect.top) / this.currentZoom;
    if (clickX < 0 || clickY < 0 || clickX >= this.canvas.width || clickY >= this.canvas.height) {
      return;
    }
    const tileX = Math.floor(clickX / TILE_ASSET_SIZE);
    const tileY = Math.floor(clickY / TILE_ASSET_SIZE);
    const maxTileX = Math.floor(this.canvas.width / TILE_ASSET_SIZE) - 1;
    const maxTileY = Math.floor(this.canvas.height / TILE_ASSET_SIZE) - 1;
    if (tileX < 0 || tileY < 0 || tileX > maxTileX || tileY > maxTileY) {
      return;
    }
    const key = `${tileX},${tileY}`;
    if (this.selectedTilesMap.has(key)) {
      this.selectedTilesMap.delete(key);
      console.log(`Tile unselected: X=${tileX}, Y=${tileY}. Total selected: ${this.selectedTilesMap.size}`);
    } else {
      this.selectedTilesMap.set(key, { x: tileX, y: tileY });
      console.log(`Tile selected: X=${tileX}, Y=${tileY}. Total selected: ${this.selectedTilesMap.size}`);
    }
    this.lastSelectionToggleTime = now;
    this.drawTileSelector();
  }
  /**
   * Draws the red square selector around ALL currently selected tiles.
   */
  drawTileSelector() {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    if (!this.selectorCtx)
      return;
    this.selectorCanvas.width = canvasWidth;
    this.selectorCanvas.height = canvasHeight;
    this.selectorCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (this.selectedTilesMap.size === 0) {
      return;
    }
    this.selectorCtx.strokeStyle = "red";
    this.selectorCtx.lineWidth = 4;
    this.selectorCtx.imageSmoothingEnabled = false;
    for (const tile of this.selectedTilesMap.values()) {
      const isXValid = tile.x * TILE_ASSET_SIZE < canvasWidth;
      const isYValid = tile.y * TILE_ASSET_SIZE < canvasHeight;
      if (!isXValid || !isYValid) {
        continue;
      }
      const rectX = tile.x * TILE_ASSET_SIZE;
      const rectY = tile.y * TILE_ASSET_SIZE;
      this.selectorCtx.strokeRect(
        rectX + 2,
        rectY + 2,
        TILE_ASSET_SIZE - 4,
        TILE_ASSET_SIZE - 4
      );
    }
  }
  /**
   * Internal handler for the 'Load Image' button click.
   */
  handleLoadClick() {
    if (!this.onLoad) {
      console.warn("onLoad handler is not defined. Cannot load image.");
      return;
    }
    try {
      const loadedImage = this.onLoad();
      if (!loadedImage)
        return;
      this.loadImage(loadedImage);
    } catch (error) {
      console.error("Error during image loading:", error);
    }
  }
  /**
   * Internal handler for the 'Load Image' button click.
   */
  handleLoadMaskClick() {
    if (!this.onMaskLoad) {
      console.warn("onLoad handler is not defined. Cannot load image.");
      return;
    }
    try {
      const loadedImage = this.onMaskLoad();
      if (!loadedImage)
        return;
      this.loadMask(loadedImage.cimage);
    } catch (error) {
      console.error("Error during image loading:", error);
    }
  }
  renderMetadata() {
    this.handleZoom();
  }
  /**
   * Helper to create an immutable deep snapshot of the current image state.
   */
  createImageSnapshot() {
    const currentImage = this.currentImage.cimage;
    const clonedCanvas = new OffscreenCanvas(currentImage.width, currentImage.height);
    clonedCanvas.getContext("2d").drawImage(currentImage, 0, 0);
    const snapshot = {
      ...this.currentImage,
      cimage: clonedCanvas
      // Use the cloned canvas
    };
    return snapshot;
  }
  /**
   * Updates the canvas display with content from an OffscreenCanvas (the image's cimage).
   */
  updateCanvas(source) {
    this.canvas.width = source.width;
    this.canvas.height = source.height;
    this.drawCurrentMaskPattern();
    this.selectorCanvas.width = source.width;
    this.selectorCanvas.height = source.height;
    this.drawTileSelector();
    this.ctx.drawImage(source, 0, 0);
  }
  pushHistory() {
    const state = this.createImageSnapshot();
    this.undoStack.push(state);
    console.log("PUSH HISTORY. Undo stack size:", this.undoStack.length);
    this.redoStack = [];
    if (this.undoStack.length > HISTORY_LIMIT) {
      this.undoStack.shift();
      console.log("Shifted oldest state from undo history.");
    }
  }
  /**
   * UNDO: Moves current state to redo stack, loads previous state from undo stack.
   */
  undo() {
    if (this.undoStack.length === 0)
      return;
    this.redoStack.push(this.createImageSnapshot());
    const previousImage = this.undoStack.pop();
    this.currentImage = previousImage;
    this.updateCanvas(this.currentImage.cimage);
    this.renderMetadata();
    this.updateHistoryButtons();
    if (this.onImageChange) {
      this.onImageChange(this.currentImage);
    }
    console.log(`UNDO complete. Undo: ${this.undoStack.length}, Redo: ${this.redoStack.length}`);
  }
  /**
   * REDO: Moves current state to undo stack, loads next state from redo stack.
   */
  redo() {
    if (this.redoStack.length === 0)
      return;
    this.undoStack.push(this.createImageSnapshot());
    const nextImage = this.redoStack.pop();
    this.currentImage = nextImage;
    this.updateCanvas(this.currentImage.cimage);
    this.renderMetadata();
    this.updateHistoryButtons();
    if (this.onImageChange) {
      this.onImageChange(this.currentImage);
    }
    console.log(`REDO complete. Undo: ${this.undoStack.length}, Redo: ${this.redoStack.length}`);
  }
  updateHistoryButtons() {
    const undoBtn = this.containerDiv.querySelector("#undo-btn");
    const redoBtn = this.containerDiv.querySelector("#redo-btn");
    if (undoBtn)
      undoBtn.disabled = this.undoStack.length === 0;
    if (redoBtn)
      redoBtn.disabled = this.redoStack.length === 0;
  }
  /**
   * Handles slider input to change canvas zoom level, resizing the container and scaling the wrapper.
   */
  handleZoom(value) {
    if (value) {
      this.currentZoom = parseFloat(value);
    }
    this.zoomWrapper.style.transform = `scale(${this.currentZoom})`;
    this.containerDiv.querySelector("#zoom-value").textContent = this.currentZoom.toFixed(2);
  }
  saveImage() {
    if (!this.onSave) {
      console.warn("onSave handler is not defined. Cannot save image.");
      return;
    }
    const finalCanvas = this.createImageSnapshot().cimage;
    const savedImage = {
      ...this.currentImage,
      cimage: finalCanvas
    };
    this.onSave(savedImage);
  }
  saveMask() {
    if (!this.onMaskSave) {
      console.warn("onSave handler is not defined. Cannot save image.");
      return;
    }
    const savedMask = {
      cimage: this.currentMaskCanvasTile
    };
    this.onMaskSave(savedMask);
  }
};
var editorInstance;
function initializeEmptyEditor(container_id = "editor-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  editorInstance = new ImageEditorModule({
    divId: container_id
  });
  console.log("Editor initialized. Handlers are currently undefined.");
  editorInstance.setHandlers({
    onSave: (_) => console.log(`[Demo Save] Image  data ready for storage.`),
    onLoad: () => {
      console.log(`[Demo Load] Simulating asynchronous image loading...`);
      const simulatedNewImage = {
        cimage: new OffscreenCanvas(TILE_ASSET_SIZE * 2, TILE_ASSET_SIZE * 3)
      };
      const ctx = simulatedNewImage.cimage.getContext("2d");
      if (ctx) {
        const colors = ["#3498db", "#2ecc71", "#9b59b6", "#f1c40f", "#e74c3c", "#1abc9c"];
        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 2; x++) {
            ctx.fillStyle = colors[(y * 2 + x) % colors.length];
            ctx.fillRect(x * TILE_ASSET_SIZE, y * TILE_ASSET_SIZE, TILE_ASSET_SIZE, TILE_ASSET_SIZE);
          }
        }
      }
      return simulatedNewImage;
    },
    onImageChange: (image) => {
      const selectedTiles = editorInstance.getSelectedAsset();
      console.log(`[Demo Image Change] Image updated. Total selected tiles: ${selectedTiles.length}`);
    },
    onMaskChange: (maskTileCanvas) => {
      console.log(`[Demo Mask Change] Mask OffscreenCanvas tile updated. Dimensions: ${maskTileCanvas.width}x${maskTileCanvas.height}`);
    }
  });
  return editorInstance;
}

// web/jsP/pallet/assetPalletConfig.ts
function fileToGroup(filename) {
  return {
    "src": "./img/asset_opti/" + filename + ".png",
    "group": filename,
    "imgHeight": 224,
    "imgWidth": 192
  };
}
var assetFileConfig = [
  // fileToGroup("ItemTech"),
  fileToGroup("AstroBase"),
  fileToGroup("AstroBase2"),
  fileToGroup("AstroBase3"),
  fileToGroup("AstroBase4"),
  fileToGroup("AstroBase5"),
  fileToGroup("GrokClean1"),
  // fileToGroup("Wall"),
  // fileToGroup("ItemPilar"),
  // fileToGroup("NatureRock"),
  // fileToGroup("AstroRocket"),
  fileToGroup("Town2"),
  // fileToGroup("NatureFlower"),
  // fileToGroup("AstroPlatform"),
  // fileToGroup("MyTower"),
  // fileToGroup("ItemOther"),
  // fileToGroup("ItemGrave"),
  // fileToGroup("Train"),
  // fileToGroup("UserAstro"),
  fileToGroup("Town1")
  // fileToGroup("NatureTree"),
];

// web/jsP/pallet/assetLoaderPallet.ts
var canvasFilterStrToValue = (str) => ({
  color: str
});
var colorVariation = (sourceCanvas, conf) => {
  const newCanvas = new OffscreenCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = newCanvas.getContext("2d");
  if (!ctx)
    return void 0;
  ctx.drawImage(sourceCanvas, 0, 0);
  if (conf.color) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = conf.color;
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  }
  return newCanvas;
};
var SCALE_SIZE = 1;
var AssetLoaderPallet = class _AssetLoaderPallet {
  assetList;
  assetTree = {};
  assetSheets = [];
  countLoad = 0;
  constructor(assetList = []) {
    this.assetList = assetList.length > 0 ? assetList : assetFileConfig || [];
  }
  /**
   * Static factory method to create an instance and handle async loading.
   * @param assetList Optional list of asset configs to load.
   */
  static async create(assetList) {
    const loader = new _AssetLoaderPallet(assetList);
    await loader.loadAssetFiles();
    console.log("Assets loaded into assetSheets:", loader.assetSheets.length);
    return loader;
  }
  /**
   * Loads all asset images concurrently.
   */
  async loadAssetFiles() {
    const loadImageBitmap = async (url) => {
      const response = await fetch(url);
      return createImageBitmap(await response.blob());
    };
    const promises = this.assetList.map(
      async (assetInfo) => {
        this.countLoad++;
        try {
          const image = await loadImageBitmap("../../" + assetInfo.src);
          this.loadAssetImage(assetInfo, image);
        } catch (e) {
          console.error(`Failed to load asset: ${assetInfo.src}`, e);
        }
      }
    );
    await Promise.all(promises);
  }
  /**
   * Extracts and processes individual assets from the loaded sprite sheet.
   */
  loadAssetImage(assetInfo, sourceImg) {
    const wCutSize = 256 - 64;
    const hCutSize = 256 - 32;
    const scall = assetInfo.scall ? 0.7 : 1;
    const __cutImage = (wId, hId) => {
      const destCanvas = new OffscreenCanvas(
        256 * SCALE_SIZE,
        256 * SCALE_SIZE
      );
      const ctx2 = destCanvas.getContext("2d", { willReadFrequently: true });
      const sX = wCutSize * wId + Math.floor(wCutSize * ((1 - scall) / 2));
      const sY = hCutSize * hId + Math.floor(hCutSize * (1 - scall));
      const sWidth = Math.floor(wCutSize * scall);
      const sHeight = hCutSize + 128;
      const dX = 32 * SCALE_SIZE;
      const dY = 0 + (assetInfo.scall ? 32 : 0);
      const dWidth = wCutSize * SCALE_SIZE;
      const dHeight = Math.floor(hCutSize / scall) * SCALE_SIZE + 128;
      ctx2.drawImage(
        sourceImg,
        // Assert type for compatibility
        sX,
        sY,
        sWidth,
        sHeight,
        dX,
        dY,
        dWidth,
        dHeight
      );
      return destCanvas;
    };
    const n = Math.round(sourceImg.height / hCutSize);
    const assetRows = [];
    for (let idx = 0; idx < n; idx++) {
      const labelBase = `${assetInfo.group}_${String(idx)}`;
      const assets = [
        {
          group: assetInfo.group,
          label: `${labelBase}_NE`,
          cimage: __cutImage(0, idx)
        },
        {
          group: assetInfo.group,
          label: `${labelBase}_NW`,
          cimage: __cutImage(1, idx)
        },
        {
          group: assetInfo.group,
          label: `${labelBase}_SW`,
          cimage: __cutImage(2, idx)
        },
        {
          group: assetInfo.group,
          label: `${labelBase}_SE`,
          cimage: __cutImage(3, idx)
        }
      ];
      assets.forEach((a) => {
        this.assetTree[a.label] = a;
      });
      assetRows.push(assets);
    }
    const offscreenCanvas = new OffscreenCanvas(sourceImg.width, sourceImg.height);
    const ctx = offscreenCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(sourceImg, 0, 0);
    }
    const assetSheet = {
      name: assetInfo.group,
      cimage: offscreenCanvas,
      assets: assetRows
    };
    this.assetSheets.push(assetSheet);
  }
  /**
   * Retrieves an asset by key, creating a color-varied version if the base asset
   * exists and a color filter is specified.
   * @param key The asset label, optionally followed by a filter (e.g., "asset_0_NE#blue")
   * @returns The OffscreenCanvas for the asset, or undefined.
   */
  getAsset(key) {
    if (this.assetTree[key]) {
      return this.assetTree[key].cimage;
    }
    const parts = key.split("#");
    if (parts.length < 2) {
      return void 0;
    }
    const [keyParent, canvasFilter] = parts;
    const parentAsset = this.assetTree[keyParent];
    if (parentAsset) {
      const parentCimage = parentAsset.cimage;
      const canvasFilterConf = canvasFilterStrToValue(canvasFilter);
      const newCimage = colorVariation(
        parentCimage,
        canvasFilterConf
      );
      if (newCimage) {
        this.assetTree[key] = {
          ...parentAsset,
          // Retain group and base label
          label: key,
          // Use the full key as the label
          cimage: newCimage
        };
        return newCimage;
      }
    }
    return void 0;
  }
};

// web/jsP/pallet/assetPalletInterface.ts
var AssetSelectorModule = class {
  assetSheets;
  containerDiv;
  onSelect;
  zoomScale = 0.5;
  // 50% zoom as required
  // New optional handler properties
  onClickSheet;
  onClickRow;
  onClickItem;
  /**
   * Initializes the module and stores the optional callbacks.
   */
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.assetSheets = params.assetSheets;
    this.containerDiv = container;
    this.onSelect = params.onSelect;
    this.onClickSheet = params.onClickSheet;
    this.onClickRow = params.onClickRow;
    this.onClickItem = params.onClickItem;
    this.containerDiv.innerHTML = this.getInitialStyles();
    this.renderSheets();
  }
  clearHandler() {
    this.onClickItem = void 0;
    this.onClickRow = void 0;
    this.onClickSheet = void 0;
  }
  /**
   * Provides the necessary CSS styles (unchanged, but included for completeness).
   */
  getInitialStyles() {
    return `
        <style>
          .asset-sheet-summary {
            container-type: inline-size;
            margin-bottom: 15px;
            border: 1px solid #555;
            border-radius: 4px;
          }
          .asset-sheet-header {
              display: inline-flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px;
              cursor: pointer;
          }
          .sheet-action-button {
              padding: 4px 8px;
              margin-left: 10px;
              background-color: #00796b; /* Teal */
              border: none;
              color: white;
              border-radius: 3px;
              cursor: pointer;
          }
          .sheet-action-button:hover {
              background-color: #004d40;
          }


          .asset-sheet-content {
            padding: 5px;
            display: grid;
            grid-template-columns: repeat(4, auto); 
            gap: 0;
            overflow-x: auto;
            border-top: 1px solid #555;
            zoom:1;
            min-width:100px;
          }
          @container (max-width: 500px) {
            .asset-sheet-content {
              zoom:.8;
            }
          }
          @container (max-width: 430px) {
            .asset-sheet-content {
              zoom:.6;
            }
          }
          @container (max-width: 273px) {
            .asset-sheet-content {
              zoom:.5;
            }
          }

          .asset-row {
            display: contents;
          }
          .asset-item-wrapper {
            border: 1px solid transparent;
            transition: border-color 0.1s;
            cursor: pointer;
          }
          /* Selection Styles */
          .selected-sheet > summary, .selected-row {
            background-color: #004d40;
          }
          .selected-item {
            border-color: #4db6ac !important;
            background-color: #263238;
          }
          /* Hover Styles */
          .asset-item-wrapper:hover {
            border-color: #90a4ae;
          }
          /* Ensure row-level click targets the wrappers for hover feedback */
          .asset-row:hover > .asset-item-wrapper {
              background-color: #444;
          }
        </style>
        <div class="module-card">
          <h2>Asset Palette Selector</h2>
          <div id="sheet-list"></div>
        </div>
      `;
  }
  /**
   * Renders the list of asset sheets, adding a button if onClickSheet is defined.
   */
  renderSheets() {
    const listContainer = this.containerDiv.querySelector("#sheet-list");
    if (!listContainer)
      return;
    this.assetSheets.forEach((sheet) => {
      const sheetDetails = document.createElement("details");
      sheetDetails.className = "asset-sheet-summary";
      sheetDetails.dataset.sheetName = sheet.name;
      const summary = document.createElement("summary");
      const headerDiv = document.createElement("div");
      headerDiv.className = "asset-sheet-header";
      const titleSpan = document.createElement("span");
      titleSpan.textContent = `Sheet: ${sheet.name} (${sheet.assets.length} rows)`;
      headerDiv.appendChild(titleSpan);
      if (this.onClickSheet) {
        const button = document.createElement("button");
        button.textContent = "Use Sheet";
        button.className = "sheet-action-button";
        button.onclick = (e) => {
          e.stopPropagation();
          this.onClickSheet(sheet);
        };
        headerDiv.appendChild(button);
      }
      headerDiv.onclick = () => this.handleSheetSelection(sheet, sheetDetails);
      summary.appendChild(headerDiv);
      sheetDetails.appendChild(summary);
      const gridContainer = document.createElement("div");
      gridContainer.className = "asset-sheet-content";
      sheet.assets.forEach((row, rowIndex) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "asset-row";
        rowDiv.dataset.rowIndex = String(rowIndex);
        row.forEach((asset) => {
          const itemWrapper = document.createElement("div");
          itemWrapper.className = "asset-item-wrapper";
          itemWrapper.dataset.itemLabel = asset.label;
          const canvas = asset.cimage;
          const displayCanvas = document.createElement("canvas");
          displayCanvas.width = canvas.width * this.zoomScale;
          displayCanvas.height = canvas.height * this.zoomScale;
          const ctx = displayCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
          }
          itemWrapper.onclick = (e) => this.handleItemSelection(e, sheet, rowIndex, asset, itemWrapper);
          itemWrapper.appendChild(displayCanvas);
          rowDiv.appendChild(itemWrapper);
        });
        gridContainer.appendChild(rowDiv);
      });
      sheetDetails.appendChild(gridContainer);
      listContainer.appendChild(sheetDetails);
    });
  }
  // --- Selection Handlers (Modified to use optional callbacks) ---
  handleSheetSelection(sheet, sheetElement) {
    this.clearSelections();
    sheetElement.classList.add("selected-sheet");
    this.onSelect({
      type: "sheet",
      sheetName: sheet.name
    });
  }
  handleItemSelection(e, sheet, rowIndex, asset, itemElement) {
    e.stopPropagation();
    if (this.onClickItem) {
      this.onClickItem(asset);
    }
    if (this.onClickRow) {
      this.onClickRow(sheet.assets[rowIndex]);
    }
    this.clearSelections();
    itemElement.classList.add("selected-item");
    this.onSelect({
      type: "item",
      sheetName: sheet.name,
      rowIndex,
      itemLabel: asset.label,
      asset
    });
  }
  /**
   * Removes all selection classes from all elements (unchanged).
   */
  clearSelections() {
    this.containerDiv.querySelectorAll(".selected-sheet").forEach(
      (el) => el.classList.remove("selected-sheet")
    );
    this.containerDiv.querySelectorAll(".selected-row, .selected-item").forEach(
      (el) => el.classList.remove("selected-row", "selected-item")
    );
  }
};

// web/jsP/pallet/assetWorkspace.ts
var DEFAULT_ASSET = {
  group: "empty",
  label: "empty_cell",
  cimage: new OffscreenCanvas(256, 256)
  // Placeholder empty canvas
};
var EMPTY_ROW = [
  DEFAULT_ASSET,
  DEFAULT_ASSET,
  DEFAULT_ASSET,
  DEFAULT_ASSET
];
var AssetWorkspaceModule = class {
  // Renaming to be consistent with sheet editor structure (TypeSheetAsset is TypeAssetSheet here)
  sheet;
  containerDiv;
  onSelect;
  zoomScale = 0.5;
  onClickSheet;
  onClickRow;
  onClickItem;
  activeSelection = {};
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.sheet = params.assetSheet;
    this.containerDiv = container;
    this.onSelect = params.onSelect;
    this.onClickSheet = params.onClickSheet;
    this.onClickRow = params.onClickRow;
    this.onClickItem = params.onClickItem;
    this.containerDiv.innerHTML = this.getInitialStyles();
    this.renderWorkspace();
  }
  clearHandler() {
    this.onClickItem = void 0;
    this.onClickRow = void 0;
    this.onClickSheet = void 0;
  }
  /**
   * PUBLIC METHOD: Returns the currently active selected asset.
   */
  activAsset() {
    return this.activeSelection.asset;
  }
  /**
   * PUBLIC METHOD: Returns the current active selection object.
   */
  activSection() {
    return this.activeSelection;
  }
  /**
   * PUBLIC METHOD: Replaces the entire workspace sheet with a new sheet.
   * This is the requested 'loadSheet(TypeSheetAsset)' function.
   * Note: TypeSheetAsset is aliased as TypeAssetSheet in this module.
   */
  loadSheet(newSheet) {
    console.log(`Loading new sheet: ${newSheet.name}`);
    this.sheet = newSheet;
    this.activeSelection = {};
    this.renderWorkspace();
    const summary = this.containerDiv.querySelector("summary");
    if (summary) {
      summary.textContent = `Workspace: ${this.sheet.name}`;
    }
  }
  /**
   * PUBLIC METHOD: Returns the current sheet data.
   * Rebuilds the combined sheet image (cimage) from all individual asset canvases.
   */
  getSheet() {
    this.rebuildSheetCImage();
    return this.sheet;
  }
  /**
   * PRIVATE METHOD: Rebuilds the single combined image (cimage) for the entire sheet 
   * by drawing all individual assets onto it.
   */
  rebuildSheetCImage() {
    if (this.sheet.assets.length === 0) {
      this.sheet.cimage = new OffscreenCanvas(256, 256);
      return;
    }
    const assetWidth = this.sheet.assets[0][0]?.cimage?.width || 256;
    const assetHeight = this.sheet.assets[0][0]?.cimage?.height || 256;
    const cols = 4;
    const rows = this.sheet.assets.length;
    const totalWidth = cols * assetWidth;
    const totalHeight = rows * assetHeight;
    const combinedCanvas = new OffscreenCanvas(totalWidth, totalHeight);
    const ctx = combinedCanvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get 2D context for combined sheet image.");
      return;
    }
    this.sheet.assets.forEach((row, rowIndex) => {
      row.forEach((asset, colIndex) => {
        const sourceCanvas = asset.cimage;
        if (sourceCanvas) {
          const drawX = colIndex * assetWidth;
          const drawY = rowIndex * assetHeight;
          ctx.drawImage(sourceCanvas, drawX, drawY);
        }
      });
    });
    this.sheet.cimage = combinedCanvas;
    console.log(`Sheet image rebuilt: ${totalWidth}x${totalHeight} pixels.`);
  }
  /**
   * PUBLIC METHOD: Clears and rebuilds the this.sheet.assets array based on the 
   * current combined sheet image (this.sheet.cimage).
   * * NOTE: This assumes all assets are 256x256 and the grid is 4 columns wide.
   */
  loadSheetCImage(cimage) {
    this.sheet.cimage = cimage;
    const sourceCanvas = cimage;
    if (!sourceCanvas) {
      console.warn("Cannot load sheet from cimage: cimage is null or undefined.");
      this.sheet.assets = [];
      this.renderWorkspace();
      return;
    }
    const assetWidth = 256;
    const assetHeight = 256;
    const cols = 4;
    const totalWidth = sourceCanvas.width;
    const totalHeight = sourceCanvas.height;
    if (totalWidth % assetWidth !== 0 || totalWidth !== cols * assetWidth) {
      console.error(`CImage width (${totalWidth}px) is not compatible with a ${cols}-column grid of ${assetWidth}px assets.`);
      this.sheet.assets = [];
      this.renderWorkspace();
      return;
    }
    this.sheet.assets = [];
    const rows = Math.floor(totalHeight / assetHeight);
    console.log(`Rebuilding sheet assets from cimage: ${rows} rows detected.`);
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const newRow = [];
      const y = rowIndex * assetHeight;
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const x = colIndex * assetWidth;
        const assetCanvas = createOffscreenCanvasFromImage(
          sourceCanvas,
          x,
          y,
          assetWidth,
          assetHeight
        );
        const newAsset = {
          group: this.sheet.name,
          // Use sheet name as default group
          label: `cell_${rowIndex}_${colIndex}`,
          // Generate a temporary label
          cimage: assetCanvas
        };
        newRow.push(newAsset);
      }
      this.sheet.assets.push(newRow);
    }
    this.renderWorkspace();
    console.log(`Sheet assets array rebuilt with ${this.sheet.assets.length} rows.`);
  }
  // --- UI Rendering ---
  getInitialStyles() {
    return `
      <style>
        .sheet-control-panel {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .sheet-control-panel button {
            padding: 8px 15px;
            background-color: #00796b; /* Teal */
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
        }
        .sheet-control-panel button:hover {
            background-color: #004d40;
        }
        .asset-grid-container {
            container-type: inline-size;
            border: 1px solid #555;
            padding: 5px;
            max-height: 70vh;
            overflow-y: auto;
        }
        .asset-row-wrapper {
            display: flex;
            border-bottom: 1px solid #333;
        }
        @container (max-width: 500px) {
          .asset-row-wrapper {
            zoom:.8;
          }
        }
        @container (max-width: 430px) {
          .asset-row-wrapper {
            zoom:.6;
          }
        }
        @container (max-width: 273px) {
          .asset-row-wrapper {
            zoom:.5;
          }
        }
        .asset-grid {
            display: grid;
            grid-template-columns: repeat(4, auto);
            gap: 0;
            flex-grow: 1; /* Takes up most space */
        }
        .row-controls {
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            padding: 0 5px;
            background: #333;
        }
        .row-controls button {
            background: #555;
            color: white;
            border: none;
            padding: 4px;
            margin: 2px 0;
            cursor: pointer;
        }
        .row-controls button:hover {
            background: #777;
        }
        /* Selection Styles (Same as before) */
        .selected-row .asset-item-wrapper {
          background-color: #004d40;
        }
        .selected-item {
          border: 2px solid #4db6ac !important;
          background-color: #263238;
        }
        .asset-item-wrapper {
          border: 1px solid transparent;
          transition: border-color 0.1s;
        }
      </style>
      <details class="module-card">
        <summary>Workspace: ${this.sheet.name}</summary>
        
        <div class="sheet-control-panel">
            <button id="add-row-btn">Add Empty Row</button>
            <button id="use-sheet-btn" ${!this.onClickSheet ? "disabled" : ""}>Use Sheet</button>
        </div>
        
        <div id="asset-grid-view" class="asset-grid-container"></div>
      </details>
    `;
  }
  /**
   * Main render function to draw the grid and controls.
   */
  renderWorkspace() {
    const gridContainer = this.containerDiv.querySelector("#asset-grid-view");
    const addRowBtn = this.containerDiv.querySelector("#add-row-btn");
    if (!gridContainer)
      return;
    gridContainer.innerHTML = "";
    const summary = this.containerDiv.querySelector("summary");
    if (summary) {
      summary.textContent = `Workspace: ${this.sheet.name}`;
    }
    if (addRowBtn) {
      addRowBtn.onclick = () => this.addRow(EMPTY_ROW);
    }
    const useSheetBtn = this.containerDiv.querySelector("#use-sheet-btn");
    if (useSheetBtn) {
      if (this.onClickSheet) {
        useSheetBtn.onclick = (e) => {
          e.preventDefault();
          this.rebuildSheetCImage();
          this.onClickSheet(this.sheet);
        };
        useSheetBtn.disabled = false;
      } else {
        useSheetBtn.disabled = true;
      }
    }
    this.sheet.assets.forEach((row, rowIndex) => {
      const rowWrapper = document.createElement("div");
      rowWrapper.className = "asset-row-wrapper";
      rowWrapper.dataset.rowIndex = String(rowIndex);
      const gridDiv = document.createElement("div");
      gridDiv.className = "asset-grid";
      gridDiv.onclick = (e) => this.handleRowSelection(e, row, rowIndex);
      row.forEach((asset, itemIndex) => {
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "asset-item-wrapper";
        itemWrapper.dataset.itemIndex = String(itemIndex);
        const canvas = asset.cimage;
        const displayCanvas = document.createElement("canvas");
        displayCanvas.width = canvas.width * this.zoomScale;
        displayCanvas.height = canvas.height * this.zoomScale;
        const ctx = displayCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
        }
        itemWrapper.onclick = (e) => this.handleItemSelection(e, asset, rowIndex, itemIndex, itemWrapper);
        itemWrapper.appendChild(displayCanvas);
        gridDiv.appendChild(itemWrapper);
      });
      rowWrapper.appendChild(gridDiv);
      rowWrapper.appendChild(this.renderRowControls(rowIndex));
      gridContainer.appendChild(rowWrapper);
    });
    this.applySelectionStyles();
  }
  /**
   * Renders the Move/Delete buttons for a row.
   */
  renderRowControls(rowIndex) {
    const controlsDiv = document.createElement("div");
    controlsDiv.className = "row-controls";
    const maxIndex = this.sheet.assets.length - 1;
    const upBtn = document.createElement("button");
    upBtn.textContent = "\u25B2";
    upBtn.disabled = rowIndex === 0;
    upBtn.onclick = (e) => {
      e.stopPropagation();
      this.moveRowUp(rowIndex);
    };
    const downBtn = document.createElement("button");
    downBtn.textContent = "\u25BC";
    downBtn.disabled = rowIndex === maxIndex;
    downBtn.onclick = (e) => {
      e.stopPropagation();
      this.moveRowUp(rowIndex + 1);
    };
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "\u2716";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.deleteRow(rowIndex);
    };
    controlsDiv.appendChild(upBtn);
    controlsDiv.appendChild(downBtn);
    controlsDiv.appendChild(deleteBtn);
    return controlsDiv;
  }
  // --- Workspace Manipulation Methods ---
  /**
   * Moves a row from the source index up one position.
   */
  moveRowUp(sourceIndex) {
    if (sourceIndex > 0 && sourceIndex < this.sheet.assets.length) {
      const [movedRow] = this.sheet.assets.splice(sourceIndex, 1);
      this.sheet.assets.splice(sourceIndex - 1, 0, movedRow);
      this.renderWorkspace();
    }
  }
  /**
   * Deletes a row at the specified index.
   */
  deleteRow(index) {
    if (index >= 0 && index < this.sheet.assets.length) {
      this.sheet.assets.splice(index, 1);
      this.renderWorkspace();
    }
  }
  /**
   * Adds a TypeAssetRow to the end of the sheet.
   */
  addRow(row) {
    this.sheet.assets.push(row);
    this.renderWorkspace();
  }
  /**
   * Replaces the content of a specific cell (TypeAsset) at coordinates (x, y).
   * @param asset The new TypeAsset to insert.
   * @param x The column index (0-3).
   * @param y The row index.
   */
  replaceCell(asset, x, y) {
    if (y >= 0 && y < this.sheet.assets.length && x >= 0 && x < 4) {
      this.sheet.assets[y][x] = asset;
      this.renderWorkspace();
    }
  }
  // --- Selection and Event Handling ---
  clearSelections() {
    this.containerDiv.querySelectorAll(".selected-row, .selected-item").forEach(
      (el) => el.classList.remove("selected-row", "selected-item")
    );
  }
  handleRowSelection(e, row, rowIndex) {
    e.stopPropagation();
    if (this.onClickRow) {
      this.onClickRow(row);
    }
    this.clearSelections();
    e.currentTarget.closest(".asset-row-wrapper").querySelectorAll(".asset-item-wrapper").forEach((el) => el.classList.add("selected-row"));
    this.activeSelection = { rowIndex };
    this.onSelect({
      type: "row",
      sheetName: this.sheet.name,
      rowIndex
    });
  }
  handleItemSelection(e, asset, rowIndex, itemIndex, itemElement) {
    e.stopPropagation();
    if (this.onClickItem) {
      this.onClickItem(asset);
    }
    this.clearSelections();
    itemElement.classList.add("selected-item");
    this.activeSelection = { rowIndex, itemIndex, asset };
    this.onSelect({
      type: "item",
      sheetName: this.sheet.name,
      rowIndex,
      itemLabel: asset.label,
      asset
    });
  }
  applySelectionStyles() {
    this.clearSelections();
    const { rowIndex, itemIndex } = this.activeSelection;
    if (rowIndex !== void 0 && itemIndex !== void 0) {
      const itemElement = this.containerDiv.querySelector(
        `.asset-row-wrapper[data-row-index="${rowIndex}"] .asset-item-wrapper[data-item-index="${itemIndex}"]`
      );
      if (itemElement) {
        itemElement.classList.add("selected-item");
      }
    } else if (rowIndex !== void 0) {
      const rowElement = this.containerDiv.querySelector(
        `.asset-row-wrapper[data-row-index="${rowIndex}"]`
      );
      if (rowElement) {
        rowElement.querySelectorAll(".asset-item-wrapper").forEach((el) => el.classList.add("selected-row"));
      }
    }
  }
};
function createOffscreenCanvasFromImage(source, x, y, width, height) {
  const newCanvas = new OffscreenCanvas(width, height);
  const ctx = newCanvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
  }
  return newCanvas;
}

// web/jsP/pallet/ImageEditorColorPaletteModule.ts
function hexToRgb(hex) {
  const normalizedHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(normalizedHex.substring(0, 2), 16);
  const g = parseInt(normalizedHex.substring(2, 4), 16);
  const b = parseInt(normalizedHex.substring(4, 6), 16);
  return { r, g, b };
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    // Hue 0-360
    s: Math.round(s * 100),
    // Saturation 0-100
    l: Math.round(l * 100)
    // Lightness 0-100
  };
}
function colorDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2)
  );
}
var ImageEditorColorPaletteModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  // Internal canvas and context for drawing the image and extracting data
  canvas;
  ctx;
  // Handlers
  onChange;
  // Palette state
  colorPalette = {};
  selectedColors = /* @__PURE__ */ new Set();
  // Stores the hex colors currently selected
  currentSort = "count";
  targetReplacementColor = "#ffffff";
  // DOM References
  grid;
  mergeBtn;
  replaceBtn;
  autoMergeBtn;
  mergeSmallBtn;
  // NEW
  mergeThresholdInput;
  thresholdValueSpan;
  smallMergeCountInput;
  // NEW
  smallMergeCountSpan;
  // NEW
  targetColorInput;
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.containerDiv = container;
    this.currentImage = params.image || DEFAULT_EMPTY_ASSET;
    this.containerDiv.innerHTML = this.renderInitialStructure();
    this.canvas = this.containerDiv.querySelector("#palette-canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    this.loadImage(this.currentImage);
  }
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
  }
  // Helper to re-get DOM elements after innerHTML update
  reinitializeDOMReferences() {
    const idSuffix = this.containerDiv.id;
    this.grid = this.containerDiv.querySelector(`#paletteGrid-${idSuffix}`);
    this.mergeBtn = this.containerDiv.querySelector(`#mergeColorsBtn-${idSuffix}`);
    this.replaceBtn = this.containerDiv.querySelector(`#replaceColorBtn-${idSuffix}`);
    this.autoMergeBtn = this.containerDiv.querySelector(`#autoMergeBtn-${idSuffix}`);
    this.mergeSmallBtn = this.containerDiv.querySelector(`#mergeSmallBtn-${idSuffix}`);
    this.mergeThresholdInput = this.containerDiv.querySelector(`#mergeThreshold-${idSuffix}`);
    this.thresholdValueSpan = this.containerDiv.querySelector(`#thresholdValue-${idSuffix}`);
    this.targetColorInput = this.containerDiv.querySelector(`#targetColor-${idSuffix}`);
    this.smallMergeCountInput = this.containerDiv.querySelector(`#smallMergeCount-${idSuffix}`);
    this.smallMergeCountSpan = this.containerDiv.querySelector(`#smallMergeCountValue-${idSuffix}`);
  }
  renderInitialStructure() {
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
  attachEventListeners() {
    this.mergeBtn.addEventListener("click", () => this.handleMergeSelected());
    this.replaceBtn.addEventListener("click", () => this.handleReplaceColor());
    this.targetColorInput.addEventListener("input", (e) => {
      this.targetReplacementColor = e.target.value;
    });
    this.autoMergeBtn.addEventListener("click", () => this.handleAutoMerge());
    this.mergeSmallBtn.addEventListener("click", () => this.handleMergeSmallCount());
    this.mergeThresholdInput.addEventListener("input", (e) => {
      this.thresholdValueSpan.textContent = e.target.value;
    });
    this.smallMergeCountInput.addEventListener("input", (e) => {
      this.smallMergeCountSpan.textContent = `${e.target.value} pixels`;
    });
    this.containerDiv.querySelectorAll(".sort-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleSort(e.target));
    });
  }
  /**
   * PUBLIC METHOD: Loads a new TypeImage into the internal state and redraws.
   */
  loadImage(image) {
    this.currentImage = image;
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.drawImageToCanvas();
    this.updateMetadata();
  }
  updateMetadata() {
    this.extractPaletteFromCanvas();
    this.updateControlStates();
  }
  /**
   * Updates the disabled state of control buttons based on the current state.
   */
  updateControlStates() {
    const isImageLoaded = this.currentImage !== DEFAULT_EMPTY_ASSET;
  }
  drawImageToCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.currentImage.cimage) {
      this.ctx.drawImage(this.currentImage.cimage, 0, 0);
    }
  }
  /** Extracts the color palette from the current canvas content. */
  extractPaletteFromCanvas() {
    this.drawImageToCanvas();
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.colorPalette = {};
    this.selectedColors.clear();
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a > 0) {
        const hex = "#" + [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
        this.colorPalette[hex] = (this.colorPalette[hex] || 0) + 1;
      }
    }
    this.displayPalette();
  }
  displayPalette() {
    this.grid.innerHTML = "";
    const sortedColors = Object.entries(this.colorPalette);
    if (this.currentSort === "hue" || this.currentSort === "brightness") {
      sortedColors.sort((a, b) => {
        const rgbA = hexToRgb(a[0]);
        const rgbB = hexToRgb(b[0]);
        const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
        const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);
        if (this.currentSort === "hue") {
          return hslA.h - hslB.h || hslB.l - hslA.l;
        } else {
          return hslB.l - hslA.l || hslA.h - hslB.h;
        }
      });
    } else {
      sortedColors.sort((a, b) => b[1] - a[1]);
    }
    sortedColors.forEach(([color, count]) => {
      const colorDiv = document.createElement("div");
      colorDiv.className = "palette-color" + (this.selectedColors.has(color) ? " selected" : "");
      colorDiv.style.backgroundColor = color;
      colorDiv.title = `Count: ${count}
Color: ${color}`;
      colorDiv.dataset.color = color;
      colorDiv.innerHTML = `<span class="count">${count}</span>`;
      colorDiv.addEventListener("click", () => this.handleColorSelection(color, colorDiv));
      this.grid.appendChild(colorDiv);
    });
    this.updateControlStates();
  }
  handleColorSelection(color, colorDiv) {
    if (this.selectedColors.has(color)) {
      this.selectedColors.delete(color);
      colorDiv.classList.remove("selected");
    } else {
      this.selectedColors.add(color);
      colorDiv.classList.add("selected");
    }
    this.updateControlStates();
  }
  handleSort(targetBtn) {
    this.containerDiv.querySelectorAll(".sort-btn").forEach((b) => b.classList.remove("active"));
    targetBtn.classList.add("active");
    this.currentSort = targetBtn.dataset.sort;
    this.displayPalette();
  }
  /** * Mutates the ImageData array, replacing an array of source colors with a single target color.
   * @param {ImageData} imageData - The current image data object to mutate.
   * @param {string} targetColor - The hex color to change all merged colors to.
   * @param {string[]} colorsToMerge - Array of hex colors to replace.
   * @returns {boolean} True if a mutation occurred.
   */
  replaceColorsInImageData(imageData, targetColor, colorsToMerge) {
    const pixels = imageData.data;
    const targetRGB = hexToRgb(targetColor);
    let changed = false;
    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a > 0) {
        const hex = "#" + [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
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
  commitMutation(mutationFn) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (mutationFn(imageData)) {
      this.ctx.putImageData(imageData, 0, 0);
      const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      newOffscreenCanvas.getContext("2d").drawImage(this.canvas, 0, 0);
      this.currentImage = {
        ...this.currentImage,
        cimage: newOffscreenCanvas
      };
      this.extractPaletteFromCanvas();
      this.onChange?.(this.currentImage);
      console.log(`Image modification committed and onChange event triggered`);
    }
  }
  /** * Handles merging of all selected colors into the first selected color.
   */
  handleMergeSelected() {
    if (this.selectedColors.size < 2)
      return;
    const colors = Array.from(this.selectedColors);
    const targetColor = colors[0];
    const colorsToReplace = colors.slice(1);
    this.commitMutation(
      (imageData) => this.replaceColorsInImageData(imageData, targetColor, colorsToReplace)
    );
    this.selectedColors.clear();
    this.updateControlStates();
  }
  /**
   * Replaces the one selected source color with the user-defined target color.
   */
  handleReplaceColor() {
    if (this.selectedColors.size !== 1)
      return;
    const sourceColor = Array.from(this.selectedColors)[0];
    const targetColor = this.targetReplacementColor;
    if (sourceColor === targetColor) {
      console.log("Source and target colors are the same. No replacement needed.");
      return;
    }
    this.commitMutation(
      (imageData) => this.replaceColorsInImageData(imageData, targetColor, [sourceColor])
    );
    this.selectedColors.clear();
    this.updateControlStates();
  }
  /**
   * Handles automatic merging of similar colors based on threshold.
   */
  handleAutoMerge() {
    const threshold = parseInt(this.mergeThresholdInput.value, 10);
    const colors = Object.entries(this.colorPalette).sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    const mergedColors = /* @__PURE__ */ new Set();
    const allColorsToMerge = [];
    for (let i = 0; i < colors.length; i++) {
      const targetColor = colors[i];
      if (mergedColors.has(targetColor))
        continue;
      const mergeGroup = { target: targetColor, sources: [] };
      const targetRGB = hexToRgb(targetColor);
      for (let j = i + 1; j < colors.length; j++) {
        const otherColor = colors[j];
        if (mergedColors.has(otherColor))
          continue;
        const otherRGB = hexToRgb(otherColor);
        if (colorDistance(targetRGB, otherRGB) <= threshold) {
          mergeGroup.sources.push(otherColor);
        }
      }
      if (mergeGroup.sources.length > 0) {
        allColorsToMerge.push(mergeGroup);
      }
      mergedColors.add(targetColor);
      mergeGroup.sources.forEach((c) => mergedColors.add(c));
    }
    if (allColorsToMerge.length > 0) {
      this.commitMutation((imageData) => {
        let changed = false;
        allColorsToMerge.forEach((group) => {
          if (this.replaceColorsInImageData(imageData, group.target, group.sources)) {
            changed = true;
          }
        });
        return changed;
      });
    } else {
      console.log("No colors found within threshold to auto-merge.");
    }
  }
  /**
   * NEW FEATURE: Merges colors with a count <= the specified maximum into the closest, most frequent color.
   */
  handleMergeSmallCount() {
    const maxCount = parseInt(this.smallMergeCountInput.value, 10);
    if (isNaN(maxCount) || maxCount < 1)
      return;
    const smallCountColors = Object.entries(this.colorPalette).filter(([, count]) => count <= maxCount).map(([hex]) => hex);
    if (smallCountColors.length === 0) {
      console.log(`No colors found with count <= ${maxCount} to merge.`);
      return;
    }
    const largeCountColors = Object.entries(this.colorPalette).filter(([, count]) => count > maxCount).sort((a, b) => b[1] - a[1]).map(([hex]) => ({ hex, rgb: hexToRgb(hex) }));
    if (largeCountColors.length === 0) {
      console.log("Only small count colors remain. Cannot merge.");
      return;
    }
    const replacementMap = {};
    smallCountColors.forEach((sourceHex) => {
      const sourceRGB = hexToRgb(sourceHex);
      let bestTarget = "";
      let minDistance = Infinity;
      for (const target of largeCountColors) {
        const distance = colorDistance(sourceRGB, target.rgb);
        if (distance < minDistance) {
          minDistance = distance;
          bestTarget = target.hex;
        } else if (distance === minDistance && target.hex === largeCountColors[0].hex) {
          bestTarget = target.hex;
        }
      }
      replacementMap[sourceHex] = bestTarget;
    });
    this.commitMutation((imageData) => {
      let changed = false;
      const groupsByTarget = {};
      for (const [source, target] of Object.entries(replacementMap)) {
        if (!groupsByTarget[target])
          groupsByTarget[target] = [];
        groupsByTarget[target].push(source);
      }
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
};
function initializePaletteEditor(container_id = "editor-palette-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const paletteEditorInstance = new ImageEditorColorPaletteModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
    // Start with the example image
  });
  paletteEditorInstance.setHandlers({
    // This handler will be called whenever a color merge/change is committed
    onChange: (image) => {
      if (image) {
        console.log(`[Palette Editor Change] New image version committed`);
      }
    }
  });
  return paletteEditorInstance;
}

// web/jsP/pallet/ImageEditorTransformerModule.ts
var ImageEditorTransformerModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  // Internal canvas and context for COMMITTING changes (hidden)
  canvas;
  ctx;
  // Handlers
  onChange;
  // Transformation state (stored for persistence)
  transformState = {
    x: 0,
    // Translation X (pixels)
    y: 0,
    // Translation Y (pixels)
    scale: 1,
    // Scale factor
    rotation: 0,
    // (Optional) Rotation in degrees
    flipH: false
    // Horizontal flip state (left ↔ right)
  };
  // DOM References (UPDATED for button controls)
  xValueSpan;
  yValueSpan;
  scaleValueSpan;
  flipHBtn;
  mirrorHRightBtn;
  adjustmentsContainer;
  constructor(params) {
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
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
    console.log("Transformer handlers updated.");
    this.containerDiv.innerHTML = this.renderInitialStructure();
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    this.loadImage(this.currentImage);
  }
  // Helper to re-get DOM elements after innerHTML update
  reinitializeDOMReferences() {
    const idSuffix = this.containerDiv.id;
    this.xValueSpan = this.containerDiv.querySelector(`#x-value-${idSuffix}`);
    this.yValueSpan = this.containerDiv.querySelector(`#y-value-${idSuffix}`);
    this.scaleValueSpan = this.containerDiv.querySelector(`#scale-value-${idSuffix}`);
    this.flipHBtn = this.containerDiv.querySelector(`#flipHBtn-${idSuffix}`);
    this.mirrorHRightBtn = this.containerDiv.querySelector(`#mirrorHRightBtn-${idSuffix}`);
    this.adjustmentsContainer = this.containerDiv.querySelector(`#adjustments-container-${idSuffix}`);
    const commitCanvasElement = this.containerDiv.querySelector("#transformer-canvas");
    if (commitCanvasElement) {
      this.canvas = commitCanvasElement;
      this.ctx = commitCanvasElement.getContext("2d", { willReadFrequently: true });
      this.canvas.width = this.currentImage.cimage.width;
      this.canvas.height = this.currentImage.cimage.height;
    }
  }
  /**
   * PUBLIC METHOD: Loads a new TypeImage into the internal state and resets controls.
   */
  loadImage(image) {
    this.currentImage = image;
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.transformState = { x: 0, y: 0, scale: 1, rotation: 0, flipH: false };
    this.updateControlValues();
    this.updateMetadata();
    this.updateControlStates(this.currentImage !== DEFAULT_EMPTY_ASSET);
  }
  /**
   * Updates the text content of the display spans and the appearance of toggle buttons.
   */
  updateControlValues() {
    const { x, y, scale } = this.transformState;
    if (this.xValueSpan)
      this.xValueSpan.textContent = String(x);
    if (this.yValueSpan)
      this.yValueSpan.textContent = String(y);
    if (this.scaleValueSpan)
      this.scaleValueSpan.textContent = scale.toFixed(2);
    this.flipHBtn.classList.toggle("active-transform", this.transformState.flipH);
  }
  updateMetadata() {
  }
  updateControlStates(enabled) {
    this.adjustmentsContainer.classList.toggle("disabled", !enabled);
    this.flipHBtn.disabled = !enabled;
    this.mirrorHRightBtn.disabled = !enabled;
  }
  renderInitialStructure() {
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
                    <button id="flipHBtn-${idSuffix}" class="btn ${this.transformState.flipH ? "active-transform" : ""}">Flip: (Left \u2194 Right)</button>
                    <button id="mirrorHRightBtn-${idSuffix}" class="btn">Mirror: (Left \u2192 Right)</button>
                </div>

            </details></div>
        `;
  }
  attachEventListeners() {
    this.adjustmentsContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target.tagName === "BUTTON" && target.dataset.key && target.dataset.delta) {
        const key = target.dataset.key;
        const delta = parseFloat(target.dataset.delta);
        this.handleAdjustment(key, delta);
      }
    });
    this.flipHBtn.addEventListener("click", () => this.handleFlipH());
    this.mirrorHRightBtn.addEventListener("click", () => this.handleApplyMirrorHRight());
  }
  /**
   * Handles the incremental adjustment of transform properties based on button clicks.
   * Commits the change immediately.
   */
  handleAdjustment(key, delta) {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    const currentValue = this.transformState[key];
    let newValue = currentValue + delta;
    if (key === "x" || key === "y") {
      const max = 128;
      const min = -128;
      newValue = Math.min(Math.max(newValue, min), max);
    } else if (key === "scale") {
      const max = 3;
      const min = 0.1;
      newValue = parseFloat(newValue.toFixed(2));
      newValue = Math.min(Math.max(newValue, min), max);
    }
    if (newValue !== currentValue) {
      this.transformState[key] = newValue;
      this.handleApplyTransform();
    }
  }
  /**
   * Toggles the horizontal flip state and re-renders
   */
  handleFlipH() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.transformState.flipH = !this.transformState.flipH;
    this.updateControlValues();
    this.handleApplyTransform();
    console.log(`Flip H Toggled: ${this.transformState.flipH}`);
  }
  /**
   * Mirrors the left half of the image onto the right half, commits it, and resets transform state.
   */
  handleApplyMirrorHRight() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    const originalCanvas = this.currentImage.cimage;
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    const halfWidth = width / 2;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(
      originalCanvas,
      0,
      0,
      halfWidth,
      height,
      // Source: left half of original image
      0,
      0,
      halfWidth,
      height
      // Destination: left half of commit canvas
    );
    this.ctx.save();
    this.ctx.translate(width, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(
      originalCanvas,
      0,
      0,
      halfWidth,
      height,
      // Source rectangle (left half)
      0,
      0,
      halfWidth,
      height
      // Destination rectangle (this now draws onto the right half of the canvas)
    );
    this.ctx.restore();
    const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    newOffscreenCanvas.getContext("2d").drawImage(this.canvas, 0, 0);
    this.currentImage = {
      ...this.currentImage,
      cimage: newOffscreenCanvas
    };
    this.loadImage(this.currentImage);
    this.onChange?.(this.currentImage);
  }
  /**
   * Applies the stored transformations (move, scale, flipH) to the image's OffscreenCanvas
   * and notifies the parent module. This uses the hidden 'commit' canvas.
   */
  handleApplyTransform() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    const { x, y, scale, flipH } = this.transformState;
    const originalCanvas = this.currentImage.cimage;
    const width = originalCanvas.width;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    if (flipH) {
      this.ctx.scale(scale, scale);
      this.ctx.translate(width, 0);
      this.ctx.scale(-1, 1);
      const drawX = x / scale;
      const drawY = y / scale;
      this.ctx.drawImage(
        originalCanvas,
        drawX,
        drawY,
        originalCanvas.width,
        originalCanvas.height
      );
    } else {
      this.ctx.scale(scale, scale);
      const drawX = x / scale;
      const drawY = y / scale;
      this.ctx.drawImage(
        originalCanvas,
        drawX,
        drawY,
        originalCanvas.width,
        originalCanvas.height
      );
    }
    this.ctx.restore();
    const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    newOffscreenCanvas.getContext("2d").drawImage(this.canvas, 0, 0);
    this.currentImage = {
      ...this.currentImage,
      cimage: newOffscreenCanvas
    };
    this.updateControlValues();
    this.onChange?.(this.currentImage);
  }
};
function initializeTransformerEditor(container_id = "editor-transformer-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const transformerInstance = new ImageEditorTransformerModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
    // Start with the example image
    // This handler will be called whenever a transform is applied
  });
  transformerInstance.setHandlers({
    onChange: (image) => {
      if (image) {
      }
    }
  });
  return transformerInstance;
}

// web/jsP/pallet/ImageEditorColorModule.ts
function rgbToHsl2(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
var ImageEditorColorModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  // Internal canvas and context for COMMITTING changes (hidden)
  canvas;
  ctx;
  // Handlers
  onChange;
  // Color transformation state
  colorState = {
    hue: 0,
    // 0-360 degrees
    saturation: 100,
    // 0-200 percentage (100 is default)
    contrast: 100,
    // 0-200 percentage (100 is default)
    brightness: 100,
    // <--- ADDED: 0-200 percentage (100 is default)
    invert: false,
    // boolean
    grayscale: false
    // boolean (simplified equalizer)
  };
  // DOM References (UPDATED)
  hueAvgSpan;
  saturationAvgSpan;
  contrastAvgSpan;
  brightnessAvgSpan;
  // <--- ADDED
  invertBtn;
  grayscaleBtn;
  removeAlphaBtn;
  // NEW
  adjustmentsContainer;
  constructor(params) {
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
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
    console.log("Transformer handlers updated.");
    this.containerDiv.innerHTML = this.renderInitialStructure();
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    this.loadImage(this.currentImage);
  }
  /**
   * PUBLIC METHOD: Loads a new TypeImage into the internal state and resets controls.
   */
  loadImage(image) {
    this.currentImage = image;
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.colorState = {
      hue: 0,
      saturation: 100,
      contrast: 100,
      brightness: 100,
      // <--- ADDED RESET
      invert: false,
      grayscale: false
    };
    this.updateControlValues();
    this.updateMetadata();
    this.updateAverageHSLDisplay();
  }
  /**
   * Calculates the average Hue, Saturation, and Luminosity of all opaque pixels.
   * @returns An HSL object with average values.
   */
  calculateAverageHSL() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET) {
      return { h: 0, s: 0, l: 0 };
    }
    const canvas = this.currentImage.cimage;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx)
      return { h: 0, s: 0, l: 0 };
    tempCtx.drawImage(canvas, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let totalH = 0;
    let totalS = 0;
    let totalL = 0;
    let opaquePixelCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const hsl = rgbToHsl2(r, g, b);
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
    return { h: avgH % 360, s: avgS, l: avgL };
  }
  updateControlValues() {
    this.invertBtn.classList.toggle("active-transform", this.colorState.invert);
    this.grayscaleBtn.classList.toggle("active-transform", this.colorState.grayscale);
  }
  /**
   * Updates the DOM to show the calculated average HSL/Luminosity values.
   */
  updateAverageHSLDisplay() {
    const avgHSL = this.calculateAverageHSL();
    if (this.hueAvgSpan) {
      this.hueAvgSpan.textContent = `${avgHSL.h}\xB0 (Avg Hue)`;
    }
    if (this.saturationAvgSpan) {
      this.saturationAvgSpan.textContent = `${avgHSL.s}% (Avg Sat)`;
    }
    if (this.contrastAvgSpan) {
      this.contrastAvgSpan.textContent = `${avgHSL.l}% (Avg Lum)`;
    }
    if (this.brightnessAvgSpan) {
      this.brightnessAvgSpan.textContent = `${this.colorState.brightness}% (Current)`;
    }
  }
  updateMetadata() {
  }
  renderInitialStructure() {
    const idSuffix = this.containerDiv.id;
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
                            <span id="hue-avg-value-${idSuffix}" class="value-display">${this.colorState.hue}\xB0 (Avg Hue)</span>
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
  reinitializeDOMReferences() {
    const idSuffix = this.containerDiv.id;
    this.hueAvgSpan = this.containerDiv.querySelector(`#hue-avg-value-${idSuffix}`);
    this.saturationAvgSpan = this.containerDiv.querySelector(`#saturation-avg-value-${idSuffix}`);
    this.contrastAvgSpan = this.containerDiv.querySelector(`#contrast-avg-value-${idSuffix}`);
    this.brightnessAvgSpan = this.containerDiv.querySelector(`#brightness-avg-value-${idSuffix}`);
    this.invertBtn = this.containerDiv.querySelector(`#invertBtn-${idSuffix}`);
    this.grayscaleBtn = this.containerDiv.querySelector(`#grayscaleBtn-${idSuffix}`);
    this.removeAlphaBtn = this.containerDiv.querySelector(`#removeAlphaBtn-${idSuffix}`);
    this.adjustmentsContainer = this.containerDiv.querySelector(`#adjustments-container-${idSuffix}`);
    const commitCanvasElement = this.containerDiv.querySelector("#color-canvas");
    if (commitCanvasElement) {
      this.canvas = commitCanvasElement;
      this.ctx = commitCanvasElement.getContext("2d", { willReadFrequently: true });
      this.canvas.width = this.currentImage.cimage.width;
      this.canvas.height = this.currentImage.cimage.height;
    }
  }
  attachEventListeners() {
    this.adjustmentsContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target.tagName === "BUTTON" && target.dataset.key && target.dataset.delta) {
        const key = target.dataset.key;
        const delta = parseInt(target.dataset.delta, 10);
        this.handleAdjustment(key, delta);
      }
    });
    this.invertBtn.addEventListener("click", () => this.handleInvert());
    this.grayscaleBtn.addEventListener("click", () => this.handleGrayscale());
    this.removeAlphaBtn.addEventListener("click", () => this.handleRemoveAlpha());
  }
  /**
   * Handles the incremental adjustment of color properties based on button clicks.
   * Commits the change immediately.
   */
  handleAdjustment(key, delta) {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    const currentValue = this.colorState[key];
    let newValue = currentValue + delta;
    let min;
    let max;
    if (key === "hue") {
      min = 0;
      max = 360;
      if (newValue > max) {
        newValue -= max;
      } else if (newValue < min) {
        newValue += max;
      }
    } else {
      min = 0;
      max = 200;
      newValue = Math.min(Math.max(newValue, min), max);
    }
    if (newValue !== currentValue) {
      this.colorState[key] = newValue;
      this.handleColorTransformCommit();
    }
  }
  handleInvert() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.colorState.invert = !this.colorState.invert;
    this.updateControlValues();
    this.handleColorTransformCommit();
  }
  handleGrayscale() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.colorState.grayscale = !this.colorState.grayscale;
    this.updateControlValues();
    this.handleColorTransformCommit();
  }
  /**
   * Sets the alpha channel to 255 (opaque) for any pixel that is not fully transparent (alpha > 0).
   */
  handleRemoveAlpha() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    const originalCanvas = this.currentImage.cimage;
    const tempCanvas = new OffscreenCanvas(originalCanvas.width, originalCanvas.height);
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
    if (!tempCtx)
      return;
    tempCtx.drawImage(originalCanvas, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    let changed = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0 && data[i] < 255) {
        data[i] = 255;
        changed = true;
      }
    }
    if (changed) {
      tempCtx.putImageData(imageData, 0, 0);
      const newOffscreenCanvas = new OffscreenCanvas(tempCanvas.width, tempCanvas.height);
      newOffscreenCanvas.getContext("2d").drawImage(tempCanvas, 0, 0);
      this.currentImage = {
        ...this.currentImage,
        cimage: newOffscreenCanvas
      };
      this.loadImage(this.currentImage);
      this.onChange?.(this.currentImage);
      console.log(`Image alpha color fixed (set opaque)`);
    } else {
      console.log(`Image already fully opaque or transparent. No change.`);
    }
  }
  /**
   * Constructs the CSS filter string based on the current colorState.
   */
  buildFilterString() {
    const { hue, saturation, contrast, brightness, invert, grayscale } = this.colorState;
    let filter = "";
    if (hue !== 0)
      filter += `hue-rotate(${hue}deg) `;
    if (saturation !== 100)
      filter += `saturate(${saturation}%) `;
    if (contrast !== 100)
      filter += `contrast(${contrast}%) `;
    if (brightness !== 100)
      filter += `brightness(${brightness}%) `;
    if (invert)
      filter += `invert(100%) `;
    if (grayscale)
      filter += `grayscale(100%) `;
    return filter.trim();
  }
  /**
   * Applies the stored color transformations to the image's OffscreenCanvas
   * and notifies the parent module. This uses the hidden 'commit' canvas.
   */
  handleColorTransformCommit() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    const originalCanvas = this.currentImage.cimage;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = this.buildFilterString();
    this.ctx.drawImage(
      originalCanvas,
      0,
      0,
      originalCanvas.width,
      originalCanvas.height
    );
    this.ctx.filter = "none";
    const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    newOffscreenCanvas.getContext("2d").drawImage(this.canvas, 0, 0);
    this.currentImage = {
      ...this.currentImage,
      cimage: newOffscreenCanvas
    };
    this.loadImage(this.currentImage);
    this.onChange?.(this.currentImage);
    console.log(`Image color transform committed`);
  }
};
function initializeColorEditor(container_id = "image-color-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const colorTransformerInstance = new ImageEditorColorModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
    // Start with the example image
  });
  colorTransformerInstance.setHandlers({
    // This handler will be called whenever a transform is applied
    onChange: (image) => {
      if (image) {
        console.log(`[Color Change] New image version committed.`);
      }
    }
  });
  return colorTransformerInstance;
}

// web/jsP/pallet/ImageEditorOutlineModule.ts
function hexToRgb2(hex) {
  const normalizedHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(normalizedHex.substring(0, 2), 16);
  const g = parseInt(normalizedHex.substring(2, 4), 16);
  const b = parseInt(normalizedHex.substring(4, 6), 16);
  return { r, g, b, a: 255 };
}
function colorDistance2(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2)
  );
}
function getPixelRgba(data, index) {
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3]
  };
}
function setPixelRgba(data, index, color) {
  data[index] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}
var ImageEditorOutlineModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  canvas;
  ctx;
  onChange;
  // State for various sections (Thickness is implicitly 1)
  removeEdgeState = {
    color: "#000000",
    tolerance: 10,
    thickness: 1
    // Fixed at 1
  };
  addEdgeState = {
    color: "#ff0000",
    thickness: 1
    // Fixed at 1
  };
  // DOM References
  removeColorInput;
  removeToleranceInput;
  removeBtn;
  addColorInput;
  addBtn;
  constructor(params) {
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
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
    console.log("Transformer handlers updated.");
    this.containerDiv.innerHTML = this.renderInitialStructure();
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    this.loadImage(this.currentImage);
  }
  reinitializeDOMReferences() {
    this.canvas = this.containerDiv.querySelector("#outline-canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    const idSuffix = this.containerDiv.id;
    this.removeColorInput = this.containerDiv.querySelector(`#removeColor-${idSuffix}`);
    this.removeToleranceInput = this.containerDiv.querySelector(`#removeTolerance-${idSuffix}`);
    this.removeBtn = this.containerDiv.querySelector(`#removeEdgeBtn-${idSuffix}`);
    this.addColorInput = this.containerDiv.querySelector(`#addColor-${idSuffix}`);
    this.addBtn = this.containerDiv.querySelector(`#addEdgeBtn-${idSuffix}`);
  }
  renderInitialStructure() {
    const idSuffix = this.containerDiv.id;
    return `
            <style>
                .control-section { margin-bottom: 20px; padding: 10px; border: 1px solid #34495e; border-radius: 4px; }
                .section-header { font-weight: bold; margin-bottom: 10px; color: #e67e22; }
                .control-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
                .control-row label { width: 140px; font-size: 0.9em; }
                .control-row input[type="range"], .control-row input[type="number"] { flex-grow: 1; }
                .control-row input[type="color"] { width: 40px; height: 25px; padding: 0; border: none; cursor: pointer; }
                .control-row .value-span { width: 50px; text-align: right; font-weight: bold; }

                .apply-button-container { margin-top: 10px; }
                .apply-button-container button {
                    width: 100%;
                    padding: 8px;
                    background-color: #2ecc71;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.1s;
                }
                .apply-button-container button:hover:not(:disabled) { background-color: #27ae60; }
                .apply-button-container button:disabled { background-color: #bdc3c7; cursor: not-allowed; }
                
                #outline-canvas { display:none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Edge Manipulation Tools</summary>

                
                <canvas id="outline-canvas"></canvas>

                <div class="control-section">
                    <div class="section-header">1. Remove Edge (Anti-Outline, 1px)</div>
                    <div class="control-row">
                        <label for="removeColor-${idSuffix}">Outline Color:</label>
                        <input type="color" id="removeColor-${idSuffix}" value="${this.removeEdgeState.color}">
                    </div>
                    <div class="control-row">
                        <label>Tolerance (Color Match):</label>
                        <input type="range" id="removeTolerance-${idSuffix}" min="0" max="50" step="1" value="${this.removeEdgeState.tolerance}">
                        <span id="removeToleranceValue-${idSuffix}" class="value-span">${this.removeEdgeState.tolerance}</span>
                    </div>
                    <div class="apply-button-container">
                        <button id="removeEdgeBtn-${idSuffix}" disabled>Remove 1px Edges</button>
                    </div>
                </div>

                <div class="control-section">
                    <div class="section-header">2. Add Edge (External Outline, 1px)</div>
                    <div class="control-row">
                        <label for="addColor-${idSuffix}">New Edge Color:</label>
                        <input type="color" id="addColor-${idSuffix}" value="${this.addEdgeState.color}">
                    </div>
                    <div class="apply-button-container">
                        <button id="addEdgeBtn-${idSuffix}" disabled>Add 1px External Edge</button>
                    </div>
                </details></div>
            </div>
        `;
  }
  attachEventListeners() {
    const setupInput = (input, stateKey, stateObject, valueSpan) => {
      const update = () => {
        const value = parseInt(input.value, 10);
        stateObject[stateKey] = value;
        valueSpan.textContent = String(value);
      };
      input.addEventListener("input", update);
      update();
    };
    this.removeColorInput.addEventListener("input", (e) => this.removeEdgeState.color = e.target.value);
    setupInput(this.removeToleranceInput, "tolerance", this.removeEdgeState, this.containerDiv.querySelector(`#removeToleranceValue-${this.containerDiv.id}`));
    this.removeBtn.addEventListener("click", () => this.handleRemoveEdge());
    this.addColorInput.addEventListener("input", (e) => this.addEdgeState.color = e.target.value);
    this.addBtn.addEventListener("click", () => this.handleAddEdge());
  }
  // =========================================================================
  // === CORE FRAMEWORK METHODS ===
  // =========================================================================
  loadImage(image) {
    this.currentImage = image;
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.drawImageToCanvas(image.cimage);
    this.updateMetadata();
  }
  updateMetadata() {
    this.updateControlStates(this.currentImage !== DEFAULT_EMPTY_ASSET);
  }
  updateControlStates(enabled) {
    this.removeBtn.disabled = !enabled;
    this.addBtn.disabled = !enabled;
  }
  drawImageToCanvas(source) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (source) {
      this.ctx.drawImage(source, 0, 0);
    }
  }
  /** * Applies a mutation function to a copy of the current image's pixel data.
   * The mutationFn modifies the ImageData in place and returns true if changes were made.
   * * @param mutationFn A function that modifies the passed ImageData and returns boolean (true if changed).
   */
  commitMutation(mutationFn) {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.drawImageToCanvas(this.currentImage.cimage);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (mutationFn(imageData)) {
      this.ctx.putImageData(imageData, 0, 0);
      const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      newOffscreenCanvas.getContext("2d").drawImage(this.canvas, 0, 0);
      this.currentImage = {
        ...this.currentImage,
        cimage: newOffscreenCanvas
      };
      this.onChange?.(this.currentImage);
    } else {
      console.log("Mutation function returned false. No changes committed.");
    }
  }
  // =========================================================================
  // === 1. REMOVE EDGE LOGIC (FIXED: Applies only to 1px outline) ===
  // =========================================================================
  handleRemoveEdge() {
    this.commitMutation((imageData) => {
      const { width, height, data: originalData } = imageData;
      const colorToRemove = hexToRgb2(this.removeEdgeState.color);
      const tolerance = this.removeEdgeState.tolerance;
      const thickness = 1;
      let changed = false;
      const sourceData = new Uint8ClampedArray(originalData);
      const updates = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex4D = (y * width + x) * 4;
          const currentPixel = getPixelRgba(sourceData, pixelIndex4D);
          if (currentPixel.a === 0)
            continue;
          if (colorDistance2(currentPixel, colorToRemove) <= tolerance) {
            let isEdgePixel = false;
            let bestReplacementColor = null;
            let minDistance = Infinity;
            for (let dy = -thickness; dy <= thickness; dy++) {
              for (let dx = -thickness; dx <= thickness; dx++) {
                if (dx === 0 && dy === 0)
                  continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const ni4D = (ny * width + nx) * 4;
                  const neighbor = getPixelRgba(sourceData, ni4D);
                  if (neighbor.a === 0) {
                    isEdgePixel = true;
                  }
                  if (neighbor.a > 0 && colorDistance2(neighbor, colorToRemove) > tolerance) {
                    const distToSource = colorDistance2(currentPixel, neighbor);
                    if (distToSource < minDistance) {
                      minDistance = distToSource;
                      bestReplacementColor = neighbor;
                    }
                  }
                }
              }
            }
            if (isEdgePixel) {
              if (bestReplacementColor) {
                updates.push({ index: pixelIndex4D, color: bestReplacementColor });
              } else {
                updates.push({ index: pixelIndex4D, color: { r: 0, g: 0, b: 0, a: 0 } });
              }
            }
          }
        }
      }
      if (updates.length > 0) {
        updates.forEach(({ index, color }) => {
          setPixelRgba(originalData, index, color);
        });
        changed = true;
      }
      return changed;
    });
  }
  // =========================================================================
  // === 2. ADD EDGE LOGIC (Thickness fixed to 1) ===
  // =========================================================================
  handleAddEdge() {
    this.commitMutation((imageData) => {
      const { width, height, data: originalData } = imageData;
      const edgeColor = hexToRgb2(this.addEdgeState.color);
      const thickness = 1;
      let changed = false;
      const sourceData = new Uint8ClampedArray(originalData);
      const updates = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex4D = (y * width + x) * 4;
          const currentPixel = getPixelRgba(sourceData, pixelIndex4D);
          if (currentPixel.a === 0) {
            let hasSolidNeighbor = false;
            for (let dy = -thickness; dy <= thickness; dy++) {
              for (let dx = -thickness; dx <= thickness; dx++) {
                if (dx === 0 && dy === 0)
                  continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const ni4D = (ny * width + nx) * 4;
                  const neighbor = getPixelRgba(sourceData, ni4D);
                  if (neighbor.a > 0) {
                    hasSolidNeighbor = true;
                    break;
                  }
                }
              }
              if (hasSolidNeighbor)
                break;
            }
            if (hasSolidNeighbor) {
              updates.push({ index: pixelIndex4D, color: edgeColor });
            }
          }
        }
      }
      if (updates.length > 0) {
        updates.forEach(({ index, color }) => {
          setPixelRgba(originalData, index, color);
        });
        changed = true;
      }
      return changed;
    });
  }
};
function initializeOutlineEditor(container_id = "editor-outline-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const outlineEditorInstance = new ImageEditorOutlineModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
  });
  outlineEditorInstance.setHandlers({
    onChange: (image) => {
      if (image) {
        console.log(`[Outline Editor Change] New image version committed. `);
      }
    }
  });
  return outlineEditorInstance;
}

// web/jsP/pallet/ImageEditorPixelArtLineModule.ts
function setPixelRgba2(data, index, color) {
  data[index] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}
function hexToRgba(hex) {
  const normalizedHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(normalizedHex.substring(0, 2), 16);
  const g = parseInt(normalizedHex.substring(2, 4), 16);
  const b = parseInt(normalizedHex.substring(4, 6), 16);
  return { r, g, b, a: 255 };
}
var ImageEditorPixelArtLineModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  canvas;
  ctx;
  onChange;
  // State for refinement settings
  refinementState = {
    edgeFillColorHex: "#000000"
    // NEW: Default fill color: Black
  };
  // DOM References
  sharpenBtn;
  edgeFillColorPicker;
  // NEW: Color picker DOM element
  constructor(params) {
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
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
    console.log("Transformer handlers updated.");
    this.containerDiv.innerHTML = this.renderInitialStructure();
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    this.loadImage(this.currentImage);
  }
  reinitializeDOMReferences() {
    this.canvas = this.containerDiv.querySelector("#line-canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    const idSuffix = this.containerDiv.id;
    this.sharpenBtn = this.containerDiv.querySelector(`#sharpenLineBtn-${idSuffix}`);
    this.edgeFillColorPicker = this.containerDiv.querySelector(`#edgeFillColorPicker-${idSuffix}`);
    this.edgeFillColorPicker.value = this.refinementState.edgeFillColorHex;
  }
  renderInitialStructure() {
    const idSuffix = this.containerDiv.id;
    return `
            <style>
                .control-section { margin-bottom: 20px; padding: 10px; border: 1px solid #34495e; border-radius: 4px; }
                .section-header { font-weight: bold; margin-bottom: 10px; color: #e67e22; }
                .control-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; justify-content: space-between; }
                
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
                
                #line-canvas { display:none; }
            </style>
            
            <div class="module-card"><details>
                <summary class="module-group-title">Pixel Art Line Refinement</summary>
                
                <canvas id="line-canvas"></canvas>

                <div class="control-section">
                    <div class="section-header">1. Two-Pass Isometric Edge Reconstruction (30\xB0/60\xB0 Priority)</div>
                    <div class="apply-button-container">
                        <button id="sharpenLineBtn-${idSuffix}" disabled>Run Two-Pass Edge Cleaning</button>
                    </div>
                </div>

                <div class="control-section">
                    <div class="section-header">2. Edge Gap Reconstruction Color</div>
                    <p>Select the color to use when filling 1-pixel gaps in 30\xB0/60\xB0 lines during the second pass.</p>
                    <div class="control-row">
                        <label for="edgeFillColorPicker-${idSuffix}">Fill Color:</label>
                        <input type="color" id="edgeFillColorPicker-${idSuffix}" value="${this.refinementState.edgeFillColorHex}" style="width: 50px;">
                    </div>
                </div>
                
            </details></div>
        `;
  }
  attachEventListeners() {
    this.sharpenBtn.addEventListener("click", () => this.handleLineSharpen());
    this.edgeFillColorPicker.addEventListener("change", (e) => {
      this.refinementState.edgeFillColorHex = e.target.value;
      console.log(`Edge Fill Color set to: ${this.refinementState.edgeFillColorHex}`);
    });
  }
  // =========================================================================
  // === CORE FRAMEWORK METHODS ===
  // =========================================================================
  loadImage(image) {
    this.currentImage = image;
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.drawImageToCanvas(image.cimage);
    this.updateMetadata();
  }
  updateMetadata() {
    this.updateControlStates(this.currentImage !== DEFAULT_EMPTY_ASSET);
  }
  updateControlStates(enabled) {
    this.sharpenBtn.disabled = !enabled;
  }
  drawImageToCanvas(source) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (source) {
      this.ctx.drawImage(source, 0, 0);
    }
  }
  /** * Applies a mutation function to a copy of the current image's pixel data. */
  commitMutation(mutationFn) {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.drawImageToCanvas(this.currentImage.cimage);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (mutationFn(imageData)) {
      this.ctx.putImageData(imageData, 0, 0);
      const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      newOffscreenCanvas.getContext("2d").drawImage(this.canvas, 0, 0);
      this.currentImage = {
        ...this.currentImage,
        cimage: newOffscreenCanvas
      };
      this.onChange?.(this.currentImage);
      console.log(`Line cleaning committed`);
    } else {
      console.log("No line cleaning changes committed.");
    }
  }
  // =========================================================================
  // === 1. ISOMETRIC EDGE CLEANING CORE LOGIC (Two-Pass) ===
  // =========================================================================
  // Defines neighbor positions in a 3x3 kernel
  NEIGHBORS = [
    { dx: 0, dy: -1, type: "O" },
    // N (0)
    { dx: 0, dy: 1, type: "O" },
    // S (1)
    { dx: 1, dy: 0, type: "O" },
    // E (2)
    { dx: -1, dy: 0, type: "O" },
    // W (3)
    { dx: -1, dy: -1, type: "D" },
    // TL (4)
    { dx: 1, dy: -1, type: "D" },
    // TR (5)
    { dx: -1, dy: 1, type: "D" },
    // BL (6)
    { dx: 1, dy: 1, type: "D" }
    // BR (7)
  ];
  /**
   * Structural pairs defining 0, 90, 30, and 60 degree line segments.
   * These patterns are used for both PRESERVATION (Pass 1) and RECONSTRUCTION (Pass 2).
   */
  ISOMETRIC_LINE_PAIRS = [
    // 0 / 90 degrees (Orthogonal)
    [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }],
    // Horizontal (W-E)
    [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }],
    // Vertical (N-S)
    // 30 degrees (1:2 slope - shallow isometric, all 4 quadrants)
    [{ dx: -1, dy: 0 }, { dx: 1, dy: 1 }],
    // W to BR (1:2 Positive)
    [{ dx: 1, dy: 0 }, { dx: -1, dy: -1 }],
    // E to TL (1:2 Positive Reverse)
    [{ dx: -1, dy: 0 }, { dx: 1, dy: -1 }],
    // W to TR (1:2 Negative)
    [{ dx: 1, dy: 0 }, { dx: -1, dy: 1 }],
    // E to BL (1:2 Negative Reverse)
    // 60 degrees (2:1 slope - steep isometric, all 4 quadrants)
    [{ dx: 0, dy: -1 }, { dx: 1, dy: 1 }],
    // N to BR (2:1 Positive)
    [{ dx: 0, dy: 1 }, { dx: -1, dy: -1 }],
    // S to TL (2:1 Positive Reverse)
    [{ dx: 0, dy: -1 }, { dx: -1, dy: 1 }],
    // N to BL (2:1 Negative)
    [{ dx: 0, dy: 1 }, { dx: 1, dy: -1 }]
    // S to TR (2:1 Negative Reverse)
  ];
  handleLineSharpen() {
    this.commitMutation((imageData) => {
      const { width, height, data: originalData } = imageData;
      let changed = false;
      const checkNeighborOpaque = (data, nx, ny) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          return false;
        }
        const ni4D = (ny * width + nx) * 4;
        return data[ni4D + 3] > 0;
      };
      const sourceDataPass1 = new Uint8ClampedArray(originalData);
      const updatesToRemove = /* @__PURE__ */ new Set();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex4D = (y * width + x) * 4;
          if (!checkNeighborOpaque(sourceDataPass1, x, y)) {
            continue;
          }
          let solidNeighborCount = 0;
          let solidDiagonalNeighbors = 0;
          let hasTransparentNeighbor = false;
          for (const { dx, dy, type } of this.NEIGHBORS) {
            const isOpaque = checkNeighborOpaque(sourceDataPass1, x + dx, y + dy);
            if (isOpaque) {
              solidNeighborCount++;
              if (type === "D") {
                solidDiagonalNeighbors++;
              }
            } else {
              hasTransparentNeighbor = true;
            }
          }
          if (!hasTransparentNeighbor) {
            continue;
          }
          let isStructural = false;
          for (const [p1, p2] of this.ISOMETRIC_LINE_PAIRS) {
            const isP1Opaque = checkNeighborOpaque(sourceDataPass1, x + p1.dx, y + p1.dy);
            const isP2Opaque = checkNeighborOpaque(sourceDataPass1, x + p2.dx, y + p2.dy);
            if (isP1Opaque && isP2Opaque) {
              isStructural = true;
              break;
            }
          }
          if (isStructural) {
            continue;
          }
          if (solidNeighborCount <= 2) {
            updatesToRemove.add(pixelIndex4D);
            continue;
          }
          if (solidNeighborCount === 4 && solidDiagonalNeighbors === 4) {
            updatesToRemove.add(pixelIndex4D);
            continue;
          }
        }
      }
      if (updatesToRemove.size > 0) {
        const transparentColor = { r: 0, g: 0, b: 0, a: 0 };
        updatesToRemove.forEach((index) => {
          setPixelRgba2(originalData, index, transparentColor);
        });
        changed = true;
      }
      const sourceDataPass2 = new Uint8ClampedArray(originalData);
      const updatesToFill = /* @__PURE__ */ new Set();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (checkNeighborOpaque(sourceDataPass2, x, y)) {
            continue;
          }
          let shouldFill = false;
          for (const [p1, p2] of this.ISOMETRIC_LINE_PAIRS) {
            const isP1Opaque = checkNeighborOpaque(sourceDataPass2, x + p1.dx, y + p1.dy);
            const isP2Opaque = checkNeighborOpaque(sourceDataPass2, x + p2.dx, y + p2.dy);
            if (isP1Opaque && isP2Opaque) {
              shouldFill = true;
              break;
            }
          }
          if (shouldFill) {
            updatesToFill.add((y * width + x) * 4);
          }
        }
      }
      if (updatesToFill.size > 0) {
        const fillRgba = hexToRgba(this.refinementState.edgeFillColorHex);
        updatesToFill.forEach((index) => {
          setPixelRgba2(originalData, index, fillRgba);
        });
        changed = true;
      }
      return changed;
    });
  }
};
function initializeLineEditor(container_id = "editor-line-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const lineEditorInstance = new ImageEditorPixelArtLineModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
  });
  lineEditorInstance.setHandlers({
    onChange: (_) => {
    }
  });
  return lineEditorInstance;
}

// web/jsP/pallet/ImageEditorPixelArtOutlineModule.ts
function isSameColor(rgb1, rgb2) {
  return rgb1.r === rgb2.r && rgb1.g === rgb2.g && rgb1.b === rgb2.b && rgb1.a === rgb2.a;
}
function getColorLuminance(rgb) {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}
function getPixelRgba2(data, index) {
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3]
  };
}
function setPixelRgba3(data, index, color) {
  data[index] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}
var ImageEditorPixelArtOutlineModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  canvas;
  ctx;
  onChange;
  // State for the color priority (dark or light)
  smoothingState = {
    priority: "dark"
  };
  // DOM References
  darkPrioCheckbox;
  lightPrioCheckbox;
  smoothBtn;
  constructor(params) {
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
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
    console.log("Transformer handlers updated.");
    this.containerDiv.innerHTML = this.renderInitialStructure();
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    this.loadImage(this.currentImage);
  }
  reinitializeDOMReferences() {
    this.canvas = this.containerDiv.querySelector("#color-line-canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    const idSuffix = this.containerDiv.id;
    this.smoothBtn = this.containerDiv.querySelector(`#smoothColorLineBtn-${idSuffix}`);
    this.darkPrioCheckbox = this.containerDiv.querySelector(`#darkPrio-${idSuffix}`);
    this.lightPrioCheckbox = this.containerDiv.querySelector(`#lightPrio-${idSuffix}`);
    if (this.smoothingState.priority === "dark") {
      this.darkPrioCheckbox.checked = true;
    } else {
      this.lightPrioCheckbox.checked = true;
    }
  }
  renderInitialStructure() {
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
                            <input type="radio" name="colorPrio-${idSuffix}" id="darkPrio-${idSuffix}" value="dark" ${this.smoothingState.priority === "dark" ? "checked" : ""}> 
                            Prioritize Darkest Line Color
                        </label>
                        <label>
                            <input type="radio" name="colorPrio-${idSuffix}" id="lightPrio-${idSuffix}" value="light" ${this.smoothingState.priority === "light" ? "checked" : ""}> 
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
  attachEventListeners() {
    this.smoothBtn.addEventListener("click", () => this.handleColorLineSmoothing());
    const idSuffix = this.containerDiv.id;
    const radioGroup = this.containerDiv.querySelectorAll(`input[name="colorPrio-${idSuffix}"]`);
    radioGroup.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.smoothingState.priority = e.target.value;
        console.log(`Priority set to: ${this.smoothingState.priority}`);
      });
    });
  }
  // =========================================================================
  // === CORE FRAMEWORK METHODS ===
  // =========================================================================
  loadImage(image) {
    this.currentImage = image;
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.drawImageToCanvas(image.cimage);
    this.updateMetadata();
  }
  updateMetadata() {
    this.updateControlStates(this.currentImage !== DEFAULT_EMPTY_ASSET);
  }
  updateControlStates(enabled) {
    this.smoothBtn.disabled = !enabled;
  }
  drawImageToCanvas(source) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (source) {
      this.ctx.drawImage(source, 0, 0);
    }
  }
  /** * Applies a mutation function to a copy of the current image's pixel data. */
  commitMutation(mutationFn) {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.drawImageToCanvas(this.currentImage.cimage);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (mutationFn(imageData)) {
      this.ctx.putImageData(imageData, 0, 0);
      const newOffscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      newOffscreenCanvas.getContext("2d").drawImage(this.canvas, 0, 0);
      this.currentImage = {
        ...this.currentImage,
        cimage: newOffscreenCanvas
      };
      this.onChange?.(this.currentImage);
      console.log(`Color line smoothing committed`);
    } else {
      console.log("No color line smoothing changes committed.");
    }
  }
  // =========================================================================
  // === 1. ISOMETRIC COLOR BOUNDARY SMOOTHING LOGIC (Single-Pass) ===
  // =========================================================================
  /**
   * Defines all 8 neighbor positions in a 3x3 kernel.
   */
  NEIGHBORS_3X3 = (() => {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0)
          continue;
        neighbors.push({ dx, dy });
      }
    }
    return neighbors;
  })();
  /**
   * Structural pairs defining 0/90 (orthogonal) and 30/60 (isometric) line segments.
   */
  LINE_SEGMENTS = [
    // 0 / 90 degrees (Orthogonal - Type 'O')
    { pair: [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }], type: "O" },
    // Horizontal (W-E)
    { pair: [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }], type: "O" },
    // Vertical (N-S)
    // 30 degrees (1:2 slope - Type 'I')
    { pair: [{ dx: -1, dy: 0 }, { dx: 1, dy: 1 }], type: "I" },
    // W to BR (1:2 Positive)
    { pair: [{ dx: 1, dy: 0 }, { dx: -1, dy: -1 }], type: "I" },
    // E to TL (1:2 Positive Reverse)
    { pair: [{ dx: -1, dy: 0 }, { dx: 1, dy: -1 }], type: "I" },
    // W to TR (1:2 Negative)
    { pair: [{ dx: 1, dy: 0 }, { dx: -1, dy: 1 }], type: "I" },
    // E to BL (1:2 Negative Reverse)
    // 60 degrees (2:1 slope - Type 'I')
    { pair: [{ dx: 0, dy: -1 }, { dx: 1, dy: 1 }], type: "I" },
    // N to BR (2:1 Positive)
    { pair: [{ dx: 0, dy: 1 }, { dx: -1, dy: -1 }], type: "I" },
    // S to TL (2:1 Positive Reverse)
    { pair: [{ dx: 0, dy: -1 }, { dx: -1, dy: 1 }], type: "I" },
    // N to BL (2:1 Negative)
    { pair: [{ dx: 0, dy: 1 }, { dx: 1, dy: -1 }], type: "I" }
    // S to TR (2:1 Negative Reverse)
  ];
  handleColorLineSmoothing() {
    this.commitMutation((imageData) => {
      const { width, height, data: originalData } = imageData;
      const priority = this.smoothingState.priority;
      let changed = false;
      const sourceData = new Uint8ClampedArray(originalData);
      const updatesToChangeColor = /* @__PURE__ */ new Map();
      const checkNeighborOpaque = (data, nx, ny) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          return false;
        }
        const ni4D = (ny * width + nx) * 4;
        return data[ni4D + 3] > 0;
      };
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const pixelIndex4D = (y * width + x) * 4;
          const currentPixel = getPixelRgba2(sourceData, pixelIndex4D);
          if (currentPixel.a === 0)
            continue;
          let isColorBoundary = false;
          let isStructural = false;
          const neighborColors = /* @__PURE__ */ new Map();
          const updateColorGroup = (color, type) => {
            const key = `${color.r},${color.g},${color.b},${color.a}`;
            const existing = neighborColors.get(key);
            if (existing) {
              if (type === "I")
                existing.iso_count++;
              if (type === "O")
                existing.ortho_count++;
              existing.count++;
            } else {
              const newCandidate = {
                color,
                iso_count: type === "I" ? 1 : 0,
                ortho_count: type === "O" ? 1 : 0,
                count: 1,
                luminance: getColorLuminance(color)
              };
              neighborColors.set(key, newCandidate);
            }
          };
          for (const { pair, type } of this.LINE_SEGMENTS) {
            const [p1, p2] = pair;
            const p1x = x + p1.dx;
            const p1y = y + p1.dy;
            const p2x = x + p2.dx;
            const p2y = y + p2.dy;
            const isP1Opaque = checkNeighborOpaque(sourceData, p1x, p1y);
            const isP2Opaque = checkNeighborOpaque(sourceData, p2x, p2y);
            if (isP1Opaque && isP2Opaque) {
              const p1Color = getPixelRgba2(sourceData, (p1y * width + p1x) * 4);
              const p2Color = getPixelRgba2(sourceData, (p2y * width + p2x) * 4);
              if (!isSameColor(currentPixel, p1Color) || !isSameColor(currentPixel, p2Color)) {
                isColorBoundary = true;
              }
              if (isSameColor(currentPixel, p1Color) && isSameColor(currentPixel, p2Color)) {
                isStructural = true;
                break;
              }
              if (isSameColor(p1Color, p2Color) && !isSameColor(p1Color, currentPixel)) {
                updateColorGroup(p1Color, type);
              }
            }
          }
          if (isStructural) {
            continue;
          }
          if (!isColorBoundary) {
            continue;
          }
          let bestColor = null;
          const candidateColors = Array.from(neighborColors.values()).filter((c) => !isSameColor(c.color, currentPixel));
          if (candidateColors.length === 0)
            continue;
          const maxIsoScore = candidateColors.reduce((max, c) => Math.max(max, c.iso_count), -1);
          let finalCandidates = candidateColors.filter((c) => c.iso_count === maxIsoScore);
          if (finalCandidates.length > 1 && maxIsoScore <= 0) {
            const maxOrthoScore = finalCandidates.reduce((max, c) => Math.max(max, c.ortho_count), -1);
            finalCandidates = finalCandidates.filter((c) => c.ortho_count === maxOrthoScore);
          }
          if (finalCandidates.length > 0) {
            let bestCandidate = null;
            if (priority === "dark") {
              bestCandidate = finalCandidates.reduce(
                (best, c) => best === null || c.luminance < best.luminance ? c : best,
                null
              );
            } else {
              bestCandidate = finalCandidates.reduce(
                (best, c) => best === null || c.luminance > best.luminance ? c : best,
                null
              );
            }
            bestColor = bestCandidate ? bestCandidate.color : null;
          }
          if (bestColor) {
            updatesToChangeColor.set(pixelIndex4D, bestColor);
            changed = true;
          }
        }
      }
      if (updatesToChangeColor.size > 0) {
        updatesToChangeColor.forEach((newColor, index) => {
          setPixelRgba3(originalData, index, newColor);
        });
      }
      return changed;
    });
  }
};
function initializeColorLineEditor(container_id = "editor-color-line-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const colorLineEditorInstance = new ImageEditorPixelArtOutlineModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
  });
  colorLineEditorInstance.setHandlers({
    onChange: (image) => {
      if (image) {
        console.log(`[Color Line Editor Change] New image version committed.`);
      }
    }
  });
  return colorLineEditorInstance;
}

// web/jsP/pallet/ImageEditorWarpModule.ts
function rgbToHsl3(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p2, q2, t) => {
      if (t < 0)
        t += 1;
      if (t > 1)
        t -= 1;
      if (t < 1 / 6)
        return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2)
        return q2;
      if (t < 2 / 3)
        return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
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
function analyzeHueDistribution(image) {
  if (image === DEFAULT_EMPTY_ASSET)
    return { histogram: new Array(360).fill(0), avgH: 0, maxFrequency: 1 };
  const canvas = image.cimage;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx)
    return { histogram: new Array(360).fill(0), avgH: 0, maxFrequency: 1 };
  tempCtx.drawImage(canvas, 0, 0);
  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let totalH = 0;
  let opaquePixelCount = 0;
  const histogram = new Array(360).fill(0);
  let maxFrequency = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const hsl = rgbToHsl3(r, g, b);
      const h = hsl.h;
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
var ImageEditorWarpModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  canvas;
  ctx;
  onChange;
  // Hue Warping State 
  warpState = {
    hueWarping: false,
    warpCenterHue: 50,
    // The Hue degree to center the effect on (0-360)
    inputSpread: 30,
    // The range of colors to affect (± degrees)
    stretchFactor: 1
    // Multiplier for stretching/compressing
  };
  // Histogram State
  hueHistogram = new Array(360).fill(0);
  maxHueFrequency = 1;
  avgHue = 0;
  // DOM References 
  hueWarpingBtn;
  warpCenterSpan;
  inputSpreadSpan;
  stretchFactorSpan;
  warpCenterSlider;
  warpCenterNumber;
  inputSpreadSlider;
  inputSpreadNumber;
  stretchFactorNumber;
  avgHueDisplay;
  centerColorSwatch;
  histogramCanvas;
  constructor(params) {
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
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
    console.log("Warp module handlers updated.");
    this.containerDiv.innerHTML = this.renderInitialStructure();
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    this.loadImage(this.currentImage);
  }
  loadImage(image) {
    this.currentImage = image;
    this.canvas.width = this.currentImage.cimage.width;
    this.canvas.height = this.currentImage.cimage.height;
    this.warpState = {
      hueWarping: false,
      warpCenterHue: 50,
      inputSpread: 30,
      stretchFactor: 1
    };
    const { histogram, avgH, maxFrequency } = analyzeHueDistribution(this.currentImage);
    this.hueHistogram = histogram;
    this.avgHue = avgH;
    this.maxHueFrequency = maxFrequency;
    this.updateControlValues();
    this.updateAverageHueDisplay();
    this.drawHueHistogram();
  }
  /**
   * Updates the control displays, including the color swatch, value text, and input element values.
   */
  updateControlValues() {
    this.hueWarpingBtn.classList.toggle("active-transform", this.warpState.hueWarping);
    const centerRgb = hslToRgb(this.warpState.warpCenterHue, 100, 50);
    const colorString = `rgb(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b})`;
    if (this.centerColorSwatch) {
      this.centerColorSwatch.style.backgroundColor = colorString;
    }
    if (this.warpCenterSpan) {
      this.warpCenterSpan.style.color = colorString;
      this.warpCenterSpan.textContent = `${this.warpState.warpCenterHue}\xB0 Hue`;
    }
    if (this.inputSpreadSpan) {
      this.inputSpreadSpan.textContent = `\xB1${this.warpState.inputSpread}\xB0 Range`;
    }
    if (this.stretchFactorSpan) {
      this.stretchFactorSpan.textContent = `\xD7${this.warpState.stretchFactor.toFixed(2)} Factor`;
    }
    if (this.warpCenterSlider)
      this.warpCenterSlider.value = this.warpState.warpCenterHue.toString();
    if (this.warpCenterNumber)
      this.warpCenterNumber.value = this.warpState.warpCenterHue.toString();
    if (this.inputSpreadSlider)
      this.inputSpreadSlider.value = this.warpState.inputSpread.toString();
    if (this.inputSpreadNumber)
      this.inputSpreadNumber.value = this.warpState.inputSpread.toString();
    const stretchFactorSlider = this.containerDiv.querySelector(`#stretchFactorSlider-${this.containerDiv.id}`);
    if (stretchFactorSlider)
      stretchFactorSlider.value = this.warpState.stretchFactor.toString();
    if (this.stretchFactorNumber)
      this.stretchFactorNumber.value = this.warpState.stretchFactor.toFixed(2);
    this.drawHueHistogram();
  }
  /**
   * Displays the image's average hue for user context.
   */
  updateAverageHueDisplay() {
    this.avgHueDisplay.textContent = `${this.avgHue}\xB0 Avg Hue (Context)`;
  }
  /**
   * Draws the hue histogram onto the dedicated canvas.
   */
  drawHueHistogram() {
    const histCtx = this.histogramCanvas.getContext("2d");
    if (!histCtx)
      return;
    const width = this.histogramCanvas.width;
    const height = this.histogramCanvas.height;
    histCtx.clearRect(0, 0, width, height);
    const binWidth = width / 360;
    const maxFreq = this.maxHueFrequency;
    for (let h = 0; h < 360; h++) {
      const barHeight = this.hueHistogram[h] / maxFreq * height;
      histCtx.fillStyle = `hsl(${h}, 100%, 50%)`;
      histCtx.fillRect(h * binWidth, height - barHeight, binWidth, barHeight);
    }
    histCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let h = 0; h < 360; h++) {
      const barHeight = this.hueHistogram[h] / maxFreq * height;
      histCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
      histCtx.fillRect(h * binWidth, height - barHeight, binWidth, barHeight);
    }
    const center = this.warpState.warpCenterHue;
    const spread = this.warpState.inputSpread;
    const start = (center - spread + 360) % 360;
    const end = (center + spread + 360) % 360;
    histCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
    if (start < end) {
      histCtx.fillRect(start * binWidth, 0, (end - start) * binWidth, height);
    } else {
      histCtx.fillRect(start * binWidth, 0, (360 - start) * binWidth, height);
      histCtx.fillRect(0, 0, end * binWidth, height);
    }
    histCtx.fillStyle = "rgba(255, 255, 255, 1.0)";
    histCtx.fillRect(center * binWidth - 1, 0, 2, height);
  }
  renderInitialStructure() {
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
                    <span id="avg-hue-display-${idSuffix}" style="font-weight: bold;">0\xB0 Avg Hue (Context)</span>
                </div>
                
                <div class="hue-histogram-container">
                    <canvas id="hue-histogram-canvas-${idSuffix}" width="360" height="40"></canvas>
                </div>

                <div class="warp-control">
                    <label>Warp Center Hue:</label>
                    <div class="value-display-group">
                        <span id="center-color-swatch-${idSuffix}" class="color-swatch"></span>
                        <span id="warp-center-value-${idSuffix}" class="value-display">${this.warpState.warpCenterHue}\xB0 Hue</span>
                    </div>
                </div>
                <div class="input-group">
                    <input type="range" id="warpCenterSlider-${idSuffix}" min="0" max="360" step="1" value="${this.warpState.warpCenterHue}" />
                    <input type="number" id="warpCenterNumber-${idSuffix}" min="0" max="360" step="1" value="${this.warpState.warpCenterHue}" />
                </div>
                
                <div class="warp-control" style="margin-top: 15px;">
                    <label>Input Range ($pm$ degrees):</label> 
                    <span id="input-spread-value-${idSuffix}" class="value-display">\xB1${this.warpState.inputSpread}\xB0 Range</span>
                </div>
                <div class="input-group">
                    <input type="range" class="basic-slider" id="inputSpreadSlider-${idSuffix}" min="1" max="180" step="1" value="${this.warpState.inputSpread}" />
                    <input type="number" id="inputSpreadNumber-${idSuffix}" min="1" max="180" step="1" value="${this.warpState.inputSpread}" />
                </div>
                
                <div class="warp-control" style="margin-top: 15px;">
                    <label>Stretch Factor:</label>
                    <span id="stretch-factor-value-${idSuffix}" class="value-display">\xD7${this.warpState.stretchFactor.toFixed(2)} Factor</span>
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
  reinitializeDOMReferences() {
    const idSuffix = this.containerDiv.id;
    this.hueWarpingBtn = this.containerDiv.querySelector(`#hueWarpingBtn-${idSuffix}`);
    this.warpCenterSlider = this.containerDiv.querySelector(`#warpCenterSlider-${idSuffix}`);
    this.warpCenterNumber = this.containerDiv.querySelector(`#warpCenterNumber-${idSuffix}`);
    this.inputSpreadSlider = this.containerDiv.querySelector(`#inputSpreadSlider-${idSuffix}`);
    this.inputSpreadNumber = this.containerDiv.querySelector(`#inputSpreadNumber-${idSuffix}`);
    this.stretchFactorNumber = this.containerDiv.querySelector(`#stretchFactorNumber-${idSuffix}`);
    this.warpCenterSpan = this.containerDiv.querySelector(`#warp-center-value-${idSuffix}`);
    this.inputSpreadSpan = this.containerDiv.querySelector(`#input-spread-value-${idSuffix}`);
    this.stretchFactorSpan = this.containerDiv.querySelector(`#stretch-factor-value-${idSuffix}`);
    this.centerColorSwatch = this.containerDiv.querySelector(`#center-color-swatch-${idSuffix}`);
    this.avgHueDisplay = this.containerDiv.querySelector(`#avg-hue-display-${idSuffix}`);
    this.histogramCanvas = this.containerDiv.querySelector(`#hue-histogram-canvas-${idSuffix}`);
    const commitCanvasElement = this.containerDiv.querySelector("#warp-canvas");
    if (commitCanvasElement) {
      this.canvas = commitCanvasElement;
      this.ctx = commitCanvasElement.getContext("2d", { willReadFrequently: true });
      this.canvas.width = this.currentImage.cimage.width;
      this.canvas.height = this.currentImage.cimage.height;
    }
  }
  attachEventListeners() {
    this.warpCenterSlider.addEventListener("input", (e) => this.handleInputUpdate("warpCenterHue", e.target, this.warpCenterNumber));
    this.warpCenterNumber.addEventListener("change", (e) => this.handleInputUpdate("warpCenterHue", e.target, this.warpCenterSlider));
    this.inputSpreadSlider.addEventListener("input", (e) => this.handleInputUpdate("inputSpread", e.target, this.inputSpreadNumber));
    this.inputSpreadNumber.addEventListener("change", (e) => this.handleInputUpdate("inputSpread", e.target, this.inputSpreadSlider));
    const stretchFactorSlider = this.containerDiv.querySelector(`#stretchFactorSlider-${this.containerDiv.id}`);
    stretchFactorSlider.addEventListener("input", (e) => this.handleInputUpdate("stretchFactor", e.target, this.stretchFactorNumber));
    this.stretchFactorNumber.addEventListener("change", (e) => this.handleInputUpdate("stretchFactor", e.target, stretchFactorSlider));
    this.hueWarpingBtn.addEventListener("click", () => this.handleWarpingToggle());
  }
  /**
   * Handles updates from slider or number input, clamps the value, and syncs the companion input.
   */
  handleInputUpdate(key, source, companion) {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    let rawValue = parseFloat(source.value);
    let newValue = this.warpState[key];
    if (key === "warpCenterHue") {
      newValue = Math.max(0, Math.min(360, rawValue));
      newValue = Math.round(newValue);
    } else if (key === "inputSpread") {
      newValue = Math.max(1, Math.min(180, rawValue));
      newValue = Math.round(newValue);
    } else if (key === "stretchFactor") {
      newValue = Math.max(0.01, Math.min(3, rawValue));
      newValue = parseFloat(newValue.toFixed(2));
    }
    if (newValue !== this.warpState[key]) {
      this.warpState[key] = newValue;
      if (companion) {
        companion.value = key === "stretchFactor" ? newValue.toFixed(2) : newValue.toString();
      }
      source.value = key === "stretchFactor" ? newValue.toFixed(2) : newValue.toString();
      this.updateControlValues();
      if (this.warpState.hueWarping) {
        this.handleWarpTransformCommit();
      }
    }
  }
  handleWarpingToggle() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.warpState.hueWarping = !this.warpState.hueWarping;
    this.updateControlValues();
    this.handleWarpTransformCommit();
  }
  /**
   * CORE LOGIC: Applies Hue Warping pixel-by-pixel, supporting both stretch and compress.
   */
  applyHueWarping(data, centerHue, inputSpread, stretchFactor) {
    if (inputSpread === 0 || stretchFactor === 1)
      return;
    const outputSpread = inputSpread * stretchFactor;
    const isFullCircle = inputSpread >= 180;
    if (isFullCircle) {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0)
          continue;
        const hsl = rgbToHsl3(data[i], data[i + 1], data[i + 2]);
        let h_norm = (hsl.h - centerHue + 360) % 360;
        if (h_norm > 180)
          h_norm -= 360;
        h_norm = h_norm * stretchFactor;
        let h = h_norm + centerHue;
        h = (h % 360 + 360) % 360;
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
      if (data[i + 3] === 0)
        continue;
      const hsl = rgbToHsl3(data[i], data[i + 1], data[i + 2]);
      let h_norm = (hsl.h - centerHue + 360) % 360;
      if (h_norm > 180)
        h_norm -= 360;
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
      let h = h_norm + centerHue;
      h = (h % 360 + 360) % 360;
      const newRgb = hslToRgb(h, hsl.s, hsl.l);
      data[i] = newRgb.r;
      data[i + 1] = newRgb.g;
      data[i + 2] = newRgb.b;
    }
  }
  handleWarpTransformCommit() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    const originalCanvas = this.currentImage.cimage;
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    if (this.warpState.hueWarping && this.warpState.stretchFactor !== 1) {
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(originalCanvas, 0, 0);
      const imageData = this.ctx.getImageData(0, 0, width, height);
      this.applyHueWarping(
        imageData.data,
        this.warpState.warpCenterHue,
        this.warpState.inputSpread,
        this.warpState.stretchFactor
      );
      const newOffscreenCanvas = new OffscreenCanvas(width, height);
      newOffscreenCanvas.getContext("2d").putImageData(imageData, 0, 0);
      this.currentImage = {
        ...this.currentImage,
        cimage: newOffscreenCanvas
      };
    } else {
      console.log(`No image asset committed. Warping state: ${this.warpState.hueWarping}, Factor: ${this.warpState.stretchFactor}`);
    }
    this.onChange?.(this.currentImage);
    console.log(`Image warp transform committed. Status: ${this.warpState.hueWarping && this.warpState.stretchFactor !== 1 ? "Active" : "Disabled"}`);
  }
};
function initializeWarpEditor(container_id = "image-warp-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const warpTransformerInstance = new ImageEditorWarpModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
    // Start with the example image
  });
  warpTransformerInstance.setHandlers({
    // This handler will be called whenever a transform is applied
    onChange: (image) => {
      if (image) {
        console.log(`[Warp Change] New image version committed.`);
      }
    }
  });
  return warpTransformerInstance;
}

// web/jsP/pallet/ImageEditorFilterModule.ts
function rgbToHsl4(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToRgb2(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p2, q2, t) => {
      if (t < 0)
        t += 1;
      if (t > 1)
        t -= 1;
      if (t < 1 / 6)
        return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2)
        return q2;
      if (t < 2 / 3)
        return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
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
    b: Math.round(b * 255)
  };
}
function analyzeHueDistribution2(image) {
  const canvas = image.cimage;
  const tempCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  ctx.drawImage(image.cimage, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const histogram = new Array(360).fill(0);
  let totalPixels = 0;
  let totalHueSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0)
      continue;
    const { h, s, l } = rgbToHsl4(data[i], data[i + 1], data[i + 2]);
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
var ImageEditorFilterModule = class {
  currentImage = DEFAULT_EMPTY_ASSET;
  containerDiv;
  // Canvas used for actual image processing (hidden)
  processCanvas;
  ctx;
  // Canvas used for histogram visualization
  histogramCanvas;
  onChange;
  // Filter State
  filterState = {
    filterActive: false,
    // Hue range selector
    centerHue: 50,
    // The Hue degree to center the effect on (0-360)
    inputSpread: 30,
    // The range of colors to affect (± degrees)
    // Filter adjustments (-100 to 100)
    satAdjustment: 0,
    contrastAdjustment: 0,
    brightAdjustment: 0
  };
  // Histogram State
  hueHistogram = new Array(360).fill(0);
  avgHue = 0;
  maxHueFrequency = 0;
  // DOM References 
  filterToggleBtn;
  satNumber;
  contrastNumber;
  brightNumber;
  centerColorSwatch;
  avgHueDisplay;
  centerHueNumber;
  spreadNumber;
  constructor(params) {
    this.currentImage = params.image || DEFAULT_EMPTY_ASSET;
    const container = document.getElementById(params.divId);
    if (!container) {
      console.error(`Container div with ID ${params.divId} not found.`);
      const tempDiv = document.createElement("div");
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
  setHandlers(handlers) {
    this.onChange = handlers.onChange;
  }
  loadImage(image) {
    this.currentImage = image;
    this.processCanvas.width = this.currentImage.cimage.width;
    this.processCanvas.height = this.currentImage.cimage.height;
    this.filterState = {
      filterActive: false,
      centerHue: 50,
      inputSpread: 30,
      satAdjustment: 0,
      contrastAdjustment: 0,
      brightAdjustment: 0
    };
    const { histogram, avgH, maxFrequency } = analyzeHueDistribution2(this.currentImage);
    this.hueHistogram = histogram;
    this.avgHue = avgH;
    this.maxHueFrequency = maxFrequency;
    this.updateControlValues();
    this.updateAverageHueDisplay();
    this.drawHueHistogram();
  }
  /**
   * Updates the control displays, including the color swatch, value text, and input element values.
   */
  updateControlValues() {
    const idSuffix = this.containerDiv.id;
    this.filterToggleBtn.classList.toggle("active-transform", this.filterState.filterActive);
    const centerRgb = hslToRgb2(this.filterState.centerHue, 100, 50);
    const colorString = `rgb(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b})`;
    this.centerColorSwatch.style.backgroundColor = colorString;
    this.containerDiv.querySelector(`#center-hue-value-${idSuffix}`).textContent = `${this.filterState.centerHue}\xB0`;
    this.containerDiv.querySelector(`#input-spread-value-${idSuffix}`).textContent = `\xB1${this.filterState.inputSpread}\xB0`;
    this.containerDiv.querySelector(`#sat-value-${idSuffix}`).textContent = `${this.filterState.satAdjustment}%`;
    this.containerDiv.querySelector(`#contrast-value-${idSuffix}`).textContent = `${this.filterState.contrastAdjustment}%`;
    this.containerDiv.querySelector(`#bright-value-${idSuffix}`).textContent = `${this.filterState.brightAdjustment}%`;
    this.centerHueNumber.value = this.filterState.centerHue.toString();
    this.spreadNumber.value = this.filterState.inputSpread.toString();
    this.satNumber.value = this.filterState.satAdjustment.toString();
    this.contrastNumber.value = this.filterState.contrastAdjustment.toString();
    this.brightNumber.value = this.filterState.brightAdjustment.toString();
    this.containerDiv.querySelector(`#centerHueSlider-${idSuffix}`).value = this.filterState.centerHue.toString();
    this.containerDiv.querySelector(`#inputSpreadSlider-${idSuffix}`).value = this.filterState.inputSpread.toString();
    this.containerDiv.querySelector(`#satSlider-${idSuffix}`).value = this.filterState.satAdjustment.toString();
    this.containerDiv.querySelector(`#contrastSlider-${idSuffix}`).value = this.filterState.contrastAdjustment.toString();
    this.containerDiv.querySelector(`#brightSlider-${idSuffix}`).value = this.filterState.brightAdjustment.toString();
    this.drawHueHistogram();
  }
  updateAverageHueDisplay() {
    if (this.avgHueDisplay) {
      this.avgHueDisplay.textContent = `${this.avgHue}\xB0 Avg Hue (Context)`;
    }
  }
  /**
   * Draws the Hue Histogram, visualizes the image's distribution, and overlays the parabolic weight curve.
   */
  drawHueHistogram2() {
    const hCtx = this.histogramCanvas.getContext("2d");
    const { width, height } = this.histogramCanvas;
    hCtx.clearRect(0, 0, width, height);
    const { centerHue, inputSpread } = this.filterState;
    const maxVal = this.maxHueFrequency > 0 ? this.maxHueFrequency : 1;
    const gradient = hCtx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 60) {
      const { r, g, b } = hslToRgb2(i % 360, 100, 50);
      gradient.addColorStop(i / 360, `rgb(${r},${g},${b})`);
    }
    hCtx.fillStyle = gradient;
    hCtx.fillRect(0, 0, width, height);
    hCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
    for (let i = 0; i < 360; i++) {
      const barHeight = this.hueHistogram[i] / maxVal * height * 0.9;
      const x = i / 360 * width;
      const barWidth = width / 360;
      hCtx.fillRect(x, height - barHeight, barWidth, barHeight);
    }
    hCtx.strokeStyle = "#60a5fa";
    hCtx.lineWidth = 3;
    hCtx.beginPath();
    const max_D = inputSpread;
    for (let i = 0; i <= 360; i++) {
      let h_diff = Math.abs(i - centerHue);
      if (h_diff > 180)
        h_diff = 360 - h_diff;
      let weight = 0;
      if (h_diff < max_D) {
        const normalized_D = h_diff / max_D;
        weight = 1 - normalized_D * normalized_D;
      }
      const x = i / 360 * width;
      const y = height - weight * height * 0.95;
      if (i === 0) {
        hCtx.moveTo(x, y);
      } else {
        hCtx.lineTo(x, y);
      }
    }
    hCtx.stroke();
    hCtx.strokeStyle = "white";
    hCtx.lineWidth = 2;
    hCtx.beginPath();
    const centerLineX = centerHue / 360 * width;
    hCtx.moveTo(centerLineX, 0);
    hCtx.lineTo(centerLineX, height);
    hCtx.stroke();
  }
  /**
  * Draws the hue histogram onto the dedicated canvas.
  */
  drawHueHistogram() {
    const histCtx = this.histogramCanvas.getContext("2d");
    if (!histCtx)
      return;
    const width = this.histogramCanvas.width;
    const height = this.histogramCanvas.height;
    histCtx.clearRect(0, 0, width, height);
    const binWidth = width / 360;
    const maxFreq = this.maxHueFrequency;
    for (let h = 0; h < 360; h++) {
      const barHeight = this.hueHistogram[h] / maxFreq * height;
      histCtx.fillStyle = `hsl(${h}, 100%, 50%)`;
      histCtx.fillRect(h * binWidth, height - barHeight, binWidth, barHeight);
    }
    histCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let h = 0; h < 360; h++) {
      const barHeight = this.hueHistogram[h] / maxFreq * height;
      histCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
      histCtx.fillRect(h * binWidth, height - barHeight, binWidth, barHeight);
    }
    const center = this.filterState.centerHue;
    const spread = this.filterState.inputSpread;
    const start = (center - spread + 360) % 360;
    const end = (center + spread + 360) % 360;
    histCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
    if (start < end) {
      histCtx.fillRect(start * binWidth, 0, (end - start) * binWidth, height);
    } else {
      histCtx.fillRect(start * binWidth, 0, (360 - start) * binWidth, height);
      histCtx.fillRect(0, 0, end * binWidth, height);
    }
    histCtx.fillStyle = "rgba(255, 255, 255, 1.0)";
    histCtx.fillRect(center * binWidth - 1, 0, 2, height);
  }
  renderInitialStructure() {
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
                        <span id="avg-hue-display-${idSuffix}" style="font-weight: bold;">0\xB0 Avg Hue (Context)</span>
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
                            <span id="center-hue-value-${idSuffix}" class="value-display">${this.filterState.centerHue}\xB0</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="centerHueSlider-${idSuffix}" min="0" max="360" step="1" value="${this.filterState.centerHue}" />
                            <input type="number" id="centerHueNumber-${idSuffix}" min="0" max="360" step="1" value="${this.filterState.centerHue}" />
                        </div>
                    </div>
                    
                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <label>Input Spread (Range $pm$ degrees)</label> 
                            <span id="input-spread-value-${idSuffix}" class="value-display">\xB1${this.filterState.inputSpread}\xB0</span>
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
                            <label>Saturation ($pm$ 100%)</label>
                            <span id="sat-value-${idSuffix}" class="value-display">${this.filterState.satAdjustment}%</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="satSlider-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.satAdjustment}" />
                            <input type="number" id="satNumber-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.satAdjustment}" />
                        </div>
                    </div>

                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <label>Contrast ($pm$ 100%)</label>
                            <span id="contrast-value-${idSuffix}" class="value-display">${this.filterState.contrastAdjustment}%</span>
                        </div>
                        <div class="input-group">
                            <input type="range" id="contrastSlider-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.contrastAdjustment}" />
                            <input type="number" id="contrastNumber-${idSuffix}" min="-100" max="100" step="1" value="${this.filterState.contrastAdjustment}" />
                        </div>
                    </div>
                    
                    <div class="filter-control-section">
                        <div class="control-label-group">
                            <label>Brightness ($pm$ 100%)</label>
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
  reinitializeDOMReferences() {
    const idSuffix = this.containerDiv.id;
    this.filterToggleBtn = this.containerDiv.querySelector(`#filterToggleBtn-${idSuffix}`);
    this.satNumber = this.containerDiv.querySelector(`#satNumber-${idSuffix}`);
    this.contrastNumber = this.containerDiv.querySelector(`#contrastNumber-${idSuffix}`);
    this.brightNumber = this.containerDiv.querySelector(`#brightNumber-${idSuffix}`);
    this.centerHueNumber = this.containerDiv.querySelector(`#centerHueNumber-${idSuffix}`);
    this.spreadNumber = this.containerDiv.querySelector(`#inputSpreadNumber-${idSuffix}`);
    this.centerColorSwatch = this.containerDiv.querySelector(`#center-color-swatch-${idSuffix}`);
    this.avgHueDisplay = this.containerDiv.querySelector(`#avg-hue-display-${idSuffix}`);
    this.histogramCanvas = this.containerDiv.querySelector(`#hue-histogram-canvas-${idSuffix}`);
    const processCanvasElement = this.containerDiv.querySelector(`#filter-process-canvas-${idSuffix}`);
    if (processCanvasElement) {
      this.processCanvas = processCanvasElement;
      const context = processCanvasElement.getContext("2d", { willReadFrequently: true });
      if (context) {
        this.ctx = context;
        this.processCanvas.width = this.currentImage.cimage.width;
        this.processCanvas.height = this.currentImage.cimage.height;
      } else {
        console.error("Could not get 2D context for process canvas.");
      }
    }
  }
  attachEventListeners() {
    const idSuffix = this.containerDiv.id;
    const getSlider = (id) => this.containerDiv.querySelector(`#${id}-${idSuffix}`);
    const getNumber = (id) => this.containerDiv.querySelector(`#${id}-${idSuffix}`);
    const centerHueSlider = getSlider("centerHueSlider");
    const spreadSlider = getSlider("inputSpreadSlider");
    const satSlider = getSlider("satSlider");
    const contrastSlider = getSlider("contrastSlider");
    const brightSlider = getSlider("brightSlider");
    const centerHueNumber = getNumber("centerHueNumber");
    const spreadNumber = getNumber("inputSpreadNumber");
    centerHueSlider.addEventListener("input", (e) => this.handleInputUpdate("centerHue", e.target, centerHueNumber));
    centerHueNumber.addEventListener("change", (e) => this.handleInputUpdate("centerHue", e.target, centerHueSlider));
    spreadSlider.addEventListener("input", (e) => this.handleInputUpdate("inputSpread", e.target, spreadNumber));
    spreadNumber.addEventListener("change", (e) => this.handleInputUpdate("inputSpread", e.target, spreadSlider));
    satSlider.addEventListener("input", (e) => this.handleInputUpdate("satAdjustment", e.target, this.satNumber));
    this.satNumber.addEventListener("change", (e) => this.handleInputUpdate("satAdjustment", e.target, satSlider));
    contrastSlider.addEventListener("input", (e) => this.handleInputUpdate("contrastAdjustment", e.target, this.contrastNumber));
    this.contrastNumber.addEventListener("change", (e) => this.handleInputUpdate("contrastAdjustment", e.target, contrastSlider));
    brightSlider.addEventListener("input", (e) => this.handleInputUpdate("brightAdjustment", e.target, this.brightNumber));
    this.brightNumber.addEventListener("change", (e) => this.handleInputUpdate("brightAdjustment", e.target, brightSlider));
    this.filterToggleBtn.addEventListener("click", () => this.handleFilterToggle());
  }
  /**
   * Handles updates from slider or number input, clamps the value, and syncs the companion input.
   */
  handleInputUpdate(key, source, companion) {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    let rawValue = parseFloat(source.value);
    let newValue = this.filterState[key];
    if (key === "centerHue") {
      newValue = Math.max(0, Math.min(360, rawValue));
      newValue = Math.round(newValue);
    } else if (key === "inputSpread") {
      newValue = Math.max(1, Math.min(180, rawValue));
      newValue = Math.round(newValue);
    } else if (key === "satAdjustment" || key === "contrastAdjustment" || key === "brightAdjustment") {
      newValue = Math.max(-100, Math.min(100, rawValue));
      newValue = Math.round(newValue);
    }
    if (newValue !== this.filterState[key]) {
      this.filterState[key] = newValue;
      if (companion) {
        companion.value = newValue.toString();
      }
      source.value = newValue.toString();
      this.updateControlValues();
      if (this.filterState.filterActive) {
        this.handleFilterTransformCommit();
      }
    }
  }
  handleFilterToggle() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET)
      return;
    this.filterState.filterActive = !this.filterState.filterActive;
    this.updateControlValues();
    this.handleFilterTransformCommit();
  }
  /**
   * Applies distributed filters based on a hue range and a smooth weighting function.
   */
  applyDistributedFilters(data, centerHue, inputSpread, sat, contrast, bright) {
    const max_D = inputSpread;
    const sat_norm = sat / 100;
    const contrast_norm = contrast / 100;
    const bright_norm = bright / 100;
    const contrast_s = 1 + contrast_norm;
    const contrast_offset = 128 * (1 - contrast_s);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0)
        continue;
      const hsl = rgbToHsl4(data[i], data[i + 1], data[i + 2]);
      let h_diff = Math.abs(hsl.h - centerHue);
      if (h_diff > 180)
        h_diff = 360 - h_diff;
      let weight = 0;
      if (h_diff < max_D) {
        const normalized_D = h_diff / max_D;
        weight = 1 - normalized_D * normalized_D;
      }
      if (weight > 0) {
        const new_s = Math.max(0, Math.min(100, hsl.s + hsl.s * sat_norm * weight));
        let { r, g, b } = hslToRgb2(hsl.h, new_s, hsl.l);
        if (contrast !== 0) {
          const r_c = r * (1 + contrast_norm * weight) + contrast_offset * weight;
          const g_c = g * (1 + contrast_norm * weight) + contrast_offset * weight;
          const b_c = b * (1 + contrast_norm * weight) + contrast_offset * weight;
          r = Math.max(0, Math.min(255, r_c));
          g = Math.max(0, Math.min(255, g_c));
          b = Math.max(0, Math.min(255, b_c));
        }
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
  handleFilterTransformCommit() {
    if (this.currentImage === DEFAULT_EMPTY_ASSET || !this.ctx)
      return;
    const originalCanvas = this.currentImage.cimage;
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    const filterParamsNeutral = this.filterState.satAdjustment === 0 && this.filterState.contrastAdjustment === 0 && this.filterState.brightAdjustment === 0;
    const filterActive = this.filterState.filterActive && !filterParamsNeutral;
    if (filterActive) {
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(originalCanvas, 0, 0);
      const imageData = this.ctx.getImageData(0, 0, width, height);
      this.applyDistributedFilters(
        imageData.data,
        this.filterState.centerHue,
        this.filterState.inputSpread,
        this.filterState.satAdjustment,
        this.filterState.contrastAdjustment,
        this.filterState.brightAdjustment
      );
      const newOffscreenCanvas = new OffscreenCanvas(width, height);
      newOffscreenCanvas.getContext("2d").putImageData(imageData, 0, 0);
      this.currentImage = {
        ...this.currentImage,
        cimage: newOffscreenCanvas
      };
    } else {
      if (this.currentImage.cimage !== originalCanvas) {
        this.currentImage = {
          ...this.currentImage,
          cimage: originalCanvas
        };
      }
      console.log(`No image filter committed. Filter Status: Disabled or Neutral.`);
    }
    this.onChange?.(this.currentImage);
    console.log(`Image filter transform committed. Status: ${filterActive ? "Active" : "Disabled"}`);
  }
};
function initializeFilterEditor(container_id = "image-filter-container") {
  const container = document.getElementById(container_id);
  if (!container) {
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const filterTransformerInstance = new ImageEditorFilterModule({
    divId: container_id,
    image: DEFAULT_EMPTY_ASSET
    // Start with the example image
  });
  filterTransformerInstance.setHandlers({
    // This handler will be called whenever a transform is applied
    onChange: (image) => {
      if (image) {
        console.log(`[Filter Change] New image version committed.`);
      }
    }
  });
  return filterTransformerInstance;
}

// web/jsP/pallet/MaskLayerIsoAjust.ts
function enforceFullOpacity(canvas, size) {
  const ctx = canvas.getContext("2d");
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
var AdjustableDiamondMaskLayer = class {
  id = "adjustable-diamond";
  name = "Adjustable Diamond";
  tileSize = 256;
  defaultColor = "#DB9834";
  // HEIGHT CONFIGURATION
  HEIGHT_SCALE_UNIT = 1;
  // 1 level = 69 pixels of lift
  defaultHeightLevel = 64;
  minHeightLevel = -64;
  maxHeightLevel = 3 * 64;
  stepValue = 1;
  // NEW: Allows float steps
  colorInput;
  heightInput;
  heightValueSpan;
  onChangeHandler;
  controlContainer;
  renderControls(parentDiv, containerId, onChange) {
    const container = parentDiv.querySelector(`#${containerId}`);
    if (!container) {
      console.error(`Container #${containerId} not found!`);
      return;
    }
    this.onChangeHandler = onChange;
    this.controlContainer = container;
    const colorInputId = `param-${this.id}-color`;
    const heightInputId = `param-${this.id}-height`;
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
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    console.log(`[Adjustable Diamond Layer] Controls rendered and listeners attached into #${containerId}`);
  }
  reinitializeDOMReferences() {
    const colorInputId = `param-${this.id}-color`;
    const heightInputId = `param-${this.id}-height`;
    this.colorInput = this.controlContainer?.querySelector(`#${colorInputId}`);
    this.heightInput = this.controlContainer?.querySelector(`#${heightInputId}`);
    this.heightValueSpan = this.controlContainer?.querySelector(`#${heightInputId}-value`);
    ;
  }
  attachEventListeners() {
    if (this.colorInput) {
      this.colorInput.addEventListener("input", () => this.handleInputUpdate());
    }
    if (this.heightInput) {
      this.heightInput.addEventListener("input", (e) => {
        const floatValue = parseFloat(e.target.value);
        if (this.heightValueSpan) {
          this.heightValueSpan.textContent = floatValue.toFixed(1);
        }
        this.handleInputUpdate();
      });
    }
  }
  handleInputUpdate() {
    if (this.onChangeHandler) {
      this.onChangeHandler();
    }
  }
  draw() {
    const TILE_SIZE = this.tileSize;
    const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext("2d");
    const BOTTOM_PADDING = 36;
    const lineColor = this.colorInput?.value ?? this.defaultColor;
    const heightValue = this.heightInput?.value ? parseFloat(this.heightInput.value) : this.defaultHeightLevel;
    const verticalShiftPixels = heightValue * this.HEIGHT_SCALE_UNIT + 36;
    console.log(`[Adjustable Diamond Draw] Color: ${lineColor}, Level: ${heightValue.toFixed(1)}, Shift: ${verticalShiftPixels.toFixed(1)}px`);
    const offset = 0.5;
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    const Y_TIP_UNADJUSTED = TILE_SIZE - verticalShiftPixels;
    const centerY = Y_TIP_UNADJUSTED - 32;
    const X_CENTER = 128 + offset;
    const X_RIGHT = 192 + offset;
    const X_LEFT = 64 + offset;
    const Y_TOP = centerY - 32 + offset;
    const Y_RIGHT_LEFT = centerY + offset;
    const Y_BOTTOM = Y_TIP_UNADJUSTED + offset;
    ctx.beginPath();
    ctx.moveTo(X_CENTER, Y_TOP);
    ctx.lineTo(X_RIGHT, Y_RIGHT_LEFT);
    ctx.lineTo(X_CENTER, Y_BOTTOM);
    ctx.lineTo(X_LEFT, Y_RIGHT_LEFT);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X_RIGHT + 1, TILE_SIZE - BOTTOM_PADDING - 32);
    ctx.lineTo(X_RIGHT + 1, Y_RIGHT_LEFT);
    ctx.moveTo(X_LEFT - 1, TILE_SIZE - BOTTOM_PADDING - 32);
    ctx.lineTo(X_LEFT - 1, Y_RIGHT_LEFT);
    ctx.moveTo(X_CENTER, TILE_SIZE - BOTTOM_PADDING);
    ctx.lineTo(X_CENTER, Y_BOTTOM);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.closePath();
    ctx.stroke();
    return enforceFullOpacity(canvas, TILE_SIZE);
  }
};

// web/jsP/pallet/MaskLayerIso3DPolygon.ts
function enforceFullOpacity2(canvas, size) {
  const ctx = canvas.getContext("2d");
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
var Iso3DPolygonMaskLayer = class {
  id = "iso-3d-polygon";
  name = "Isometric 3D Polygon (X,Y,Z)";
  tileSize = 256;
  BOTTOM_PADDING = 36;
  Y_BOT_BASE = 256;
  defaultStrokeColor = "#3498db";
  // Default polygon script (unchanged)
  defaultPolygon = `
// 1. Define Scalar and Point Variables
X = 10
Y = 20
Z_HEIGHT = 5
P1 = 10, 20, 5 
PL = 0, 65, 0 
PR = 64, 0, 0 
PT = 64, 64, 0 
PB = 0, 0, 0 
PBL = 0.5, 0, 0 


// ---------------
LINE  
FILL #000000
64,    0, 200,
64+64, 0, 200,
64+64, 0, -200,
64,    0, -200,

LINE
0, 65,      200,
0, 65+64,   200,
0, 65+64,  -200,
0, 65,     -200,

LINE
  0,   0,   0,
  0,  65,   0,
-64,  65,   0,
-64,   0,   0,

LINE
-128,   0,   0,
-128, -128,   0,
 64,  -128,   0,
 64,   0,   0,

TOP = 79
LINE
-128,   64,   TOP,
-128, +128,  TOP,
 64,  +128,  TOP,
 64,  64,    TOP,

TOP = 79
LINE
+256,  256,   TOP,
+256, -256,  TOP,
 64,  -256,  TOP,
 64,   256,    TOP,

/*
// ---------------
LINE #FF0000 
FILL 
// PL,PB, PR, PT,

// ---------------
// 2. Define Height
SIZE 2
HTOP = 0, 0, 79.5
HTOPa = 0, 0, 71.5
HTOPb = 0, 0, 64.5
HTOPp = 0, 0, 60.5 

// ---------------
LINE #00FF00 
// HTOP, HTOP >> 0, 64, 0
// HTOPa, HTOPa >> 0, 64, 0
// HTOPb, HTOPb >> 0, 64, 0


// ---------------
// 3. Define Height
LINE #FFFF00
PBL,PBL >>  HTOPb

// ---------------
// 3. Define Height
PIL_L = 0, 64-4, 0 
PIL_R = 0, 0+7, 0 

TOP_L = 0, 64-14, 0 
TOP_R = 0, 0+14, 0 
TOPB_L = 0, 54, 0 


// ---------------
// ---------------
// FUNC SIDE_E (TOP) {}
LINE #000000 FILL

PIL_R
PIL_R >> HTOPp,
TOP_R >> HTOPa,
TOP_L >> HTOPa,
PIL_L >> HTOPp,
PIL_L,
PL, PL >> HTOPb,
TOP_L >> HTOP,
TOP_R >> HTOP,
PB >> HTOPb,
PB

Pe =   6,   0, 0
Pw =  -6,   0, 0
Ps =   0,  -6, 0
Pn =   0,   6, 0


// ---------------
// FUNC SIDE_TOP (TOP) {}

TOP = 0, 0, 79.5
L =  0, 65, 0 >> TOP
R = 64,  0, 0 >> TOP
T = 64, 65, 0 >> TOP
B =  0,  0, 0 >> TOP

// LINE #000000
// L, B, R, T

De =  13,   0, 0
Dw = -12,   0, 0
Ds =   0, -13, 0
Dn =   0,  13, 0

LINE #000000
L >> De, L >> De >> Ds, L >> Ds, 
B >> Dn, B >> Dn >> De, B >> De, 
R >> Dw, R >> Dw >> Dn, R >> Dn,
T >> Ds, T >> Ds >> Dw, T >> Dw,

Ce =  20,   0, 0
Cw = -18,   0, 0
Cs =   0, -20, 0
Cn =   0,  21, 0

LINE #000000
L >> Ce, L >> Ce >> Cs, L >> Cs, 
B >> Cn, B >> Cn >> Ce, B >> Ce, 
R >> Cw, R >> Cw >> Cn, R >> Cn,
T >> Cs, T >> Cs >> Cw, T >> Cw,

// ---------------
// FUNC SIDE_S() {}

LINE #000000
PB, 
PB >> HTOPp >> 0, 0, 5, 
PB >> HTOP >> De, 
PR >> HTOP >> Dw, 
PR >> HTOPp >> 0, 0, 4,
PR,
PR >> Pw,
PR >> Pw >> HTOPp,
PR >> Cw >> HTOPa >> 3, 0, 0,
PB >> Ce >> HTOPa >> -4, 0, 0,
PB >> Pe >> HTOPp,
PB >> Pe

*/

`;
  polyInput;
  onChangeHandler;
  controlContainer;
  polyInputId = `param-${this.id}-poly`;
  // --- PIXEL RENDERING HELPERS ---
  // Cache for pre-calculated RGB values
  colorCache = {};
  /** Converts hex string (#RRGGBB) to [R, G, B] array. */
  _hexToRgb(hex) {
    if (this.colorCache[hex]) {
      return this.colorCache[hex];
    }
    try {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      const rgb = [r, g, b];
      this.colorCache[hex] = rgb;
      return rgb;
    } catch {
      return [0, 0, 0];
    }
  }
  /**
   * Sets a single pixel in the ImageData array.
   * @param data The Uint8ClampedArray of the canvas.
   * @param width The width of the canvas (TILE_SIZE).
   * @param x X coordinate (integer).
   * @param y Y coordinate (integer).
   * @param r Red value (0-255).
   * @param g Green value (0-255).
   * @param b Blue value (0-255).
   */
  _setPixel(data, width, x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= width)
      return;
    const index = (y * width + x) * 4;
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = 255;
  }
  /**
   * Implements Bresenham's line algorithm for a pixel-perfect, 1-pixel line.
   */
  _drawLine(data, width, p1, p2, colorHex) {
    let x0 = p1[0];
    let y0 = p1[1];
    let x1 = p2[0];
    let y1 = p2[1];
    const [r, g, b] = this._hexToRgb(colorHex);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this._setPixel(data, width, x0, y0, r, g, b);
      if (x0 === x1 && y0 === y1)
        break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  /**
   * Fills the polygon using a simplified scanline algorithm.
   * This relies on rounding coordinates and only works well for convex/simple concave polygons.
   */
  _fillPolygon(data, width, points, colorHex) {
    if (points.length < 3)
      return;
    const [r, g, b] = this._hexToRgb(colorHex);
    let minY = Infinity, maxY = -Infinity;
    for (const [x, y] of points) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(width - 1, Math.ceil(maxY));
    for (let y = minY; y <= maxY; y++) {
      const intersections = [];
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const [x1, y1] = p1;
        const [x2, y2] = p2;
        if (y1 <= y && y2 > y || y2 <= y && y1 > y) {
          const x_intersect = x1 + (y - y1) / (y2 - y1) * (x2 - x1);
          intersections.push(x_intersect);
        }
      }
      intersections.sort((a, b2) => a - b2);
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 >= intersections.length)
          break;
        let startX = Math.ceil(intersections[i]);
        const endX = Math.floor(intersections[i + 1]);
        startX = Math.max(0, startX);
        const clampedEndX = Math.min(width - 1, endX);
        for (let x = startX; x <= clampedEndX; x++) {
          this._setPixel(data, width, x, y, r, g, b);
        }
      }
    }
  }
  // --- END PIXEL RENDERING HELPERS ---
  // ... (rest of the class methods remain the same, including parseDrawingInstructions) ...
  renderControls(parentDiv, containerId, onChange) {
    const container = parentDiv.querySelector(`#${containerId}`);
    if (!container) {
      console.error(`Container #${containerId} not found!`);
      return;
    }
    this.onChangeHandler = onChange;
    this.controlContainer = container;
    container.innerHTML = `
            <div class="layer-param" style="flex-direction: column; align-items: start;">
                <label for="${this.polyInputId}">
                    Drawing Script (X,Y,Z triples, 0-64 range)
                    <br><small>
                        * Render is now pixel-perfect using custom rasterization! *
                        <br>
                        Commands: 
                        <span style="font-family: monospace;">LINE [#color]</span> (New shape/Stroke), 
                        <span style="font-family: monospace;">FILL [#color]</span> (Fill), 
                        <span style="font-family: monospace;">SIZE [width]</span> (Stroke Width - *ignored, always 1px*)
                        <br>
                        <span style="font-family: monospace;">VAR = VALUE</span>, 
                        <span style="font-family: monospace;">A >> B</span> (Vector addition)
                        <br>
                        <span style="font-family: monospace;">OFF X Y Z { ... }</span> (Offset scope)
                    </small>
                </label>
                <textarea id="${this.polyInputId}" style="width: 100%; height: 200px; font-size: 1.1em; font-family: monospace;">${this.defaultPolygon.trim()}</textarea>
            </div>
        `;
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    console.log(`[Iso3D Polygon Layer] Controls rendered and listeners attached into #${containerId}`);
  }
  reinitializeDOMReferences() {
    this.polyInput = this.controlContainer?.querySelector(`#${this.polyInputId}`);
  }
  attachEventListeners() {
    if (this.polyInput) {
      this.polyInput.addEventListener("input", () => this.handleInputUpdate());
    }
  }
  handleInputUpdate() {
    if (this.onChangeHandler) {
      this.onChangeHandler();
    }
  }
  variableStore = {};
  _evaluateValue(token) {
    token = token.trim();
    const resolveToken = (t) => {
      t = t.trim();
      if (t.length > 0 && isNaN(parseFloat(t))) {
        const value = this.variableStore[t.toUpperCase()];
        return typeof value === "number" ? value : 0;
      }
      return parseFloat(t);
    };
    const subParts = token.split("-");
    if (subParts.length === 2) {
      const a = resolveToken(subParts[0]);
      const b = resolveToken(subParts[1]);
      if (!isNaN(a) && !isNaN(b)) {
        return a - b;
      }
    }
    const addParts = token.split("+");
    if (addParts.length === 2) {
      const a = resolveToken(addParts[0]);
      const b = resolveToken(addParts[1]);
      if (!isNaN(a) && !isNaN(b)) {
        return a + b;
      }
    }
    const divParts = token.split("/");
    if (divParts.length === 2) {
      const a = resolveToken(divParts[0]);
      const b = resolveToken(divParts[1]);
      if (!isNaN(a) && !isNaN(b) && b !== 0) {
        return a / b;
      }
    }
    return resolveToken(token);
  }
  _resolvePoint(tokens, i) {
    let lhs = null;
    let lhsConsumed = 0;
    const pointVariable = this.variableStore[tokens[i]];
    if (Array.isArray(pointVariable)) {
      lhs = [...pointVariable];
      lhsConsumed = 1;
    } else if (tokens[i + 1] !== void 0 && tokens[i + 2] !== void 0) {
      const X = this._evaluateValue(tokens[i]);
      const Y = this._evaluateValue(tokens[i + 1]);
      const Z = this._evaluateValue(tokens[i + 2]);
      if (!isNaN(X) && !isNaN(Y) && !isNaN(Z)) {
        lhs = [X, Y, Z];
        lhsConsumed = 3;
      }
    }
    if (lhs === null) {
      return null;
    }
    const operatorIndex = i + lhsConsumed;
    if (tokens[operatorIndex] === ">>") {
      const rhsResolution = this._resolvePoint(tokens, operatorIndex + 1);
      if (rhsResolution) {
        const rhs = rhsResolution.point;
        const result = [
          lhs[0] + rhs[0],
          lhs[1] + rhs[1],
          lhs[2] + rhs[2]
        ];
        const totalConsumed = lhsConsumed + 1 + rhsResolution.consumed;
        return { point: result, consumed: totalConsumed };
      } else {
        console.warn(`Operator '>>' found at index ${operatorIndex}, but the Right-Hand Side expression is invalid. Skipping.`);
        return { point: lhs, consumed: lhsConsumed };
      }
    } else {
      return { point: lhs, consumed: lhsConsumed };
    }
  }
  parseDrawingInstructions(polyString) {
    this.variableStore = {};
    const cleaned = polyString.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const lines = cleaned.split(/[\r\n]+/);
    const tokens = [];
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//") || trimmedLine.length === 0)
        continue;
      const assignmentMatch = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (assignmentMatch) {
        const varName = assignmentMatch[1].toUpperCase();
        const varValue = assignmentMatch[2].trim();
        const tempTokens = varValue.replace(/,/g, " ").replace(/>>/g, " >> ").split(/\s+/).filter((t) => t.length > 0).map((s) => s.toUpperCase());
        const resolution = this._resolvePoint(tempTokens, 0);
        if (resolution && resolution.consumed === tempTokens.length) {
          this.variableStore[varName] = resolution.point;
          continue;
        }
        if (varValue.includes(",")) {
          const pointValues = varValue.split(/,\s*/);
          if (pointValues.length === 3) {
            const X = this._evaluateValue(pointValues[0]);
            const Y = this._evaluateValue(pointValues[1]);
            const Z = this._evaluateValue(pointValues[2]);
            this.variableStore[varName] = [X, Y, Z];
            continue;
          }
        }
        const value = this._evaluateValue(varValue);
        this.variableStore[varName] = value;
        continue;
      }
      tokens.push(
        ...trimmedLine.replace(/\{/g, " { ").replace(/\}/g, " } ").replace(/,/g, " ").replace(/>>/g, " >> ").split(/\s+/).filter((t) => t.length > 0).map((s) => s.toUpperCase())
      );
    }
    let currentShape = {
      points: [],
      strokeColor: this.defaultStrokeColor,
      fillColor: null,
      lineWidth: 1
    };
    const shapes = [];
    const offsetStack = [[0, 0, 0]];
    const getTotalOffset = () => {
      return offsetStack.reduce((acc, current) => [
        acc[0] + current[0],
        acc[1] + current[1],
        acc[2] + current[2]
      ], [0, 0, 0]);
    };
    const startNewShape = (inheritStyle = true) => {
      if (currentShape.points.length >= 2) {
        shapes.push(currentShape);
      }
      const newShape = inheritStyle ? { ...currentShape, points: [] } : { points: [], strokeColor: null, fillColor: null, lineWidth: 1 };
      currentShape = newShape;
    };
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === "LINE") {
        const colorToken = tokens[i + 1];
        const color = colorToken && colorToken.startsWith("#") ? colorToken : null;
        startNewShape(true);
        if (color) {
          currentShape.strokeColor = color.match(/^#[0-9A-F]{6}$/) ? color : this.defaultStrokeColor;
          i += 2;
        } else {
          currentShape.strokeColor = null;
          i += 1;
        }
      } else if (token === "FILL") {
        const colorToken = tokens[i + 1];
        const color = colorToken && colorToken.startsWith("#") ? colorToken : null;
        currentShape.fillColor = color && color.match(/^#[0-9A-F]{6}$/) ? color : null;
        i += color ? 2 : 1;
      } else if (token === "SIZE") {
        i += 2;
      } else if (token === "OFF") {
        if (i + 4 < tokens.length && tokens[i + 4] === "{") {
          const X_off = this._evaluateValue(tokens[i + 1]);
          const Y_off = this._evaluateValue(tokens[i + 2]);
          const Z_off = this._evaluateValue(tokens[i + 3]);
          offsetStack.push([X_off, Y_off, Z_off]);
          i += 5;
        } else {
          console.warn("Incomplete OFF command format: 'OFF X Y Z {'. Skipping.");
          i++;
        }
      } else if (token === "}") {
        if (offsetStack.length > 1) {
          offsetStack.pop();
        } else {
          console.warn("Attempted to close global offset scope. Ignoring '}'.");
        }
        i++;
      } else {
        const resolution = this._resolvePoint(tokens, i);
        if (resolution) {
          const [X_raw, Y_raw, Z_raw] = resolution.point;
          const [X_off, Y_off, Z_off] = getTotalOffset();
          currentShape.points.push([X_raw + X_off, Y_raw + Y_off, Z_raw + Z_off]);
          i += resolution.consumed;
        } else {
          const isCoord = !isNaN(this._evaluateValue(token));
          if (isCoord) {
            console.warn(`Incomplete 3D coordinate triple or invalid point expression found starting with '${tokens[i]}'. Stopping parsing.`);
          } else {
            console.warn(`Skipping unknown token or garbage: '${token}'.`);
          }
          break;
        }
      }
    }
    if (currentShape.points.length >= 2) {
      shapes.push(currentShape);
    }
    if (offsetStack.length > 1) {
      console.warn(`Exited parsing with ${offsetStack.length - 1} OFF scopes unclosed.`);
    }
    return shapes;
  }
  /**
   * Projects a 3D point (X, Y, Z) into a 2D screen point (X', Y')
   * and R O U N D S the result to the nearest integer pixel for pixel art.
   * @param X X coordinate (0-64)
   * @param Y Y coordinate (0-64)
   * @param Z Z coordinate (0-64)
   * @returns Screen coordinate [X', Y'] (integers)
   */
  project(X, Y, Z) {
    const Y_BOT = this.Y_BOT_BASE;
    const X_prime = 128 + X - Y;
    const Y_prime = Y_BOT - 0.5 * X - 0.5 * Y - Z;
    return [
      Math.round(X_prime),
      Math.round(Y_prime - this.BOTTOM_PADDING)
    ];
  }
  draw() {
    const TILE_SIZE = this.tileSize;
    const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const data = imageData.data;
    const shapes = this.parseDrawingInstructions(this.polyInput?.value ?? this.defaultPolygon);
    if (shapes.length === 0) {
      ctx.putImageData(imageData, 0, 0);
      return enforceFullOpacity2(canvas, TILE_SIZE);
    }
    shapes.forEach((shape) => {
      if (shape.points.length < 2)
        return;
      const points2D = shape.points.map(([X, Y, Z]) => this.project(X, Y, Z));
      if (shape.fillColor) {
        this._fillPolygon(data, TILE_SIZE, points2D, shape.fillColor);
      }
      if (shape.strokeColor) {
        for (let i = 0; i < points2D.length; i++) {
          const p1 = points2D[i];
          const p2 = points2D[(i + 1) % points2D.length];
          this._drawLine(data, TILE_SIZE, p1, p2, shape.strokeColor);
        }
      }
    });
    ctx.putImageData(imageData, 0, 0);
    return enforceFullOpacity2(canvas, TILE_SIZE);
  }
};

// web/jsP/pallet/MaskBuilderModule.ts
function enforceFullOpacity3(canvas, size) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      data[i] = 255;
    } else {
      data[i] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
var DiamondMaskLayer = class {
  id = "diamond";
  name = "Isometric Diamond";
  tileSize = 256;
  defaultColor = "#3498DB";
  colorInput;
  onChangeHandler;
  controlContainer;
  // NEW: Container reference
  renderControls(parentDiv, containerId, onChange) {
    const container = parentDiv.querySelector(`#${containerId}`);
    if (!container) {
      console.error(`Container #${containerId} not found!`);
      return;
    }
    this.onChangeHandler = onChange;
    this.controlContainer = container;
    const inputId = `param-${this.id}-color`;
    container.innerHTML = `
            <div class="layer-param">
                <label for="${inputId}">Line Color:</label>
                <input type="color" id="${inputId}" value="${this.defaultColor}">
            </div>
        `;
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    console.log(`[Diamond Layer] Controls rendered and listeners attached into #${containerId}`);
  }
  reinitializeDOMReferences() {
    const inputId = `param-${this.id}-color`;
    this.colorInput = this.controlContainer?.querySelector(`#${inputId}`);
  }
  attachEventListeners() {
    if (this.colorInput) {
      this.colorInput.addEventListener("input", () => this.handleInputUpdate());
    }
  }
  handleInputUpdate() {
    if (this.onChangeHandler) {
      this.onChangeHandler();
    }
  }
  draw() {
    const TILE_SIZE = this.tileSize;
    const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext("2d");
    const lineColor = this.colorInput?.value ?? this.defaultColor;
    console.log(`[Diamond Draw] Drawing with color: ${lineColor}`);
    const offset = 0.5;
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    const pb = 36;
    const X_CENTER = 128 + offset;
    const X_RIGHT = 192 + offset;
    const X_LEFT = 64 + offset;
    const Y_TOP = 192 - pb + offset;
    const Y_RIGHT_LEFT = 224 - pb + offset;
    const Y_BOTTOM = 256 - pb + offset;
    ctx.beginPath();
    ctx.moveTo(X_CENTER, Y_TOP);
    ctx.lineTo(X_RIGHT, Y_RIGHT_LEFT);
    ctx.lineTo(X_CENTER, Y_BOTTOM);
    ctx.lineTo(X_LEFT, Y_RIGHT_LEFT);
    ctx.closePath();
    ctx.stroke();
    return enforceFullOpacity3(canvas, TILE_SIZE);
  }
};
var BorderMaskLayer = class {
  id = "border";
  name = "1px Square Border";
  tileSize = 256;
  defaultColor = "#2ecc71";
  colorInput;
  onChangeHandler;
  controlContainer;
  // NEW: Container reference
  renderControls(parentDiv, containerId, onChange) {
    const container = parentDiv.querySelector(`#${containerId}`);
    if (!container) {
      console.error(`Container #${containerId} not found!`);
      return;
    }
    this.onChangeHandler = onChange;
    this.controlContainer = container;
    const inputId = `param-${this.id}-color`;
    container.innerHTML = `
            <div class="layer-param">
                <label for="${inputId}">Line Color:</label>
                <input type="color" id="${inputId}" value="${this.defaultColor}">
            </div>
        `;
    this.reinitializeDOMReferences();
    this.attachEventListeners();
    console.log(`[Border Layer] Controls rendered and listeners attached into #${containerId}`);
  }
  reinitializeDOMReferences() {
    const inputId = `param-${this.id}-color`;
    this.colorInput = this.controlContainer?.querySelector(`#${inputId}`);
  }
  attachEventListeners() {
    if (this.colorInput) {
      this.colorInput.addEventListener("input", () => this.handleInputUpdate());
    }
  }
  handleInputUpdate() {
    if (this.onChangeHandler) {
      this.onChangeHandler();
    }
  }
  draw() {
    const TILE_SIZE = this.tileSize;
    const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext("2d");
    const lineColor = this.colorInput?.value ?? this.defaultColor;
    console.log(`[Border Draw] Drawing with color: ${lineColor}`);
    const offset = 0.5;
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.beginPath();
    ctx.rect(0 + offset, 0 + offset, TILE_SIZE - 1, TILE_SIZE - 1);
    ctx.stroke();
    return enforceFullOpacity3(canvas, TILE_SIZE);
  }
};
var MaskBuilderModule = class {
  containerDiv;
  onApplyHandler;
  layers;
  layerState = /* @__PURE__ */ new Map();
  TILE_SIZE = 256;
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.containerDiv = container;
    this.onApplyHandler = params.onApply;
    this.layers = params.layerClasses.map((LayerClass) => new LayerClass());
    console.log(`[MaskBuilder] Created ${this.layers.length} layer instances.`);
    this.layers.forEach((layer) => {
      this.layerState.set(layer.id, { enabled: true });
    });
    this.renderInitialHTML();
    this.delegateControlRendering();
    this.setupEventListeners();
    this.triggerUpdate();
  }
  delegateControlRendering() {
    console.log("[MaskBuilder] Delegating control rendering to layers...");
    const layerChangeHandler = () => this.triggerUpdate();
    this.layers.forEach((layer) => {
      const containerId = `layer-controls-${layer.id}`;
      console.log(`[MaskBuilder] Asking layer '${layer.id}' to render into #${containerId}`);
      layer.renderControls(this.containerDiv, containerId, layerChangeHandler);
    });
  }
  setHandlers(handlers) {
    if (handlers.onApply) {
      this.onApplyHandler = handlers.onApply;
      console.log("[MaskBuilder] OnApply handler updated.");
      this.triggerUpdate();
    }
  }
  renderInitialHTML() {
    const layerListHtml = this.layers.map((layer) => {
      const state = this.layerState.get(layer.id);
      return `
                <details class="module-card">
                    <summary class="module-group-title">
                         <input type="checkbox" id="layer-${layer.id}" data-layer-id="${layer.id}" ${state.enabled ? "checked" : ""}> 
                         ${layer.name}
                    </summary>
                    <div class="layer-controls" id="layer-controls-${layer.id}"></div>
                </details>
            `;
    }).join("");
    this.containerDiv.innerHTML = `
            <style>
                .layer-controls { padding-left: 20px; display: flex; flex-direction: column; gap: 5px;}
                .layer-param { display: flex; align-items: center; gap: 10px; font-size: 0.9em; }
                .layer-param label { min-width: 80px; }
                .layer-param input[type="color"] { width: 50px; height: 25px; border: none; padding: 0; cursor: pointer; }
                .layer-param input[type="number"], .layer-param input[type="text"], .layer-param textarea, .layer-param select { flex-grow: 1; padding: 2px 5px; border: 1px solid #5a708a; background-color: #1e293b; color: white; border-radius: 3px;}
            </style>
            <div class="module-group-title">
             
                    ${layerListHtml}

            </div>
        `;
  }
  setupEventListeners() {
    this.layers.forEach((layer) => {
      const checkbox = this.containerDiv.querySelector(`#layer-${layer.id}`);
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          this.updateLayerEnabledState(layer.id, e.target.checked);
        });
      }
    });
  }
  updateLayerEnabledState(id, isEnabled) {
    const state = this.layerState.get(id);
    if (state) {
      state.enabled = isEnabled;
      console.log(`[MaskBuilder] Layer '${id}' enabled: ${isEnabled}`);
      this.triggerUpdate();
    }
  }
  buildCompositeMask() {
    console.log("[MaskBuilder] Building composite mask...");
    const compositeCanvas = new OffscreenCanvas(this.TILE_SIZE, this.TILE_SIZE);
    const ctx = compositeCanvas.getContext("2d");
    ctx.clearRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    let layersDrawn = 0;
    this.layers.forEach((layer) => {
      const state = this.layerState.get(layer.id);
      if (state && state.enabled) {
        console.log(`[MaskBuilder] Drawing layer: ${layer.name}`);
        const layerTile = layer.draw();
        ctx.drawImage(layerTile, 0, 0);
        layersDrawn++;
      } else {
        console.log(`[MaskBuilder] Skipping disabled layer: ${layer.name}`);
      }
    });
    console.log(`[MaskBuilder] Composite complete. Drew ${layersDrawn} layers.`);
    return enforceFullOpacity3(compositeCanvas, this.TILE_SIZE);
  }
  triggerUpdate() {
    console.log("[MaskBuilder] Mask update triggered!");
    const finalMaskTile = this.buildCompositeMask();
    this.onApplyHandler(finalMaskTile);
    console.log("[MaskBuilder] Final mask tile passed to onApply handler.");
  }
};
function initializeMaskBuilder(container_id = "mask-builder-container", onApplyHandler = (cimage) => {
  console.log(`[Demo OnApply] Mask tile received. Size: ${cimage.width}x${cimage.height}`);
}) {
  const container = document.getElementById(container_id);
  if (!container) {
    console.log(`[Init] Creating container div #${container_id}`);
    const tempDiv = document.createElement("div");
    tempDiv.id = container_id;
    document.body.appendChild(tempDiv);
  }
  const maskLayerClasses = [
    Iso3DPolygonMaskLayer,
    DiamondMaskLayer,
    BorderMaskLayer,
    AdjustableDiamondMaskLayer
    // IsoPolygonMaskLayer, 
  ];
  const maskBuilderInstance = new MaskBuilderModule({
    divId: container_id,
    layerClasses: maskLayerClasses,
    onApply: onApplyHandler
  });
  console.log("[Init] MaskBuilderModule initialized successfully!");
  return maskBuilderInstance;
}

// web/jsP/pallet/MenuIconModule.ts
var MenuIconModule = class {
  containerDiv;
  menuIconList;
  // Map to store all icon configurations for easy access
  iconConfigs = /* @__PURE__ */ new Map();
  // Map to track the currently active linkedDivId for each group
  // Key: group name (string), Value: linkedDivId (string)
  activeGroupMap = /* @__PURE__ */ new Map();
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.containerDiv = container;
    this.containerDiv.innerHTML = this.getInitialStyles();
    const menuIconListElement = this.containerDiv.querySelector(".menu-icon-list");
    if (!menuIconListElement) {
      throw new Error("Could not find '.menu-icon-list' element after setup.");
    }
    this.menuIconList = menuIconListElement;
  }
  /**
   * Internal CSS styles for the module elements.
   */
  getInitialStyles() {
    return `
            <style>
                /* --- Custom styles based on request --- */
                .menu-icon-list {
                    position: absolute;
                    top: 10px;
                    right: 60px;
                    display: flex; /* Arrange icons horizontally */
                    gap: 5px; /* Spacing between icons */
                }
                .menu-icon-list > a {
                    /* Common styles for all icons */
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    background: white;
                    border-radius: 5px;
                    text-align: center;
                    line-height: 30px;
                    font-weight: bold;
                    color: black;
                    text-decoration: none; /* Remove underline from <a> */
                    display: inline-block; /* Required for width/height */
                    transition: background-color 0.2s;
                }
                /* Style for the active/selected icon */
                .menu-icon-list > a.active {
                    background-color: #e67e22; /* Use a color to indicate active state */
                    color: white;
                }
            </style>
            <div class="menu-icon-list">
                </div>
        `;
  }
  /**
   * PUBLIC METHOD: Adds a new icon to the menu and sets up its functionality.
   * @param label The text label to display on the icon (e.g., 'A', 'B').
   * @param linkedDivId The ID of the DOM element to show/hide.
   * @param group The group this icon belongs to (only one per group can be visible).
   * @param callClick OPTIONAL: A function to run when the icon is clicked. 
   * It receives the linkedDivId and the *current* active state (true if active, false if not).
   */
  addIcon(label, linkedDivId, group, callClick) {
    const key = `${group}:${label}`;
    if (this.iconConfigs.has(key)) {
      console.warn(`Icon with key '${key}' already exists. Skipping.`);
      return;
    }
    const config = { label, linkedDivId, group, callClick };
    this.iconConfigs.set(key, config);
    const iconElement = document.createElement("a");
    iconElement.textContent = label;
    iconElement.href = "javascript:void(0)";
    iconElement.dataset.linkedDivId = linkedDivId;
    iconElement.dataset.group = group;
    const linkedElement = document.getElementById(linkedDivId);
    if (linkedElement) {
      linkedElement.style.display = "none";
    } else {
      console.warn(`Linked div with ID "${linkedDivId}" not found in the document.`);
    }
    iconElement.addEventListener("click", () => this.handleIconClick(iconElement, config));
    this.menuIconList.appendChild(iconElement);
  }
  /**
   * Handles the click event for an icon, running the optional callback, 
   * toggling the visibility of linked elements, and updating the icon's active state.
   * @param clickedIcon The HTML anchor element that was clicked.
   * @param config The configuration object for the clicked icon.
   */
  handleIconClick(clickedIcon, config) {
    const group = config.group;
    const linkedDivId = config.linkedDivId;
    const currentActiveDivId = this.activeGroupMap.get(group);
    const linkedDiv = document.getElementById(linkedDivId);
    if (!linkedDiv)
      return;
    const groupIcons = this.menuIconList.querySelectorAll(`a[data-group="${group}"]`);
    if (currentActiveDivId === linkedDivId) {
      linkedDiv.style.display = "none";
      clickedIcon.classList.remove("active");
      this.activeGroupMap.delete(group);
      console.log(`Deactivated: ${linkedDivId} (Group: ${group})`);
    } else {
      if (currentActiveDivId) {
        const oldLinkedDiv = document.getElementById(currentActiveDivId);
        if (oldLinkedDiv) {
          oldLinkedDiv.style.display = "none";
        }
        groupIcons.forEach((icon) => {
          if (icon.dataset.linkedDivId === currentActiveDivId) {
            icon.classList.remove("active");
          }
        });
      }
      linkedDiv.style.display = "block";
      clickedIcon.classList.add("active");
      this.activeGroupMap.set(group, linkedDivId);
      console.log(`Activated: ${linkedDivId} (Group: ${group})`);
    }
    const willBeActive = currentActiveDivId !== linkedDivId;
    if (config.callClick) {
      config.callClick(linkedDivId, willBeActive);
    }
  }
};

// web/jsP/pallet/upload.ts
var Uploader = class {
  serverUrl;
  constructor(serverUrl = "http://localhost:8081") {
    this.serverUrl = serverUrl;
  }
  /**
   * Pushes an OffscreenCanvas as a PNG image to the server.
   * @param canvas The OffscreenCanvas object.
   * @param path The server-side path/filename (e.g., 'screenshots/my_image.png').
   * @returns A promise that resolves to true on success, or false on failure.
   */
  async uploadCanvasImage(canvas, path, file) {
    try {
      const blob = await canvas.convertToBlob({ type: "image/png" });
      if (blob.size === 0) {
        console.error("\u{1F6A8} Canvas conversion failed: Resulting image Blob is empty (size 0).");
        return false;
      }
      const formData = new FormData();
      formData.append("file", blob, file);
      formData.append("path", path + file);
      const response = await fetch(`${this.serverUrl}/upload/image`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Image upload failed: ${response.status} - ${errorBody}`);
        return false;
      }
      console.log(`Canvas image uploaded successfully to ${path}`);
      return true;
    } catch (error) {
      console.error("An error occurred during canvas image upload:", error);
      return false;
    }
  }
  /**
   * Pushes a text string to the server as a file.
   * @param textContent The text content to save.
   * @param path The server-side path/filename (e.g., 'logs/data.txt').
   * @returns A promise that resolves to true on success, or false on failure.
   */
  async uploadTextFile(textContent, path) {
    try {
      const formData = new FormData();
      formData.append("content", textContent);
      formData.append("path", path);
      const response = await fetch(`${this.serverUrl}/upload/text`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Text file upload failed: ${response.status} - ${errorBody}`);
        return false;
      }
      console.log(`Text file uploaded successfully to ${path}`);
      return true;
    } catch (error) {
      console.error("An error occurred during text file upload:", error);
      return false;
    }
  }
};

// web/jsP/pallet/imageActionModule.ts
var ImageActionModule = class {
  containerDiv;
  buttonConfigs = [];
  // Stores the current set of buttons
  buttonElements = /* @__PURE__ */ new Map();
  /**
   * Constructor now only takes the container ID and sets up the basic HTML structure.
   */
  constructor(divId) {
    const container = document.getElementById(divId);
    if (!container) {
      throw new Error(`DOM element with ID "${divId}" not found for Action Module.`);
    }
    this.containerDiv = container;
    this.containerDiv.innerHTML = this.getInitialStyles();
  }
  /**
   * PUBLIC METHOD: Initializes the module, sets the handlers, removes existing buttons,
   * and adds the standard example buttons back.
   * * @param handlers The set of external functions to call when buttons are clicked.
   */
  init() {
    this.removeAllButtons();
    this.renderButtons();
  }
  /**
   * PUBLIC METHOD: Adds a new button configuration dynamically.
   * @param id A unique ID for the button.
   * @param label The text displayed on the button.
   * @param onClick The function to call when the button is clicked.
   * @param getIsDisabled Optional function to determine if the button should be disabled.
   */
  addButton(id, label, onClick, getIsDisabled) {
    const config = { id, label, onClick, getIsDisabled };
    if (this.buttonConfigs.some((b) => b.id === id)) {
      console.warn(`Button with ID "${id}" already exists. Skipping.`);
      return;
    }
    this.buttonConfigs.push(config);
    this.renderButtons();
  }
  /**
   * PUBLIC METHOD: Removes all existing button configurations and re-renders an empty state.
   */
  removeAllButtons() {
    this.buttonConfigs = [];
    this.renderButtons();
  }
  /**
   * PUBLIC METHOD: External application calls this to sync button state.
   */
  updateActionButtons() {
    this.buttonConfigs.forEach((config) => {
      const button = this.buttonElements.get(config.id);
      if (button && config.getIsDisabled) {
        button.disabled = config.getIsDisabled();
      }
    });
  }
  // =========================================================================
  // === INTERNAL RENDERING AND EXAMPLE SETUP ===
  // =========================================================================
  /**
   * INTERNAL METHOD: Renders all buttons based on the current configuration.
   */
  renderButtons() {
    const controlsDiv = this.containerDiv.querySelector(".editor-controls");
    if (!controlsDiv)
      return;
    controlsDiv.innerHTML = "";
    this.buttonElements.clear();
    this.buttonConfigs.forEach((config) => {
      const button = document.createElement("button");
      button.id = config.id;
      button.textContent = config.label;
      if (config.getIsDisabled) {
        button.disabled = config.getIsDisabled();
      }
      button.addEventListener("click", () => {
        config.onClick();
      });
      this.buttonElements.set(config.id, button);
      controlsDiv.appendChild(button);
    });
    this.updateActionButtons();
  }
  /**
   * INTERNAL METHOD: Provides the initial CSS for the control container.
   */
  getInitialStyles() {
    return `
            <style>
                .editor-controls { 
                    padding-top:5px;
                    display: flex; 
                    gap: 8px; 
                }
                .editor-controls button {
                    color: white;
                    font-weight: 600;
                }
                .editor-controls button:disabled { 
                    background-color: #bdc3c7; 
                    cursor: not-allowed; 
                    box-shadow: none;
                }
                .editor-controls button:hover:not(:disabled) { 
                    background-color: #2980b9; 
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
            </style>
            
            <div class="action-module-card">
                <div class="editor-controls">
                    <!-- Buttons will be rendered here after init() is called -->
                </div>
            </div>
        `;
  }
};

// web/jsP/main2.ts
var workspaceModuleInstance = null;
var createEmptyAsset = (label) => ({
  group: "empty",
  label,
  cimage: new OffscreenCanvas(256, 256)
});
var createEmptySheet = (name) => ({
  name,
  cimage: new OffscreenCanvas(256, 256),
  assets: [
    [
      createEmptyAsset("empty_a"),
      createEmptyAsset("empty_b"),
      createEmptyAsset("empty_c"),
      createEmptyAsset("empty_d")
    ]
  ]
});
var editorMenu = new MenuIconModule({
  divId: "menu-icon-container"
});
editorMenu.addIcon("I", "isogame-module", "main-content");
editorMenu.addIcon("T", "isometric-grid-container", "main-content");
editorMenu.addIcon("S", "sheet-editor-module", "main-content");
editorMenu.addIcon("M", "menu2", "action-content");
var handlePaletteRowClickToAdd = (row) => {
  if (workspaceModuleInstance) {
    const rowCopy = row.map((asset) => ({ ...asset }));
    workspaceModuleInstance.addRow(rowCopy);
    console.log(`\u2705 Added new row to workspace from palette! (Row starts with: ${row[0].label})`);
  } else {
    console.error("Workspace module not initialized or accessible.");
  }
};
async function initializeAppWithLinkedModules() {
  console.log("Loading assets...");
  const assetPalette = await AssetLoaderPallet.create();
  if (assetPalette.assetSheets.length === 0) {
    console.error("Asset Loader returned no sheets.");
    return;
  }
  const workspaceSheet = createEmptySheet("My_Custom_Workspace");
  const workspaceDivId = "workspace-container";
  workspaceModuleInstance = new AssetWorkspaceModule({
    assetSheet: workspaceSheet,
    divId: workspaceDivId,
    onSelect: (s) => console.log(`[Workspace State] Selected: ${s.type}`),
    onClickSheet: (asset) => {
      const up = new Uploader();
      up.uploadCanvasImage(asset.cimage, "save/image/", "workspace.png");
    }
  });
  console.log("Workspace Module Initialized.");
  const paletteDivId = "palette-container";
  const selectorModuleInstance = new AssetSelectorModule({
    assetSheets: assetPalette.assetSheets,
    divId: paletteDivId,
    onSelect: (s) => console.log(`[Palette State] Selected: ${s.type}`),
    onClickRow: handlePaletteRowClickToAdd
  });
  console.log("Palette Module Initialized. Click any row in the palette to add it to the workspace!");
  const sheetModulDiv = document.getElementById("sheet-editor-module");
  sheetModulDiv.innerHTML = `
        <div id="sheet-editor-container"></div>
    `;
  const assetSheetEditor = createImageEditor("sheet");
  assetSheetEditor.setHandlers({
    onSave: (image) => {
      const sheet = {
        assets: [],
        name: "Edited Sheet",
        cimage: image.cimage
      };
      workspaceModuleInstance?.loadSheetCImage(sheet.cimage);
    },
    onLoad: () => {
      const sheet = workspaceModuleInstance?.getSheet();
      if (!sheet)
        return;
      const image = { cimage: sheet.cimage };
      return image;
    }
  });
}
function createImageEditor(prefix = "") {
  const imageModulDiv = document.getElementById(`${prefix}-editor-module`);
  imageModulDiv.innerHTML = `
    <style>
        .editor-container {
            display:grid;
            grid-template-columns: 1fr .5fr;
            height: calc(100vh - 50px - 54px);
            overflow: hidden;
            gap: 1rem;
        }
        .editor-controle-container {
            height: 100%;
            overflow: scroll;
            padding-right: 1.5rem;             
        }
    </style>
    <div class="editor-container">

        <div id="${prefix}-editor-container" class="editor-pannel-container"></div>
    
        <div class="editor-controle-container">
            <div id="${prefix}-action-butt-container"></div>
    
            <details class="detail-group" open>
                <summary>Mask</summary>
                <div>
                    <div id="${prefix}-mask-one-container"></div>
                </div>
            </details>
            <details class="detail-group">
                <summary>Color Filtering</summary>
                <div>
                    <div id="${prefix}-editor-color-container"></div>
                    <div id="${prefix}-editor-palette-container"></div>
                    <div id="${prefix}-editor-wrap-container"></div>
                    <div id="${prefix}-editor-filter-container"></div>
                    <div id="${prefix}-editor-enhance-container"></div>
                </div>
            </details>
            <details class="detail-group">
                <summary>OutLine</summary>
                <div>
                    <div id="${prefix}-editor-outline-container"></div>
                    <div id="${prefix}-editor-line-container"></div>
                    <div id="${prefix}-editor-color-line-container"></div>
                </div>
            </details>
            <details class="detail-group">
                <summary>Transforme</summary>
                <div>
                    <div id="${prefix}-editor-transformer-container"></div>
                </div>
            </details>
        </div>
    </div>
    `;
  const actionButt = new ImageActionModule(`${prefix}-action-butt-container`);
  actionButt.addButton("save", "Save", () => {
  });
  const imageEditor = initializeEmptyEditor(`${prefix}-editor-container`);
  const plugins = [
    initializeOutlineEditor(`${prefix}-editor-outline-container`),
    initializeLineEditor(`${prefix}-editor-line-container`),
    initializeColorLineEditor(`${prefix}-editor-color-line-container`),
    initializePaletteEditor(`${prefix}-editor-palette-container`),
    initializeColorEditor(`${prefix}-editor-color-container`),
    initializeTransformerEditor(`${prefix}-editor-transformer-container`),
    // initializeEnhanceEditor(`${prefix}-editor-enhance-container`),
    initializeWarpEditor(`${prefix}-editor-wrap-container`),
    initializeFilterEditor(`${prefix}-editor-filter-container`)
  ];
  const masks = [
    initializeMaskBuilder(`${prefix}-mask-one-container`)
  ];
  imageEditor.setHandlers({
    onImageChange: (image) => {
      plugins.forEach((p) => p.loadImage(image));
    }
  });
  plugins.forEach((p) => {
    p.setHandlers({
      onChange: (image) => {
        imageEditor.loadImage(image);
      }
    });
  });
  masks.forEach((p) => {
    p.setHandlers({
      onApply: (image) => {
        imageEditor.loadMask(image);
      }
    });
  });
  return imageEditor;
}
initializeAppWithLinkedModules();
