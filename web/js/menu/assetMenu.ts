// Main thread (e.g., main.ts)

import { MenuTab } from "./headMenu.ts";

export const assetMenuTab = (gameWorker: Worker) => {
  return{ 
    id: "Struct",  icon: "X" , 
    sub: [
      { 
        id: "clean_asset", 
        icon: "🧹", 
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: "clear_items"});
        },
        params: [{ id: "brushSize", type: "range", min: 1, max: 9, step: 2, default: 3, callback_change: (value) => {
              gameWorker.postMessage({
                action: "setBrushSize",
                size: value,
              });
            }},
        ],
      },
      { 
        id: "add_asset", 
        icon: "+", 
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: "place_asset"});
        },
        params: [
          { 
            id: "groupsList2",
            type:"div",
            mount: (container) => {
              container.innerHTML = `
                <div id="assetGroupList">  
                  <div class="asset-empty">Loading assets...</div>
                </div>
              `; 
            }
          },
          { 
            id: "assetsList2",
            type:"div",
            mount: (container) => {
              container.innerHTML = `
                <div id="assetImageList">  
                  <div class="asset-empty">Loading assets...</div>
                </div>
              `; 
            }
          },      
          { 
          id: "assetBox2",
            type:"div",
            mount: (container) => {
              container.innerHTML = `
                <div id="selectedAssetPreview">  
                  <div class="asset-empty">Loading assets...</div>
                </div>
              `; 
            }
          },      
        ],
      }
    ]
  }  as MenuTab};




// ------------ 
let assetGroups: Array<{ group: string; images: string[] }> = [];
let assetGroupSelected: string | null = null;
let assetImageSelected: string | null = null;
let assetDirectionSelected: string = "_NE";
let gameWorker: Worker;
let assetGroupListEl: HTMLElement | null = null;
let assetImageListEl: HTMLElement | null = null;
let assetImageEl: HTMLElement | null = null;


function rotateDirection() {
  // const directions = ["_N", "_NE", "_E", "_SE", "_S", "_SW", "_W", "_NW"];
  const directions = ["_NE", "_SE", "_SW", "_NW"];
  const idx = directions.indexOf(assetDirectionSelected);
  if (idx === -1) return "_NE"; // If not found, return original
  const newIdx = (idx + 1) % directions.length;
  assetDirectionSelected = directions[newIdx];
}
// ------------ 

export function initAssetGroups(init_gameWorker: Worker): void {
  gameWorker = init_gameWorker;
  gameWorker = init_gameWorker; // Store reference to gameWorker for later use in callbacks
  const toolMenuEl = document.getElementById('section-Struct');
  if (!toolMenuEl) return;
  assetGroupListEl = toolMenuEl.querySelector('#assetGroupList') as HTMLElement;
  assetImageListEl = toolMenuEl.querySelector('#assetImageList') as HTMLElement;
  assetImageEl = toolMenuEl.querySelector('#selectedAssetPreview') as HTMLElement;


  assetImageEl.addEventListener('click', () => {
    rotateDirection();
    if (assetImageSelected) {
      gameWorker.postMessage({
        action: "setActiveAsset",
        assetId: assetImageSelected + assetDirectionSelected,
      });
    }
  }); 
}

export function handleAssetGroups(groups: Array<{ group: string; images: string[] }>): void {
  
  if (!assetGroupListEl || !assetImageListEl) return;

  console.log("===============Received asset groups:", groups);
  assetGroups = groups;
  if (groups.length <= 0) {
    assetGroupListEl.innerHTML = `<div class="asset-empty">No asset groups found</div>`;
    assetImageListEl.innerHTML = `<div class="asset-empty">No assets found</div>`;
    return;
  }
  assetGroupSelected = groups[0].group;
  assetImageSelected = groups[0].images[0] || null;

  renderAssetGroupList();
  renderAssetImageList();
 
}


// rotateDirection
// ------------ 

export function handleAssetPreview(blobUrl: string): void {
  if (!assetImageEl) return;
  console.log("Handling asset preview with blob URL:", blobUrl);
  // Revoke old blob URL to prevent memory leaks
  const oldImg = assetImageEl.querySelector('img');
  if (oldImg && oldImg.src.startsWith('blob:')) {
    URL.revokeObjectURL(oldImg.src);
  }
  // Update preview with new image
  assetImageEl.innerHTML = `<img src="${blobUrl}" class="asset-preview-img" alt="Asset Preview">`;
}


// ============================================================================
// RENDERERS
export function renderAssetGroupList():void {
  if (!assetGroupListEl) return;

  if (assetGroups.length === 0) {
    assetGroupListEl.innerHTML =  `
      <div class="asset-empty">Loading assets...</div>
    `;
    return
  }
  assetGroupListEl.innerHTML =  `
      <select id="assetGroupListSelect">

      ${assetGroups.map((group, idx) => `
        <option value="${group.group}" ${idx == 0 ? 'selected' : ''}>
          ${group.group} (${group.images.length})
        </option>
      `).join('')}

      </select>
  `;

  // Add event listener for group selection
  const groupSelect = assetGroupListEl.getElementsByTagName('select')[0]
  groupSelect.addEventListener('change', (event) => {
    const selectEl = event.target as HTMLSelectElement;
    assetGroupSelected = selectEl.value;
    renderAssetImageList();
    groupSelect.blur()
  });
}

export function renderAssetImageList(): void {
  if (!assetImageListEl) return;

  const group = assetGroups.find(g => g.group === assetGroupSelected);
  console.log("Rendering asset image list for group:", assetGroupSelected, "Found group:", group);
  if (!group) {
    assetImageListEl.innerHTML =  '<div class="asset-empty">Select a group</div>';
    return
  }

  assetImageListEl.innerHTML =   `
      <select id="assetImageSelect">

        ${group.images.map((image, idx) => `
          <option value="${image}" ${idx == 0 ? 'selected' : ''}>${image}</option>
        `).join('')}

      </select>
  `;

  // Add event listener for group selection
  const imageSelect = assetImageListEl.getElementsByTagName('select')[0]
    imageSelect.addEventListener('change', (event) => {
      const selectEl = event.target as HTMLSelectElement;
      assetImageSelected = selectEl.value;
      gameWorker.postMessage({
        action: "setActiveAsset",
        assetId: assetImageSelected + "_NE",
      });
      imageSelect.blur()

    });
}

