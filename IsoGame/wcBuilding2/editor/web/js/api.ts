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
   * Get asset preview URL (not a fetch, just returns the URL string)
   */
  getAssetPreviewUrl(key: string): string {
    return `${this.baseUrl}/asset-preview/${encodeURIComponent(key)}`;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient();

// Make available globally for script modules
(window as any).__apiClient = apiClient;