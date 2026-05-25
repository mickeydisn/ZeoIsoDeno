// ────────────────────────────────────────────
// ────────────────────────────────────────────

import { ExtractAction, TBaseMessage, THandlerAction, THandlerContext } from "../../etc/handlers/types/type.ts";
import { World } from "@iso-game/word.ts";
import { GameWorker } from "@iso-web/js/gameWorker.ts";


// ────────────────────────────────────────────
// CONTEXT
// ────────────────────────────────────────────
export type TGameHandlerContext = THandlerContext & {
  worker: Window & typeof globalThis;
  gameloop: GameWorker;
  world: World;
  tag: "game";
};


// ────────────────────────────────────────────
// HELPER
// ────────────────────────────────────────────

// ────────────────────────────────────────────
// type of handler function for game messages in game worker context
export type TGameHandlerAction<TMsg extends TBaseMessage<string>> = THandlerAction<TMsg, TGameHandlerContext>;

// ────────────────────────────────────────────
// helper to create game handler in the context of the game worker.
export function gameAction<TMsg extends TBaseMessage<string>>(
  action: ExtractAction<TMsg>,
  handler: TGameHandlerAction<TMsg>
): TGameHandlerAction<TMsg> & { _action: typeof action } {
  return Object.assign(handler, { _action: action });
}

