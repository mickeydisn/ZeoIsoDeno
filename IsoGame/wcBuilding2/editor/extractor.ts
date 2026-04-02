/**
 * Config Extractor — Re-exports from extractionEngine.ts
 *
 * This module re-exports the core extraction logic from extractionEngine.ts
 * for backward compatibility. All extraction logic has been moved to the
 * dedicated extractionEngine.ts module.
 *
 * New code should import directly from extractionEngine.ts.
 */

export {
  ConfigExtractor,
  extractAllConfigs,
} from "./extractionEngine.ts";

// Re-export registries for backward compatibility
export {
  ASSET_COLLECTION_REGISTRY,
  BUILDING_CLASSES,
} from "./registries.ts";