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
} from "../../../types.ts";
import { WeightTable } from "../components/weightTable.ts";
import { FaceLinkTable } from "../components/faceLinkTable.ts";

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

    // Section 7: Preview
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

    const header = document.createElement("h3");
    const tiles = config.tiles || [];
    header.textContent = `Tiles (${tiles.length})`;
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

    const table = document.createElement("table");
    table.className = "tile-list-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th class="sortable" data-sort="id">ID <span class="sort-indicator"></span></th>
          <th class="sortable" data-sort="face">Face Preview <span class="sort-indicator"></span></th>
          <th class="sortable" data-sort="weight">Weight <span class="sort-indicator"></span></th>
          <th class="sortable" data-sort="source">Source Info <span class="sort-indicator"></span></th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="tile-list-tbody"></tbody>
    `;

    // Bind sort on header click
    const thead = table.querySelector("thead");
    thead?.addEventListener("click", (e) => {
      const th = (e.target as HTMLElement).closest("th") as HTMLElement;
      if (!th || !th.classList.contains("sortable")) return;
      const field = th.dataset.sort as "id" | "face" | "weight" | "source";
      this.toggleSort(field, config);
    });

    const tbody = table.querySelector("#tile-list-tbody");
    const sortedTiles = this.sortTiles(config.tiles || []);
    sortedTiles.forEach((tile: TileConfig, i: number) => {
      const tr = document.createElement("tr");
      // Find original index for actions
      const originalIndex = config.tiles!.indexOf(tile);
      tr.dataset.tileIndex = String(originalIndex);
      tr.dataset.tileFace = (tile.face || []).filter((f) => f).join(",").toLowerCase();
      tr.dataset.tileSource = `${tile.sourceGetter || ""} ${tile.sourceCollection || ""}`.toLowerCase();

      tr.innerHTML = `
        <td>${tile.id || `tile_${originalIndex}`}</td>
        <td>[${(tile.face || []).join(", ")}]</td>
        <td>${tile.weight ?? 0}</td>
        <td>${tile.sourceGetter ? `from ${tile.sourceGetter}` : tile.sourceCollection ? `from ${tile.sourceCollection}` : "—"}</td>
        <td>
          <button class="btn-small" data-action="duplicate-tile" data-index="${originalIndex}">Duplicate</button>
          <button class="btn-small btn-danger" data-action="delete-tile" data-index="${originalIndex}">Delete</button>
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
   * Sort tiles according to current sort field and direction.
   */
  private sortTiles(tiles: TileConfig[]): TileConfig[] {
    const sorted = [...tiles];
    const direction = this.tileSort.direction === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      switch (this.tileSort.field) {
        case "id": {
          const aId = a.id || "";
          const bId = b.id || "";
          return direction * aId.localeCompare(bId);
        }
        case "face": {
          const aFace = (a.face || []).filter((f) => f).join(",");
          const bFace = (b.face || []).filter((f) => f).join(",");
          return direction * aFace.localeCompare(bFace);
        }
        case "weight": {
          return direction * ((a.weight ?? 0) - (b.weight ?? 0));
        }
        case "source": {
          const aSrc = `${a.sourceGetter || ""} ${a.sourceCollection || ""}`;
          const bSrc = `${b.sourceGetter || ""} ${b.sourceCollection || ""}`;
          return direction * aSrc.localeCompare(bSrc);
        }
        default:
          return 0;
      }
    });

    return sorted;
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
   * Render action bar with Save button.
   */
  private renderActionBar(config: BuildingConfig): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "editor-action-bar";

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

    return bar;
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
