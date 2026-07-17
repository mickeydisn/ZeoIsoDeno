import {
  buildHandlerIndexes,
  buildHandlerRegistry,
  buildMsgMap,
  IncomingMessages,
  IndexedHandlers,
} from "@iso-game/etc/handlers/types/handlerCmd.ts";
import { MessageHandler } from "@iso-game/etc/handlers/messageHandler.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";
import { TScreenHandlerContext } from "@iso-game/handlers/screen/contexts.ts";
import { TRenderHandlerContext } from "@iso-game/handlers/render/contexts.ts";
import { gameHandlers } from "@iso-game/handlers/game/handlers.ts";
import { screenHandlers } from "@iso-game/handlers/screen/handlers.ts";
import { renderHandlers } from "@iso-game/handlers/render/handlers.ts";

// ────────────────────────────────────────────

// ────────────────────────────────────────────
// ────────────────────────────────────────────

export type TAnyGameHandlers = typeof gameHandlers[number];
export type TAnyScreenHandlers = typeof screenHandlers[number];

// ────────────────────────────────────────────
// GAME HANDLERS
// ────────────────────────────────────────────

export const indexGameHandler = buildHandlerIndexes<
  TGameHandlerContext,
  typeof gameHandlers
>(gameHandlers);

const GAME_HANDLER_REGISTRY = buildHandlerRegistry(gameHandlers);
export const msgToWorker = buildMsgMap(GAME_HANDLER_REGISTRY);

export type TGameHandlerIndex = IndexedHandlers<
  TGameHandlerContext,
  typeof gameHandlers
>;
export type TGameIncomingMessages = IncomingMessages<TGameHandlerIndex>;

export class GameMessageHandler extends MessageHandler<
  TGameHandlerContext,
  TGameHandlerIndex,
  TGameIncomingMessages | TScreenIncomingMessages | TRenderIncomingMessages
> {}

// ────────────────────────────────────────────
// SCREEN HANDLERS
// ────────────────────────────────────────────

export const indexScreenHandler = buildHandlerIndexes<
  TScreenHandlerContext,
  typeof screenHandlers
>(screenHandlers);

const SCREEN_HANDLER_REGISTRY = buildHandlerRegistry(screenHandlers);
export const msgToScreen = buildMsgMap(SCREEN_HANDLER_REGISTRY);

export type TScreenHandlerIndex = IndexedHandlers<
  TScreenHandlerContext,
  typeof screenHandlers
>;
export type TScreenIncomingMessages = IncomingMessages<TScreenHandlerIndex>;

export class ScreenMessageHandler extends MessageHandler<
  TScreenHandlerContext,
  TScreenHandlerIndex,
  TGameIncomingMessages | TScreenIncomingMessages | TRenderIncomingMessages
> {}

// ────────────────────────────────────────────
// Render HANDLERS
// ────────────────────────────────────────────

export const indexRenderHandler = buildHandlerIndexes<
  TRenderHandlerContext,
  typeof renderHandlers
>(renderHandlers);

const RENDER_HANDLER_REGISTRY = buildHandlerRegistry(renderHandlers);
export const msgToRender = buildMsgMap(RENDER_HANDLER_REGISTRY);

export type TRenderHandlerIndex = IndexedHandlers<
  TRenderHandlerContext,
  typeof renderHandlers
>;
export type TRenderIncomingMessages = IncomingMessages<TRenderHandlerIndex>;

export class RenderMessageHandler extends MessageHandler<
  TRenderHandlerContext,
  TRenderHandlerIndex,
  TGameIncomingMessages | TScreenIncomingMessages | TRenderIncomingMessages
> {}
