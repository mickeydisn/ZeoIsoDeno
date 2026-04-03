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
import { AssetListEditor } from "../components/assetList.ts";
import { Canvas2DPreview } from "../components/canvas2d.ts";
import { AssetPreviewService } from "../services/assetPreview.ts";
import { TilePropertiesEditor } from "../components/tilePropertiesEditor.ts";
import { TileFaceEditor } from "../components/tileFaceEditor.ts";
import { TileFunctionsEditor } from "../components/tileFunctionsEditor.ts";
import { buildTileEditContextFromBuilding, buildTileEditContextFromAssetCollection } from "../components/contextBuilders.ts";

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
  private tileFaceEditor: TileFaceEditor | null = null;
  private propertiesEditor: TilePropertiesEditor | null = null;
  private functionsEditor: TileFunctionsEditor | null = null;
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

    // Initialize tile face editor component
    if (this.currentTile) {
      this.tileFaceEditor = new TileFaceEditor(
        section,
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
      this.tileFaceEditor.render();
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
   * Render functions section using TileFunctionsEditor component.
   */
  private renderFunctionsSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section tile-functions-section";

    const header = document.createElement("h3");
    const funcCount = this.currentTile?.functions?.length || 0;
    header.textContent = `🔧 Terrain Functions (${funcCount})`;
    section.appendChild(header);

    if (!this.currentTile) return section;

    const container = document.createElement("div");
    container.className = "tile-functions-container";
    section.appendChild(container);

    // Initialize functions editor component
    this.functionsEditor = new TileFunctionsEditor(
      container,
      this.currentTile.functions || [],
      (updatedFunctions) => {
        if (this.currentTile) {
          this.currentTile.functions = updatedFunctions;
          this.isDirty = true;
          // Update function count in header
          header.textContent = `🔧 Terrain Functions (${updatedFunctions.length})`;
        }
      }
    );
    this.functionsEditor.render();

    return section;
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
    if (this.tileFaceEditor) {
      this.tileFaceEditor.destroy();
      this.tileFaceEditor = null;
    }
    if (this.propertiesEditor) {
      this.propertiesEditor.destroy();
      this.propertiesEditor = null;
    }
    if (this.functionsEditor) {
      this.functionsEditor.destroy();
      this.functionsEditor = null;
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

