// deno-lint-ignore-file no-explicit-any
import { GameWorker } from "../../../gameWorker.ts";
import { MessageHandler } from "../messageHandler.ts";

// -------------------------------------

export type THandlerContext = {
  tag: string;
  handler: MessageHandler<any, any, any>;
  worker: any;
};

// -------------------------------------

export interface TBaseMessage<TMsgKey extends string> {
  action: TMsgKey;
  pingId?: string; // for tracking request-response pairs
}

// -------------------------------------
export type ExtractAction<T> = T extends TBaseMessage<infer A> ? A : never;

export type THandlerAction<
  TMsg extends TBaseMessage<string>,
  TCtx extends THandlerContext,
  TMsgKey extends string = ExtractAction<TMsg>,
> = (data: TMsg, _ctx: TCtx) => any;
