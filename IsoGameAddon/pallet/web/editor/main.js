// ════════════════════════════════════════════════════════
//  MAIN ENTRY — Asset Pipeline Editor v2
//  Modules are organized by domain:
//    constants.js   — shared dimensions
//    state.js       — global mutable state
//    utils/         — pure utility functions (canvas, hscb, iso)
//    fix/           — Étape 1: Recadrage
//    compose/       — Étape 2: Composition
//    mask/          — Étape 3: Masques
//    ui/            — sidebar, tabs
//    io/            — save/load JSON, export all
// ════════════════════════════════════════════════════════

import { setupTabs } from './ui/tabs.js';
import { setupImport, renderSidebar } from './ui/sidebar.js';
import { setupFixMouseEvents, bindFixEvents, onFixApply } from './fix/fixModule.js';
import { setupComposeMouseEvents, bindComposeEvents, loadComposer, onComposeApply } from './compose/composeModule.js';
import { bindMaskEvents, refreshMaskPanel } from './mask/maskModule.js';
import { setupRowMouseEvents, bindRowEvents } from './rows/rowModule.js';
import { setupIO } from './io/ioManager.js';

// ════════════════════════════════════════════════════════
//  INIT — called when DOM is ready
// ════════════════════════════════════════════════════════
export function init() {
    // Tabs
    setupTabs();

    // Import (batch input)
    setupImport();

    // Fix module
    onFixApply((fixDataURL) => {
        loadComposer(fixDataURL, null);
    });
    setupFixMouseEvents();
    bindFixEvents();

    // Compose module
    onComposeApply(() => {
        // When compose is validated, refresh mask if the tab is active
        if (document.getElementById('panelMask').classList.contains('visible')) {
            refreshMaskPanel();
        }
    });
    setupComposeMouseEvents();
    bindComposeEvents();

    // Row module (step 3 between compose and mask)
    setupRowMouseEvents();
    bindRowEvents();

    // Mask module
    bindMaskEvents();

    // IO (save/load/export)
    setupIO();

    // Initial sidebar render
    renderSidebar();

    console.log('[Asset Pipeline v2] Initialized successfully.');
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}