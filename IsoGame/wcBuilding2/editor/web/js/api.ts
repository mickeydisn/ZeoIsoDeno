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
  private async request<T>(
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
   * GET /editor/list/classes — List extractable TS classes
   */
  async listClasses(): Promise<ListClassesResponse> {
    return this.request<ListClassesResponse>("/list/classes");
  }

  /**
   * GET /editor/list — List all configs (TS + JSON)
   */
  async listConfigs(): Promise<ListConfigsResponse> {
    return this.request<ListConfigsResponse>("/list");
  }

  /**
   * POST /editor/extract/building/:className — Extract building config
   */
  async extractBuilding(className: string): Promise<BuildingConfig> {
    return this.request<BuildingConfig>(`/extract/building/${encodeURIComponent(className)}`, {
      method: "POST",
    });
  }

  /**
   * POST /editor/extract/asset-collection/:className — Extract asset collection
   */
  async extractAssetCollection(className: string): Promise<AssetCollectionConfig> {
    return this.request<AssetCollectionConfig>(
      `/extract/asset-collection/${encodeURIComponent(className)}`,
      {
        method: "POST",
      }
    );
  }

  /**
   * POST /editor/save/building/:name — Save building JSON
   */
  async saveBuilding(name: string, config: BuildingConfig): Promise<SaveResponse> {
    return this.request<SaveResponse>(`/save/building/${encodeURIComponent(name)}`, {
      method: "POST",
      body: config,
    });
  }

  /**
   * POST /editor/save/asset-collection/:name — Save asset collection JSON
   */
  async saveAssetCollection(
    name: string,
    config: AssetCollectionConfig
  ): Promise<SaveResponse> {
    return this.request<SaveResponse>(
      `/save/asset-collection/${encodeURIComponent(name)}`,
      {
        method: "POST",
        body: config,
      }
    );
  }

  /**
   * POST /editor/preview/generate — Run building generation preview
   */
  async previewGenerate(config: BuildingConfig): Promise<PreviewResponse> {
    return this.request<PreviewResponse>("/preview/generate", {
      method: "POST",
      body: config,
    });
  }

  /**
   * GET /editor/load/building/:name — Load existing JSON building config
   */
  async loadBuilding(name: string): Promise<BuildingConfig> {
    return this.request<BuildingConfig>(`/load/building/${encodeURIComponent(name)}`);
  }

  /**
   * GET /editor/load/asset-collection/:name — Load existing JSON asset collection config
   */
  async loadAssetCollection(name: string): Promise<AssetCollectionConfig> {
    return this.request<AssetCollectionConfig>(
      `/load/asset-collection/${encodeURIComponent(name)}`
    );
  }

  /**
   * GET /editor/assets/list — List available game assets
   */
  async listAssets(): Promise<AssetPreviewResponse> {
    return this.request<AssetPreviewResponse>("/assets/list");
  }

  /**
   * POST /editor/save-as/building/:originalName/:newName — Save building as new JSON file
   */
  async saveAsBuilding(
    originalName: string,
    newName: string,
    config: BuildingConfig
  ): Promise<SaveResponse> {
    return this.request<SaveResponse>(
      `/save-as/building/${encodeURIComponent(originalName)}/${encodeURIComponent(newName)}`,
      {
        method: "POST",
        body: config,
      }
    );
  }

  /**
   * POST /editor/save-as/asset-collection/:originalName/:newName — Save asset collection as new
   */
  async saveAsAssetCollection(
    originalName: string,
    newName: string,
    config: AssetCollectionConfig
  ): Promise<SaveResponse> {
    return this.request<SaveResponse>(
      `/save-as/asset-collection/${encodeURIComponent(originalName)}/${encodeURIComponent(newName)}`,
      {
        method: "POST",
        body: config,
      }
    );
  }

  /**
   * GET /editor/registry/building/:name/metadata — Get config metadata
   */
  async getConfigMetadata(name: string): Promise<ConfigMetadataResponse> {
    return this.request<ConfigMetadataResponse>(
      `/registry/building/${encodeURIComponent(name)}/metadata`
    );
  }

  /**
   * DELETE /editor/config/building/:name — Delete building config
   */
  async deleteBuilding(name: string): Promise<DeleteConfigResponse> {
    return this.request<DeleteConfigResponse>(
      `/config/building/${encodeURIComponent(name)}`,
      { method: "DELETE" }
    );
  }

  /**
   * DELETE /editor/config/asset-collection/:name — Delete asset collection config
   */
  async deleteAssetCollection(name: string): Promise<DeleteConfigResponse> {
    return this.request<DeleteConfigResponse>(
      `/config/asset-collection/${encodeURIComponent(name)}`,
      { method: "DELETE" }
    );
  }

  /**
   * POST /editor/duplicate/building/:name/:newName — Duplicate building config
   */
  async duplicateBuilding(name: string, newName: string): Promise<SaveResponse> {
    return this.request<SaveResponse>(
      `/duplicate/building/${encodeURIComponent(name)}/${encodeURIComponent(newName)}`,
      { method: "POST" }
    );
  }

  /**
   * POST /editor/duplicate/asset-collection/:name/:newName — Duplicate asset collection config
   */
  async duplicateAssetCollection(name: string, newName: string): Promise<SaveResponse> {
    return this.request<SaveResponse>(
      `/duplicate/asset-collection/${encodeURIComponent(name)}/${encodeURIComponent(newName)}`,
      { method: "POST" }
    );
  }

  /**
   * GET asset preview URL (not a fetch, just returns the URL string)
   */
  getAssetPreviewUrl(key: string): string {
    return `${this.baseUrl}/asset-preview/${encodeURIComponent(key)}`;
  }

  /**
   * POST /editor/validate/building — Validate building config
   */
  async validateBuilding(config: BuildingConfig): Promise<{
    success: boolean;
    valid: boolean;
    issues: Array<{
      severity: string;
      message: string;
      tileIndex?: number;
      tileId?: string;
      faceKey?: string;
    }>;
    summary: string;
    stats: {
      totalTiles: number;
      uniqueFaceKeysInTiles: string[];
      uniqueFaceKeysInLinks: string[];
      orphanedFaceKeys: string[];
      missingWeightEntries: string[];
    };
  }> {
    return this.request(`/validate/building`, {
      method: "POST",
      body: config,
    });
  }

  /**
   * POST /editor/sanitize/building — Sanitize building config (fix common issues)
   */
  async sanitizeBuilding(config: BuildingConfig): Promise<{
    success: boolean;
    config: BuildingConfig;
    validationResult: {
      valid: boolean;
      issues: Array<{
        severity: string;
        message: string;
      }>;
      summary: string;
    };
  }> {
    return this.request(`/sanitize/building`, {
      method: "POST",
      body: config,
    });
  }

  /**
   * POST /editor/migrate/building — Migrate building config to current version
   */
  async migrateBuilding(config: BuildingConfig): Promise<{
    success: boolean;
    config: BuildingConfig | null;
    migratedConfig: BuildingConfig | null;
    migrationResult: {
      originalVersion: string;
      migratedVersion: string;
      wasMigrated: boolean;
      appliedMigrations: string[];
      warnings: string[];
    };
    versionStatus: string;
  }> {
    return this.request(`/migrate/building`, {
      method: "POST",
      body: config,
    });
  }

  /**
   * POST /editor/migrate/asset-collection — Migrate asset collection config to current version
   */
  async migrateAssetCollection(config: AssetCollectionConfig): Promise<{
    success: boolean;
    config: AssetCollectionConfig | null;
    migratedConfig: AssetCollectionConfig | null;
    migrationResult: {
      originalVersion: string;
      migratedVersion: string;
      wasMigrated: boolean;
      appliedMigrations: string[];
      warnings: string[];
    };
    versionStatus: string;
  }> {
    return this.request(`/migrate/asset-collection`, {
      method: "POST",
      body: config,
    });
  }

  /**
   * POST /editor/validate-tile-refs/building — Validate tile references in building config
   */
  async validateTileRefs(config: BuildingConfig): Promise<{
    success: boolean;
    valid: boolean;
    issues: Array<{
      severity: string;
      message: string;
      tileIndex?: number;
      tileId?: string;
      faceKey?: string;
    }>;
    summary: string;
    stats: {
      totalTiles: number;
      tilesWithSourceCollection: number;
      validCollectionRefs: number;
      invalidCollectionRefs: number;
      unknownAssetKeys: string[];
    };
  }> {
    return this.request(`/validate-tile-refs/building`, {
      method: "POST",
      body: config,
    });
  }

  /**
   * GET /editor/versions — Get current and supported versions
   */
  async getVersions(): Promise<{
    currentVersion: string;
    supportedVersions: string[];
  }> {
    return this.request(`/versions`);
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient();

// Make available globally for script modules
(window as any).__apiClient = apiClient;