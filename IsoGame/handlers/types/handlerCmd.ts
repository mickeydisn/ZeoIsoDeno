// deno-lint-ignore-file no-explicit-any
/**
 *
 */

import { ExtractAction, THandlerAction, THandlerContext } from "./type.ts";


// ─── Helper types ───────────────────────────────────────────────────────────

/** Extract the TMsg type from a handler function */
type ExtractMsg<T> =
  T extends THandlerAction<infer TMsg, any> ? TMsg : never;

/** Extract the action string from a handler function */
type ExtractActionFromHandler<T> =
  T extends THandlerAction<infer TMsg, any> ? ExtractAction<TMsg> : never;

// ─── Handler Config ──────────────────────────────────────────────────────────

export type THandlerConfig<THandler extends THandlerAction<any, any> = THandlerAction<any, any>> = {
  action: ExtractActionFromHandler<THandler>;
  handler: THandler;
};

// ─── Types ───────────────────────────────────────────────────────────────────

type HandlerRegistryEntry<THandler extends THandlerAction<any, any>> = {
  key: ExtractActionFromHandler<THandler>;
  handler: THandler;
};

type HandlerMsgMap<THandlers extends readonly THandlerAction<any, any>[]> = {
  [H in THandlers[number] as ExtractActionFromHandler<H>]:
    (data: Omit<ExtractMsg<H>, "action">) => ExtractMsg<H>;
};

type HandlerRegistry<THandlers extends readonly THandlerAction<any, any>[]> =
  { [I in keyof THandlers]: HandlerRegistryEntry<THandlers[I]> };


// ─── Registry ────────────────────────────────────────────────────────────────


export function buildHandlerRegistry<THandlers extends readonly THandlerAction<any, any>[]>(
  handlers: THandlers
): HandlerRegistry<THandlers> {
  return handlers.map((handler) => ({
    key: (handler as any)._action,
    handler,
  })) as HandlerRegistry<THandlers>;
}

// ─── Message factory map ──────────────────────────────────────────────────────

export function buildMsgMap<THandlers extends readonly THandlerAction<any, any>[]>(
  registry: HandlerRegistry<THandlers>
): HandlerMsgMap<THandlers> {
  const map = {} as Record<string, (data: object) => object>;

  for (const entry of registry) {
    const key = entry.key as string;
    map[key] = (data: object) => ({ ...data, action: key });
  }

  return map as unknown as HandlerMsgMap<THandlers>;
}

// ─── Generic IndexedHandlers by Ctx ──────────────────────────────────────────

export type IndexedHandlers<
  TCtx extends THandlerContext,
  THandlers extends readonly THandlerAction<any, TCtx>[] = readonly THandlerAction<any, TCtx>[]
> = {
  [H in THandlers[number] as ExtractActionFromHandler<H>]: H;
};

// ─── Factory ─────────────────────────────────────────────────────────────────

export function buildHandlerIndexes<
  TCtx extends THandlerContext,
  THandlers extends readonly THandlerAction<any, TCtx>[]
>(
  handlers: THandlers
): IndexedHandlers<TCtx, THandlers> {
  const index = {} as Record<string, THandlerAction<any, TCtx>>;

  for (const handler of handlers) {
    const action = (handler as any)._action as string;
    index[action] = handler;
  }

  return index as unknown as IndexedHandlers<TCtx, THandlers>;
}


// Union of all TMsg types from the index
export type IncomingMessages<TIndex extends IndexedHandlers<any>> = 
  ExtractMsg<TIndex[keyof TIndex]>;
