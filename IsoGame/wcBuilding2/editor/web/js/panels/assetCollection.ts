/**
 * Asset Collection Editor Panel — Asset Collection Configuration Editor
 *
 * Renders the editable view of an asset collection config, including:
 * 1. Metadata (classRef, sourceFile)
 * 2. Tag prefix
 * 3. Parameters with schema-aware inputs
 * 4. Tile List
 */

import type { StateManager } from "../state.ts";
import type { ApiClient } from "../api.ts";
import type { AssetCollectionConfig, TileConfig } from "../../../types.ts";
import { TileEditorPanel, buildTileEditContextFromAssetCollection } from "./tile.ts";
import { AssetPreviewService } from "../services/assetPreview.ts";

// ============================================================================
// Asset Collection Editor Panel Class
// ============================================================================

export class AssetCollectionEditorPanel {
  private stateManager: StateManager;
  private apiClient: ApiClient;
  private container: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  // Tile preview and editor
  private tileEditorPanel: TileEditorPanel | null = null;
  private assetPreviewService: AssetPreviewService;
  private tilePreviewContainer: HTMLElement | null = null;

  constructor(stateManager: StateManager, apiClient: ApiClient) {
    this.stateManager = stateManager;
    this.apiClient = apiClient;
    this.assetPreviewService = new AssetPreviewService();
    this.tileEditorPanel = new TileEditorPanel(stateManager, apiClient);
  }

  /**
   * Render the asset collection editor panel into the given container.
   */
  render(container: HTMLElement): void {
    console.log('[AssetCollectionEditorPanel] render() called');
    this.container = container;
    container.innerHTML = "";

    // Subscribe to state changes
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.unsubscribe = this.stateManager.subscribe(() => this.renderIfNeeded());

    console.log('[AssetCollectionEditorPanel] Calling renderContent()');
    this.renderContent();
  }

  /**
   * Render content only if active config is an asset collection.
   */
  private renderContent(): void {
    if (!this.container) return;

    const state = this.stateManager.getState();
    const activeConfig = state.activeConfig;

    if (!activeConfig || activeConfig.type !== "assetCollection" || !activeConfig.data) {
      this.renderEmptyState();
      return;
    }

    this.renderEditor(activeConfig.data as AssetCollectionConfig);
  }

  /**
   * Re-render only when activeConfig changes.
   */
  private lastActiveId: string | null = null;

  private renderIfNeeded(): void {
    const state = this.stateManager.getState();
    const activeId = state.activeConfig.id;
    if (activeId !== this.lastActiveId) {
      this.lastActiveId = activeId;
      this.renderContent();
    }
  }

  /**
   * Render empty state when no asset collection is selected.
   */
  private renderEmptyState(): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="placeholder-content">
        <h2>Asset Collection Editor</h2>
        <p>Select an asset collection config from the library to start editing.</p>
      </div>
    `;
  }

  /**
   * Render the full asset collection editor.
   */
  private renderEditor(config: AssetCollectionConfig): void {
    if (!this.container) return;

    this.container.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "building-editor-panel";

    // Header
    panel.appendChild(this.renderHeader(config));

    // Section 1: Parameters (tag, params)
    panel.appendChild(this.renderParametersSection(config));

    // Section 2: Tile Preview Grid (new)
    panel.appendChild(this.renderTilePreviewSection(config));

    // Section 3: Tile List
    panel.appendChild(this.renderTileListSection(config));

    // Action bar
    panel.appendChild(this.renderActionBar(config));

    this.container.appendChild(panel);
  }

  /**
   * Render header with asset collection metadata.
   */
  private renderHeader(config: AssetCollectionConfig): HTMLElement {
    const header = document.createElement("div");
    header.className = "editor-header";
    
    const titleDiv = document.createElement("div");
    titleDiv.innerHTML = `<h2 class="editor-title">📦 ${config.id}</h2>`;

    const meta = document.createElement("div");
    meta.className = "editor-meta";

    if (config.metadata) {
      meta.innerHTML = `
        <span class="meta-item"><strong>Class:</strong> ${config.metadata.classRef || "N/A"}</span>
        <span class="meta-item"><strong>Source File:</strong> ${config.metadata.sourceFile || "N/A"}</span>
        <span class="meta-item"><strong>Tag:</strong> ${config.tag || "N/A"}</span>
      `;
    }

    // "Reset to Default" button
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "🔄 Reset to Default";
    resetBtn.className = "btn-small btn-warning";
    resetBtn.title = "Re-extract from original TypeScript class, discarding all edits";
    resetBtn.addEventListener("click", () => {
      this.resetToDefault(config);
    });

    const headerRight = document.createElement("div");
    headerRight.className = "header-right";
    headerRight.appendChild(resetBtn);

    header.appendChild(titleDiv);
    header.appendChild(meta);
    header.appendChild(headerRight);
    return header;
  }

  /**
   * Reset config to default by re-extracting from TypeScript class.
   */
  private async resetToDefault(config: AssetCollectionConfig): Promise<void> {
    const classRef = config.metadata?.classRef;
    if (!classRef) {
      this.stateManager.setError("Cannot reset: no TypeScript class reference found");
      return;
    }

    if (!confirm(`Reset "${config.id}" to default from TypeScript class "${classRef}"?\n\nThis will discard all edits.`)) {
      return;
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);
      
      // Extract fresh config from TypeScript class
      const freshConfig = await this.apiClient.extractAssetCollection(classRef);
      
      // Replace current config with fresh extraction
      this.stateManager.updateConfig("assetCollection", config.id, freshConfig);
      
      // Also set as active config (not dirty since it's fresh from TS)
      this.stateManager.setActiveConfig("assetCollection", config.id, freshConfig, "extracted");
    } catch (error: any) {
      this.stateManager.setError(`Reset failed: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Render parameters section (tag + params with schema).
   */
  private renderParametersSection(config: AssetCollectionConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const header = document.createElement("h3");
    header.textContent = "Parameters";
    section.appendChild(header);

    const form = document.createElement("div");
    form.className = "params-form";

    // Tag prefix
    const tagRow = document.createElement("div");
    tagRow.className = "param-row";
    tagRow.innerHTML = `
      <label class="param-label">Tag Prefix:</label>
      <input type="text" class="param-input" value="${config.tag || ""}" />
    `;
    const tagInput = tagRow.querySelector("input");
    tagInput?.addEventListener("change", (e) => {
      const val = (e.target as HTMLInputElement).value;
      (e.target as HTMLInputElement).value = val;
      this.onConfigChange(config, (c) => {
        c.tag = val;
      });
    });
    form.appendChild(tagRow);

    // Params (with schema-aware inputs if available)
    const schema = config.paramsSchema || {};
    const params = config.params || {};

    for (const [paramKey, paramValue] of Object.entries(params)) {
      const schemaEntry = schema[paramKey];
      const inputType = schemaEntry?.type || this.inferType(paramValue);

      const paramRow = document.createElement("div");
      paramRow.className = "param-row";

      const label = document.createElement("label");
      label.className = "param-label";
      label.textContent = schemaEntry?.label || paramKey;

      let input: HTMLInputElement;
      if (inputType === "color") {
        input = document.createElement("input");
        input.type = "color";
        input.value = this.colorToHex(String(paramValue));
      } else if (inputType === "number") {
        input = document.createElement("input");
        input.type = "number";
        input.value = String(paramValue);
      } else if (inputType === "boolean") {
        input = document.createElement("input");
        input.type = "checkbox";
        (input as HTMLInputElement).checked = Boolean(paramValue);
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.value = String(paramValue);
      }
      input.className = "param-input";

      input.addEventListener("change", (e) => {
        let newValue: string | number | boolean;
        if (inputType === "color") {
          newValue = (e.target as HTMLInputElement).value;
        } else if (inputType === "number") {
          newValue = Number((e.target as HTMLInputElement).value) || 0;
        } else if (inputType === "boolean") {
          newValue = (e.target as HTMLInputElement).checked;
        } else {
          newValue = (e.target as HTMLInputElement).value;
        }
        this.onConfigChange(config, (c) => {
          if (!c.params) c.params = {};
          c.params[paramKey] = newValue;
        });
      });

      paramRow.appendChild(label);
      paramRow.appendChild(input);
      form.appendChild(paramRow);
    }

    section.appendChild(form);
    return section;
  }

  /**
   * Infer parameter type from value.
   */
  private inferType(value: string | number | boolean): "string" | "number" | "color" | "boolean" {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") {
      if (value.startsWith("#") && (value.length === 7 || value.length === 4)) return "color";
      if (/^-?\d+(\.\d+)?$/.test(value)) return "number";
    }
    return "string";
  }

  /**
   * Convert color value to hex format.
   */
  private colorToHex(color: string): string {
    if (color.startsWith("#")) return color;
    // Handle rgb format if needed
    return "#000000";
  }

  /**
   * Render tile preview section with grid of tiles showing their asset images.
   * Task 2.5: Asset Collection Tile Preview
   */
  private renderTilePreviewSection(config: AssetCollectionConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section editor-section-tile-preview";

    const header = document.createElement("h3");
    const tiles = config.tiles || [];
    header.textContent = `🗺️ Tile Previews (${tiles.length})`;
    section.appendChild(header);

    // Preview mode toggle
    const modeToggle = document.createElement("div");
    modeToggle.className = "preview-mode-toggle";
    modeToggle.innerHTML = `
      <label>
        <input type="checkbox" id="preview-show-templates" />
        Show template placeholders
      </label>
    `;
    section.appendChild(modeToggle);

    // Tile preview grid container
    const gridContainer = document.createElement("div");
    gridContainer.className = "tile-preview-grid";
    section.appendChild(gridContainer);

    // Render tile previews
    this.renderTilePreviews(gridContainer, config);

    // Bind toggle handler
    const showTemplatesCheckbox = gridContainer.parentElement?.querySelector("#preview-show-templates") as HTMLInputElement;
    showTemplatesCheckbox?.addEventListener("change", () => {
      this.renderTilePreviews(gridContainer, config);
    });

    return section;
  }

  /**
   * Render grid of tile previews with their asset images.
   */
  private async renderTilePreviews(container: HTMLElement, config: AssetCollectionConfig): Promise<void> {
    container.innerHTML = "";
    const tiles = config.tiles || [];
    const showTemplates = container.parentElement?.querySelector("#preview-show-templates") as HTMLInputElement;
    const renderWithTemplates = showTemplates?.checked ?? false;

    // Preload all assets used in tiles
    const allAssetKeys = new Set<string>();
    for (const tile of tiles) {
      if (tile.assets) {
        for (const asset of tile.assets) {
          if (asset.key && !asset.key.startsWith('{')) {
            allAssetKeys.add(asset.key);
          }
        }
      }
    }
    if (allAssetKeys.size > 0) {
      await this.assetPreviewService.loadImages(Array.from(allAssetKeys));
    }

    // Create preview for each tile
    const params = config.params || {};
    const paramsSchema = config.paramsSchema || {};

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const previewCard = document.createElement("div");
      previewCard.className = "tile-preview-card";
      previewCard.dataset.tileIndex = String(i);

      // Tile header
      const cardHeader = document.createElement("div");
      cardHeader.className = "tile-preview-header";
      cardHeader.innerHTML = `
        <span class="tile-id">${tile.id || `tile_${i}`}</span>
        <span class="tile-weight">w:${tile.weight ?? 0}</span>
      `;
      previewCard.appendChild(cardHeader);

      // Canvas for tile preview
      const canvasContainer = document.createElement("div");
      canvasContainer.className = "tile-canvas-container";
      previewCard.appendChild(canvasContainer);

      // Render 2D preview on canvas
      this.renderTilePreviewCanvas(canvasContainer, tile, config, renderWithTemplates);

      // Asset thumbnail strip
      if (tile.assets && tile.assets.length > 0) {
        const thumbStrip = document.createElement("div");
        thumbStrip.className = "asset-thumbnail-strip";
        for (const asset of tile.assets) {
          if (!asset.key) continue;

          const thumbContainer = document.createElement("div");
          thumbContainer.className = "asset-thumbnail";
          thumbContainer.title = `${asset.key}${asset.sufix ? ` (${asset.sufix})` : ""}`;

          if (asset.key.startsWith('{') && !renderWithTemplates) {
            // Template placeholder - resolve if possible
            const resolvedValue = this.resolveTemplateParam(asset.key, params, paramsSchema);
            if (resolvedValue && typeof resolvedValue === 'string') {
              this.renderAssetThumbnail(thumbContainer, asset, resolvedValue);
            } else {
              thumbContainer.innerHTML = `<span class="template-placeholder">${asset.key}</span>`;
            }
          } else {
            this.renderAssetThumbnail(thumbContainer, asset, null);
          }

          thumbStrip.appendChild(thumbContainer);
        }
        previewCard.appendChild(thumbStrip);
      }

      // Tile face info
      const faceInfo = document.createElement("div");
      faceInfo.className = "tile-face-info";
      const faces = (tile.face || []).map((f, idx) => {
        const dir = ["NW", "NE", "SE", "SW"][idx];
        return f ? `${dir}: ${f.substring(0, 12)}${f.length > 12 ? '…' : ''}` : `${dir}: —`;
      });
      faceInfo.innerHTML = faces.join("<br>");
      previewCard.appendChild(faceInfo);

      // Click handler to open tile editor
      previewCard.addEventListener("click", () => {
        this.openTileEditor(config, tile, i);
      });

      container.appendChild(previewCard);
    }
  }

  /**
   * Render a 2D canvas preview for a single tile.
   */
  private renderTilePreviewCanvas(
    container: HTMLElement,
    tile: TileConfig,
    config: AssetCollectionConfig,
    renderWithTemplates: boolean
  ): void {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = 128;
    canvasEl.height = 64;
    canvasEl.className = "tile-preview-canvas";
    container.appendChild(canvasEl);

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, 128, 64);

    const halfW = 64;
    const halfH = 32;
    const centerX = 64;
    const centerY = 32;

    // Draw tile rhombus
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - halfH);
    ctx.lineTo(centerX + halfW, centerY);
    ctx.lineTo(centerX, centerY + halfH);
    ctx.lineTo(centerX - halfW, centerY);
    ctx.closePath();

    let fillColor = "#3a3a4e";
    if (tile.empty) fillColor = "#2a2a3e";
    else if (tile.color) {
      const [r, g, b] = tile.color;
      fillColor = `rgb(${r}, ${g}, ${b})`;
    }
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = "#606078";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Face overlays
    if (tile.face) {
      const faceColors = [
        "rgba(74, 158, 255, 0.4)",
        "rgba(76, 175, 80, 0.4)",
        "rgba(255, 152, 0, 0.4)",
        "rgba(158, 158, 158, 0.4)"
      ];
      const faceOffsets = [
        { x: 0, y: -halfH * 0.6 },
        { x: halfW * 0.4, y: 0 },
        { x: 0, y: halfH * 0.6 },
        { x: -halfW * 0.4, y: 0 }
      ];
      tile.face.forEach((faceKey, idx) => {
        if (!faceKey) return;
        ctx.fillStyle = faceColors[idx] || "rgba(158, 158, 158, 0.4)";
        const fx = centerX + faceOffsets[idx].x;
        const fy = centerY + faceOffsets[idx].y;
        const sz = 6;
        ctx.fillRect(fx - sz / 2, fy - sz / 2, sz, sz);
      });
    }

    // Draw assets
    if (tile.assets) {
      const params = config.params || {};
      const paramsSchema = config.paramsSchema || {};

      for (const asset of tile.assets) {
        if (!asset.key) continue;

        let assetKey = asset.key;
        let suffixStr = asset.sufix;

        // Resolve template parameters if not in template mode
        if (!renderWithTemplates) {
          if (assetKey.startsWith('{')) {
            const resolved = this.resolveTemplateParam(assetKey, params, paramsSchema);
            if (resolved && typeof resolved === 'string' && !resolved.startsWith('{')) {
              assetKey = resolved;
            } else {
              continue; // Skip unresolvable templates
            }
          }
          // Resolve template suffix to actual value
          if (typeof suffixStr === 'string' && suffixStr.startsWith('{')) {
            const resolved = this.resolveTemplateParam(suffixStr, params, paramsSchema);
            if (resolved && typeof resolved === 'string') {
              suffixStr = resolved;
            } else {
              suffixStr = undefined;
            }
          }
        }

        const img = this.assetPreviewService.getCachedImage(assetKey);
        if (!img) continue;

        ctx.save();

        // Apply color filter - ensure suffixStr is a string before calling startsWith
        if (typeof suffixStr === 'string' && suffixStr.startsWith('#')) {
          ctx.filter = this.buildCSSFilterForCanvas(suffixStr);
        }

        const offsetX = asset.off?.x ?? 0;
        const offsetY = asset.off?.y ?? 0;
        const heightOffset = (asset.h ?? 0) * 6;
        const imgW = 24;
        const imgH = 24;

        const drawX = centerX + offsetX;
        const drawY = centerY - heightOffset + offsetY;

        const rotation = (asset.keyR ?? 0) * 90;
        if (rotation !== 0) {
          ctx.translate(drawX, drawY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
        } else {
          ctx.drawImage(img, drawX - imgW / 2, drawY - imgH / 2, imgW, imgH);
        }

        ctx.restore();
      }
    }
  }

  /**
   * Build CSS filter string for canvas rendering.
   */
  private buildCSSFilterForCanvas(suffix: string): string {
    if (!suffix.startsWith('#')) return 'none';

    const parts = suffix.substring(1).split('_');
    let hue = 0;
    let saturation = 100;
    let brightness = 100;

    for (const part of parts) {
      const type = part.charAt(0);
      const value = parseInt(part.substring(1), 10) || 0;
      switch (type) {
        case 'H': hue = value; break;
        case 'C': brightness = (value / 128) * 100; break;
        case 'S': saturation = value * 2; break;
        case 'B': brightness = (value / 128) * 100; break;
      }
    }

    return `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
  }

  /**
   * Resolve a template parameter reference (e.g., "{WALL_SUFFIX}") to its actual value.
   */
  private resolveTemplateParam(
    templateRef: string,
    params: Record<string, string | number | boolean>,
    paramsSchema: Record<string, { type: string; label: string }>
  ): string | number | boolean | null {
    const match = templateRef.match(/^\{(\w+)\}$/);
    if (!match) return templateRef;
    const paramName = match[1];
    return params[paramName] ?? null;
  }

  /**
   * Render an asset thumbnail in a container element.
   */
  private async renderAssetThumbnail(
    container: HTMLElement,
    asset: { key?: string; sufix?: string; keyR?: number; h?: number },
    resolvedValue: string | null
  ): Promise<void> {
    const assetKey = asset.key || "";
    if (!assetKey || assetKey.startsWith('{')) {
      container.innerHTML = `<span class="template-placeholder">${assetKey || '?'}</span>`;
      return;
    }

    const img = this.assetPreviewService.getCachedImage(assetKey);
    if (!img) {
      container.innerHTML = `<span class="missing-asset">?</span>`;
      return;
    }

    const thumbImg = document.createElement("img");
    thumbImg.src = img.src;
    thumbImg.className = "thumb-img";

    // Apply CSS filter for color suffix
    if (asset.sufix?.startsWith('#')) {
      thumbImg.style.filter = this.buildCSSFilterString(asset.sufix);
    }

    // Apply rotation
    const rotation = (asset.keyR ?? 0) * 90;
    if (rotation !== 0) {
      thumbImg.style.transform = `rotate(${rotation}deg)`;
    }

    container.innerHTML = '';
    container.appendChild(thumbImg);
  }

  /**
   * Build CSS filter string for HTML elements.
   */
  private buildCSSFilterString(suffix: string): string {
    if (!suffix.startsWith('#')) return 'none';

    const parts = suffix.substring(1).split('_');
    let hue = 0;
    let saturation = 100;
    let brightness = 100;

    for (const part of parts) {
      const type = part.charAt(0);
      const value = parseInt(part.substring(1), 10) || 0;
      switch (type) {
        case 'H': hue = value; break;
        case 'C': brightness = (value / 128) * 100; break;
        case 'S': saturation = value * 2; break;
        case 'B': brightness = (value / 128) * 100; break;
      }
    }

    return `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
  }

  /**
   * Open the tile editor modal for editing a specific tile.
   */
  private openTileEditor(
    config: AssetCollectionConfig,
    tile: TileConfig,
    index: number
  ): void {
    if (!this.tileEditorPanel) return;

    const context = buildTileEditContextFromAssetCollection(config, (updatedTile) => {
      // Update tile in config
      this.onConfigChange(config, (c) => {
        if (!c.tiles) c.tiles = [];
        c.tiles[index] = { ...updatedTile };
      });
    });

    // Pass available assets and face keys from collection
    const allFaceKeys = new Set<string>();
    for (const t of config.tiles || []) {
      for (const f of t.face || []) {
        if (f) allFaceKeys.add(f);
      }
    }
    context.faceKeys = Array.from(allFaceKeys).sort();

    this.tileEditorPanel.open(
      this.container!,
      { ...tile },
      context
    );

    // Listen for tile editor close to refresh previews
    const originalOnClose = context.onClose;
    context.onClose = () => {
      originalOnClose?.();
      this.renderTilePreviewSection(config);
    };
  }

  /**
   * Render tile list section.
   */
  private renderTileListSection(config: AssetCollectionConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const headerRow = document.createElement("div");
    headerRow.className = "editor-section-header";

    const header = document.createElement("h3");
    const tiles = config.tiles || [];
    header.textContent = `Tiles (${tiles.length})`;
    headerRow.appendChild(header);

    // Filter input
    const filterInput = document.createElement("input");
    filterInput.type = "text";
    filterInput.placeholder = "Filter tiles...";
    filterInput.className = "tile-filter-input";
    filterInput.addEventListener("input", () => {
      const filter = filterInput.value.toLowerCase();
      this.filterTileList(config, filter);
    });
    headerRow.appendChild(filterInput);

    section.appendChild(headerRow);

    const table = document.createElement("table");
    table.className = "tile-list-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Face (NW, NE, SE, SW)</th>
          <th>Weight</th>
          <th>Source</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="tile-list-tbody"></tbody>
    `;

    const tbody = table.querySelector("#tile-list-tbody");
    tiles.forEach((tile: TileConfig, i: number) => {
      const tr = document.createElement("tr");
      tr.dataset.tileFace = (tile.face || []).filter((f) => f).join(",").toLowerCase();
      tr.dataset.tileSource = `${tile.sourceGetter || ""} ${tile.sourceCollection || ""}`.toLowerCase();

      tr.innerHTML = `
        <td>${tile.id || `tile_${i}`}</td>
        <td>[${(tile.face || []).join(", ")}]</td>
        <td>${tile.weight ?? 0}</td>
        <td>${tile.sourceGetter ? `from ${tile.sourceGetter}` : "—"}</td>
        <td>
          <button class="btn-small" data-action="duplicate-tile" data-index="${i}">Duplicate</button>
          <button class="btn-small btn-danger" data-action="delete-tile" data-index="${i}">Delete</button>
        </td>
      `;
      tbody?.appendChild(tr);
    });

    section.appendChild(table);

    // Add Tile button
    const addDiv = document.createElement("div");
    addDiv.className = "tile-list-actions";
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Tile";
    addBtn.className = "btn-small primary";
    addBtn.addEventListener("click", () => {
      const newTile: TileConfig = {
        id: `tile_${config.tiles ? config.tiles.length : 0}`,
        face: [null, null, null, null],
        weight: 0,
        assets: [],
        functions: [],
      };
      this.onConfigChange(config, (c) => {
        if (!c.tiles) c.tiles = [];
        c.tiles.push(newTile);
      });
    });
    addDiv.appendChild(addBtn);
    section.appendChild(addDiv);

    // Bind action handlers
    section.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "BUTTON") return;

      const action = target.dataset.action;
      const index = parseInt(target.dataset.index || "-1", 10);
      if (index < 0 || !action) return;

      if (action === "duplicate-tile") {
        const tile = { ...tiles[index] };
        tile.id = `${tile.id || `tile_${index}`}_copy`;
        this.onConfigChange(config, (c) => {
          if (!c.tiles) c.tiles = [];
          c.tiles.push(tile);
        });
      } else if (action === "delete-tile") {
        if (confirm(`Delete tile "${tiles[index].id}"?`)) {
          this.onConfigChange(config, (c) => {
            if (!c.tiles) c.tiles = [];
            c.tiles.splice(index, 1);
          });
        }
      }
    });

    return section;
  }

  /**
   * Filter tile list based on search term.
   */
  private filterTileList(config: AssetCollectionConfig, filter: string): void {
    const tbody = this.container?.querySelector("#tile-list-tbody");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
      const tr = row as HTMLTableRowElement;
      const face = tr.dataset.tileFace || "";
      const source = tr.dataset.tileSource || "";
      const visible = face.includes(filter) || source.includes(filter);
      tr.style.display = visible ? "" : "none";
    });
  }

  /**
   * Render action bar with Save button.
   */
  private renderActionBar(config: AssetCollectionConfig): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "editor-action-bar";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "💾 Save Config";
    saveBtn.className = "btn-primary";

    const state = this.stateManager.getState();
    const isDirty = state.activeConfig.isDirty;

    if (isDirty) {
      saveBtn.textContent += " (dirty)";
      saveBtn.classList.add("dirty");
    }

    saveBtn.addEventListener("click", async () => {
      try {
        this.stateManager.setLoading(true);
        this.stateManager.setError(null);
        await this.apiClient.saveAssetCollection(config.id, config);
        // Mark as saved
        this.stateManager.setState({
          activeConfig: {
            ...this.stateManager.getState().activeConfig,
            isDirty: false,
          },
        });
      } catch (error: any) {
        this.stateManager.setError(`Save failed: ${error.message}`);
      } finally {
        this.stateManager.setLoading(false);
      }
    });

    bar.appendChild(saveBtn);
    return bar;
  }

  /**
   * Helper to update a config and mark as dirty.
   */
  private onConfigChange(
    config: AssetCollectionConfig,
    mutator: (c: AssetCollectionConfig) => void
  ): void {
    mutator(config);
    this.stateManager.updateConfig("assetCollection", config.id, config);
  }

  /**
   * Cleanup — unsubscribe from state changes.
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}