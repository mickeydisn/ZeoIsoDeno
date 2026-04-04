// =========================================================================
// === SHARED INTERFACES & UTILITY TYPES ===
// =========================================================================

import { AdjustableDiamondMaskLayer } from "./MaskLayerIsoAjust.ts";
import { Iso3DPolygonMaskLayer } from "./MaskLayerIso3DPolygon.ts";
import { IsoPolygonMaskLayer } from "./MaskLayerIsoPolygon.ts";

export type TypeImage = {
    cimage: OffscreenCanvas;
};

// =========================================================================
// === PIXEL-PERFECT UTILITY FUNCTION ===
// =========================================================================

export function enforceFullOpacity(canvas: OffscreenCanvas, size: number): OffscreenCanvas {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
            data[i] = 255; 
        } else {
            data[i] = 0; 
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

// =========================================================================
// === MASK LAYER INTERFACE ===
// =========================================================================

export interface IMaskLayer {
    readonly id: string;
    readonly name: string;
    readonly tileSize: number;
    
    // MODIFIED: Takes an onChange handler to notify the module of parameter changes.
    renderControls(parentDiv : HTMLElement, containerId: string, onChange: () => void): void;
    
    // Draws the layer's content onto an OffscreenCanvas.
    draw(): OffscreenCanvas;

    // ADDED: Re-initializes DOM element references after the HTML is rendered.
    reinitializeDOMReferences(): void; 
    
    // ADDED: Attaches event listeners to the referenced DOM elements.
    attachEventListeners(): void; 
    
    // ADDED: Handles input changes and triggers the module's update via the stored handler.
    handleInputUpdate(): void; 
}

// =========================================================================
// === CONCRETE IMPLEMENTATIONS (SCOPED DOM STATE) ===
// =========================================================================

export class DiamondMaskLayer implements IMaskLayer {
    readonly id = 'diamond';
    readonly name = 'Isometric Diamond';
    readonly tileSize = 256;
    
    private readonly defaultColor = '#3498DB';
    
    private colorInput?: HTMLInputElement; 
    private onChangeHandler?: () => void;
    private controlContainer?: HTMLElement; // NEW: Container reference


    renderControls(parentDiv : HTMLElement, containerId: string, onChange: () => void): void {
        const container = parentDiv.querySelector(`#${containerId}`) as HTMLElement ;
        if (!container) {
            console.error(`Container #${containerId} not found!`);
            return;
        }
        
        this.onChangeHandler = onChange;
        this.controlContainer = container; // Store the container for scoped queries
        const inputId = `param-${this.id}-color`;

        // 1. Render HTML
        container.innerHTML = `
            <div class="layer-param">
                <label for="${inputId}">Line Color:</label>
                <input type="color" id="${inputId}" value="${this.defaultColor}">
            </div>
        `;
        
        // 2. Initialize references and listeners using new methods
        this.reinitializeDOMReferences();
        this.attachEventListeners();

        console.log(`[Diamond Layer] Controls rendered and listeners attached into #${containerId}`);
    }

    reinitializeDOMReferences(): void {
        const inputId = `param-${this.id}-color`;
        // SCOPED QUERY: Search within the controlContainer
        this.colorInput = this.controlContainer?.querySelector(`#${inputId}`) as HTMLInputElement;
    }
    
    attachEventListeners(): void {
        if (this.colorInput) {
            this.colorInput.addEventListener('input', () => this.handleInputUpdate()); 
        }
    }
    
    handleInputUpdate(): void {
        if (this.onChangeHandler) {
            this.onChangeHandler();
        }
    }

    draw(): OffscreenCanvas {
        const TILE_SIZE = this.tileSize;
        const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
        const ctx = canvas.getContext('2d')!;

        const lineColor = this.colorInput?.value ?? this.defaultColor;
        
        console.log(`[Diamond Draw] Drawing with color: ${lineColor}`); 

        const offset = 0.5; 

        ctx.imageSmoothingEnabled = false; 
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        
        ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);

        const pb = 36;
        const X_CENTER = 128 + offset;
        const X_RIGHT = 192 + offset;
        const X_LEFT = 64 + offset;
        const Y_TOP = (192 - pb) + offset;      
        const Y_RIGHT_LEFT = (224 - pb) + offset; 
        const Y_BOTTOM = (256 - pb) + offset;   
        
        ctx.beginPath();
        ctx.moveTo(X_CENTER, Y_TOP);          
        ctx.lineTo(X_RIGHT, Y_RIGHT_LEFT);    
        ctx.lineTo(X_CENTER, Y_BOTTOM);       
        ctx.lineTo(X_LEFT, Y_RIGHT_LEFT);     
        ctx.closePath();
        ctx.stroke();
        
        return enforceFullOpacity(canvas, TILE_SIZE);
    }
}

export class BorderMaskLayer implements IMaskLayer {
    readonly id = 'border';
    readonly name = '1px Square Border';
    readonly tileSize = 256;
    
    private readonly defaultColor = '#2ecc71';
    
    private colorInput?: HTMLInputElement;
    private onChangeHandler?: () => void;
    private controlContainer?: HTMLElement; // NEW: Container reference

    renderControls(parentDiv : HTMLElement, containerId: string, onChange: () => void): void {
        const container = parentDiv.querySelector(`#${containerId}`) as HTMLElement ;
        if (!container) {
            console.error(`Container #${containerId} not found!`);
            return;
        }
        
        this.onChangeHandler = onChange;
        this.controlContainer = container; // Store the container for scoped queries
        const inputId = `param-${this.id}-color`;

        // 1. Render HTML
        container.innerHTML = `
            <div class="layer-param">
                <label for="${inputId}">Line Color:</label>
                <input type="color" id="${inputId}" value="${this.defaultColor}">
            </div>
        `;
        
        // 2. Initialize references and listeners using new methods
        this.reinitializeDOMReferences();
        this.attachEventListeners();

        console.log(`[Border Layer] Controls rendered and listeners attached into #${containerId}`);
    }

    reinitializeDOMReferences(): void {
        const inputId = `param-${this.id}-color`;
        // SCOPED QUERY: Search within the controlContainer
        this.colorInput = this.controlContainer?.querySelector(`#${inputId}`) as HTMLInputElement;
    }
    
    attachEventListeners(): void {
        if (this.colorInput) {
            this.colorInput.addEventListener('input', () => this.handleInputUpdate());
        }
    }
    
    handleInputUpdate(): void {
        if (this.onChangeHandler) {
            this.onChangeHandler();
        }
    }

    draw(): OffscreenCanvas {
        const TILE_SIZE = this.tileSize;
        const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
        const ctx = canvas.getContext('2d')!;
        
        const lineColor = this.colorInput?.value ?? this.defaultColor;
        
        console.log(`[Border Draw] Drawing with color: ${lineColor}`);

        const offset = 0.5; 

        ctx.imageSmoothingEnabled = false; 
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        
        ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
        
        ctx.beginPath();
        ctx.rect(0 + offset, 0 + offset, TILE_SIZE - 1, TILE_SIZE - 1);
        ctx.stroke();

        return enforceFullOpacity(canvas, TILE_SIZE);
    }
}


// =========================================================================
// === MASK BUILDER MODULE (The Orchestrator) ===
// =========================================================================

export interface MaskBuilderModuleParams {
    divId: string;
    layerClasses: (new () => IMaskLayer)[];
    onApply: (maskTileCanvas: OffscreenCanvas) => void;
}

type LayerState = {
    enabled: boolean;
};

export class MaskBuilderModule {
    private containerDiv: HTMLElement;
    private onApplyHandler: (maskTileCanvas: OffscreenCanvas) => void;
    
    private layers: IMaskLayer[];
    private layerState: Map<string, LayerState> = new Map();
    private readonly TILE_SIZE = 256;

    constructor(params: MaskBuilderModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }
        this.containerDiv = container;
        this.onApplyHandler = params.onApply;

        this.layers = params.layerClasses.map(LayerClass => new LayerClass());
        
        console.log(`[MaskBuilder] Created ${this.layers.length} layer instances.`);
        
        this.layers.forEach(layer => {
            this.layerState.set(layer.id, { enabled: true });
        });

        this.renderInitialHTML();
        this.delegateControlRendering();
        this.setupEventListeners();
        this.triggerUpdate();
    }
    
    private delegateControlRendering(): void {
        console.log('[MaskBuilder] Delegating control rendering to layers...');
        
        const layerChangeHandler = () => this.triggerUpdate(); 

        this.layers.forEach(layer => {
            const containerId = `layer-controls-${layer.id}`;
            console.log(`[MaskBuilder] Asking layer '${layer.id}' to render into #${containerId}`);
            
            layer.renderControls(this.containerDiv, containerId, layerChangeHandler);
        });
    }

    public setHandlers(handlers: { 
        onApply?: (maskTileCanvas: OffscreenCanvas) => void,
    }): void {
        if (handlers.onApply) { 
            this.onApplyHandler = handlers.onApply; 
            console.log("[MaskBuilder] OnApply handler updated.");
            this.triggerUpdate(); 
        }
    }
    
    private renderInitialHTML(): void {
        const layerListHtml = this.layers.map(layer => {
            const state = this.layerState.get(layer.id)!;

            return `
                <details class="module-card">
                    <summary class="module-group-title">
                         <input type="checkbox" id="layer-${layer.id}" data-layer-id="${layer.id}" ${state.enabled ? 'checked' : ''}> 
                         ${layer.name}
                    </summary>
                    <div class="layer-controls" id="layer-controls-${layer.id}"></div>
                </details>
            `;
        }).join('');

        this.containerDiv.innerHTML = `
            <style>
                .layer-controls { padding-left: 20px; display: flex; flex-direction: column; gap: 5px;}
                .layer-param { display: flex; align-items: center; gap: 10px; font-size: 0.9em; }
                .layer-param label { min-width: 80px; }
                .layer-param input[type="color"] { width: 50px; height: 25px; border: none; padding: 0; cursor: pointer; }
                .layer-param input[type="number"], .layer-param input[type="text"], .layer-param textarea, .layer-param select { flex-grow: 1; padding: 2px 5px; border: 1px solid #5a708a; background-color: #1e293b; color: white; border-radius: 3px;}
            </style>
            <div class="module-group-title">
             
                    ${layerListHtml}

            </div>
        `;
    }

    private setupEventListeners(): void {
        this.layers.forEach(layer => {
            const checkbox = this.containerDiv.querySelector(`#layer-${layer.id}`) as HTMLInputElement;
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.updateLayerEnabledState(layer.id, (e.target as HTMLInputElement).checked);
                });
            }
        });
    }

    private updateLayerEnabledState(id: string, isEnabled: boolean): void {
        const state = this.layerState.get(id);
        if (state) {
            state.enabled = isEnabled;
            console.log(`[MaskBuilder] Layer '${id}' enabled: ${isEnabled}`);
            this.triggerUpdate(); 
        }
    }
    
    private buildCompositeMask(): OffscreenCanvas {
        console.log('[MaskBuilder] Building composite mask...');
        
        const compositeCanvas = new OffscreenCanvas(this.TILE_SIZE, this.TILE_SIZE);
        const ctx = compositeCanvas.getContext('2d')!;
        
        ctx.clearRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = false;

        let layersDrawn = 0;
        
        this.layers.forEach(layer => {
            const state = this.layerState.get(layer.id);
            if (state && state.enabled) {
                console.log(`[MaskBuilder] Drawing layer: ${layer.name}`);
                
                const layerTile = layer.draw(); 
                
                ctx.drawImage(layerTile as unknown as CanvasImageSource, 0, 0);
                layersDrawn++;
            } else {
                console.log(`[MaskBuilder] Skipping disabled layer: ${layer.name}`);
            }
        });
        
        console.log(`[MaskBuilder] Composite complete. Drew ${layersDrawn} layers.`);
        
        return enforceFullOpacity(compositeCanvas, this.TILE_SIZE);
    }

    private triggerUpdate(): void {
        console.log('[MaskBuilder] Mask update triggered!');
        const finalMaskTile = this.buildCompositeMask();
        this.onApplyHandler(finalMaskTile);
        console.log('[MaskBuilder] Final mask tile passed to onApply handler.');
    }
}

// =========================================================================
// === INITIALIZATION FUNCTION ===
// =========================================================================

export function initializeMaskBuilder(
    container_id: string = "mask-builder-container",
    onApplyHandler: (maskTileCanvas: OffscreenCanvas) => void = (cimage) => { 
        console.log(`[Demo OnApply] Mask tile received. Size: ${cimage.width}x${cimage.height}`);
    }
): MaskBuilderModule {
    const container = document.getElementById(container_id);
    if (!container) {
        console.log(`[Init] Creating container div #${container_id}`);
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }
    
    const maskLayerClasses = [
        Iso3DPolygonMaskLayer,
        DiamondMaskLayer, 
        BorderMaskLayer,
        AdjustableDiamondMaskLayer,
        // IsoPolygonMaskLayer, 
    ];

    const maskBuilderInstance = new MaskBuilderModule({
        divId: container_id,
        layerClasses: maskLayerClasses,
        onApply: onApplyHandler,
    });
    
    console.log('[Init] MaskBuilderModule initialized successfully!');
    return maskBuilderInstance;
}