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
   * Render a single library item.
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

    // Click handler
    el.addEventListener("click", () => this.handleItemClick(item));

    return el;
  }

  /**
   * Handle item click — load config into active state.
   */
  private async handleItemClick(item: {
    id: string;
    type: "building" | "assetCollection";
    source: "ts" | "json";
  }): Promise<void> {
    console.log('[LibraryPanel] Item clicked:', item);
    try {
      this.stateManager.setLoading(true);

      // Check if config is already in state
      const existing = this.stateManager.getConfig(item.type, item.id);
      console.log('[LibraryPanel] Existing config:', existing);
      if (existing) {
        console.log('[LibraryPanel] Setting active config:', item.type, item.id);
        this.stateManager.setActiveConfig(item.type, item.id, existing);
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
        this.stateManager.setActiveConfig(item.type, item.id, config);
      } else {
        // Load JSON config from disk via API
        console.log('[LibraryPanel] Loading JSON config:', item.id, item.type);
        let config: BuildingConfig | AssetCollectionConfig;
        if (item.type === "building") {
          config = await this.apiClient.loadBuilding(item.id);
          (config as BuildingConfig).type = "building";
          (config as BuildingConfig).id = item.id;
        } else {
          config = await this.apiClient.loadAssetCollection(item.id);
          (config as AssetCollectionConfig).type = "assetCollection";
          (config as AssetCollectionConfig).id = item.id;
        }
        console.log('[LibraryPanel] Loaded JSON config:', config);
        this.stateManager.addConfig(config);
        console.log('[LibraryPanel] Setting active config after JSON load:', item.type, item.id);
        this.stateManager.setActiveConfig(item.type, item.id, config);
      }
    } catch (error) {
      console.error('[LibraryPanel] Item click error:', error);
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

