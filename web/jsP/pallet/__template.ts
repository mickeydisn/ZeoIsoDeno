
// === TEMPLATE MODULE ===
// =========================================================================

export interface MyTemplateModuleParams {
    divId: string;
}

export class MyTemplateModule {
    private containerDiv: HTMLElement;

    // Handlers
    private onChange?: (module: MyTemplateModule) => void;

    // Transformation state (stored for persistence)
    private transformState = {
        x: 0, // Translation X (pixels)
        y: 0, // Translation Y (pixels)
        scale: 1.0, // Scale factor
        rotation: 0, // (Optional) Rotation in degrees
    };

    // DOM References (UPDATED for button controls)
    private xValueSpan!: HTMLElement;
    private yValueSpan!: HTMLElement;
    //...

    constructor(params: MyTemplateModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }
        
        this.containerDiv = container;

        this.containerDiv.innerHTML = this.renderInitialStructure();
        this.reinitializeDOMReferences();
        this.attachEventListeners();
    }
    
    /**
     * PUBLIC METHOD: Sets or updates the onChange handler.
     */
    public setHandlers(handlers: { 
            onChange?: (module: MyTemplateModule) => void;
        }): void {
        this.onChange = handlers.onChange;
        console.log('Transformer handlers updated.');
        
        // Re-render and reinitialize DOM to ensure controls/handlers are fresh
        this.containerDiv.innerHTML = this.renderInitialStructure();
        this.reinitializeDOMReferences();
        this.attachEventListeners();
    }
    
    // Helper to re-get DOM elements after innerHTML update
    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        
        this.xValueSpan = this.containerDiv.querySelector(`#x-value-${idSuffix}`) as HTMLElement;
        this.yValueSpan = this.containerDiv.querySelector(`#y-value-${idSuffix}`) as HTMLElement;
        //...
    }

    /**
     * PUBLIC METHOD: Loads a new TypeImage into the internal state and resets controls.
     */
    public AnyCallFunction(param:any): void {

        
        // Reset controls to default state (assuming the incoming image is untransformed)
        this.updateControlValues();
        this.updateMetadata();
    }
    
    /**
     * Updates the text content of the display spans and the appearance of toggle buttons.
     */
    private updateControlValues(): void {
        const { x, y } = this.transformState;
        
        if (this.xValueSpan) this.xValueSpan.textContent = String(x);
        if (this.yValueSpan) this.yValueSpan.textContent = String(y);
    }

    private updateMetadata(): void {
        // const idSuffix = this.containerDiv.id;
    }
    

    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        return `
            <style>
                /* Style of the contenaire */
            </style>
            <div class="module-card">
            <details>
                <summary class="module-group-title">Title</summary>
            </details>
            </div>
        `;
    }

    private attachEventListeners() {
        // exempl : this.flipHBtn.addEventListener('click', () => this.handleFlipH()); 
    }
    
    /**
     * Function to Handel UserAction ( linked on attachEventListeners )
     * Commits the change immediately.
     */
    private handleFunction(): void {

    }
    
}

// --- Example setup for running the class ---

export function initializeTransformerEditor(
    container_id : string = "editor-transformer-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const transformerInstance = new MyTemplateModule({
        divId: container_id,
    });
    transformerInstance.setHandlers({
        onChange: (module: MyTemplateModule ) => {
            if (module) {
                // console.log(`[Transformer Change] New image version committed. Label: ${image.label}`);
                // The main editor (ImageEditorModule) would consume this and display the transformed image.
            }
        },
    })
    return transformerInstance;
}

// Start the module initialization (optional)
// initializeTransformerEditor();