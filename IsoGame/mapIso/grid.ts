import { CanvasClickHandler, CanvasClickHandlerConf, CanvasClickHandlerDependencies } from "./canvasClickHandler.ts";
import { PointIso } from "./simpleIso/IsometricProjector.ts";

// ============================================================================
// GridMapDrawers - Thin wrapper around CanvasClickHandler
// ============================================================================

/**
 * GridMapDrawers is now a thin wrapper around CanvasClickHandler.
 * It maintains the same constructor signature for backward compatibility
 * while delegating all click/hover functionality to CanvasClickHandler.
 * 
 * The canvas element can be provided via setCanvas() method after construction,
 * which is necessary when the canvas is transferred to an offscreen worker.
 */
export class GridMapDrawers {
  // Dependencies
  gameWorker: Worker;
  bufferMapLvl: SharedArrayBuffer;
  bufferMapInfo: SharedArrayBuffer;
  mapLvl: Float32Array;
  mapInfo: Float32Array;

  // Configuration
  mapSize: number;
  gridSize: number;
  mod: number;

  // Canvas click handler (created when canvas is available)
  private clickHandler: CanvasClickHandler | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private conf: CanvasClickHandlerConf | null = null;

  constructor(
    gameWorker: Worker,
    bufferMapLvl: SharedArrayBuffer,
    bufferMapInfo: SharedArrayBuffer,
  ) {
    this.gameWorker = gameWorker;
    this.bufferMapLvl = bufferMapLvl;
    this.bufferMapInfo = bufferMapInfo;
    this.mapLvl = new Float32Array(this.bufferMapLvl);
    this.mapInfo = new Float32Array(this.bufferMapInfo);

    this.mapSize = 40;
    this.gridSize = 40;
    this.mod = 1;
  }

  /**
   * Sets the canvas element and configuration for click handling.
   * This should be called after construction when the canvas is available.
   * 
   * @param canvas The canvas element to attach click handlers to
   * @param conf Configuration for the click handler
   */
  setCanvas(canvas: HTMLCanvasElement, conf: CanvasClickHandlerConf): void {
    this.canvas = canvas;
    this.conf = conf;
    
    // Create click handler if we have all dependencies
    this.initClickHandler();
  }

  /**
   * Initializes the click handler if all dependencies are available.
   */
  private initClickHandler(): void {
    if (!this.canvas || !this.conf) {
      return;
    }

    // Clean up existing handler if any
    if (this.clickHandler) {
      this.clickHandler.destroy();
    }

    // Create dependencies for CanvasClickHandler
    const deps: CanvasClickHandlerDependencies = {
      canvas: this.canvas,
      mapLvl: this.mapLvl,
      mapInfo: this.mapInfo,
      gameWorker: this.gameWorker,
      conf: this.conf,
    };

    this.clickHandler = new CanvasClickHandler(deps);
    console.log("[GridMapDrawers] CanvasClickHandler initialized");
  }

  /**
   * Sets a callback function to be called when the hovered tile changes.
   * Delegates to the internal CanvasClickHandler.
   */
  setHoverCallback(callback: (tile: PointIso | null) => void): void {
    if (this.clickHandler) {
      this.clickHandler.setHoverCallback(callback);
    }
  }

  /**
   * Updates the grid state.
   * With the new canvas-based approach, this only updates the shared buffer references.
   * No DOM manipulation is needed.
   */
  updateGrid = (): void => {
    // Update the Float32Array views in case buffers were swapped
    this.mapLvl = new Float32Array(this.bufferMapLvl);
    this.mapInfo = new Float32Array(this.bufferMapInfo);

    // Update click handler with new buffer references
    if (this.clickHandler) {
      this.clickHandler.updateMapData(this.mapLvl, this.mapInfo);
    }
  };

  /**
   * Updates the click handler configuration.
   * Call this if SCALE_SIZE or SCALE_MOD changes.
   */
  updateConfig(conf: CanvasClickHandlerConf): void {
    this.conf = conf;
    if (this.clickHandler) {
      this.clickHandler.updateConfig(conf);
    }
  }

  /**
   * Returns the current hovered tile coordinates.
   */
  getLastHoveredTile(): PointIso | null {
    return this.clickHandler?.getLastHoveredTile() ?? null;
  }

  /**
   * Cleans up resources and removes event listeners.
   */
  destroy(): void {
    if (this.clickHandler) {
      this.clickHandler.destroy();
      this.clickHandler = null;
    }
    this.canvas = null;
    this.conf = null;
  }
}