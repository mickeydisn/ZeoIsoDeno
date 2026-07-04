// ════════════════════════════════════════════════════════
//  TABS — tab panel switching
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { syncRowsFromWorkspace, renderRowPanel } from '../rows/rowModule.js';
import { refreshMaskPanel } from '../mask/maskModule.js';
import { loadComposer } from '../compose/composeModule.js';
import { getAsset } from '../app.js';

const $ = id => document.getElementById(id);

export function setupTabs() {
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
        state.currentTab = t.dataset.tab;
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        $('panelFix').classList.toggle('visible', state.currentTab === 'fix');
        $('panelRows').classList.toggle('visible', state.currentTab === 'rows');
        $('panelCompose').classList.toggle('visible', state.currentTab === 'compose');
        $('panelMask').classList.toggle('visible', state.currentTab === 'mask');

        const a = getAsset();
        if (state.currentTab === 'rows' && a && a.fix.canvas) { syncRowsFromWorkspace(); renderRowPanel(); }
        else if (state.currentTab === 'compose' && a) { loadComposer(a); }
        else if (state.currentTab === 'mask' && a) { refreshMaskPanel(); }
    }));
}