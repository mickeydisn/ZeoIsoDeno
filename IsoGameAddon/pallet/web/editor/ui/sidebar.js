// ════════════════════════════════════════════════════════
//  SIDEBAR — Asset list & batch import
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { selectAsset, getAsset } from '../app.js';
import { setupAssetFromImport, loadFixImage } from '../fix/fixModule.js';
import { syncRowsFromWorkspace, renderRowPanel } from '../rows/rowModule.js';
import { loadComposer } from '../compose/composeModule.js';
import { refreshMaskPanel } from '../mask/maskModule.js';

const $ = id => document.getElementById(id);

export function setupImport() {
    $('batchInput').addEventListener('change', e => {
        Array.from(e.target.files).forEach(f => {
            const r = new FileReader();
            r.onload = ev => {
                const img = new Image();
                img.onload = () => { setupAssetFromImport(img, f.name); renderSidebar(); };
                img.src = ev.target.result;
            };
            r.readAsDataURL(f);
        });
        e.target.value = '';
    });
}

export function renderSidebar() {
    const list = $('assetList');
    list.innerHTML = '';
    const allValidated = a => a.fix.validated && a.rows.validated && a.compose.validated && a.mask.validated;
    const anyProcess = a => a.rows.validated || a.compose.validated || a.mask.validated;
    state.assets.forEach((a, i) => {
        const div = document.createElement('div');
        div.className = 'asset-item' + (i === state.currentAssetIdx ? ' active' : '');
        let cls, entryCls;
        if (allValidated(a)) { cls = 'badge badge-done'; entryCls = 'done-all'; }
        else if (anyProcess(a)) { cls = 'badge badge-process'; entryCls = 'done-process'; }
        else if (a.fix.validated) { cls = 'badge badge-recadre'; entryCls = 'done-fix'; }
        else { cls = 'badge badge-todo'; entryCls = ''; }
        if (entryCls) div.className += ' ' + entryCls;
        div.innerHTML = `<span class="${cls}">●</span> ${a.fileName || `Asset ${i+1}`}`;
        div.addEventListener('click', () => {
            selectAsset(i);
            loadFixImage(a);
            renderSidebar();
            // Refresh current tab view after switching asset
            const a2 = getAsset();
            if (state.currentTab === 'rows' && a2 && a2.fix.canvas) { syncRowsFromWorkspace(); renderRowPanel(); }
            else if (state.currentTab === 'compose' && a2) { loadComposer(a2); }
            else if (state.currentTab === 'mask' && a2) { refreshMaskPanel(); }
        });
        list.appendChild(div);
    });
    $('assetCountBadge').textContent = state.assets.length;
}