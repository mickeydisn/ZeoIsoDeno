import { initScreenHandler } from "@iso-game/handlers/screen/handler/initScreenHandler.ts";

// ──────────────────────
//

export const screenHandlers = [
  ...initScreenHandler,
] as const;
