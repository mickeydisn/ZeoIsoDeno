/**
 * Building Editor Panel — Main Building Configuration Editor
 *
 * Renders the full editable view of a building config, including:
 * 1. Parameters (growLoopCount, endLoopMax)
 * 2. Asset Collection References
 * 3. Face Link Weights (via WeightTable component)
 * 4. Face Links (via FaceLinkTable component)
 * 5. Start Tiles
 * 6. Tile List
 * 7. Preview
 *
 * Changes mark the config as dirty immediately.
 */

import type { StateManager } from "../state.ts";
import type { ApiClient } from "../api.ts";
import type {
  BuildingConfig,
  AssetCollectionConfig,
  TileConfig,
  AssetCollectionRef,
  TileGroupConfig,
} from "../../../types.ts";
import { WeightTable } from "../components/weightTable.ts";
import { FaceLinkTable } from "../components/faceLinkTable.ts";
import { GroupEditor } from "../components/groupEditor.ts";

// ============================================================================
// Building Editor Panel Class
// ============================================================================

export class BuildingEditorPanel {
  private stateManager: StateManager;
  private apiClient: ApiClient;
  private container: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private weightTable: WeightTable | null = null;
  private faceLinkTable: FaceLinkTable | null = null;
  private selectedTileIndices: Set<number> = new Set();

  constructor(stateManager: StateManager, apiClient: ApiClient) {
    this.stateManager = stateManager;
    this.apiClient = apiClient;
  }

  /**
   * Render the building editor panel into the given container.
   */
  render(container: HTMLElement): void {
    console.log('[BuildingEditorPanel] render() called');
    this.container = container;
    container.innerHTML = "";

    // Subscribe to state changes
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.unsubscribe = this.stateManager.subscribe(() => this.renderIfNeeded());

    console.log('[BuildingEditorPanel] Calling renderContent()');
    this.renderContent();
  }

  /**
   * Render content only if active config is a building.
   */
  private renderContent(): void {
    if (!this.container) return;

    const state = this.stateManager.getState();
    const activeConfig = state.activeConfig;

    if (!activeConfig || activeConfig.type !== "building" || !activeConfig.data) {
      this.renderEmptyState();
      return;
    }

    this.renderEditor(activeConfig.data as BuildingConfig);
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
   * Render empty state when no building is selected.
   */
  private renderEmptyState(): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="placeholder-content">
        <h2>Building Editor</h2>
        <p>Select a building config from the library to start editing.</p>
      </div>
    `;
  }

  /**
   * Render the full building editor.
   */
  private renderEditor(config: BuildingConfig): void {
    if (!this.container) return;

    this.container.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "building-editor-panel";

    // Header
    panel.appendChild(this.renderHeader(config));

    // Section 1: Parameters
    panel.appendChild(this.renderParametersSection(config));

    // Section 2: Asset Collection References
    panel.appendChild(this.renderAssetCollectionsSection(config));

    // Section 3: Face Link Weights
    const weightSection = document.createElement("div");
    weightSection.className = "editor-section";
    const weightHeader = document.createElement("h3");
    weightHeader.textContent = "Face Link Weights";
    weightSection.appendChild(weightHeader);
    const weightContainer = document.createElement("div");
    weightContainer.className = "weight-table-container";
    weightSection.appendChild(weightContainer);
    panel.appendChild(weightSection);

    // Collect all face keys from tiles
    const allFaceKeys = this.collectAllFaceKeys(config);

    // Render weight table
    if (this.weightTable) this.weightTable.destroy();
    this.weightTable = new WeightTable(
      weightContainer,
      config.faceLinkWeight,
      allFaceKeys,
      (updatedWeight) => {
        this.onConfigChange(config, (c) => {
          c.faceLinkWeight = updatedWeight;
        });
      }
    );
    this.weightTable.render();

    // Section 4: Face Links
    const faceLinkSection = document.createElement("div");
    faceLinkSection.className = "editor-section";
    const faceLinkHeader = document.createElement("h3");
    faceLinkHeader.textContent = "Face Links (Unique Pairs)";
    faceLinkSection.appendChild(faceLinkHeader);
    const faceLinkContainer = document.createElement("div");
    faceLinkContainer.className = "face-link-container";
    faceLinkSection.appendChild(faceLinkContainer);
    panel.appendChild(faceLinkSection);

    // Render face link table
    if (this.faceLinkTable) this.faceLinkTable.destroy();
    this.faceLinkTable = new FaceLinkTable(
      faceLinkContainer,
      config.faceLinks || [],
      allFaceKeys,
      (updatedLinks) => {
        this.onConfigChange(config, (c) => {
          c.faceLinks = updatedLinks;
        });
      },
      config.faceLinkWeight // Pass weight for warning indicators
    );
    this.faceLinkTable.render();

    // Section 5: Start Tiles
    panel.appendChild(this.renderStartTilesSection(config));

    // Section 6: Tile List
    panel.appendChild(this.renderTileListSection(config));

    // Section 7: Groups
    panel.appendChild(this.renderGroupsSection(config));

    // Section 8: Preview
    panel.appendChild(this.renderPreviewSection(config));

    // Action bar
    panel.appendChild(this.renderActionBar(config));

    this.container.appendChild(panel);
  }

  /**
   * Collect all face keys from faceLinks and tiles.
   */
  private collectAllFaceKeys(config: BuildingConfig): string[] {
    const keys = new Set<string>();

    // From faceLinkWeight
    for (const key of Object.keys(config.faceLinkWeight)) {
      keys.add(key);
    }

    // From faceLinks
    for (const [a, b] of config.faceLinks || []) {
      keys.add(a);
      keys.add(b);
    }

    // From tiles
    for (const tile of config.tiles || []) {
      for (const f of tile.face || []) {
        if (f) keys.add(f);
      }
    }

    // From startTiles
    for (const tile of config.startTiles || []) {
      for (const f of tile.face || []) {
        if (f) keys.add(f);
      }
    }

    return Array.from(keys).sort();
  }

  /**
   * Render header with building metadata.
   */
  private renderHeader(config: BuildingConfig): HTMLElement {
    // Get current source from state manager for accurate display
    const state = this.stateManager.getState();
    const source = state.activeConfig.source;

    const header = document.createElement("div");
    header.className = "editor-header";
    
    const titleDiv = document.createElement("div");
    titleDiv.innerHTML = `<h2 class="editor-title">🏗️ ${config.id}</h2>`;

    const meta = document.createElement("div");
    meta.className = "editor-meta";

    if (config.metadata) {
      meta.innerHTML = `
        <span class="meta-item"><strong>Class:</strong> ${config.metadata.classRef || "N/A"}</span>
        <span class="meta-item"><strong>Registry ID:</strong> ${config.metadata.registryId || "N/A"}</span>
      `;
    }

    // Source indicator badge
    const sourceIndicator = document.createElement("div");
    sourceIndicator.className = "editor-source";
    if (source === "extracted") {
      sourceIndicator.innerHTML = `<span class="source-badge source-extracted">🔧 Extracted from TypeScript</span>`;
    } else if (source === "loaded") {
      sourceIndicator.innerHTML = `<span class="source-badge source-loaded">📄 Loaded from JSON</span>`;
    } else {
      sourceIndicator.innerHTML = `<span class="source-badge source-unknown">❓ Unknown Source</span>`;
    }

    // Action buttons container
    const headerRight = document.createElement("div");
    headerRight.className = "header-right";

    // "Reset to Default" button (only for extracted configs)
    if (source === "extracted") {
      const resetBtn = document.createElement("button");
      resetBtn.textContent = "🔄 Reset to Default";
      resetBtn.className = "btn-small btn-warning";
      resetBtn.title = "Re-extract from original TypeScript class, discarding all edits";
      resetBtn.addEventListener("click", () => {
        this.resetToDefault(config);
      });
      headerRight.appendChild(resetBtn);
    }

    // "Revert to Original" button (only for loaded JSON configs)
    if (source === "loaded") {
      const revertBtn = document.createElement("button");
      revertBtn.textContent = "↩️ Revert to Original";
      revertBtn.className = "btn-small btn-warning";
      revertBtn.title = "Reload original JSON from disk, discarding all unsaved edits";
      revertBtn.addEventListener("click", () => {
        this.revertToOriginal(config);
      });
      headerRight.appendChild(revertBtn);
    }

    header.appendChild(titleDiv);
    header.appendChild(meta);
    header.appendChild(sourceIndicator);
    header.appendChild(headerRight);
    return header;
  }

  /**
   * Reset config to default by re-extracting from TypeScript class.
   */
  private async resetToDefault(config: BuildingConfig): Promise<void> {
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
      const freshConfig = await this.apiClient.extractBuilding(classRef);
      
      // Replace current config with fresh extraction
      this.stateManager.updateConfig("building", config.id, freshConfig);
      
      // Also set as active config (not dirty since it's fresh from TS)
      this.stateManager.setActiveConfig("building", config.id, freshConfig, "extracted");
    } catch (error: any) {
      this.stateManager.setError(`Reset failed: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Revert loaded JSON config to its original state by reloading from disk.
   */
  private async revertToOriginal(config: BuildingConfig): Promise<void> {
    if (!confirm(`Revert "${config.id}" to the original version saved on disk?\n\nAll unsaved changes will be discarded.`)) {
      return;
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);
      
      // Reload the original JSON from disk via API
      const originalConfig = await this.apiClient.loadBuilding(config.id);
      originalConfig.type = "building";
      originalConfig.id = config.id;
      
      // Add original to state and set as active (clean, not dirty)
      this.stateManager.updateConfig("building", config.id, originalConfig);
      this.stateManager.setActiveConfig("building", config.id, originalConfig, "loaded");
    } catch (error: any) {
      this.stateManager.setError(`Revert failed: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Render parameters section.
   */
  private renderParametersSection(config: BuildingConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const header = document.createElement("h3");
    header.textContent = "Parameters";
    section.appendChild(header);

    const form = document.createElement("div");
    form.className = "params-form";

    // growLoopCount
    const glcRow = document.createElement("div");
    glcRow.className = "param-row";
    glcRow.innerHTML = `
      <label class="param-label">Grow Loop Count (5-100):</label>
      <input type="number" class="param-input" min="5" max="100" value="${config.params?.growLoopCount ?? 50}" />
    `;
    const glcInput = glcRow.querySelector("input");
    glcInput?.addEventListener("change", (e) => {
      const val = Math.min(100, Math.max(5, parseInt((e.target as HTMLInputElement).value, 10) || 50));
      (e.target as HTMLInputElement).value = String(val);
      this.onConfigChange(config, (c) => {
        if (!c.params) c.params = {} as BuildingConfig["params"];
        c.params.growLoopCount = val;
      });
    });
    form.appendChild(glcRow);

    // endLoopMax
    const elmRow = document.createElement("div");
    elmRow.className = "param-row";
    elmRow.innerHTML = `
      <label class="param-label">End Loop Max (50-1000):</label>
      <input type="number" class="param-input" min="50" max="1000" value="${config.params?.endLoopMax ?? 200}" />
    `;
    const elmInput = elmRow.querySelector("input");
    elmInput?.addEventListener("change", (e) => {
      const val = Math.min(1000, Math.max(50, parseInt((e.target as HTMLInputElement).value, 10) || 200));
      (e.target as HTMLInputElement).value = String(val);
      this.onConfigChange(config, (c) => {
        if (!c.params) c.params = {} as BuildingConfig["params"];
        c.params.endLoopMax = val;
      });
    });
    form.appendChild(elmRow);

    section.appendChild(form);
    return section;
  }

  /**
   * Render asset collections section.
   */
  private renderAssetCollectionsSection(config: BuildingConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const header = document.createElement("h3");
    header.textContent = "Asset Collections";
    section.appendChild(header);

    const collections = config.assetCollections || [];

    if (collections.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-state";
      emptyDiv.textContent = "No asset collections referenced.";
      section.appendChild(emptyDiv);
      return section;
    }

    const table = document.createElement("table");
    table.className = "collections-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Tag Prefix</th>
          <th>Class</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    collections.forEach((ref: AssetCollectionRef, index: number) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ref.id}</td>
        <td>${ref.tag || "N/A"}</td>
        <td class="col-class-ref">${ref.classRef}</td>
        <td class="col-actions">
          <button class="btn-small" data-action="open" data-index="${index}">Open</button>
          <button class="btn-small btn-warning" data-action="remove" data-index="${index}">Remove</button>
        </td>
      `;
      tbody?.appendChild(tr);
    });

    section.appendChild(table);

    // "Add Asset Collection" section
    const addSection = document.createElement("div");
    addSection.className = "add-asset-collection-section";
    
    const addBtn = document.createElement("button");
    addBtn.className = "btn-small primary";
    addBtn.textContent = "➕ Add Asset Collection";
    addBtn.id = "btn-add-asset-collection";
    addSection.appendChild(addBtn);

    // Dropdown for available collections (hidden by default)
    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "add-asset-dropdown-container hidden";
    dropdownContainer.id = "add-asset-collection-dropdown";

    const select = document.createElement("select");
    select.className = "add-asset-select";
    select.id = "add-asset-collection-select";
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Select an asset collection —";
    select.appendChild(defaultOption);

    // Populate dropdown with available asset collections from state
    const state = this.stateManager.getState();
    const tsClasses = state.ui.tsClasses;
    const loadedCollections = this.stateManager.getConfigs("assetCollection");
    
    // Track added collection IDs to prevent duplicates
    const existingCollectionIds = new Set(collections.map(c => c.id));
    const addedOptions = new Set<string>();

    // Add TS classes
    if (tsClasses?.assetCollections?.length) {
      for (const className of tsClasses.assetCollections) {
        if (!existingCollectionIds.has(className) && !addedOptions.has(className)) {
          const option = document.createElement("option");
          option.value = className;
          option.textContent = `${className} (TS)`;
          option.dataset.classRef = className;
          option.dataset.source = "ts";
          select.appendChild(option);
          addedOptions.add(className);
        }
      }
    }

    // Add loaded JSON collections
    for (const collection of loadedCollections) {
      if (!existingCollectionIds.has(collection.id) && !addedOptions.has(collection.id)) {
        const option = document.createElement("option");
        option.value = collection.id;
        option.textContent = `${collection.id} (JSON)`;
        option.dataset.classRef = (collection as AssetCollectionConfig).metadata?.classRef || "";
        option.dataset.source = "json";
        option.dataset.tag = (collection as AssetCollectionConfig).tag || "";
        select.appendChild(option);
        addedOptions.add(collection.id);
      }
    }

    dropdownContainer.appendChild(select);

    // Confirm button
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn-small primary";
    confirmBtn.textContent = "Confirm";
    confirmBtn.id = "btn-confirm-add-asset-collection";
    confirmBtn.style.display = "none";
    dropdownContainer.appendChild(confirmBtn);

    addSection.appendChild(dropdownContainer);
    section.appendChild(addSection);

    // Toggle dropdown on button click
    addBtn.addEventListener("click", () => {
      const isHidden = dropdownContainer.classList.contains("hidden");
      dropdownContainer.classList.toggle("hidden", !isHidden);
      confirmBtn.style.display = isHidden && select.value ? "inline-block" : "none";
    });

    // Show confirm button when selection changes
    select.addEventListener("change", () => {
      confirmBtn.style.display = select.value ? "inline-block" : "none";
    });

    // Handle adding the selected collection
    confirmBtn.addEventListener("click", () => {
      const selectedValue = select.value;
      if (!selectedValue) return;

      const selectedOption = select.querySelector(`option[value="${selectedValue}"]`) as HTMLOptionElement;
      const source = selectedOption?.dataset.source || "ts";
      const classRef = selectedOption?.dataset.classRef || selectedValue;
      const tag = selectedOption?.dataset.tag || "";

      // Determine tag prefix based on collection type
      let tagPrefix = tag;
      if (!tagPrefix) {
        // Infer tag prefix from class name patterns
        if (selectedValue.includes("Wall")) tagPrefix = "WH_";
        else if (selectedValue.includes("Fence")) tagPrefix = "F_";
        else if (selectedValue.includes("Platform")) tagPrefix = "FP_";
        else if (selectedValue.includes("Grave")) tagPrefix = "G_";
        else if (selectedValue.includes("Lab")) tagPrefix = "L_";
        else tagPrefix = selectedValue.substring(0, 3).toUpperCase() + "_";
      }

      const newRef: AssetCollectionRef = {
        id: selectedValue,
        classRef: classRef || selectedValue,
        tag: tagPrefix,
        params: {},
        sourceFile: source === "ts" ? selectedValue.toLowerCase() : selectedValue.toLowerCase(),
      };

      this.onConfigChange(config, (c) => {
        if (!c.assetCollections) c.assetCollections = [];
        c.assetCollections.push(newRef);
      });

      // Reset dropdown state
      select.value = "";
      dropdownContainer.classList.add("hidden");
      confirmBtn.style.display = "none";
    });

    // Bind action handlers
    section.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "BUTTON") return;

      const action = target.dataset.action;
      const index = parseInt(target.dataset.index || "-1", 10);
      if (index < 0) return;

      if (action === "open") {
        const ref = collections[index];
        // Switch to asset collection
        const acConfigs = this.stateManager.getConfigs("assetCollection");
        const matching = acConfigs.find(
          (ac) => ac.id === ref.id || ac.metadata?.classRef === ref.classRef
        );
        if (matching) {
          this.stateManager.setActiveConfig("assetCollection", matching.id, matching);
        } else {
          this.stateManager.setError(`Asset collection "${ref.id}" not found in loaded configs`);
        }
      } else if (action === "remove") {
        if (confirm(`Remove asset collection "${collections[index].id}"?`)) {
          this.onConfigChange(config, (c) => {
            if (!c.assetCollections) c.assetCollections = [];
            c.assetCollections.splice(index, 1);
          });
        }
      }
    });

    return section;
  }

  /**
   * Render start tiles section.
   */
  private renderStartTilesSection(config: BuildingConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const headerRow = document.createElement("div");
    headerRow.className = "editor-section-header";

    const header = document.createElement("h3");
    const count = config.startTiles?.length || 0;
    header.textContent = `Start Tiles (${count})`;
    headerRow.appendChild(header);

    // "Edit Start Tiles" button
    const editStartTilesBtn = document.createElement("button");
    editStartTilesBtn.className = "btn-small primary";
    editStartTilesBtn.textContent = "✏️ Edit Start Tiles";
    editStartTilesBtn.addEventListener("click", () => {
      this.openTileEditorForStartTiles(config);
    });
    headerRow.appendChild(editStartTilesBtn);

    section.appendChild(headerRow);

    if (count === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-state";
      emptyDiv.textContent = "No start tiles configured.";
      section.appendChild(emptyDiv);
      return section;
    }

    // Summary view
    const summary = document.createElement("table");
    summary.className = "start-tiles-summary";
    summary.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Face (NW, NE, SE, SW)</th>
          <th>Weight</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = summary.querySelector("tbody");
    config.startTiles?.forEach((tile: TileConfig, i: number) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${tile.id || `startTile_${i}`}</td>
        <td>[${tile.face?.join(", ") || "null,null,null,null"}]</td>
        <td>${tile.weight ?? 0}</td>
        <td>
          <button class="btn-small" data-action="edit-start" data-index="${i}">Edit</button>
        </td>
      `;
      tbody?.appendChild(tr);
    });

    section.appendChild(summary);

    // Bind edit-start action
    section.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "BUTTON") return;
      const action = target.dataset.action;
      const index = parseInt(target.dataset.index || "-1", 10);
      if (action === "edit-start" && index >= 0 && config.startTiles) {
        this.openTileEditorForTile(config.startTiles[index], (updatedTile) => {
          this.onConfigChange(config, (c) => {
            if (!c.startTiles) c.startTiles = [];
            c.startTiles[index] = updatedTile;
          });
        });
      }
    });

    return section;
  }

  /**
   * Open tile editor for editing all start tiles.
   */
  private openTileEditorForStartTiles(config: BuildingConfig): void {
    // Update state to show tile editor with start tiles
    this.stateManager.setState({
      ui: {
        ...this.stateManager.getState().ui,
        showTileEditor: true,
        editingTile: config.startTiles?.[0] || null,
      },
    });
  }

  /**
   * Open tile editor for a specific tile with save callback.
   */
  private openTileEditorForTile(
    tile: TileConfig,
    onSave: (updatedTile: TileConfig) => void
  ): void {
    this.stateManager.setState({
      ui: {
        ...this.stateManager.getState().ui,
        showTileEditor: true,
        editingTile: tile,
      },
    });
  }

  /**
   * Render tile list section.
   */
  private tileSort: { field: "id" | "face" | "weight" | "source"; direction: "asc" | "desc" } = {
    field: "id",
    direction: "asc",
  };

  private renderTileListSection(config: BuildingConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const headerRow = document.createElement("div");
    headerRow.className = "editor-section-header";

    const tiles = config.tiles || [];
    const groups = this.groupTilesByRotation(tiles);

    const header = document.createElement("h3");
    header.textContent = `Tiles (${tiles.length} total, ${groups.length} unique)`;
    headerRow.appendChild(header);

    // Sort buttons
    const sortButtons = this.renderSortButtons(config);
    headerRow.appendChild(sortButtons);

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

    // Selection actions bar
    const selectionBar = document.createElement("div");
    selectionBar.className = "tile-selection-bar";
    selectionBar.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
    `;

    const selectAllBtn = document.createElement("button");
    selectAllBtn.className = "btn-small";
    selectAllBtn.textContent = "Select All";
    selectAllBtn.addEventListener("click", () => {
      const tbody = this.container?.querySelector("#tile-list-tbody");
      if (!tbody) return;
      const checkboxes = tbody.querySelectorAll("input[type='checkbox']") as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((cb) => {
        cb.checked = true;
        const index = parseInt(cb.dataset.index || "-1", 10);
        if (index >= 0) this.selectedTileIndices.add(index);
      });
      this.updateSelectionCount();
    });
    selectionBar.appendChild(selectAllBtn);

    const deselectAllBtn = document.createElement("button");
    deselectAllBtn.className = "btn-small";
    deselectAllBtn.textContent = "Deselect All";
    deselectAllBtn.addEventListener("click", () => {
      this.selectedTileIndices.clear();
      const tbody = this.container?.querySelector("#tile-list-tbody");
      if (!tbody) return;
      const checkboxes = tbody.querySelectorAll("input[type='checkbox']") as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((cb) => cb.checked = false);
      this.updateSelectionCount();
    });
    selectionBar.appendChild(deselectAllBtn);

    const createGroupFromSelectedBtn = document.createElement("button");
    createGroupFromSelectedBtn.className = "btn-small primary";
    createGroupFromSelectedBtn.textContent = "📦 Create Group from Selected";
    createGroupFromSelectedBtn.id = "btn-create-group-from-selected";
    createGroupFromSelectedBtn.addEventListener("click", () => {
      this.createGroupFromSelectedTiles(config);
    });
    selectionBar.appendChild(createGroupFromSelectedBtn);

    const selectionCount = document.createElement("span");
    selectionCount.id = "selection-count";
    selectionCount.className = "selection-count";
    selectionCount.textContent = "0 selected";
    selectionCount.style.cssText = `
      color: var(--text-secondary, #888);
      font-size: 12px;
      margin-left: 8px;
    `;
    selectionBar.appendChild(selectionCount);

    section.appendChild(selectionBar);

    const table = document.createElement("table");
    table.className = "tile-list-table tile-list-grouped";
    table.innerHTML = `
      <thead>
        <tr>
          <th><input type="checkbox" id="select-all-checkbox" title="Select All"></th>
          <th class="sortable" data-sort="id">ID <span class="sort-indicator"></span></th>
          <th>🔄</th>
          <th class="sortable" data-sort="face">Face Preview <span class="sort-indicator"></span></th>
          <th class="sortable" data-sort="weight">Weight <span class="sort-indicator"></span></th>
          <th class="sortable" data-sort="source">Source Info <span class="sort-indicator"></span></th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="tile-list-tbody"></tbody>
    `;

    // Bind select-all checkbox
    const selectAllCheckbox = table.querySelector("#select-all-checkbox") as HTMLInputElement;
    selectAllCheckbox.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      const tbody = table.querySelector("#tile-list-tbody");
      if (!tbody) return;
      const checkboxes = tbody.querySelectorAll("input[type='checkbox']") as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((cb) => {
        cb.checked = checked;
        const index = parseInt(cb.dataset.index || "-1", 10);
        if (index >= 0) {
          if (checked) {
            this.selectedTileIndices.add(index);
          } else {
            this.selectedTileIndices.delete(index);
          }
        }
      });
      this.updateSelectionCount();
    });

    // Bind sort on header click
    const thead = table.querySelector("thead");
    thead?.addEventListener("click", (e) => {
      const th = (e.target as HTMLElement).closest("th") as HTMLElement;
      if (!th || !th.classList.contains("sortable")) return;
      const field = th.dataset.sort as "id" | "face" | "weight" | "source";
      this.toggleSort(field, config);
    });

    const tbody = table.querySelector("#tile-list-tbody");
    
    // Sort groups by representative tile
    const sortedGroups = [...groups].sort((a, b) => {
      const direction = this.tileSort.direction === "asc" ? 1 : -1;
      switch (this.tileSort.field) {
        case "id":
          return direction * (a.rep.id || "").localeCompare(b.rep.id || "");
        case "face": {
          const aFace = (a.rep.face || []).filter((f) => f).join(",");
          const bFace = (b.rep.face || []).filter((f) => f).join(",");
          return direction * aFace.localeCompare(bFace);
        }
        case "weight":
          return direction * ((a.rep.weight ?? 0) - (b.rep.weight ?? 0));
        case "source": {
          const aSrc = `${a.rep.sourceGetter || ""} ${a.rep.sourceCollection || ""}`;
          const bSrc = `${b.rep.sourceGetter || ""} ${b.rep.sourceCollection || ""}`;
          return direction * aSrc.localeCompare(bSrc);
        }
        default:
          return 0;
      }
    });

    sortedGroups.forEach((group) => {
      const { rep, members, indices } = group;
      const rotationCount = members.length;
      const tr = document.createElement("tr");
      
      // Store all member indices for actions
      tr.dataset.tileIndices = JSON.stringify(indices);
      tr.dataset.tileFace = (rep.face || []).filter((f) => f).join(",").toLowerCase();
      tr.dataset.tileSource = `${rep.sourceGetter || ""} ${rep.sourceCollection || ""}`.toLowerCase();
      
      // Check if any of the group's tiles are selected
      const isSelected = indices.some(idx => this.selectedTileIndices.has(idx));
      
      // Rotation badge
      const rotationBadge = rotationCount > 1 
        ? `<span class="rotation-badge" title="${rotationCount} rotation variants">${rotationCount}×</span>` 
        : "";

      tr.innerHTML = `
        <td><input type="checkbox" class="tile-checkbox" data-indices='${JSON.stringify(indices)}' ${isSelected ? "checked" : ""}></td>
        <td>${rep.id || `tile_${indices[0]}`}</td>
        <td class="rotation-cell">${rotationBadge}</td>
        <td>[${(rep.face || []).join(", ")}]</td>
        <td>${rep.weight ?? 0}</td>
        <td>${rep.sourceGetter ? `from ${rep.sourceGetter}` : rep.sourceCollection ? `from ${rep.sourceCollection}` : "—"}</td>
        <td>
          ${rotationCount > 1 ? `<button class="btn-small expand-group-btn" data-action="expand-group" data-indices='${JSON.stringify(indices)}' title="Show ${rotationCount} rotation variants">Expand</button>` : ""}
          <button class="btn-small" data-action="duplicate-group" data-indices='${JSON.stringify(indices)}'>Duplicate${rotationCount > 1 ? ` (${rotationCount})` : ""}</button>
          <button class="btn-small btn-danger" data-action="delete-group" data-indices='${JSON.stringify(indices)}'>Delete${rotationCount > 1 ? ` (${rotationCount})` : ""}</button>
        </td>
      `;
      tbody?.appendChild(tr);
    });

    // Bind checkbox change handlers
    tbody?.querySelectorAll(".tile-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        const indicesStr = target.dataset.indices;
        if (!indicesStr) return;
        
        try {
          const indices: number[] = JSON.parse(indicesStr);
          indices.forEach((idx) => {
            if (target.checked) {
              this.selectedTileIndices.add(idx);
            } else {
              this.selectedTileIndices.delete(idx);
            }
          });
          this.updateSelectionCount();
        } catch { /* skip */ }
      });
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
      const indicesStr = target.dataset.indices;
      
      if (!indicesStr || !action) return;
      
      let indices: number[];
      try {
        indices = JSON.parse(indicesStr);
      } catch {
        return;
      }
      if (indices.length === 0) return;

      const primaryIndex = indices[0];

      if (action === "duplicate-group") {
        // Duplicate all tiles in the group
        const newTiles: TileConfig[] = [];
        for (const idx of indices) {
          const tile = { ...tiles[idx] };
          tile.id = `${tile.id || `tile_${idx}`}_copy`;
          tile.assets = tile.assets?.map(a => ({ ...a }));
          tile.functions = tile.functions?.map(f => ({ ...f }));
          newTiles.push(tile);
        }
        this.onConfigChange(config, (c) => {
          if (!c.tiles) c.tiles = [];
          c.tiles.push(...newTiles);
        });
      } else if (action === "delete-group") {
        if (confirm(`Delete ${indices.length} tile(s) (${indices.length > 1 ? "all rotation variants" : "this tile"})?`)) {
          // Sort indices descending to avoid index shifting issues
          const sortedIndices = [...indices].sort((a, b) => b - a);
          this.onConfigChange(config, (c) => {
            if (!c.tiles) c.tiles = [];
            for (const idx of sortedIndices) {
              c.tiles.splice(idx, 1);
            }
          });
        }
      } else if (action === "expand-group") {
        // Expand to show all rotation variants
        this.expandTileGroup(config, indices);
      }
    });

    return section;
  }

  /**
   * Expand a tile group to show all rotation variants individually.
   */
  private expandTileGroup(config: BuildingConfig, indices: number[]): void {
    const tbody = this.container?.querySelector("#tile-list-tbody");
    if (!tbody) return;

    // Find the group row and expand it
    const rows = Array.from(tbody.querySelectorAll("tr"));
    for (const row of rows) {
      const tr = row as HTMLTableRowElement;
      const storedIndices = tr.dataset.tileIndices;
      if (storedIndices) {
        try {
          const groupIndices = JSON.parse(storedIndices);
          const matches = indices.every(i => groupIndices.includes(i)) && indices.length === groupIndices.length;
          if (matches) {
            tr.classList.add("expanded-group");
            // Show expanded rows after this one
            this.renderExpandedTileRows(tbody, row, config, indices);
          }
        } catch { /* skip */ }
      }
    }
  }

  /**
   * Render expanded rows for all tiles in a rotation group.
   */
  private renderExpandedTileRows(tbody: Element, afterRow: Element, config: BuildingConfig, indices: number[]): void {
    const tiles = config.tiles || [];
    for (const idx of indices) {
      const tile = tiles[idx];
      if (!tile) continue;
      
      const tr = document.createElement("tr");
      tr.className = "expanded-tile-row";
      tr.dataset.tileExpandedFor = JSON.stringify(indices);
      tr.dataset.tileIndex = String(idx);
      tr.dataset.tileFace = (tile.face || []).filter((f) => f).join(",").toLowerCase();
      tr.dataset.tileSource = `${tile.sourceGetter || ""} ${tile.sourceCollection || ""}`.toLowerCase();
      
      tr.innerHTML = `
        <td class="expanded-indent">↳ ${tile.id || `tile_${idx}`}</td>
        <td class="rotation-cell">1×</td>
        <td>[${(tile.face || []).join(", ")}]</td>
        <td>${tile.weight ?? 0}</td>
        <td>${tile.sourceGetter ? `from ${tile.sourceGetter}` : tile.sourceCollection ? `from ${tile.sourceCollection}` : "—"}</td>
        <td>
          <button class="btn-small" data-action="duplicate-tile" data-index="${idx}">Duplicate</button>
          <button class="btn-small btn-danger" data-action="delete-tile" data-index="${idx}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  /**
   * Render sort buttons for tile list.
   */
  private renderSortButtons(config: BuildingConfig): HTMLElement {
    const sortDiv = document.createElement("div");
    sortDiv.className = "tile-sort-buttons";

    const sortFields: { field: "id" | "face" | "weight" | "source"; label: string }[] = [
      { field: "id", label: "🔤 ID" },
      { field: "face", label: "🔷 Face Key" },
      { field: "weight", label: "⚖️ Weight" },
      { field: "source", label: "📁 Source Getter" },
    ];

    sortFields.forEach(({ field, label }) => {
      const btn = document.createElement("button");
      btn.className = "btn-small sort-btn";
      btn.textContent = label;
      btn.dataset.sort = field;

      if (this.tileSort.field === field) {
        btn.classList.add("active");
        btn.textContent += this.tileSort.direction === "asc" ? " ↑" : " ↓";
      }

      btn.addEventListener("click", () => {
        this.toggleSort(field, config);
      });

      sortDiv.appendChild(btn);
    });

    return sortDiv;
  }

  /**
   * Toggle sort order for the given field.
   */
  private toggleSort(field: "id" | "face" | "weight" | "source", config: BuildingConfig): void {
    if (this.tileSort.field === field) {
      this.tileSort.direction = this.tileSort.direction === "asc" ? "desc" : "asc";
    } else {
      this.tileSort.field = field;
      this.tileSort.direction = "asc";
    }
    this.renderContent();
  }

  /**
   * Compute all cyclic shifts of a tile's face array.
   */
  private getCyclicShifts(face: (string | null)[]): (string | null)[][] {
    const shifts: (string | null)[][] = [];
    for (let i = 0; i < 4; i++) {
      shifts.push(face.slice(i).concat(face.slice(0, i)));
    }
    return shifts;
  }

  /**
   * Normalize a tile signature to its lexicographically smallest cyclic shift.
   * This allows grouping tiles that are rotations of each other.
   */
  private normalizeTileSignature(tile: TileConfig): string {
    const face = tile.face || [null, null, null, null];
    const shifts = this.getCyclicShifts(face);
    const sorted = shifts.map(s => s.join(",")).sort();
    return sorted[0]; // canonical form
  }

  /**
   * Normalize an asset key by stripping direction suffixes (_NW, _NE, _SE, _SW).
   * This allows tiles with direction-specific assets to be grouped together.
   */
  private normalizeAssetKey(key: string | undefined): string {
    if (!key) return "";
    // Strip common direction suffixes: _NW, _NE, _SE, _SW, _Door, _Window, etc.
    const suffixes = ["_NW", "_NE", "_SE", "_SW", "_Door", "_Window", "_Roof", "_Wall"];
    let result = key;
    for (const suffix of suffixes) {
      if (result.endsWith(suffix)) {
        result = result.slice(0, -suffix.length);
      }
    }
    return result;
  }

  /**
   * Build a tile grouping key that ignores rotation but distinguishes different tile types.
   * Tiles with faces that are cyclic shifts of each other (e.g., [F_out, F_out, F_r, F_l]
   * and [F_l, F_out, F_out, F_r]) will produce the same normalized face signature and
   * be grouped together as rotation variants.
   */
  private getTileGroupKey(tile: TileConfig): string {
    const normalizedFace = this.normalizeTileSignature(tile);
    const weight = tile.weight ?? 0;
    const empty = tile.empty ?? false;
    const frise = tile.isFrise ?? false;
    const allowMove = tile.allowMove ?? false;
    // Normalize asset keys by stripping direction suffixes but keeping keyR for rotation offset
    const assetKeys = tile.assets?.map(a => {
      const normalizedKey = this.normalizeAssetKey(a.key);
      const keyR = a.keyR ?? 0;
      return normalizedKey ? `${normalizedKey}_r${keyR}` : "";
    })
      .filter(k => k)
      .sort() || [];
    const assets = JSON.stringify(assetKeys);
    // Compare functions by their actual func property and size
    const functions = JSON.stringify(
      tile.functions?.map(f => `${f.key || ""}_s${f.size ?? 0}`).sort() || []
    );
    const color = JSON.stringify(tile.color || null);
    return `${normalizedFace}|w=${weight}|e=${empty}|fr=${frise}|am=${allowMove}|a=${assets}|fn=${functions}|c=${color}`;
  }

  /**
   * Group tiles by their rotation-invariant signature.
   * Returns an array of { representative, members, originalIndices } groups.
   */
  private groupTilesByRotation(tiles: TileConfig[]): { rep: TileConfig; members: TileConfig[]; indices: number[] }[] {
    const groups = new Map<string, { members: TileConfig[]; indices: number[] }>();
    tiles.forEach((tile, origIdx) => {
      const key = this.getTileGroupKey(tile);
      if (!groups.has(key)) {
        groups.set(key, { members: [], indices: [] });
      }
      groups.get(key)!.members.push(tile);
      groups.get(key)!.indices.push(origIdx);
    });
    return Array.from(groups.entries()).map(([key, group]) => ({
      rep: group.members[0],
      members: group.members,
      indices: group.indices,
    }));
  }

  /**
   * Filter tile list based on search term.
   */
  private filterTileList(config: BuildingConfig, filter: string): void {
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
   * Render groups section with group list and create/edit/delete support.
   */
  private renderGroupsSection(config: BuildingConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const headerRow = document.createElement("div");
    headerRow.className = "editor-section-header";

    const groups = config.groups || [];
    const header = document.createElement("h3");
    header.textContent = `📦 Groups (${groups.length})`;
    headerRow.appendChild(header);

    // Create group button
    const createBtn = document.createElement("button");
    createBtn.className = "btn-small btn-primary";
    createBtn.textContent = "+ Create Group";
    createBtn.addEventListener("click", () => {
      this.createGroup(config);
    });
    headerRow.appendChild(createBtn);

    section.appendChild(headerRow);

    // Groups list
    if (groups.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "empty-state";
      emptyMsg.textContent = "No groups defined. Groups allow you to define shared face configurations with multiple tile items.";
      section.appendChild(emptyMsg);
    } else {
      const groupsList = document.createElement("div");
      groupsList.className = "groups-list";

      groups.forEach((group, index) => {
        const groupCard = this.createGroupCard(config, group, index);
        groupsList.appendChild(groupCard);
      });

      section.appendChild(groupsList);
    }

    return section;
  }

  /**
   * Create a group card for displaying and editing a group.
   */
  private createGroupCard(config: BuildingConfig, group: TileGroupConfig, index: number): HTMLElement {
    const card = document.createElement("div");
    card.className = "group-card";

    // Group header
    const cardHeader = document.createElement("div");
    cardHeader.className = "group-card-header";

    const groupInfo = document.createElement("div");
    groupInfo.className = "group-info";
    groupInfo.innerHTML = `
      <span class="group-id">${group.id || `group_${index}`}</span>
      <span class="group-meta">Weight: ${group.weight ?? 1} | Items: ${group.items?.length ?? 0}</span>
    `;
    cardHeader.appendChild(groupInfo);

    const actions = document.createElement("div");
    actions.className = "group-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      this.openGroupEditor(config, group, index);
    });
    actions.appendChild(editBtn);

    const ungroupBtn = document.createElement("button");
    ungroupBtn.className = "btn-small btn-warning";
    ungroupBtn.textContent = "Ungroup";
    ungroupBtn.title = "Expand group into individual tiles";
    ungroupBtn.addEventListener("click", () => {
      this.ungroupTiles(config, index);
    });
    actions.appendChild(ungroupBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-small btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      this.deleteGroup(config, index);
    });
    actions.appendChild(deleteBtn);

    cardHeader.appendChild(actions);
    card.appendChild(cardHeader);

    // Group face preview
    const facePreview = document.createElement("div");
    facePreview.className = "group-face-preview";
    const faceLabels = ["NW", "NE", "SE", "SW"];
    const faceStr = (group.face || []).map((f, idx) => {
      return f ? `${faceLabels[idx]}: ${f}` : `${faceLabels[idx]}: —`;
    }).join(" | ");
    facePreview.textContent = faceStr;
    card.appendChild(facePreview);

    // Group items summary
    if (group.items && group.items.length > 0) {
      const itemsSummary = document.createElement("div");
      itemsSummary.className = "group-items-summary";
      itemsSummary.textContent = `${group.items.length} item(s) in group`;
      card.appendChild(itemsSummary);
    }

    return card;
  }

  /**
   * Create a new group and add it to the config.
   */
  private createGroup(config: BuildingConfig): void {
    const newGroup: TileGroupConfig = {
      id: `group_${Date.now()}`,
      face: [null, null, null, null],
      weight: 1,
      items: [{ weight: 1 }],
    };

    this.onConfigChange(config, (c) => {
      if (!c.groups) c.groups = [];
      c.groups.push(newGroup);
    });

    // Open the editor for the new group
    const groups = config.groups || [];
    this.openGroupEditor(config, newGroup, groups.length - 1);
  }

  /**
   * Open the group editor modal.
   */
  private openGroupEditor(config: BuildingConfig, group: TileGroupConfig, index: number): void {
    // Collect all face keys from tiles
    const allFaceKeys = new Set<string>();
    for (const tile of config.tiles || []) {
      for (const f of tile.face || []) {
        if (f) allFaceKeys.add(f);
      }
    }
    // Also add face keys from startTiles
    for (const tile of config.startTiles || []) {
      for (const f of tile.face || []) {
        if (f) allFaceKeys.add(f);
      }
    }
    // Also add face keys from existing groups
    for (const g of config.groups || []) {
      for (const f of g.face || []) {
        if (f) allFaceKeys.add(f);
      }
    }

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal group-editor-modal";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.innerHTML = `<h3>Edit Group: ${group.id}</h3>`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close-btn";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
    modalHeader.appendChild(closeBtn);
    modal.appendChild(modalHeader);

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    // Create group editor
    const groupEditor = new GroupEditor(
      modalBody,
      group,
      Array.from(allFaceKeys).sort(),
      (updatedGroup) => {
        this.onConfigChange(config, (c) => {
          if (!c.groups) c.groups = [];
          c.groups[index] = updatedGroup;
        });
      },
      () => {
        // Delete callback
        this.deleteGroup(config, index);
        document.body.removeChild(overlay);
      }
    );
    groupEditor.render();

    modal.appendChild(modalBody);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  /**
   * Delete a group from the config.
   */
  private deleteGroup(config: BuildingConfig, index: number): void {
    if (!confirm("Are you sure you want to delete this group?")) {
      return;
    }

    this.onConfigChange(config, (c) => {
      if (c.groups) {
        c.groups.splice(index, 1);
      }
    });
  }

  /**
   * Ungroup a tile group - expand it into individual tiles.
   * Each item in the group becomes a separate tile with the group's shared face.
   */
  private ungroupTiles(config: BuildingConfig, index: number): void {
    const groups = config.groups || [];
    const group = groups[index];
    
    if (!group) {
      this.stateManager.setError("Group not found.");
      return;
    }

    if (!group.items || group.items.length === 0) {
      this.stateManager.setError("Group has no items to ungroup.");
      return;
    }

    const itemCount = group.items.length;
    if (!confirm(`Ungroup "${group.id || `group_${index}`}" into ${itemCount} individual tile(s)?`)) {
      return;
    }

    // Create individual tiles from group items
    // Each item inherits the group's face
    const newTiles: TileConfig[] = group.items.map((item, itemIndex) => ({
      id: `${group.id || `group_${index}`}_item_${itemIndex}`,
      face: [...(group.face || [null, null, null, null])],
      weight: item.weight ?? 1,
      assets: item.assets ? [...item.assets] : undefined,
      functions: item.functions ? [...item.functions] : undefined,
      empty: item.empty,
      isFrise: item.isFrise,
      allowMove: item.allowMove,
      colorT: item.colorT,
      color: item.color,
      h: item.h,
      lvl: item.lvl,
    }));

    // Add tiles and remove group
    this.onConfigChange(config, (c) => {
      if (!c.tiles) c.tiles = [];
      c.tiles.push(...newTiles);
      
      if (c.groups) {
        c.groups.splice(index, 1);
      }
    });

    this.stateManager.setError(null);
  }

  /**
   * Render preview section.
   */
  private renderPreviewSection(config: BuildingConfig): HTMLElement {
    const section = document.createElement("div");
    section.className = "editor-section";

    const header = document.createElement("h3");
    header.textContent = "Preview";
    section.appendChild(header);

    const controls = document.createElement("div");
    controls.className = "preview-controls";

    const genBtn = document.createElement("button");
    genBtn.textContent = "Run Generation";
    genBtn.className = "btn-small primary";
    genBtn.addEventListener("click", async () => {
      try {
        this.stateManager.setLoading(true);
        this.stateManager.setError(null);
        const result = await this.apiClient.previewGenerate(config as any);
        const statsDiv = this.container?.querySelector("#preview-stats");
        if (statsDiv) {
          const stats = result.stats || {};
          statsDiv.innerHTML = `
            <span>Total Tiles: ${stats.totalTiles || result.tiles?.length || 0}</span>
            <span>Iterations: ${result.iterations ?? "N/A"}</span>
            <span>Configured: ${stats.configuredTiles ?? "N/A"}</span>
            <span>Status: ${result.success ? "Success" : "Failed"}</span>
          `;
        }
        if (!result.success && result.error) {
          this.stateManager.setError(`Preview: ${result.error}`);
        }
      } catch (error: any) {
        this.stateManager.setError(`Preview generation failed: ${error.message}`);
      } finally {
        this.stateManager.setLoading(false);
      }
    });
    controls.appendChild(genBtn);

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.className = "btn-small";
    clearBtn.addEventListener("click", () => {
      const statsDiv = this.container?.querySelector("#preview-stats");
      if (statsDiv) statsDiv.innerHTML = "";
      const canvasDiv = this.container?.querySelector("#preview-canvas");
      if (canvasDiv) canvasDiv.innerHTML = '<div class="empty-state">No preview generated</div>';
    });
    controls.appendChild(clearBtn);

    section.appendChild(controls);

    const statsDiv = document.createElement("div");
    statsDiv.id = "preview-stats";
    statsDiv.className = "preview-stats";
    section.appendChild(statsDiv);

    const canvasContainer = document.createElement("div");
    canvasContainer.id = "preview-canvas";
    canvasContainer.className = "preview-canvas-container";
    canvasContainer.innerHTML = '<div class="empty-state">No preview generated</div>';
    section.appendChild(canvasContainer);

    return section;
  }

  /**
   * Render action bar with Save and Save As buttons.
   */
  private renderActionBar(config: BuildingConfig): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "editor-action-bar";
    bar.style.display = "flex";
    bar.style.gap = "8px";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "💾 Save Config";
    saveBtn.className = "btn-primary";
    saveBtn.addEventListener("click", async () => {
      try {
        this.stateManager.setLoading(true);
        await this.apiClient.saveBuilding(config.id, config as any);
        // Reset dirty state
        const state = this.stateManager.getState();
        if (state.activeConfig.id === config.id) {
          // Preserve current source on save
          const currentSource = state.activeConfig.source || "loaded";
          this.stateManager.setActiveConfig("building", config.id, config, currentSource);
        }
        this.stateManager.setError(null);
      } catch (error: any) {
        this.stateManager.setError(`Save failed: ${error.message}`);
      } finally {
        this.stateManager.setLoading(false);
      }
    });
    bar.appendChild(saveBtn);

    // "Save As..." button
    const saveAsBtn = document.createElement("button");
    saveAsBtn.textContent = "📄 Save As...";
    saveAsBtn.className = "btn-secondary";
    saveAsBtn.addEventListener("click", () => {
      this.showSaveAsModal(config);
    });
    bar.appendChild(saveAsBtn);

    return bar;
  }

  /**
   * Show Save As modal dialog.
   */
  private showSaveAsModal(config: BuildingConfig): void {
    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    // Create modal content
    const modal = document.createElement("div");
    modal.className = "modal-content";
    modal.style.cssText = `
      background: var(--bg-panel, #1e1e2e);
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 16px;">Save Config As...</h3>
      <p style="margin: 0 0 16px 0; color: var(--text-secondary, #888); font-size: 14px;">
        Create a copy of "${config.id}" with a new name.
      </p>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-size: 14px; font-weight: 500;">
          New Config Name:
        </label>
        <input 
          type="text" 
          id="save-as-input" 
          placeholder="Enter new name..."
          style="width: 100%; padding: 8px; border: 1px solid var(--border-color, #444); border-radius: 4px; background: var(--bg-input, #2a2a3a); color: var(--text-primary, #eee); font-size: 14px; box-sizing: border-box;"
          pattern="[a-zA-Z0-9_-]+"
          title="Only alphanumeric characters, hyphens, and underscores are allowed"
          value="${config.id}_copy"
        />
        <p id="save-as-error" style="color: #f44; font-size: 12px; margin: 4px 0 0 0; display: none;"></p>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="save-as-cancel" class="btn-small">Cancel</button>
        <button id="save-as-confirm" class="btn-small primary">Save As</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Focus the input
    const input = modal.querySelector("#save-as-input") as HTMLInputElement;
    input?.focus();
    input?.select();

    // Error display
    const errorEl = modal.querySelector("#save-as-error") as HTMLElement;
    const showError = (msg: string) => {
      errorEl.textContent = msg;
      errorEl.style.display = "block";
    };
    const hideError = () => {
      errorEl.style.display = "none";
    };

    // Confirm handler
    const confirmBtn = modal.querySelector("#save-as-confirm") as HTMLButtonElement;
    const handleSaveAs = async () => {
      const newName = input?.value.trim();
      if (!newName) {
        showError("Please enter a name");
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
        showError("Invalid name format. Only alphanumeric characters, hyphens, and underscores are allowed.");
        return;
      }
      if (newName === config.id) {
        showError("New name must be different from the current config name");
        return;
      }

      hideError();
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Saving...";

      try {
        this.stateManager.setLoading(true);
        const result = await this.apiClient.saveAsBuilding(config.id, newName, config as any);
        
        if (result.success) {
          // Create a new config with the new ID
          const newConfig = JSON.parse(JSON.stringify(config)) as BuildingConfig;
          newConfig.id = newName;
          
          // Add to state and set as active
          this.stateManager.addConfig(newConfig);
          this.stateManager.setActiveConfig("building", newName, newConfig, "loaded");
          
          // Close modal
          overlay.remove();
          
          this.stateManager.setError(null);
        } else if (result.error) {
          showError(result.error);
          confirmBtn.disabled = false;
          confirmBtn.textContent = "Save As";
        }
      } catch (error: any) {
        showError(error.message || "Save As failed");
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Save As";
      } finally {
        this.stateManager.setLoading(false);
      }
    };

    confirmBtn.addEventListener("click", handleSaveAs);
    
    // Handle Enter key
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSaveAs();
      } else if (e.key === "Escape") {
        overlay.remove();
      }
    });

    // Cancel handler
    const cancelBtn = modal.querySelector("#save-as-cancel") as HTMLButtonElement;
    cancelBtn.addEventListener("click", () => {
      overlay.remove();
    });
    
    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Apply change to config and mark as dirty.
   */
  private onConfigChange(
    config: BuildingConfig,
    mutateFn: (c: BuildingConfig) => void
  ): void {
    mutateFn(config);
    this.stateManager.updateConfig("building", config.id, config);
    // Re-render to reflect changes in components
    this.renderContent();
  }

  /**
   * Update the selection count display.
   */
  private updateSelectionCount(): void {
    const countEl = this.container?.querySelector("#selection-count");
    if (countEl) {
      const count = this.selectedTileIndices.size;
      countEl.textContent = `${count} selected`;
    }
  }

  /**
   * Create a new group from selected tiles.
   */
  private createGroupFromSelectedTiles(config: BuildingConfig): void {
    const tiles = config.tiles || [];
    const selectedIndices = Array.from(this.selectedTileIndices).sort((a, b) => a - b);

    if (selectedIndices.length === 0) {
      this.stateManager.setError("No tiles selected. Please select at least one tile to create a group.");
      return;
    }

    // Get the selected tiles
    const selectedTiles = selectedIndices.map(idx => tiles[idx]).filter(Boolean);

    if (selectedTiles.length === 0) {
      this.stateManager.setError("Selected tiles not found.");
      return;
    }

    // Use the face from the first selected tile as the shared face
    const sharedFace = selectedTiles[0].face || [null, null, null, null];

    // Create group items from selected tiles (without face property)
    const items = selectedTiles.map(tile => ({
      weight: tile.weight ?? 1,
      assets: tile.assets ? [...tile.assets] : undefined,
      functions: tile.functions ? [...tile.functions] : undefined,
      empty: tile.empty,
      isFrise: tile.isFrise,
      allowMove: tile.allowMove,
      colorT: tile.colorT,
      color: tile.color,
      h: tile.h,
      lvl: tile.lvl,
    }));

    // Create the new group
    const newGroup: TileGroupConfig = {
      id: `group_${Date.now()}`,
      face: sharedFace,
      weight: 1,
      items: items,
    };

    // Add the group to config
    this.onConfigChange(config, (c) => {
      if (!c.groups) c.groups = [];
      c.groups.push(newGroup);

      // Remove the selected tiles from the tiles array
      // Sort descending to avoid index shifting issues
      const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
      if (!c.tiles) c.tiles = [];
      for (const idx of sortedIndices) {
        c.tiles.splice(idx, 1);
      }
    });

    // Clear selection
    this.selectedTileIndices.clear();
    this.updateSelectionCount();

    // Open the group editor for the new group
    const groups = config.groups || [];
    const newIndex = groups.length - 1;
    this.openGroupEditor(config, newGroup, newIndex);
  }

  /**
   * Cleanup.
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.weightTable) this.weightTable.destroy();
    if (this.faceLinkTable) this.faceLinkTable.destroy();
  }
}

// ============================================================================
// Initialize building editor panel when needed
// ============================================================================

import { stateManager } from "../state.ts";
import { apiClient } from "../api.ts";

export function initBuildingEditorPanel(): void {
  const mainPanel = document.getElementById("main-panel");
  if (mainPanel) {
    const panel = new BuildingEditorPanel(stateManager, apiClient);

    // Subscribe to active config changes
    stateManager.subscribe(() => {
      const state = stateManager.getState();
      if (state.activeConfig?.type === "building") {
        panel.render(mainPanel);
      }
    });
  }
}
