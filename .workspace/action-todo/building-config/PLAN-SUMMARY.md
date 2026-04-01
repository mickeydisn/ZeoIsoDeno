# Building Configuration JSON Storage - Plan Summary

## Objective

Make the building configuration system more scalable by introducing JSON-based storage for configurations. This allows configurations to be:
1. Stored as JSON files (not just TypeScript code)
2. Loaded dynamically at runtime
3. Edited visually through a web interface
4. Saved/exported from the editor

## Current State

The building configuration system uses TypeScript classes:
- `WcAbstractBuildConf`: Base class for all building configurations
- Asset collections (`WcAsset_*`): Helper classes for generating tile configurations
- Building configs (`WcBuildConf_*`): Concrete building definitions

**Problem**: All configurations are hardcoded in TypeScript. Adding new buildings requires writing new classes.

## Solution Overview

### 1. JSON Configuration Storage

Create a JSON schema that captures all configuration properties:
- Building metadata (name, description)
- Generation parameters (growLoopCount, endLoopMax)
- Face link weights
- Face connections
- Tile configurations (start tiles + regular tiles)
- Asset collection references

### 2. Configuration Loader

Create a loader that can:
- Load configurations from JSON files
- Load configurations from TypeScript classes (backward compatibility)
- Convert between formats
- Validate configurations

### 3. Web-Based Editor

Create `web/indexBuildConfig.html` that:
- Provides a visual interface for editing configurations
- Supports both asset collections and building configs
- Offers real-time preview
- Exports to JSON format
- Imports from JSON or existing TypeScript configs

## Implementation Plan

### Phase 1: JSON Schema & Loader

**Files to create:**
- `IsoGame/wcBuilding2/configTypes.ts`: TypeScript interfaces for JSON schema
- `IsoGame/wcBuilding2/configLoader.ts`: Loader for JSON configs

**configTypes.ts:**
```typescript
interface BuildingConfigJSON {
  version: string;
  type: 'buildingConfig';
  name: string;
  description?: string;
  config: {
    growLoopCount: number;
    endLoopMax: number;
    mainLvl?: number;
  };
  assetCollections: AssetReferenceJSON[];
  faceLinkWeight: Record<string, number>;
  faceLinks: [string, string][];
  startTiles: TileConfigJSON[];
  tiles: TileConfigJSON[];
}

interface AssetCollectionJSON {
  version: string;
  type: 'assetCollection';
  name: string;
  description?: string;
  tag: string;
  defaults: Record<string, string>;
  tiles: TileConfigJSON[];
}

interface TileConfigJSON {
  name?: string;
  face: (string | null)[];
  weight: number;
  assets: AssetConfigJSON[];
  functions: FunctionConfigJSON[];
  allowMove?: boolean;
  isFrise?: boolean;
  empty?: boolean;
  color?: [number, number, number];
}

interface AssetConfigJSON {
  key: string;
  keyR: number;
  sufix: string;
  h: number;
  off?: { x: number; y: number };
}
```

**configLoader.ts:**
```typescript
class BuildingConfigLoader {
  // Load from JSON
  static fromJSON(json: BuildingConfigJSON): WcAbstractBuildConf
  
  // Load from file
  static async loadFromFile(path: string): Promise<WcAbstractBuildConf>
  
  // Convert to JSON
  static toJSON(conf: WcAbstractBuildConf): BuildingConfigJSON
  
  // Save to file
  static async saveToFile(conf: WcAbstractBuildConf, path: string): Promise<void>
  
  // Validate JSON
  static validate(json: unknown): json is BuildingConfigJSON
}
```

**Modify existing:**
- `wcAbstractBuildConf.ts`: Add `toJSON()` method
- `wcBuildAction.ts`: Add support for loading JSON configs

### Phase 2: Web Editor - Core Structure

**Files to create:**
- `web/indexBuildConfig.html`: Main editor page
- `web/js/buildConfig/main.ts`: Editor entry point
- `web/js/buildConfig/editorState.ts`: State management
- `web/js/buildConfig/jsonManager.ts`: JSON import/export

**indexBuildConfig.html:**
- W3.CSS layout (consistent with existing UI)
- Sidebar with config list
- Main panel with tabs (Asset/Building/JSON)
- Canvas preview area
- Save/Load buttons

### Phase 3: Web Editor - Asset Editor

**Files to create:**
- `web/js/buildConfig/assetManager.ts`: Asset CRUD operations
- `web/js/buildConfig/ui/assetPanel.ts`: Asset list UI
- `web/js/buildConfig/ui/tileEditor.ts`: Tile editor UI
- `web/js/buildConfig/components/faceSelector.ts`: Face key selector
- `web/js/buildConfig/components/assetSelector.ts`: Asset picker
- `web/js/buildConfig/components/colorPicker.ts`: Color picker

**Features:**
- List asset collections
- Create/edit/delete assets
- Edit tile configurations
- Select face keys with dropdown
- Pick assets with rotation
- Configure colors with HSCB sliders

### Phase 4: Web Editor - Building Editor

**Files to create:**
- `web/js/buildConfig/buildingManager.ts`: Building CRUD operations
- `web/js/buildConfig/ui/buildingPanel.ts`: Building editor UI
- `web/js/buildConfig/ui/faceLinkEditor.ts`: Face link editor
- `web/js/buildConfig/components/weightSlider.ts`: Weight input

**Features:**
- List building configs
- Create/edit/delete buildings
- Reference asset collections
- Edit face link weights
- Edit face connections
- Edit start tiles and tile list

### Phase 5: Web Editor - Preview & Integration

**Files to create:**
- `web/js/buildConfig/ui/previewRenderer.ts`: Canvas preview

**Features:**
- Render tile configurations on canvas
- Show face connections visually
- Preview generation (if possible)
- Load existing TypeScript configs
- Generate TypeScript code (optional)

## File Structure

```
IsoGame/wcBuilding2/
  configTypes.ts              # JSON schema interfaces (NEW)
  configLoader.ts             # JSON config loader (NEW)
  wcAbstractBuildConf.ts      # Add toJSON() method (MODIFY)
  wcBuildAction.ts            # Add JSON config support (MODIFY)
  conf/
    *.json                    # JSON config files (NEW)
    assetsCollection/
      *.json                  # JSON asset files (NEW)

web/
  indexBuildConfig.html       # Editor page (NEW)
  js/
    buildConfig/
      main.ts                 # Entry point (NEW)
      editorState.ts          # State management (NEW)
      jsonManager.ts          # JSON import/export (NEW)
      assetManager.ts         # Asset CRUD (NEW)
      buildingManager.ts      # Building CRUD (NEW)
      ui/
        assetPanel.ts         # Asset list UI (NEW)
        buildingPanel.ts      # Building editor UI (NEW)
        tileEditor.ts         # Tile editor UI (NEW)
        faceLinkEditor.ts     # Face link editor (NEW)
        previewRenderer.ts    # Canvas preview (NEW)
      components/
        faceSelector.ts       # Face key selector (NEW)
        assetSelector.ts      # Asset picker (NEW)
        colorPicker.ts        # Color picker (NEW)
        weightSlider.ts       # Weight input (NEW)
```

## JSON Storage Location

Configurations will be stored alongside existing TypeScript configs:
- `IsoGame/wcBuilding2/conf/buildConf_HouseA.json`
- `IsoGame/wcBuilding2/conf/assetsCollection/wcAsset_WallHouse.json`

This allows:
- Easy migration from TypeScript to JSON
- Both formats to coexist during transition
- Direct comparison of configurations

## Backward Compatibility

The system will support both formats:
1. **TypeScript classes**: Existing code continues to work
2. **JSON files**: New format for dynamic loading
3. **Loader**: Converts between formats as needed

The `indexBuildingConfigClass` in `wcBuildAction.ts` will be extended to support JSON configs:
```typescript
const indexBuildingConfigClass: Record<string, typeof WcAbstractBuildConf | BuildingConfigJSON> = {
  // Existing TypeScript classes
  "WcBuildConf_HouseA": WcBuildConf_HouseA,
  // JSON configs loaded at runtime
  "CustomHouse": customHouseJSON,
};
```

## Testing Strategy

1. **Unit tests**: Validate JSON schema and loader
2. **Integration tests**: Load JSON configs and generate buildings
3. **UI tests**: Editor functionality
4. **Migration tests**: Convert existing TypeScript configs to JSON

## Success Criteria

1. All existing building configs can be exported to JSON
2. JSON configs can be loaded and used for building generation
3. Web editor allows creating new building configs
4. Web editor allows editing existing configs
5. Configurations can be saved to JSON files
6. Both TypeScript and JSON formats coexist
7. No breaking changes to existing functionality

## Timeline Estimate

- **Phase 1**: 2-3 hours (JSON schema & loader)
- **Phase 2**: 3-4 hours (Web editor core)
- **Phase 3**: 4-5 hours (Asset editor)
- **Phase 4**: 4-5 hours (Building editor)
- **Phase 5**: 3-4 hours (Preview & integration)

**Total**: ~16-21 hours

## Next Steps

1. Review and approve this plan
2. Create JSON schema interfaces (`configTypes.ts`)
3. Implement config loader (`configLoader.ts`)
4. Add `toJSON()` to `WcAbstractBuildConf`
5. Create example JSON configs from existing buildings
6. Begin web editor implementation