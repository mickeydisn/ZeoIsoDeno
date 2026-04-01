# Building Configuration Editor Reference

## Overview

A standalone web application (`web/indexBuildConfig.html`) for creating, editing, and managing building configurations. The editor allows users to visually configure buildings and save/load configurations as JSON.

## Architecture

### File Structure
```
web/
  indexBuildConfig.html          # Main editor page
  js/
    buildConfig/
      main.ts                    # Editor entry point
      editorState.ts             # Editor state management
      assetManager.ts            # Asset collection management
      buildingManager.ts         # Building config management
      jsonManager.ts             # JSON import/export
      ui/
        assetPanel.ts            # Asset collection UI
        buildingPanel.ts         # Building config UI
        tileEditor.ts            # Individual tile editor
        faceLinkEditor.ts        # Face link configuration
        previewRenderer.ts       # Visual preview
      components/
        faceSelector.ts          # Face key selector component
        assetSelector.ts         # Asset picker component
        colorPicker.ts           # Color/filter picker
        weightSlider.ts          # Weight input component
```

### Technology Stack
- **HTML/CSS**: W3.CSS framework (consistent with existing UI)
- **TypeScript**: Bundled via esbuild (existing server pattern)
- **Canvas**: For visual preview of tile configurations
- **LocalStorage/JSON**: For saving/loading configurations

## Core Features

### 1. Asset Collection Management

**UI Components:**
- Asset collection list (sidebar)
- Asset collection editor (main panel)
- Tile configuration list within each asset
- Individual tile editor

**Operations:**
- Create new asset collection
- Edit existing asset collection (from code or JSON)
- Delete asset collection
- Duplicate asset collection
- Export asset collection to JSON
- Import asset collection from JSON

**Asset Collection Properties:**
```
Name: [text input]
Tag: [text input] (e.g., "WH_")
Wall Suffix: [color picker + text] (e.g., "#H210_C115_S35_B120")
Roof Suffix: [color picker + text]
Tiles: [list of tile configs]
```

**Tile Editor:**
```
Face: [face selector x4] (NW, NE, SE, SW)
Weight: [number input]
Assets: [list of asset configs]
  - Key: [dropdown of available assets]
  - KeyR: [0-3 rotation selector]
  - Suffix: [color picker]
  - Height: [number input]
  - Offset X/Y: [number inputs]
Allow Move: [checkbox]
Is Frise: [checkbox]
Empty: [checkbox]
Color: [color picker]
Functions: [list of function configs]
  - Function: [dropdown]
  - Size: [number input]
```

### 2. Building Configuration Management

**UI Components:**
- Building config list (sidebar)
- Building config editor (main panel)
- Asset collection references
- Face link weight editor
- Face link connection editor
- Start tiles editor
- Tile list editor

**Operations:**
- Create new building config
- Edit existing building config (from code or JSON)
- Delete building config
- Duplicate building config
- Export building config to JSON
- Import building config from JSON
- Generate preview (run building generation)

**Building Config Properties:**
```
Name: [text input]
Grow Loop Count: [number input]
End Loop Max: [number input]
Main Level: [number input (optional)]

Asset Collections: [list of referenced assets]
  - Select from available asset collections
  - Configure constructor parameters (suffix, tag, etc.)

Face Link Weights: [key-value editor]
  - Face Key: [text input]
  - Weight: [number input]

Face Links: [connection editor]
  - From Face: [face key selector]
  - To Face: [face key selector]

Start Tiles: [tile list editor]
Tiles: [tile list editor]
```

### 3. Face Key Selector

A component for selecting face keys with:
- Dropdown of all defined face keys in the config
- Option for `null` (empty face)
- Text input for custom face keys
- Visual indicator of face key type (color-coded)

### 4. Asset Selector

A component for selecting visual assets:
- Dropdown of available asset keys from the game
- Preview of selected asset (if available)
- Rotation selector (0-3)
- Suffix/color picker

### 5. Color Picker

For configuring asset suffix colors:
- Hue slider (0-360)
- Saturation slider
- Contrast slider
- Brightness slider
- Text input for direct suffix editing
- Preview swatch

### 6. Visual Preview

A canvas-based preview showing:
- Grid of tiles with their face configurations
- Color-coded face keys
- Asset visualization (if assets are loaded)
- Connection lines between tiles
- Weight indicators

**Preview Modes:**
- **Tile View**: Show individual tile configurations
- **Generation Preview**: Run building generation algorithm
- **Face Link Graph**: Visualize face connections

## JSON Schema

### Building Configuration JSON
```json
{
  "version": "1.0",
  "type": "buildingConfig",
  "name": "HouseA",
  "description": "A simple house building",
  "config": {
    "growLoopCount": 10,
    "endLoopMax": 2000,
    "mainLvl": null
  },
  "assetCollections": [
    {
      "ref": "WallHouse",
      "params": {
        "wallSuffix": "#H210_C115_S35_B120",
        "roofSuffix": "#H0_S1_C128_B64"
      }
    }
  ],
  "faceLinkWeight": {
    "X": 0,
    "F_out": 0,
    "F_in": 5,
    "WH_out": 1,
    "WH_in": 30
  },
  "faceLinks": [
    ["X", "F_out"],
    ["F_in", "FP_out"],
    ["WH_l", "WH_r"]
  ],
  "startTiles": [
    {
      "face": ["E#Open", "E#Open", "E#Door", "E#Open"],
      "weight": 0,
      "allowMove": true,
      "isFrise": false,
      "empty": true,
      "color": [12, 12, 16]
    }
  ],
  "tiles": [
    {
      "face": ["WH_r", "WH_in", "WH_l", "WH_out"],
      "weight": 30,
      "assets": [
        { "key": "roof", "keyR": 3, "sufix": "#H200_S20", "h": 1 },
        { "key": "wall", "keyR": 1, "sufix": "#H200_S20", "h": 0 }
      ],
      "allowMove": true,
      "isFrise": true,
      "color": [196, 196, 196],
      "functions": [{ "func": "lvlAvgSquare", "size": 5 }]
    }
  ]
}
```

### Asset Collection JSON
```json
{
  "version": "1.0",
  "type": "assetCollection",
  "name": "WallHouse",
  "description": "House wall and roof tiles",
  "tag": "WH_",
  "defaults": {
    "wallSuffix": "#H210_C115_S35_B120",
    "roofSuffix": "#H0_S1_C128_B64"
  },
  "tiles": [
    {
      "name": "Corner",
      "face": ["WH_r", "WH_l", "WH_out", "WH_out"],
      "weight": 0,
      "assets": [
        { "key": "roofCorner", "keyR": 3, "sufix": "{roofSuffix}", "h": 1 },
        { "key": "wallCorner", "keyR": 2, "sufix": "{wallSuffix}", "h": 0 }
      ]
    }
  ]
}
```

## UI Layout

```
+--------------------------------------------------+
|  Building Config Editor                    [Menu]|
+--------------------------------------------------+
| Sidebar          | Main Panel                     |
|                  |                                |
| [Assets]         | Tab: [Asset] [Building] [JSON] |
| - WallHouse      |                                |
| - FenceSimple    |  Name: [___________]           |
| - CorridorLab    |  Tag:  [___________]           |
|                  |                                |
| [Buildings]      |  Tiles:                        |
| - HouseA         |  +---------------------------+ |
| - GraveA         |  | Corner      | Face: ...   | |
| - ManorA         |  | Wall        | Weight: 10  | |
|                  |  | Wall_Door   | Assets: ... | |
| [+ New]          |  +---------------------------+ |
|                  |                                |
|                  |  [+ Add Tile]                  |
|                  |                                |
|                  |  Preview:                      |
|                  |  +---------------------------+ |
|                  |  |                           | |
|                  |  |      [Canvas Preview]     | |
|                  |  |                           | |
|                  |  +---------------------------+ |
|                  |                                |
|                  |  [Save JSON] [Load JSON]       |
+--------------------------------------------------+
```

## Editor State Management

```typescript
interface EditorState {
  mode: 'asset' | 'building';
  
  // Asset mode
  currentAsset: AssetCollectionConfig | null;
  assets: AssetCollectionConfig[];
  
  // Building mode
  currentBuilding: BuildingConfig | null;
  buildings: BuildingConfig[];
  
  // UI state
  selectedTileIndex: number;
  previewMode: 'tile' | 'generation' | 'graph';
}

interface AssetCollectionConfig {
  name: string;
  tag: string;
  defaults: Record<string, string>;
  tiles: TileConfig[];
}

interface BuildingConfig {
  name: string;
  config: {
    growLoopCount: number;
    endLoopMax: number;
    mainLvl: number | null;
  };
  assetCollections: AssetReference[];
  faceLinkWeight: Record<string, number>;
  faceLinks: [string, string][];
  startTiles: TileConfig[];
  tiles: TileConfig[];
}

interface TileConfig {
  name?: string;
  face: (string | null)[];
  weight: number;
  assets: AssetConfig[];
  functions: FunctionConfig[];
  allowMove: boolean;
  isFrise: boolean;
  empty: boolean;
  color: [number, number, number];
}

interface AssetConfig {
  key: string;
  keyR: number;
  sufix: string;
  h: number;
  off?: { x: number; y: number };
}
```

## Integration with Existing Code

### Loading Existing Configurations
The editor should be able to:
1. Import existing TypeScript configs by parsing the class structure
2. Load saved JSON configurations
3. Convert between formats

### Saving Configurations
The editor should be able to:
1. Export to JSON format
2. Generate TypeScript class code (optional)
3. Save to LocalStorage for persistence

### Preview Generation
The editor can use the existing `WcBuildFactoryGenarator` to:
1. Create a mock `World` instance
2. Instantiate the configuration
3. Run the generation algorithm
4. Render the result on canvas

## Workflow

1. **Open Editor**: Navigate to `http://localhost:8081/web/indexBuildConfig.html`
2. **Select Mode**: Choose "Asset Collection" or "Building Config"
3. **Load or Create**: Load existing config or create new
4. **Edit**: Use the UI to modify properties
5. **Preview**: Visualize the configuration
6. **Save**: Export to JSON or save to LocalStorage
7. **Integrate**: Copy JSON to project or use in code

## Implementation Phases

### Phase 1: Core Structure
- HTML page with W3.CSS layout
- Basic state management
- JSON import/export

### Phase 2: Asset Editor
- Asset collection CRUD
- Tile editor
- Face selector component

### Phase 3: Building Editor
- Building config CRUD
- Face link editor
- Weight editor

### Phase 4: Preview
- Canvas preview renderer
- Face connection visualization
- Generation preview

### Phase 5: Integration
- Load from existing TypeScript configs
- Generate TypeScript output
- LocalStorage persistence