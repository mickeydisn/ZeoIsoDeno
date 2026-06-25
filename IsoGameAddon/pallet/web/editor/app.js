// ════════════════════════════════════════════════════════
//  APP ORCHESTRATOR — Breaks circular deps between sidebar↔modules
// ════════════════════════════════════════════════════════
import { state } from './state.js';
import { loadFixImage } from './fix/fixModule.js';
import { resetComposer, loadComposer } from './compose/composeModule.js';
import { renderSidebar } from './ui/sidebar.js';

/**
 * Select an asset by index — orchestrates all modules.
 * This is the single entry point for asset selection,
 * used by sidebar click, fix/compose/mask next buttons.
 */
export function selectAsset(idx) {
    if (idx < 0 || idx >= state.assets.length) return;
    state.currentAssetIdx = idx;
    renderSidebar();
    const a = state.assets[idx];
    loadFixImage(a.dataURL, a.fixParams);
    if (a.fixCanvasDataURL) loadComposer(a.fixCanvasDataURL, a.composerParams);
    else resetComposer();
}