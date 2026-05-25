
import { ExtractAction, TBaseMessage, THandlerAction, THandlerContext } from "@iso-game/etc/handlers/types/type.ts";



// ────────────────────────────────────────────
// CONTEXT
// ────────────────────────────────────────────
export type TScreenHandlerContext = THandlerContext & {
  worker: Worker;
  tag: "screen";
};



// ────────────────────────────────────────────
// HELPER
// ────────────────────────────────────────────

// ────────────────────────────────────────────
// type of handler function for game messages in game worker context
export type TScreenHandlerAction<TMsg extends TBaseMessage<string>> = THandlerAction<TMsg, TScreenHandlerContext>;

// ────────────────────────────────────────────
// helper to create game handler in the context of the game worker.
export function screenAction<TMsg extends TBaseMessage<string>>(
  action: ExtractAction<TMsg>,
  handler: TScreenHandlerAction<TMsg>
): TScreenHandlerAction<TMsg> & { _action: typeof action } {
  return Object.assign(handler, { _action: action });
}
