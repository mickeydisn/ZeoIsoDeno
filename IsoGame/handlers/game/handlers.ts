import { initHandlers } from "@iso-game/handlers/game/handler/handlers-init.ts";
import { renderHandlers } from "@iso-game/handlers/game/handler/handlers-render.ts";
import { interactionHandlers } from "@iso-game/handlers/game/handler/handlers-interaction.ts";
import { listHandlersQueryCell } from "@iso-game/handlers/game/handler-query/handlers-query.ts";
import { viewHandlers } from "@iso-game/handlers/game/handler/handlers-view.ts";
import { toolHandlers } from "@iso-game/handlers/game/handler-tools/toolHandlers.ts";
import { listHandlersQueryBuilding } from "@iso-game/handlers/game/handler-query/handlers-query-building.ts";

// ──────────────────────
//
export const gameHandlers = [
  // game
  ...initHandlers,
  ...renderHandlers,
  ...interactionHandlers,
  ...viewHandlers,
  // tools
  ...toolHandlers,
  // query handlers
  ...listHandlersQueryCell,
  ...listHandlersQueryBuilding,
] as const;
