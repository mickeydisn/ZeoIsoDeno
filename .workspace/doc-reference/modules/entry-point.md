# Entry Point & Main Thread

> File: `web/indexIso.html` + `web/js/main.ts`

## HTML Structure (`indexIso.html`)

The entry point defines the UI layout:

- **Side Menu**: Toggle-able panel with global JSON config editor
- **Mini Map Display**: Hidden by default, 800x800 canvas for overview
- **Main Map Display**: Primary view with 1600x800 canvas, FPS counter, and right-side menu panels
- **Grid Overlay**: CSS 3D-transformed grid (`rotateX(60deg) rotateZ(45deg)`) for isometric tile hover effects

### External Dependencies
- HTMX 1.9.5 for partial HTML updates
- W3.CSS framework for styling
- Font Awesome 4.7 for icons

## Main Thread (`main.ts`)

### Initialization Sequence

1. `initMenu()` — Build DOM form controls from `GlobalState`
2. `updatGlobalJSON()` — Sync state to UI
3. Create `GameWorker` (Web Worker)
4. `initKeyBoard()` — Attach keyboard listeners
5. `initFlyMenu()` — Build fly-out menu
6. `infoMenu()` — Build info panel

### Worker Setup

```ts
const gameWorker = new Worker(
  new URL("./gameWorker.ts", import.meta.url).href,
  { type: "module" }
);
```

After worker signals `callback_initWorker`:
- Transfers canvas control to offscreen via `transferControlToOffscreen()`
- Sends `setCanvasMap` with the offscreen canvas
- Sends `initCanvasMap` with rendering config
- Sends initial `gridClick` coordinates
- Starts render loop with `startRender`

### Render Loop

```
requestAnimationFrame → updateFrame()
  → every 4 frames: gridMapDrawer.updateGrid()
```

### Visibility Handling

Pauses/resumes both main thread grid updates and worker rendering when tab visibility changes.

### Message Handlers

| Action | Handler |
|--------|---------|
| `callback_initWorker` | Transfer canvas, init map, start render |
| `callback_initCanvasMap` | Create `GridMapDrawers` with shared buffers |
| `FPS` | Update FPS display |
| `infoCell` | Update info panel with tile data |