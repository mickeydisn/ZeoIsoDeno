// ════════════════════════════════════════════════════════
//  COMPOSE MODULE — Étape 2 : Composition
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { SP_W, SP_H, TILE_W, TILE_H, TILE_PAD_C } from '../constants.js';
import { cloneCanvas, extractCell } from '../utils/canvas.js';
import { applyHSCB } from '../utils/hscb.js';
import { drawIsoTileC } from '../utils/iso.js';
import { selectAsset } from '../app.js';

const $ = id => document.getElementById(id);

let _composeApplyCallback = null;

export function onComposeApply(cb) {
    _composeApplyCallback = cb;
}

// ════════════════════════════════════════════════════════
//  COMPOSER — LOAD / RESET
// ════════════════════════════════════════════════════════
export function resetComposer() {
    $('mainCanvas').style.display = 'none';
    $('composeEmpty').style.display = 'flex';
    $('composeApplyBtn').disabled = true;
    $('composeNextBtn').disabled = true;
    state.workspace = [];
    state.selectedCell = null;
    $('spriteControls').style.display = 'none';
}

export function loadComposer(fixDataURL, savedParams) {
    const img = new Image();
    img.onload = () => {
        $('composeEmpty').style.display = 'none';
        $('mainCanvas').style.display = 'block';
        const nC = Math.max(1, Math.round(img.width / SP_W));
        const nR = Math.max(1, Math.round(img.height / SP_H));
        state.compCols = nC;

        if (savedParams && savedParams.sprites) {
            state.compRows = savedParams.rows || nR;
            state.workspace = [];
            for (let r = 0; r < state.compRows; r++) {
                for (let c = 0; c < state.compCols; c++) {
                    const sp = savedParams.sprites.find(s => s.row === r && s.col === c) || null;
                    let cellCanvas = null;
                    if (sp && sp.imgDataURL) {
                        cellCanvas = document.createElement('canvas');
                        cellCanvas.width = SP_W;
                        cellCanvas.height = SP_H;
                        const tmpImg = new Image();
                        tmpImg.src = sp.imgDataURL;
                        (function (cc, ti) {
                            ti.onload = () => {
                                cc.getContext('2d').drawImage(ti, 0, 0, SP_W, SP_H);
                                render();
                            };
                        })(cellCanvas, tmpImg);
                    } else if (sp && sp.srcRow !== undefined) {
                        const srcR = sp.srcRow, srcC = sp.srcCol || 0;
                        if (srcR < nR && srcC < nC) cellCanvas = extractCell(img, srcR, srcC, nC, nR);
                    }
                    state.workspace.push({
                        row: r, col: c,
                        imgData: cellCanvas,
                        imgDataURL: sp ? sp.imgDataURL || null : null,
                        offsetX: sp ? sp.offsetX || 0 : 0,
                        offsetY: sp ? sp.offsetY || 0 : 0,
                        scale: sp ? sp.scale || 1 : 1,
                        flipH: sp ? sp.flipH || false : false,
                        mirrorSide: sp ? sp.mirrorSide || 0 : 0,
                        hue: sp ? sp.hue || 0 : 0,
                        sat: sp ? sp.sat || 0 : 0,
                        con: sp ? sp.con || 0 : 0,
                        bri: sp ? sp.bri || 0 : 0,
                    });
                }
            }
        } else {
            state.compRows = nR;
            state.workspace = [];
            for (let r = 0; r < nR; r++) {
                for (let c = 0; c < nC; c++) {
                    const cell = extractCell(img, r, c, nC, nR);
                    state.workspace.push({
                        row: r, col: c,
                        imgData: cell,
                        imgDataURL: null,
                        offsetX: 0, offsetY: 0,
                        scale: 1, flipH: false, mirrorSide: 0,
                        hue: 0, sat: 0, con: 0, bri: 0,
                    });
                }
            }
        }
        resizeMC();
        render();
        $('composeApplyBtn').disabled = false;
        $('composeNextBtn').disabled = state.currentAssetIdx >= state.assets.length - 1;
    };
    img.src = fixDataURL;
}

function resizeMC() {
    $('mainCanvas').width = SP_W * state.compCols;
    $('mainCanvas').height = SP_H * state.compRows;
}

// ════════════════════════════════════════════════════════
//  COMPOSER — RENDER
// ════════════════════════════════════════════════════════
function renderSprite(tc, sp, dx, dy) {
    if (!sp.imgData) return;
    tc.save();
    if (sp.mirrorSide) {
        const mc = document.createElement('canvas');
        mc.width = SP_W; mc.height = SP_H;
        const mctx = mc.getContext('2d');
        mctx.imageSmoothingEnabled = false;
        mctx.save();
        mctx.translate(SP_W / 2 + sp.offsetX, SP_H / 2 + sp.offsetY);
        mctx.scale(sp.scale * (sp.flipH ? -1 : 1), sp.scale);
        mctx.drawImage(sp.imgData, -SP_W / 2, -SP_H / 2, SP_W, SP_H);
        mctx.restore();
        applyHSCB(mc, sp.hue || 0, sp.sat || 0, sp.con || 0, sp.bri || 0);

        const fc = document.createElement('canvas');
        fc.width = SP_W; fc.height = SP_H;
        const fctx = fc.getContext('2d');
        fctx.imageSmoothingEnabled = false;
        if (sp.mirrorSide === 1) {
            fctx.drawImage(mc, 0, 0, SP_W / 2, SP_H, 0, 0, SP_W / 2, SP_H);
            fctx.save();
            fctx.translate(SP_W, 0);
            fctx.scale(-1, 1);
            fctx.drawImage(mc, 0, 0, SP_W / 2, SP_H, 0, 0, SP_W / 2, SP_H);
            fctx.restore();
        } else {
            fctx.drawImage(mc, SP_W / 2, 0, SP_W / 2, SP_H, SP_W / 2, 0, SP_W / 2, SP_H);
            fctx.save();
            fctx.translate(SP_W, 0);
            fctx.scale(-1, 1);
            fctx.drawImage(mc, SP_W / 2, 0, SP_W / 2, SP_H, SP_W / 2, 0, SP_W / 2, SP_H);
            fctx.restore();
        }
        tc.drawImage(fc, dx, dy);
    } else {
        const mc = document.createElement('canvas');
        mc.width = SP_W; mc.height = SP_H;
        const mctx = mc.getContext('2d');
        mctx.imageSmoothingEnabled = false;
        mctx.save();
        mctx.translate(SP_W / 2 + sp.offsetX, SP_H / 2 + sp.offsetY);
        mctx.scale(sp.scale * (sp.flipH ? -1 : 1), sp.scale);
        mctx.drawImage(sp.imgData, -SP_W / 2, -SP_H / 2, SP_W, SP_H);
        mctx.restore();
        applyHSCB(mc, sp.hue || 0, sp.sat || 0, sp.con || 0, sp.bri || 0);
        tc.drawImage(mc, dx, dy);
    }
    tc.restore();
}

export function render() {
    const mCtx = $('mainCanvas').getContext('2d');
    mCtx.clearRect(0, 0, $('mainCanvas').width, $('mainCanvas').height);
    state.workspace.forEach(sp => renderSprite(mCtx, sp, sp.col * SP_W, sp.row * SP_H));

    if ($('showGridCheck').checked) {
        mCtx.strokeStyle = 'rgba(102,126,234,.45)';
        mCtx.lineWidth = 1;
        for (let r = 0; r <= state.compRows; r++) {
            mCtx.beginPath();
            mCtx.moveTo(0, r * SP_H);
            mCtx.lineTo($('mainCanvas').width, r * SP_H);
            mCtx.stroke();
        }
        for (let c = 0; c <= state.compCols; c++) {
            mCtx.beginPath();
            mCtx.moveTo(c * SP_W, 0);
            mCtx.lineTo(c * SP_W, $('mainCanvas').height);
            mCtx.stroke();
        }
    }
    if ($('showTilesCheck').checked) {
        state.workspace.forEach(sp => drawIsoTileC(mCtx, sp.col * SP_W, sp.row * SP_H));
    }
    if (state.selectedCell) {
        mCtx.strokeStyle = '#667eea';
        mCtx.lineWidth = 3;
        mCtx.strokeRect(state.selectedCell.col * SP_W + 1, state.selectedCell.row * SP_H + 1, SP_W - 2, SP_H - 2);
    }
    if (state.shiftDrag && state.shiftDragOver) {
        const isComposite = state.shiftDrag.composite;
        mCtx.strokeStyle = isComposite ? 'rgba(0,220,100,.95)' : 'rgba(255,200,0,.9)';
        mCtx.lineWidth = 3;
        mCtx.strokeRect(state.shiftDragOver.col * SP_W + 1, state.shiftDragOver.row * SP_H + 1, SP_W - 2, SP_H - 2);
        if (isComposite) {
            mCtx.fillStyle = 'rgba(0,220,100,.18)';
            mCtx.fillRect(state.shiftDragOver.col * SP_W + 2, state.shiftDragOver.row * SP_H + 2, SP_W - 4, SP_H - 4);
        }
    }
}

// ════════════════════════════════════════════════════════
//  COMPOSER — MOUSE EVENTS
// ════════════════════════════════════════════════════════
function canvasCell(e) {
    const rect = $('mainCanvas').getBoundingClientRect();
    return { row: Math.floor((e.clientY - rect.top) / SP_H), col: Math.floor((e.clientX - rect.left) / SP_W) };
}

function getWS(row, col) {
    return state.workspace.find(s => s.row === row && s.col === col) || null;
}

function startShiftDrag(e) {
    const { row, col } = canvasCell(e);
    const dragGhost = $('dragGhost');
    dragGhost.width = SP_W; dragGhost.height = SP_H;
    const gctx = dragGhost.getContext('2d');
    gctx.clearRect(0, 0, SP_W, SP_H);
    const sp = getWS(row, col);
    if (sp && sp.imgData) renderSprite(gctx, sp, 0, 0);
    else {
        gctx.strokeStyle = 'rgba(255,200,0,.5)';
        gctx.lineWidth = 2;
        gctx.setLineDash([5, 4]);
        gctx.strokeRect(4, 4, SP_W - 8, SP_H - 8);
        gctx.setLineDash([]);
    }
    dragGhost.style.display = 'block';
    dragGhost.style.width = Math.round(SP_W * .32) + 'px';
    dragGhost.style.height = Math.round(SP_H * .32) + 'px';
    dragGhost.style.borderColor = (e.metaKey || e.ctrlKey) ? '#00dc64' : '#ffc107';
    state.shiftDrag = { srcRow: row, srcCol: col, composite: e.metaKey || e.ctrlKey };
    state.shiftDragOver = null;
    $('trashZone').classList.add('visible');
    moveGhost(e);
    render();
    e.preventDefault();
}

function moveGhost(e) {
    const dragGhost = $('dragGhost');
    const hw = parseInt(dragGhost.style.width) / 2;
    const hh = parseInt(dragGhost.style.height) / 2;
    dragGhost.style.left = (e.clientX - hw) + 'px';
    dragGhost.style.top = (e.clientY - hh) + 'px';
}

export function setupComposeMouseEvents() {
    const mainCanvas = $('mainCanvas');

    mainCanvas.addEventListener('mousedown', e => {
        if (e.shiftKey) { startShiftDrag(e); return; }

        const { row, col } = canvasCell(e);
        const sp = getWS(row, col);

        state.selectedCell = sp || null;
        $('spriteControls').style.display = sp ? 'block' : 'none';
        if (sp) {
            $('selectedInfo').textContent = `R${row + 1} C${col + 1}`;
            $('spriteXSlider').value = $('spriteXInput').value = sp.offsetX;
            $('spriteYSlider').value = $('spriteYInput').value = sp.offsetY;
            $('spriteScaleSlider').value = $('spriteScaleInput').value = sp.scale;
            setCmpHscbUI(sp);
        }

        if (sp && sp.imgData) {
            const rect = mainCanvas.getBoundingClientRect();
            state.normalDrag = { sp, startMouseX: e.clientX - rect.left, startMouseY: e.clientY - rect.top, startOffsetX: sp.offsetX, startOffsetY: sp.offsetY };
            mainCanvas.style.cursor = 'grabbing';
        }

        render();
        e.preventDefault();
    });

    mainCanvas.addEventListener('mousemove', e => {
        if (state.shiftDrag) return;
        if (!state.normalDrag) return;
        const rect = mainCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        state.normalDrag.sp.offsetX = Math.round(state.normalDrag.startOffsetX + (mx - state.normalDrag.startMouseX));
        state.normalDrag.sp.offsetY = Math.round(state.normalDrag.startOffsetY + (my - state.normalDrag.startMouseY));
        $('spriteXSlider').value = $('spriteXInput').value = state.normalDrag.sp.offsetX;
        $('spriteYSlider').value = $('spriteYInput').value = state.normalDrag.sp.offsetY;
        render();
    });

    mainCanvas.addEventListener('mouseup', () => {
        if (state.normalDrag) { state.normalDrag = null; mainCanvas.style.cursor = 'default'; }
    });
    mainCanvas.addEventListener('mouseleave', () => {
        if (state.normalDrag) { state.normalDrag = null; mainCanvas.style.cursor = 'default'; }
    });

    // Global shift-drag handling
    document.addEventListener('mousemove', e => {
        if (!state.shiftDrag) return;
        moveGhost(e);
        const rect = mainCanvas.getBoundingClientRect();
        const inCanvas = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (inCanvas) {
            state.shiftDragOver = { row: Math.floor((e.clientY - rect.top) / SP_H), col: Math.floor((e.clientX - rect.left) / SP_W) };
        } else state.shiftDragOver = null;
        const tr = $('trashZone').getBoundingClientRect();
        $('trashZone').classList.toggle('hot', e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom);
        render();
    });

    document.addEventListener('mouseup', e => {
        if (!state.shiftDrag) return;
        const sd = state.shiftDrag;
        state.shiftDrag = null;
        state.shiftDragOver = null;
        $('dragGhost').style.display = 'none';
        $('trashZone').classList.remove('visible', 'hot');

        // trash?
        const tr = $('trashZone').getBoundingClientRect();
        if (e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom) {
            const s = getWS(sd.srcRow, sd.srcCol);
            if (s) { s.imgData = null; s.imgDataURL = null; s.offsetX = 0; s.offsetY = 0; s.scale = 1; s.flipH = false; s.mirrorSide = 0; s.hue = 0; s.sat = 0; s.con = 0; s.bri = 0; }
            render();
            return;
        }

        const rect = mainCanvas.getBoundingClientRect();
        const inCanvas = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!inCanvas) { render(); return; }
        const dstRow = Math.floor((e.clientY - rect.top) / SP_H), dstCol = Math.floor((e.clientX - rect.left) / SP_W);
        if (dstRow === sd.srcRow && dstCol === sd.srcCol) { render(); return; }

        const src = getWS(sd.srcRow, sd.srcCol), dst = getWS(dstRow, dstCol);
        if (!src || !dst) { render(); return; }

        // Composite mode
        if (sd.composite) {
            if (!src.imgData && !dst.imgData) { render(); return; }
            const merged = document.createElement('canvas');
            merged.width = SP_W; merged.height = SP_H;
            const mrgCtx = merged.getContext('2d');
            mrgCtx.imageSmoothingEnabled = false;
            if (dst.imgData) renderSprite(mrgCtx, dst, 0, 0);
            if (src.imgData) renderSprite(mrgCtx, src, 0, 0);
            dst.imgData = merged;
            dst.imgDataURL = null;
            dst.offsetX = 0; dst.offsetY = 0; dst.scale = 1;
            dst.flipH = false; dst.mirrorSide = 0;
            dst.hue = 0; dst.sat = 0; dst.con = 0; dst.bri = 0;
            if (state.selectedCell && state.selectedCell.row === dstRow && state.selectedCell.col === dstCol) {
                setCmpHscbUI(dst);
                $('spriteXSlider').value = $('spriteXInput').value = 0;
                $('spriteYSlider').value = $('spriteYInput').value = 0;
                $('spriteScaleSlider').value = $('spriteScaleInput').value = 1;
            }
            render();
            return;
        }

        // Normal shift+drag: swap/copy
        const srcHasContent = !!src.imgData;
        const dstHasContent = !!dst.imgData;

        if (srcHasContent && !dstHasContent) {
            dst.imgData = cloneCanvas(src.imgData);
            dst.imgDataURL = src.imgDataURL;
            dst.offsetX = src.offsetX; dst.offsetY = src.offsetY; dst.scale = src.scale;
            dst.flipH = src.flipH; dst.mirrorSide = src.mirrorSide;
            dst.hue = src.hue || 0; dst.sat = src.sat || 0; dst.con = src.con || 0; dst.bri = src.bri || 0;
        } else {
            const tmp = { imgData: src.imgData, imgDataURL: src.imgDataURL, offsetX: src.offsetX, offsetY: src.offsetY, scale: src.scale, flipH: src.flipH, mirrorSide: src.mirrorSide, hue: src.hue || 0, sat: src.sat || 0, con: src.con || 0, bri: src.bri || 0 };
            src.imgData = dst.imgData; src.imgDataURL = dst.imgDataURL;
            src.offsetX = dst.offsetX; src.offsetY = dst.offsetY; src.scale = dst.scale;
            src.flipH = dst.flipH; src.mirrorSide = dst.mirrorSide;
            src.hue = dst.hue || 0; src.sat = dst.sat || 0; src.con = dst.con || 0; src.bri = dst.bri || 0;
            dst.imgData = tmp.imgData; dst.imgDataURL = tmp.imgDataURL;
            dst.offsetX = tmp.offsetX; dst.offsetY = tmp.offsetY; dst.scale = tmp.scale;
            dst.flipH = tmp.flipH; dst.mirrorSide = tmp.mirrorSide;
            dst.hue = tmp.hue; dst.sat = tmp.sat; dst.con = tmp.con; dst.bri = tmp.bri;
            if (state.selectedCell && state.selectedCell.row === sd.srcRow && state.selectedCell.col === sd.srcCol) state.selectedCell = src;
            else if (state.selectedCell && state.selectedCell.row === dstRow && state.selectedCell.col === dstCol) state.selectedCell = dst;
        }
        render();
    });
}

// ════════════════════════════════════════════════════════
//  COMPOSER — ADD/REMOVE ROW
// ════════════════════════════════════════════════════════
function addRow() {
    if (!$('mainCanvas').width) return;
    for (let c = 0; c < state.compCols; c++) {
        state.workspace.push({ row: state.compRows, col: c, imgData: null, imgDataURL: null, offsetX: 0, offsetY: 0, scale: 1, flipH: false, mirrorSide: 0, hue: 0, sat: 0, con: 0, bri: 0 });
    }
    state.compRows++;
    resizeMC();
    render();
}

function removeRow() {
    if (state.compRows <= 1) return;
    state.compRows--;
    state.workspace = state.workspace.filter(s => s.row < state.compRows);
    if (state.selectedCell && state.selectedCell.row >= state.compRows) { state.selectedCell = null; $('spriteControls').style.display = 'none'; }
    resizeMC();
    render();
}

// ════════════════════════════════════════════════════════
//  COMPOSER — CONTROLS HELPERS
// ════════════════════════════════════════════════════════
function syncSliders(sl, inp, cb) {
    sl.addEventListener('input', () => { inp.value = sl.value; cb(); });
    inp.addEventListener('input', () => { sl.value = inp.value; cb(); });
}

function updateSel() {
    if (!state.selectedCell) return;
    state.selectedCell.offsetX = parseFloat($('spriteXInput').value);
    state.selectedCell.offsetY = parseFloat($('spriteYInput').value);
    state.selectedCell.scale = parseFloat($('spriteScaleInput').value);
    render();
}

function setCmpHscbUI(sp) {
    if (!sp) return;
    $('cmpHue').value = $('cmpHueN').value = sp.hue || 0;
    $('cmpSat').value = $('cmpSatN').value = sp.sat || 0;
    $('cmpCon').value = $('cmpConN').value = sp.con || 0;
    $('cmpBri').value = $('cmpBriN').value = sp.bri || 0;
    const active = (sp.hue || 0) !== 0 || (sp.sat || 0) !== 0 || (sp.con || 0) !== 0 || (sp.bri || 0) !== 0;
    $('cmpHscbWrap').classList.toggle('hscb-active', active);
}

function buildComposeExport() {
    const exp = document.createElement('canvas');
    exp.width = $('mainCanvas').width;
    exp.height = $('mainCanvas').height;
    const ec = exp.getContext('2d');
    ec.imageSmoothingEnabled = false;
    state.workspace.forEach(sp => renderSprite(ec, sp, sp.col * SP_W, sp.row * SP_H));
    return exp;
}

// ════════════════════════════════════════════════════════
//  COMPOSER — BIND EVENTS
// ════════════════════════════════════════════════════════
export function bindComposeEvents() {
    $('addRowBtn').addEventListener('click', addRow);
    $('removeRowBtn').addEventListener('click', removeRow);
    $('showGridCheck').addEventListener('change', render);
    $('showTilesCheck').addEventListener('change', render);

    syncSliders($('spriteXSlider'), $('spriteXInput'), updateSel);
    syncSliders($('spriteYSlider'), $('spriteYInput'), updateSel);
    syncSliders($('spriteScaleSlider'), $('spriteScaleInput'), updateSel);

    $('flipHBtn').addEventListener('click', () => { if (state.selectedCell) { state.selectedCell.flipH = !state.selectedCell.flipH; render(); } });
    $('mirrorLBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.mirrorSide = state.selectedCell.mirrorSide === 1 ? 0 : 1; render(); });
    $('mirrorRBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.mirrorSide = state.selectedCell.mirrorSide === 2 ? 0 : 2; render(); });
    $('resetSprScaleBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.scale = 1; $('spriteScaleSlider').value = $('spriteScaleInput').value = 1; render(); });

    // HSCB
    [['cmpHue', 'cmpHueN', 'hue'], ['cmpSat', 'cmpSatN', 'sat'], ['cmpCon', 'cmpConN', 'con'], ['cmpBri', 'cmpBriN', 'bri']].forEach(([r, n, k]) => {
        const onChange = e => {
            if (!state.selectedCell) return;
            const v = parseInt(e.target.value) || 0;
            state.selectedCell[k] = v;
            $(r).value = v;
            $(n).value = v;
            const active = (state.selectedCell.hue || 0) !== 0 || (state.selectedCell.sat || 0) !== 0 || (state.selectedCell.con || 0) !== 0 || (state.selectedCell.bri || 0) !== 0;
            $('cmpHscbWrap').classList.toggle('hscb-active', active);
            render();
        };
        $(r).addEventListener('input', onChange);
        $(n).addEventListener('input', onChange);
    });

    $('cmpHscbResetBtn').addEventListener('click', () => {
        if (!state.selectedCell) return;
        state.selectedCell.hue = 0; state.selectedCell.sat = 0; state.selectedCell.con = 0; state.selectedCell.bri = 0;
        setCmpHscbUI(state.selectedCell);
        render();
    });

    $('clearSpriteBtn').addEventListener('click', () => {
        if (!state.selectedCell) return;
        state.selectedCell.imgData = null;
        state.selectedCell.imgDataURL = null;
        state.selectedCell.offsetX = 0; state.selectedCell.offsetY = 0;
        state.selectedCell.scale = 1; state.selectedCell.flipH = false; state.selectedCell.mirrorSide = 0;
        state.selectedCell.hue = 0; state.selectedCell.sat = 0; state.selectedCell.con = 0; state.selectedCell.bri = 0;
        setCmpHscbUI(state.selectedCell);
        render();
    });

    $('resetSpriteBtn').addEventListener('click', () => {
        if (!state.selectedCell) return;
        state.selectedCell.offsetX = 0; state.selectedCell.offsetY = 0;
        state.selectedCell.scale = 1; state.selectedCell.flipH = false; state.selectedCell.mirrorSide = 0;
        state.selectedCell.hue = 0; state.selectedCell.sat = 0; state.selectedCell.con = 0; state.selectedCell.bri = 0;
        $('spriteXSlider').value = $('spriteXInput').value = 0;
        $('spriteYSlider').value = $('spriteYInput').value = 0;
        $('spriteScaleSlider').value = $('spriteScaleInput').value = 1;
        setCmpHscbUI(state.selectedCell);
        render();
    });

    $('composeApplyBtn').addEventListener('click', () => {
        state.workspace.forEach(sp => {
            if (sp.imgData) sp.imgDataURL = sp.imgData.toDataURL('image/png');
        });
        const exp = buildComposeExport();
        const a = state.assets[state.currentAssetIdx];
        a.composerCanvasDataURL = exp.toDataURL('image/png');
        a.composerParams = {
            rows: state.compRows,
            sprites: state.workspace.map(sp => ({
                row: sp.row, col: sp.col,
                imgDataURL: sp.imgDataURL || null,
                offsetX: sp.offsetX, offsetY: sp.offsetY,
                scale: sp.scale, flipH: sp.flipH, mirrorSide: sp.mirrorSide,
                hue: sp.hue || 0, sat: sp.sat || 0, con: sp.con || 0, bri: sp.bri || 0,
            })),
        };
        if (_composeApplyCallback) _composeApplyCallback();
        $('composeApplyBtn').textContent = '✅ Validé !';
        setTimeout(() => $('composeApplyBtn').textContent = '✅ Valider composition', 1500);
    });

    $('composeNextBtn').addEventListener('click', () => {
        if (state.currentAssetIdx < state.assets.length - 1) selectAsset(state.currentAssetIdx + 1);
    });
}