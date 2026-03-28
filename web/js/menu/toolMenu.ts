// Tool Menu UI - Main thread
// Following the flyMenu.ts pattern

interface MapToolInfo {
  id: string;
  name: string;
  icon: string;
  category: string;
}

const categories = ["terrain", "color", "asset", "structure", "inspect"] as const;
const brushSizes = [1, 3, 5, 9] as const;

let activeCategory: string = "terrain";
let activeToolId: string | null = null;
let activeBrushSize: number = 1;
let activeColor: string = "#808080"; // Default gray
let toolsByCategory: Map<string, MapToolInfo[]> = new Map();
let assetGroups: Array<{ group: string; images: string[] }> = [];
let activeAssetId: string | null = null;
let selectedAssetGroup: string | null = null;

export const initToolMenu = (gameWorker: Worker) => {
  const toolMenuEl = document.getElementById("toolMenu") as HTMLElement;
  if (!toolMenuEl) return;

  renderToolMenu(toolMenuEl, gameWorker);
};

function renderToolMenu(container: HTMLElement, gameWorker: Worker) {
  container.innerHTML = `
    <div id="toolMenuHeader">
      <span id="toolMenuTitle">Tools</span>
    </div>
    <div id="toolCategoryTabs">
      ${categories.map(cat => `
        <button class="category-tab ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
          ${capitalizeFirst(cat)}
        </button>
      `).join('')}
    </div>
    <div id="toolList"></div>
    <div id="assetBrowser" style="display: ${activeCategory === 'asset' ? 'block' : 'none'}">
      <div id="assetGroupList"></div>
      <div id="assetImageList"></div>
    </div>
    <div id="selectedAssetCard" style="display: ${activeAssetId ? 'block' : 'none'}">
      <span id="selectedAssetLabel">${activeAssetId || 'No asset selected'}</span>
    </div>
    <div id="toolColorPicker" style="display: ${activeCategory === 'color' ? 'flex' : 'none'}">
      <span>Color:</span>
      <input type="color" id="colorPickerInput" value="${activeColor}">
      <span id="colorHex">${activeColor}</span>
    </div>
    <div id="toolBrushSize">
      <span>Brush:</span>
      ${brushSizes.map(size => `
        <button class="brush-btn ${size === activeBrushSize ? 'active' : ''}" data-size="${size}">
          ${size}×${size}
        </button>
      `).join('')}
    </div>
    <div id="toolActiveDisplay">
      <span id="activeToolLabel">No tool selected</span>
    </div>
  `;

  // Category tab click handlers
  container.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const category = (tab as HTMLElement).dataset.category!;
      setActiveCategory(category, container, gameWorker);
    });
  });

  // Color picker handler
  const colorPickerInput = container.querySelector('#colorPickerInput') as HTMLInputElement;
  if (colorPickerInput) {
    colorPickerInput.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      setActiveColor(color, container, gameWorker);
    });
  }

  // Brush size click handlers
  container.querySelectorAll('.brush-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = parseInt((btn as HTMLElement).dataset.size!);
      setActiveBrushSize(size, container, gameWorker);
    });
  });
}

function setActiveCategory(category: string, container: HTMLElement, gameWorker: Worker) {
  activeCategory = category;

  // Update tab active state
  container.querySelectorAll('.category-tab').forEach(tab => {
    const tabCat = (tab as HTMLElement).dataset.category;
    tab.classList.toggle('active', tabCat === category);
  });

  // Show/hide color picker
  const colorPickerEl = container.querySelector('#toolColorPicker') as HTMLElement;
  if (colorPickerEl) {
    colorPickerEl.style.display = category === 'color' ? 'flex' : 'none';
  }

  // Show/hide asset browser
  const assetBrowserEl = container.querySelector('#assetBrowser') as HTMLElement;
  if (assetBrowserEl) {
    assetBrowserEl.style.display = category === 'asset' ? 'block' : 'none';
  }

  // Re-render tool list for this category
  renderToolList(container, gameWorker);

  // Render asset browser if in asset category
  if (category === 'asset') {
    renderAssetBrowser(container, gameWorker);
  }
}

function setActiveColor(color: string, container: HTMLElement, gameWorker: Worker) {
  activeColor = color;

  // Update color hex display
  const colorHexEl = container.querySelector('#colorHex') as HTMLElement;
  if (colorHexEl) {
    colorHexEl.textContent = color;
  }

  // Convert hex to RGB and send to worker
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  gameWorker.postMessage({
    action: "setColor",
    r: r,
    g: g,
    b: b,
  });
}

function setActiveBrushSize(size: number, container: HTMLElement, gameWorker: Worker) {
  activeBrushSize = size;

  // Update brush button active state
  container.querySelectorAll('.brush-btn').forEach(btn => {
    const btnSize = parseInt((btn as HTMLElement).dataset.size!);
    btn.classList.toggle('active', btnSize === size);
  });

  // Send to worker
  gameWorker.postMessage({
    action: "setBrushSize",
    size: size,
  });
}

function renderToolList(container: HTMLElement, gameWorker: Worker) {
  const toolListEl = container.querySelector('#toolList') as HTMLElement;
  if (!toolListEl) return;

  const tools = toolsByCategory.get(activeCategory) || [];

  if (tools.length === 0) {
    toolListEl.innerHTML = `<div class="tool-empty">No tools in this category</div>`;
    return;
  }

  toolListEl.innerHTML = tools.map(tool => `
    <button class="tool-btn ${tool.id === activeToolId ? 'active' : ''}" data-tool-id="${tool.id}">
      <span class="tool-icon">${tool.icon}</span>
      <span class="tool-name">${tool.name}</span>
    </button>
  `).join('');

  // Tool button click handlers
  toolListEl.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = (btn as HTMLElement).dataset.toolId!;
      setActiveTool(toolId, container, gameWorker);
    });
  });
}

function setActiveTool(toolId: string, container: HTMLElement, gameWorker: Worker) {
  activeToolId = toolId;

  // Update tool button active state
  container.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.toolId === toolId);
  });

  // Send to worker
  gameWorker.postMessage({
    action: "setActiveTool",
    toolId: toolId,
  });

  // Update active tool display
  updateActiveToolDisplay(container);
}

function updateActiveToolDisplay(container: HTMLElement) {
  const labelEl = container.querySelector('#activeToolLabel') as HTMLElement;
  if (!labelEl) return;

  if (!activeToolId) {
    labelEl.textContent = 'No tool selected';
    return;
  }

  const allTools = Array.from(toolsByCategory.values()).flat();
  const tool = allTools.find(t => t.id === activeToolId);

  if (tool) {
    labelEl.textContent = `${tool.icon} ${tool.name} (${activeBrushSize}×${activeBrushSize})`;
  }
}

// Called when worker sends tool list
export function handleToolList(tools: MapToolInfo[], container?: HTMLElement) {
  // Organize tools by category
  toolsByCategory.clear();
  for (const cat of categories) {
    toolsByCategory.set(cat, []);
  }

  for (const tool of tools) {
    const catTools = toolsByCategory.get(tool.category);
    if (catTools) {
      catTools.push(tool);
    }
  }

  // Re-render if container is available
  const toolMenuEl = container || document.getElementById('toolMenu');
  if (toolMenuEl) {
    renderToolList(toolMenuEl as HTMLElement, self as any);
  }
}

// Called when tool execution completes
export function handleToolExecuted(toolId: string, success: boolean) {
  const toolMenuEl = document.getElementById('toolMenu');
  if (!toolMenuEl) return;

  // Flash the active tool button
  const activeBtn = toolMenuEl.querySelector(`.tool-btn[data-tool-id="${toolId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('executed');
    setTimeout(() => activeBtn.classList.remove('executed'), 200);
  }
}

// Called when eyedropper picks a color from the map
export function handlePickedColor(r: number, g: number, b: number) {
  const toolMenuEl = document.getElementById('toolMenu');
  if (!toolMenuEl) return;

  // Convert RGB to hex
  const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  
  // Update the color picker input
  const colorPickerInput = toolMenuEl.querySelector('#colorPickerInput') as HTMLInputElement;
  if (colorPickerInput) {
    colorPickerInput.value = hex;
  }

  // Update the hex display
  const colorHexEl = toolMenuEl.querySelector('#colorHex') as HTMLElement;
  if (colorHexEl) {
    colorHexEl.textContent = hex;
  }

  // Update active color state
  activeColor = hex;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Render asset browser with tree of asset groups
function renderAssetBrowser(container: HTMLElement, gameWorker: Worker) {
  const assetGroupListEl = container.querySelector('#assetGroupList') as HTMLElement;
  const assetImageListEl = container.querySelector('#assetImageList') as HTMLElement;
  
  if (!assetGroupListEl || !assetImageListEl) return;

  if (assetGroups.length === 0) {
    assetGroupListEl.innerHTML = '<div class="asset-empty">Loading assets...</div>';
    assetImageListEl.innerHTML = '';
    return;
  }

  // Render group list
  assetGroupListEl.innerHTML = `
    <div class="asset-group-header">Asset Groups</div>
    ${assetGroups.map(group => `
      <button class="asset-group-btn ${group.group === selectedAssetGroup ? 'active' : ''}" data-group="${group.group}">
        ${group.group} (${group.images.length})
      </button>
    `).join('')}
  `;

  // Group button click handlers
  assetGroupListEl.querySelectorAll('.asset-group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = (btn as HTMLElement).dataset.group!;
      selectedAssetGroup = group;
      renderAssetBrowser(container, gameWorker);
    });
  });

  // Render images for selected group
  if (selectedAssetGroup) {
    const group = assetGroups.find(g => g.group === selectedAssetGroup);
    if (group) {
      assetImageListEl.innerHTML = `
        <div class="asset-image-header">${group.group}</div>
        <div class="asset-image-grid">
          ${group.images.map(image => `
            <button class="asset-image-btn ${image === activeAssetId ? 'active' : ''}" data-asset="${image}">
              ${image}
            </button>
          `).join('')}
        </div>
      `;

      // Image button click handlers
      assetImageListEl.querySelectorAll('.asset-image-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const assetId = (btn as HTMLElement).dataset.asset!;
          setActiveAsset(assetId, container, gameWorker);
        });
      });
    }
  } else {
    assetImageListEl.innerHTML = '<div class="asset-empty">Select a group</div>';
  }
}

// Set active asset
function setActiveAsset(assetId: string, container: HTMLElement, gameWorker: Worker) {
  activeAssetId = assetId;

  // Update selected asset card
  const selectedAssetCardEl = container.querySelector('#selectedAssetCard') as HTMLElement;
  const selectedAssetLabelEl = container.querySelector('#selectedAssetLabel') as HTMLElement;
  if (selectedAssetCardEl && selectedAssetLabelEl) {
    selectedAssetCardEl.style.display = 'block';
    selectedAssetLabelEl.textContent = `📦 ${assetId}`;
  }

  // Update asset image button active state
  container.querySelectorAll('.asset-image-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.asset === assetId);
  });

  // Send to worker
  gameWorker.postMessage({
    action: "setActiveAsset",
    assetId: assetId,
  });
}

// Called when worker sends asset groups
export function handleAssetGroups(groups: Array<{ group: string; images: string[] }>, container?: HTMLElement) {
  assetGroups = groups;
  
  // Select first group by default
  if (groups.length > 0 && !selectedAssetGroup) {
    selectedAssetGroup = groups[0].group;
  }

  // Re-render asset browser if in asset category
  const toolMenuEl = container || document.getElementById('toolMenu');
  if (toolMenuEl && activeCategory === 'asset') {
    renderAssetBrowser(toolMenuEl as HTMLElement, self as any);
  }
}
