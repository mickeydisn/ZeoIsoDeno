/**
 * State Management — Centralized State for Building Config Editor
 *
 * Implements a pub/sub pattern for state updates sufficient for the application's needs.
 * State is kept immutable; updates return new copies to prevent accidental mutation.
 */

import type { BuildingConfig, AssetCollectionConfig, TileConfig } from "../../types.ts";

// ============================================================================
// State Interface
// ============================================================================

export interface EditorState {
  configs: {
    buildings: BuildingConfig[];
    assetCollections: AssetCollectionConfig[];
  };
  activeConfig: {
    type: "building" | "assetCollection" | null;
    id: string | null;
    data: BuildingConfig | AssetCollectionConfig | null;
    isDirty: boolean;
  };
  ui: {
    editingTile: TileConfig | null;
    showTileEditor: boolean;
    showAssetCollectionEditor: boolean;
    libraryFilter: string;
    tsClasses: { buildings: string[]; assetCollections: string[] } | null;
    jsonBuildings: string[];
    jsonAssetCollections: string[];
  };
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: EditorState = {
  configs: {
    buildings: [],
    assetCollections: [],
  },
  activeConfig: {
    type: null,
    id: null,
    data: null,
    isDirty: false,
  },
  ui: {
    editingTile: null,
    showTileEditor: false,
    showAssetCollectionEditor: false,
    libraryFilter: "",
    tsClasses: null,
    jsonBuildings: [],
    jsonAssetCollections: [],
  },
  loading: false,
  error: null,
};

// ============================================================================
// StateManager Class
// ============================================================================

type Listener = () => void;

export class StateManager {
  private state: EditorState = { ...initialState };
  private listeners: Set<Listener> = new Set();

  constructor() {
    // Use deep copy of initial state to avoid mutation issues
    this.state = JSON.parse(JSON.stringify(initialState));
  }

  /**
   * Subscribe to state changes. Returns an unsubscribe function.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes.
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Get a copy of the current state (prevents external mutation).
   */
  getState(): EditorState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Update state with partial values and notify listeners.
   */
  setState(partial: Partial<EditorState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Set the currently active configuration.
   */
  setActiveConfig(
    type: "building" | "assetCollection",
    id: string,
    data: BuildingConfig | AssetCollectionConfig
  ): void {
    this.state = {
      ...this.state,
      activeConfig: {
        type,
        id,
        data,
        isDirty: false,
      },
    };
    this.notify();
  }

  /**
   * Mark the active configuration as dirty (has unsaved edits).
   */
  markDirty(): void {
    if (this.state.activeConfig.id) {
      this.state = {
        ...this.state,
        activeConfig: {
          ...this.state.activeConfig,
          isDirty: true,
        },
      };
      this.notify();
    }
  }

  /**
   * Set loading state.
   */
  setLoading(loading: boolean): void {
    this.state = { ...this.state, loading };
    this.notify();
  }

  /**
   * Set error message (null to clear).
   */
  setError(error: string | null): void {
    this.state = { ...this.state, error };
    this.notify();
  }

  /**
   * Store available TypeScript classes from the server.
   */
  setTSClasses(data: { buildings: string[]; assetCollections: string[] }): void {
    this.state = {
      ...this.state,
      ui: {
        ...this.state.ui,
        tsClasses: data,
      },
    };
    this.notify();
  }

  /**
   * Store available JSON configs from the server.
   */
  setJsonConfigs(data: { jsonBuildings: string[]; jsonAssetCollections: string[] }): void {
    this.state = {
      ...this.state,
      ui: {
        ...this.state.ui,
        jsonBuildings: data.jsonBuildings,
        jsonAssetCollections: data.jsonAssetCollections,
      },
    };
    this.notify();
  }

  /**
   * Update library filter string.
   */
  setFilter(filter: string): void {
    this.state = {
      ...this.state,
      ui: {
        ...this.state.ui,
        libraryFilter: filter,
      },
    };
    this.notify();
  }

  /**
   * Get a config by type and id from the configs collection.
   */
  getConfig(
    type: "building" | "assetCollection",
    id: string
  ): BuildingConfig | AssetCollectionConfig | null {
    const collection =
      type === "building"
        ? this.state.configs.buildings
        : this.state.configs.assetCollections;
    return collection.find((c) => c.id === id) ?? null;
  }

  /**
   * Add a config to the appropriate collection.
   */
  addConfig(config: BuildingConfig | AssetCollectionConfig): void {
    if (config.type === "building") {
      const existing = this.state.configs.buildings.findIndex(
        (c) => c.id === config.id
      );
      let newBuildings: BuildingConfig[];
      if (existing >= 0) {
        newBuildings = [...this.state.configs.buildings];
        newBuildings[existing] = config as BuildingConfig;
      } else {
        newBuildings = [...this.state.configs.buildings, config as BuildingConfig];
      }
      this.state = {
        ...this.state,
        configs: {
          ...this.state.configs,
          buildings: newBuildings,
        },
      };
    } else {
      const existing = this.state.configs.assetCollections.findIndex(
        (c) => c.id === config.id
      );
      let newCollections: AssetCollectionConfig[];
      if (existing >= 0) {
        newCollections = [...this.state.configs.assetCollections];
        newCollections[existing] = config as AssetCollectionConfig;
      } else {
        newCollections = [...this.state.configs.assetCollections, config as AssetCollectionConfig];
      }
      this.state = {
        ...this.state,
        configs: {
          ...this.state.configs,
          assetCollections: newCollections,
        },
      };
    }
    this.notify();
  }

  /**
   * Update a config and mark as dirty.
   */
  updateConfig(
    type: "building" | "assetCollection",
    id: string,
    data: BuildingConfig | AssetCollectionConfig
  ): void {
    this.addConfig(data);
    // Also mark as dirty if it's the active config
    if (this.state.activeConfig.id === id) {
      this.state = {
        ...this.state,
        activeConfig: {
          ...this.state.activeConfig,
          data,
          isDirty: true,
        },
      };
      this.notify();
    }
  }

  /**
   * Get all configs of a given type.
   */
  getConfigs(
    type: "building" | "assetCollection"
  ): (BuildingConfig | AssetCollectionConfig)[] {
    return type === "building"
      ? [...this.state.configs.buildings]
      : [...this.state.configs.assetCollections];
  }

  /**
   * Get UI state including TS classes.
   */
  getTSClasses(): { buildings: string[]; assetCollections: string[] } | null {
    return this.state.ui.tsClasses;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const stateManager = new StateManager();

// Make available globally for script modules
(window as any).__stateManager = stateManager;