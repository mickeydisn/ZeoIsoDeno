/**
 * Canvas2DPreview — 2D Isometric Canvas Preview Component
 *
 * Renders single tiles and generated building grids using HTML5 Canvas 2D.
 * Supports pan/zoom, face key overlays, and asset outlines.
 */

import type { TileConfig } from "../../../types.ts";

export interface TileGridItem {
  x: number;
  y: number;
  tile: TileConfig;
}

export interface PanZoom {
  x: number;
  y: number;
  zoom: number;
}

// Isometric projection constants
const ISO_ANGLE = 26.565; // degrees (approximate for 2:1 ratio)
const TILE_WIDTH = 64;    // pixels at zoom 1
const TILE_HEIGHT = 32;   // pixels at zoom 1 (2:1 ratio)

// Face key colors for overlays
const FACE_COLORS: Record<number, string> = {
  0: "rgba(74, 158, 255, 0.4)",  // NW - blue
  1: "rgba(76, 175, 80, 0.4)",   // NE - green
  2: "rgba(255, 152, 0, 0.4)",   // SE - orange
  3: "rgba(158, 158, 158, 0.4)", // SW - grey
};

export class Canvas2DPreview {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private panZoom: PanZoom = { x: 0, y: 0, zoom: 1 };
  private isPanning = false;
  private lastMouse = { x: 0, y: 0 };
  private tiles: TileGridItem[] = [];
  private singleTile: TileConfig | null = null;
  private showFaceOverlay = true;
  private showAssetOutlines = false;
  private assetImages: Map<string, HTMLImageElement> = new Map();
  private onTileClick: ((tile: TileConfig, x: number, y: number) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = "canvas-container";

    // Create canvas element
    this.canvas = document.createElement("canvas");
    this.canvas.className = "preview-canvas";
    this.container.appendChild(this.canvas);

    // Get rendering context
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D rendering context");
    }
    this.ctx = ctx;

    // Setup event handlers
    this.setupEventHandlers();

    // Set initial canvas size
    this.resizeCanvas();
  }

  /**
   * Setup mouse event handlers for pan/zoom.
   */
  private setupEventHandlers(): void {
    // Mouse down - start pan
    this.canvas.addEventListener("mousedown", (e) => {
      this.isPanning = true;
      this.lastMouse = { x: e.offsetX, y: e.offsetY };

      // Check for tile click
      this.handleTileClick(e);
    });

    // Mouse move - pan
    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.isPanning) return;
      const dx = e.offsetX - this.lastMouse.x;
      const dy = e.offsetY - this.lastMouse.y;
      this.panZoom.x += dx;
      this.panZoom.y += dy;
      this.lastMouse = { x: e.offsetX, y: e.offsetY };
      this.render();
    });

    // Mouse up - stop pan
    this.canvas.addEventListener("mouseup", () => {
      this.isPanning = false;
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.isPanning = false;
    });

    // Wheel - zoom
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(5, this.panZoom.zoom * delta));

      // Zoom toward mouse position
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.panZoom.x = mouseX - (mouseX - this.panZoom.x) * (newZoom / this.panZoom.zoom);
      this.panZoom.y = mouseY - (mouseY - this.panZoom.y) * (newZoom / this.panZoom.zoom);
      this.panZoom.zoom = newZoom;

      this.render();
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
      this.render();
    });
    resizeObserver.observe(this.container);
  }

  /**
   * Handle tile click detection.
   */
  private handleTileClick(e: MouseEvent): void {
    if (!this.onTileClick || !this.tiles.length) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen coords to grid coords (reverse isometric transform)
    const canvasX = (mouseX - this.panZoom.x) / this.panZoom.zoom;
    const canvasY = (mouseY - this.panZoom.y) / this.panZoom.zoom;

    // Find clicked tile
    for (const item of this.tiles) {
      const tileScreen = this.gridToScreen(item.x, item.y);
      const halfW = TILE_WIDTH / 2;
      const halfH = TILE_HEIGHT / 2;

      // Simple hit test using diamond bounds
      const dx = Math.abs(canvasX - tileScreen.x);
      const dy = Math.abs(canvasY - tileScreen.y);
      if (dx / halfW + dy / halfH <= 1) {
        this.onTileClick(item.tile, item.x, item.y);
        return;
      }
    }
  }

  /**
   * Resize canvas to fit container.
   */
  private resizeCanvas(): void {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);

    // Center the view
    if (this.tiles.length === 0 && !this.singleTile) return;
    this.centerView();
  }

  /**
   * Center the view on content.
   */
  private centerView(): void {
    const rect = this.container.getBoundingClientRect();
    const contentWidth = rect.width;
    const contentHeight = rect.height;

    this.panZoom.x = contentWidth / 2;
    this.panZoom.y = contentHeight / 3;
    this.panZoom.zoom = Math.min(1, contentWidth / 400);
  }

  /**
   * Convert grid coordinates to screen coordinates (isometric projection).
   */
  private gridToScreen(x: number, y: number): { x: number; y: number } {
    const tileW = TILE_WIDTH * this.panZoom.zoom;
    const tileH = TILE_HEIGHT * this.panZoom.zoom;

    return {
      x: (x - y) * (tileW / 2),
      y: (x + y) * (tileH / 2),
    };
  }

  /**
   * Render a single tile configuration.
   */
  renderTile(tile: TileConfig, assets?: Map<string, HTMLImageElement>): void {
    this.singleTile = tile;
    this.tiles = [];
    if (assets) this.assetImages = assets;

    // Center view
    const rect = this.container.getBoundingClientRect();
    this.panZoom.x = rect.width / 2;
    this.panZoom.y = rect.height / 2;
    this.panZoom.zoom = 2;

    this.render();
  }

  /**
   * Render a generated building grid.
   */
  renderGrid(
    tiles: TileGridItem[],
    options?: { showFaceOverlay?: boolean; showAssetOutlines?: boolean }
  ): void {
    this.tiles = tiles;
    this.singleTile = null;
    this.showFaceOverlay = options?.showFaceOverlay ?? this.showFaceOverlay;
    this.showAssetOutlines = options?.showAssetOutlines ?? this.showAssetOutlines;

    this.centerView();
    this.render();
  }

  /**
   * Main render function.
   */
  render(): void {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Save context and apply transform
    this.ctx.save();
    this.ctx.translate(this.panZoom.x, this.panZoom.y);
    this.ctx.scale(this.panZoom.zoom, this.panZoom.zoom);

    if (this.singleTile) {
      this.drawSingleTile(this.singleTile);
    } else {
      this.drawGrid();
    }

    this.ctx.restore();
  }

  /**
   * Draw a single tile at origin.
   */
  private drawSingleTile(tile: TileConfig): void {
    this.drawTileRhombus(0, 0, tile, true);
  }

  /**
   * Draw the entire grid.
   */
  private drawGrid(): void {
    // Sort tiles by depth (back to front)
    const sortedTiles = [...this.tiles].sort((a, b) => {
      return (a.x + a.y) - (b.x + b.y);
    });

    for (const item of sortedTiles) {
      this.drawTileRhombus(item.x, item.y, item.tile, false);
    }
  }

  /**
   * Draw a single tile rhombus.
   */
  private drawTileRhombus(x: number, y: number, tile: TileConfig, showLabels: boolean): void {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    // Rhombus vertices (screen space before transform)
    const vertices = [
      { x: 0, y: -halfH },  // top (NW)
      { x: halfW, y: 0 },   // right (NE)
      { x: 0, y: halfH },   // bottom (SE)
      { x: -halfW, y: 0 },  // left (SW)
    ];

    // Translate to grid position
    const screenPos = { x, y: 0 }; // Simplified - in real iso, use proper grid mapping

    // Tile background
    this.ctx.beginPath();
    const baseX = x * halfW - y * halfW;
    const baseY = x * halfH + y * halfH;

    this.ctx.moveTo(baseX + vertices[0].x, baseY + vertices[0].y);
    this.ctx.lineTo(baseX + vertices[1].x, baseY + vertices[1].y);
    this.ctx.lineTo(baseX + vertices[2].x, baseY + vertices[2].y);
    this.ctx.lineTo(baseX + vertices[3].x, baseY + vertices[3].y);
    this.ctx.closePath();

    // Fill with color based on tile properties
    let fillColor = "#3a3a4e";
    if (tile.empty) fillColor = "#2a2a3e";
    else if (tile.color) {
      const [r, g, b] = tile.color;
      fillColor = `rgb(${r}, ${g}, ${b})`;
    }
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    // Stroke
    this.ctx.strokeStyle = "#606078";
    this.ctx.lineWidth = 1 / this.panZoom.zoom;
    this.ctx.stroke();

    // Face key overlays
    if (this.showFaceOverlay && tile.face) {
      tile.face.forEach((faceKey, i) => {
        if (!faceKey) return;

        const color = FACE_COLORS[i] || "rgba(158, 158, 158, 0.4)";
        this.ctx.fillStyle = color;

        // Draw a small colored rectangle at each face direction
        const faceSize = 8 / this.panZoom.zoom;
        let faceX = baseX;
        let faceY = baseY;

        // Offset based on direction
        const offsets = [
          { x: 0, y: -halfH * 0.6 },     // NW
          { x: halfW * 0.6, y: 0 },      // NE
          { x: 0, y: halfH * 0.6 },      // SE
          { x: -halfW * 0.6, y: 0 },     // SW
        ];

        faceX += offsets[i].x;
        faceY += offsets[i].y;

        this.ctx.fillRect(
          faceX - faceSize / 2,
          faceY - faceSize / 2,
          faceSize,
          faceSize
        );

        // Label
        if (showLabels) {
          this.ctx.fillStyle = "#ffffff";
          this.ctx.font = `${10 / this.panZoom.zoom}px monospace`;
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";

          // Truncate long face keys
          const displayKey = faceKey.length > 8 ? faceKey.substring(0, 7) + "…" : faceKey;
          this.ctx.fillText(displayKey, faceX, faceY);
        }
      });
    }

    // Weight indicator
    if (showLabels && tile.weight !== undefined) {
      this.ctx.fillStyle = "#a0a0b8";
      this.ctx.font = `${9 / this.panZoom.zoom}px sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(`w:${tile.weight}`, baseX, baseY + halfH * 0.3);
    }

    // Asset outlines (placeholder)
    if (this.showAssetOutlines && tile.assets && tile.assets.length > 0) {
      this.ctx.strokeStyle = "#ff9800";
      this.ctx.lineWidth = 2 / this.panZoom.zoom;
      this.ctx.strokeRect(
        baseX - halfW * 0.3,
        baseY - halfH * 0.3,
        halfW * 0.6,
        halfH * 0.6
      );
    }
  }

  /**
   * Set tile click handler.
   */
  setOnTileClick(handler: (tile: TileConfig, x: number, y: number) => void): void {
    this.onTileClick = handler;
  }

  /**
   * Set asset images for rendering.
   */
  setAssetImages(images: Map<string, HTMLImageElement>): void {
    this.assetImages = images;
  }

  /**
   * Reset view to center.
   */
  resetView(): void {
    this.centerView();
    this.render();
  }

  /**
   * Set zoom level.
   */
  setZoom(zoom: number): void {
    this.panZoom.zoom = Math.max(0.5, Math.min(5, zoom));
    this.render();
  }

  /**
   * Get current zoom level.
   */
  getZoom(): number {
    return this.panZoom.zoom;
  }

  /**
   * Toggle face overlay visibility.
   */
  toggleFaceOverlay(): void {
    this.showFaceOverlay = !this.showFaceOverlay;
    this.render();
  }

  /**
   * Toggle asset outline visibility.
   */
  toggleAssetOutlines(): void {
    this.showAssetOutlines = !this.showAssetOutlines;
    this.render();
  }

  /**
   * Get current settings state.
   */
  getSettings(): { showFaceOverlay: boolean; showAssetOutlines: boolean } {
    return {
      showFaceOverlay: this.showFaceOverlay,
      showAssetOutlines: this.showAssetOutlines,
    };
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.container.innerHTML = "";
    this.assetImages.clear();
    this.onTileClick = null;
  }
}