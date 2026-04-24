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

let selectedGroupId: number | null = null;

async function init() {
  console.log('Assets Manager initialized');
  await loadGroups();
}

async function loadGroups() {
  try {
    const response = await fetch('/assets-manager/groups');
    const data = await response.json();
    
    if (data.success) {
      renderSidebarGroups(data.groups);
    } else {
      showError(data.error);
    }
  } catch (error) {
    showError(`Failed to load groups: ${error}`);
  }
}

function renderSidebarGroups(groups: AssetGroup[]) {
  const sidebar = document.getElementById('sidebar-panel');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div style="padding: 12px; border-bottom: 1px solid var(--border-color);">
      <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Asset Groups</h3>
    </div>
  `;

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
    
    if (selectedGroupId === group.id) {
      groupItem.style.backgroundColor = 'var(--bg-tertiary)';
      groupItem.style.borderLeft = '3px solid var(--accent-color)';
    }
    
    groupItem.innerHTML = `
      <div style="font-weight: 500;">${group.name}</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
        ${group.assetCount} assets
      </div>
    `;
    
    groupItem.addEventListener('click', () => selectGroup(group.id));
    groupItem.addEventListener('mouseenter', () => {
      if (selectedGroupId !== group.id) {
        groupItem.style.backgroundColor = 'var(--bg-tertiary)';
      }
    });
    groupItem.addEventListener('mouseleave', () => {
      if (selectedGroupId !== group.id) {
        groupItem.style.backgroundColor = '';
      }
    });
    
    groupList.appendChild(groupItem);
  });
  
  sidebar.appendChild(groupList);
}

async function selectGroup(groupId: number) {
  selectedGroupId = groupId;
  
  // Refresh sidebar to show selection
  await loadGroups();
  
  // Load and display assets
  await loadGroupAssets(groupId);
}

async function loadGroupAssets(groupId: number) {
  const mainPanel = document.getElementById('main-panel');
  if (!mainPanel) return;
  
  mainPanel.innerHTML = '<div style="padding: 20px; text-align: center;">Loading assets...</div>';
  
  try {
    const response = await fetch(`/assets-manager/group/${groupId}/assets`);
    const data = await response.json();
    
    if (data.success) {
      renderAssetsTable(data.group, data.assets);
    } else {
      showError(data.error);
    }
  } catch (error) {
    showError(`Failed to load assets: ${error}`);
  }
}

function renderAssetsTable(group: any, assets: Asset[]) {
  const mainPanel = document.getElementById('main-panel');
  if (!mainPanel) return;

  mainPanel.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h2 style="font-size: 18px; margin-bottom: 4px;">${group.name}</h2>
      <div style="font-size: 13px; color: var(--text-secondary);">
        Source: ${group.src} | ${assets.length} assets
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
      ${assets.map(asset => `
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden;">
          <div style="height: 120px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
            <img src="${asset.previewUrl}" alt="${asset.label}" 
                 style="max-width: 100%; max-height: 100%; object-fit: contain;"
                 onerror="this.style.opacity='0.3'">
          </div>
          <div style="padding: 8px 10px;">
            <div style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${asset.label}
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Top: ${asset.top}px
            </div>
          </div>
        </div>
      `).join('')}
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