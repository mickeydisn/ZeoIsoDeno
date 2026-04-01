/**
 * Library Panel — Searchable Config Library Sidebar
 *
 * Renders the left sidebar with sections for:
 * - Buildings (TS): Extractable TypeScript classes
 * - Buildings (JSON): Saved JSON configs
 * - Asset Collections (TS): Extractable TS asset classes
 * - Asset Collections (JSON): Saved JSON asset collections
 *
 * Supports filtering, extraction, and saving operations.
 */

import type { StateManager } from "../state.ts";
import type { ApiClient } from "../api.ts";
import type { BuildingConfig, AssetCollectionConfig } from "../../../types.ts";

// ============================================================================
// Library Panel Class
// ============================================================================

export class LibraryPanel {
  private stateManager: StateManager;
  private apiClient: ApiClient;
  private container: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(stateManager: StateManager, apiClient: ApiClient) {
    this.stateManager = stateManager;
    this.apiClient = apiClient;
  }

  /**
   * Render the library panel into the given container.
   */
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = "";

    const panel = document.createElement("div");
    panel.className = "library-panel";

    // Search input
    const searchDiv = document.createElement("div");
    searchDiv.className = "library-search";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "library-filter";
    searchInput.placeholder = "🔍 Filter...";
    searchInput.addEventListener("input", (e) => this.handleFilterChange(e));
    searchDiv.appendChild(searchInput);
    panel.appendChild(searchDiv);

    // Sections container
    const sectionsDiv = document.createElement("div");
    sectionsDiv.className = "library-sections";
    sectionsDiv.id = "library-sections";
    panel.appendChild(sectionsDiv);

    // Action buttons
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "library-actions";
    actionsDiv.innerHTML = `
      <button class="action-btn primary" id="btn-extract-all">Extract All</button>
      <button class="action-btn secondary" id="btn-save-all">Save All</button>
    `;
    panel.appendChild(actionsDiv);

    // Bind action handlers
    const extractBtn = actionsDiv.querySelector("#btn-extract-all");
    const saveBtn = actionsDiv.querySelector("#btn-save-all");
    extractBtn?.addEventListener("click", () => this.handleExtractAll());
    saveBtn?.addEventListener("click", () => this.handleSaveAll());

    container.appendChild(panel);

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe(() => this.renderSections());

    // Initial data fetch
    this.loadData();
  }

  /**
   * Load initial data from the API.
   */
  private async loadData(): Promise<void> {
    try {
      console.log('[LibraryPanel] Loading data...');
      this.stateManager.setLoading(true);

      // Fetch extractable TS classes
      const classesData = await this.apiClient.listClasses();
      console.log('[LibraryPanel] TS classes loaded:', classesData);
      this.stateManager.setTSClasses(classesData);

      // Fetch existing JSON configs
      const configsData = await this.apiClient.listConfigs();
      console.log('[LibraryPanel] Configs loaded:', configsData);
      this.stateManager.setJsonConfigs({
        jsonBuildings: configsData.jsonBuildings,
        jsonAssetCollections: configsData.jsonAssetCollections,
      });
      console.log('[LibraryPanel] Data loading complete');
    } catch (error) {
      console.error('[LibraryPanel] Load data error:', error);
      this.stateManager.setError(`Failed to load library: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Handle filter input changes.
   */
  private handleFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.stateManager.setFilter(input.value.toLowerCase());
  }

  /**
   * Render all library sections based on current state.
   */
  private renderSections(): void {
    if (!this.container) return;

    const state = this.stateManager.getState();
    const sectionsDiv = this.container.querySelector("#library-sections");
    if (!sectionsDiv) return;

    const filter = state.ui.libraryFilter;
    const tsClasses = state.ui.tsClasses;
    const jsonBuildings = state.ui.jsonBuildings;
    const jsonAssetCollections = state.ui.jsonAssetCollections;
    const activeId = state.activeConfig.id;

    // Get building configs to check for dirty state
    const buildingConfigs = this.stateManager.getConfigs("building");

    sectionsDiv.innerHTML = "";

    // Section 1: Buildings (TS)
    if (tsClasses?.buildings?.length) {
      sectionsDiv.appendChild(
        this.renderSection(
          "Buildings (TS)",
          "🏗️",
          tsClasses.buildings
            .filter((name) => !filter || name.toLowerCase().includes(filter))
            .map((name) => ({
              id: name,
              type: "building" as const,
              source: "ts" as const,
              isActive: activeId === name,
              isDirty: false,
            }))
        )
      );
    }

    // Section 2: Buildings (JSON)
    if (jsonBuildings.length) {
      sectionsDiv.appendChild(
        this.renderSection(
          "Buildings (JSON)",
          "🏗️",
          jsonBuildings
            .filter((name) => !filter || name.toLowerCase().includes(filter))
            .map((name) => {
              const config = buildingConfigs.find((c) => c.id === name);
              return {
                id: name,
                type: "building" as const,
                source: "json" as const,
                isActive: activeId === name,
                isDirty: config ? false : false, // JSON items not yet loaded aren't dirty
              };
            })
        )
      );
    }

    // Section 3: Asset Collections (TS)
    if (tsClasses?.assetCollections?.length) {
      sectionsDiv.appendChild(
        this.renderSection(
          "Asset Collections (TS)",
          "📦",
          tsClasses.assetCollections
            .filter((name) => !filter || name.toLowerCase().includes(filter))
            .map((name) => ({
              id: name,
              type: "assetCollection" as const,
              source: "ts" as const,
              isActive: activeId === name,
              isDirty: false,
            }))
        )
      );
    }

    // Section 4: Asset Collections (JSON)
    if (jsonAssetCollections.length) {
      sectionsDiv.appendChild(
        this.renderSection(
          "Asset Collections (JSON)",
          "📦",
          jsonAssetCollections
            .filter((name) => !filter || name.toLowerCase().includes(filter))
            .map((name) => ({
              id: name,
              type: "assetCollection" as const,
              source: "json" as const,
              isActive: activeId === name,
              isDirty: false,
            }))
        )
      );
    }
  }

  /**
   * Render a single section with header and items.
   */
  private renderSection(
    title: string,
    icon: string,
    items: Array<{
      id: string;
      type: "building" | "assetCollection";
      source: "ts" | "json";
      isActive: boolean;
      isDirty: boolean;
    }>
  ): HTMLElement {
    const section = document.createElement("div");
    section.className = "library-section";

    // Header
    const header = document.createElement("div");
    header.className = "library-section-header";
    header.innerHTML = `<span>${icon} ${title}</span>`;
    section.appendChild(header);

    // Items
    if (items.length) {
      const itemsDiv = document.createElement("div");
      itemsDiv.className = "library-items";

      for (const item of items) {
        const itemEl = this.renderItem(item);
        itemsDiv.appendChild(itemEl);
      }

      section.appendChild(itemsDiv);
    } else {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "library-items";
      emptyDiv.style.padding = "8px 12px";
      emptyDiv.style.fontSize = "12px";
      emptyDiv.style.color = "var(--text-secondary)";
      emptyDiv.textContent = "None available";
      section.appendChild(emptyDiv);
    }

    return section;
  }

  /**
   * Render a single library item with context actions.
   */
  private renderItem(item: {
    id: string;
    type: "building" | "assetCollection";
    source: "ts" | "json";
    isActive: boolean;
    isDirty: boolean;
  }): HTMLElement {
    const el = document.createElement("div");
    el.className = `library-item${item.isActive ? " active" : ""}`;
    el.dataset.id = item.id;
    el.dataset.type = item.type;

    // Icon
    const iconSpan = document.createElement("span");
    iconSpan.className = "library-item-icon";
    iconSpan.textContent = item.type === "building" ? "🏗️" : "📦";

    // Name
    const nameSpan = document.createElement("span");
    nameSpan.className = "library-item-name";
    nameSpan.textContent = item.id;

    // Badge
    const badge = document.createElement("span");
    badge.className = `library-item-badge ${item.source}`;
    badge.textContent = item.source.toUpperCase();

    el.appendChild(iconSpan);
    el.appendChild(nameSpan);
    el.appendChild(badge);

    // Context menu button (only for JSON items)
    if (item.source === "json") {
      const menuBtn = document.createElement("button");
      menuBtn.className = "library-item-action";
      menuBtn.textContent = "⋮";
      menuBtn.title = "More actions";
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showItemContextMenu(e, item);
      });
      el.appendChild(menuBtn);
    }

    // Click handler
    el.addEventListener("click", () => this.handleItemClick(item));

    // Right-click context menu
    el.addEventListener("contextmenu", (e) => {
      if (item.source === "json") {
        e.preventDefault();
        this.showItemContextMenu(e, item);
      }
    });

    return el;
  }

  /**
   * Show context menu with delete/duplicate actions.
   */
  private showItemContextMenu(
    event: MouseEvent | KeyboardEvent,
    item: {
      id: string;
      type: "building" | "assetCollection";
      source: "ts" | "json";
    }
  ): void {
    // Remove any existing context menu
    const existingMenu = document.querySelector(".library-context-menu");
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement("div");
    menu.className = "library-context-menu";
    menu.style.position = "fixed";
    menu.style.zIndex = "10000";
    menu.style.background = "var(--bg-secondary, #1e1e2e)";
    menu.style.border = "1px solid var(--border-color, #444)";
    menu.style.borderRadius = "4px";
    menu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    menu.style.padding = "4px 0";
    menu.style.minWidth = "150px";

    // Position menu
    let x = "clientX" in event ? event.clientX : 0;
    let y = "clientY" in event ? event.clientY : 0;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // Duplicate action
    const dupItem = document.createElement("div");
    dupItem.className = "context-menu-item";
    dupItem.textContent = "📋 Duplicate";
    dupItem.style.padding = "8px 12px";
    dupItem.style.cursor = "pointer";
    dupItem.addEventListener("click", () => {
      menu.remove();
      this.handleDuplicate(item);
    });
    dupItem.addEventListener("mouseenter", () => {
      dupItem.style.background = "var(--accent-color, #4a9eff)";
    });
    dupItem.addEventListener("mouseleave", () => {
      dupItem.style.background = "transparent";
    });

    // Delete action
    const delItem = document.createElement("div");
    delItem.className = "context-menu-item";
    delItem.textContent = "🗑️ Delete";
    delItem.style.padding = "8px 12px";
    delItem.style.cursor = "pointer";
    delItem.style.color = "#ff4444";
    delItem.addEventListener("click", () => {
      menu.remove();
      this.handleDelete(item);
    });
    delItem.addEventListener("mouseenter", () => {
      delItem.style.background = "rgba(255, 68, 68, 0.1)";
    });
    delItem.addEventListener("mouseleave", () => {
      delItem.style.background = "transparent";
    });

    menu.appendChild(dupItem);
    menu.appendChild(delItem);
    document.body.appendChild(menu);

    // Close menu on click outside
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);

    // Close on Escape
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        menu.remove();
        document.removeEventListener("keydown", closeOnEscape);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
  }

  /**
   * Handle duplicate config.
   */
  private async handleDuplicate(item: {
    id: string;
    type: "building" | "assetCollection";
    source: "ts" | "json";
  }): Promise<void> {
    const newName = prompt(`Enter name for duplicate of "${item.id}":`, `${item.id}_copy`);
    if (!newName) return;

    if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
      this.stateManager.setError("Invalid name format. Only alphanumeric characters, hyphens, and underscores are allowed.");
      return;
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);

      if (item.type === "building") {
        // First load the original config
        const config = await this.apiClient.loadBuilding(item.id);
        // Then create a new one with the new name
        config.id = newName;
        await this.apiClient.saveBuilding(newName, config as BuildingConfig);
      } else {
        const config = await this.apiClient.loadAssetCollection(item.id);
        config.id = newName;
        await this.apiClient.saveAssetCollection(newName, config as AssetCollectionConfig);
      }

      // Refresh library
      await this.loadData();
    } catch (error) {
      console.error('[LibraryPanel] Duplicate error:', error);
      this.stateManager.setError(`Failed to duplicate: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Handle delete config.
   */
  private async handleDelete(item: {
    id: string;
    type: "building" | "assetCollection";
    source: "ts" | "json";
  }): Promise<void> {
    if (!confirm(`Delete "${item.id}"? This action cannot be undone.`)) {
      return;
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);

      if (item.type === "building") {
        await this.apiClient.deleteBuilding(item.id);
      } else {
        await this.apiClient.deleteAssetCollection(item.id);
      }

      // Remove from state if it's the active config
      const state = this.stateManager.getState();
      if (state.activeConfig.id === item.id) {
        this.stateManager.setState({
          activeConfig: {
            type: null,
            id: null,
            data: null,
            isDirty: false,
            source: null,
          },
        });
      }

      // Remove from configs
      if (item.type === "building") {
        const buildings = this.stateManager.getConfigs("building").filter((c) => c.id !== item.id);
        this.stateManager.setState({
          configs: { buildings, assetCollections: this.stateManager.getConfigs("assetCollection") },
        });
      } else {
        const collections = this.stateManager.getConfigs("assetCollection").filter((c) => c.id !== item.id);
        this.stateManager.setState({
          configs: { buildings: this.stateManager.getConfigs("building"), assetCollections: collections },
        });
      }

      // Refresh library
      await this.loadData();
    } catch (error) {
      console.error('[LibraryPanel] Delete error:', error);
      this.stateManager.setError(`Failed to delete: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Handle item click — load config into active state.
   * Supports retry logic for failed loads.
   */
  private async handleItemClick(
    item: {
      id: string;
      type: "building" | "assetCollection";
      source: "ts" | "json";
    },
    retryCount = 0
  ): Promise<void> {
    const MAX_RETRIES = 2;
    
    console.log('[LibraryPanel] Item clicked:', item);
    try {
      this.stateManager.setLoading(true);

      // Check if config is already in state
      const existing = this.stateManager.getConfig(item.type, item.id);
      console.log('[LibraryPanel] Existing config:', existing);
      if (existing) {
        // Determine source type: if it came from JSON loading it has metadata.sourceFile
        const source = item.source === "json" ? "loaded" as const : "extracted" as const;
        console.log('[LibraryPanel] Setting active config:', item.type, item.id, 'source:', source);
        this.stateManager.setActiveConfig(item.type, item.id, existing, source);
        this.stateManager.setLoading(false);
        return;
      }

      // Extract from TS if not available
      if (item.source === "ts") {
        console.log('[LibraryPanel] Extracting from TS:', item.id);
        let config: BuildingConfig | AssetCollectionConfig;
        if (item.type === "building") {
          config = await this.apiClient.extractBuilding(item.id);
          (config as BuildingConfig).type = "building";
          (config as BuildingConfig).id = item.id;
        } else {
          config = await this.apiClient.extractAssetCollection(item.id);
          (config as AssetCollectionConfig).type = "assetCollection";
          (config as AssetCollectionConfig).id = item.id;
        }
        console.log('[LibraryPanel] Extracted config:', config);
        this.stateManager.addConfig(config);
        console.log('[LibraryPanel] Setting active config after extract:', item.type, item.id);
        this.stateManager.setActiveConfig(item.type, item.id, config, "extracted");
      } else {
        // Load JSON config from disk via API
        console.log('[LibraryPanel] Loading JSON config:', item.id, item.type);
        let config: BuildingConfig | AssetCollectionConfig;
        if (item.type === "building") {
          config = await this.apiClient.loadBuilding(item.id);
          (config as BuildingConfig).type = "building";
          (config as BuildingConfig).id = item.id;
          
          // Validate loaded building config for face key consistency
          const validationResult = await this.apiClient.validateBuilding(config as BuildingConfig);
          console.log('[LibraryPanel] Validation result:', validationResult);
          
          // Show warnings for validation issues
          if (!validationResult.valid) {
            const errors = validationResult.issues.filter(i => i.severity === 'error');
            const warnings = validationResult.issues.filter(i => i.severity === 'warning');
            const infos = validationResult.issues.filter(i => i.severity === 'info');
            
            if (errors.length > 0) {
              this.stateManager.setError(`Config has ${errors.length} error(s): ${errors.map(e => e.message).join('; ')}`);
            }
            
            if (warnings.length > 0) {
              console.warn('[LibraryPanel] Config warnings:', warnings);
              // Still allow loading but show warnings
              const warningMsg = `⚠️ ${warnings.length} warning(s) in config: ${warnings.map(w => w.message).join('; ')}`;
              if (errors.length === 0) {
                // Only set warning as error if there are no actual errors
                this.stateManager.setError(warningMsg);
              }
            }
            
            if (infos.length > 0) {
              console.info('[LibraryPanel] Config info:', infos);
            }
          }
        } else {
          config = await this.apiClient.loadAssetCollection(item.id);
          (config as AssetCollectionConfig).type = "assetCollection";
          (config as AssetCollectionConfig).id = item.id;
        }
        
        // Validate loaded config - handle corrupted JSON gracefully
        if (!config || (!config.tiles && item.type === "building")) {
          throw new Error("Loaded config appears to be corrupted");
        }
        
        console.log('[LibraryPanel] Loaded JSON config:', config);
        this.stateManager.addConfig(config);
        console.log('[LibraryPanel] Setting active config after JSON load:', item.type, item.id);
        this.stateManager.setActiveConfig(item.type, item.id, config, "loaded");
      }
    } catch (error) {
      console.error('[LibraryPanel] Item click error:', error);
      // Retry logic for failed loads
      if (retryCount < MAX_RETRIES && error.message.includes("Failed to load")) {
        console.log(`[LibraryPanel] Retrying load (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return this.handleItemClick(item, retryCount + 1);
      }
      this.stateManager.setError(`Failed to load config: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Handle Extract All — extract all TS building classes.
   */
  private async handleExtractAll(): Promise<void> {
    const state = this.stateManager.getState();
    const tsBuildings = state.ui.tsClasses?.buildings || [];
    const tsAssetCollections = state.ui.tsClasses?.assetCollections || [];

    if (!tsBuildings.length && !tsAssetCollections.length) {
      this.stateManager.setError("No TypeScript classes available to extract");
      return;
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);

      let extractedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Extract buildings
      for (const className of tsBuildings) {
        try {
          const config = await this.apiClient.extractBuilding(className);
          config.type = "building";
          config.id = config.id || className;
          this.stateManager.addConfig(config as BuildingConfig);
          extractedCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${className}: ${error.message}`);
        }
      }

      // Extract asset collections
      for (const className of tsAssetCollections) {
        try {
          const config = await this.apiClient.extractAssetCollection(className);
          config.type = "assetCollection";
          config.id = config.id || className;
          this.stateManager.addConfig(config as AssetCollectionConfig);
          extractedCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${className}: ${error.message}`);
        }
      }

      if (errorCount > 0) {
        this.stateManager.setError(
          `Extracted ${extractedCount} configs, ${errorCount} failed: ${errors.slice(0, 3).join("; ")}`
        );
      }
    } catch (error) {
      this.stateManager.setError(`Extract All failed: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Handle Save All — save all dirty configs.
   */
  private async handleSaveAll(): Promise<void> {
    const configs = [
      ...this.stateManager.getConfigs("building"),
      ...this.stateManager.getConfigs("assetCollection"),
    ];

    const dirtyConfigs = configs; // In a real implementation, filter by isDirty
    if (!dirtyConfigs.length) {
      this.stateManager.setError("No configs to save");
      return;
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);

      let savedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const config of dirtyConfigs) {
        try {
          if (config.type === "building") {
            await this.apiClient.saveBuilding(config.id, config as BuildingConfig);
            savedCount++;
          } else {
            await this.apiClient.saveAssetCollection(
              config.id,
              config as AssetCollectionConfig
            );
            savedCount++;
          }
        } catch (error) {
          errorCount++;
          errors.push(`${config.id}: ${error.message}`);
        }
      }

      if (errorCount > 0) {
        this.stateManager.setError(
          `Saved ${savedCount} configs, ${errorCount} failed: ${errors.slice(0, 3).join("; ")}`
        );
      }
    } catch (error) {
      this.stateManager.setError(`Save All failed: ${error.message}`);
    } finally {
      this.stateManager.setLoading(false);
    }
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

