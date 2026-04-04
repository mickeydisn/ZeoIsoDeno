// =========================================================================
// === ACTION MODULE INTERFACE & CORE ===
// =========================================================================

/**
 * Interface for a generic button definition used by the module.
 */
export interface ActionButtonConfig {
    id: string;
    label: string;
    onClick: () => void;
    /** Optional: a function to determine if the button should be disabled. */
    getIsDisabled?: () => boolean; 
}

/**
 * The ImageActionModule handles all user interaction buttons dynamically, 
 * communicating solely via the provided handlers.
 */
export class ImageActionModule {
    private containerDiv: HTMLElement;
    private buttonConfigs: ActionButtonConfig[] = []; // Stores the current set of buttons
    private buttonElements: Map<string, HTMLButtonElement> = new Map();


    /**
     * Constructor now only takes the container ID and sets up the basic HTML structure.
     */
    constructor(divId: string) {
        const container = document.getElementById(divId);
        if (!container) {
            throw new Error(`DOM element with ID "${divId}" not found for Action Module.`);
        }

        this.containerDiv = container;
        
        // Setup initial styles and empty control structure
        this.containerDiv.innerHTML = this.getInitialStyles();
    }

    /**
     * PUBLIC METHOD: Initializes the module, sets the handlers, removes existing buttons,
     * and adds the standard example buttons back.
     * * @param handlers The set of external functions to call when buttons are clicked.
     */
    public init(): void {
        
        // 1. Remove all buttons (as requested)
        this.removeAllButtons(); 
        
        
        // 3. Render the buttons and sync their initial state
        this.renderButtons();
    }
    
    /**
     * PUBLIC METHOD: Adds a new button configuration dynamically.
     * @param id A unique ID for the button.
     * @param label The text displayed on the button.
     * @param onClick The function to call when the button is clicked.
     * @param getIsDisabled Optional function to determine if the button should be disabled.
     */
    public addButton(id: string, label: string, onClick: () => void, getIsDisabled?: () => boolean): void {
        const config: ActionButtonConfig = { id, label, onClick, getIsDisabled };
        
        // Check for duplicate ID
        if (this.buttonConfigs.some(b => b.id === id)) {
            console.warn(`Button with ID "${id}" already exists. Skipping.`);
            return;
        }

        this.buttonConfigs.push(config);
        this.renderButtons();
    }
    
    /**
     * PUBLIC METHOD: Removes all existing button configurations and re-renders an empty state.
     */
    public removeAllButtons(): void {
        this.buttonConfigs = [];
        this.renderButtons(); // Renders the cleared state
    }
    
    /**
     * PUBLIC METHOD: External application calls this to sync button state.
     */
    public updateActionButtons(): void {
        
        // 1. Update generic buttons using their local getIsDisabled logic
        this.buttonConfigs.forEach(config => {
            const button = this.buttonElements.get(config.id);
            if (button && config.getIsDisabled) {
                button.disabled = config.getIsDisabled();
            }
        });
        
    }
    
    // =========================================================================
    // === INTERNAL RENDERING AND EXAMPLE SETUP ===
    // =========================================================================
    
    /**
     * INTERNAL METHOD: Renders all buttons based on the current configuration.
     */
    private renderButtons(): void {
        const controlsDiv = this.containerDiv.querySelector('.editor-controls');
        if (!controlsDiv) return;

        controlsDiv.innerHTML = ''; // Clear existing buttons
        this.buttonElements.clear(); // Clear DOM references
        
        this.buttonConfigs.forEach(config => {
            const button = document.createElement('button');
            button.id = config.id;
            button.textContent = config.label;
            
            // Set initial disabled state
            if (config.getIsDisabled) {
                button.disabled = config.getIsDisabled();
            }
            
            // Attach the click handler
            button.addEventListener('click', () => {
                config.onClick();
            });
            
            this.buttonElements.set(config.id, button);
            controlsDiv.appendChild(button);
        });
        
        // Ensure the initial state is synced 
        this.updateActionButtons(); 
    }
    
    /**
     * INTERNAL METHOD: Provides the initial CSS for the control container.
     */
    private getInitialStyles(): string {
        return `
            <style>
                .editor-controls { 
                    padding-top:5px;
                    display: flex; 
                    gap: 8px; 
                }
                .editor-controls button {
                    color: white;
                    font-weight: 600;
                }
                .editor-controls button:disabled { 
                    background-color: #bdc3c7; 
                    cursor: not-allowed; 
                    box-shadow: none;
                }
                .editor-controls button:hover:not(:disabled) { 
                    background-color: #2980b9; 
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
            </style>
            
            <div class="action-module-card">
                <div class="editor-controls">
                    <!-- Buttons will be rendered here after init() is called -->
                </div>
            </div>
        `;
    }
    
}