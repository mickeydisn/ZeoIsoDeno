import { initHandlers } from "./game/handler/initHandlers.ts";
import { renderHandlers } from "./game/handler/renderHandlers.ts";
import { interactionHandlers } from "./game/handler/interactionHandlers.ts";
import { toolHandlers } from "./game/handler-tools.ts/toolHandlers.ts";
import { queryHandlers } from "./game/handler/queryHandlers.ts";
import {
  buildHandlerIndexes,
  buildHandlerRegistry,
  buildMsgMap,
  IncomingMessages,
  IndexedHandlers,
} from "../etc/handlers/types/handlerCmd.ts";
import { MessageHandler } from "../etc/handlers/messageHandler.ts";
import { TGameHandlerContext } from "./game/contexts.ts";
import { initScreenHandler } from "./screen/handler/mainMessage.ts";
import { TScreenHandlerContext } from "@iso-game/handlers/screen/contexts.ts";
import { TRenderHandlerContext } from "@iso-game/handlers/render/contexts.ts";
import { initRenderHandlers } from "./render/handler/initHandlers.ts";
import { moveHandlers } from "./render/handler/moveHandlers.ts";

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

export const AllRenderHandlers = [
  ...initRenderHandlers,
  ...moveHandlers,
] as const;

// ────────────────────────────────────────────
// ────────────────────────────────────────────

export type TAnyGameHandlers = typeof AllGameHandlers[number];
export type TAnyScreenHandlers = typeof AllScreenHandlers[number];

// ────────────────────────────────────────────
// GAME HANDLERS
// ────────────────────────────────────────────

export const indexGameHandler = buildHandlerIndexes<
  TGameHandlerContext,
  typeof AllGameHandlers
>(AllGameHandlers);

const GAME_HANDLER_REGISTRY = buildHandlerRegistry(AllGameHandlers);
export const msgToWorker = buildMsgMap(GAME_HANDLER_REGISTRY);

export type TGameHandlerIndex = IndexedHandlers<
  TGameHandlerContext,
  typeof AllGameHandlers
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
  typeof AllScreenHandlers
>(AllScreenHandlers);

const SCREEN_HANDLER_REGISTRY = buildHandlerRegistry(AllScreenHandlers);
export const msgToScreen = buildMsgMap(SCREEN_HANDLER_REGISTRY);

export type TScreenHandlerIndex = IndexedHandlers<
  TScreenHandlerContext,
  typeof AllScreenHandlers
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
  typeof AllRenderHandlers
>(AllRenderHandlers);

const RENDER_HANDLER_REGISTRY = buildHandlerRegistry(AllRenderHandlers);
export const msgToRender = buildMsgMap(RENDER_HANDLER_REGISTRY);

export type TRenderHandlerIndex = IndexedHandlers<
  TRenderHandlerContext,
  typeof AllRenderHandlers
>;
export type TRenderIncomingMessages = IncomingMessages<TRenderHandlerIndex>;

export class RenderMessageHandler extends MessageHandler<
  TRenderHandlerContext,
  TRenderHandlerIndex,
  TGameIncomingMessages | TScreenIncomingMessages | TRenderIncomingMessages
> {}
