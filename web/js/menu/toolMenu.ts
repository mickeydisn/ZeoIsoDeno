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
let toolsByCategory: Map<string, MapToolInfo[]> = new Map();

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

  // Re-render tool list for this category
  renderToolList(container, gameWorker);
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

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}