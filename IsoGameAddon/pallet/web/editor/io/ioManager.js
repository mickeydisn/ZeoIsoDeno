// ════════════════════════════════════════════════════════
//  IO MANAGER — Save/Load JSON & Export All
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { renderSidebar } from '../ui/sidebar.js';
import { selectAsset } from '../app.js';
import { bakeMask } from '../pipeline/pipelineRenderer.js';

const $ = id => document.getElementById(id);

export function setupIO() {
    // Save JSON (params only, no dataURLs)
    $('saveJsonBtn').addEventListener('click', () => {
        const suffix = $('exportSuffix').value || '_fixed';
        const data = {
            version: 5,
            suffix,
            assets: state.assets.map(a => ({
                fileName: a.fileName,
                fix: { params: a.fix.params, validated: a.fix.validated },
                rows: { params: a.rows.params, validated: a.rows.validated },
                compose: { params: a.compose.params, validated: a.compose.validated },
                mask: { params: a.mask.params, validated: a.mask.validated },
            })),
        };
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
        const l = document.createElement('a');
        l.download = 'asset-pipeline-session.json';
        l.href = url;
        l.click();
        URL.revokeObjectURL(url);
    });

    // Load JSON
    $('loadJsonInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                state.assets = data.assets.map(en => ({
                    sourceImage: null,
                    fileName: en.fileName || 'restored',
                    fix: { validated: en.fix?.validated || false, params: en.fix?.params || null, canvas: null },
                    rows: { validated: en.rows?.validated || false, params: en.rows?.params || null, canvas: null },
                    compose: { validated: en.compose?.validated || false, params: en.compose?.params || null, canvas: null },
                    mask: { validated: en.mask?.validated || false, params: en.mask?.params || null, canvas: null },
                }));
                if (data.suffix) $('exportSuffix').value = data.suffix;
                renderSidebar();
                if (state.assets.length) { selectAsset(0); alert('✅ Session restaurée. Ré-importez les PNG sources.'); }
            } catch (err) { alert('Erreur JSON: ' + err.message); }
        };
        r.readAsText(file);
        $('loadJsonInput').value = '';
    });

    // Export all (re-bake from latest validated stage)
    $('exportAllBtn').addEventListener('click', async () => {
        const suffix = $('exportSuffix').value || '_fixed';
        const list = state.assets.filter(a => a.mask.validated || a.compose.validated || a.rows.validated || a.fix.validated);
        if (!list.length) { alert('Aucun asset validé.'); return; }

        const exports = [];
        for (const a of list) {
            let canvas = a.mask.canvas || a.compose.canvas || a.rows.canvas || a.fix.canvas;
            if (!canvas && a.fix.params && a.sourceImage) {
                const { bakeFix } = await import('../pipeline/pipelineRenderer.js');
                canvas = bakeFix(a.sourceImage, a.fix.params);
            }
            if (canvas) exports.push({ a, canvas });
        }
        if (!exports.length) { alert('Aucun asset à exporter.'); return; }

        if (window.showDirectoryPicker) {
            try {
                const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
                for (const { a, canvas } of exports) {
                    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                    const fname = (a.fileName||'export').replace(/\.png$/i,'') + suffix + '.png';
                    const fh = await dir.getFileHandle(fname, { create: true });
                    const w = await fh.createWritable();
                    await w.write(blob);
                    await w.close();
                }
                alert('✅ ' + exports.length + ' fichier(s) exporté(s).');
                return;
            } catch (err) { if (err.name === 'AbortError') return; }
        }

        exports.forEach(({ a, canvas }, i) => setTimeout(() => {
            canvas.toBlob(blob => {
                const l = document.createElement('a');
                l.download = (a.fileName||'export').replace(/\.png$/i,'') + suffix + '.png';
                l.href = URL.createObjectURL(blob);
                l.click();
                setTimeout(() => URL.revokeObjectURL(l.href), 1000);
            }, 'image/png');
        }, i * 220));
    });
}