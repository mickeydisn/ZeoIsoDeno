# TASKS-PHASE-3: Web Shell & Library Panel

**Goal:** Create the HTML entry point, CSS styles, state management, API client, and searchable library sidebar panel.

**Estimated Time:** 4-5 hours  
**Dependencies:** Phase 2 (server.ts endpoints), Phase 1 (types.ts)

---

## Context

This phase creates the foundational web UI shell. The editor UI follows a standard layout: left sidebar for browsing configs, main area for editor panels, and modal containers for tile/asset editors. State management uses a simple pub/sub pattern sufficient for the application's needs.

---

## File: `web/index.html` — Editor Entry Point

### HTML Structure
- [x] Create basic HTML5 boilerplate with proper charset and viewport
- [x] Add `<title>Building Config Editor</title>`
- [x] Load CSS: `<link rel="stylesheet" href="css/editor.css">`
- [x] Create main layout container: `<div class="editor-layout">`
  - Left sidebar: `<div id="library-panel" class="sidebar"></div>`
  - Main content: `<div id="main-panel" class="main-content"></div>`
  - Modal overlay: `<div id="modal-overlay" class="modal-overlay hidden"></div>`
- [x] Create header bar: `<header class="header"><h1>Building Config Editor</h1></header>`
- [x] Create loading indicator: `<div id="loading" class="loading hidden">Loading...</div>`
- [x] Create error display area: `<div id="error-banner" class="error-banner hidden"></div>`
- [x] Load JS modules via `<script type="module">` tags
- [x] Add `state.ts` as first script, then `api.ts`, then panel scripts

### Styling
- [x] Define CSS reset and base styles in `web/css/editor.css`
- [x] Dark theme base: background `#1e1e2e`, foreground `#e0e0e0`
- [x] Sidebar width: 280px, fixed left
- [x] Main content: `flex: 1`, scrollable
- [x] Header height: 48px, with subtle border-bottom
- [x] Loading spinner: CSS animation, centered
- [x] Error banner: red background `#f44336`, white text
- [x] Modal overlay: semi-transparent backdrop, centered content box

---

## File: `web/js/state.ts` — Centralized State Management

### State Interface
- [x] Define `EditorState` interface:
  See implementation in state.ts

### StateManager Class
- [x] Implement `class StateManager` with private `state: EditorState`
- [x] Implement `subscribe(listener: () => void): () => void` (pub/sub pattern)
- [x] Implement `private notify()` to call all listeners
- [x] Implement `getState(): EditorState` (returns copy to prevent mutation)
- [x] Implement `setState(partial: Partial<EditorState>)` for batch updates
- [x] Implement `setActiveConfig(type, id, data)` — marks `isDirty = false`
- [x] Implement `markDirty()` — sets `activeConfig.isDirty = true`
- [x] Implement `setLoading(bool)` and `setError(message | null)`
- [x] Implement `setTSClasses(data)` — stores available TS classes
- [x] Implement `setFilter(filterString)` — updates `libraryFilter`
- [x] Implement `getConfig(type, id)` — retrieves config from collections
- [x] Implement `addConfig(config)` — adds to `configs.buildings` or `configs.assetCollections`
- [x] Implement `updateConfig(type, id, data)` — replaces config and marks dirty

---

## File: `web/js/api.ts` — API Client

### Typed Response Interfaces
- [x] Define `ListClassesResponse`: `{ buildings: string[]; assetCollections: string[] }`
- [x] Define `ListConfigsResponse`: `{ tsBuildings: string[]; tsAssetCollections: string[]; jsonBuildings: string[]; jsonAssetCollections: string[] }`
- [x] Define `ExtractResponse`: `BuildingConfig | AssetCollectionConfig`
- [x] Define `SaveResponse`: `{ success: boolean; path: string; error?: string }`
- [x] Define `PreviewResponse`: `{ success: boolean; tiles: any[]; iterations: number; stats: any; error?: string }`
- [x] Define `AssetListResponse`: `{ assets: { key: string; category: string; filename: string }[] }`

### API Client Class
- [x] Implement `class ApiClient` with `private baseUrl = "/editor"`
- [x] Implement private `async request<T>(path, options?)` method with:
  - JSON content-type headers
  - Error handling (non-2xx → throw with response body)
  - Return typed JSON response
- [x] Implement `async listClasses(): Promise<ListClassesResponse>` → GET /editor/list/classes
- [x] Implement `async listConfigs(): Promise<ListConfigsResponse>` → GET /editor/list
- [x] Implement `async extractBuilding(className): Promise<ExtractResponse>` → POST /editor/extract/building/:className
- [x] Implement `async extractAssetCollection(className): Promise<ExtractResponse>` → POST /editor/extract/asset-collection/:className
- [x] Implement `async saveBuilding(name, config): Promise<SaveResponse>` → POST /editor/save/building/:name
- [x] Implement `async saveAssetCollection(name, config): Promise<SaveResponse>` → POST /editor/save/asset-collection/:name
- [x] Implement `async previewGenerate(config): Promise<PreviewResponse>` → POST /editor/preview/generate
- [x] Implement `async listAssets(): Promise<AssetListResponse>` → GET /editor/assets/list
- [x] Implement `async getAssetPreviewUrl(key): string` → returns URL string (not fetch)
- [x] All error messages should be user-friendly (e.g., "Failed to extract: class WcBuildConf_X not found")

---

## File: `web/js/panels/library.ts` — Library Sidebar Panel

### Panel Structure
- [x] Create `class LibraryPanel` with `constructor(stateManager, apiClient)`
- [x] Implement `render(container: HTMLElement)` method
  - Create search input: `<input type="text" id="library-filter" placeholder="🔍 Filter...">`
  - Create section: "Buildings (TS)" with extractable classes
  - Create section: "Buildings (JSON)" with saved JSON configs
  - Create section: "Asset Collections (TS)"
  - Create section: "Asset Collections (JSON)"
  - Create action buttons at bottom: "Extract All", "Save All"
- [x] Implement `private subscribe()` — re-renders on state changes
- [x] Implement `private handleFilterChange(event)` — updates state filter
- [x] Implement `private handleItemClick(type, id)` — loads config into activeConfig

### Config Item Rendering
- [x] Each item shows: icon (🏗️ building / 📦 collection), name, status badge
- [x] Status badge: "TS" (extractable) or "JSON" (saved) or "DIRTY" (unsaved edits)
- [x] Color coding: green = JSON exists, grey = TS only, yellow = dirty
- [x] Click handler: calls `stateManager.setActiveConfig()`
- [x] Filter: items hidden if name doesn't match `libraryFilter` (case-insensitive)

### Action Buttons
- [x] "Extract All" button: iterates all TS classes, extracts each, adds to configs state
- [x] "Save All" button: iterates all dirty configs, saves each via API
- [x] "Export All" button: downloads all JSON configs as a zip (optional / P2)
- [x] Show loading indicator during bulk operations
- [x] Show error toast if operations fail

### Integration
- [x] Panel subscribes to state via `stateManager.subscribe()`
- [x] On mount, calls `apiClient.listClasses()` and `stateManager.setTSClasses()`
- [x] On mount, calls `apiClient.listConfigs()` and populates existing JSON configs
- [x] Panel renders itself at initial mount

---

## Integration & Testing

- [x] Open editor at `http://localhost:8081/editor/index.html` — page loads without errors
- [x] Library sidebar renders with 4 sections (Buildings TS, Buildings JSON, Asset Collections TS, Asset Collections JSON)
- [x] Search filter filters items by name (case-insensitive)
- [x] Clicking an item in library loads it and shows in main panel (even if main panel is empty — confirms state change)
- [x] Extract All button successfully extracts all 6 building classes
- [x] Error banner displays if API call fails
- [x] Loading indicator appears during data fetch

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/web/index.html` — Editor entry point
2. `IsoGame/wcBuilding2/editor/web/css/editor.css` — All styles
3. `IsoGame/wcBuilding2/editor/web/js/state.ts` — State management
4. `IsoGame/wcBuilding2/editor/web/js/api.ts` — API client
5. `IsoGame/wcBuilding2/editor/web/js/panels/library.ts` — Library panel
