// ════════════════════════════════════════════════════════
//  MAIN ENTRY — Asset Pipeline v2 (modular)
//  Stages: Fix(1) → Rows(2) → Compose(3) → Mask(4)
//  Each stage validates and bakes its output canvas.
//  Downstream stages use the previous validated canvas.
// ════════════════════════════════════════════════════════
import { setupTabs } from './ui/tabs.js';
import { setupImport, renderSidebar } from './ui/sidebar.js';
import { setupFixMouseEvents, bindFixEvents } from './fix/fixModule.js';
import { setupComposeMouseEvents, bindComposeEvents } from './compose/composeModule.js';
import { bindMaskEvents } from './mask/maskModule.js';
import { setupRowMouseEvents, bindRowEvents } from './rows/rowModule.js';
import { setupIO } from './io/ioManager.js';

export function init() {
    setupTabs();
    setupImport();
    setupFixMouseEvents();
    bindFixEvents();
    setupRowMouseEvents();
    bindRowEvents();
    setupComposeMouseEvents();
    bindComposeEvents();
    bindMaskEvents();
    setupIO();
    renderSidebar();
    console.log('[Asset Pipeline v2] Clean modular pipeline initialized.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}