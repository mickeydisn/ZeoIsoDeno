/**
 * API Client — HTTP API Client for Building Config Editor
 *
 * Provides typed methods for all /editor/* endpoints.
 * Centralized error handling with user-friendly messages.
 */

import type { BuildingConfig, AssetCollectionConfig } from "../../types.ts";

// ============================================================================
// Typed Response Interfaces
// ============================================================================

export interface ListClassesResponse {
  buildings: string[];
  assetCollections: string[];
}

export interface ListConfigsResponse {
  tsBuildings: string[];
  tsAssetCollections: string[];
  jsonBuildings: string[];
  jsonAssetCollections: string[];
}

export interface ExtractResponse {
  success?: boolean;
  error?: string;
  // The actual config data is returned directly from the server for extraction endpoints
  // We'll handle the type casting at the call site
  [key: string]: unknown;
}

export interface SaveResponse {
  success: boolean;
  path: string;
  error?: string;
}

export interface PreviewResponse {
  success: boolean;
  tiles: Array<{
    x: number;
    y: number;
    tileType: string;
    face: (string | null)[][];
    isConfigured: boolean;
  }>;
  iterations: number;
  stats: {
    totalTiles: number;
    configuredTiles: number;
  };
  error?: string;
}

export interface AssetPreviewResponse {
  assets: Array<{
    key: string;
    category: string;
    filename: string;
  }>;
  categories: string[];
  total: number;
}

export interface ConfigMetadataResponse {
  success: boolean;
  id: string;
  type: string;
  version: string;
  metadata: {
    classRef: string;
    sourceFile: string;
    registryId?: string;
  };
  tileCount: number;
  assetCollectionCount: number;
  lastModified: string | null;
}

export interface DeleteConfigResponse {
  success: boolean;
  deleted: string;
  error?: string;
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "/editor") {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic request method with JSON handling.
   */
  async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
    } = {}
  ): Promise<T> {
    const { method = "GET", body } = options;
    const url = `${this.baseUrl}${path}`;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw new Error(`API Error: Unknown error occurred`);
    }
  }

  /**
   * GET asset preview URL (not a fetch, just returns the URL string)
   */
  getAssetPreviewUrl(key: string): string {
    return `${this.baseUrl}/asset-preview/${encodeURIComponent(key)}`;
  }

  // ============================================================================
  // Backward Compatibility Methods
  // These are deprecated and will be removed once all panels use service modules
  // ============================================================================

  async listClasses() {
    return this.request("/list/classes");
  }

  async listConfigs() {
    return this.request("/list");
  }

  async listAssets() {
    return this.request("/assets/list");
  }

  async extractBuilding(className: string) {
    return this.request(`/extract/building/${className}`, { method: "POST" });
  }

  async extractAssetCollection(className: string) {
    return this.request(`/extract/asset-collection/${className}`, { method: "POST" });
  }

  async loadBuilding(name: string) {
    return this.request(`/load/building/${name}`);
  }

  async loadAssetCollection(name: string) {
    return this.request(`/load/asset-collection/${name}`);
  }

  async saveBuilding(name: string, config: unknown) {
    return this.request(`/save/building/${name}`, { method: "POST", body: config });
  }

  async saveAssetCollection(name: string, config: unknown) {
    return this.request(`/save/asset-collection/${name}`, { method: "POST", body: config });
  }

  async saveAsBuilding(originalName: string, newName: string, config: unknown) {
    return this.request(`/save-as/building/${originalName}/${newName}`, { method: "POST", body: config });
  }

  async saveAsAssetCollection(originalName: string, newName: string, config: unknown) {
    return this.request(`/save-as/asset-collection/${originalName}/${newName}`, { method: "POST", body: config });
  }

  async duplicateBuilding(name: string, newName: string) {
    return this.request(`/duplicate/building/${name}/${newName}`, { method: "POST" });
  }

  async duplicateAssetCollection(name: string, newName: string) {
    return this.request(`/duplicate/asset-collection/${name}/${newName}`, { method: "POST" });
  }

  async deleteBuilding(name: string) {
    return this.request(`/config/building/${name}`, { method: "DELETE" });
  }

  async deleteAssetCollection(name: string) {
    return this.request(`/config/asset-collection/${name}`, { method: "DELETE" });
  }

  async previewGenerate(config: unknown) {
    return this.request("/preview/generate", { method: "POST", body: config });
  }

  async validateBuilding(config: unknown) {
    return this.request("/validate/building", { method: "POST", body: config });
  }

  async validateTileRefs(config: unknown) {
    return this.request("/validate-tile-refs/building", { method: "POST", body: config });
  }

  async migrateBuilding(config: unknown) {
    return this.request("/migrate/building", { method: "POST", body: config });
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient();

// Make available globally for script modules
(window as any).__apiClient = apiClient;