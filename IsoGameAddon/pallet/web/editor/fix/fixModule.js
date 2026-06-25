// ════════════════════════════════════════════════════════
//  FIX MODULE — Étape 1 : Recadrage
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { FINAL_W, FINAL_H, DEFAULT_COLS } from '../constants.js';
import { applyRemoveBg, getBgColor, getScaledImage } from '../utils/canvas.js';
import { applyHSCB } from '../utils/hscb.js';
import { drawIsoTileF } from '../utils/iso.js';
import { selectAsset } from '../app.js';

const $ = id => document.getElementById(id);

let _fixApplyCallback = null;

export function onFixApply(cb) {
    _fixApplyCallback = cb;
}

// ─── DOM refs helper ───
export function getFixDomRefs() {
    return {
        sourceCanvas: $('sourceCanvas'),
        sCtx: $('sourceCanvas').getContext('2d'),
        fixCanvasWrap: $('fixCanvasWrap'),
        fixEmptyState: $('fixEmptyState'),
        previewGrid: $('previewGrid'),
        zoomInput: $('zoomInput'),
        scaleInput: $('scaleInput'),
        offsetXInput: $('offsetXInput'),
        offsetYInput: $('offsetYInput'),
        rowCountInput: $('sourceRowCountInput'),
        removeBgCheck: $('removeBgCheck'),
        smoothEdgeInput: $('smoothEdgeInput'),
        smoothEdgeGroup: $('smoothEdgeGroup'),
        showTilesFixChk: $('showTilesCheckFix'),
        fixApplyBtn: $('fixApplyBtn'),
        fixNextBtn: $('fixNextBtn'),
        fixStats: $('fixStats'),
        statSrc: $('statSrc'),
        statOut: $('statOut'),
        statGrid: $('statGrid'),
    };
}

// ════════════════════════════════════════════════════════
//  FIX — LOAD
// ════════════════════════════════════════════════════════
export function loadFixImage(dataURL, saved) {
    const img = new Image();
    img.onload = () => {
        state.fixImage = img;
        $('sourceCanvas').style.display = 'block';
        $('fixEmptyState').style.display = 'none';

        const { rowCountInput, scaleInput, offsetXInput, offsetYInput,
                removeBgCheck, smoothEdgeGroup, smoothEdgeInput, zoomInput } = getFixDomRefs();

        if (saved) {
            applyFixParams(saved);
        } else {
            const cw = img.width / DEFAULT_COLS;
            const calcRows = Math.max(1, Math.round(img.height / cw));
            rowCountInput.value = calcRows;
            scaleInput.value = 1; offsetXInput.value = 0; offsetYInput.value = 0;
            document.querySelectorAll('.column-offset-x,.column-offset-y').forEach(el => el.value = 0);
            removeBgCheck.checked = false;
            smoothEdgeGroup.style.display = 'none';
            smoothEdgeInput.value = 2;
            state.fixHscb = { hue: 0, sat: 0, con: 0, bri: 0 };
            setFixHscbUI();
            initGridLines(calcRows);
        }

        $('fixStats').style.display = 'grid';
        $('statSrc').textContent = img.width + 'x' + img.height;
        $('fixApplyBtn').disabled = false;
        $('fixNextBtn').disabled = state.currentAssetIdx >= state.assets.length - 1;
        updateFixOutput();
    };
    img.src = dataURL;
}

function applyFixParams(p) {
    const { rowCountInput, scaleInput, offsetXInput, offsetYInput,
            removeBgCheck, smoothEdgeGroup, smoothEdgeInput, zoomInput } = getFixDomRefs();
    rowCountInput.value = p.sourceRows;
    scaleInput.value = p.scale; offsetXInput.value = p.offsetX; offsetYInput.value = p.offsetY;
    removeBgCheck.checked = p.removeBg;
    smoothEdgeGroup.style.display = p.removeBg ? 'block' : 'none';
    smoothEdgeInput.value = p.erosion;
    zoomInput.value = p.zoom || 1;
    document.querySelectorAll('.column-offset-x').forEach((el, i) => el.value = p.colOffsetX[i] || 0);
    document.querySelectorAll('.column-offset-y').forEach((el, i) => el.value = p.colOffsetY[i] || 0);
    state.rowYPos = [...p.rowPositions];
    state.colXPos = p.colPositions ? [...p.colPositions] : buildDefaultColPositions();
    state.fixScale = p.zoom || 1;
    state.fixHscb = p.hscb ? { ...p.hscb } : { hue: 0, sat: 0, con: 0, bri: 0 };
    setFixHscbUI();
    drawSourceCanvas();
    updateFixOutput();
}

// ════════════════════════════════════════════════════════
//  FIX — GRID INIT
// ════════════════════════════════════════════════════════
export function buildDefaultColPositions() {
    if (!state.fixImage) return [0, 100];
    const pos = [0];
    const step = state.fixImage.width / DEFAULT_COLS;
    for (let i = 1; i < DEFAULT_COLS; i++) pos.push(Math.round(i * step));
    pos.push(state.fixImage.width);
    return pos;
}

export function initGridLines(rows) {
    if (!state.fixImage || rows <= 0) return;
    rows = Math.min(rows, 100);
    state.rowYPos = [0];
    const rStep = state.fixImage.height / rows;
    for (let i = 1; i < rows; i++) state.rowYPos.push(Math.round(i * rStep));
    state.rowYPos.push(state.fixImage.height);
    state.colXPos = buildDefaultColPositions();
    drawSourceCanvas();
    updateFixOutput();
}

// ════════════════════════════════════════════════════════
//  FIX — DRAW SOURCE CANVAS
// ════════════════════════════════════════════════════════
export function drawSourceCanvas() {
    if (!state.fixImage) return;
    const { sourceCanvas, sCtx, zoomInput } = getFixDomRefs();
    sourceCanvas.width = state.fixImage.width;
    sourceCanvas.height = state.fixImage.height;
    state.fixScale = parseFloat(zoomInput.value) || 1;
    sourceCanvas.style.transform = `scale(${state.fixScale})`;
    sourceCanvas.style.transformOrigin = 'top left';
    sCtx.imageSmoothingEnabled = false;
    sCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    sCtx.drawImage(state.fixImage, 0, 0);

    // ROW dividers — red
    for (let i = 1; i < state.rowYPos.length - 1; i++) {
        const y = state.rowYPos[i], hot = (state.activeDragLine === i);
        sCtx.strokeStyle = hot ? 'rgba(255,255,0,1)' : 'rgba(255,60,60,.9)';
        sCtx.lineWidth = hot ? 4 : 2;
        sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(state.fixImage.width, y); sCtx.stroke();
        sCtx.fillStyle = hot ? '#ffff00' : '#ff5050';
        sCtx.font = 'bold 16px sans-serif'; sCtx.textAlign = 'left';
        sCtx.fillText('R' + i, 4, y - 4);
    }
    // COL dividers — green
    for (let i = 1; i < state.colXPos.length - 1; i++) {
        const x = state.colXPos[i], hot = (state.activeDragLine === -i);
        sCtx.strokeStyle = hot ? 'rgba(255,255,0,1)' : 'rgba(60,255,60,.9)';
        sCtx.lineWidth = hot ? 4 : 2;
        sCtx.beginPath(); sCtx.moveTo(x, 0); sCtx.lineTo(x, state.fixImage.height); sCtx.stroke();
        sCtx.fillStyle = hot ? '#ffff00' : '#50ff50';
        sCtx.font = 'bold 16px sans-serif'; sCtx.textAlign = 'left';
        sCtx.fillText('C' + i, x + 3, 18);
    }
}

// ════════════════════════════════════════════════════════
//  FIX — MOUSE (drag rows & cols)
// ════════════════════════════════════════════════════════
export function setupFixMouseEvents() {
    const { sourceCanvas } = getFixDomRefs();

    sourceCanvas.addEventListener('mousedown', e => {
        if (!state.fixImage) return;
        const { x, y } = fixMouse(e);
        const HIT = 8 / state.fixScale;
        for (let i = 1; i < state.rowYPos.length - 1; i++)
            if (Math.abs(y - state.rowYPos[i]) < HIT) { state.activeDragLine = i; drawSourceCanvas(); return; }
        for (let i = 1; i < state.colXPos.length - 1; i++)
            if (Math.abs(x - state.colXPos[i]) < HIT) { state.activeDragLine = -i; drawSourceCanvas(); return; }
    });

    sourceCanvas.addEventListener('mousemove', e => {
        if (!state.fixImage) return;
        const { x, y } = fixMouse(e);
        const HIT = 8 / state.fixScale;
        if (state.activeDragLine === 0) {
            let cur = 'crosshair';
            for (let i = 1; i < state.rowYPos.length - 1; i++)
                if (Math.abs(y - state.rowYPos[i]) < HIT) { cur = 'ns-resize'; break; }
            if (cur === 'crosshair')
                for (let i = 1; i < state.colXPos.length - 1; i++)
                    if (Math.abs(x - state.colXPos[i]) < HIT) { cur = 'ew-resize'; break; }
            sourceCanvas.style.cursor = cur;
            return;
        }
        if (state.activeDragLine > 0) {
            const i = state.activeDragLine;
            const newY = Math.round(y);
            const fin = Math.max(state.rowYPos[i - 1] + 1, Math.min(state.rowYPos[i + 1] - 1, Math.min(state.fixImage.height - 1, newY)));
            if (state.rowYPos[i] !== fin) { state.rowYPos[i] = fin; drawSourceCanvas(); updateFixOutput(); }
        } else {
            const i = -state.activeDragLine;
            const newX = Math.round(x);
            const fin = Math.max(state.colXPos[i - 1] + 1, Math.min(state.colXPos[i + 1] - 1, Math.min(state.fixImage.width - 1, newX)));
            if (state.colXPos[i] !== fin) { state.colXPos[i] = fin; drawSourceCanvas(); updateFixOutput(); }
        }
    });

    document.addEventListener('mouseup', () => {
        if (state.activeDragLine !== 0) { state.activeDragLine = 0; if (state.fixImage) drawSourceCanvas(); }
    });
}

function fixMouse(e) {
    const rect = $('sourceCanvas').getBoundingClientRect();
    return { x: (e.clientX - rect.left) / state.fixScale, y: (e.clientY - rect.top) / state.fixScale };
}

// ════════════════════════════════════════════════════════
//  FIX — PARAMS & OUTPUT
// ════════════════════════════════════════════════════════
export function getFixParams() {
    const colOffsetX = [], colOffsetY = [];
    document.querySelectorAll('.column-offset-x').forEach(el => colOffsetX.push(parseInt(el.value) || 0));
    document.querySelectorAll('.column-offset-y').forEach(el => colOffsetY.push(parseInt(el.value) || 0));
    const { scaleInput, offsetXInput, offsetYInput, removeBgCheck, smoothEdgeInput, zoomInput, rowCountInput } = getFixDomRefs();
    return {
        scale: parseFloat(scaleInput.value),
        offsetX: parseInt(offsetXInput.value) || 0,
        offsetY: parseInt(offsetYInput.value) || 0,
        removeBg: removeBgCheck.checked,
        erosion: parseInt(smoothEdgeInput.value) || 0,
        zoom: parseFloat(zoomInput.value) || 1,
        sourceRows: parseInt(rowCountInput.value) || 1,
        rowPositions: [...state.rowYPos],
        colPositions: [...state.colXPos],
        colOffsetX,
        colOffsetY,
        hscb: { ...state.fixHscb },
    };
}

function updateFixOutput() {
    if (!state.fixImage || state.rowYPos.length < 2 || state.colXPos.length < 2) return;
    const p = getFixParams();
    const nR = state.rowYPos.length - 1, nC = state.colXPos.length - 1;
    $('statOut').textContent = (FINAL_W * nC) + 'x' + (FINAL_H * nR);
    $('statGrid').textContent = nC + 'x' + nR;
    const sc = getScaledImage(state.fixImage, getFixParams, state.fixHscb, applyHSCB);
    if (!sc) return;
    const previewGrid = $('previewGrid');
    previewGrid.innerHTML = '';
    const { showTilesFixChk } = getFixDomRefs();
    for (let row = 0; row < nR; row++) {
        const sy0 = state.rowYPos[row] * p.scale, sh = (state.rowYPos[row + 1] - state.rowYPos[row]) * p.scale;
        const vA = FINAL_H - sh;
        for (let col = 0; col < nC; col++) {
            const sx0 = state.colXPos[col] * p.scale, sw = (state.colXPos[col + 1] - state.colXPos[col]) * p.scale;
            const hC = (FINAL_W - sw) / 2;
            const dx = hC + p.offsetX + (p.colOffsetX[col] || 0), dy = vA + p.offsetY + (p.colOffsetY[col] || 0);
            const pc = document.createElement('canvas');
            pc.width = FINAL_W; pc.height = FINAL_H;
            const pctx = pc.getContext('2d');
            pctx.imageSmoothingEnabled = false;
            pctx.clearRect(0, 0, FINAL_W, FINAL_H);
            pctx.drawImage(sc, sx0, sy0, sw, sh, dx, dy, sw, sh);
            if (showTilesFixChk.checked) drawIsoTileF(pctx, 0, 0, FINAL_W, FINAL_H);
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            cell.appendChild(pc);
            previewGrid.appendChild(cell);
        }
    }
}

export function buildFixExport() {
    if (!state.fixImage || state.rowYPos.length < 2) return null;
    const p = getFixParams();
    const nR = state.rowYPos.length - 1, nC = state.colXPos.length - 1;
    const exp = document.createElement('canvas');
    exp.width = FINAL_W * nC; exp.height = FINAL_H * nR;
    const ec = exp.getContext('2d');
    ec.imageSmoothingEnabled = false;
    const sc = getScaledImage(state.fixImage, getFixParams, state.fixHscb, applyHSCB);
    if (!sc) return null;
    for (let row = 0; row < nR; row++) {
        const sy0 = state.rowYPos[row] * p.scale, sh = (state.rowYPos[row + 1] - state.rowYPos[row]) * p.scale, vA = FINAL_H - sh;
        for (let col = 0; col < nC; col++) {
            const sx0 = state.colXPos[col] * p.scale, sw = (state.colXPos[col + 1] - state.colXPos[col]) * p.scale, hC = (FINAL_W - sw) / 2;
            const dx = col * FINAL_W + hC + p.offsetX + (p.colOffsetX[col] || 0);
            const dy = row * FINAL_H + vA + p.offsetY + (p.colOffsetY[col] || 0);
            ec.drawImage(sc, sx0, sy0, sw, sh, dx, dy, sw, sh);
        }
    }
    return exp;
}

// ════════════════════════════════════════════════════════
//  FIX — HSCB CONTROLS
// ════════════════════════════════════════════════════════
export function setFixHscbUI() {
    $('fixHue').value = $('fixHueN').value = state.fixHscb.hue;
    $('fixSat').value = $('fixSatN').value = state.fixHscb.sat;
    $('fixCon').value = $('fixConN').value = state.fixHscb.con;
    $('fixBri').value = $('fixBriN').value = state.fixHscb.bri;
    const active = state.fixHscb.hue !== 0 || state.fixHscb.sat !== 0 || state.fixHscb.con !== 0 || state.fixHscb.bri !== 0;
    $('fixHscbWrap').classList.toggle('hscb-active', active);
}

// ════════════════════════════════════════════════════════
//  FIX — EVENT BINDING
// ════════════════════════════════════════════════════════
export function bindFixEvents() {
    const { zoomInput, scaleInput, offsetXInput, offsetYInput, smoothEdgeInput,
            showTilesFixChk, rowCountInput, removeBgCheck, smoothEdgeGroup, fixApplyBtn, fixNextBtn } = getFixDomRefs();

    zoomInput.addEventListener('input', () => { state.fixScale = parseFloat(zoomInput.value) || 1; drawSourceCanvas(); });
    [scaleInput, offsetXInput, offsetYInput, smoothEdgeInput].forEach(el => el.addEventListener('input', updateFixOutput));
    showTilesFixChk.addEventListener('change', updateFixOutput);
    document.querySelectorAll('.column-offset-x,.column-offset-y').forEach(el => el.addEventListener('input', updateFixOutput));
    rowCountInput.addEventListener('change', () => initGridLines(parseInt(rowCountInput.value) || 1));
    removeBgCheck.addEventListener('change', () => {
        smoothEdgeGroup.style.display = removeBgCheck.checked ? 'block' : 'none';
        updateFixOutput();
    });

    fixApplyBtn.addEventListener('click', () => {
        const exp = buildFixExport();
        if (!exp) return;
        const a = state.assets[state.currentAssetIdx];
        a.fixCanvasDataURL = exp.toDataURL('image/png');
        a.fixParams = getFixParams();
        a.composerParams = null;
        a.composerCanvasDataURL = null;
        if (_fixApplyCallback) _fixApplyCallback(a.fixCanvasDataURL);
        fixApplyBtn.textContent = '✅ Validé !';
        setTimeout(() => fixApplyBtn.textContent = '✅ Valider', 1500);
    });

    // HSCB bindings
    [['fixHue', 'fixHueN', 'hue'], ['fixSat', 'fixSatN', 'sat'], ['fixCon', 'fixConN', 'con'], ['fixBri', 'fixBriN', 'bri']].forEach(([r, n, k]) => {
        const onChange = e => {
            const v = parseInt(e.target.value) || 0;
            state.fixHscb[k] = v;
            $(r).value = v;
            $(n).value = v;
            $('fixHscbWrap').classList.toggle('hscb-active',
                state.fixHscb.hue !== 0 || state.fixHscb.sat !== 0 || state.fixHscb.con !== 0 || state.fixHscb.bri !== 0);
            updateFixOutput();
        };
        $(r).addEventListener('input', onChange);
        $(n).addEventListener('input', onChange);
    });

    $('fixHscbResetBtn').addEventListener('click', () => {
        state.fixHscb = { hue: 0, sat: 0, con: 0, bri: 0 };
        setFixHscbUI();
        updateFixOutput();
    });

    fixNextBtn.addEventListener('click', () => {
        if (state.currentAssetIdx < state.assets.length - 1) {
            selectAsset(state.currentAssetIdx + 1);
        }
    });
}