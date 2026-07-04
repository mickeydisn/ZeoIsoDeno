// ════════════════════════════════════════════════════════
//  APP — Orchestrator
//  Manages asset selection and data flow between stages
// ════════════════════════════════════════════════════════
import { state, defaultRowState } from './state.js';

export function selectAsset(idx) {
    if (idx < 0 || idx >= state.assets.length) return;
    state.currentAssetIdx = idx;
    state.selectedCell = null;
    state.selectedRowIdx = -1;

    const a = state.assets[idx];

    // Restore fix editing state from validated params
    if (a.fix.params) {
        state.rowYPos = [...a.fix.params.rowPositions];
        state.colXPos = a.fix.params.colPositions ? [...a.fix.params.colPositions] : [];
        state.fixScale = a.fix.params.zoom || 1;
        state.fixHscb = a.fix.params.hscb ? { ...a.fix.params.hscb } : { hue:0, sat:0, con:0, bri:0 };
    }

    // Restore row editing state
    if (a.rows.params) {
        state.rows = a.rows.params.map(r => ({ ...defaultRowState(), ...r }));
    } else if (a.fix.params) {
        const nR = a.fix.params.rowPositions.length - 1;
        state.rows = [];
        for (let i = 0; i < nR; i++) state.rows.push(defaultRowState());
    }

    // Restore compose editing state
    if (a.compose.params) {
        state.workspace = a.compose.params.workspace.map(s => ({ ...s }));
        state.compRows = a.compose.params.compRows;
        state.compCols = a.compose.params.compCols;
    } else if (a.rows.params || a.fix.params) {
        // Will be populated by compose's loadComposer
    }

    // Restore mask editing state
    if (a.mask.params) {
        state.maskState = JSON.parse(JSON.stringify(a.mask.params));
    }
}

export function getAsset() {
    return state.currentAssetIdx >= 0 ? state.assets[state.currentAssetIdx] : null;
}