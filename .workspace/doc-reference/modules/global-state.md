# Global State Management

> File: `web/js/gobalState.ts`

## Purpose

Centralizes application configuration and DOM state synchronization for the map visualization UI.

## GlobalStateClass (Singleton)

```ts
class GlobalStateClass {
  mode: "MiniMap" | "Map"
  x: number    // Current grid X coordinate
  y: number    // Current grid Y coordinate
  miniMap: {
    definition: number
    zoom: number
    ShowB: boolean  // Biomes
    ShowL: boolean  // Levels
    ShowLB: boolean // Labels
    ShowT: boolean  // Temperature
    ShowH: boolean  // Hydrometry
  }
  map: {
    definition: number
    tileScaleMod: number
  }
}
```

## Key Functions

### `initMenu()`
Generates the left-side HTML form with:
- X/Y coordinate inputs
- Mode radio buttons (MiniMap / Map)
- Definition and zoom dropdowns
- Visibility toggles for biome, level, temperature, hydrometry layers

### `getGlobalJSON()`
Reads all form input values and returns a state snapshot object.

### `updatGlobalJSON(json)`
Pushes state values back into DOM form elements. Used to restore or synchronize UI state.

### `updateXY(x, y)`
Updates the X and Y input fields in the DOM.

## DOM Integration

| Element ID | Purpose |
|------------|---------|
| `#xInput` | X coordinate input |
| `#yInput` | Y coordinate input |
| `#miniMap-definition` | Mini map resolution |
| `#miniMap-zoom` | Mini map zoom level |
| `#paramsMiniMap` | Mini map params panel |
| `#paramsMap` | Map params panel |

Mode switching toggles visibility between `#paramsMiniMap` and `#paramsMap` panels.