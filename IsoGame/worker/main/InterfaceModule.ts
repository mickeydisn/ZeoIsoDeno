import { 
    ICommand, 
    ICommandStatic, 
    TComMessageParams,
    IComMessageParam,
    IComMessage
} from "../shared/actions/TypeCommand.ts";
import { AllCommandClasses } from "../game/commands/AllCommands.ts";
import { CommandFactoryWorker } from "../shared/CommandFactory.ts";

// --- Module State and Types ---

// A map to hold all known command classes, keyed by their 'func' string for quick lookup
type CommandMap = Map<string, ICommandStatic>;

// A map to hold commands grouped by their 'group' string
type CommandGroupRegistry = Map<string, ICommandStatic[]>;

// A map to hold the current value for every possible parameter key across all commands
type ParamValueStore = Map<string, any>;

export interface InterfaceModuleParams {
    divId: string;
    factory?: CommandFactoryWorker; 
}

export class InterfaceModule {
    private containerDiv: HTMLElement;
    private commandMap: CommandMap = new Map();
    private commandGroupRegistry: CommandGroupRegistry = new Map();
    private allParams: IComMessageParam[] = []; // List of all unique parameter definitions
    
    // Global state to store the value of EVERY input field persistently
    private paramValueStore: ParamValueStore = new Map();
    
    // UI State
    private currentCommandGroup: string = '';
    private currentCommandFunc: string = '';
    private tileX: number = 0;
    private tileY: number = 0;

    // DOM References
    private groupSelect!: HTMLSelectElement;
    private commandCardsContainer!: HTMLElement;
    private parameterInputsContainer!: HTMLElement;
    private executeButton!: HTMLButtonElement;
    private xInput!: HTMLInputElement;
    private yInput!: HTMLInputElement;

    // Factory instance
    private factory: CommandFactoryWorker;
    
    // Handlers
    private onExecute?: (command: ICommand | null) => void;

    // --- Initialization ---

    constructor(params: InterfaceModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }
        
        this.containerDiv = container;
        this.factory = params.factory || CommandFactoryWorker.getInstance();

        this.initializeRegistry();
        
        // Set initial state
        this.currentCommandGroup = Array.from(this.commandGroupRegistry.keys())[0] || '';
        this.currentCommandFunc = this.commandGroupRegistry.get(this.currentCommandGroup)?.[0]?.func || '';

        this.containerDiv.innerHTML = this.renderInitialStructure();
        this.reinitializeDOMReferences();
        this.attachEventListeners();
        this.renderCommandCards(); // Initial render of command cards
        this.renderParameters(); // Initial render of parameter inputs
    }

    /**
     * Loops through all command classes to build the registry and aggregate all unique parameters.
     * Also initializes the default values in the persistent store.
     */
    private initializeRegistry(): void {
        AllCommandClasses.forEach(CmdClass => {
            // 1. Map by function for quick lookup
            this.commandMap.set(CmdClass.func, CmdClass);

            // 2. Map by group
            const groupName = CmdClass.group || 'General';
            if (!this.commandGroupRegistry.has(groupName)) {
                this.commandGroupRegistry.set(groupName, []);
            }
            this.commandGroupRegistry.get(groupName)!.push(CmdClass);
            
            // 3. Store all defaults and aggregate unique parameters
            const defaults = CmdClass.defaults;
            for (const key in defaults) {
                if (defaults.hasOwnProperty(key) && !this.paramValueStore.has(key)) {
                    this.paramValueStore.set(key, defaults[key]);
                }
            }
            
            // 4. Aggregate unique parameter definitions
            CmdClass.params.forEach(paramDef => {
                if (!this.allParams.some(p => p.key === paramDef.key)) {
                    this.allParams.push(paramDef);
                }
            });
        });

        if (this.allParams.length === 0) {
             console.warn("No command parameters found.");
        }
    }

    /**
     * PUBLIC METHOD: Sets or updates the onChange handler.
     */
    public setHandlers(handlers: { 
            onExecute?: (command: ICommand | null) => void;
        }): void {
        this.onExecute = handlers.onExecute;
        console.log('InterfaceModule handlers updated.');
    }

    /**
     * PUBLIC METHOD: Sets the X, Y coordinates, typically from a mouse click event.
     */
    public setCoordinates(x: number, y: number): void {
        this.tileX = x;
        this.tileY = y;
        // Check if DOM elements exist before setting values
        if (this.xInput) this.xInput.value = String(x);
        if (this.yInput) this.yInput.value = String(y);
    }
    
    // Helper to re-get DOM elements after innerHTML update
    private reinitializeDOMReferences(): void {
        const idSuffix = this.containerDiv.id;
        
        this.groupSelect = this.containerDiv.querySelector(`#group-select-${idSuffix}`) as HTMLSelectElement;
        this.commandCardsContainer = this.containerDiv.querySelector(`#command-cards-${idSuffix}`) as HTMLElement;
        this.parameterInputsContainer = this.containerDiv.querySelector(`#param-inputs-${idSuffix}`) as HTMLElement;
        this.executeButton = this.containerDiv.querySelector(`#execute-btn-${idSuffix}`) as HTMLButtonElement;
        this.xInput = this.containerDiv.querySelector(`#x-coord-${idSuffix}`) as HTMLInputElement;
        this.yInput = this.containerDiv.querySelector(`#y-coord-${idSuffix}`) as HTMLInputElement;

        if (this.xInput) this.xInput.value = String(this.tileX);
        if (this.yInput) this.yInput.value = String(this.tileY);
        if (this.groupSelect) this.groupSelect.value = this.currentCommandGroup;
    }

    // --- Rendering Logic ---

    /**
     * Renders the input control based on its type definition.
     */
    private renderInputControl(param: IComMessageParam): string {
        const idSuffix = this.containerDiv.id;
        // Use the global store value or fall back to the param definition's default (which should be in the store)
        const currentVal = this.paramValueStore.has(param.key) ? this.paramValueStore.get(param.key) : '';
        const inputId = `input-${param.key}-${idSuffix}`;
        
        let controlHtml = '';

        switch (param.type) {
            case 'number': { 
                controlHtml = `
                    <input type="number" 
                           id="${inputId}" 
                           value="${currentVal}"
                           min="${param.min !== undefined ? param.min : ''}"
                           max="${param.max !== undefined ? param.max : ''}"
                           step="${param.step !== undefined ? param.step : '1'}"
                           class="input-field">
                `;
                break;
            } 
            case 'boolean': { 
                // Checkbox needs special handling for its initial state
                const isChecked = !!currentVal; 
                controlHtml = `
                    <label for="${inputId}" class="toggle-switch-container">
                        <input type="checkbox" id="${inputId}" class="toggle-input" ${isChecked ? 'checked' : ''}>
                        <div class="toggle-slider"></div>
                    </label>
                `;
                break;
            } 
            case 'string':
            default: { 
                controlHtml = `
                    <input type="text" 
                           id="${inputId}" 
                           value="${currentVal || ''}"
                           class="input-field">
                `;
                break;
            } 
        }

        return `
            <div class="input-group">
                <label for="${inputId}">${param.label}</label>
                ${controlHtml}
            </div>
        `;
    }

    /**
     * Renders the command cards for the currently selected group.
     */
    private renderCommandCards(): void {
        const commandsInGroup = this.commandGroupRegistry.get(this.currentCommandGroup);
        this.commandCardsContainer.innerHTML = ''; // Clear existing cards

        if (!commandsInGroup || commandsInGroup.length === 0) {
            this.commandCardsContainer.innerHTML = '<p class="text-gray-500 p-4">No commands in this group.</p>';
            return;
        }

        let html = '<div class="command-cards-grid">';
        commandsInGroup.forEach(cmd => {
            const isSelected = cmd.func === this.currentCommandFunc;
            const selectedClass = isSelected 
                ? 'command-card-selected'
                : '';
            
            html += `
                <div data-func="${cmd.func}" 
                     class="command-card ${selectedClass}">
                    <p class="card-title">${cmd.name}</p>
                    <p class="card-subtitle">${cmd.func}</p>
                </div>
            `;
        });
        html += '</div>';

        this.commandCardsContainer.innerHTML = html;
        this.attachCardListeners(commandsInGroup);
    }
    
    /**
     * Renders the parameter inputs relevant to the current command.
     */
    private renderParameters(): void {
        const currentCommand = this.commandMap.get(this.currentCommandFunc);
        if (!currentCommand) {
            this.parameterInputsContainer.innerHTML = '<p class="param-empty-message">Select a command to configure its parameters.</p>';
            return;
        }

        const requiredParams = currentCommand.params;
        let html = '';

        requiredParams.forEach(paramDef => {
            // Find the full definition from allParams to ensure all fields (like min/max) are available
            const fullDef = this.allParams.find(p => p.key === paramDef.key) || paramDef;
            html += this.renderInputControl(fullDef);
        });

        this.parameterInputsContainer.innerHTML = html;
        this.attachParameterListeners(requiredParams);
        this.updateCommandDisplay();
    }
    
    /**
     * Renders the full module structure, including group selection and command cards.
     */
    private renderInitialStructure(): string {
        const idSuffix = this.containerDiv.id;
        const groupOptions = Array.from(this.commandGroupRegistry.keys())
            .map(group => `<option value="${group}">${group}</option>`)
            .join('');

        return `
            <style>
                /* Base Styles */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

                /* General Inputs */
                .input-field {
                    width: 100%;
                    padding: 12px; 
                    border: 1px solid #d1d5db; /* Gray-300 */
                    border-radius: 12px; 
                    background-color: white;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.07);
                    transition: all 0.15s ease-in-out;
                    appearance: none; /* For selects */
                }

                .input-field:focus {
                    outline: none;
                    border-color: #3b82f6; /* Blue-500 */
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
                }

                /* Command Cards Container */
                .command-cards-container {
                    padding: 16px; 
                    border-radius: 12px; 
                    background-color: #333;
                    margin: 1rem 0;
                }

                .command-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px; 

                }

                @media (min-width: 768px) { 
                    .command-cards-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                }

                .command-card {
                    padding: 12px; 
                    border-radius: 12px; 
                    cursor: pointer;
                    transition: all 0.2s ease-in;
                    background-color: #2c3e50;
                    color: #DDD;
                }

                .command-card:hover {
                    color: #333;
                    background-color: #f0f8ff; /* Light Blue Hover */ 
                    transform: scale(1.02);
                }
                .command-card-selected {
                    background-color: #2563eb; /* Blue-600 */
                    color: #FFF;
                    transform: scale(1.02);
                }
                .command-card .card-title {
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                .command-card .card-subtitle {
                    font-weight: 400;
                    font-size: 0.75rem;
                }

                /* Coordinates flex container */
                .coord-group-container {
                    display: flex;
                    gap: 16px; 
                    flex-direction: column;
                    padding-bottom: 16px;
                }


                /* Execute Button */
                .execute-btn {
                    width: 100%;
                    padding: 16px; 
                    font-size: 1.125rem; 
                    font-weight: 800; 
                    background-color: #10b981; /* Green-500 */
                    color: white;
                    border-radius: 12px; 
                    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.4);
                    transition: all 0.2s ease-in-out;
                    border: none;
                    cursor: pointer;
                }

                .execute-btn:hover:not(:disabled) {
                    background-color: #059669; /* Green-600 */
                    transform: scale(1.01);
                }

                .execute-btn:disabled {
                    background-color: #9ca3af; /* Gray-400 */
                    box-shadow: none;
                    cursor: not-allowed;
                }

                /* Message Display */
                .message-display {
                    margin-top: 24px; 
                    padding: 12px; 
                    font-size: 0.875rem; 
                    text-align: center;
                    word-break: break-words;
                    border-radius: 8px; 
                }

                .message-default {
                    color: #4b5563;
                    border: 1px solid #d1d5db; 
                    background-color: #f3f4f6; 
                }
                .message-success {
                    color: #059669; 
                    border: 1px solid #6ee7b7; 
                    background-color: #d1fae5; 
                    font-weight: 700;
                }
                .message-error {
                    color: #dc2626; 
                    border: 1px solid #fca5a5; 
                    background-color: #fee2e2; 
                    font-weight: 700;
                }

                /* Toggle Switch (Boolean) Styling */
                .toggle-switch-container {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    cursor: pointer;
                }

                .toggle-input {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border-width: 0;
                }

                .toggle-slider {
                    width: 44px; 
                    height: 24px; 
                    background-color: #e5e7eb; 
                    border-radius: 9999px; 
                    position: relative;
                    transition: all 0.3s;
                }

                .toggle-slider::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 20px; 
                    height: 20px; 
                    background-color: white;
                    border: 1px solid #d1d5db; 
                    border-radius: 9999px; 
                    transition: all 0.3s;
                }

                .toggle-input:checked + .toggle-slider {
                    background-color: #2563eb; 
                }

                .toggle-input:checked + .toggle-slider::after {
                    transform: translateX(20px); 
                    border-color: white;
                }

                .toggle-label-text {
                    margin-left: 12px; 
                    font-size: 0.875rem;
                    font-weight: 500;
                    user-select: none;
                }
                
                .param-empty-message {
                    padding: 16px;
                    text-align: center;
                    font-style: italic;
                }
            </style>
             <details class="module-card">
                <summary class="module-group-title">
                    Action : Execute Commande
                </summary>

                <!-- Execute Button -->
                <button id="execute-btn-${idSuffix}" class="execute-btn">
                    Execute Command
                </button>
                
                <p id="current-command-display-${idSuffix}" class="message-display message-default">
                   Select a command to see configuration preview.
                </p>

            </details>
            <br>
             <details class="module-card">
                <summary class="module-group-title">
                    Action : Config Command
                </summary>
                
                <!-- Command Group Selection -->
                <div class="input-group">
                    <label for="group-select-${idSuffix}">
                        Select Command Group
                    </label>
                    <select id="group-select-${idSuffix}" class="input-field">
                        ${groupOptions}
                    </select>
                </div>

                <!-- Command Cards -->
                <div id="command-cards-${idSuffix}" class="command-cards-container">
                    <!-- Dynamic command cards rendered here -->
                </div>

                <!-- Coordinates -->
                <div class="coord-group-container">
                    <div class="input-group" style="flex: 1;">
                        <label for="x-coord-${idSuffix}">X Coordinate</label>
                        <input type="number" id="x-coord-${idSuffix}" value="0" 
                               class="input-field">
                    </div>
                    <div class="input-group" style="flex: 1;">
                        <label for="y-coord-${idSuffix}">Y Coordinate</label>
                        <input type="number" id="y-coord-${idSuffix}" value="0" 
                               class="input-field">
                    </div>
                </div>

                <!-- Dynamic Parameter Inputs -->
                <div id="param-inputs-${idSuffix}" class="coord-group-container">
                    <!-- Dynamic inputs rendered here -->
                </div>
            </details>
        `;
    }
    
    // --- Event Handling and State Management ---

    private attachEventListeners() {
        this.groupSelect.addEventListener('change', () => this.handleGroupChange());
        this.executeButton.addEventListener('click', () => this.handleExecuteCommand());
        
        // Listeners for X and Y coordinate inputs to update module state
        this.xInput.addEventListener('input', (e) => this.tileX = Number((e.target as HTMLInputElement).value) || 0);
        this.yInput.addEventListener('input', (e) => this.tileY = Number((e.target as HTMLInputElement).value) || 0);
    }

    /**
     * Attaches listeners to the dynamically rendered command cards.
     */
    private attachCardListeners(commands: ICommandStatic[]) {
        const cards = this.commandCardsContainer.querySelectorAll('.command-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const func = (e.currentTarget as HTMLElement).dataset.func;
                if (func) {
                    this.handleCommandCardClick(func);
                }
            });
        });
    }

    /**
     * Attaches listeners to the dynamically rendered parameter inputs.
     */
    private attachParameterListeners(currentParams: TComMessageParams) {
        const idSuffix = this.containerDiv.id;

        currentParams.forEach(paramDef => {
            const inputElement = document.getElementById(`input-${paramDef.key}-${idSuffix}`);
            if (inputElement) {
                if (paramDef.type === 'boolean') {
                    // For checkboxes
                    inputElement.addEventListener('change', (e) => {
                        const isChecked = (e.target as HTMLInputElement).checked;
                        this.paramValueStore.set(paramDef.key, isChecked);
                        this.updateCommandDisplay();
                    });
                } else {
                    // For number and string inputs
                    inputElement.addEventListener('input', (e) => {
                        let value: string | number | boolean = (e.target as HTMLInputElement).value;
                        if (paramDef.type === 'number') {
                            // Convert to number, but handle empty string by setting it back to the default/null/0
                            value = (value === '' || isNaN(Number(value))) ? '' : Number(value); 
                        }
                        this.paramValueStore.set(paramDef.key, value);
                        this.updateCommandDisplay();
                    });
                }
            }
        });
    }

    /**
     * Handles the change event for the command group selection.
     */
    private handleGroupChange(): void {
        const newGroup = this.groupSelect.value;
        this.currentCommandGroup = newGroup;
        this.renderCommandCards();
        
        // Auto-select the first command in the new group, or clear if none
        const firstCommandFunc = this.commandGroupRegistry.get(newGroup)?.[0]?.func || '';
        this.currentCommandFunc = firstCommandFunc;
        
        this.renderParameters();
    }
    
    /**
     * Handles the click event for a command card.
     */
    private handleCommandCardClick(func: string): void {
        if (this.currentCommandFunc === func) return; // Already selected

        this.currentCommandFunc = func;
        this.renderCommandCards(); // Re-render to update the selected card's style
        this.renderParameters(); // Renders the new set of inputs
    }
    
    /**
     * Generates and executes the command.
     */
    private handleExecuteCommand(): void {
        this.executeButton.disabled = true;
        
        // 1. Get the selected command class
        const CommandClass = this.commandMap.get(this.currentCommandFunc);
        if (!CommandClass) {
            this.updateCommandDisplay(`Error: Please select a command card.`, 'error');
            this.executeButton.disabled = false;
            return;
        }

        // 2. Build the final configuration object (IGlobalActionConfig extended)
        const currentCommandParams = CommandClass.params;
        const config: IComMessage = {
            func: this.currentCommandFunc,
            x: this.tileX,
            y: this.tileY,
            // Dynamically add all required parameters from the persistent store
            ...currentCommandParams.reduce((acc, param) => {
                // Read the current value from the store
                let value = this.paramValueStore.get(param.key); 
                
                // Ensure number types are correctly handled if input field was empty ('')
                if (param.type === 'number' && (value === '' || value === undefined)) {
                    // Fall back to the command's default if the input was cleared
                    value = CommandClass.defaults[param.key] ?? 0;
                }
                
                acc[param.key] = value;
                return acc;
            }, {} as Record<string, any>)
        } as IComMessage;

        // 3. Create the command instance using the factory
        const command = this.factory.createCommand(config);
        
        // 4. Call the execution handler
        if (this.onExecute) {
            this.onExecute(command);
        }
        
        if (command) {
            console.log("--- COMMAND EXECUTED ---");
            console.log(`Command Name: ${CommandClass.name}`);
            console.log("Config:", config);
            // command.execute(someDispatcherInstance);
            this.updateCommandDisplay(`Successfully generated and "executed" ${CommandClass.name} at (${this.tileX}, ${this.tileY})!`, 'success');
        } else {
             this.updateCommandDisplay(`Failed to create command for ${this.currentCommandFunc}. Check factory logic.`, 'error');
        }

        this.executeButton.disabled = false;
    }

    private updateCommandDisplay(message?: string, type: 'success' | 'error' | 'default' = 'default'): void {
        const idSuffix = this.containerDiv.id;
        const displayElement = this.containerDiv.querySelector(`#current-command-display-${idSuffix}`) as HTMLElement;
        let className = `message-display message-${type}`;

        if (message) {
            displayElement.textContent = message;
            displayElement.className = className;
        } else {
             const currentCommand = this.commandMap.get(this.currentCommandFunc);
             if (!currentCommand) {
                displayElement.textContent = 'Select a command to see configuration preview.';
                displayElement.className = 'message-display message-default';
                return;
             }

             const paramValues = currentCommand.params.reduce((acc, param) => {
                 const value = this.paramValueStore.get(param.key);
                 if (value !== undefined) {
                     acc.push(`${param.key}=${JSON.stringify(value)}`);
                 }
                 return acc;
             }, [] as string[]).join(', ');

            displayElement.textContent = `Selected Command: ${currentCommand.name} | Target: (${this.tileX}, ${this.tileY}) | Params: { ${paramValues} }`;
            displayElement.className = className;
        }
    }
}


// --- Example setup for running the class ---

export function initializeActionInterfaceModule(
    container_id : string = "action-interface-container"
) {
    const container = document.getElementById(container_id);
    if (!container) {
        const tempDiv = document.createElement('div');
        tempDiv.id = container_id;
        document.body.appendChild(tempDiv);
    }

    const interfaceInstance = new InterfaceModule({
        divId: container_id,
    });
    interfaceInstance.setHandlers({
        onExecute: (command: ICommand | null ) => {
            if (command) {
                console.log("Interface Module: Dispatching command:", command);
            }
        },
    })
    
    // Set a default coordinate, as if the user clicked the map
    interfaceInstance.setCoordinates(2, 5); 

    return interfaceInstance;
}