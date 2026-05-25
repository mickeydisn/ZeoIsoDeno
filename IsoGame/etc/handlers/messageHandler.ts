import { IncomingMessages, IndexedHandlers } from "./types/handlerCmd.ts";
import { TBaseMessage, THandlerContext } from "./types/type.ts";


// ----

export class HandelersMap<TAction> extends Map<string, TAction> {
  append(handler: [string, TAction][]) {
    handler.forEach(([k, f]) => {
      this.set(k, f);
    });
  }
}

export class MessageHandler<
  TCtx extends THandlerContext,
  TIndexHander extends IndexedHandlers<TCtx>,
  TOut extends TBaseMessage<string>,
  TIncoming extends IncomingMessages<TIndexHander> = IncomingMessages<TIndexHander>,
> {

  worker: TCtx["worker"];
  pendingResponses: Map<string, (response: any) => void> = new Map();
  ctx: TCtx;

  constructor(
    _ctx: Omit<TCtx, "handler">, //  | Window & typeof globalThis,
    private readonly handlers: TIndexHander,
  ) { //  | Window & typeof globalThis) {
    this.worker = _ctx.worker;
    this.ctx = { ..._ctx, handler: this } as unknown as TCtx;

    this.worker.onmessage = (event: { data: TIncoming; }) => {
      this.handleIncoming(event.data);
      // const action: string = event.data.action;
      // this.handlers.get(action)?.(event.data);
    };
    // Generic handler for worker messages
  }

  sendDataSync(
    payload: TOut,
    data: Transferable[],
    pingId = crypto.randomUUID(),
  ) {
    const message = { ...payload, pingId };
    (this.worker as Worker).postMessage(message, data);
    return pingId;
  }

  send(payload: TOut, pingId = crypto.randomUUID()) {
    const message = { ...payload, pingId };
    this.worker.postMessage(message);
    return pingId;
  }

  sendMessageWithResponse(payload: TOut) {
    return new Promise((resolve) => {
      const id = this.send(payload);
      this.pendingResponses.set(id, resolve);
    });
  }

  public async handleIncoming(message: TIncoming) {
    const { action, pingId } = message;
    // Handle response
    if (pingId && this.pendingResponses.has(pingId)) {
      this.pendingResponses.get(pingId)?.(message);
      this.pendingResponses.delete(pingId);
      return true;
    }

    // console.log(this.handlers, action);
    // Handle request
    const handler = this.handlers[action];
    if (handler) {
      const result = await handler(message, this.ctx);
      if (pingId && result) {
        this.worker.postMessage({ type: "response", pingId, result: result });
        return true
      }
    } else {
      console.warn(`[MessageHandler] No handler for type "${JSON.stringify(message)}"`);
      return false
    }
  }

}

// Message dispatcher (optional: with response promises)
