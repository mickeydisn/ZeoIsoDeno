// =========================================================================
// === ISOMETRIC 3D POLYGON MASK LAYER (UNIFIED X, Y, Z PROJECTION) ===
// =========================================================================

// Define interfaces necessary for standalone compilation
export interface IMaskLayer {
    readonly id: string;
    readonly name: string;
    readonly tileSize: number;
    renderControls(parentDiv: HTMLElement, containerId: string, onChange: () => void): void;
    draw(): OffscreenCanvas;
}

type Point2D = [number, number]; // Screen coordinates [X', Y'] (always integers now)
type Point3D = [number, number, number]; // World coordinates [X, Y, Z]

/**
 * Structure to hold the points and styles for a single closed shape/path.
 */
interface DrawingShape {
    points: Point3D[];
    strokeColor: string | null; // e.g., '#FF0000'
    fillColor: string | null;   // e.g., '#0000FF'
    lineWidth: number;          // NOTE: Only 1 is supported for pixel art, but kept for parsing consistency
}

/**
 * Reads the canvas pixel data and forces any partially visible pixel (Alpha > 0) 
 * to be fully opaque (Alpha = 255).
 * NOTE: This is less critical now as our custom renderer always sets Alpha=255.
 */
function enforceFullOpacity(canvas: OffscreenCanvas, size: number): OffscreenCanvas {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
            data[i] = 255; 
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Iso3DPolygonMaskLayer
 * Projects 3D world coordinates (X, Y, Z) directly onto the 2D canvas
 * using a simplified isometric projection, now using manual pixel rendering.
 */
export class Iso3DPolygonMaskLayer implements IMaskLayer {
    readonly id = 'iso-3d-polygon';
    readonly name = 'Isometric 3D Polygon (X,Y,Z)';
    readonly tileSize = 256;

    private readonly BOTTOM_PADDING = 36;
    private readonly Y_BOT_BASE = 256; 
    private readonly defaultStrokeColor = '#3498db'; 
    
    // Default polygon script (unchanged)
    private readonly defaultPolygon = `
// 1. Define Scalar and Point Variables
X = 10
Y = 20
Z_HEIGHT = 5
P1 = 10, 20, 5 
PL = 0, 65, 0 
PR = 64, 0, 0 
PT = 64, 64, 0 
PB = 0, 0, 0 
PBL = 0.5, 0, 0 


// ---------------
LINE  
FILL #000000
64,    0, 200,
64+64, 0, 200,
64+64, 0, -200,
64,    0, -200,

LINE
0, 65,      200,
0, 65+64,   200,
0, 65+64,  -200,
0, 65,     -200,

LINE
  0,   0,   0,
  0,  65,   0,
-64,  65,   0,
-64,   0,   0,

LINE
-128,   0,   0,
-128, -128,   0,
 64,  -128,   0,
 64,   0,   0,

TOP = 79
LINE
-128,   64,   TOP,
-128, +128,  TOP,
 64,  +128,  TOP,
 64,  64,    TOP,

TOP = 79
LINE
+256,  256,   TOP,
+256, -256,  TOP,
 64,  -256,  TOP,
 64,   256,    TOP,

/*
// ---------------
LINE #FF0000 
FILL 
// PL,PB, PR, PT,

// ---------------
// 2. Define Height
SIZE 2
HTOP = 0, 0, 79.5
HTOPa = 0, 0, 71.5
HTOPb = 0, 0, 64.5
HTOPp = 0, 0, 60.5 

// ---------------
LINE #00FF00 
// HTOP, HTOP >> 0, 64, 0
// HTOPa, HTOPa >> 0, 64, 0
// HTOPb, HTOPb >> 0, 64, 0


// ---------------
// 3. Define Height
LINE #FFFF00
PBL,PBL >>  HTOPb

// ---------------
// 3. Define Height
PIL_L = 0, 64-4, 0 
PIL_R = 0, 0+7, 0 

TOP_L = 0, 64-14, 0 
TOP_R = 0, 0+14, 0 
TOPB_L = 0, 54, 0 


// ---------------
// ---------------
// FUNC SIDE_E (TOP) {}
LINE #000000 FILL

PIL_R
PIL_R >> HTOPp,
TOP_R >> HTOPa,
TOP_L >> HTOPa,
PIL_L >> HTOPp,
PIL_L,
PL, PL >> HTOPb,
TOP_L >> HTOP,
TOP_R >> HTOP,
PB >> HTOPb,
PB

Pe =   6,   0, 0
Pw =  -6,   0, 0
Ps =   0,  -6, 0
Pn =   0,   6, 0


// ---------------
// FUNC SIDE_TOP (TOP) {}

TOP = 0, 0, 79.5
L =  0, 65, 0 >> TOP
R = 64,  0, 0 >> TOP
T = 64, 65, 0 >> TOP
B =  0,  0, 0 >> TOP

// LINE #000000
// L, B, R, T

De =  13,   0, 0
Dw = -12,   0, 0
Ds =   0, -13, 0
Dn =   0,  13, 0

LINE #000000
L >> De, L >> De >> Ds, L >> Ds, 
B >> Dn, B >> Dn >> De, B >> De, 
R >> Dw, R >> Dw >> Dn, R >> Dn,
T >> Ds, T >> Ds >> Dw, T >> Dw,

Ce =  20,   0, 0
Cw = -18,   0, 0
Cs =   0, -20, 0
Cn =   0,  21, 0

LINE #000000
L >> Ce, L >> Ce >> Cs, L >> Cs, 
B >> Cn, B >> Cn >> Ce, B >> Ce, 
R >> Cw, R >> Cw >> Cn, R >> Cn,
T >> Cs, T >> Cs >> Cw, T >> Cw,

// ---------------
// FUNC SIDE_S() {}

LINE #000000
PB, 
PB >> HTOPp >> 0, 0, 5, 
PB >> HTOP >> De, 
PR >> HTOP >> Dw, 
PR >> HTOPp >> 0, 0, 4,
PR,
PR >> Pw,
PR >> Pw >> HTOPp,
PR >> Cw >> HTOPa >> 3, 0, 0,
PB >> Ce >> HTOPa >> -4, 0, 0,
PB >> Pe >> HTOPp,
PB >> Pe

*/

`; 
    
    private polyInput?: HTMLTextAreaElement; 
    private onChangeHandler?: () => void;  
    private controlContainer?: HTMLElement; 
    
    private readonly polyInputId = `param-${this.id}-poly`;

    // --- PIXEL RENDERING HELPERS ---

    // Cache for pre-calculated RGB values
    private colorCache: { [hex: string]: [number, number, number] } = {};

    /** Converts hex string (#RRGGBB) to [R, G, B] array. */
    private _hexToRgb(hex: string): [number, number, number] {
        if (this.colorCache[hex]) {
            return this.colorCache[hex];
        }
        
        try {
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            const rgb: [number, number, number] = [r, g, b];
            this.colorCache[hex] = rgb;
            return rgb;
        } catch {
            return [0, 0, 0]; // Default to black if parsing fails
        }
    }

    /**
     * Sets a single pixel in the ImageData array.
     * @param data The Uint8ClampedArray of the canvas.
     * @param width The width of the canvas (TILE_SIZE).
     * @param x X coordinate (integer).
     * @param y Y coordinate (integer).
     * @param r Red value (0-255).
     * @param g Green value (0-255).
     * @param b Blue value (0-255).
     */
    private _setPixel(data: Uint8ClampedArray, width: number, x: number, y: number, r: number, g: number, b: number) {
        // Bounds check
        if (x < 0 || x >= width || y < 0 || y >= width) return;
        
        const index = (y * width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255; // Always fully opaque for pixel art mask
    }

    /**
     * Implements Bresenham's line algorithm for a pixel-perfect, 1-pixel line.
     */
    private _drawLine(data: Uint8ClampedArray, width: number, p1: Point2D, p2: Point2D, colorHex: string) {
        let x0 = p1[0];
        let y0 = p1[1];
        let x1 = p2[0];
        let y1 = p2[1];

        const [r, g, b] = this._hexToRgb(colorHex);

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            this._setPixel(data, width, x0, y0, r, g, b);

            if ((x0 === x1) && (y0 === y1)) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    /**
     * Fills the polygon using a simplified scanline algorithm.
     * This relies on rounding coordinates and only works well for convex/simple concave polygons.
     */
    private _fillPolygon(data: Uint8ClampedArray, width: number, points: Point2D[], colorHex: string) {
        if (points.length < 3) return;

        const [r, g, b] = this._hexToRgb(colorHex);

        // 1. Find bounding box to limit scanlines
        let minY = Infinity, maxY = -Infinity;
        for (const [x, y] of points) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        minY = Math.max(0, Math.floor(minY));
        maxY = Math.min(width - 1, Math.ceil(maxY));

        // 2. Scanline loop
        for (let y = minY; y <= maxY; y++) {
            const intersections: number[] = [];
            
            // Iterate over all edges of the polygon
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];

                const [x1, y1] = p1;
                const [x2, y2] = p2;

                // Check if the scanline crosses the edge
                if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
                    // Calculate the x-intersection point
                    const x_intersect = x1 + (y - y1) / (y2 - y1) * (x2 - x1);
                    intersections.push(x_intersect);
                }
            }

            // 3. Sort intersections by X
            intersections.sort((a, b) => a - b);

            // 4. Fill between pairs (Parity Rule)
            for (let i = 0; i < intersections.length; i += 2) {
                if (i + 1 >= intersections.length) break;

                let startX = Math.ceil(intersections[i]);
                const endX = Math.floor(intersections[i + 1]);

                // Clamp to canvas bounds
                startX = Math.max(0, startX);
                const clampedEndX = Math.min(width - 1, endX);

                // Draw the line of pixels
                for (let x = startX; x <= clampedEndX; x++) {
                    this._setPixel(data, width, x, y, r, g, b);
                }
            }
        }
    }
    
    // --- END PIXEL RENDERING HELPERS ---

    // ... (rest of the class methods remain the same, including parseDrawingInstructions) ...

    renderControls(parentDiv : HTMLElement, containerId: string, onChange: () => void): void {
        const container = parentDiv.querySelector(`#${containerId}`) as HTMLElement ;
        if (!container) {
            console.error(`Container #${containerId} not found!`);
            return;
        }
        
        this.onChangeHandler = onChange;
        this.controlContainer = container; 
        
        // 1. Render HTML 
        container.innerHTML = `
            <div class="layer-param" style="flex-direction: column; align-items: start;">
                <label for="${this.polyInputId}">
                    Drawing Script (X,Y,Z triples, 0-64 range)
                    <br><small>
                        * Render is now pixel-perfect using custom rasterization! *
                        <br>
                        Commands: 
                        <span style="font-family: monospace;">LINE [#color]</span> (New shape/Stroke), 
                        <span style="font-family: monospace;">FILL [#color]</span> (Fill), 
                        <span style="font-family: monospace;">SIZE [width]</span> (Stroke Width - *ignored, always 1px*)
                        <br>
                        <span style="font-family: monospace;">VAR = VALUE</span>, 
                        <span style="font-family: monospace;">A >> B</span> (Vector addition)
                        <br>
                        <span style="font-family: monospace;">OFF X Y Z { ... }</span> (Offset scope)
                    </small>
                </label>
                <textarea id="${this.polyInputId}" style="width: 100%; height: 200px; font-size: 1.1em; font-family: monospace;">${this.defaultPolygon.trim()}</textarea>
            </div>
        `;
        
        // 2. Initialize references and listeners
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        
        console.log(`[Iso3D Polygon Layer] Controls rendered and listeners attached into #${containerId}`);
    }

    reinitializeDOMReferences(): void {
        this.polyInput = this.controlContainer?.querySelector(`#${this.polyInputId}`) as HTMLTextAreaElement;
    }

    attachEventListeners(): void {
        if (this.polyInput) {
            this.polyInput.addEventListener('input', () => this.handleInputUpdate());
        }
    }
    
    handleInputUpdate(): void {
        if (this.onChangeHandler) {
            this.onChangeHandler();
        }
    }
    
    private variableStore: { [key: string]: number | Point3D } = {};

    private _evaluateValue(token: string): number {
        token = token.trim();
        const resolveToken = (t: string): number => {
            t = t.trim();
            if (t.length > 0 && isNaN(parseFloat(t))) {
                const value = this.variableStore[t.toUpperCase()]; 
                return (typeof value === 'number') ? value : 0; 
            }
            return parseFloat(t);
        };

        const subParts = token.split('-');
        if (subParts.length === 2) {
            const a = resolveToken(subParts[0]);
            const b = resolveToken(subParts[1]);
            if (!isNaN(a) && !isNaN(b)) { return a - b; }
        }
        
        const addParts = token.split('+');
        if (addParts.length === 2) {
            const a = resolveToken(addParts[0]);
            const b = resolveToken(addParts[1]);
            if (!isNaN(a) && !isNaN(b)) { return a + b; }
        }

        const divParts = token.split('/');
        if (divParts.length === 2) {
            const a = resolveToken(divParts[0]);
            const b = resolveToken(divParts[1]);
            if (!isNaN(a) && !isNaN(b) && b !== 0) { return a / b; }
        }

        return resolveToken(token);
    }
    
    private _resolvePoint(tokens: string[], i: number): { point: Point3D, consumed: number } | null {
        let lhs: Point3D | null = null;
        let lhsConsumed = 0;

        const pointVariable = this.variableStore[tokens[i]];
        if (Array.isArray(pointVariable)) {
            lhs = [...pointVariable]; 
            lhsConsumed = 1;
        } 
        else if (tokens[i + 1] !== undefined && tokens[i + 2] !== undefined) {
            const X = this._evaluateValue(tokens[i]);
            const Y = this._evaluateValue(tokens[i+1]);
            const Z = this._evaluateValue(tokens[i+2]);

            if (!isNaN(X) && !isNaN(Y) && !isNaN(Z)) { 
                 lhs = [X, Y, Z];
                 lhsConsumed = 3;
            }
        }

        if (lhs === null) {
            return null; 
        }

        const operatorIndex = i + lhsConsumed;
        if (tokens[operatorIndex] === '>>') {
            const rhsResolution = this._resolvePoint(tokens, operatorIndex + 1);
            
            if (rhsResolution) {
                const rhs = rhsResolution.point;
                const result: Point3D = [
                    lhs[0] + rhs[0],
                    lhs[1] + rhs[1],
                    lhs[2] + rhs[2]
                ];
                
                const totalConsumed = lhsConsumed + 1 + rhsResolution.consumed; 
                return { point: result, consumed: totalConsumed };
            } else {
                console.warn(`Operator '>>' found at index ${operatorIndex}, but the Right-Hand Side expression is invalid. Skipping.`);
                return { point: lhs, consumed: lhsConsumed };
            }
        } else {
            return { point: lhs, consumed: lhsConsumed };
        }
    }


    private parseDrawingInstructions(polyString: string): DrawingShape[] {
        this.variableStore = {}; 

        const cleaned = polyString
            .replace(/\/\*[\s\S]*?\*\//g, '')  // remove block comments
            .replace(/\/\/.*$/gm, '');         // remove line comments
        const lines = cleaned.split(/[\r\n]+/);
        const tokens: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('//') || trimmedLine.length === 0) continue; 

            const assignmentMatch = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
            
            if (assignmentMatch) {
                const varName = assignmentMatch[1].toUpperCase(); 
                const varValue = assignmentMatch[2].trim();
                
                const tempTokens = varValue
                    .replace(/,/g, ' ')
                    .replace(/>>/g, ' >> ')
                    .split(/\s+/)
                    .filter(t => t.length > 0)
                    .map(s => s.toUpperCase());

                const resolution = this._resolvePoint(tempTokens, 0);

                if (resolution && resolution.consumed === tempTokens.length) {
                    this.variableStore[varName] = resolution.point;
                    continue;
                } 
                
                if (varValue.includes(',')) {
                    const pointValues = varValue.split(/,\s*/);
                    if (pointValues.length === 3) {
                        const X = this._evaluateValue(pointValues[0]);
                        const Y = this._evaluateValue(pointValues[1]);
                        const Z = this._evaluateValue(pointValues[2]);
                        this.variableStore[varName] = [X, Y, Z];
                        continue;
                    }
                }

                const value = this._evaluateValue(varValue);
                this.variableStore[varName] = value;
                continue; 
            }
            
            tokens.push(...trimmedLine
                .replace(/\{/g, ' { ')
                .replace(/\}/g, ' } ')
                .replace(/,/g, ' ')
                .replace(/>>/g, ' >> ') 
                .split(/\s+/)
                .filter(t => t.length > 0)
                .map(s => s.toUpperCase()) 
            );
        }

        let currentShape: DrawingShape = { 
            points: [], 
            strokeColor: this.defaultStrokeColor, 
            fillColor: null, 
            lineWidth: 1 
        };
        const shapes: DrawingShape[] = [];

        const offsetStack: Point3D[] = [[0, 0, 0]]; 
        
        const getTotalOffset = (): Point3D => {
            return offsetStack.reduce((acc, current) => [
                acc[0] + current[0],
                acc[1] + current[1],
                acc[2] + current[2]
            ], [0, 0, 0] as Point3D);
        };

        const startNewShape = (inheritStyle: boolean = true) => {
            if (currentShape.points.length >= 2) {
                shapes.push(currentShape);
            }
            
            const newShape: DrawingShape = inheritStyle 
                ? { ...currentShape, points: [] } 
                : { points: [], strokeColor: null, fillColor: null, lineWidth: 1 };
                
            currentShape = newShape;
        };

        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];
            
            if (token === 'LINE') {
                const colorToken = tokens[i + 1];
                const color = colorToken && colorToken.startsWith('#') ? colorToken : null;
                
                startNewShape(true); 
                
                if (color) {
                    currentShape.strokeColor = color.match(/^#[0-9A-F]{6}$/) ? color : this.defaultStrokeColor;
                    i += 2;
                } else {
                    currentShape.strokeColor = null;
                    i += 1; 
                }

            } else if (token === 'FILL') {
                const colorToken = tokens[i + 1];
                const color = colorToken && colorToken.startsWith('#') ? colorToken : null;
                
                currentShape.fillColor = color && color.match(/^#[0-9A-F]{6}$/) ? color : null;
                i += (color ? 2 : 1); 

            } else if (token === 'SIZE') {
                i += 2; // Size is ignored, always 1px line width
            } else if (token === 'OFF') {
                if (i + 4 < tokens.length && tokens[i+4] === '{') {
                    const X_off = this._evaluateValue(tokens[i+1]);
                    const Y_off = this._evaluateValue(tokens[i+2]);
                    const Z_off = this._evaluateValue(tokens[i+3]);
                    offsetStack.push([X_off, Y_off, Z_off]);
                    i += 5; 
                } else {
                    console.warn("Incomplete OFF command format: 'OFF X Y Z {'. Skipping.");
                    i++;
                }
            } else if (token === '}') {
                if (offsetStack.length > 1) {
                    offsetStack.pop();
                } else {
                    console.warn("Attempted to close global offset scope. Ignoring '}'.");
                }
                i++;
            } else {
                const resolution = this._resolvePoint(tokens, i);
                
                if (resolution) {
                    const [X_raw, Y_raw, Z_raw] = resolution.point;
                    
                    const [X_off, Y_off, Z_off] = getTotalOffset();

                    currentShape.points.push([X_raw + X_off, Y_raw + Y_off, Z_raw + Z_off]);
                    i += resolution.consumed;
                } else {
                    const isCoord = !isNaN(this._evaluateValue(token));
                    if (isCoord) {
                        console.warn(`Incomplete 3D coordinate triple or invalid point expression found starting with '${tokens[i]}'. Stopping parsing.`);
                    } else {
                        console.warn(`Skipping unknown token or garbage: '${token}'.`);
                    }
                    break;
                }
            }
        }
        
        if (currentShape.points.length >= 2) {
            shapes.push(currentShape);
        }
        
        if (offsetStack.length > 1) {
             console.warn(`Exited parsing with ${offsetStack.length - 1} OFF scopes unclosed.`);
        }
        
        return shapes;
    }

    /**
     * Projects a 3D point (X, Y, Z) into a 2D screen point (X', Y')
     * and R O U N D S the result to the nearest integer pixel for pixel art.
     * @param X X coordinate (0-64)
     * @param Y Y coordinate (0-64)
     * @param Z Z coordinate (0-64)
     * @returns Screen coordinate [X', Y'] (integers)
     */
    private project(X: number, Y: number, Z: number): Point2D {
        const Y_BOT = this.Y_BOT_BASE; 

        // Projection: X' = 128 + X - Y; Y' = Y_BOT - 0.5 * X - 0.5 * Y - Z;
        const X_prime = 128 + X - Y;
        const Y_prime = Y_BOT - 0.5 * X - 0.5 * Y - Z; 

        // CRITICAL: Round to nearest integer for pixel-perfect drawing
        return [
            Math.round(X_prime), 
            Math.round(Y_prime - this.BOTTOM_PADDING)
        ];
    }

    draw(): OffscreenCanvas {
        const TILE_SIZE = this.tileSize;
        const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
        const ctx = canvas.getContext('2d')!;
        
        // Clear and get the raw pixel buffer
        ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
        const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
        const data = imageData.data;
        
        const shapes = this.parseDrawingInstructions(this.polyInput?.value ?? this.defaultPolygon);

        if (shapes.length === 0) {
            // Put the empty image data back
            ctx.putImageData(imageData, 0, 0); 
            return enforceFullOpacity(canvas, TILE_SIZE); 
        }

        // Process shapes one by one
        shapes.forEach(shape => {
            if (shape.points.length < 2) return;

            // 1. Project all 3D points to rounded 2D integer pixels
            const points2D: Point2D[] = shape.points.map(([X, Y, Z]) => this.project(X, Y, Z));

            // 2. Apply Fill (draw first to ensure stroke is on top)
            if (shape.fillColor) {
                this._fillPolygon(data, TILE_SIZE, points2D, shape.fillColor);
            }

            // 3. Apply Stroke (draw last)
            if (shape.strokeColor) {
                // Draw lines between all projected points, closing the loop
                for (let i = 0; i < points2D.length; i++) {
                    const p1 = points2D[i];
                    const p2 = points2D[(i + 1) % points2D.length]; // Connect to next, wrap to first
                    this._drawLine(data, TILE_SIZE, p1, p2, shape.strokeColor);
                }
            }
        });

        // Put the final pixel data back onto the canvas
        ctx.putImageData(imageData, 0, 0);

        // Enforce full opacity (though not strictly necessary now, it's good practice)
        return enforceFullOpacity(canvas, TILE_SIZE);
    }
}