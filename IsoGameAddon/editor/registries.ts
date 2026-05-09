/**
 * Registries — Centralized Registry Definitions for Building and Asset Configs
 *
 * This module is the single source-of-truth for building config class and asset collection
 * class registry definitions. It contains:
 * - BUILDING_CLASSES: Maps class names to constructors for building configs
 * - BUILDING_SOURCE_FILES: Maps class names to source file names
 * - ASSET_COLLECTION_REGISTRY: Maps asset collection class names to extraction configs
 * - REGISTRY_ID_MAP: Maps class names to runtime loading registry IDs
 * - AssetCollectionClassEntry: Interface for asset collection registry entries
 *
 * Extracted from `extractor.ts` and `types.ts` to avoid circular dependencies
 * and improve maintainability.
 */

import { WcAbstractBuildConf } from "../../IsoGame/generator/wcBuilding2/wcAbstractBuildConf.ts";
import { WcBuildConf_HouseA } from "../../IsoGame/generator/wcBuilding2/conf/buildConf_HouseA.ts";
import { WcBuildConf_GraveA } from "../../IsoGame/generator/wcBuilding2/conf/buildConf_GraveA.ts";
import { WcBuildConf_ManorA } from "../../IsoGame/generator/wcBuilding2/conf/buildConf_ManorA.ts";
import { WcBuildConf_LabBorderA } from "../../IsoGame/generator/wcBuilding2/conf/buildConf_LabBorderA.ts";
import { WcBuildConf_LabPipeA } from "../../IsoGame/generator/wcBuilding2/conf/buildConf_LabPipeA.ts";
import { WcBuildConf_RLabA } from "../../IsoGame/generator/wcBuilding2/conf/buildConf_RLabA.ts";

import { WcAsset_WallHouse } from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_WallHouse.ts";
import { WcAsset_WallManor } from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_WallManor.ts";
import { WcAsset_WallRLab } from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_WallRLab.ts";
import {
  FenceCollapseType,
  WcAsset_FenceGrave,
  WcAsset_FencePlatform,
  WcAsset_FenceSimple,
} from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_Fence2.ts";
import { WcAsset_Enter } from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_Entrer.ts";
import { WcAsset_CorridorLab } from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_CorridorLab.ts";
import { WcAsset_CorridorPipe } from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_CorridorPipe.ts";
import { wcAsset_X } from "../../IsoGame/generator/wcBuilding2/conf/assetsCollection/wcAsset_X.ts";

// ============================================================================
// Asset Collection Class Entry Interface
// ============================================================================

/**
 * Asset collection class registry configuration.
 * Defines how each asset collection class produces tiles.
 *
 * Two patterns exist:
 * 1. **Getter-based**: Tiles produced by individual getters (WallHouse, WallManor, WallRLab)
 *    Each getter computes face keys dynamically using `tag + suffix`.
 * 2. **groupAsset-based**: Tiles produced by calling groupAsset(params) with weight parameters
 *    (FenceSimple, FencePlatform, FenceGrave)
 */
export interface AssetCollectionClassEntry {
  /** TypeScript class reference */
  class: new (params?: Record<string, unknown>) => {
    tag: string;
    [key: string]: unknown;
  };
  /** Source module file name */
  sourceFile: string;
  /** For getter-based classes: list of tile-producing getter names */
  tileGetters?: string[];
  /** For groupAsset-based classes: set to true */
  usesGroupAsset?: boolean;
  /** Default parameters for groupAsset() call */
  groupAssetDefaults?: {
    flatW: number;
    cornerW: number;
    innerW: number;
    isFrise: boolean;
  };
  /** Special: has groupInit() for start tiles (e.g., WcAsset_Enter) */
  hasGroupInit?: boolean;
}

// ============================================================================
// Building Config Class Registry
// ============================================================================

/**
 * Maps building config class names to their constructor functions.
 */
export const BUILDING_CLASSES: Record<
  string,
  new (params?: Record<string, unknown>) => WcAbstractBuildConf
> = {
  "WcBuildConf_HouseA": WcBuildConf_HouseA,
  "WcBuildConf_GraveA": WcBuildConf_GraveA,
  "WcBuildConf_ManorA": WcBuildConf_ManorA,
  "WcBuildConf_LabBorderA": WcBuildConf_LabBorderA,
  "WcBuildConf_LabPipeA": WcBuildConf_LabPipeA,
  "WcBuildConf_RLabA": WcBuildConf_RLabA,
};

/**
 * Maps building config class names to their source file names.
 */
export const BUILDING_SOURCE_FILES: Record<string, string> = {
  "WcBuildConf_HouseA": "buildConf_HouseA",
  "WcBuildConf_GraveA": "buildConf_GraveA",
  "WcBuildConf_ManorA": "buildConf_ManorA",
  "WcBuildConf_LabBorderA": "buildConf_LabBorderA",
  "WcBuildConf_LabPipeA": "buildConf_LabPipeA",
  "WcBuildConf_RLabA": "buildConf_RLabA",
};

/**
 * Maps TypeScript class names to their registry IDs.
 * Used during extraction to populate metadata.registryId.
 */
export const REGISTRY_ID_MAP: Record<string, string> = {
  "WcBuildConf_HouseA": "house_a",
  "WcBuildConf_GraveA": "grave_a",
  "WcBuildConf_ManorA": "manor_a",
  "WcBuildConf_LabBorderA": "lab_border_a",
  "WcBuildConf_LabPipeA": "lab_pipe_a",
  "WcBuildConf_RLabA": "r_lab_a",
};

// ============================================================================
// Asset Collection Registry
// ============================================================================

/**
 * Asset collection class registry with per-class extraction configuration.
 * Defines how each class produces tiles.
 */
export const ASSET_COLLECTION_REGISTRY: Record<
  string,
  AssetCollectionClassEntry
> = {
  // Wall-based (getter-based)
  "WcAsset_WallHouse": {
    class: WcAsset_WallHouse as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_WallHouse",
    tileGetters: [
      "Corner",
      "Corner_B",
      "Wall",
      "Wall_Door",
      "Wall_Windows",
      "Wall_RoofWindows",
      "InnerCorner",
      "InnerCorner_X",
      "Inside_Full",
    ],
  },
  "WcAsset_WallManor": {
    class: WcAsset_WallManor as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_WallManor",
    tileGetters: [
      "Corner",
      "Wall_Door",
      "Wall",
      "Wall_Windows",
      "InnerCorner",
      "InnerCorner_X",
      "Inside_Full",
    ],
  },
  "WcAsset_WallRLab": {
    class: WcAsset_WallRLab as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_WallRLab",
    tileGetters: [
      "Corner",
      "Corner_Round",
      "Wall",
      "InnerCorner",
      "Inside_Full",
    ],
  },

  // Fence-based (groupAsset-based)
  "WcAsset_FenceSimple": {
    class: WcAsset_FenceSimple as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Fence2",
    usesGroupAsset: true,
    groupAssetDefaults: { flatW: 10, cornerW: 10, innerW: 0, isFrise: false },
  },
  "WcAsset_FencePlatform": {
    class: WcAsset_FencePlatform as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Fence2",
    usesGroupAsset: true,
    groupAssetDefaults: {
      flatW: 100,
      cornerW: 500,
      innerW: 400,
      isFrise: true,
    },
  },
  "WcAsset_FenceGrave": {
    class: WcAsset_FenceGrave as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Fence2",
    usesGroupAsset: true,
    groupAssetDefaults: { flatW: 10, cornerW: 0, innerW: 13, isFrise: true },
  },

  // Entrance (special: has both groupInit and groupAsset)
  "WcAsset_Enter": {
    class: WcAsset_Enter as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Entrer",
    usesGroupAsset: true,
    hasGroupInit: true,
    groupAssetDefaults: { flatW: 0, cornerW: 0, innerW: 0, isFrise: false },
  },

  // Lab corridors (getter-based)
  "WcAsset_CorridorLab": {
    class: WcAsset_CorridorLab as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_CorridorLab",
    tileGetters: [
      "Flat",
      "Flat_Detail",
      "Flat_Window",
      "Door",
      "Corner",
      "Corner_Round",
      "TJoin",
      "CrossJoin",
    ],
  },
  "WcAsset_CorridorPipe": {
    class: WcAsset_CorridorPipe as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_CorridorPipe",
    tileGetters: [
      "Flat",
      "Flat_NoSupport",
      "Flat_Ring",
      "Flat_Open",
      "Door",
      "Door2",
      "Corner",
      "Corner_Round",
      "TJoin",
      "CrossJoin",
      "Silo",
    ],
  },

  // Generic X tiles
  "WcAsset_X": {
    class: wcAsset_X as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_X",
    usesGroupAsset: true,
    groupAssetDefaults: { flatW: 0, cornerW: 0, innerW: 0, isFrise: false },
  },
};