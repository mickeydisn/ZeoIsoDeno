/**
 * Test Script: Validate ConfigExtractor output
 *
 * Extracts all building configs and asset collections, validates their structure,
 * and writes the results to the conf/ directory for inspection.
 *
 * Run with: deno run --allow-read --allow-write IsoGame/wcBuilding2/editor/test_extraction.ts
 */

import { ConfigExtractor, extractAllConfigs } from "./extractor.ts";
import {
  CURRENT_VERSION,
  isAssetCollectionConfig,
  isBuildingConfig,
  type TileGroupConfig,
} from "./types.ts";

// ============================================================================
// Validation Functions
// ============================================================================

function validateBuildingConfig(
  config: ReturnType<typeof ConfigExtractor.extractBuilding>,
): string[] {
  const errors: string[] = [];

  // Check required fields
  if (config.version !== CURRENT_VERSION) {
    errors.push(`Expected version "${CURRENT_VERSION}", got "${config.version}"`);
  }
  if (config.type !== "building") {
    errors.push(`Expected type "building", got "${config.type}"`);
  }
  if (!config.id) errors.push("Missing id");
  if (!config.metadata.classRef) errors.push("Missing metadata.classRef");
  if (!config.metadata.sourceFile) errors.push("Missing metadata.sourceFile");
  if (!config.metadata.registryId) errors.push("Missing metadata.registryId");

  // Check params (mainLvl should NOT be present)
  if ("mainLvl" in config.params) {
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

  // Check groups
  if (config.groups) {
    const groupErrors = validateTileGroups(config.groups, "building");
    errors.push(...groupErrors);
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

  if (config.version !== CURRENT_VERSION) {
    errors.push(`Expected version "${CURRENT_VERSION}", got "${config.version}"`);
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

  // Check groups
  if (config.groups) {
    const groupErrors = validateTileGroups(config.groups, "assetCollection");
    errors.push(...groupErrors);
  }

  return errors;
}

// ============================================================================
// Group Validation Functions
// ============================================================================

function validateTileGroups(
  groups: TileGroupConfig[],
  configType: string,
): string[] {
  const errors: string[] = [];
  const groupIds = new Set<string>();

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    // Check required group id
    if (!group.id) {
      errors.push(`${configType} groups[${i}]: Missing id`);
    } else if (groupIds.has(group.id)) {
      errors.push(`${configType} groups[${i}]: Duplicate id "${group.id}"`);
    }
    groupIds.add(group.id);

    // Check face exists and has exactly 4 entries
    if (!group.face || group.face.length !== 4) {
      errors.push(
        `${configType} groups[${i}]: Expected face array with 4 elements, got ${group.face?.length || 0}`,
      );
    }

    // Check items array is not empty
    if (!group.items || group.items.length === 0) {
      errors.push(`${configType} groups[${i}]: items array must not be empty`);
    }

    // Check items do not have face property defined
    if (group.items) {
      for (let j = 0; j < group.items.length; j++) {
        const item = group.items[j] as Record<string, unknown>;
        if ("face" in item) {
          errors.push(
            `${configType} groups[${i}].items[${j}]: face property must not be defined (inherited from group)`,
          );
        }
      }
    }

    // Check weight is valid number (if present)
    if (group.weight !== undefined && typeof group.weight !== "number") {
      errors.push(`${configType} groups[${i}]: weight must be a number`);
    }
  }

  return errors;
}

// ============================================================================
// Group Detection Tests
// ============================================================================

function testGroupDetection(): void {
  console.log("\n=== Group Detection Tests ===\n");

  const testTiles = [
    { face: ["A", "B", "C", "D"], weight: 1, id: "tile1" },
    { face: ["A", "B", "C", "D"], weight: 2, id: "tile2" },
    { face: ["A", "B", "C", "D"], weight: 1, id: "tile3" },
    { face: ["X", "Y", "Z", "W"], weight: 1, id: "tile4" },
    { face: ["X", "Y", "Z", "W"], weight: 1, id: "tile5" },
  ];

  // Test detectTileGroups
  const { groups, remainingTiles: _remainingTiles } = ConfigExtractor.detectTileGroups(testTiles, 2);

  if (groups.length === 2) {
    console.log(`✓ detectTileGroups: Found ${groups.length} groups`);
  } else {
    console.log(`❌ detectTileGroups: Expected 2 groups, got ${groups.length}`);
  }

  // Verify group items don't have face property
  let allItemsValid = true;
  for (const group of groups) {
    for (const item of group.items) {
      if ("face" in item) {
        allItemsValid = false;
        console.log(`❌ Group item has face property (should be omitted)`);
      }
    }
  }
  if (allItemsValid) {
    console.log("✓ detectTileGroups: All group items correctly omit face property");
  }

  // Test compressTileGroups
  const compressed = ConfigExtractor.compressTileGroups(testTiles, {
    enableCompression: true,
    minGroupSize: 2,
  });

  if (compressed.groups.length === 2 && compressed.tiles.length === 0) {
    console.log(`✓ compressTileGroups: Compressed to ${compressed.groups.length} groups`);
  } else {
    console.log(
      `❌ compressTileGroups: Expected 2 groups, 0 remaining tiles, got ${compressed.groups.length} groups, ${compressed.tiles.length} tiles`,
    );
  }

  // Test with compression disabled
  const uncompressed = ConfigExtractor.compressTileGroups(testTiles, {
    enableCompression: false,
  });

  if (uncompressed.groups.length === 0 && uncompressed.tiles.length === testTiles.length) {
    console.log("✓ compressTileGroups: Disabled mode returns all tiles unchanged");
  } else {
    console.log("❌ compressTileGroups: Disabled mode should return no groups");
  }

  // Test single tile should not form a group
  const singleTile = [{ face: ["A", "A", "A", "A"], weight: 1 }];
  const singleResult = ConfigExtractor.detectTileGroups(singleTile, 2);

  if (singleResult.groups.length === 0 && singleResult.remainingTiles.length === 1) {
    console.log("✓ detectTileGroups: Single tile does not form a group");
  } else {
    console.log("❌ detectTileGroups: Single tile should remain ungrouped");
  }
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

// Run group detection tests
testGroupDetection();

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
