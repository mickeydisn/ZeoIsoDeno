import { GameHandlerData, GameWorker } from "../../gameWorker.ts";
import { toolRegistry } from "../../../../../../IsoGame/tools/toolRegistry.ts";
import { mapState } from "../../../../../../IsoGame/mapIso/mapState.ts";

export const createToolHandlers = (worker: GameWorker) => {
  return {
    setBuildingConfig: (data: GameHandlerData) => {
      console.log("setBuildingConfig received:", data.configId);
      toolRegistry.setBuildingConfig(data.configId);
    },

    setBuildingParams: (data: GameHandlerData) => {
      console.log("setBuildingParams received:", data.growLoop, data.endLoop);
      toolRegistry.setBuildingParams(data.growLoop);
    },

    setActiveTool: (data: GameHandlerData) => {
      toolRegistry.setActive(data.toolId);
    },

    setBrushSize: (data: GameHandlerData) => {
      toolRegistry.setBrushSize(data.size);
    },

    setColor: (data: GameHandlerData) => {
      toolRegistry.setActiveColor(data.r, data.g, data.b);
    },

    setActiveAsset: async (data: GameHandlerData) => {
      console.log("setActiveAsset received:", data.assetId);
      toolRegistry.setActiveAssetId(data.assetId);
      const assetLoader = (worker as any).assetLoader;
      if (assetLoader && data.assetId) {
        try {
          const canvas = assetLoader.getAsset(data.assetId);
          if (canvas) {
            const blob = await canvas.convertToBlob();
            const blobUrl = URL.createObjectURL(blob);
            worker.handler.send({
              action: "assetPreview",
              blobUrl: blobUrl,
            });
          }
        } catch (error) {
          console.error("Error generating asset preview:", error);
        }
      }
    },

    getAsset: async (data: GameHandlerData) => {
      toolRegistry.setActiveAssetId(data.assetId);
      const assetLoader = (worker as any).assetLoader;
      if (assetLoader && data.assetId) {
        try {
          const canvas = assetLoader.getAsset(data.assetId);
          if (canvas) {
            const blob = await canvas.convertToBlob();
            const blobUrl = URL.createObjectURL(blob);
            return { blobUrl: blobUrl };
          }
        } catch (error) {
          console.log("== Error generating asset preview:", error);
        }
      }
    },

    toolClick: (data: GameHandlerData) => {
      const x = data.gridX !== undefined
        ? data.gridX + mapState.x - 1
        : data.x !== undefined
        ? data.x
        : mapState.x;
      const y = data.gridY !== undefined
        ? data.gridY + mapState.y - 1
        : data.y !== undefined
        ? data.y
        : mapState.y;

      const result = toolRegistry.executeAt(x, y, (worker as any).world);

      worker.handler.send({
        action: "toolExecuted",
        toolId: toolRegistry.getActiveId(),
        success: true,
      });
    }
  };
};
