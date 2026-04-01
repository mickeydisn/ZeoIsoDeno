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