/**
 * Generation Preview Service
 *
 * Wraps the preview API endpoint with additional features:
 * - Quick preview with reduced settings
 * - Timeout handling (30 seconds max)
 * - Descriptive error messages for common failure modes
 */

import type { BuildingConfig } from "../../../types.ts";
import type { ApiClient } from "../api.ts";
import type { PreviewResponse } from "../api.ts";

// ============================================================================
// Response Types
// ============================================================================

export interface PreviewResult {
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

export interface QuickStats {
  tileCount: number;
  faceKeyDistribution: Record<string, number>;
  success: boolean;
  error?: string;
}

// ============================================================================
// Preview Service Class
// ============================================================================

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds
const QUICK_PREVIEW_LOOPS = 10;
const QUICK_PREVIEW_END_MAX = 100;

export class PreviewService {
  private apiClient: ApiClient;
  private seed: number | null = null;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Set optional seed for reproducible generation.
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * Generate building preview with current config settings.
   */
  async generate(config: BuildingConfig): Promise<PreviewResult> {
    try {
      const modifiedConfig = this.prepareConfig(config);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      try {
        const response = await this.fetchWithAbort(modifiedConfig, controller.signal);
        clearTimeout(timeoutId);
        return this.parseResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        throw this.handleFetchError(error);
      }
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Quick preview with minimal settings for fast stats.
   */
  async quickPreview(config: BuildingConfig): Promise<QuickStats> {
    const quickConfig: BuildingConfig = {
      ...config,
      params: {
        ...config.params,
        growLoopCount: Math.min(config.params.growLoopCount ?? QUICK_PREVIEW_LOOPS, QUICK_PREVIEW_LOOPS),
        endLoopMax: Math.min(config.params.endLoopMax ?? QUICK_PREVIEW_END_MAX, QUICK_PREVIEW_END_MAX),
      },
    };

    const result = await this.generate(quickConfig);

    if (!result.success) {
      return {
        tileCount: 0,
        faceKeyDistribution: {},
        success: false,
        error: result.error,
      };
    }

    // Calculate face key distribution
    const faceKeyDistribution: Record<string, number> = {};
    for (const tile of result.tiles) {
      if (tile.tileType) {
        faceKeyDistribution[tile.tileType] = (faceKeyDistribution[tile.tileType] || 0) + 1;
      }
    }

    return {
      tileCount: result.stats?.totalTiles ?? 0,
      faceKeyDistribution,
      success: true,
    };
  }

  /**
   * Prepare config for API submission.
   */
  private prepareConfig(config: BuildingConfig): BuildingConfig {
    const prepared = { ...config };

    // Apply seed if set
    if (this.seed !== null) {
      prepared.params = {
        ...prepared.params,
        seed: this.seed,
      };
    }

    return prepared;
  }

  /**
   * Fetch with abort support.
   */
  private async fetchWithAbort(config: BuildingConfig, signal: AbortSignal): Promise<Response> {
    const response = await fetch("/editor/preview/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return response;
  }

  /**
   * Parse API response into PreviewResult.
   */
  private async parseResponse(response: Response): Promise<PreviewResult> {
    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        tiles: data.tiles || [],
        iterations: data.iterations || 0,
        stats: data.stats || { totalTiles: 0, configuredTiles: 0 },
        error: data.error || "Generation failed",
      };
    }

    return {
      success: true,
      tiles: data.tiles || [],
      iterations: data.iterations || 0,
      stats: data.stats || { totalTiles: 0, configuredTiles: 0 },
    };
  }

  /**
   * Handle fetch errors (timeout, network, abort).
   */
  private handleFetchError(error: unknown): Error {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Error(
        "Generation timed out after 30 seconds. Try reducing growLoopCount or endLoopMax."
      );
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return new Error("Network error: could not reach generation preview endpoint.");
    }

    return error instanceof Error ? error : new Error("Unknown error during generation.");
  }

  /**
   * Format error into PreviewResult.
   */
  private formatError(error: unknown): PreviewResult {
    const message = error instanceof Error ? error.message : String(error);

    // Provide descriptive error messages for common failure modes
    if (message.includes("no start tiles")) {
      return {
        success: false,
        tiles: [],
        iterations: 0,
        stats: { totalTiles: 0, configuredTiles: 0 },
        error: "Generation failed: no start tiles configured.",
      };
    }

    if (message.includes("max iterations") || message.includes("incomplete")) {
      return {
        success: false,
        tiles: [],
        iterations: 0,
        stats: { totalTiles: 0, configuredTiles: 0 },
        error: "Generation incomplete: reached max iterations before closure.",
      };
    }

    return {
      success: false,
      tiles: [],
      iterations: 0,
      stats: { totalTiles: 0, configuredTiles: 0 },
      error: message,
    };
  }
}