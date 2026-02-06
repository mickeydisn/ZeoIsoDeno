// --- 2. Main Generator Class with Internal Shading ---

import { ColorIso } from "./Color.ts";
import { IsometricConf, IsometricProjector, PointIso } from "./IsometricProjector.ts";

const IsometricConfDefaults = {
    SCALE_SIZE: 1,
    SCALE_MOD: 1,
    ISO_LVL_SCALE: 39,
    originX: 32,
    originY: 32,
    offsetX: 0,
    offsetY: 0,
};


export class IsometricTileGenerator {
    private CANVAS_WIDTH = 64;
    public conf: IsometricConf;
    private projector!: IsometricProjector;
    private canvas!: OffscreenCanvas;

    // Default luminance change factors for shading
    private readonly SE_SHADE_FACTOR = -0.10; // Slightly darker for SE border
    private readonly SW_SHADE_FACTOR = -0.25; // Darker for SW border (to imply shadow)

    constructor(confOverrides: Partial<IsometricConf> = {}) {
        this.conf = { ...IsometricConfDefaults, ...confOverrides };
        this.updateConf();
    }

    updateConf(overrides: Partial<IsometricConf> = {}) {
        // Merge overrides with defaults
        this.conf = { ...this.conf, ...overrides };
        this.projector = new IsometricProjector(this.conf);
        this.canvas = new OffscreenCanvas(64 * this.conf.SCALE_SIZE, 64 * this.conf.SCALE_SIZE);
    }

    /**
     * Creates an image of a 1x1 isometric tile with optional walls/borders on an OffscreenCanvas.
     * The border colors are automatically shaded from the base color.
     * * @param BASE_COLOR The base Color object for the floor.
     * @param diffLvlSE The height (in Z-units) of the South-East border (Y-axis face).
     * @param diffLvlSW The height (in Z-units) of the South-West border (X-axis face).
     * @returns An OffscreenCanvas containing the tile image.
     */
    createTile(BASE_COLOR: ColorIso, diffLvlSE: number, diffLvlSW: number): OffscreenCanvas {
          
        // --- 1. Derive Colors ---
        const floorColor = BASE_COLOR;
        const borderSEColor = BASE_COLOR.lighten(this.SE_SHADE_FACTOR);
        const borderSWColor = BASE_COLOR.lighten(this.SW_SHADE_FACTOR);

        // --- 2. Define and Project 3D Points ---
        const P0 = new PointIso(0, 0, 0); 
        const P1 = new PointIso(1, 0, 0); 
        const P2 = new PointIso(1, 1, 0); 
        const P3 = new PointIso(0, 1, 0); 
        
        const p0 = this.projector.translatePoint(P0);
        const p1 = this.projector.translatePoint(P1);
        const p2 = this.projector.translatePoint(P2);
        const p3 = this.projector.translatePoint(P3);
        
        // Projected bottom points
        const P0_b_sw = new PointIso(0, 0, -diffLvlSE); 
        const P1_b = new PointIso(1, 0, -diffLvlSE);
        const P0_b_se = new PointIso(0, 0, -diffLvlSW);
        const P3_b = new PointIso(0, 1, -diffLvlSW);

        const p0_b_sw = this.projector.translatePoint(P0_b_sw);
        const p1_b = this.projector.translatePoint(P1_b);
        const p0_b_se = this.projector.translatePoint(P0_b_se);
        const p3_b = this.projector.translatePoint(P3_b);

        // --- 3. Determine Canvas Height ---
        const allYCoords = [p0.y, p0_b_sw.y, p0_b_se.y];
        const highestYCoord = Math.max(...allYCoords);
        const CANVAS_HEIGHT_ACTUAL = Math.ceil(highestYCoord);

        // 4. Initialize Canvas
        // const canvas = new OffscreenCanvas(this.CANVAS_WIDTH, CANVAS_HEIGHT_ACTUAL);
        this.canvas.width = this.CANVAS_WIDTH * this.conf.SCALE_SIZE;
        this.canvas.height = CANVAS_HEIGHT_ACTUAL;
        const ctx = this.canvas.getContext('2d');

        if (!ctx) return this.canvas;

        // --- 5. Draw Faces (Back-to-Front) ---
        
        // 5.1. South-West Border (X-axis, Right side)
        if (diffLvlSE > 0) {
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);         
            ctx.lineTo(p1.x, p1.y);         
            ctx.lineTo(p1_b.x, p1_b.y);     
            ctx.lineTo(p0_b_sw.x, p0_b_sw.y); 
            ctx.closePath();
            ctx.fillStyle = borderSWColor.toHex();
            ctx.fill();
        }
        
        // 5.2. South-East Border (Y-axis, Left side)
        if (diffLvlSW > 0) {
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);         
            ctx.lineTo(p3.x, p3.y);         
            ctx.lineTo(p3_b.x, p3_b.y);     
            ctx.lineTo(p0_b_se.x, p0_b_se.y); 
            ctx.closePath();
            ctx.fillStyle = borderSEColor.toHex();
            ctx.fill();
        }
        
        // 5.3. Floor Face (Top) - Drawn last
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = floorColor.toHex();
        ctx.fill();


        // Costly map generation call
        return this.canvas;
    }
}