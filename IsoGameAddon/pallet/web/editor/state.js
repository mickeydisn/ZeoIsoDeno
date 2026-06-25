// ════════════════════════════════════════════════════════
//  GLOBAL STATE
// ════════════════════════════════════════════════════════
import { DEFAULT_COLS } from './constants.js';

export const state = {
    assets: [],
    currentAssetIdx: -1,
    currentTab: 'fix',

    // fix
    fixImage: null,
    rowYPos: [],
    colXPos: [],
    activeDragLine: 0, // 0=none, >0 = row index, <0 = -(col index)
    fixScale: 1,
    fixHscb: { hue:0, sat:0, con:0, bri:0 },

    // composer
    workspace: [],
    selectedCell: null,
    compRows: 1,
    compCols: DEFAULT_COLS,

    // normal drag (offset X/Y inside cell)
    normalDrag: null,

    // shift-drag
    shiftDrag: null,
    shiftDragPos: {x:0,y:0},
    shiftDragOver: null,

    // rows — per-row transformation state
    // rows[i] = { scale, offsetX, offsetY, flipH, mirrorSide, hue, sat, con, bri }
    rows: [],
    selectedRowIdx: -1,

    // mask — one set of 4 masks, shared
    maskState: defaultMaskState(),
    maskSourceImg: null,
};

export function defaultMaskState() {
    return {
        bottom: { on:false, x:0, y:0 },
        top:    { on:false, x:0, y:0 },
        left:   { on:false, x:0, y:0 },
        right:  { on:false, x:0, y:0 },
    };
}

export function defaultRowState() {
    return { scale:1, offsetX:0, offsetY:0, flipH:false, mirrorSide:0, hue:0, sat:0, con:0, bri:0 };
}

export function resetStateForNewSession() {
    state.assets = [];
    state.currentAssetIdx = -1;
    state.currentTab = 'fix';
    state.fixImage = null;
    state.workspace = [];
    state.selectedCell = null;
    state.rows = [];
    state.selectedRowIdx = -1;
    state.maskState = defaultMaskState();
    state.maskSourceImg = null;
}