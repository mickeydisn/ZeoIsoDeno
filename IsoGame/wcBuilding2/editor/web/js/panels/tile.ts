/**
 * TileEditorPanel — Tile Editor Modal/Panel
 *
 * The most frequently used component in the editor. Provides full CRUD for tile configuration:
 * - Face configuration (4 directions: NW, NE, SE, SW)
 * - Properties (weight, allowMove, isFrise, empty, h, lvl, color)
 * - Asset list with color suffix support
 * - Terrain function management
 * - Live 2D canvas preview
 *
 * Opens as a modal when editing tiles from the building editor or asset collection editor.
 */

import type { StateManager } from "../state.ts";
import type { ApiClient } from "../api.ts";
import type { TileConfig, BuildingConfig, AssetCollectionConfig } from "../../../types.ts";
import { FaceEditor } from "../components/faceEditor.ts";
import { AssetListEditor } from "../components/assetList.ts";
import { Canvas2DPreview } from "../components/canvas2d.ts";
import { AssetPreviewService } from "../services/assetPreview.ts";
import { TilePropertiesEditor } from "../components/tilePropertiesEditor.ts";

// ============================================================================
// Tile Edit Context
// ============================================================================

export interface TileEditContext {
  /** Parent collection name (e.g., "HouseA" building or "WallHouse" collection) */
  parentCollection: string;
  /** Whether this is a start tile */
  isStartTile: boolean;
  /** Source info for display (e.g., "From WallHouse → Wall_Door") */
  sourceInfo?: string;
  /** All available face keys for dropdowns */
  faceKeys?: string[];
  /** Available assets from server */
  availableAssets?: { key: string; category: string; filename: string }[];
  /** Collection params for resolving template references */
  collectionParams?: Record<string, string | number | boolean>;
  /** Template parameter names for color picker */
  templateParams?: string[];
  /** Callback when tile is saved */
  onSave: (tile: TileConfig) => void;
  /** Callback when modal is closed */
  onClose?: () => void;
}

// ============================================================================
// Tile Editor Panel Class
// ============================================================================

export class TileEditorPanel {
  private stateManager: StateManager;
  private apiClient: ApiClient;
  private overlay: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private isDirty = false;

  // Component instances
  private faceEditor: FaceEditor | null = null;
  private propertiesEditor: TilePropertiesEditor | null = null;
  private assetListEditor: AssetListEditor | null = null;
  private canvasPreview: Canvas2DPreview | null = null;
  private assetPreviewService: AssetPreviewService;

  // Current editing state
  private currentTile: TileConfig | null = null;
  private context: TileEditContext | null = null;
  private faceKeys: string[] = [];

  constructor(stateManager: StateManager, apiClient: ApiClient) {
    this.stateManager = stateManager;
    this.apiClient = apiClient;
    this.assetPreviewService = new AssetPreviewService();
  }

  /**
   * Open the tile editor modal.
   */
  open(
    container: HTMLElement,
    tile: TileConfig | null,
    context: TileEditContext
  ): void {
    this.context = context;
    this.currentTile = tile ? { ...tile } : this.createNewTile();
    this.isDirty = false;
    this.faceKeys = context.faceKeys || this.collectDefaultFaceKeys();

    // Load available assets
    this.loadAvailableAssets().then((assets) => {
      if (this.context) {
        this.context.availableAssets = assets;
      }
      this.render();
    });

    // Find or create overlay
    this.overlay = document.getElementById("modal-overlay");
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.id = "modal-overlay";
      this.overlay.className = "modal-overlay";
      document.body.appendChild(this.overlay);
    }

    this.render();
  }

  /**
   * Create a new tile with default values.
   */
  private createNewTile(): TileConfig {
    return {
      id: `tile_${Date.now()}`,
      face: [null, null, null, null],
      weight: 0,
      assets: [],
      functions: [],
      allowMove: false,
      isFrise: false,
      empty: false,
    };
  }

  /**
   * Collect default face keys from active building config.
   */
  private collectDefaultFaceKeys(): string[] {
    const state = this.stateManager.getState();
    const activeConfig = state.activeConfig.data;

    if (!activeConfig) return [];

    const keys = new Set<string>();

    // From building config
    if (activeConfig.type === "building") {
      const building = activeConfig as BuildingConfig;
      for (const key of Object.keys(building.faceLinkWeight || {})) {
        keys.add(key);
      }
      for (const [a, b] of building.faceLinks || []) {
        keys.add(a);
        keys.add(b);
      }
    }

    return Array.from(keys).sort();
  }

  /**
   * Load available assets from the server and preload for current tile.
   */
  private async loadAvailableAssets(): Promise<{ key: string; category: string; filename: string }[]> {
    try {
      const response = await this.apiClient.listAssets();
      const assets = response.assets || [];

      // Preload assets for current tile
      if (this.currentTile?.assets?.length) {
        const keysToLoad = this.currentTile.assets
          .map((a) => a.key)
          .filter((k): k is string => !!k);
        if (keysToLoad.length > 0) {
          await this.assetPreviewService.loadImages(keysToLoad);
        }
      }

      return assets;
    } catch {
      return [];
    }
  }

  /**
   * Render the tile editor modal.
   */
  private render(): void {
    if (!this.overlay || !this.currentTile || !this.context) return;

    this.overlay.innerHTML = "";
    this.overlay.classList.remove("hidden");

    this.modal = document.createElement("div");
    this.modal.className = "modal-content tile-editor-modal";

    // Header
    this.modal.appendChild(this.renderHeader());

    // Main content area (scrollable)
    const contentArea = document.createElement("div");
    contentArea.className = "tile-editor-content";

    // Face Configuration Section
    contentArea.appendChild(this.renderFaceSection());

    // Properties Section
    contentArea.appendChild(this.renderPropertiesSection());

    // Asset List Section
    contentArea.appendChild(this.renderAssetsSection());

    // Function List Section
    contentArea.appendChild(this.renderFunctionsSection());

    // Preview Section
    contentArea.appendChild(this.renderPreviewSection());

    this.modal.appendChild(contentArea);

    // Action buttons at bottom
    this.modal.appendChild(this.renderActionButtons());

    this.overlay.appendChild(this.modal);

    // Bind backdrop click to close
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.handleCancel();
      }
    });

    // Render canvas preview
    this.renderCanvasPreview();
  }

  /**
   * Render header with tile title and source info.
   */
  private renderHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = "tile-editor-header";

    const titleRow = document.createElement("div");
    titleRow.className = "tile-editor-title-row";

    const title = document.createElement("h2");
    title.textContent = this.currentTile?.id ? `Edit Tile: ${this.currentTile.id}` : "New Tile";
    titleRow.appendChild(title);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn-icon";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close";
    closeBtn.addEventListener("click", () => this.handleCancel());
    titleRow.appendChild(closeBtn);

    header.appendChild(titleRow);

    // Source info (read-only)
    if (this.context?.sourceInfo) {
      const sourceInfo = document.createElement("div");
      sourceInfo.className = "tile-source-info";
      sourceInfo.innerHTML = `<span class="source-badge">${this.context.sourceInfo}</span>`;
      header.appendChild(sourceInfo);
    }

    return header;
  }

  /**
   * Render face configuration section.
   */
  private renderFaceSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section tile-face-section";

    const header = document.createElement("h3");
    header.textContent = "🔷 Face Configuration (NW, NE, SE, SW)";
    section.appendChild(header);

    const faceContainer = document.createElement("div");
    faceContainer.className = "face-editor-container";
    section.appendChild(faceContainer);

    // Initialize face editor component
    if (this.currentTile) {
      this.faceEditor = new FaceEditor(
        faceContainer,
        [...(this.currentTile.face as (string | null)[])],
        this.faceKeys,
        (updatedFace) => {
          if (this.currentTile) {
            this.currentTile.face = updatedFace;
            this.isDirty = true;
            this.renderCanvasPreview();
          }
        }
      );
      this.faceEditor.render();
    }

    return section;
  }

  /**
   * Render properties section using TilePropertiesEditor component.
   */
  private renderPropertiesSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section tile-properties-section";

    const header = document.createElement("h3");
    header.textContent = "⚙️ Properties";
    section.appendChild(header);

    if (!this.currentTile) return section;

    const container = document.createElement("div");
    container.className = "tile-properties-container";
    section.appendChild(container);

    // Initialize properties editor component
    this.propertiesEditor = new TilePropertiesEditor(
      container,
      this.currentTile,
      () => {
        this.isDirty = true;
        this.renderCanvasPreview();
      }
    );
    this.propertiesEditor.render();

    return section;
  }

  /**
   * Render assets section with AssetListEditor.
   */
  private renderAssetsSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section tile-assets-section";

    const header = document.createElement("h3");
    const assetCount = this.currentTile?.assets?.length || 0;
    header.textContent = `🎨 Assets (${assetCount})`;
    section.appendChild(header);

    const container = document.createElement("div");
    container.className = "asset-list-container";
    section.appendChild(container);

    if (this.currentTile) {
      this.assetListEditor = new AssetListEditor(container, {
        assets: [...(this.currentTile.assets || [])],
        availableAssets: this.context?.availableAssets || [],
        collectionParams: this.context?.collectionParams,
        templateParams: this.context?.templateParams,
        assetPreviewService: this.assetPreviewService,
        onChange: (updatedAssets) => {
          if (this.currentTile) {
            this.currentTile.assets = updatedAssets;
            this.isDirty = true;
            // Update asset count in header
            header.textContent = `🎨 Assets (${updatedAssets.length})`;
            // Reload asset preview
            this.reloadAssetPreviews();
          }
        },
      });
      this.assetListEditor.render();
    }

    return section;
  }

  /**
   * Render functions section.
   */
  private renderFunctionsSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section tile-functions-section";

    const header = document.createElement("h3");
    const funcCount = this.currentTile?.functions?.length || 0;
    header.textContent = `🔧 Terrain Functions (${funcCount})`;
    section.appendChild(header);

    if (!this.currentTile) return section;

    const table = document.createElement("table");
    table.className = "function-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Function Name</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    section.appendChild(table);

    const tbody = table.querySelector("tbody");

    // Render existing functions
    this.currentTile.functions?.forEach((func, index) => {
      const tr = document.createElement("tr");

      // Function name dropdown
      const funcNameTd = document.createElement("td");
      const funcSelect = document.createElement("select");
      funcSelect.className = "func-select";
      const funcNames = ["lvlAvgSquare", "lvlAvg", "lvlDiff"];
      funcNames.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (func.key === name) option.selected = true;
        funcSelect.appendChild(option);
      });
      funcSelect.addEventListener("change", () => {
        if (this.currentTile?.functions) {
          this.currentTile.functions[index].key = funcSelect.value;
          this.isDirty = true;
        }
      });
      funcNameTd.appendChild(funcSelect);
      tr.appendChild(funcNameTd);

      // Size input
      const sizeTd = document.createElement("td");
      const sizeInput = document.createElement("input");
      sizeInput.type = "number";
      sizeInput.className = "func-size-input";
      sizeInput.min = "1";
      sizeInput.value = String(func.size || 5);
      sizeInput.addEventListener("change", () => {
        if (this.currentTile?.functions) {
          this.currentTile.functions[index].size = parseInt(sizeInput.value, 10) || 5;
          this.isDirty = true;
        }
      });
      sizeTd.appendChild(sizeInput);
      tr.appendChild(sizeTd);

      // Delete button
      const actionsTd = document.createElement("td");
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-small btn-danger";
      deleteBtn.textContent = "🗑️";
      deleteBtn.addEventListener("click", () => {
        if (this.currentTile?.functions) {
          this.currentTile.functions.splice(index, 1);
          this.isDirty = true;
          // Re-render functions section
          section.innerHTML = "";
          section.appendChild(header);
          section.appendChild(this.renderFunctionsTable(this.currentTile, header));
        }
      });
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);

      tbody?.appendChild(tr);
    });

    // Add function row
    const addRow = document.createElement("tr");
    addRow.className = "function-add-row";
    addRow.innerHTML = `
      <td>
        <select class="func-select" id="new-func-name">
          <option value="">— Select —</option>
          <option value="lvlAvgSquare">lvlAvgSquare</option>
          <option value="lvlAvg">lvlAvg</option>
          <option value="lvlDiff">lvlDiff</option>
        </select>
      </td>
      <td><input type="number" class="func-size-input" min="1" value="5" id="new-func-size" /></td>
      <td><button class="btn-small primary" id="btn-add-func">➕ Add</button></td>
    `;
    tbody?.appendChild(addRow);

    // Bind add function handler
    const addBtn = document.getElementById("btn-add-func");
    addBtn?.addEventListener("click", () => {
      const funcName = (document.getElementById("new-func-name") as HTMLSelectElement)?.value;
      const funcSize = parseInt((document.getElementById("new-func-size") as HTMLInputElement)?.value || "5", 10);

      if (!funcName) {
        this.stateManager.setError("Please select a function name");
        return;
      }

      if (!this.currentTile) return;
      if (!this.currentTile.functions) this.currentTile.functions = [];
      this.currentTile.functions.push({
        key: funcName,
        size: funcSize,
      });
      this.isDirty = true;

      // Re-render functions section
      section.innerHTML = "";
      section.appendChild(header);
      section.appendChild(this.renderFunctionsTable(this.currentTile, header));
    });

    return section;
  }

  /**
   * Helper to render function table body.
   */
  private renderFunctionsTable(tile: TileConfig, header: HTMLElement): HTMLElement {
    const table = document.createElement("table");
    table.className = "function-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Function Name</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    tile.functions?.forEach((func, index) => {
      const tr = document.createElement("tr");

      // Function name
      const funcNameTd = document.createElement("td");
      const funcSelect = document.createElement("select");
      funcSelect.className = "func-select";
      ["lvlAvgSquare", "lvlAvg", "lvlDiff"].forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (func.key === name) option.selected = true;
        funcSelect.appendChild(option);
      });
      funcSelect.addEventListener("change", () => {
        if (tile.functions) {
          tile.functions[index].key = funcSelect.value;
          this.isDirty = true;
        }
      });
      funcNameTd.appendChild(funcSelect);
      tr.appendChild(funcNameTd);

      // Size
      const sizeTd = document.createElement("td");
      const sizeInput = document.createElement("input");
      sizeInput.type = "number";
      sizeInput.className = "func-size-input";
      sizeInput.min = "1";
      sizeInput.value = String(func.size || 5);
      sizeInput.addEventListener("change", () => {
        if (tile.functions) {
          tile.functions[index].size = parseInt(sizeInput.value, 10) || 5;
          this.isDirty = true;
        }
      });
      sizeTd.appendChild(sizeInput);
      tr.appendChild(sizeTd);

      // Delete
      const actionsTd = document.createElement("td");
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-small btn-danger";
      deleteBtn.textContent = "🗑️";
      deleteBtn.addEventListener("click", () => {
        if (tile.functions) {
          tile.functions.splice(index, 1);
          this.isDirty = true;
          header.textContent = `🔧 Terrain Functions (${(tile.functions?.length || 0)})`;
          const parent = table.parentElement;
          if (parent) {
            parent.innerHTML = "";
            parent.appendChild(this.renderFunctionsTable(tile, header));
          }
        }
      });
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);

      tbody?.appendChild(tr);
    });

    // Add row
    const addRow = document.createElement("tr");
    addRow.className = "function-add-row";
    addRow.innerHTML = `
      <td>
        <select class="func-select" id="new-func-name">
          <option value="">— Select —</option>
          <option value="lvlAvgSquare">lvlAvgSquare</option>
          <option value="lvlAvg">lvlAvg</option>
          <option value="lvlDiff">lvlDiff</option>
        </select>
      </td>
      <td><input type="number" class="func-size-input" min="1" value="5" id="new-func-size" /></td>
      <td><button class="btn-small primary" id="btn-add-func">➕ Add</button></td>
    `;
    tbody?.appendChild(addRow);

    setTimeout(() => {
      const addBtnEl = document.getElementById("btn-add-func");
      addBtnEl?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const funcName = (document.getElementById("new-func-name") as HTMLSelectElement)?.value;
        const funcSize = parseInt((document.getElementById("new-func-size") as HTMLInputElement)?.value || "5", 10);

        if (!funcName) {
          this.stateManager.setError("Please select a function name");
          return;
        }

        if (!tile.functions) tile.functions = [];
        tile.functions.push({ key: funcName, size: funcSize });
        this.isDirty = true;
        header.textContent = `🔧 Terrain Functions (${tile.functions.length})`;
        const parent = table.parentElement;
        if (parent) {
          parent.innerHTML = "";
          parent.appendChild(this.renderFunctionsTable(tile, header));
        }
      });
    }, 0);

    return table;
  }

  /**
   * Render canvas preview section.
   */
  private renderPreviewSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section tile-preview-section";

    const headerRow = document.createElement("div");
    headerRow.className = "editor-section-header";

    const header = document.createElement("h3");
    header.textContent = "👁️ Preview";
    headerRow.appendChild(header);

    // Toggle checkboxes
    const toggles = document.createElement("div");
    toggles.className = "preview-toggles";

    const faceToggle = document.createElement("label");
    faceToggle.innerHTML = `<input type="checkbox" checked id="toggle-face-overlay" /> Face Keys`;
    faceToggle.querySelector("input")?.addEventListener("change", () => {
      this.canvasPreview?.toggleFaceOverlay();
    });
    toggles.appendChild(faceToggle);

    const assetToggle = document.createElement("label");
    assetToggle.innerHTML = `<input type="checkbox" id="toggle-asset-outlines" /> Asset Outlines`;
    assetToggle.querySelector("input")?.addEventListener("change", () => {
      this.canvasPreview?.toggleAssetOutlines();
    });
    toggles.appendChild(assetToggle);

    headerRow.appendChild(toggles);
    section.appendChild(headerRow);

    const canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas-preview-container";
    section.appendChild(canvasContainer);

    return section;
  }

  /**
   * Render canvas preview with asset images.
   */
  private async renderCanvasPreview(): Promise<void> {
    const canvasContainer = this.modal?.querySelector(".canvas-preview-container");
    if (!canvasContainer || !this.currentTile) return;

    // Destroy existing canvas preview
    if (this.canvasPreview) {
      this.canvasPreview.destroy();
    }

    this.canvasPreview = new Canvas2DPreview(canvasContainer as HTMLElement);

    // Load and set asset images for preview
    if (this.currentTile.assets?.length) {
      const keysToLoad = this.currentTile.assets
        .map((a) => a.key)
        .filter((k): k is string => !!k);
      if (keysToLoad.length > 0) {
        const images = await this.assetPreviewService.loadImages(keysToLoad);
        this.canvasPreview.setAssetImages(images);
      }
    }

    this.canvasPreview.renderTile(this.currentTile);
  }

  /**
   * Reload asset previews when assets change.
   */
  private async reloadAssetPreviews(): Promise<void> {
    if (!this.currentTile || !this.canvasPreview) return;

    if (this.currentTile.assets?.length) {
      const keysToLoad = this.currentTile.assets
        .map((a) => a.key)
        .filter((k): k is string => !!k);
      if (keysToLoad.length > 0) {
        const images = await this.assetPreviewService.loadImages(keysToLoad);
        this.canvasPreview.setAssetImages(images);
        this.canvasPreview.render();
      } else {
        this.canvasPreview.setAssetImages(new Map());
        this.canvasPreview.render();
      }
    } else {
      this.canvasPreview.setAssetImages(new Map());
      this.canvasPreview.render();
    }
  }

  /**
   * Render action buttons (Cancel, Save).
   */
  private renderActionButtons(): HTMLElement {
    const actionBar = document.createElement("div");
    actionBar.className = "tile-editor-actions";

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this.handleCancel());
    actionBar.appendChild(cancelBtn);

    // Save & Close button
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn-primary";
    saveBtn.textContent = this.isDirty ? "💾 Save & Close" : "Save & Close";
    saveBtn.addEventListener("click", () => this.handleSave());
    actionBar.appendChild(saveBtn);

    return actionBar;
  }

  /**
   * Handle cancel action.
   */
  private handleCancel(): void {
    if (this.isDirty) {
      if (!confirm("You have unsaved changes. Discard them?")) {
        return;
      }
    }
    this.close();
  }

  /**
   * Handle save action.
   */
  private handleSave(): void {
    if (!this.currentTile || !this.context) return;

    // Validation
    if (this.currentTile.face.length !== 4) {
      this.stateManager.setError("Face configuration must have exactly 4 elements");
      return;
    }

    if (this.currentTile.weight < 0) {
      this.stateManager.setError("Weight must be >= 0");
      return;
    }

    // Warning if no assets or functions
    if (
      (!this.currentTile.assets || this.currentTile.assets.length === 0) &&
      (!this.currentTile.functions || this.currentTile.functions.length === 0) &&
      !this.currentTile.empty
    ) {
      if (!confirm("This tile has no assets or functions. Save anyway?")) {
        return;
      }
    }

    // Save
    this.context.onSave(this.currentTile);
    this.isDirty = false;
    this.close();
  }

  /**
   * Close the modal.
   */
  close(): void {
    if (this.overlay) {
      this.overlay.classList.add("hidden");
      this.overlay.innerHTML = "";
    }

    // Cleanup components
    if (this.faceEditor) {
      this.faceEditor.destroy();
      this.faceEditor = null;
    }
    if (this.propertiesEditor) {
      this.propertiesEditor.destroy();
      this.propertiesEditor = null;
    }
    if (this.assetListEditor) {
      this.assetListEditor.destroy();
      this.assetListEditor = null;
    }
    if (this.canvasPreview) {
      this.canvasPreview.destroy();
      this.canvasPreview = null;
    }

    this.currentTile = null;
    this.context?.onClose?.();
    this.context = null;
  }

  /**
   * Check if modal has unsaved changes.
   */
  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  /**
   * Get current tile being edited.
   */
  getCurrentTile(): TileConfig | null {
    return this.currentTile;
  }
}

// ============================================================================
// Tile Edit Context Builder
// ============================================================================

/**
 * Build a TileEditContext from a BuildingConfig.
 */
export function buildTileEditContextFromBuilding(
  config: BuildingConfig,
  onSave: (tile: TileConfig) => void
): TileEditContext {
  // Collect face keys
  const faceKeys = new Set<string>();
  for (const key of Object.keys(config.faceLinkWeight || {})) {
    faceKeys.add(key);
  }
  for (const [a, b] of config.faceLinks || []) {
    faceKeys.add(a);
    faceKeys.add(b);
  }
  for (const tile of [...(config.tiles || []), ...(config.startTiles || [])]) {
    for (const f of tile.face || []) {
      if (f) faceKeys.add(f);
    }
  }

  return {
    parentCollection: config.id,
    isStartTile: false,
    sourceInfo: `Building: ${config.id}`,
    faceKeys: Array.from(faceKeys).sort(),
    collectionParams: {},
    templateParams: [],
    onSave,
  };
}

/**
 * Build a TileEditContext from an AssetCollectionConfig.
 */
export function buildTileEditContextFromAssetCollection(
  config: AssetCollectionConfig,
  onSave: (tile: TileConfig) => void
): TileEditContext {
  // Collect template params
  const templateParams = Object.keys(config.paramsSchema || {})
    .filter((key) => config.paramsSchema?.[key]?.type === "color")
    .map((key) => key);

  return {
    parentCollection: config.id,
    isStartTile: false,
    sourceInfo: `Collection: ${config.id}`,
    faceKeys: [],
    collectionParams: config.params,
    templateParams,
    onSave,
  };
}