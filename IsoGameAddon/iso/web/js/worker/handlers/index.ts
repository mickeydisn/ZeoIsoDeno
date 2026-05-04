import { GameWorker } from "../../gameWorker.ts";
import { createInitHandlers } from "./initHandlers.ts";
import { createRenderHandlers } from "./renderHandlers.ts";
import { createInteractionHandlers } from "./interactionHandlers.ts";
import { createToolHandlers } from "./toolHandlers.ts";
import { createQueryHandlers } from "./queryHandlers.ts";

export const getAllHandlers = (worker: GameWorker) => {
  return {
    ...createInitHandlers(worker),
    ...createRenderHandlers(worker),
    ...createInteractionHandlers(worker),
    ...createToolHandlers(worker),
    ...createQueryHandlers(worker),
  };
};
