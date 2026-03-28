# Worker Communication

> File: `web/js/worker/messageHandler.ts`

## Purpose

Abstraction layer for bidirectional `postMessage` communication between Main Thread and Game Worker.

## MessageHandler Class

```ts
class MessageHandler {
  private worker: Worker | typeof self
  private handlers: Map<string, (data: any) => void>
}
```

### Constructor

Accepts either a `Worker` (main thread side) or `self` (worker side) reference.

### Key Methods

| Method | Purpose |
|--------|---------|
| `send(data)` | Post a message to the other thread |
| `sendDataSync(data, transferables)` | Post with transferable objects (e.g., OffscreenCanvas) |
| `append(handlers)` | Register multiple `[action, handler]` pairs |

## Message Format

All messages follow this structure:

```ts
{
  action: string,    // Handler identifier
  ...payload         // Action-specific data
}
```

## Common Actions

### Main → Worker
| Action | Payload | Purpose |
|--------|---------|---------|
| `initWorker` | — | Initialize game systems |
| `setCanvasMap` | `{ canvas }` | Transfer offscreen canvas |
| `initCanvasMap` | `{ mapConf }` | Configure rendering |
| `startRender` | — | Start render loop |
| `stopRender` | — | Pause render loop |
| `setCenter` | `{ x, y }` | Set camera position |
| `updatePlayerMovement` | `{ playerMovement }` | Movement input |
| `gridClick` | `{ x, y }` | Generate city at position |
| `gridClick_Building` | `{ x, y, ... }` | Place building |
| `query_infoCell` | `{ x, y }` | Query tile info |

### Worker → Main
| Action | Payload | Purpose |
|--------|---------|---------|
| `callback_initWorker` | — | Worker ready signal |
| `callback_initCanvasMap` | `{ mapConf, mapLvlBuffer, mapInfoBuffer }` | Canvas ready with shared buffers |
| `FPS` | `{ fps }` | Frame rate update |
| `infoCell` | `{ data }` | Tile information response |