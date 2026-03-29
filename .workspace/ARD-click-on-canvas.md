# ARD: Canvas Click-to-Tile Detection

## Problem Statement

The current implementation in `IsoGame/mapIso/grid.ts` attempts to align a CSS-transformed div grid with the isometric canvas rendering in `IsoGame/mapIso/canvasMapDrawer.ts`. This approach has significant issues:

1. **Misalignment**: CSS 3D transforms (`rotateX(60deg) rotateZ(45deg)`) don't match the mathematical isometric projection
2. **Zoom Issues**: The div grid doesn't properly scale with zoom levels
3. **Mode Changes**: Grid alignment breaks when switching modes
4. **Performance**: Maintaining a parallel DOM structure is inefficient

## Current Architecture Analysis

### Canvas Rendering (canvasMapDrawer.ts)
- Uses `IsometricProjector` for 3D-to-2D projection
- Transformation matrix:
  ```
  x_screen = originX + (x_tile * 32 * SCALE_SIZE) + (y_tile * -32 * SCALE_SIZE)
  y_screen = originY - (x_tile * 16 * SCALE_SIZE) - (y_tile * 16 * SCALE_SIZE) - (z * ISO_LVL_SCALE / SCALE_MOD)
  ```

### Grid Overlay (grid.ts)
- Creates 40x40 div grid
- Applies CSS transforms to match canvas
- Calculates tile coordinates from div indices
- **Problem**: CSS transforms cannot precisely match mathematical projection

## Proposed Solution: Inverse Isometric Projection

### Core Concept
Instead of maintaining a parallel div grid, implement **inverse projection** to convert screen coordinates (click position) directly to tile coordinates using mathematics.

### Mathematical Foundation

**Forward Projection** (3D → 2D):
```
screen_x = originX + (tile_x * scale_x) + (tile_y * -scale_x)
screen_y = originY - (tile_x * scale_y) - (tile_y * scale_y) - (tile_z * z_scale)
```

Where:
- `scale_x = 32 * SCALE_SIZE`
- `scale_y = 16 * SCALE_SIZE`
- `z_scale = ISO_LVL_SCALE / SCALE_MOD`

**Inverse Projection** (2D → 3D):
Given screen coordinates (sx, sy), we need to find tile coordinates (tx, ty, tz).

Let:
- `dx = sx - originX`
- `dy = originY - sy`

From the forward equations:
```
dx = tx * scale_x + ty * (-scale_x)
dy = tx * scale_y + ty * scale_y + tz * z_scale
```

Solving for tx and ty (assuming tz = 0 for floor detection):
```
tx = (dx + dy) / (2 * scale_x)
ty = (dy - dx) / (2 * scale_x)
```

For height detection, we iterate through possible z values or use the map level data.

## Implementation Plan

### Phase 1: Create Inverse Projection Module

**File**: `IsoGame/mapIso/simpleIso/IsometricProjector.ts`

Add methods to `IsometricProjector` class:

```typescript
/**
 * Converts screen coordinates to tile coordinates (inverse projection)
 * @param screenX Screen X coordinate
 * @param screenY Screen Y coordinate
 * @param tileZ Optional Z level to test (default: 0)
 * @returns Tile coordinates { x, y, z } or null if invalid
 */
screenToTile(screenX: number, screenY: number, tileZ: number = 0): PointIso | null {
  // Apply offset
  const adjustedX = screenX - this.conf.originX;
  const adjustedY = this.conf.originY - screenY;
  
  const scale_x = 32 * this.conf.SCALE_SIZE;
  const scale_y = 16 * this.conf.SCALE_SIZE;
  const z_scale = ISO_LVL_SCALE / this.conf.SCALE_MOD;
  
  // Account for Z offset
  const zOffset = tileZ * z_scale;
  const dy = adjustedY - zOffset;
  
  // Solve the system of equations
  const tileX = (adjustedX + dy) / (2 * scale_x) + this.conf.offsetX;
  const tileY = (dy - adjustedX) / (2 * scale_x) + this.conf.offsetY;
  
  return new PointIso(tileX, tileY, tileZ);
}

/**
 * Finds the tile at screen coordinates considering height
 * @param screenX Screen X coordinate
 * @param screenY Screen Y coordinate
 * @param mapLevelData Float32Array of tile levels
 * @param mapSize Map size (width/height)
 * @param centerX Current center X of view
 * @param centerY Current center Y of view
 * @returns Tile coordinates with correct Z level
 */
screenToTileWithHeight(
  screenX: number,
  screenY: number,
  mapLevelData: Float32Array,
  mapSize: number,
  centerX: number,
  centerY: number
): PointIso | null {
  // First, get base tile at z=0
  const baseTile = this.screenToTile(screenX, screenY, 0);
  if (!baseTile) return null;
  
  // Round to nearest tile
  const tileX = Math.round(baseTile.x);
  const tileY = Math.round(baseTile.y);
  
  // Check bounds
  if (tileX < 0 || tileX >= mapSize || tileY < 0 || tileY >= mapSize) {
    return null;
  }
  
  // Get the actual height from map data
  const tileIndex = tileX * mapSize + tileY;
  const tileHeight = mapLevelData[tileIndex] || 0;
  
  // Recalculate with correct height
  return this.screenToTile(screenX, screenY, tileHeight);
}
```

### Phase 2: Create Canvas Click Handler

**File**: `IsoGame/mapIso/canvasClickHandler.ts` (new file)

```typescript
export class CanvasClickHandler {
  private canvas: HTMLCanvasElement;
  private projector: IsometricProjector;
  private mapLvl: Float32Array;
  private mapInfo: Float32Array;
  private mapSize: number;
  private gameWorker: Worker;
  
  // For hover detection
  private lastHoveredTile: PointIso | null = null;
  private hoverCallback?: (tile: PointIso | null) => void;
  
  constructor(
    canvas: HTMLCanvasElement,
    projector: IsometricProjector,
    mapLvl: Float32Array,
    mapInfo: Float32Array,
    mapSize: number,
    gameWorker: Worker
  ) {
    this.canvas = canvas;
    this.projector = projector;
    this.mapLvl = mapLvl;
    this.mapInfo = mapInfo;
    this.mapSize = mapSize;
    this.gameWorker = gameWorker;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
  
  private handleClick(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    
    const centerX = this.mapInfo[0];
    const centerY = this.mapInfo[1];
    
    const tile = this.projector.screenToTileWithHeight(
      screenX,
      screenY,
      this.mapLvl,
      this.mapSize,
      centerX,
      centerY
    );
    
    if (tile) {
      // Send to game worker
      this.gameWorker.postMessage({
        action: "query_infoCell",
        gridX: tile.x,
        gridY: tile.y,
      });
      
      this.gameWorker.postMessage({
        action: "toolClick",
        gridX: tile.x,
        gridY: tile.y,
      });
      
      console.log("Click detected at tile:", tile.x, tile.y, tile.z);
    }
  }
  
  private handleMouseMove(event: MouseEvent) {
    if (!this.hoverCallback) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    
    const centerX = this.mapInfo[0];
    const centerY = this.mapInfo[1];
    
    const tile = this.projector.screenToTileWithHeight(
      screenX,
      screenY,
      this.mapLvl,
      this.mapSize,
      centerX,
      centerY
    );
    
    // Only callback if tile changed
    if (this.hasTileChanged(this.lastHoveredTile, tile)) {
      this.lastHoveredTile = tile;
      this.hoverCallback(tile);
    }
  }
  
  private handleMouseLeave() {
    if (this.hoverCallback && this.lastHoveredTile) {
      this.lastHoveredTile = null;
      this.hoverCallback(null);
    }
  }
  
  private hasTileChanged(prev: PointIso | null, curr: PointIso | null): boolean {
    if (prev === null && curr === null) return false;
    if (prev === null || curr === null) return true;
    return prev.x !== curr.x || prev.y !== curr.y || prev.z !== curr.z;
  }
  
  setHoverCallback(callback: (tile: PointIso | null) => void) {
    this.hoverCallback = callback;
  }
  
  updateMapData(mapLvl: Float32Array, mapInfo: Float32Array) {
    this.mapLvl = mapLvl;
    this.mapInfo = mapInfo;
  }
  
  destroy() {
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}
```

### Phase 3: Integrate with CanvasMapDrawers

**File**: `IsoGame/mapIso/canvasMapDrawer.ts`

Add hover rendering support:

```typescript
// Add to class properties
private hoveredTile: PointIso | null = null;
private hoverLayer: OffscreenCanvas;
private hoverCtx: OffscreenCanvasRenderingContext2D;

// Add to constructor
this.hoverLayer = createCanvas(width, height);
this.hoverCtx = this.hoverLayer.getContext("2d") as OffscreenCanvasRenderingContext2D;

// Add method to set hovered tile
setHoveredTile(tile: PointIso | null) {
  this.hoveredTile = tile;
}

// Modify drawIso to include hover overlay
drawIso() {
  const size = this.conf.DRAW_TILE_COUNT;
  this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  // Draw tiles
  for (let x = 1; x < size - 1; x++) {
    for (let y = 1; y < size - 1; y++) {
      this.drawTile(x, y);
    }
  }
  
  // Draw hover overlay
  this.drawHoverOverlay();
  
  this._cleanCache();
}

// Add hover overlay drawing
private drawHoverOverlay() {
  this.hoverCtx.clearRect(0, 0, this.hoverLayer.width, this.hoverLayer.height);
  
  if (!this.hoveredTile) return;
  
  // Draw highlight on hovered tile
  const size = this.conf.DRAW_TILE_COUNT;
  const xx = size - Math.round(this.hoveredTile.x) - 1;
  const yy = size - Math.round(this.hoveredTile.y) - 1;
  
  // Create highlight shape
  const highlightColor = new Color(255, 255, 100, 0.3);
  const lvl = this.hoveredTile.z * LVL_Z_SCALE_FACTOR * this.conf.SCALE_SIZE / this.conf.SCALE_MOD;
  
  this.isomer.add(
    Shape.SurfaceFlat(new Point(xx, yy, lvl - 0.99), 1, 1, 0.02),
    highlightColor
  );
  
  // Composite hover layer onto main canvas
  this.canvasCtx.drawImage(this.hoverLayer, 0, 0);
}
```

### Phase 4: Remove Grid Div System

**File**: `IsoGame/mapIso/grid.ts`

Replace the entire grid system with a simple wrapper:

```typescript
export class GridMapManager {
  private clickHandler: CanvasClickHandler;
  
  constructor(
    canvas: HTMLCanvasElement,
    projector: IsometricProjector,
    mapLvl: Float32Array,
    mapInfo: Float32Array,
    mapSize: number,
    gameWorker: Worker
  ) {
    this.clickHandler = new CanvasClickHandler(
      canvas,
      projector,
      mapLvl,
      mapInfo,
      mapSize,
      gameWorker
    );
  }
  
  setHoverCallback(callback: (tile: PointIso | null) => void) {
    this.clickHandler.setHoverCallback(callback);
  }
  
  updateMapData(mapLvl: Float32Array, mapInfo: Float32Array) {
    this.clickHandler.updateMapData(mapLvl, mapInfo);
  }
  
  destroy() {
    this.clickHandler.destroy();
  }
}
```

## Edge Detection (Bonus Feature 1)

Add edge detection by checking if click is near tile boundaries:

```typescript
/**
 * Detects if click is on tile edge and returns edge information
 */
detectEdge(
  screenX: number,
  screenY: number,
  tile: PointIso
): { edge: 'NE' | 'NW' | 'SE' | 'SW' | null, position: number } {
  // Get tile corners in screen space
  const corners = this.getTileCorners(tile);
  
  // Check distance to each edge
  const edges = [
    { name: 'NE', p1: corners[0], p2: corners[1] },
    { name: 'NW', p1: corners[1], p2: corners[2] },
    { name: 'SW', p1: corners[2], p2: corners[3] },
    { name: 'SE', p1: corners[3], p2: corners[0] },
  ];
  
  const EDGE_THRESHOLD = 10; // pixels
  
  for (const edge of edges) {
    const distance = this.distanceToLineSegment(
      screenX, screenY,
      edge.p1.x, edge.p1.y,
      edge.p2.x, edge.p2.y
    );
    
    if (distance < EDGE_THRESHOLD) {
      return {
        edge: edge.name as 'NE' | 'NW' | 'SE' | 'SW',
        position: distance / EDGE_THRESHOLD
      };
    }
  }
  
  return { edge: null, position: 0 };
}

private getTileCorners(tile: PointIso): PointIso[] {
  const corners = [
    new PointIso(tile.x + 0.5, tile.y, tile.z),
    new PointIso(tile.x, tile.y + 0.5, tile.z),
    new PointIso(tile.x - 0.5, tile.y, tile.z),
    new PointIso(tile.x, tile.y - 0.5, tile.z),
  ];
  
  return corners.map(c => this.translatePoint(c));
}

private distanceToLineSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}
```

---

## Additional Bonus Features

### Bonus 3: Multi-Tile Selection (Drag Select)

Allow users to drag-select multiple tiles for batch operations.

```typescript
export class MultiTileSelector {
  private isDragging: boolean = false;
  private dragStart: PointIso | null = null;
  private dragEnd: PointIso | null = null;
  private selectedTiles: Set<string> = new Set();
  private selectionCallback?: (tiles: PointIso[]) => void;
  
  constructor(
    private canvas: HTMLCanvasElement,
    private projector: IsometricProjector,
    private mapLvl: Float32Array,
    private mapSize: number
  ) {
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }
  
  private handleMouseDown(event: MouseEvent) {
    if (event.button !== 0) return; // Only left click
    if (!event.shiftKey) return; // Require Shift key for drag select
    
    const tile = this.screenToTile(event);
    if (tile) {
      this.isDragging = true;
      this.dragStart = tile;
      this.dragEnd = tile;
      this.selectedTiles.clear();
      this.updateSelection();
    }
  }
  
  private handleMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    
    const tile = this.screenToTile(event);
    if (tile) {
      this.dragEnd = tile;
      this.updateSelection();
    }
  }
  
  private handleMouseUp() {
    if (this.isDragging && this.selectionCallback) {
      const tiles = Array.from(this.selectedTiles).map(key => {
        const [x, y] = key.split(':').map(Number);
        return new PointIso(x, y, 0);
      });
      this.selectionCallback(tiles);
    }
    this.isDragging = false;
  }
  
  private updateSelection() {
    if (!this.dragStart || !this.dragEnd) return;
    
    this.selectedTiles.clear();
    
    const minX = Math.min(this.dragStart.x, this.dragEnd.x);
    const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
    const minY = Math.min(this.dragStart.y, this.dragEnd.y);
    const maxY = Math.max(this.dragStart.y, this.dragEnd.y);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        this.selectedTiles.add(`${x}:${y}`);
      }
    }
  }
  
  getSelectedTiles(): PointIso[] {
    return Array.from(this.selectedTiles).map(key => {
      const [x, y] = key.split(':').map(Number);
      return new PointIso(x, y, 0);
    });
  }
  
  clearSelection() {
    this.selectedTiles.clear();
    this.dragStart = null;
    this.dragEnd = null;
  }
  
  setSelectionCallback(callback: (tiles: PointIso[]) => void) {
    this.selectionCallback = callback;
  }
}
```

### Bonus 4: Right-Click Context Menu

Show a context menu with tile-specific actions on right-click.

```typescript
export class TileContextMenu {
  private menu: HTMLElement | null = null;
  private currentTile: PointIso | null = null;
  private actions: Map<string, (tile: PointIso) => void> = new Map();
  
  constructor(private canvas: HTMLCanvasElement) {
    this.createMenuElement();
    this.setupEventListeners();
    this.registerDefaultActions();
  }
  
  private createMenuElement() {
    this.menu = document.createElement('div');
    this.menu.className = 'tile-context-menu';
    this.menu.style.cssText = `
      position: fixed;
      background: rgba(40, 40, 40, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 4px 0;
      min-width: 150px;
      z-index: 10000;
      display: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    `;
    document.body.appendChild(this.menu);
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    document.addEventListener('click', this.hide.bind(this));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }
  
  private registerDefaultActions() {
    this.addAction('info', '📋 Show Info', (tile) => {
      console.log('Show info for tile:', tile);
    });
    
    this.addAction('copyCoords', '📐 Copy Coords', (tile) => {
      navigator.clipboard.writeText(`${tile.x}, ${tile.y}, ${tile.z}`);
    });
    
    this.addAction('teleport', '🚀 Teleport Here', (tile) => {
      console.log('Teleport to:', tile);
    });
    
    this.addAction('measure', '📏 Measure Distance', (tile) => {
      console.log('Measure from current position to:', tile);
    });
  }
  
  private handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    
    // Get tile at click position (would need projector reference)
    this.currentTile = new PointIso(0, 0, 0); // Placeholder
    
    this.show(event.clientX, event.clientY);
  }
  
  private show(x: number, y: number) {
    if (!this.menu) return;
    
    this.menu.innerHTML = '';
    
    // Add tile coordinates header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 8px 12px;
      font-size: 11px;
      color: #888;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 4px;
    `;
    header.textContent = this.currentTile 
      ? `Tile: ${this.currentTile.x}, ${this.currentTile.y}`
      : 'No tile selected';
    this.menu.appendChild(header);
    
    // Add actions
    this.actions.forEach((callback, id) => {
      const item = document.createElement('div');
      item.className = 'context-menu-item';
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        color: #ddd;
        transition: background 0.15s;
      `;
      item.textContent = this.getActionLabel(id);
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(100, 150, 255, 0.3)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        if (this.currentTile) {
          callback(this.currentTile);
        }
        this.hide();
      });
      
      this.menu.appendChild(item);
    });
    
    // Position menu
    const menuRect = this.menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let posX = x;
    let posY = y;
    
    if (x + menuRect.width > viewportWidth) {
      posX = x - menuRect.width;
    }
    if (y + menuRect.height > viewportHeight) {
      posY = y - menuRect.height;
    }
    
    this.menu.style.left = `${posX}px`;
    this.menu.style.top = `${posY}px`;
    this.menu.style.display = 'block';
  }
  
  hide() {
    if (this.menu) {
      this.menu.style.display = 'none';
    }
  }
  
  addAction(id: string, label: string, callback: (tile: PointIso) => void) {
    this.actions.set(id, callback);
  }
  
  private getActionLabel(id: string): string {
    const labels: Record<string, string> = {
      'info': '📋 Show Info',
      'copyCoords': '📐 Copy Coords',
      'teleport': '🚀 Teleport Here',
      'measure': '📏 Measure Distance',
    };
    return labels[id] || id;
  }
  
  setTile(tile: PointIso | null) {
    this.currentTile = tile;
  }
  
  destroy() {
    if (this.menu) {
      document.body.removeChild(this.menu);
    }
  }
}
```

### Bonus 5: Keyboard Modifiers Support

Support different click behaviors with keyboard modifiers.

```typescript
export class ClickModifierHandler {
  private currentModifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
  } = {
    shift: false,
    ctrl: false,
    alt: false
  };
  
  constructor(private canvas: HTMLCanvasElement) {
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.currentModifiers.shift = e.shiftKey;
      this.currentModifiers.ctrl = e.ctrlKey || e.metaKey;
      this.currentModifiers.alt = e.altKey;
    });
    
    document.addEventListener('keyup', (e) => {
      this.currentModifiers.shift = e.shiftKey;
      this.currentModifiers.ctrl = e.ctrlKey || e.metaKey;
      this.currentModifiers.alt = e.altKey;
    });
  }
  
  getClickAction(): 'select' | 'info' | 'teleport' | 'measure' | 'copy' {
    if (this.currentModifiers.shift) return 'select';
    if (this.currentModifiers.ctrl) return 'info';
    if (this.currentModifiers.alt) return 'teleport';
    return 'select';
  }
  
  getCursor(): string {
    switch (this.getClickAction()) {
      case 'select': return 'pointer';
      case 'info': return 'help';
      case 'teleport': return 'crosshair';
      case 'measure': return 'cell';
      default: return 'default';
    }
  }
  
  updateCursor() {
    this.canvas.style.cursor = this.getCursor();
  }
}
```

### Bonus 6: Coordinate Display on Hover

Show tile coordinates in a tooltip when hovering.

```typescript
export class CoordinateTooltip {
  private tooltip: HTMLElement | null = null;
  
  constructor() {
    this.createTooltip();
  }
  
  private createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tile-coordinate-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
      pointer-events: none;
      z-index: 9999;
      display: none;
      white-space: nowrap;
    `;
    document.body.appendChild(this.tooltip);
  }
  
  show(tile: PointIso, screenX: number, screenY: number) {
    if (!this.tooltip) return;
    
    this.tooltip.textContent = `X: ${tile.x}  Y: ${tile.y}  Z: ${tile.z}`;
    this.tooltip.style.left = `${screenX + 15}px`;
    this.tooltip.style.top = `${screenY + 15}px`;
    this.tooltip.style.display = 'block';
  }
  
  hide() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }
  
  destroy() {
    if (this.tooltip) {
      document.body.removeChild(this.tooltip);
    }
  }
}
```

### Bonus 7: Distance Measurement

Measure distance between two clicked tiles.

```typescript
export class DistanceMeasurer {
  private startPoint: PointIso | null = null;
  private endPoint: PointIso | null = null;
  private isMeasuring: boolean = false;
  private measurementLine: HTMLElement | null = null;
  
  constructor(
    private canvas: HTMLCanvasElement,
    private projector: IsometricProjector
  ) {
    this.createMeasurementLine();
  }
  
  private createMeasurementLine() {
    this.measurementLine = document.createElement('div');
    this.measurementLine.className = 'measurement-line';
    this.measurementLine.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 100;
      display: none;
    `;
  }
  
  startMeasurement(tile: PointIso) {
    this.startPoint = tile;
    this.isMeasuring = true;
  }
  
  updateMeasurement(tile: PointIso) {
    if (!this.isMeasuring || !this.startPoint) return;
    
    this.endPoint = tile;
    this.drawLine();
  }
  
  endMeasurement(): { distance: number; dx: number; dy: number; dz: number } | null {
    if (!this.startPoint || !this.endPoint) {
      this.cancelMeasurement();
      return null;
    }
    
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    const dz = this.endPoint.z - this.startPoint.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    this.isMeasuring = false;
    this.startPoint = null;
    this.endPoint = null;
    
    return { distance, dx, dy, dz };
  }
  
  cancelMeasurement() {
    this.isMeasuring = false;
    this.startPoint = null;
    this.endPoint = null;
    if (this.measurementLine) {
      this.measurementLine.style.display = 'none';
    }
  }
  
  private drawLine() {
    if (!this.startPoint || !this.endPoint || !this.measurementLine) return;
    
    const startScreen = this.projector.translatePoint(this.startPoint);
    const endScreen = this.projector.translatePoint(this.endPoint);
    
    const dx = endScreen.x - startScreen.x;
    const dy = endScreen.y - startScreen.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    this.measurementLine.style.width = `${length}px`;
    this.measurementLine.style.height = '2px';
    this.measurementLine.style.background = 'rgba(255, 255, 0, 0.8)';
    this.measurementLine.style.transformOrigin = '0 0';
    this.measurementLine.style.transform = `translate(${startScreen.x}px, ${startScreen.y}px) rotate(${angle}deg)`;
    this.measurementLine.style.display = 'block';
  }
  
  isActive(): boolean {
    return this.isMeasuring;
  }
}
```

### Bonus 8: Tile Path Visualization

Show a path between two tiles (useful for movement planning).

```typescript
export class PathVisualizer {
  private pathOverlay: OffscreenCanvas;
  private pathCtx: OffscreenCanvasRenderingContext2D;
  
  constructor(
    private canvas: HTMLCanvasElement,
    private projector: IsometricProjector
  ) {
    this.pathOverlay = new OffscreenCanvas(canvas.width, canvas.height);
    this.pathCtx = this.pathOverlay.getContext('2d')!;
  }
  
  drawPath(tiles: PointIso[], color: string = 'rgba(0, 255, 0, 0.5)') {
    this.pathCtx.clearRect(0, 0, this.pathOverlay.width, this.pathOverlay.height);
    
    if (tiles.length < 2) return;
    
    this.pathCtx.strokeStyle = color;
    this.pathCtx.lineWidth = 3;
    this.pathCtx.setLineDash([5, 5]);
    
    this.pathCtx.beginPath();
    
    for (let i = 0; i < tiles.length; i++) {
      const screen = this.projector.translatePoint(tiles[i]);
      
      if (i === 0) {
        this.pathCtx.moveTo(screen.x, screen.y);
      } else {
        this.pathCtx.lineTo(screen.x, screen.y);
      }
    }
    
    this.pathCtx.stroke();
    
    // Draw waypoints
    this.pathCtx.setLineDash([]);
    this.pathCtx.fillStyle = color;
    
    for (const tile of tiles) {
      const screen = this.projector.translatePoint(tile);
      this.pathCtx.beginPath();
      this.pathCtx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
      this.pathCtx.fill();
    }
  }
  
  clearPath() {
    this.pathCtx.clearRect(0, 0, this.pathOverlay.width, this.pathOverlay.height);
  }
  
  getPathOverlay(): OffscreenCanvas {
    return this.pathOverlay;
  }
}
```

### Bonus 9: Tile History (Undo/Redo)

Track tile modifications for undo/redo functionality.

```typescript
export class TileHistory {
  private history: Array<{
    tile: PointIso;
    previousState: { lvl: number; color: number[] };
    newState: { lvl: number; color: number[] };
    timestamp: number;
  }> = [];
  
  private currentIndex: number = -1;
  private maxHistory: number = 100;
  
  recordChange(
    tile: PointIso,
    previousState: { lvl: number; color: number[] },
    newState: { lvl: number; color: number[] }
  ) {
    // Remove any redo history
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new entry
    this.history.push({
      tile,
      previousState,
      newState,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }
  
  undo(): { tile: PointIso; state: { lvl: number; color: number[] } } | null {
    if (this.currentIndex < 0) return null;
    
    const entry = this.history[this.currentIndex];
    this.currentIndex--;
    
    return {
      tile: entry.tile,
      state: entry.previousState
    };
  }
  
  redo(): { tile: PointIso; state: { lvl: number; color: number[] } } | null {
    if (this.currentIndex >= this.history.length - 1) return null;
    
    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    
    return {
      tile: entry.tile,
      state: entry.newState
    };
  }
  
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }
  
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
  
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
  
  getHistorySize(): number {
    return this.history.length;
  }
}
```

### Bonus 10: Performance Optimizations

Optimize click detection for large maps.

```typescript
export class ClickDetectionOptimizer {
  private spatialIndex: Map<string, PointIso[]> = new Map();
  private cellSize: number = 10;
  
  buildIndex(tiles: PointIso[]) {
    this.spatialIndex.clear();
    
    for (const tile of tiles) {
      const cellX = Math.floor(tile.x / this.cellSize);
      const cellY = Math.floor(tile.y / this.cellSize);
      const key = `${cellX}:${cellY}`;
      
      if (!this.spatialIndex.has(key)) {
        this.spatialIndex.set(key, []);
      }
      this.spatialIndex.get(key)!.push(tile);
    }
  }
  
  getCandidates(screenX: number, screenY: number, radius: number = 2): PointIso[] {
    const candidates: PointIso[] = [];
    
    // Get cells within radius
    const centerCellX = Math.floor(screenX / this.cellSize);
    const centerCellY = Math.floor(screenY / this.cellSize);
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const key = `${centerCellX + dx}:${centerCellY + dy}`;
        const cellTiles = this.spatialIndex.get(key);
        if (cellTiles) {
          candidates.push(...cellTiles);
        }
      }
    }
    
    return candidates;
  }
  
  updateTile(tile: PointIso) {
    // Remove from old cell
    for (const [key, tiles] of this.spatialIndex) {
      const index = tiles.findIndex(t => t.x === tile.x && t.y === tile.y);
      if (index !== -1) {
        tiles.splice(index, 1);
        if (tiles.length === 0) {
          this.spatialIndex.delete(key);
        }
        break;
      }
    }
    
    // Add to new cell
    const cellX = Math.floor(tile.x / this.cellSize);
    const cellY = Math.floor(tile.y / this.cellSize);
    const key = `${cellX}:${cellY}`;
    
    if (!this.spatialIndex.has(key)) {
      this.spatialIndex.set(key, []);
    }
    this.spatialIndex.get(key)!.push(tile);
  }
}
```

---

## Integration Example

Here's how to integrate all bonus features:

```typescript
export class EnhancedCanvasClickHandler {
  private clickHandler: CanvasClickHandler;
  private multiSelector: MultiTileSelector;
  private contextMenu: TileContextMenu;
  private modifierHandler: ClickModifierHandler;
  private coordinateTooltip: CoordinateTooltip;
  private distanceMeasurer: DistanceMeasurer;
  private pathVisualizer: PathVisualizer;
  private tileHistory: TileHistory;
  private optimizer: ClickDetectionOptimizer;
  
  constructor(
    canvas: HTMLCanvasElement,
    projector: IsometricProjector,
    mapLvl: Float32Array,
    mapInfo: Float32Array,
    mapSize: number,
    gameWorker: Worker
  ) {
    // Core click handler
    this.clickHandler = new CanvasClickHandler(
      canvas, projector, mapLvl, mapInfo, mapSize, gameWorker
    );
    
    // Bonus features
    this.multiSelector = new MultiTileSelector(canvas, projector, mapLvl, mapSize);
    this.contextMenu = new TileContextMenu(canvas);
    this.modifierHandler = new ClickModifierHandler(canvas);
    this.coordinateTooltip = new CoordinateTooltip();
    this.distanceMeasurer = new DistanceMeasurer(canvas, projector);
    this.pathVisualizer = new PathVisualizer(canvas, projector);
    this.tileHistory = new TileHistory();
    this.optimizer = new ClickDetectionOptimizer();
    
    this.setupCallbacks();
  }
  
  private setupCallbacks() {
    // Hover callback for tooltip
    this.clickHandler.setHoverCallback((tile) => {
      if (tile) {
        this.coordinateTooltip.show(tile, 0, 0); // Would need actual screen coords
      } else {
        this.coordinateTooltip.hide();
      }
      this.contextMenu.setTile(tile);
    });
    
    // Multi-select callback
    this.multiSelector.setSelectionCallback((tiles) => {
      console.log('Selected tiles:', tiles.length);
    });
  }
  
  destroy() {
    this.clickHandler.destroy();
    this.contextMenu.destroy();
    this.coordinateTooltip.destroy();
  }
}
```

---

## Benefits

1. **Accuracy**: Mathematical projection guarantees perfect alignment
2. **Performance**: No DOM manipulation, pure canvas rendering
3. **Zoom Support**: Works at any zoom level automatically
4. **Mode Independent**: Works regardless of current mode
5. **Maintainability**: Single source of truth for coordinate transformation

## Testing Plan

1. Test click detection at various tile positions
2. Test with different zoom levels (SCALE_SIZE variations)
3. Test with different map heights
4. Test edge detection accuracy
5. Test hover rendering performance
6. Test with different map sizes

## Migration Steps

1. Implement inverse projection in IsometricProjector
2. Create CanvasClickHandler
3. Add hover rendering to CanvasMapDrawers
4. Update main game loop to use new system
5. Remove old grid.ts implementation
6. Test and validate

## Files Modified

- `IsoGame/mapIso/simpleIso/IsometricProjector.ts` - Add inverse projection
- `IsoGame/mapIso/canvasClickHandler.ts` - New file
- `IsoGame/mapIso/canvasMapDrawer.ts` - Add hover support
- `IsoGame/mapIso/grid.ts` - Simplify to wrapper

## Conclusion

This solution eliminates the problematic CSS-based grid overlay and replaces it with a mathematically precise inverse projection system. The approach is more performant, accurate, and maintainable than the current implementation.