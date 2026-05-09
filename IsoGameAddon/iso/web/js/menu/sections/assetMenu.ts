// Main thread (e.g., main.ts)

import { MessageHandler } from "../../../../../../IsoGame/etc/handlers/messageHandler.ts";
import { DialogManager } from "../dialog.ts";
import { MenuTab } from "../headMenu.ts";

// ============================================================================
// CONFIG
export const assetMenuTab = (gameWorker: Worker, init_handlers: MessageHandler) => {
  return{ 
    id: "Struct",  icon: "🧩" , 
    sub: [
      { 
        id: "clean_asset", 
        icon: "🧹", 
        callback_select: () => {
          gameWorker.postMessage({action: "setActiveTool",toolId: "clear_items"});
        },
        params: [
          { 
            id: "brushSize", type: "range", min: 1, max: 9, step: 2, default: 3, 
            callback_change: (value) => {
              gameWorker.postMessage({
                action: "setBrushSize",
                size: value,
              });
            }
          },
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



// ============================================================================
// GLOBAL
let assetGroups: Array<{ group: string; images: string[] }> = [];
let assetGroupSelected: { group: string; images: string[] } | null = null;
let assetImageSelectedID: string | null = null;
let assetDirectionSelected: string = "_NE";
let gameWorker: Worker;
let handlers: MessageHandler;
let assetImageListEl: HTMLElement | null = null;
let assetImageEl: HTMLElement | null = null;

// ============================================================================
// UTILS
function rotateDirection() {
  // const directions = ["_N", "_NE", "_E", "_SE", "_S", "_SW", "_W", "_NW"];
  const directions = ["_NE", "_SE", "_SW", "_NW"];
  const idx = directions.indexOf(assetDirectionSelected);
  if (idx === -1) return "_NE"; // If not found, return original
  const newIdx = (idx + 1) % directions.length;
  assetDirectionSelected = directions[newIdx];
}

function setAssetGroupSelected(id:string) {
   const group = assetGroups.find(g => g.group === id);
   assetGroupSelected = group || null;
}

// ============================================================================
// INIT
export function initAssetGroups(init_gameWorker: Worker, init_handlers: MessageHandler): void {
  gameWorker = init_gameWorker;
  handlers = init_handlers;
  const toolMenuEl = document.getElementById('section-Struct');
  if (!toolMenuEl) return;
  assetImageListEl = toolMenuEl.querySelector('#assetImageList') as HTMLElement;
  assetImageEl = toolMenuEl.querySelector('#selectedAssetPreview') as HTMLElement;

  assetImageEl.addEventListener('click', () => {
    rotateDirection();
    if (assetImageSelectedID) {
      gameWorker.postMessage({
        action: "setActiveAsset",
        assetId: assetImageSelectedID + assetDirectionSelected,
      });
    }
  }); 
}

// ============================================================================
// HANDEL
export function handleAssetGroups(groups: Array<{ group: string; images: string[] }>): void {
  
  if (!assetImageListEl) return;

  console.log("===============Received asset groups:", groups);
  assetGroups = groups;
  if (groups.length <= 0) {
    assetImageListEl.innerHTML = `<div class="asset-empty">No assets found</div>`;
    return;
  }
  assetGroupSelected = groups[0]
  assetImageSelectedID = groups[0].images[0] || null;

  renderAssetImageList();
 
}


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

export const assetCssClass = /*css*/`

#dialog-tool-asset {
  display: grid;
  grid-template-columns: 1fr 5fr;
  height: 100%;

  #dialog-tool-asset-group-list {
    display: flex;
    overflow: scroll;
  }


  #dialog-tool-asset-image-list {
    display: flex;
    overflow: scroll;
  }

}

`;

function _renderGroupList(el: HTMLElement, call : () => void): void {
  // 1. Set the content
      el.innerHTML = `
        <ul>
          ${assetGroups.map((group) => `
            <li class="group-item" data-group-name="${group.group}">
              <button class="select-btn">${group.group} (${group.images.length})</button>
            </li>
          `).join('')}
        </ul>
      `;

      // 3. Query all the buttons that were just added to the DOM
      const lis = el.querySelectorAll('li.group-item');

      // 4. Loop through and attach a specific listener to each
      lis?.forEach((li) => {

        li.addEventListener('click', (e) => {
          // Find the parent LI to get the data attribute
          const groupName = (e.currentTarget as HTMLElement).getAttribute('data-group-name') || '';
          console.log("Selected Group:", groupName);
          setAssetGroupSelected(groupName);
          call()
        });
      });
}

function _renderImagesList(el: HTMLElement, call : () => void): void {
    if (!assetGroupSelected) return;

  // 1. Set the content
  el.innerHTML = `
    <ul>
        ${assetGroupSelected.images.map((image, _idx) => `
        <li class="images-item" data-image-name="${image}">
          <button class="select-btn">${image}</button>
        </li>
      `).join('')}
    </ul>
  `;


  let currentBlobUrl : string | null = null;
  const dialogMgr = DialogManager.getInstance()

  // 3. Query all the buttons that were just added to the DOM
  const li_list = dialogMgr.getElement()?.querySelectorAll('li.images-item');

  // 4. Loop through and attach a specific listener to each
  li_list?.forEach((item) => {
    const imageName = item?.getAttribute('data-image-name') || '';
    item.innerHTML = `<span>${imageName}</span>`

    handlers.sendMessageWithResponse({
      action: "getAsset",
      assetId: imageName + "_NE",
    }).then((data) => {
        console.log("----------------------------", data)
        const newUrl = data?.result?.blobUrl;

        const img = new Image();

        img.onload = () => {
          // 🔥 cleanup AFTER new one is loaded
          if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
          }
          currentBlobUrl = newUrl;
        };

        img.src = newUrl;
        img.classList.add("asset-preview-img")
        //  class="" alt="Asset Preview"
        item.innerHTML = "";
        item.appendChild(img);
        
    })

    item.addEventListener('click', (e) => {
      // Find the parent LI to get the data attribute
      console.log("Selected Image:", imageName);
      assetImageSelectedID = imageName;
      gameWorker.postMessage({
            action: "setActiveAsset",
            assetId: assetImageSelectedID + "_NE",
      });
      call()
    });
  });

}

// ============================================================================
// RENDERERS


export function renderAssetImageList(): void {
  if (!assetImageListEl) return;
  
  // IF No Groups
  if (assetGroups.length === 0) {
    assetImageListEl.innerHTML =  `
      <div class="asset-empty">Loading assets...</div>
    `;
    return
  }

  // IF NO Group Selected 
  if (!assetGroupSelected) {
    assetGroupSelected = assetGroups[0];
    assetImageListEl.innerHTML =  '<div class="asset-empty">Select a group</div>';
    return
  }
  
  // IF NO Image Selected 
  const image = assetGroupSelected.images.find(i => i === assetImageSelectedID);
  if (!image) {
    assetImageSelectedID = assetGroupSelected.images[0];
    gameWorker.postMessage({
          action: "setActiveAsset",
          assetId: assetImageSelectedID + "_NE",
    });
  }
  // Set Label
  assetImageListEl.innerHTML =  `
      <label id="assetImageListSelect">${assetImageSelectedID}</label>
    `
  // ---------------
  // Set Click 
  assetImageListEl.querySelector("label")?.addEventListener("click", () => {
      const dialogMgr = DialogManager.getInstance()
      // 2. Open the dialog
      dialogMgr.open();
      dialogMgr.setContent(`
        <div id="dialog-tool-asset">
          <div id="dialog-tool-asset-group-list"></div>
          <div id="dialog-tool-asset-image-list"></div>
        </div>
        `)
      const elGroup= dialogMgr.getElement()?.querySelector('#dialog-tool-asset-group-list') as HTMLElement
      _renderGroupList(elGroup, () => {
        const elImages= dialogMgr.getElement()?.querySelector('#dialog-tool-asset-image-list') as HTMLElement
        _renderImagesList(elImages, ()=> { dialogMgr.close();})
        renderAssetImageList();
      })

      const elImages= dialogMgr.getElement()?.querySelector('#dialog-tool-asset-image-list') as HTMLElement
      _renderImagesList(elImages, ()=> { dialogMgr.close();})


  });  

}

