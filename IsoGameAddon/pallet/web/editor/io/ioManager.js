// ════════════════════════════════════════════════════════
//  IO MANAGER — Save/Load JSON & Export All
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { renderSidebar } from '../ui/sidebar.js';
import { selectAsset } from '../app.js';

const $ = id => document.getElementById(id);

export function setupIO() {
    // ─── SAVE JSON ───
    $('saveJsonBtn').addEventListener('click', () => {
        const suffix = $('exportSuffix').value || '_fixed';
        const data = {
            version: 4,
            suffix,
            assets: state.assets.map(a => ({
                originalName: a.originalName,
                fixParams: a.fixParams,
                composerParams: a.composerParams,
                maskParams: a.maskParams || null,
                fixCanvasDataURL: a.fixCanvasDataURL,
                composerCanvasDataURL: a.composerCanvasDataURL,
                maskedCanvasDataURL: a.maskedCanvasDataURL || null,
            })),
        };
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
        const l = document.createElement('a');
        l.download = 'asset-pipeline-session.json';
        l.href = url;
        l.click();
        URL.revokeObjectURL(url);
    });

    // ─── LOAD JSON ───
    $('loadJsonInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                state.assets = data.assets.map(en => ({
                    originalName: en.originalName,
                    dataURL: en.fixCanvasDataURL || null,
                    fixParams: en.fixParams || null,
                    composerParams: en.composerParams || null,
                    maskParams: en.maskParams || null,
                    fixCanvasDataURL: en.fixCanvasDataURL || null,
                    composerCanvasDataURL: en.composerCanvasDataURL || null,
                    maskedCanvasDataURL: en.maskedCanvasDataURL || null,
                }));
                if (data.suffix) $('exportSuffix').value = data.suffix;

                renderSidebar();
                if (state.assets.length) selectAsset(0);
            } catch (err) {
                alert('Erreur JSON: ' + err.message);
            }
        };
        r.readAsText(file);
        $('loadJsonInput').value = '';
    });

    // ─── EXPORT ALL ───
    $('exportAllBtn').addEventListener('click', async () => {
        const suffix = $('exportSuffix').value || '_fixed';
        const list = state.assets.filter(a => a.maskedCanvasDataURL || a.composerCanvasDataURL || a.fixCanvasDataURL);
        if (!list.length) { alert('Aucun asset validé.'); return; }

        const getBest = a => a.maskedCanvasDataURL || a.composerCanvasDataURL || a.fixCanvasDataURL;

        if (window.showDirectoryPicker) {
            try {
                const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
                for (const a of list) {
                    const src = getBest(a);
                    const fname = a.originalName.replace(/\.png$/i, '') + suffix + '.png';
                    const blob = await (await fetch(src)).blob();
                    const fh = await dir.getFileHandle(fname, { create: true });
                    const w = await fh.createWritable();
                    await w.write(blob);
                    await w.close();
                }
                alert('✅ ' + list.length + ' fichier(s) exporté(s).');
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        list.forEach((a, i) => setTimeout(() => {
            const l = document.createElement('a');
            l.download = a.originalName.replace(/\.png$/i, '') + suffix + '.png';
            l.href = getBest(a);
            l.click();
        }, i * 220));
    });
}