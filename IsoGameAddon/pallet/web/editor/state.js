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

export function resetStateForNewSession() {
    state.assets = [];
    state.currentAssetIdx = -1;
    state.currentTab = 'fix';
    state.fixImage = null;
    state.workspace = [];
    state.selectedCell = null;
    state.maskState = defaultMaskState();
    state.maskSourceImg = null;
}