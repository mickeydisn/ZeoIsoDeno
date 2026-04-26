import { group } from "node:console";
import { AssetConfigLoaded } from "../../build-tools/assetConfigLoader.ts";
import { gen_asset_configs } from "../../build-tools/configs-generated.ts";
import { loadAssetFromALLConf, TypeAssetImage, TypeAssetImageGroup } from "../../services/assetImageLoader.ts";


let _asset_configs: TypeAssetImageGroup[] | undefined
const asset_configs = async() =>  {
  if (!_asset_configs) {
   _asset_configs = await loadAssetFromALLConf(gen_asset_configs)
  }
  return _asset_configs
}

/**
 * Assets Manager Main Entry Point
 */

interface AssetGroup {
  id: number;
  name: string;
  src: string;
  assetCount: number;
}

interface Asset {
  id: number;
  label: string;
  top: number;
  previewUrl: string;
}

let selectedGroupId: string | null = null;

async function init() {
  console.log('Assets Manager initialized');
  await loadGroups();

}



async function loadGroups() {
  const conf : TypeAssetImageGroup[] = await asset_configs()

  const conftype = conf.reduce((acc : Record<string, TypeAssetImageGroup[]>, conf: TypeAssetImageGroup) => { 
      if (!acc[conf.type]) {
        acc[conf.type] = [];
      }
      acc[conf.type].push(conf);
      return acc
    }, {}
  )

  const sidebar = document.getElementById('sidebar-panel');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div style="padding: 12px; border-bottom: 1px solid var(--border-color);">
      <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Asset Groups</h3>
    </div>
  `;

  Object.entries(conftype).forEach(([t, conf]) => {

    const groupTile = document.createElement('div');
    groupTile.innerHTML = `
    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">${t}</h3>
    `
    const groupList = renderSidebarGroups(conf);

    sidebar.appendChild(groupTile);
    sidebar.appendChild(groupList);

  })

}

function renderSidebarGroups(groups: TypeAssetImageGroup[]) {

  const groupList = document.createElement('div');
  
  groups.forEach(group => {
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
      transition: background-color 0.15s;
    `;
    
    if (selectedGroupId === group.name) {
      groupItem.style.backgroundColor = 'var(--bg-tertiary)';
      groupItem.style.borderLeft = '3px solid var(--accent-color)';
    }
    
    groupItem.innerHTML = `
      <div style="font-weight: 500;">${group.name}</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
        ${group.assets?.length || 0} assets
      </div>
    `;
    
    groupItem.addEventListener('click', () => selectGroup(group.name));
    groupItem.addEventListener('mouseenter', () => {
      if (selectedGroupId !== group.name) {
        groupItem.style.backgroundColor = 'var(--bg-tertiary)';
      }
    });
    groupItem.addEventListener('mouseleave', () => {
      if (selectedGroupId !== group.name) {
        groupItem.style.backgroundColor = '';
      }
    });
    
    groupList.appendChild(groupItem);
  });
  return groupList;
}

async function selectGroup(groupId: string) {
  selectedGroupId = groupId;
  
  // Refresh sidebar to show selection
  await loadGroups();
  
  // Load and display assets
  await loadGroupAssets(groupId);
}

async function loadGroupAssets(groupId: string) {
  const mainPanel = document.getElementById('main-panel');
  if (!mainPanel) return;
  
  mainPanel.innerHTML = '<div style="padding: 20px; text-align: center;">Loading assets...</div>';
  const conf = await asset_configs()
  const group = conf.find(g => g.name == groupId)
  if (!group) {
    showError(`Failed to load assets: ${groupId}`);
    return
  }
  renderAssetsTable(group);
  
}

// Transfer to a regular canvas first, then toDataURL
const regular = document.createElement("canvas");
regular.width = 192;
regular.height = 224;


function renderAsset(asset: TypeAssetImage) {
  
  const cards = ["A", "B", "C", "D"].map((suff, idx) => `
  <input type="radio" name="slider_${asset.name}" id="${asset.name}_${idx}" ${!idx ? 'checked' : ''}>
  <label for="${asset.name}_${(idx+1)%4}" class="card">
      <div style="height: 120px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
        <img src="${asset.dataurl[idx]}" alt="${asset.name}" 
              style="max-width: 100%; max-height: 100%; object-fit: contain;"
              onerror="this.style.opacity='0.3'">
      </div>
      <div style="padding: 8px 10px;">
        <div style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${asset.name} ${suff}
        </div>
      </div>
    </label>
  `).join('')


  return `
  <div class="card-container" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden;">
    <!-- Cards -->
    <div class="cards">
      ${cards}
    </div>
  </div>
  `

  return ["A", "B", "C", "D"].map((suff, idx) => `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden;">
      <div style="height: 120px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
        <img src="${asset.dataurl[idx]}" alt="${asset.name}" 
              style="max-width: 100%; max-height: 100%; object-fit: contain;"
              onerror="this.style.opacity='0.3'">
      </div>
      <div style="padding: 8px 10px;">
        <div style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${asset.name} ${suff}
        </div>
      </div>
    </div>
  `).join('')

   
}

function renderAssetsTable(group: TypeAssetImageGroup) {
  const mainPanel = document.getElementById('main-panel');
  if (!mainPanel) return;
  const assets = group.assets

  mainPanel.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h2 style="font-size: 18px; margin-bottom: 4px;">${group.name}</h2>
      <div style="font-size: 13px; color: var(--text-secondary);">
        Source: ${group.src} | ${assets.length} assets
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
      ${assets.map(asset => renderAsset(asset)).join('')}
    </div>
  `;
}

function showError(message: string) {
  const errorBanner = document.getElementById('error-banner');
  if (!errorBanner) return;
  
  errorBanner.textContent = message;
  errorBanner.classList.remove('hidden');
  
  setTimeout(() => {
    errorBanner.classList.add('hidden');
  }, 5000);
}

// Initialize application
document.addEventListener('DOMContentLoaded', init);
