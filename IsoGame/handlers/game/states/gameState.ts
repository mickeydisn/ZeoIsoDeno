import { DrawContext, IsoConfig } from "@iso-game/mapIso/render/type.ts";

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 800;

const PLAYER_SPEED = 0.25; // Base speed in tiles per tick, modulated by tileScaleMod

export interface PotionActionEntry {
  func: string;
  config: Record<string, unknown>;
}

export interface Potion {
  id: string;
  name: string;
  icon: string;
  actions: PotionActionEntry[];
  remainingUses: number;
  createdAt: number;
}

export interface PlayerState {
  username: string;
  inventory: Potion[];
  activePotionId: string | null;
}

export class GameState {
  private static instance: GameState;
  public static getInstance(): GameState {
    return GameState.instance ??= new GameState();
  }
  constructor() {}

  playerState: PlayerState = {
    username: "mickey-test",
    inventory: [],
    activePotionId: null,
  };

  isoConf: IsoConfig = {
    mapGridSize: 40,
    mapGridTileScale: 1.4,
    mapGridMod: 1,
    showTileBox: false,
    showIsFrise: true,
    showIsBlock: true,
    showIsBuilding: true,
  };
  setIsoConf(isoConf: IsoConfig) {
    this.isoConf = isoConf;
  }

  // --
  x: number = 0;
  y: number = 0;
  xf: number = 0;
  yf: number = 0;
  direction: string = "NE";

  keyboard = {
    up: 0, // vecD.x =  1 // NE
    down: 0, // vecD.x = -1 // SW
    left: 0, // vecD.y =  1 // NW
    right: 0, // vecD.y = -1 // SE
    shift: 0,
  };

  mouse = {
    screenX: 0,
    screenY: 0,
    mapX: 0,
    mapY: 0,
  };

  private _lastMouseUpdate: number = 0;

  public setCenter(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.xf = x;
    this.yf = y;
  }
  public setXY(xf: number, yf: number) {
    const x = Math.round(xf);
    const y = Math.round(yf);
    if (this.x != x && this.x != y) {
      console.log("UPDATE XY");
    }
    this.x = x;
    this.y = y;
  }

  //-----------------------

  // Mouse tracking
  mouseScreenX: number = 0;
  mouseScreenY: number = 0;
  mouseWorldX: number = 0;
  mouseWorldY: number = 0;

  // Postition tracking
  save = {
    p0: { x: 0, y: 0 },
  };

  public setMouseScreen(
    _drawCtx: DrawContext,
    screenX: number,
    screenY: number,
  ): void {
    // Throttle to max 60fps (16ms) to avoid object creation storm
    const now = Date.now();
    if (now - this._lastMouseUpdate < 16) return;
    this._lastMouseUpdate = now;

    const tile = _drawCtx.isoProject.screenToTileWithHeight(
      screenX,
      screenY,
      _drawCtx.tilesMatrix,
    );
    // Use internal IsometricProjector for coordinate conversion
    if (tile) {
      this.mouseWorldX = tile.x;
      this.mouseWorldY = tile.y;
    }
  }
}

export const gobalGameState = GameState.getInstance();
