# Keyboard Input

> File: `web/js/keyboad.ts`

## Purpose

Captures keyboard events and sends player movement updates to the Game Worker.

## Key Constants

```ts
const playerMovement = {
  up: false,
  down: false,
  left: false,
  right: false,
}
```

## Initialization

`initKeyBoard(gameWorker)` attaches `keydown` and `keyup` listeners to `document`.

## Key Mappings

| Key | Direction |
|-----|-----------|
| `w` / `ArrowUp` | up |
| `s` / `ArrowDown` | down |
| `a` / `ArrowLeft` | left |
| `d` / `ArrowRight` | right |

### Behavior

- **keydown**: Sets the corresponding direction to `true`, then sends `updatePlayerMovement` to worker
- **keyup**: Sets the corresponding direction to `false`, then sends `updatePlayerMovement` to worker

## Worker Message

```ts
gameWorker.postMessage({
  action: "updatePlayerMovement",
  playerMovement: { up, down, left, right }
})
```

The Game Worker uses this to calculate position deltas and move the camera each frame.