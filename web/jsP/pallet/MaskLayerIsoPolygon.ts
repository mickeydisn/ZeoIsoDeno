// =========================================================================
// === ISOMETRIC POLYGON MASK LAYER (FIXED COORDINATES & BACK FACE LOGIC) ===
// =========================================================================

import { IMaskLayer , enforceFullOpacity} from './MaskBuilderModule.ts';

type Point2D = [number, number]; // [X, Y] or [U, V]

// Define the 5 target faces
const FACES = [
    { id: 'fr', name: 'Front Right (Bottom Pyramid)' },
    { id: 'br', name: 'Back Right (Top Pyramid)' },
    { id: 'bl', name: 'Back Left (Top Pyramid)' },
    { id: 'fl', name: 'Front Left (Bottom Pyramid)' },
    { id: 'eq', name: 'Equator/Floor (Rhombus)' },
];


/**
 * IsoPolygonMaskLayer
 * Uses fixed base floor coordinates (height level 0) for projection.
 */
export class IsoPolygonMaskLayer implements IMaskLayer {
    readonly id = 'iso-polygon';
    readonly name = 'Isometric Polygon';
    readonly tileSize = 256;
    
    private readonly defaultColor = '#c0392b';
    private readonly defaultPolygon = `
6 , 0 , 
58, 0 , 
58 ,61,
48, 72, 
16, 72, 
6 , 61
6 , 61
6 , 0 , 

-1 , 0 , 
64, 0 , 
64 ,66,
51, 80, 
12, 80, 
-1 , 66
-1 , 0 , 

`; // A simple square
    private readonly defaultFace = 'fr';

    // === FIXED BASE COORDINATES (Equivalent to AdjustableDiamondMaskLayer at level 0) ===
    private readonly BOTTOM_PADDING = 36;
    private readonly Y_TOP_BASE = 256 - 64; 
    private readonly Y_EQ_BASE = 256 - 32;  
    private readonly Y_BOT_BASE = 256 ; 
    // ==================================================================================
    
    private colorInput?: HTMLInputElement; 
    private polyInput?: HTMLTextAreaElement; 
    private faceSelect?: HTMLSelectElement; 
    private onChangeHandler?: () => void;  
    private controlContainer?: HTMLElement; 
    
    // Element IDs
    private readonly colorInputId = `param-${this.id}-color`;
    private readonly polyInputId = `param-${this.id}-poly`;
    private readonly faceSelectId = `param-${this.id}-face`;

    renderControls(parentDiv : HTMLElement, containerId: string, onChange: () => void): void {
        const container = parentDiv.querySelector(`#${containerId}`) as HTMLElement ;
        if (!container) {
            console.error(`Container #${containerId} not found!`);
            return;
        }
        
        this.onChangeHandler = onChange;
        this.controlContainer = container; 
        
        const faceOptions = FACES.map(f => `<option value="${f.id}" ${f.id === this.defaultFace ? 'selected' : ''}>${f.name}</option>`).join('');

        // 1. Render HTML
        container.innerHTML = `
            <div class="layer-param">
                <label for="${this.colorInputId}">Line Color:</label>
                <input type="color" id="${this.colorInputId}" value="${this.defaultColor}">
            </div>
            <div class="layer-param">
                <label for="${this.faceSelectId}">Target Face:</label>
                <select id="${this.faceSelectId}" style="flex-grow: 1;">${faceOptions}</select>
            </div>
            <div class="layer-param" style="flex-direction: column; align-items: start;">
                <label for="${this.polyInputId}">Polygon Coords (64x64 UV, U,V pairs):</label>
                <textarea id="${this.polyInputId}" style="width: 100%; height: 60px; font-size: 1.3em;">${this.defaultPolygon}</textarea>
            </div>
        `;
        
        // 2. Initialize references and listeners
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        
        console.log(`[IsoPolygon Layer] Controls rendered and listeners attached into #${containerId}`);
    }

    reinitializeDOMReferences(): void {
        this.colorInput = this.controlContainer?.querySelector(`#${this.colorInputId}`) as HTMLInputElement;
        this.polyInput = this.controlContainer?.querySelector(`#${this.polyInputId}`) as HTMLTextAreaElement;
        this.faceSelect = this.controlContainer?.querySelector(`#${this.faceSelectId}`) as HTMLSelectElement;
    }

    attachEventListeners(): void {
        // Attach listeners to all inputs to trigger the module update
        if (this.colorInput) {
            this.colorInput.addEventListener('input', () => this.handleInputUpdate());
        }
        if (this.polyInput) {
            this.polyInput.addEventListener('input', () => this.handleInputUpdate());
        }
        if (this.faceSelect) {
            this.faceSelect.addEventListener('change', () => this.handleInputUpdate());
        }
    }
    
    handleInputUpdate(): void {
        if (this.onChangeHandler) {
            this.onChangeHandler();
        }
    }

    private parsePolygon(polyString: string): Point2D[] | null {
        try {
            return polyString.split(/[\s,]+/) 
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .reduce((acc, _, i, arr) => {
                    if (i % 2 === 0 && arr[i+1] !== undefined) acc.push([parseFloat(arr[i]), parseFloat(arr[i + 1])]);
                    return acc;
                }, [] as Point2D[]);
        } catch (e) {
            console.error("Invalid polygon string:", e);
            return null;
        }
    }

    /**
     * Maps a 64x64 (U, V) point to a screen (X', Y') point on the selected face 
     * using the fixed base coordinates.
     * @param U U coordinate (0-64)
     * @param V V coordinate (0-64)
     * @param faceId Target face ID
     * @returns Screen coordinate [X, Y]
     */
    private transform(U: number, V: number, faceId: string): Point2D {
        
        // Use fixed base coordinates
        const Y_EQ = this.Y_EQ_BASE;  // 188
        const Y_TOP = this.Y_TOP_BASE; // 156
        const Y_BOT = this.Y_BOT_BASE; // 220

        let X_prime: number; 
        let Y_prime: number; 

        // Apply the Affine Transformation based on the face (U,V is 64x64 grid)
        switch (faceId) {
            case 'fr': // Front Right (Bottom Pyramid) - Origin at Y_BOT, Y decreases
                X_prime = 128 + U;
                Y_prime = Y_BOT - 0.5 * U - V;
                break;
            case 'fl': // Front Left (Bottom Pyramid)
                // This formula implicitly maps to the parallelogram from Y_BOT to Y_TOP/Y_EQ and is assumed correct by the user
                X_prime = 64 + U;
                Y_prime = Y_EQ + 0.5 * U - V;
                break;
            case 'br': // Back Right (Top Pyramid) - Origin at Y_TOP, Y increases
                X_prime = 128 + 64 - U;
                Y_prime = Y_EQ - 0.5 * U - V;
                break;
            case 'bl': // Back Left (Top Pyramid)
                X_prime = 128 - U;
                Y_prime = Y_TOP + 0.5 * U - V;
                break;
            case 'eq': // Equator/Floor (Rhombus)
            default:
                // Origin (U=0, V=0) at (128, Y_EQ=188). Y increases towards Y_EQ + 32.
                X_prime = 128 + U - V;
                Y_prime = Y_BOT - 0.5 * U - 0.5 * V; 
                break;
        }

        return [X_prime, Y_prime - this.BOTTOM_PADDING];
    }

    draw(): OffscreenCanvas {
        const TILE_SIZE = this.tileSize;
        const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
        const ctx = canvas.getContext('2d')!;
        
        const lineColor = this.colorInput?.value ?? this.defaultColor;
        const faceId = this.faceSelect?.value ?? this.defaultFace;
        const polygonCoords = this.parsePolygon(this.polyInput?.value ?? this.defaultPolygon);

        if (!polygonCoords || polygonCoords.length < 2) {
            return enforceFullOpacity(canvas, TILE_SIZE);
        }

        const offset = 0.5; // For crisp lines

        ctx.imageSmoothingEnabled = false; 
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
        
        ctx.beginPath();

        polygonCoords.forEach(([u, v], index) => {
            // Clamp U, V to 0-64 range for safety
            const u_clamped = u; // Math.min(64, Math.max(0, u));
            const v_clamped = v; // Math.min(64, Math.max(0, v));
            
            const [x_prime, y_prime] = this.transform(u_clamped, v_clamped, faceId);
            
            const x_final = x_prime + offset;
            const y_final = y_prime + offset;

            if (index === 0) {
                ctx.moveTo(x_final, y_final);
            } else {
                ctx.lineTo(x_final, y_final);
            }
        });
        
        ctx.closePath();
        ctx.stroke();

        return enforceFullOpacity(canvas, TILE_SIZE);
    }
}