/**
 * Building Service — Building config related API operations
 */

import { apiClient } from "../api.ts";
import type { BuildingConfig } from "../../../types.ts";
import type { SaveResponse, PreviewResponse } from "../api.ts";

/**
 * Building service object with typed methods for all building-related API operations
 */
export const BuildingService = {
  /**
   * Extract building config from TypeScript class
   */
  async extract(className: string): Promise<BuildingConfig> {
    return apiClient.extractBuilding(className);
  },

  /**
   * Load existing building JSON config
   */
  async load(name: string): Promise<BuildingConfig> {
    return apiClient.loadBuilding(name);
  },

  /**
   * Save building JSON config
   */
  async save(name: string, config: BuildingConfig): Promise<SaveResponse> {
    return apiClient.saveBuilding(name, config);
  },

  /**
   * Save building as new JSON file
   */
  async saveAs(originalName: string, newName: string, config: BuildingConfig): Promise<SaveResponse> {
    return apiClient.saveAsBuilding(originalName, newName, config);
  },

  /**
   * Duplicate existing building config
   */
  async duplicate(name: string, newName: string): Promise<SaveResponse> {
    return apiClient.duplicateBuilding(name, newName);
  },

  /**
   * Delete building config
   */
  async delete(name: string) {
    return apiClient.deleteBuilding(name);
  },

  /**
   * Validate building config
   */
  async validate(config: BuildingConfig) {
    return apiClient.validateBuilding(config);
  },

  /**
   * Validate tile references in building config
   */
  async validateTileRefs(config: BuildingConfig) {
    return apiClient.validateTileRefs(config);
  },

  /**
   * Sanitize building config (fix common issues)
   */
  async sanitize(config: BuildingConfig) {
    return apiClient.sanitizeBuilding(config);
  },

  /**
   * Migrate building config to current version
   */
  async migrate(config: BuildingConfig) {
    return apiClient.migrateBuilding(config);
  },

  /**
   * Generate building preview
   */
  async generatePreview(config: BuildingConfig): Promise<PreviewResponse> {
    return apiClient.previewGenerate(config);
  },

  /**
   * Get building config metadata
   */
  async getMetadata(name: string) {
    return apiClient.getConfigMetadata(name);
  }
};