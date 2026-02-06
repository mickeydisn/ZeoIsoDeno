// =========================================================================
// === MenuIconModule.ts ===
// =========================================================================

/**
 * Defines the parameters for a menu icon button.
 */
interface IconConfig {
    label: string;
    linkedDivId: string; // The ID of the div element to toggle visibility
    group: string;       // The group name (only one linkedDiv can be block per group)
    // NEW: Optional function to execute when the icon is clicked
    callClick?: (linkedDivId: string, isActive: boolean) => void;
}

/**
 * Defines the parameters for initializing the MenuIconModule.
 */
export interface MenuIconModuleParams {
    divId: string; // The ID of the container div for the menu
}

export class MenuIconModule {
    private containerDiv: HTMLElement;
    private menuIconList: HTMLElement;
    // Map to store all icon configurations for easy access
    private iconConfigs: Map<string, IconConfig> = new Map();
    // Map to track the currently active linkedDivId for each group
    // Key: group name (string), Value: linkedDivId (string)
    private activeGroupMap: Map<string, string> = new Map();

    constructor(params: MenuIconModuleParams) {
        const container = document.getElementById(params.divId);
        if (!container) {
            throw new Error(`DOM element with ID "${params.divId}" not found.`);
        }

        this.containerDiv = container;
        this.containerDiv.innerHTML = this.getInitialStyles();
        
        const menuIconListElement = this.containerDiv.querySelector('.menu-icon-list');
        if (!menuIconListElement) {
             throw new Error("Could not find '.menu-icon-list' element after setup.");
        }
        this.menuIconList = menuIconListElement as HTMLElement;
    }

    /**
     * Internal CSS styles for the module elements.
     */
    private getInitialStyles(): string {
        return `
            <style>
                /* --- Custom styles based on request --- */
                .menu-icon-list {
                    position: absolute;
                    top: 10px;
                    right: 60px;
                    display: flex; /* Arrange icons horizontally */
                    gap: 5px; /* Spacing between icons */
                }
                .menu-icon-list > a {
                    /* Common styles for all icons */
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    background: white;
                    border-radius: 5px;
                    text-align: center;
                    line-height: 30px;
                    font-weight: bold;
                    color: black;
                    text-decoration: none; /* Remove underline from <a> */
                    display: inline-block; /* Required for width/height */
                    transition: background-color 0.2s;
                }
                /* Style for the active/selected icon */
                .menu-icon-list > a.active {
                    background-color: #e67e22; /* Use a color to indicate active state */
                    color: white;
                }
            </style>
            <div class="menu-icon-list">
                </div>
        `;
    }

    /**
     * PUBLIC METHOD: Adds a new icon to the menu and sets up its functionality.
     * @param label The text label to display on the icon (e.g., 'A', 'B').
     * @param linkedDivId The ID of the DOM element to show/hide.
     * @param group The group this icon belongs to (only one per group can be visible).
     * @param callClick OPTIONAL: A function to run when the icon is clicked. 
     * It receives the linkedDivId and the *current* active state (true if active, false if not).
     */
    public addIcon(
        label: string, 
        linkedDivId: string, 
        group: string, 
        // NEW: Optional parameter for the click callback
        callClick?: (linkedDivId: string, isActive: boolean) => void 
    ): void {
        const key = `${group}:${label}`;
        
        if (this.iconConfigs.has(key)) {
            console.warn(`Icon with key '${key}' already exists. Skipping.`);
            return;
        }

        // 1. Store the configuration, including the optional callback
        const config: IconConfig = { label, linkedDivId, group, callClick };
        this.iconConfigs.set(key, config);

        // 2. Create the icon element
        const iconElement = document.createElement('a');
        iconElement.textContent = label;
        iconElement.href = 'javascript:void(0)'; // Prevent page reload/scroll
        iconElement.dataset.linkedDivId = linkedDivId; // Store data for click handler
        iconElement.dataset.group = group;

        // 3. Set the initial state of the linked element to 'none'
        const linkedElement = document.getElementById(linkedDivId);
        if (linkedElement) {
             linkedElement.style.display = 'none';
        } else {
            console.warn(`Linked div with ID "${linkedDivId}" not found in the document.`);
        }

        // 4. Attach the click event handler
        iconElement.addEventListener('click', () => this.handleIconClick(iconElement, config));

        // 5. Append to the menu
        this.menuIconList.appendChild(iconElement);
    }

    /**
     * Handles the click event for an icon, running the optional callback, 
     * toggling the visibility of linked elements, and updating the icon's active state.
     * @param clickedIcon The HTML anchor element that was clicked.
     * @param config The configuration object for the clicked icon.
     */
    private handleIconClick(clickedIcon: HTMLAnchorElement, config: IconConfig): void {
        const group = config.group;
        const linkedDivId = config.linkedDivId;
        const currentActiveDivId = this.activeGroupMap.get(group);
        

        const linkedDiv = document.getElementById(linkedDivId);
        if (!linkedDiv) return;

        // Find all icons in the current group
        const groupIcons = this.menuIconList.querySelectorAll(`a[data-group="${group}"]`) as NodeListOf<HTMLAnchorElement>;

        if (currentActiveDivId === linkedDivId) {
            // Case 1: The active icon for this group was clicked -> DEACTIVATE/TOGGLE OFF
            
            // Hide the linked div
            linkedDiv.style.display = 'none';
            // Deactivate the icon style
            clickedIcon.classList.remove('active');
            // Update the group map
            this.activeGroupMap.delete(group);
            
            console.log(`Deactivated: ${linkedDivId} (Group: ${group})`);
            
        } else {
            // Case 2: A new icon was clicked -> ACTIVATE NEW / DEACTIVATE OLD
            
            // a. Deactivate the old element/icon in the group (if one exists)
            if (currentActiveDivId) {
                const oldLinkedDiv = document.getElementById(currentActiveDivId);
                if (oldLinkedDiv) {
                    oldLinkedDiv.style.display = 'none';
                }
                
                // Remove 'active' class from the old active icon
                groupIcons.forEach(icon => {
                    if (icon.dataset.linkedDivId === currentActiveDivId) {
                        icon.classList.remove('active');
                    }
                });
            }

            // b. Activate the new element/icon
            
            // Show the new linked div
            linkedDiv.style.display = 'block';
            // Activate the new icon style
            clickedIcon.classList.add('active');
            // Update the group map
            this.activeGroupMap.set(group, linkedDivId);
            
            console.log(`Activated: ${linkedDivId} (Group: ${group})`);
        }

        // Determine the target state BEFORE processing the module's logic
        const willBeActive = currentActiveDivId !== linkedDivId;

        // --- NEW: Execute the optional click callback ---
        if (config.callClick) {
            // Pass the target linkedDivId and the state it *will* become (true for activate, false for deactivate/toggle off)
            config.callClick(linkedDivId, willBeActive); 
        }
        // ------------------------------------------------
        
    }
}
  

// --- Example setup for running the class (optional for external usage) ---
/*
// Assuming a container div is in the document with id="menu-container"
// and other linked divs with id="tools-div", id="settings-div", id="info-div"
document.addEventListener('DOMContentLoaded', () => {
    const editorMenu = new MenuIconModule({
        divId: "menu-icon-container"
    });

    // Add elements to the document body for demonstration (if they don't exist)
    const createDummyDiv = (id: string, content: string) => {
        let div = document.getElementById(id);
        if (!div) {
            div = document.createElement('div');
            div.id = id;
            div.style.cssText = 'position: absolute; top: 50px; left: 10px; padding: 10px; background: #34495e; color: white; border-radius: 4px; z-index: 1000;';
            div.innerHTML = content;
            document.body.appendChild(div);
        }
        return div;
    };

    createDummyDiv('tools-div', '<h2>Tools Panel</h2>');
    createDummyDiv('settings-div', '<h2>Settings Panel</h2>');
    createDummyDiv('info-div', '<h2>Information Panel</h2>');
    createDummyDiv('help-div', '<h2>Help Section</h2>');

    // Add icons to the menu module
    editorMenu.addIcon('T', 'tools-div', 'primary-tools');
    editorMenu.addIcon('S', 'settings-div', 'primary-tools'); // 'S' and 'T' are in the same group, so only one can be shown.
    
    editorMenu.addIcon('i', 'info-div', 'secondary-info'); // 'i' is in a different group and can be shown alongside 'T' or 'S'.
    editorMenu.addIcon('?', 'help-div', 'secondary-info'); // '?' and 'i' are in the same group, so only one can be shown.

    console.log("MenuIconModule initialized with demo icons.");
});
*/