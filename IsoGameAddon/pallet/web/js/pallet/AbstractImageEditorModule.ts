// =========================================================================
// === ABSTRACT BASE CLASS FOR IMAGE EDITOR MODULES ===
// =========================================================================

/** * Note: These imports must be provided by the surrounding ecosystem.
 * All module files use TypeImage and DEFAULT_EMPTY_ASSET.
 */
import { DEFAULT_EMPTY_ASSET, TypeImage } from "./ProjectType.ts";

/**
 * Common interface for the parameters used to initialize any editor module.
 * The concrete module classes (e.g., ImageEditorColorModule) will extend this interface.
 */
export interface AbstractModuleParams {
    image?: TypeImage;
    /** The ID of the DOM element that will contain the module's UI. */
    divId: string;
}

/**
 * The base class for all image editor modules (Color, Transformer, Palette, Outline, etc.).
 * It handles standard boilerplate for DOM mounting, canvas setup, and image loading.
 */
export abstract class AbstractImageEditorModule {
    
    // Core state management
    protected currentImage: TypeImage = DEFAULT_EMPTY_ASSET; // Stores the current image
    protected containerDiv: HTMLElement; // The root DOM element for the module
    
    // Internal canvas for drawing/committing/reading pixel data
    protected canvas!: HTMLCanvasElement;
    protected ctx!: CanvasRenderingContext2D; 
    
    // Handlers for notifying external changes (e.g., image mutation)
    protected onChange?: (image: TypeImage) => void; //

    /**
     * Initializes the module by finding the container, setting the initial image, 
     * rendering the base structure, and setting up references and listeners.
     */
    constructor(params: AbstractModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            const tempDiv = document.createElement('div');
            tempDiv.id = params.divId;
            document.body.appendChild(tempDiv);
            this.containerDiv = tempDiv; //
        } else {
            this.containerDiv = container; //
        }

        this.currentImage = params.image || DEFAULT_EMPTY_ASSET; //
        // 1. Render module-specific UI structure
        this.containerDiv.innerHTML = this.renderInitialStructure(); //
        
    }

    // Clean polymorphism init
    protected initAfterConstruct() {
        // 2. Setup the canvas (must be done after rendering the structure)
        this.setupCanvas(); 
        // 3. Get DOM References (both common and module-specific)
        this.reinitializeDOMReferences(); //
        // 4. Setup Listeners
        this.attachEventListeners(); //
    }

    // =========================================================================
    // === PUBLIC API METHODS ===
    // =========================================================================

    /**
     * Sets or updates the external change handler.
     */
    public setHandlers(handlers: { 
        onChange?: (image: TypeImage) => void;
    }): void {
        this.onChange = handlers.onChange; //
    }

    /**
     * Loads a new TypeImage into the internal state and updates the module's controls.
     */
    public loadImage(image: TypeImage): void {
        // 1. Update internal state
        this.currentImage = image; //
        
        // 2. Resize canvas to match the new image
        this.canvas.width = this.currentImage.cimage.width; //
        this.canvas.height = this.currentImage.cimage.height; //

        // 3. Call module-specific updates
        this.updateModuleState();
    }
    
    // =========================================================================
    // === PROTECTED & PRIVATE METHODS ===
    // =========================================================================

    /**
     * Initializes the common canvas and context references using a predefined ID.
     * Assumes the HTML structure (from renderInitialStructure) contains an element with the ID 'module-canvas'.
     */
    protected setupCanvas(): void {
        const canvasElement = this.containerDiv.querySelector('#module-canvas') as HTMLCanvasElement;
        if (canvasElement) {
             this.canvas = canvasElement;
             // Ensure the canvas context is obtained once
             this.ctx = canvasElement.getContext('2d', { willReadFrequently: true })!;
             // Initial size setting (will be corrected by loadImage)
             this.canvas.width = this.currentImage.cimage.width;
             this.canvas.height = this.currentImage.cimage.height;
        } else {
            // Log an error if the implementing module forgot to include the canvas in its structure
            console.error(`Canvas element with ID 'module-canvas' not found in ${this.constructor.name}'s structure.`);
        }
    }


    // =========================================================================
    // === ABSTRACT METHODS (MUST be implemented by concrete modules) ===
    // =========================================================================

    /**
     * Returns the HTML string (including <style>) for the module's UI structure.
     * The canvas element should have the ID 'module-canvas'.
     */
    protected abstract renderInitialStructure(): string; //

    /**
     * Re-acquires references to module-specific DOM elements (e.g., buttons, inputs) 
     * after innerHTML is set. The base class calls this in the constructor.
     */
    protected abstract reinitializeDOMReferences(): void; //

    /**
     * Attaches all module-specific event listeners to DOM elements.
     * The base class calls this in the constructor.
     */
    protected abstract attachEventListeners(): void; //

    /**
     * Resets or updates the module's internal state variables , metadata,  buttons and controls
     */
    protected abstract updateModuleState(): void;

}