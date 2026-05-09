import { initHandlers } from "@iso-web/js/handlers/game/initHandlers.ts";
import { renderHandlers } from "@iso-web/js/handlers/game/renderHandlers.ts";
import { interactionHandlers } from "@iso-web/js/handlers/game/interactionHandlers.ts";
import { toolHandlers } from "@iso-web/js/handlers/game/toolHandlers.ts";
import { queryHandlers } from "@iso-web/js/handlers/game/queryHandlers.ts";
import { buildHandlerIndexes, buildHandlerRegistry, buildMsgMap, IncomingMessages, IndexedHandlers } from "../../../../../IsoGame/etc/handlers/types/handlerCmd.ts";
import { MessageHandler } from "../../../../../IsoGame/etc/handlers/messageHandler.ts";
import { TGameHandlerContext, TScreenHandlerContext } from "./contexts.ts";
import { initScreenHandler } from "@iso-web/js/handlers/screen/mainMessage.ts";

// ────────────────────────────────────────────


export const AllGameHandlers = [
    ...initHandlers,
    ...renderHandlers,
    ...interactionHandlers,
    ...toolHandlers,
    ...queryHandlers,
] as const;

// ────────────────────────────────────────────


export const AllScreenHandlers = [
    ...initScreenHandler,
] as const;


// ────────────────────────────────────────────
// ────────────────────────────────────────────

export type TAnyGameHandlers = typeof AllGameHandlers[number];
export type TAnyScreenHandlers = typeof AllScreenHandlers[number];

// ────────────────────────────────────────────
// GAME HANDLERS
// ────────────────────────────────────────────

export const indexGameHandler = buildHandlerIndexes<TGameHandlerContext, typeof AllGameHandlers>(AllGameHandlers);

const GAME_HANDLER_REGISTRY = buildHandlerRegistry(AllGameHandlers);
export const msgToWorker = buildMsgMap(GAME_HANDLER_REGISTRY);

export type TGameHandlerIndex = IndexedHandlers<TGameHandlerContext, typeof AllGameHandlers>;
export type TGameIncomingMessages = IncomingMessages<TGameHandlerIndex>;

export class GameMessageHandler extends MessageHandler<
    TGameHandlerContext, 
    TGameHandlerIndex, 
    TGameIncomingMessages | TScreenIncomingMessages
> {}

// ────────────────────────────────────────────
// SCREEN HANDLERS
// ────────────────────────────────────────────

export const indexScreenHandler = buildHandlerIndexes<TScreenHandlerContext, typeof AllScreenHandlers>(AllScreenHandlers);

const SCREEN_HANDLER_REGISTRY = buildHandlerRegistry(AllScreenHandlers);
export const msgToScreen = buildMsgMap(SCREEN_HANDLER_REGISTRY);

export type TScreenHandlerIndex = IndexedHandlers<TScreenHandlerContext, typeof AllScreenHandlers>;
export type TScreenIncomingMessages = IncomingMessages<TScreenHandlerIndex>;

export class ScreenMessageHandler extends MessageHandler<
    TScreenHandlerContext, 
    TScreenHandlerIndex,
    TGameIncomingMessages | TScreenIncomingMessages
> {}   