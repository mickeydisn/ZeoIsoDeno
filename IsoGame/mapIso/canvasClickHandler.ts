import { IsometricProjector, PointIso } from "./simpleIso/IsometricProjector.ts";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CanvasClickHandlerConf {
  DRAW_TILE_COUNT: number;
  SCALE_SIZE: number;
  SCALE_MOD: number;
}

export interface CanvasClickHandlerDependencies {
  canvas: HTMLCanvasElement;
  mapLvl: Float32Array;
  mapInfo: Float32Array;
  gameWorker: Worker;
  conf: CanvasClickHandlerConf;
}

// ============================================================================
// CanvasClickHandler Class
// ============================================================================

export class CanvasClickHandler {
  // Dependencies
  private canvas: HTMLCanvasElement;
  private mapLvl: Float32Array;
  private mapInfo: Float32Array;
  private gameWorker: Worker;
  
  // Inverse projection
  private projector: IsometricProjector;
  private mapSize: number;
  
  // Hover state
  private lastHoveredTile: PointIso | null = null;
  private lastHoveredGridTile: PointIso | null = null;
  
  private hoverCallback?: (tile: PointIso | null) => void;
  
  // Bound event handlers for cleanup
  private boundClickHandler: (event: MouseEvent) => void;
  private boundMouseMoveHandler: (event: MouseEvent) => void;
  private boundMouseLeaveHandler: () => void;

  constructor(deps: CanvasClickHandlerDependencies) {
    // Store dependencies
    this.canvas = deps.canvas;
    this.mapLvl = deps.mapLvl;
    this.mapInfo = deps.mapInfo;
    this.gameWorker = deps.gameWorker;
    this.mapSize = deps.conf.DRAW_TILE_COUNT;
    
    // Create projector with matching configuration
    // The origin should match the canvas center for proper inverse projection
    this.projector = new IsometricProjector({
      originX: this.canvas.width / 2,
      originY: this.canvas.height / 2 + this.mapSize * 16 * deps.conf.SCALE_SIZE,
      SCALE_SIZE: deps.conf.SCALE_SIZE,
      SCALE_MOD: deps.conf.SCALE_MOD,
    });
    
    // Bind event handlers
    this.boundClickHandler = this.handleClick.bind(this);
    this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
    this.boundMouseLeaveHandler = this.handleMouseLeave.bind(this);
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log("[CanvasClickHandler] Initialized with config:", deps.conf);
  }

  // ============================================================================
  // Event Listener Setup
  // ============================================================================

  private setupEventListeners(): void {
    this.canvas.addEventListener("click", this.boundClickHandler);
    this.canvas.addEventListener("mousemove", this.boundMouseMoveHandler);
    this.canvas.addEventListener("mouseleave", this.boundMouseLeaveHandler);
    
    // Make canvas interactive
    this.canvas.style.cursor = "pointer";
    
    console.log("[CanvasClickHandler] Event listeners attached");
  }

  // ============================================================================
  // Coordinate Conversion
  // ============================================================================

  /**
   * Converts mouse event coordinates to canvas-relative screen coordinates.
   * Accounts for CSS scaling of the canvas element.
   */
  private eventToScreenCoords(event: MouseEvent): { screenX: number; screenY: number } {
    const rect = this.canvas.getBoundingClientRect();
    
    // Calculate scale factors (handles CSS scaling)
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    // Convert to canvas coordinates
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    
    return { screenX, screenY };
  }

  /**
   * Converts screen coordinates to tile coordinates using inverse projection.
   * Uses the shared mapLvl buffer to look up tile heights.
   */
  private screenToTile(screenX: number, screenY: number):  PointIso | null  {
    // Use inverse projection with height lookup
    const result = this.projector.screenToTileWithHeight(
      screenX,
      screenY,
      this.mapLvl,
      this.mapSize,
      this.mapInfo
  );
    
    // Check if result is null before destructuring
    if (result === null) {
      return null;
    }
    
    return result;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  private handleClick(event: MouseEvent): void {
    const { screenX, screenY } = this.eventToScreenCoords(event);
    const tile = this.screenToTile(screenX, screenY);
    
    if (!tile) {
      console.log("[CanvasClickHandler] Click outside map bounds");
      return;
    }
    
    // tile coordinates are already in grid space (0 to mapSize-1)
    const gridX = Math.round(tile.x);
    const gridY = Math.round(tile.y);
    
    console.log(`[CanvasClickHandler] Click at tile (${gridX}, ${gridY}), height: ${tile.z}`);
    
    // Send query for cell info
    this.gameWorker.postMessage({
      action: "query_infoCell",
      gridX: gridX,
      gridY: gridY,
    });
    
    // Send tool click action
    this.gameWorker.postMessage({
      action: "toolClick",
      gridX: gridX,
      gridY: gridY,
    });
  }

  private handleMouseMove(event: MouseEvent): void {
    const { screenX, screenY } = this.eventToScreenCoords(event);
    const tile = this.screenToTile(screenX, screenY);
    
    if (tile) {
      // Check if tile changed
      if (this.hasTileChanged(tile)) {
        this.lastHoveredTile = tile;
        
        // Call hover callback if set
        if (this.hoverCallback) {
          this.hoverCallback(tile);
        }
        // console.log(`[CanvasClickHandler] Hovering tile (${tile.x.toFixed(2)}, ${tile.y.toFixed(2)}), height: ${tile.z.toFixed(2)})`);
      }
    }
  }

  private handleMouseLeave(): void {
    if (this.lastHoveredTile !== null) {
      this.lastHoveredTile = null;
      
      // Call hover callback with null to indicate no tile hovered
      if (this.hoverCallback) {
        this.hoverCallback(null);
      }
      
      // console.log("[CanvasClickHandler] Mouse left canvas");
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Compares two tile coordinates to detect changes.
   * Returns true if tiles are different.
   */
  private hasTileChanged(newTile: PointIso | null): boolean {
    // If both are null, no change
    if (this.lastHoveredTile === null && newTile === null) {
      return false;
    }
    
    // If one is null and other isn't, changed
    if (this.lastHoveredTile === null || newTile === null) {
      return true;
    }
    
    // Compare rounded coordinates
    const lastX = Math.round(this.lastHoveredTile.x);
    const lastY = Math.round(this.lastHoveredTile.y);
    const newX = Math.round(newTile.x);
    const newY = Math.round(newTile.y);
    
    return lastX !== newX || lastY !== newY;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Sets a callback function to be called when the hovered tile changes.
   * @param callback Function that receives the new tile or null if no tile is hovered.
   */
  setHoverCallback(callback: (tile: PointIso | null) => void): void {
    this.hoverCallback = callback;
    // console.log("[CanvasClickHandler] Hover callback set");
  }

  /**
   * Updates the shared buffer references.
   * Call this if the buffers are recreated or swapped.
   */
  updateMapData(mapLvl: Float32Array, mapInfo: Float32Array): void {
    this.mapLvl = mapLvl;
    this.mapInfo = mapInfo;
    // console.log("[CanvasClickHandler] Map data updated");
  }

  /**
   * Updates the projector configuration.
   * Call this if SCALE_SIZE or SCALE_MOD changes.
   */
  updateConfig(conf: CanvasClickHandlerConf): void {
    this.mapSize = conf.DRAW_TILE_COUNT;
    this.projector.updateConf({
      originX: this.canvas.width / 2,
      originY: this.canvas.height / 2 + this.mapSize * 16 * conf.SCALE_SIZE,
      SCALE_SIZE: conf.SCALE_SIZE,
      SCALE_MOD: conf.SCALE_MOD,
    });
    // console.log("[CanvasClickHandler] Config updated:", conf);
  }

  /**
   * Returns the current hovered tile coordinates.
   */
  getLastHoveredTile(): PointIso | null {
    return this.lastHoveredTile;
  }

  /**
   * Removes all event listeners and cleans up resources.
   * Call this before destroying the handler.
   */
  destroy(): void {
    this.canvas.removeEventListener("click", this.boundClickHandler);
    this.canvas.removeEventListener("mousemove", this.boundMouseMoveHandler);
    this.canvas.removeEventListener("mouseleave", this.boundMouseLeaveHandler);
    
    this.canvas.style.cursor = "";
    this.hoverCallback = undefined;
    this.lastHoveredTile = null;
    
    // console.log("[CanvasClickHandler] Destroyed and cleaned up");
  }
}