// ════════════════════════════════════════════════════════
//  TABS
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { refreshMaskPanel } from '../mask/maskModule.js';
import { renderRowPanel, syncRowsFromWorkspace } from '../rows/rowModule.js';

const $ = id => document.getElementById(id);

export function setupTabs() {
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
        state.currentTab = t.dataset.tab;
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        $('panelFix').classList.toggle('visible', state.currentTab === 'fix');
        $('panelCompose').classList.toggle('visible', state.currentTab === 'compose');
        $('panelRows').classList.toggle('visible', state.currentTab === 'rows');
        $('panelMask').classList.toggle('visible', state.currentTab === 'mask');

        if (state.currentTab === 'rows') {
            syncRowsFromWorkspace();
            renderRowPanel();
        }
        if (state.currentTab === 'mask') refreshMaskPanel();
    }));
}
