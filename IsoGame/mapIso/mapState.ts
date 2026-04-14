import { TilesMatrix } from "../map/object/tilesMatrix.ts";
import { CanvasMapDrawersConf } from "./canvasMapDrawer.ts";
import { IsometricProjector, PointIso } from "./simpleIso/IsometricProjector.ts";

const CANVAS_WIDTH = 1600
const CANVAS_HEIGHT = 800

export interface CanvasMapConf {
  mapSize: number;      // Replaced DRAW_TILE_COUNT
  tileScaleSize: number;           // Replaced SCALE_SIZE
  tileScaleMod : number;            // Replaced SCALE_MOD
}


export class MapState {

    isoConf: CanvasMapConf = {
        mapSize: 40, 
        tileScaleSize: 1.4,     
        tileScaleMod: 1, 
    };
    isoProject: IsometricProjector;
    tilesMatrix: TilesMatrix;

    x: number = 0;
    y: number = 0;
    xf: number = 0;
    yf: number = 0;
    direction: string = "NE";

    keyboard = {
        up: 0,
        down : 0,
        left : 0,
        right : 0,
        shift : 0,
    }

    mouse = {
        screenX: 0,
        screenY:  0,
        mapX:  0,
        mapY:  0,
    }

    constructor() {
        this.tilesMatrix = new TilesMatrix(this.isoConf.mapSize, 0, 0, this.isoConf.mapSize)
        this.tilesMatrix.setCenter(this.x, this.y);

        this.isoProject = new IsometricProjector({
            originX : CANVAS_WIDTH / 2,
            originY : CANVAS_HEIGHT / 2 + this.isoConf.mapSize * 16 * this.isoConf.mapSize,
            SCALE_SIZE:this.isoConf.tileScaleSize,
            SCALE_MOD:this.isoConf.tileScaleMod,
        })
    }

    tickPlayerMovement() {

        const mapMod = this.isoConf.tileScaleMod;
        const speed = .1 * mapMod;

        const pm = this.keyboard;
        let diffX = pm.up ? 1 : pm.down ? -1 : 0;
        let diffY = pm.left ? 1 : pm.right ? -1 : 0;
        

        const offX = this.xf - this.x;
        const offY = this.yf - this.y;
        console.log(offX, offY)
        if (diffX == 0) {
            diffX = offX > speed ? -1 : offX < -speed ? 1 : 0
        } 
        if (diffY == 0) {
            diffY = offY > speed ? -1 : offY < -speed ? 1 : 0
        } 
        // ;
            // diffY = gameWorker.yf - gameWorker.y > speed ? -1 : gameWorker.yf - gameWorker.y < speed ? 1 : 0;

        if (diffX == 0 && diffY == 0) {
            this.xf = this.x
            this.yf = this.y
            return;
        }

        // Direction . 
        this.direction = 
            diffX >  0 && diffY >  0 ? "N" :
            diffX >  0 && diffY ==  0 ? "NE":
            diffX >  0 && diffY <  0 ? "E" :
            diffX == 0 && diffY < 0 ? "SE":
            diffX <  0 && diffY <  0 ? "S" :
            diffX <  0 && diffY ==  0 ? "SW":
            diffX <  0 && diffY >  0 ? "W" :
            diffX == 0 && diffY >  0 ? "NW": this.direction

        // if move :
        this.xf += diffY != 0 ? diffX * speed * .70 : diffX * speed;
        this.yf += diffX != 0 ? diffY * speed * .70 : diffY * speed;

        this.x = Math.round(this.xf);
        this.y = Math.round(this.yf);
    }
    

    public setMouseScreen(screenX: number, screenY: number): void {
        this.mouse.screenX = screenX;
        this.mouse.screenY = screenY;
        const tile = this.isoProject.screenToTileWithHeight(screenX, screenY, this.mapLvl, this.isoConf.mapSize);
        // Use internal IsometricProjector for coordinate conversion
            if (tile) {
            // console.log("Mouse moved to tile:", tile);
            this.mouse.mapX = tile.x;
            this.mouse.mapY = tile.y;
            }
        }


}