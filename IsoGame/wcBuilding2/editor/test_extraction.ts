/**
 * Test Script: Validate ConfigExtractor output
 *
 * Extracts all building configs and asset collections, validates their structure,
 * and writes the results to the conf/ directory for inspection.
 *
 * Run with: deno run --allow-read --allow-write IsoGame/wcBuilding2/editor/test_extraction.ts
 */

import { ConfigExtractor, extractAllConfigs } from "./extractor.ts";
import { isAssetCollectionConfig, isBuildingConfig } from "./types.ts";

// ============================================================================
// Validation Functions
// ============================================================================

function validateBuildingConfig(
  config: ReturnType<typeof ConfigExtractor.extractBuilding>,
): string[] {
  const errors: string[] = [];

  // Check required fields
  if (config.version !== "1.0") {
    errors.push(`Expected version "1.0", got "${config.version}"`);
  }
  if (config.type !== "building") {
    errors.push(`Expected type "building", got "${config.type}"`);
  }
  if (!config.id) errors.push("Missing id");
  if (!config.metadata.classRef) errors.push("Missing metadata.classRef");
  if (!config.metadata.sourceFile) errors.push("Missing metadata.sourceFile");
  if (!config.metadata.registryId) errors.push("Missing metadata.registryId");

  // Check params (mainLvl should NOT be present)
  if ("mainLvl" in (config.params as any)) {
    errors.push("mainLvl should NOT be in params (it's a runtime value)");
  }
  if (typeof config.params.growLoopCount !== "number") {
    errors.push("params.growLoopCount must be a number");
  }
  if (typeof config.params.endLoopMax !== "number") {
    errors.push("params.endLoopMax must be a number");
  }

  // Check tiles
  for (let i = 0; i < config.tiles.length; i++) {
    const tile = config.tiles[i];
    if (!tile.face || tile.face.length !== 4) {
      errors.push(
        `tiles[${i}]: Expected face array with 4 elements, got ${
          tile.face?.length || 0
        }`,
      );
    }
    if (typeof tile.weight !== "number") {
      errors.push(`tiles[${i}]: weight must be a number`);
    }
  }

  // Check start tiles
  if (config.startTiles.length === 0) {
    errors.push("startTiles should not be empty");
  }

  // Check faceLinkWeight consistency
  const faceKeysInTiles = new Set<string>();
  for (const tile of [...config.tiles, ...config.startTiles]) {
    for (const face of tile.face) {
      if (face && face !== null) faceKeysInTiles.add(face);
    }
  }

  // Verify faceLinks are deduplicated (unique pairs)
  const seenPairs = new Set<string>();
  for (const [a, b] of config.faceLinks) {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seenPairs.has(key)) {
      errors.push(`faceLinks contains duplicate pair: [${a}, ${b}]`);
    }
    seenPairs.add(key);
  }

  return errors;
}

function validateAssetCollectionConfig(
  config: ReturnType<typeof ConfigExtractor.extractAssetCollection>,
): string[] {
  const errors: string[] = [];

  if (config.version !== "1.0") {
    errors.push(`Expected version "1.0", got "${config.version}"`);
  }
  if (config.type !== "assetCollection") {
    errors.push(`Expected type "assetCollection", got "${config.type}"`);
  }
  if (!config.id) errors.push("Missing id");
  if (!config.tag) errors.push("Missing tag");

  for (let i = 0; i < config.tiles.length; i++) {
    const tile = config.tiles[i];
    if (!tile.face || tile.face.length !== 4) {
      errors.push(
        `tiles[${i}]: Expected face array with 4 elements, got ${
          tile.face?.length || 0
        }`,
      );
    }
  }

  return errors;
}

// ============================================================================
// Run Extraction
// ============================================================================

console.log("=== Building Configuration Extractor — Validation ===\n");

const summary = ConfigExtractor.getExtractableSummary();
console.log(
  `Found ${summary.buildings.length} building classes and ${summary.assetCollections.length} asset collection classes.`,
);
console.log("\nBuildings:", summary.buildings.join(", "));
console.log(
  "Asset Collections:",
  summary.assetCollections.map((a) => `${a.name} (${a.pattern})`).join(", "),
);

// Extract all configs
console.log("\n--- Extracting Configs ---\n");
const { buildings, assetCollections } = extractAllConfigs();

// Validate building configs
console.log("=== Building Config Validation ===\n");
let totalBuildingErrors = 0;
let totalBuildingTiles = 0;
let totalBuildingStartTiles = 0;

for (const [id, config] of Object.entries(buildings)) {
  if (!isBuildingConfig(config)) {
    console.error(`❌ ${id}: NOT a valid BuildingConfig`);
    continue;
  }

  const errors = validateBuildingConfig(config);
  totalBuildingTiles += config.tiles.length;
  totalBuildingStartTiles += config.startTiles.length;

  if (errors.length === 0) {
    console.log(
      `✓ ${id}: OK (${config.tiles.length} tiles, ${config.startTiles.length} start tiles, ${config.faceLinks.length} face links)`,
    );
  } else {
    console.log(`❌ ${id}: ${errors.length} errors`);
    for (const err of errors.slice(0, 5)) {
      console.log(`  - ${err}`);
    }
    totalBuildingErrors += errors.length;
  }
}

console.log("\n=== Asset Collection Config Validation ===\n");
let totalAssetErrors = 0;
let totalAssetTiles = 0;

for (const [id, config] of Object.entries(assetCollections)) {
  if (!isAssetCollectionConfig(config)) {
    console.error(`❌ ${id}: NOT a valid AssetCollectionConfig`);
    continue;
  }

  const errors = validateAssetCollectionConfig(config);
  totalAssetTiles += config.tiles.length;

  if (errors.length === 0) {
    console.log(
      `✓ ${id}: OK (${config.tiles.length} tiles, tag="${config.tag}")`,
    );
  } else {
    console.log(`❌ ${id}: ${errors.length} errors`);
    for (const err of errors.slice(0, 5)) {
      console.log(`  - ${err}`);
    }
    totalAssetErrors += errors.length;
  }
}

// ============================================================================
// Summary
// ============================================================================

console.log("\n=== Summary ===\n");
console.log(`Buildings extracted: ${Object.keys(buildings).length}`);
console.log(`  Total tiles: ${totalBuildingTiles}`);
console.log(`  Total start tiles: ${totalBuildingStartTiles}`);
console.log(
  `Asset collections extracted: ${Object.keys(assetCollections).length}`,
);
console.log(`  Total tiles: ${totalAssetTiles}`);
console.log(`\nValidation errors: ${totalBuildingErrors + totalAssetErrors}`);

if (totalBuildingErrors + totalAssetErrors === 0) {
  console.log("\n✅ All configs extracted and validated successfully!");
} else {
  console.log(
    `\n❌ ${totalBuildingErrors + totalAssetErrors} validation error(s) found.`,
  );
}
