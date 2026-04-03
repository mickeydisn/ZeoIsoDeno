/**
 * Asset Collection Service — Asset Collection config related API operations
 */

import { apiClient } from "../api.ts";
import type { AssetCollectionConfig } from "../../../types.ts";
import type { SaveResponse } from "../api.ts";

/**
 * Asset Collection service object with typed methods for all asset collection-related API operations
 */
export const AssetCollectionService = {
  /**
   * Extract asset collection config from TypeScript class
   */
  async extract(className: string): Promise<AssetCollectionConfig> {
    return apiClient.extractAssetCollection(className);
  },

  /**
   * Load existing asset collection JSON config
   */
  async load(name: string): Promise<AssetCollectionConfig> {
    return apiClient.loadAssetCollection(name);
  },

  /**
   * Save asset collection JSON config
   */
  async save(name: string, config: AssetCollectionConfig): Promise<SaveResponse> {
    return apiClient.saveAssetCollection(name, config);
  },

  /**
   * Save asset collection as new JSON file
   */
  async saveAs(originalName: string, newName: string, config: AssetCollectionConfig): Promise<SaveResponse> {
    return apiClient.saveAsAssetCollection(originalName, newName, config);
  },

  /**
   * Duplicate existing asset collection config
   */
  async duplicate(name: string, newName: string): Promise<SaveResponse> {
    return apiClient.duplicateAssetCollection(name, newName);
  },

  /**
   * Delete asset collection config
   */
  async delete(name: string) {
    return apiClient.deleteAssetCollection(name);
  },

  /**
   * Migrate asset collection config to current version
   */
  async migrate(config: AssetCollectionConfig) {
    return apiClient.migrateAssetCollection(config);
  }
};