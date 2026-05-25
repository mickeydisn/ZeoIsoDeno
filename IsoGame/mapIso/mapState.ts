import { TypeKeysActionUpdate } from "../../IsoGameAddon/iso/web/js/main/keyboad.ts";
import { TilesMatrix } from "../map/object/tilesMatrix.ts";
import { DrawContext } from "@iso-game/mapIso/render/type.ts";
import { IsometricProjector } from "./utils/simpleIso/IsometricProjector.ts";

export const CANVAS_WIDTH = 1600
export const CANVAS_HEIGHT = 800

const PLAYER_SPEED = 0.25; // Base speed in tiles per tick, modulated by tileScaleMod        

export interface CanvasMapConf {
  mapSize: number;                  // Replaced DRAW_TILE_COUNT
  tileScaleSize: number;            // Replaced SCALE_SIZE
  tileScaleMod : number;            // Replaced SCALE_MOD
}


type TypeDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"

type Point2D = {
    x: number,
    y: number,
}

class directionVector {
    x: number
    y: number

    constructor(x: number, y:number) {
        this.x = x;
        this.y = y;
    }

    toDirection = () : TypeDirection | null => {
        const x = this.x;
        const y = this.y;
        return x == 0 && y == 0 ? null:
            x >  0 && y >  0 ? "N" :
            x >  0 && y ==  0 ? "NE":
            x >  0 && y <   0 ? "E" :
            x == 0 && y <   0 ? "SE":
            x <  0 && y <   0 ? "S" :
            x <  0 && y ==  0 ? "SW":
            x <  0 && y >   0 ? "W" :
            x == 0 && y >   0 ? "NW": 
            null
    } 

    toVecDistance = (speed: number) => {
        const x = this.x;
        const y = this.y;

        // IF MOUVE ON 2 DIRECTION on ISO => RSquare(2) * X == .70 * X
        return {
            x: y != 0 ? x * speed * .70 : x * speed,
            y: x != 0 ? y * speed * .70 : y * speed,
        }        
    }

}


class isoFloatPoint {
    fix : {
        x: number;
        y: number;
    }
    float : {
        x: number;
        y: number;
    }
    constructor(x: number, y:number) {
        this.fix   = {x: Math.round(x), y: Math.round(x)}
        this.float = {x: x, y: y}
    }

    setFix(x: number, y:number) {
        this.fix   = {x: Math.round(x), y: Math.round(x)}
        this.float = {x: x, y: y}
    }

    getOff() {
        return {
            x: this.fix.x - this.float.x,
            y: this.fix.y - this.float.y,
        }
    }


    getDirectionOff(direction: TypeDirection) {
        return {
            x: this.float.x - this.fix.x,
            y: this.float.y - this.fix.y,
        }
    }

}

export class MapState {
    private static instance: MapState;
    public static getInstance(): MapState {
        return MapState.instance ??= new MapState();
    }
    constructor() { }


    overlayPoint : Array<Point2D> = [];

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
        up:     0,  // vecD.x =  1 // NE
        down :  0,  // vecD.x = -1 // SW
        left :  0,  // vecD.y =  1 // NW
        right : 0,  // vecD.y = -1 // SE
        shift : 0,
    }

    mouse = {
        screenX: 0,
        screenY:  0,
        mapX:  0,
        mapY:  0,
    }

    private _lastMouseUpdate: number = 0;

    public setCenter(x:number, y:number) {
        this.x = x;
        this.y = y;
        this.xf = x;
        this.yf = y
    }
    private setXY(xf:number, yf:number) {
        const x = Math.round(xf);
        const y = Math.round(yf);
        if (this.x != x && this.x != y) {
            console.log("UPDATE XY")            
        } 
        this.x = x;
        this.y = y;
    }
    
    private applyOnWalk () {
    }

    public tickUpdateKeyboard(keyboardAction: TypeKeysActionUpdate) {

        this.applyOnWalk();
    
        const mapMod = this.isoConf.tileScaleMod;
        const speed = PLAYER_SPEED * mapMod;

        const vecD = new directionVector(
            keyboardAction.up   ? 1 : keyboardAction.down   ? -1 : 0,
            keyboardAction.left ? 1 : keyboardAction.right  ? -1 : 0,
        )


        // Direction . 
        this.direction = vecD.toDirection() || this.direction;

        const vecDSpeed = vecD.toVecDistance(speed)

        const offX = this.xf - this.x;
        const offY = this.yf - this.y;
        
        /*
         TODO , need to manage the OFFSET Properly : 
            - if an offset exist on an axe, and key not impact this axe,:
                - the offset must be reduce.
                - if the direction impact the offset axe. the offset must follow the dirrection( never go back ) 
                - else ,slide to the neir offset
        */

        if (vecD.x == 0 && vecD.y == 0) {
            this.xf = this.x
            this.yf = this.y
            return;
        }

        // if move :
        this.xf += vecDSpeed.x;
        this.yf += vecDSpeed.y;

        this.xf =  Math.abs(this.xf - Math.round(this.xf)) < .001 ? Math.round(this.xf) : this.xf
        this.yf =  Math.abs(this.yf - Math.round(this.yf)) < .001 ? Math.round(this.yf) : this.yf

        this.setXY(this.xf, this.yf)

    }
    //-----------------------


    // Mouse tracking
    mouseScreenX: number = 0;
    mouseScreenY: number = 0;
    mouseWorldX: number = 0;
    mouseWorldY: number = 0;


    public setMouseScreen(
        _drawCtx: DrawContext, 
        screenX: number, screenY: number
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


export const gobalMapState = MapState.getInstance();