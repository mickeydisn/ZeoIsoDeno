// ════════════════════════════════════════════════════════
//  SIDEBAR UI
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { selectAsset } from '../app.js';

const $ = id => document.getElementById(id);

// ════════════════════════════════════════════════════════
//  IMPORT
// ════════════════════════════════════════════════════════
export function setupImport() {
    $('batchInput').addEventListener('change', e => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        let n = 0;
        files.forEach(file => {
            const r = new FileReader();
            r.onload = ev => {
                if (!state.assets.find(a => a.originalName === file.name)) {
                    state.assets.push({
                        originalName: file.name,
                        dataURL: ev.target.result,
                        fixParams: null,
                        composerParams: null,
                        maskParams: null,
                        fixCanvasDataURL: null,
                        composerCanvasDataURL: null,
                        maskedCanvasDataURL: null,
                    });
                }
                if (++n === files.length) {
                    renderSidebar();
                    if (state.currentAssetIdx === -1) selectAsset(0);
                }
            };
            r.readAsDataURL(file);
        });
        $('batchInput').value = '';
    });
}

// ════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════
export function renderSidebar() {
    const assetListEl = $('assetList');
    const assetCountBadge = $('assetCountBadge');
    const progressBar = $('progressBar');

    assetCountBadge.textContent = state.assets.length;
    if (!state.assets.length) {
        assetListEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-size:.75em;">Importez des PNG</div>';
        progressBar.style.width = '0%';
        return;
    }
    const done = state.assets.filter(a => a.fixCanvasDataURL && a.composerCanvasDataURL).length;
    progressBar.style.width = Math.round(done / state.assets.length * 100) + '%';
    assetListEl.innerHTML = '';
    state.assets.forEach((a, i) => {
        const div = document.createElement('div');
        const hF = !!a.fixCanvasDataURL, hC = !!a.composerCanvasDataURL, hM = !!a.maskedCanvasDataURL;
        div.className = `asset-entry ${hM ? 'done-mask' : hC ? 'done-both' : hF ? 'done-fix' : ''} ${i === state.currentAssetIdx ? 'active' : ''}`;
        div.innerHTML = `<span class="status-dot"></span><span class="asset-name" title="${a.originalName}">${a.originalName}</span>`;
        div.addEventListener('click', () => selectAsset(i));
        assetListEl.appendChild(div);
    });
}
