import { toolRegistry } from "../tools/toolRegistry.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";

// ------------------- PRIVATE ------------------
async function _getBlobUrlFromAsset(
  _ctx: TGameHandlerContext,
  assetId: string,
): Promise<string | null> {
  toolRegistry.setActiveAssetId(assetId);
  const assetLoader = _ctx.gameloop.assetLoader;
  if (assetLoader && assetId) {
    try {
      const canvas = assetLoader.getAsset(assetId);
      if (canvas) {
        const blob = await canvas.convertToBlob();
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      }
    } catch (error) {
      console.error("Error generating asset preview:", error);
      return null;
    }
  }
  return null;
}

// -------------------------------------
export interface EventSetActiveAsset extends TBaseMessage<"setActiveAsset"> {
  assetId: string;
}
export const setActiveAsset: TGameHandlerAction<EventSetActiveAsset> =
  gameAction<
    EventSetActiveAsset
  >(
    "setActiveAsset",
    async (data: EventSetActiveAsset, _ctx: TGameHandlerContext) => {
      console.log("setActiveAsset received:", data.assetId);
      const blobUrl = await _getBlobUrlFromAsset(_ctx, data.assetId);
      if (blobUrl) {
        _ctx.handler.send({
          action: "assetPreview",
          blobUrl: blobUrl,
        });
      }
    },
  );

// -------------------------------------
export interface EventGetAsset extends TBaseMessage<"getAsset"> {
  assetId: string;
}
export const getAsset: TGameHandlerAction<EventGetAsset> = gameAction<
  EventGetAsset
>(
  "getAsset",
  async (data: EventGetAsset, _ctx: TGameHandlerContext) => {
    const blobUrl = await _getBlobUrlFromAsset(_ctx, data.assetId);
    if (blobUrl) {
      return { blobUrl: blobUrl };
    }
  },
);

// -------------------------------------
