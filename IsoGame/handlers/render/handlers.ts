import { initRenderHandlers } from "@iso-game/handlers/render/handler/initHandlers.ts";
import { stateHandlers } from "@iso-game/handlers/render/handler/statesHandlers.ts";
import { moveHandlers } from "@iso-game/handlers/render/handler/moveHandlers.ts";

// ──────────────────────
//

export const renderHandlers = [
  ...initRenderHandlers,
  ...stateHandlers,
  ...moveHandlers,
] as const;
