# ZeoIsoDeno — Documentation Reference

> Isometric city-builder game with procedural terrain generation, built with Deno/TypeScript and Web Workers.

## Architecture Overview

The application uses a **dual-threaded architecture**:

- **Main Thread** (`web/js/main.ts`): UI rendering, DOM management, grid overlay, input handling
- **Game Worker** (`web/js/gameWorker.ts`): Game logic, map generation, world simulation, canvas rendering

Communication between threads uses `postMessage` via a `MessageHandler` abstraction.

## Project Structure

```
web/                    # Frontend entry point
├── indexIso.html       # HTML entry point
├── js/                 # Client-side modules
│   ├── main.ts         # Main thread initialization
│   ├── gameWorker.ts   # Web Worker for game logic
│   ├── gobalState.ts   # Global state & UI config
│   ├── keyboad.ts      # Keyboard input handler
│   ├── menu/           # Menu UI components
│   └── worker/         # Worker message handling

IsoGame/                # Core game engine
├── word.ts             # World singleton manager
├── city/               # Procedural city generation
├── map/                # Terrain & tile system
├── mapIso/             # Isometric rendering
├── wcBuilding2/        # Building generation system
├── entity/             # Entity & AI behaviors
├── menu/               # Game state & widget actions
└── utils/              # Shared utilities
```

## Documentation Index

### Frontend Layer
- [Entry Point & Main Thread](modules/entry-point.md)
- [Global State Management](modules/global-state.md)
- [Keyboard Input](modules/keyboard-input.md)
- [Worker Communication](modules/worker-communication.md)
- [Menu System](modules/menu-system.md)

### Game Engine Layer
- [World Manager](modules/world-manager.md)
- [Map & Terrain System](modules/map-terrain.md)
- [Isometric Rendering](modules/isometric-rendering.md)
- [City Generation](modules/city-generation.md)
- [Building System](modules/building-system.md)
- [Entity System](modules/entity-system.md)