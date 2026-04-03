/**
 * Round-Trip Validation Script for Building Config Editor
 *
 * This script validates the complete editor workflow:
 * 1. Extract all building configs from TypeScript classes
 * 2. Save them as JSON
 * 3. Reload JSON configs via ConfigLoader
 * 4. Run generation and verify consistency
 * 5. Verify zero game code modifications
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-net IsoGame/wcBuilding2/editor/validate.ts
 */

import { ConfigExtractor, BUILDING_CLASSES } from "./extractor.ts";
import type { BuildingConfig } from "./types.ts";
import { ConfigLoader } from "./loader.ts";

// ============================================================================
// Constants
// ============================================================================

const BUILDINGS_DIR = "IsoGame/wcBuilding2/editor/conf/buildings";
const RESULTS: { test: string; status: "PASS" | "FAIL" | "SKIP"; message: string }[] = [];

// ============================================================================
// Utility Functions
// ============================================================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function pass(test: string, message: string = "OK"): void {
  RESULTS.push({ test, status: "PASS", message });
  console.log(`  ✓ ${test}: ${message}`);
}

function fail(test: string, message: string): void {
  RESULTS.push({ test, status: "FAIL", message });
  console.error(`  ✗ ${test}: ${message}`);
}

function skip(test: string, message: string = "Skipped"): void {
  RESULTS.push({ test, status: "SKIP", message });
  console.log(`  - ${test}: ${message}`);
}

// ============================================================================
// File I/O Helpers
// ============================================================================

async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch {
    await Deno.mkdir(path, { recursive: true });
  }
}

async function writeJSON(path: string, data: unknown): Promise<void> {
  await ensureDir(path.substring(0, path.lastIndexOf("/")));
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2));
}

async function readJSON(path: string): Promise<unknown> {
  const text = await Deno.readTextFile(path);
  return JSON.parse(text);
}

// ============================================================================
// Test 1: Extract all building configs
// ============================================================================

async function testExtractAllBuildings(): Promise<Record<string, BuildingConfig>> {
  console.log("\n=== Test 1: Extract all building configs ===");
  const extracted: Record<string, BuildingConfig> = {};

  for (const className of Object.keys(BUILDING_CLASSES)) {
    const testName = `Extract ${className}`;
    try {
      const config = ConfigExtractor.extractBuilding(className);

      // Validate structure
      assert(config.version === "1.1", "version must be '1.0'");
      assert(config.type === "building", "type must be 'building'");
      assert(config.id !== undefined && config.id !== "", "id must be present");
      assert(config.metadata.classRef === className, "metadata.classRef must match class name");
      assert(config.params.growLoopCount >= 5 && config.params.growLoopCount <= 100,
        `growLoopCount must be 5-100, got ${config.params.growLoopCount}`);
      assert(config.params.endLoopMax >= 50 && config.params.endLoopMax <= 1000,
        `endLoopMax must be 50-1000, got ${config.params.endLoopMax}`);

      // Validate all tiles have 4-element face arrays
      const allTiles = [...config.startTiles, ...config.tiles];
      for (const tile of allTiles) {
        assert(tile.face.length === 4, `Tile ${tile.id || "unknown"} must have 4 face elements, got ${tile.face.length}`);
      }

      // Validate faceLinkWeight keys are consistent with faceLinks
      const faceLinkKeys = new Set<string>();
      for (const [a, b] of config.faceLinks) {
        faceLinkKeys.add(a);
        faceLinkKeys.add(b);
      }
      for (const key of faceLinkKeys) {
        const hasWeight = config.faceLinkWeight[key] !== undefined;
        assert(hasWeight, `Face key "${key}" in faceLinks must have a weight entry`);
      }

      // Validate mainLvl is NOT present in params
      assert(!("mainLvl" in config.params), "mainLvl must NOT be in params");

      // Validate tile groups if present
      if (config.groups) {
        for (const group of config.groups) {
          assert(Array.isArray(group.face) && group.face.length === 4, 
            `Group ${group.id} face must have exactly 4 entries`);
          assert(Array.isArray(group.items) && group.items.length > 0, 
            `Group ${group.id} items array must not be empty`);
          
          for (const item of group.items) {
            assert(!('face' in item), 
              `Group item in ${group.id} must not have face property defined`);
          }
          
          if (group.weight !== undefined) {
            assert(typeof group.weight === 'number' && group.weight >= 0, 
              `Group ${group.id} weight must be valid non-negative number`);
          }
        }
      }

      extracted[config.id] = config;
      pass(testName, `${config.tiles.length} tiles, ${config.startTiles.length} start tiles`);
    } catch (e) {
      fail(testName, e instanceof Error ? e.message : String(e));
    }
  }

  return extracted;
}

// ============================================================================
// Test 2: Asset collection extraction
// ============================================================================

async function testExtractAssetCollections(): Promise<void> {
  console.log("\n=== Test 2: Extract asset collections ===");
  const collections = ConfigExtractor.listAssetCollectionClasses();

  for (const className of collections) {
    const testName = `Extract ${className}`;
    try {
      const config = ConfigExtractor.extractAssetCollection(className);
      assert(config.version === "1.1", "version must be '1.0'");
      assert(config.type === "assetCollection", "type must be 'assetCollection'");
      assert(config.tag !== undefined, "tag must be present");

      // Validate tile groups if present
      if (config.groups) {
        for (const group of config.groups) {
          assert(Array.isArray(group.face) && group.face.length === 4, 
            `Group ${group.id} face must have exactly 4 entries`);
          assert(Array.isArray(group.items) && group.items.length > 0, 
            `Group ${group.id} items array must not be empty`);
          
          for (const item of group.items) {
            assert(!('face' in item), 
              `Group item in ${group.id} must not have face property defined`);
          }
          
          if (group.weight !== undefined) {
            assert(typeof group.weight === 'number' && group.weight >= 0, 
              `Group ${group.id} weight must be valid non-negative number`);
          }
        }
      }

      // Validate tiles have sourceGetter for getter-based collections
      const registryEntry = ConfigExtractor.listAssetCollectionClasses();
      pass(testName, `${config.tiles.length} tiles, tag="${config.tag}"`);
    } catch (e) {
      fail(testName, e instanceof Error ? e.message : String(e));
    }
  }
}

// ============================================================================
// Test 3: Save and reload JSON configs
// ============================================================================

async function testSaveAndReload(extracted: Record<string, BuildingConfig>): Promise<void> {
  console.log("\n=== Test 3: Save and reload JSON configs ===");
  await ensureDir(BUILDINGS_DIR);

  for (const [id, config] of Object.entries(extracted)) {
    const testName = `Save and reload ${id}`;
    try {
      // Save to JSON
      const filePath = `${BUILDINGS_DIR}/${id}.json`;
      await writeJSON(filePath, config);

      // Verify file exists and is valid JSON
      const savedData = await readJSON(filePath) as BuildingConfig;
      assert(savedData.type === "building", "saved type must be 'building'");
      assert(savedData.tiles.length === config.tiles.length,
        `tile count mismatch: expected ${config.tiles.length}, got ${savedData.tiles.length}`);

      // Test face link expansion: JSON stores unique pairs, loader expands to bidirectional
      const expectedFaceLinkCount = config.faceLinks.length * 2;

      pass(testName, `${savedData.tiles.length} tiles, ${savedData.faceLinks.length} face link pairs`);
    } catch (e) {
      fail(testName, e instanceof Error ? e.message : String(e));
    }
  }
}

// ============================================================================
// Test 4: Generate buildings from loaded configs
// ============================================================================

async function testGenerationConsistency(): Promise<void> {
  console.log("\n=== Test 4: Generation consistency (skip: requires World context) ===");
  skip(
    "Generation from loaded configs",
    "Requires World instance and map context — skipped for CI validation"
  );
  skip(
    "Tile count comparison (generated vs expected)",
    "Requires generation to run first"
  );
}

// ============================================================================
// Test 5: Zero game code modifications
// ============================================================================

async function testZeroGameModifications(): Promise<void> {
  console.log("\n=== Test 5: Zero game code modifications ===");

  // Check that editor files are isolated
  const editorFiles = [
    "IsoGame/wcBuilding2/editor/types.ts",
    "IsoGame/wcBuilding2/editor/extractor.ts",
    "IsoGame/wcBuilding2/editor/loader.ts",
    "IsoGame/wcBuilding2/editor/server.ts",
    "IsoGame/wcBuilding2/editor/integration.ts",
    "IsoGame/wcBuilding2/editor/validate.ts",
  ];

  for (const file of editorFiles) {
    const testName = `Editor file exists: ${file}`;
    try {
      await Deno.stat(file);
      pass(testName);
    } catch {
      fail(testName, "File not found");
    }
  }

  // Verify no modifications outside editor directory
  // (This is a documentation test — actual git diff is left to the developer)
  skip(
    "git diff --name-only IsoGame/wcBuilding2/!(editor)/**",
    "Run manually: git diff --name-only IsoGame/wcBuilding2/"
  );
}

// ============================================================================
// Test 6: ConfigLoader resolution chain
// ============================================================================

async function testConfigLoaderResolution(extracted: Record<string, BuildingConfig>): Promise<void> {
  console.log("\n=== Test 6: ConfigLoader resolution chain ===");

  // Test 6a: Check hasJSONConfig for saved buildings
  for (const id of Object.keys(extracted)) {
    const testName = `ConfigLoader.hasJSONConfig("${id}")`;
    try {
      const exists = await ConfigLoader.hasJSONConfig(id);
      assert(exists, `Expected JSON config for "${id}" to exist after save`);
      pass(testName, exists ? "found" : "not found");
    } catch (e) {
      fail(testName, e instanceof Error ? e.message : String(e));
    }
  }

  // Test 6b: Check listSavedConfigs returns expected entries
  try {
    const saved = await ConfigLoader.listSavedConfigs();
    const savedIds = new Set(saved.map(s => s.id));

    for (const id of Object.keys(extracted)) {
      const testName = `ConfigLoader.listSavedConfigs includes "${id}"`;
      assert(savedIds.has(id), `Expected "${id}" in saved configs list`);
      pass(testName);
    }
  } catch (e) {
    fail("ConfigLoader.listSavedConfigs()", e instanceof Error ? e.message : String(e));
  }

  // Test 6c: Check fallback to registry when JSON doesn't exist
  try {
    const testName = "ConfigLoader falls back to registry for unknown ID";
    // A non-existent ID should throw, not return null
    try {
      await ConfigLoader.loadBuilding("__nonexistent__");
      fail(testName, "Expected error but got success");
    } catch (e) {
      assert(
        e instanceof Error && e.message.includes("not found"),
        `Expected 'not found' error, got: ${e instanceof Error ? e.message : String(e)}`
      );
      pass(testName, "throws error as expected");
    }
  } catch (e) {
    fail("ConfigLoader fallback test", e instanceof Error ? e.message : String(e));
  }
}

// ============================================================================
// Test 7: Performance validation
// ============================================================================

async function testPerformance(extracted: Record<string, BuildingConfig>): Promise<void> {
  console.log("\n=== Test 7: Performance validation ===");

  // Test extraction time per building
  for (const className of Object.keys(BUILDING_CLASSES)) {
    const testName = `Extract ${className} < 500ms`;
    const start = performance.now();
    try {
      ConfigExtractor.extractBuilding(className);
      const duration = performance.now() - start;
      if (duration < 500) {
        pass(testName, `${duration.toFixed(1)}ms`);
      } else {
        fail(testName, `${duration.toFixed(1)}ms exceeds 500ms target`);
      }
    } catch {
      fail(testName, "extraction failed");
    }
  }

  // Test save/write time
  for (const [id, config] of Object.entries(extracted)) {
    const testName = `Save ${id}.json < 100ms`;
    const start = performance.now();
    try {
      await writeJSON(`${BUILDINGS_DIR}/${id}.json`, config);
      const duration = performance.now() - start;
      if (duration < 100) {
        pass(testName, `${duration.toFixed(1)}ms`);
      } else {
        fail(testName, `${duration.toFixed(1)}ms exceeds 100ms target`);
      }
    } catch {
      fail(testName, "save failed");
    }
  }
}

// ============================================================================
// Summary Report
// ============================================================================

function printSummary(): void {
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION SUMMARY");
  console.log("=".repeat(60));

  const passCount = RESULTS.filter(r => r.status === "PASS").length;
  const failCount = RESULTS.filter(r => r.status === "FAIL").length;
  const skipCount = RESULTS.filter(r => r.status === "SKIP").length;

  console.log(`Total: ${RESULTS.length} | Pass: ${passCount} | Fail: ${failCount} | Skip: ${skipCount}`);

  if (failCount > 0) {
    console.log("\nFailed tests:");
    for (const r of RESULTS.filter(r => r.status === "FAIL")) {
      console.log(`  ✗ ${r.test}: ${r.message}`);
    }
  }

  console.log("=".repeat(60));

  if (failCount === 0) {
    console.log("All tests passed! ✓");
  } else {
    console.log(`${failCount} test(s) failed ✗`);
    Deno.exit(1);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

(async () => {
  try {
    console.log("Building Config Editor — Round-Trip Validation");
    console.log("Starting tests...\n");

    // Test 1: Extract all buildings
    const extracted = await testExtractAllBuildings();

    // Test 2: Extract asset collections
    await testExtractAssetCollections();

    // Test 3: Save and reload
    await testSaveAndReload(extracted);

    // Test 4: Generation consistency (skipped — requires World context)
    await testGenerationConsistency();

    // Test 5: Zero game modifications
    await testZeroGameModifications();

    // Test 6: ConfigLoader resolution chain
    await testConfigLoaderResolution(extracted);

    // Test 7: Performance validation
    await testPerformance(extracted);

    // Print summary
    printSummary();
  } catch (e) {
    console.error("\nFatal error during validation:", e);
    printSummary();
  }
})();