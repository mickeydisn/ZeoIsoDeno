import { TileInfo } from "../../../IsoGame/map/object/tile.ts";

interface BaseMessage {
  action: string;
  id?: string;
}
// ----

interface EventInitWorker extends BaseMessage {
  action: "initWorker";
}
interface EventSetCanvasMap extends BaseMessage {
  action: "setCanvasMap";
  canvas: OffscreenCanvas;
}
interface EventInitCanvasMap extends BaseMessage {
  action: "initCanvasMap";
  mapConf: {
    DRAW_TILE_COUNT: number;
    SCALE_SIZE: number;
    SCALE_MOD: number;
  };
}

interface EventStartRender extends BaseMessage {
  action: "startRender" | "stopRender";
}
interface EventGridClick extends BaseMessage {
  action: "gridClick";
  x: number;
  y: number;
}
interface EventMouseClick extends BaseMessage {
  action: "mouseClick";
  x: number;
  y: number;
}
interface EventMouseScreen extends BaseMessage {
  action: "mouseMove";
  x: number;
  y: number;
}

// ----

export interface EventMainInit extends BaseMessage {
  action: "callback_initWorker";
}

export interface EventCallbackInitCanvasMap extends BaseMessage {
  action: "callback_initCanvasMap";
  mapConf: any;
  mapLvlBuffer: SharedArrayBuffer;
  mapInfoBuffer: SharedArrayBuffer;
}

export interface EventInfoFPS extends BaseMessage {
  action: "FPS";
  fps: number;
}
export interface EventInfoCell extends BaseMessage {
  action: "infoCell";
  data: TileInfo;
}

// Tool System Messages
export interface EventSetActiveTool extends BaseMessage {
  action: "setActiveTool";
  toolId: string;
}

export interface EventSetBrushSize extends BaseMessage {
  action: "setBrushSize";
  size: number;
}

export interface EventToolClick extends BaseMessage {
  action: "toolClick";
  gridX: number;
  gridY: number;
}

export interface EventToolExecuted extends BaseMessage {
  action: "toolExecuted";
  toolId: string | null;
  success: boolean;
}

export interface EventToolList extends BaseMessage {
  action: "toolList";
  tools: Array<{
    id: string;
    name: string;
    icon: string;
    category: string;
  }>;
}

export interface EventAssetGroups extends BaseMessage {
  action: "assetGroups";
  groups: Array<{
    group: string;
    images: string[];
  }>;
}

export interface EventSetColor extends BaseMessage {
  action: "setColor";
  r: number;
  g: number;
  b: number;
}

export interface EventSetActiveAsset extends BaseMessage {
  action: "setActiveAsset";
  assetId: string;
}

export interface EventPickedColor extends BaseMessage {
  action: "pickedColor";
  r: number;
  g: number;
  b: number;
}

export interface EventAssetPreview extends BaseMessage {
  action: "assetPreview";
  blobUrl: string;
}

export interface EventBuildingConfigList extends BaseMessage {
  action: "buildingConfigList";
  configs: Array<{
    id: string;
    name: string;
    description: string;
    defaultGrowLoop: number;
    defaultEndLoop: number;
  }>;
}

export interface EventSetBuildingConfig extends BaseMessage {
  action: "setBuildingConfig";
  configId: string;
}

export interface EventSetBuildingParams extends BaseMessage {
  action: "setBuildingParams";
  growLoop: number;
  endLoop: number;
}

// ----

type ToMainMessage =
  | EventMainInit
  | EventCallbackInitCanvasMap
  | EventInfoCell
  | EventInfoFPS
  | EventToolExecuted
  | EventToolList
  | EventAssetGroups
  | EventPickedColor
  | EventAssetPreview
  | EventBuildingConfigList;

type WorkerInitMessage =
  | EventInitWorker
  | EventSetCanvasMap
  | EventInitCanvasMap
  | EventStartRender
  | EventGridClick
  | EventMouseClick  
  | EventMouseScreen;

type ToolMessage =
  | EventSetActiveTool
  | EventSetBrushSize
  | EventToolClick
  | EventSetColor
  | EventSetActiveAsset
  | EventSetBuildingConfig
  | EventSetBuildingParams;

type WorkerMessage = WorkerInitMessage | ToMainMessage | ToolMessage; // | GameMessage;

class HandelersMap extends Map<string, (_data: any) => void> {
  append(handler: [string, (_data: any) => void][]) {
    handler.forEach(([k, f]) => {
      this.set(k, f);
    });
  }
}

export class MessageHandler {
  worker: Worker | Window & typeof globalThis;
  pendingResponses = new Map();

  handlers: HandelersMap = new HandelersMap([]);

  constructor(worker: Worker | Window & typeof globalThis) { //  | Window & typeof globalThis) {
    this.worker = worker;

    this.worker.onmessage = (event) => {
      this.handleIncoming(event.data);
      // const action: string = event.data.action;
      // this.handlers.get(action)?.(event.data);
    };
    // Generic handler for worker messages
  }
  sendDataSync(
    payload: WorkerMessage,
    data: Transferable[],
    id = crypto.randomUUID(),
  ) {
    const message = { ...payload, id };
    (this.worker as Worker).postMessage(message, data);
    return id;
  }

  send(payload: WorkerMessage, id = crypto.randomUUID()) {
    const message = { ...payload, id };
    this.worker.postMessage(message);
    return id;
  }

  sendMessageWithResponse(payload: WorkerMessage) {
    return new Promise((resolve) => {
      const id = this.send(payload);
      this.pendingResponses.set(id, resolve);
    });
  }

  public async handleIncoming(message: WorkerMessage) {
    const { action, id } = message;

    // Handle response
    if (id && this.pendingResponses.has(id)) {
      this.pendingResponses.get(id)?.(message);
      this.pendingResponses.delete(id);
      return;
    }

    // Handle request
    const handler = this.handlers.get(action);
    if (handler) {
      const result = await handler(message);
      if (id) {
        this.worker.postMessage({ type: "response", id, result: result });
      }
    } else {
      console.warn(`[MessageHandler] No handler for type "${action}"`);
    }
  }

  append(handler: [string, (_data: any) => void][]) {
    handler.forEach(([k, f]) => {
      this.handlers.set(k, f);
    });
  }
}

// Message dispatcher (optional: with response promises)
