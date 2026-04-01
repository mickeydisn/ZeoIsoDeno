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
- [ ] Create basic HTML5 boilerplate with proper charset and viewport
- [ ] Add `<title>Building Config Editor</title>`
- [ ] Load CSS: `<link rel="stylesheet" href="css/editor.css">`
- [ ] Create main layout container: `<div class="editor-layout">`
  - Left sidebar: `<div id="library-panel" class="sidebar"></div>`
  - Main content: `<div id="main-panel" class="main-content"></div>`
  - Modal overlay: `<div id="modal-overlay" class="modal-overlay hidden"></div>`
- [ ] Create header bar: `<header class="header"><h1>Building Config Editor</h1></header>`
- [ ] Create loading indicator: `<div id="loading" class="loading hidden">Loading...</div>`
- [ ] Create error display area: `<div id="error-banner" class="error-banner hidden"></div>`
- [ ] Load JS modules via `<script type="module">` tags
- [ ] Add `state.ts` as first script, then `api.ts`, then panel scripts

### Styling
- [ ] Define CSS reset and base styles in `web/css/editor.css`
- [ ] Dark theme base: background `#1e1e2e`, foreground `#e0e0e0`
- [ ] Sidebar width: 280px, fixed left
- [ ] Main content: `flex: 1`, scrollable
- [ ] Header height: 48px, with subtle border-bottom
- [ ] Loading spinner: CSS animation, centered
- [ ] Error banner: red background `#f44336`, white text
- [ ] Modal overlay: semi-transparent backdrop, centered content box

---

## File: `web/js/state.ts` — Centralized State Management

### State Interface
- [ ] Define `EditorState` interface:
  ```typescript
  interface EditorState {
    configs: {
      buildings: BuildingConfig[];
      assetCollections: AssetCollectionConfig[];
    };
    activeConfig: {
      type: "building" | "assetCollection" | null;
      id: string | null;
      data: BuildingConfig | AssetCollectionConfig | null;
      isDirty: boolean;
    };
    ui: {
      editingTile: TileConfig | null;
      showTileEditor: boolean;
      showAssetCollectionEditor: boolean;
      libraryFilter: string;
      tsClasses: { buildings: string[]; assetCollections: string[] } | null;
    };
    loading: boolean;
    error: string | null;
  }
  ```

### StateManager Class
- [ ] Implement `class StateManager` with private `state: EditorState`
- [ ] Implement `subscribe(listener: () => void): () => void` (pub/sub pattern)
- [ ] Implement `private notify()` to call all listeners
- [ ] Implement `getState(): EditorState` (returns copy to prevent mutation)
- [ ] Implement `setState(partial: Partial<EditorState>)` for batch updates
- [ ] Implement `setActiveConfig(type, id, data)` — marks `isDirty = false`
- [ ] Implement `markDirty()` — sets `activeConfig.isDirty = true`
- [ ] Implement `setLoading(bool)` and `setError(message | null)`
- [ ] Implement `setTSClasses(data)` — stores available TS classes
- [ ] Implement `setFilter(filterString)` — updates `libraryFilter`
- [ ] Implement `getConfig(type, id)` — retrieves config from collections
- [ ] Implement `addConfig(config)` — adds to `configs.buildings` or `configs.assetCollections`
- [ ] Implement `updateConfig(type, id, data)` — replaces config and marks dirty

---

## File: `web/js/api.ts` — API Client

### Typed Response Interfaces
- [ ] Define `ListClassesResponse`: `{ buildings: string[]; assetCollections: string[] }`
- [ ] Define `ListConfigsResponse`: `{ tsBuildings: string[]; tsAssetCollections: string[]; jsonBuildings: string[]; jsonAssetCollections: string[] }`
- [ ] Define `ExtractResponse`: `BuildingConfig | AssetCollectionConfig`
- [ ] Define `SaveResponse`: `{ success: boolean; path: string; error?: string }`
- [ ] Define `PreviewResponse`: `{ success: boolean; tiles: any[]; iterations: number; stats: any; error?: string }`
- [ ] Define `AssetListResponse`: `{ assets: { key: string; category: string; filename: string }[] }`

### API Client Class
- [ ] Implement `class ApiClient` with `private baseUrl = "/editor"`
- [ ] Implement private `async request<T>(path, options?)` method with:
  - JSON content-type headers
  - Error handling (non-2xx → throw with response body)
  - Return typed JSON response
- [ ] Implement `async listClasses(): Promise<ListClassesResponse>` → GET /editor/list/classes
- [ ] Implement `async listConfigs(): Promise<ListConfigsResponse>` → GET /editor/list
- [ ] Implement `async extractBuilding(className): Promise<ExtractResponse>` → POST /editor/extract/building/:className
- [ ] Implement `async extractAssetCollection(className): Promise<ExtractResponse>` → POST /editor/extract/asset-collection/:className
- [ ] Implement `async saveBuilding(name, config): Promise<SaveResponse>` → POST /editor/save/building/:name
- [ ] Implement `async saveAssetCollection(name, config): Promise<SaveResponse>` → POST /editor/save/asset-collection/:name
- [ ] Implement `async previewGenerate(config): Promise<PreviewResponse>` → POST /editor/preview/generate
- [ ] Implement `async listAssets(): Promise<AssetListResponse>` → GET /editor/assets/list
- [ ] Implement `async getAssetPreviewUrl(key): string` → returns URL string (not fetch)
- [ ] All error messages should be user-friendly (e.g., "Failed to extract: class WcBuildConf_X not found")

---

## File: `web/js/panels/library.ts` — Library Sidebar Panel

### Panel Structure
- [ ] Create `class LibraryPanel` with `constructor(stateManager, apiClient)`
- [ ] Implement `render(container: HTMLElement)` method
  - Create search input: `<input type="text" id="library-filter" placeholder="🔍 Filter...">`
  - Create section: "Buildings (TS)" with extractable classes
  - Create section: "Buildings (JSON)" with saved JSON configs
  - Create section: "Asset Collections (TS)"
  - Create section: "Asset Collections (JSON)"
  - Create action buttons at bottom: "Extract All", "Save All"
- [ ] Implement `private subscribe()` — re-renders on state changes
- [ ] Implement `private handleFilterChange(event)` — updates state filter
- [ ] Implement `private handleItemClick(type, id)` — loads config into activeConfig

### Config Item Rendering
- [ ] Each item shows: icon (🏗️ building / 📦 collection), name, status badge
- [ ] Status badge: "TS" (extractable) or "JSON" (saved) or "DIRTY" (unsaved edits)
- [ ] Color coding: green = JSON exists, grey = TS only, yellow = dirty
- [ ] Click handler: calls `stateManager.setActiveConfig()`
- [ ] Filter: items hidden if name doesn't match `libraryFilter` (case-insensitive)

### Action Buttons
- [ ] "Extract All" button: iterates all TS classes, extracts each, adds to configs state
- [ ] "Save All" button: iterates all dirty configs, saves each via API
- [ ] "Export All" button: downloads all JSON configs as a zip (optional / P2)
- [ ] Show loading indicator during bulk operations
- [ ] Show error toast if operations fail

### Integration
- [ ] Panel subscribes to state via `stateManager.subscribe()`
- [ ] On mount, calls `apiClient.listClasses()` and `stateManager.setTSClasses()`
- [ ] On mount, calls `apiClient.listConfigs()` and populates existing JSON configs
- [ ] Panel renders itself at initial mount

---

## Integration & Testing

- [ ] Open editor at `http://localhost:8081/editor/web/index.html` — page loads without errors
- [ ] Library sidebar renders with 4 sections (Buildings TS, Buildings JSON, Asset Collections TS, Asset Collections JSON)
- [ ] Search filter filters items by name (case-insensitive)
- [ ] Clicking an item in library loads it and shows in main panel (even if main panel is empty — confirms state change)
- [ ] Extract All button successfully extracts all 6 building classes
- [ ] Error banner displays if API call fails
- [ ] Loading indicator appears during data fetch

---

**Deliverables:**
1. `IsoGame/wcBuilding2/editor/web/index.html` — Editor entry point
2. `IsoGame/wcBuilding2/editor/web/css/editor.css` — All styles
3. `IsoGame/wcBuilding2/editor/web/js/state.ts` — State management
4. `IsoGame/wcBuilding2/editor/web/js/api.ts` — API client
5. `IsoGame/wcBuilding2/editor/web/js/panels/library.ts` — Library panel