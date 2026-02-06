// web/jsP/pallet/MenuIconModule.ts
var MenuIconModule = class {
  containerDiv;
  menuIconList;
  // Map to store all icon configurations for easy access
  iconConfigs = /* @__PURE__ */ new Map();
  // Map to track the currently active linkedDivId for each group
  // Key: group name (string), Value: linkedDivId (string)
  activeGroupMap = /* @__PURE__ */ new Map();
  constructor(params) {
    const container = document.getElementById(params.divId);
    if (!container) {
      throw new Error(`DOM element with ID "${params.divId}" not found.`);
    }
    this.containerDiv = container;
    this.containerDiv.innerHTML = this.getInitialStyles();
    const menuIconListElement = this.containerDiv.querySelector(".menu-icon-list");
    if (!menuIconListElement) {
      throw new Error("Could not find '.menu-icon-list' element after setup.");
    }
    this.menuIconList = menuIconListElement;
  }
  /**
   * Internal CSS styles for the module elements.
   */
  getInitialStyles() {
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
  addIcon(label, linkedDivId, group, callClick) {
    const key = `${group}:${label}`;
    if (this.iconConfigs.has(key)) {
      console.warn(`Icon with key '${key}' already exists. Skipping.`);
      return;
    }
    const config = { label, linkedDivId, group, callClick };
    this.iconConfigs.set(key, config);
    const iconElement = document.createElement("a");
    iconElement.textContent = label;
    iconElement.href = "javascript:void(0)";
    iconElement.dataset.linkedDivId = linkedDivId;
    iconElement.dataset.group = group;
    const linkedElement = document.getElementById(linkedDivId);
    if (linkedElement) {
      linkedElement.style.display = "none";
    } else {
      console.warn(`Linked div with ID "${linkedDivId}" not found in the document.`);
    }
    iconElement.addEventListener("click", () => this.handleIconClick(iconElement, config));
    this.menuIconList.appendChild(iconElement);
  }
  /**
   * Handles the click event for an icon, running the optional callback, 
   * toggling the visibility of linked elements, and updating the icon's active state.
   * @param clickedIcon The HTML anchor element that was clicked.
   * @param config The configuration object for the clicked icon.
   */
  handleIconClick(clickedIcon, config) {
    const group = config.group;
    const linkedDivId = config.linkedDivId;
    const currentActiveDivId = this.activeGroupMap.get(group);
    const linkedDiv = document.getElementById(linkedDivId);
    if (!linkedDiv)
      return;
    const groupIcons = this.menuIconList.querySelectorAll(`a[data-group="${group}"]`);
    if (currentActiveDivId === linkedDivId) {
      linkedDiv.style.display = "none";
      clickedIcon.classList.remove("active");
      this.activeGroupMap.delete(group);
      console.log(`Deactivated: ${linkedDivId} (Group: ${group})`);
    } else {
      if (currentActiveDivId) {
        const oldLinkedDiv = document.getElementById(currentActiveDivId);
        if (oldLinkedDiv) {
          oldLinkedDiv.style.display = "none";
        }
        groupIcons.forEach((icon) => {
          if (icon.dataset.linkedDivId === currentActiveDivId) {
            icon.classList.remove("active");
          }
        });
      }
      linkedDiv.style.display = "block";
      clickedIcon.classList.add("active");
      this.activeGroupMap.set(group, linkedDivId);
      console.log(`Activated: ${linkedDivId} (Group: ${group})`);
    }
    const willBeActive = currentActiveDivId !== linkedDivId;
    if (config.callClick) {
      config.callClick(linkedDivId, willBeActive);
    }
  }
};

// web/jsWorker/main.ts
var editorMenu = new MenuIconModule({
  divId: "menu-icon-container"
});
editorMenu.addIcon("I", "isogame-module", "main-content");
editorMenu.addIcon("T", "isometric-grid-container", "main-content");
editorMenu.addIcon("S", "sheet-editor-module", "main-content");
editorMenu.addIcon("M", "menu2", "action-content");
var gameWorker = new Worker(
  new URL("./mainWorker.ts", import.meta.url).href,
  {
    type: "module"
  }
);
var canvasImageMap = document.getElementById(
  "map-image"
);
var gridMapDrawer = null;
var iFrame = 0;
var _shouldRun = true;
function frameTick() {
  if (gridMapDrawer) {
    gridMapDrawer.updateGrid();
  }
}
function updateFrame() {
  iFrame = (iFrame + 1) % 1028;
  if (iFrame % 4 == 0) {
    frameTick();
  }
  requestAnimationFrame(updateFrame);
}
function startLoop() {
  console.log("GameWorker: # START #");
  _shouldRun = true;
  updateFrame();
}
startLoop();
