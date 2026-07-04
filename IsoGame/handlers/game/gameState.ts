import { DrawContext } from "@iso-game/mapIso/render/type.ts";
import { TypeKeysActionUpdate } from "@iso-web/js/main/keyboad.ts";
import {
  directionVector,
  Point2D,
} from "@iso-game/handlers/utils/renderUtils.ts";

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 800;

const PLAYER_SPEED = 0.25; // Base speed in tiles per tick, modulated by tileScaleMod

export interface CanvasMapConf {
  mapSize: number; // Replaced mapGridSize
  tileScaleSize: number; // Replaced mapGridTileScale
  tileScaleMod: number; // Replaced mapGridMod
}

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

  isoConf: CanvasMapConf = {
    mapSize: 40,
    tileScaleSize: 1.4,
    tileScaleMod: 1,
  };
  setIsoConf(isoConf: CanvasMapConf) {
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

export const tickUpdateKeyboard = (
  _stt: GameState,
  keyboardAction: TypeKeysActionUpdate,
) => {
  const mapMod = _stt.isoConf.tileScaleMod;
  const speed = PLAYER_SPEED * mapMod;

  const vecD = new directionVector(
    keyboardAction.up ? 1 : keyboardAction.down ? -1 : 0,
    keyboardAction.left ? 1 : keyboardAction.right ? -1 : 0,
  );

  // Direction .
  _stt.direction = vecD.toDirection() || _stt.direction;

  const vecDSpeed = vecD.toVecDistance(speed);

  const offX = _stt.xf - _stt.x;
  const offY = _stt.yf - _stt.y;

  /*
         TODO , need to manage the OFFSET Properly :
            - if an offset exist on an axe, and key not impact this axe,:
                - the offset must be reduce.
                - if the direction impact the offset axe. the offset must follow the dirrection( never go back )
                - else ,slide to the neir offset
        */

  if (vecD.x == 0 && vecD.y == 0) {
    _stt.xf = _stt.x;
    _stt.yf = _stt.y;
    return;
  }

  // if move :
  _stt.xf += vecDSpeed.x;
  _stt.yf += vecDSpeed.y;

  _stt.xf = Math.abs(_stt.xf - Math.round(_stt.xf)) < .001
    ? Math.round(_stt.xf)
    : _stt.xf;
  _stt.yf = Math.abs(_stt.yf - Math.round(_stt.yf)) < .001
    ? Math.round(_stt.yf)
    : _stt.yf;

  _stt.setXY(_stt.xf, _stt.yf);
};
