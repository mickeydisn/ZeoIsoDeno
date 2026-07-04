// ════════════════════════════════════════════════════════
//  GLOBAL STATE
// ════════════════════════════════════════════════════════
export const state = {
    assets: [],
    currentAssetIdx: -1,
    currentTab: 'fix',

    // fix — editing state (temporary until validated)
    fixImage: null,
    rowYPos: [],
    colXPos: [],
    activeDragLine: 0,
    fixScale: 1,
    fixHscb: { hue:0, sat:0, con:0, bri:0 },

    // rows — per-row editing state
    rows: [],
    selectedRowIdx: -1,

    // compose — per-cell editing state
    workspace: [],
    selectedCell: null,
    compRows: 1,
    compCols: 4,
    normalDrag: null,
    shiftDrag: null,
    shiftDragOver: null,

    // mask — editing state
    maskState: { bottom:{on:false,x:0,y:0}, top:{on:false,x:0,y:0}, left:{on:false,x:0,y:0}, right:{on:false,x:0,y:0} },
};

export function defaultRowState() {
    return { scale:1, offsetX:0, offsetY:0, hue:0, sat:0, con:0, bri:0 };
}

export function createAsset(sourceImage, fileName) {
    return {
        sourceImage,
        fileName: fileName || 'unnamed',
        // Validated stages store params + baked output
        fix: { validated: false, params: null, canvas: null },
        rows: { validated: false, params: null, canvas: null },
        compose: { validated: false, params: null, canvas: null },
        mask: { validated: false, params: null, canvas: null },
    };
}