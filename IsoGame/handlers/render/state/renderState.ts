import { Point2D } from "@iso-game/handlers/utils/renderUtils.ts";

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 800;
export const PLAYER_SPEED = 0.25; // Base speed in tiles per tick, modulated by tileScaleMod

export class RenderState {
  private static instance: RenderState;
  public static getInstance(): RenderState {
    return RenderState.instance ??= new RenderState();
  }
  constructor() {}

  mapGridSize: number = 40;
  mapGridMod: number = 1.4;
  mapGridTileScale: number = 1;
  showTileBox: boolean = false;
  showIsFrise: boolean = false;
  showIsBlock: boolean = false;

  x: number = 0;
  y: number = 0;
  xf: number = 0;
  yf: number = 0;
  direction: string = "NE";

  mouseScreenX: number = 0;
  mouseScreenY: number = 0;
  mouseMapX: number = 0;
  mouseMapY: number = 0;

  overlayPoint: Array<Point2D> = [];
}

export const gobalRenderState = RenderState.getInstance();
