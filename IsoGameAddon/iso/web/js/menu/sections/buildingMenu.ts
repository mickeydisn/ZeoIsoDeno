// Main thread (e.g., main.ts)
// Rebuilt building menu with dialog-based configuration editor.
// Displays building config list, allows editing parameters, shows JSON preview
// and asset previews, then places the building on click.

import { DialogManager } from "../dialog.ts";
import { MenuTab } from "../headMenu.ts";
import { MessageHandler } from "../../../../../../IsoGame/etc/handlers/messageHandler.ts";

// ============================================================================
// GLOBAL STATE
// ============================================================================

interface BuildingConfigInfo {
  id: string;
  name: string;
  description: string;
  defaultGrowLoop: number;
  defaultEndLoop: number;
}

let gameWorker: Worker;
let handler: MessageHandler<any, any, any>;

// Track building configuration state locally
let selectedBuildingId: string = "";
let growSizeValue: number = 20;
let endLoopValue: number = 100;
let cachedFullConfigs: Record<string, object> = {};

// ============================================================================
// HANDLERS
// ============================================================================

function sendSetBuildingConfig(configId: string) {
  gameWorker.postMessage({ action: "setBuildingConfig", configId });
}

function sendSetBuildingParams(growLoop: number) {
  gameWorker.postMessage({ action: "setBuildingParams", growLoop });
}

function sendSetActiveTool() {
  gameWorker.postMessage({ action: "setActiveTool", toolId: "place_building" });
}

// ============================================================================
// FETCH BUILDING CONFIG LIST AND FULL CONFIGS FROM WORKER
// ============================================================================

async function fetchBuildingConfigList(): Promise<BuildingConfigInfo[]> {
  try {
    const response = await handler.sendMessageWithResponse({
      action: "getBuildingConfigList",
    }) as { result?: { configs: BuildingConfigInfo[] } };
    return response?.result?.configs ?? [];
  } catch {
    return [];
  }
}

async function fetchFullConfig(configId: string): Promise<object | null> {
  // Cache hit
  if (cachedFullConfigs[configId]) return cachedFullConfigs[configId];
  try {
    const response = await handler.sendMessageWithResponse({
      action: "getFullBuildingConfig",
      configId,
    }) as { result?: { config: object } };
    const config = response?.result?.config ?? null;
    if (config) cachedFullConfigs[configId] = config;
    return config;
  } catch {
    return null;
  }
}

// ============================================================================
// RENDER ASSET PREVIEWS FOR A BUILDING CONFIG
// ============================================================================

/**
 * Renders a grid of small asset previews from the building configuration JSON.
 * The assets are identified by their `key + sufix` in the tile configs.
 */
function renderAssetPreviewGrid(
  container: HTMLElement,
  configJson: string,
): void {
  container.innerHTML = "<div style='opacity:0.6;font-size:0.8rem;'>Loading asset previews...</div>";

  try {
    const parsed = JSON.parse(configJson);
    // Collect unique asset keys from the configuration
    const assetKeys = new Set<string>();

    // Walk through startTiles and tileOptions to find asset references
    if (parsed.startTileOptions) {
      for (const tile of parsed.startTileOptions) {
        if (tile.assets) {
          for (const asset of tile.assets) {
            const key = (asset.key || "") + (asset.sufix || "");
            if (key) assetKeys.add(key);
          }
        }
      }
    }
    if (parsed.listTileOptions) {
      for (const tile of parsed.listTileOptions) {
        if (tile.assets) {
          for (const asset of tile.assets) {
            const key = (asset.key || "") + (asset.sufix || "");
            if (key) assetKeys.add(key);
          }
        }
      }
    }

    if (assetKeys.size === 0) {
      container.innerHTML = "<div style='opacity:0.5;font-size:0.8rem;'>No specific assets referenced.</div>";
      return;
    }

    container.innerHTML = "";
    const grid = document.createElement("div");
    grid.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px;max-height:200px;overflow-y:auto;";

    for (const key of assetKeys) {
      const assetBox = document.createElement("div");
      assetBox.style.cssText =
        "display:flex;flex-direction:column;align-items:center;padding:4px;background:#333;border-radius:4px;";
      const label = document.createElement("span");
      label.textContent = key.length > 20 ? key.slice(0, 18) + ".." : key;
      label.style.cssText = "font-size:0.6rem;opacity:0.7;text-align:center;word-break:break-all;";
      assetBox.appendChild(label);
      grid.appendChild(assetBox);
    }

    container.appendChild(grid);
  } catch {
    container.innerHTML = "<div style='opacity:0.5;font-size:0.8rem;'>Could not parse config for asset preview.</div>";
  }
}

// ============================================================================
// DIALOG HELPER — format JSON with syntax highlighting
// ============================================================================

function syntaxHighlightJson(json: string): string {
  return json.replace(
    /("(?:[^"\\]|\\.)*")\s*:/g,
    '<span style="color:#7cf;">$1</span>:',
  ).replace(
    /:\s*("(?:[^"\\]|\\.)*")/g,
    ': <span style="color:#afa;">$1</span>',
  ).replace(
    /:\s*(\d+(?:\.\d+)?)/g,
    ': <span style="color:#faa;">$1</span>',
  ).replace(
    /:\s*(true|false|null)/g,
    ': <span style="color:#aaf;">$1</span>',
  );
}

// ============================================================================
// DIALOG: BUILDING CONFIGURATION EDITOR
// ============================================================================

async function openBuildingDialog(): Promise<void> {
  const dialog = DialogManager.getInstance();
  const configs = await fetchBuildingConfigList();

  if (configs.length === 0) {
    dialog.setContent(`
      <div style="padding:20px;color:#fff;font-family:monospace;text-align:center;">
        <h2>🏡 Building Configs</h2>
        <p style="opacity:0.6;">No building configurations available.</p>
        <button onclick="document.getElementById('mainDialog')?.close()" 
          style="padding:8px 16px;border:none;border-radius:4px;background:#555;color:#fff;cursor:pointer;margin-top:12px;">
          Close
        </button>
      </div>
    `);
    dialog.open(true);
    return;
  }

  // If no building selected, default to first
  if (!selectedBuildingId || !configs.find(c => c.id === selectedBuildingId)) {
    selectedBuildingId = configs[0].id;
    growSizeValue = configs[0].defaultGrowLoop;
    endLoopValue = configs[0].defaultEndLoop;
  }

  // Track current editing state for this dialog session
  let currentConfigId = selectedBuildingId;
  let currentGrowLoop = growSizeValue;
  let currentEndLoop = endLoopValue;
  let currentConfigJson = "";

  // Helper to update JSON preview from current state
  function buildConfigJson(): string {
    const config = configs.find(c => c.id === currentConfigId);
    if (!config) return "{}";
    return JSON.stringify({
      id: config.id,
      name: config.name,
      description: config.description,
      growLoopCount: currentGrowLoop,
      endLoopMax: currentEndLoop,
    }, null, 2);
  }

  // Create dialog content
  const container = document.createElement("div");
  container.style.cssText =
    "display:flex;flex-direction:column;gap:12px;padding:16px;color:#fff;font-family:monospace;max-height:80vh;overflow-y:auto;";

  // ---- Header ----
  const header = document.createElement("h2");
  header.textContent = "🏡 Building Configuration";
  header.style.cssText = "margin:0;font-size:1.2rem;";
  container.appendChild(header);

  // ---- Config Selector ----
  const selectRow = document.createElement("div");
  selectRow.style.cssText = "display:flex;gap:8px;align-items:center;";
  const selectLabel = document.createElement("label");
  selectLabel.textContent = "Building Type:";
  const select = document.createElement("select");
  select.style.cssText =
    "flex:1;padding:6px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#fff;";
  for (const config of configs) {
    const opt = document.createElement("option");
    opt.value = config.id;
    opt.textContent = `${config.name} — ${config.description.slice(0, 60)}${config.description.length > 60 ? "…" : ""}`;
    if (config.id === currentConfigId) opt.selected = true;
    select.appendChild(opt);
  }
  selectRow.appendChild(selectLabel);
  selectRow.appendChild(select);
  container.appendChild(selectRow);

  // ---- Description ----
  const descEl = document.createElement("div");
  descEl.style.cssText = "font-size:0.85rem;opacity:0.75;padding:4px 0;";
  const currentConfig = configs.find(c => c.id === currentConfigId);
  descEl.textContent = currentConfig?.description ?? "";
  container.appendChild(descEl);

  // ---- Grow Loop Slider ----
  const growRow = document.createElement("div");
  growRow.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  const growHeader = document.createElement("div");
  growHeader.style.cssText = "display:flex;justify-content:space-between;";
  const growLabel = document.createElement("span");
  growLabel.textContent = "Grow Size (tiles):";
  const growValue = document.createElement("span");
  growValue.textContent = String(currentGrowLoop);
  growHeader.appendChild(growLabel);
  growHeader.appendChild(growValue);
  growRow.appendChild(growHeader);
  const growInput = document.createElement("input");
  growInput.type = "range";
  growInput.min = "5";
  growInput.max = "300";
  growInput.step = "5";
  growInput.value = String(currentGrowLoop);
  growInput.style.cssText = "width:100%;accent-color:#4a7;";
  growInput.addEventListener("input", () => {
    currentGrowLoop = parseInt(growInput.value, 10);
    growValue.textContent = String(currentGrowLoop);
    jsonPreview.innerHTML = syntaxHighlightJson(buildConfigJson());
  });
  growRow.appendChild(growInput);
  container.appendChild(growRow);

  // ---- JSON Preview (full building config) ----
  const jsonLabel = document.createElement("strong");
  jsonLabel.textContent = "Full Configuration JSON:";
  jsonLabel.style.cssText = "margin-top:8px;";
  container.appendChild(jsonLabel);

  const jsonPreview = document.createElement("pre");
  jsonPreview.style.cssText =
    "background:#1a1a1a;border:1px solid #333;border-radius:4px;padding:8px;overflow:auto;max-height:300px;font-size:0.75rem;line-height:1.3;text-align:left;";
  // Fetch and display the full config
  fetchFullConfig(currentConfigId).then((full) => {
    if (full) {
      jsonPreview.innerHTML = syntaxHighlightJson(JSON.stringify(full, null, 2));
    } else {
      jsonPreview.innerHTML = buildConfigJson();
    }
  });
  container.appendChild(jsonPreview);

  // ---- Asset Previews ----
  const assetLabel = document.createElement("strong");
  assetLabel.textContent = "Assets used in this configuration:";
  container.appendChild(assetLabel);

  const assetGrid = document.createElement("div");
  assetGrid.style.cssText =
    "border:1px dashed #444;border-radius:4px;padding:8px;min-height:60px;";
  // Fetch full config for asset grid too
  fetchFullConfig(currentConfigId).then((full) => {
    if (full) {
      renderAssetPreviewGrid(assetGrid, syntaxHighlightJson(JSON.stringify(full, null, 2)));
    } else {
      renderAssetPreviewGrid(assetGrid, buildConfigJson());
    }
  });
  container.appendChild(assetGrid);

  // ---- Action Buttons ----
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:8px;margin-top:8px;";

  const selectAndPlaceBtn = document.createElement("button");
  selectAndPlaceBtn.textContent = "🏗️ Select & Place";
  selectAndPlaceBtn.style.cssText =
    "flex:1;padding:10px;border:none;border-radius:4px;background:#4a7;color:#fff;cursor:pointer;font-weight:bold;font-size:1rem;";
  selectAndPlaceBtn.addEventListener("click", () => {
    // Save to global state
    selectedBuildingId = currentConfigId;
    growSizeValue = currentGrowLoop;
    endLoopValue = currentEndLoop;

    // Send to worker
    sendSetBuildingConfig(currentConfigId);
    sendSetBuildingParams(currentGrowLoop);
    sendSetActiveTool();

    dialog.close();
  });

  const selectBtn = document.createElement("button");
  selectBtn.textContent = "💾 Select Only";
  selectBtn.style.cssText =
    "flex:1;padding:10px;border:none;border-radius:4px;background:#57a;color:#fff;cursor:pointer;font-weight:bold;font-size:1rem;";
  selectBtn.addEventListener("click", () => {
    selectedBuildingId = currentConfigId;
    growSizeValue = currentGrowLoop;
    endLoopValue = currentEndLoop;

    sendSetBuildingConfig(currentConfigId);
    sendSetBuildingParams(currentGrowLoop);

    dialog.close();
  });

  btnRow.appendChild(selectAndPlaceBtn);
  btnRow.appendChild(selectBtn);
  container.appendChild(btnRow);

  // ---- Close Button ----
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText =
    "padding:8px;border:none;border-radius:4px;background:#555;color:#fff;cursor:pointer;align-self:center;width:100px;";
  closeBtn.addEventListener("click", () => dialog.close());
  container.appendChild(closeBtn);

  // ---- Event: config selector change ----
  select.addEventListener("change", () => {
    currentConfigId = select.value;
    const config = configs.find(c => c.id === currentConfigId);
    if (config) {
      descEl.textContent = config.description;
      // Reset to defaults
      currentGrowLoop = config.defaultGrowLoop;
      currentEndLoop = config.defaultEndLoop;
      growInput.value = String(currentGrowLoop);
      growValue.textContent = String(currentGrowLoop);
      endInput.value = String(currentEndLoop);
      endValue.textContent = String(currentEndLoop);
    }
    jsonPreview.innerHTML = syntaxHighlightJson(buildConfigJson());
    renderAssetPreviewGrid(assetGrid, buildConfigJson());
  });

  // Mount and show
  dialog.setContent("");
  dialog.getElement()?.appendChild(container);
  dialog.open(true);
}

// ============================================================================
// MENU TAB EXPORT
// ============================================================================

export const buildingMenuTab = (
  gw: Worker,
  h: MessageHandler<any, any, any>,
) => {
  gameWorker = gw;
  handler = h;

  return {
    id: "building",
    icon: "🏡",
    sub: [
      {
        id: "configure",
        icon: "🏗️",
        callback_select: () => {
          openBuildingDialog();
        },
      },
      {
        id: "place",
        icon: "🏠",
        params: [
          {
            id: "growSize",
            type: "range",
            min: 5,
            max: 300,
            step: 5,
            default: growSizeValue,
            callback_change: (value) => {
              growSizeValue = Number(value);
              sendSetBuildingParams(growSizeValue);
            },
          },
        ],
        callback_select: () => {
          // Apply current config before activating tool
          if (selectedBuildingId) {
            sendSetBuildingConfig(selectedBuildingId);
            sendSetBuildingParams(growSizeValue);
          }
          sendSetActiveTool();
        },
      },
    ],
  } as MenuTab;
};