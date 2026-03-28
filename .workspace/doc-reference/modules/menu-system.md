# Menu System

> Files: `web/js/menu/flyMenu.ts`, `web/js/menu/InfoMenu.ts`

## Purpose

Provides UI panels for map navigation, building controls, and tile information display.

## Fly Menu (`flyMenu.ts`)

### `initFlyMenu(gameWorker)`

Builds the right-side fly-out menu with action buttons:

| Button | Action Sent | Purpose |
|--------|-------------|---------|
| City | `gridClick` | Generate a city at current position |
| Building | `gridClick_Building` | Place a building structure |
| Test Init | `init_test` | Flatten terrain in area |
| Query Cell | `query_infoCell` | Get tile info at position |

Each button sends a message to the Game Worker with the current coordinates from `GlobalState`.

### Configuration Inputs

The fly menu also provides input fields for building parameters:
- `growLoopCount` — Number of growth iterations
- `endLoopMax` — Maximum end loop value

## Info Menu (`InfoMenu.ts`)

### `infoMenu(gameWorker)`

Creates the info panel that displays tile data.

### `updateInfoCell(data)`

Receives tile information from the worker and renders it in the info panel. Displays:

- **Coordinates**: Tile X, Y position
- **Biome**: Terrain type (ocean, beach, grassland, forest, etc.)
- **Elevation**: Height level
- **Temperature**: Climate value
- **Hydrometry**: Moisture value
- **Items**: Objects present on tile
- **Building**: Active building data if any

## DOM Elements

| Element ID | Purpose |
|------------|---------|
| `#mapflyMenu` | Fly menu container |
| `#infoMenu` | Info panel container |