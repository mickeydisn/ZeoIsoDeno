// ════════════════════════════════════════════════════════
//  FIX MODULE — Étape 1 : Recadrage
//  User defines crop grid + global transforms.
//  Validating bakes the fix output into asset.fix.canvas.
// ════════════════════════════════════════════════════════
import { state, createAsset } from '../state.js';
import { FINAL_W, FINAL_H, DEFAULT_COLS } from '../constants.js';
import { applyRemoveBg, getBgColor, getScaledImage } from '../utils/canvas.js';
import { applyHSCB } from '../utils/hscb.js';
import { drawIsoTileF } from '../utils/iso.js';
import { selectAsset, getAsset } from '../app.js';
import { bakeFix } from '../pipeline/pipelineRenderer.js';

const $ = id => document.getElementById(id);

// Doms
export function getFixDomRefs() {
    return {
        sourceCanvas: $('sourceCanvas'), sCtx: $('sourceCanvas').getContext('2d'),
        fixCanvasWrap: $('fixCanvasWrap'), fixEmptyState: $('fixEmptyState'),
        previewGrid: $('previewGrid'), zoomInput: $('zoomInput'),
        scaleInput: $('scaleInput'), offsetXInput: $('offsetXInput'), offsetYInput: $('offsetYInput'),
        rowCountInput: $('sourceRowCountInput'), removeBgCheck: $('removeBgCheck'),
        smoothEdgeInput: $('smoothEdgeInput'), smoothEdgeGroup: $('smoothEdgeGroup'),
        showTilesFixChk: $('showTilesCheckFix'),
        fixApplyBtn: $('fixApplyBtn'), fixNextBtn: $('fixNextBtn'),
        fixStats: $('fixStats'), statSrc: $('statSrc'), statOut: $('statOut'), statGrid: $('statGrid'),
    };
}

// Import image → create asset
export function setupAssetFromImport(img, fileName) {
    const asset = createAsset(img, fileName);
    state.assets.push(asset);
    state.currentAssetIdx = state.assets.length - 1;
    loadFixImage(asset);
}

export function loadFixImage(asset) {
    state.fixImage = asset.sourceImage;
    $('sourceCanvas').style.display = 'block';
    $('fixEmptyState').style.display = 'none';

    const p = asset.fix.params;
    if (p) {
        restoreFixParams(p);
    } else {
        const img = asset.sourceImage;
        const cw = img.width / DEFAULT_COLS;
        const calcRows = Math.max(1, Math.round(img.height / cw));
        $('sourceRowCountInput').value = calcRows;
        $('scaleInput').value = 1; $('offsetXInput').value = 0; $('offsetYInput').value = 0;
        document.querySelectorAll('.column-offset-x,.column-offset-y').forEach(el => el.value = 0);
        $('removeBgCheck').checked = false;
        $('smoothEdgeGroup').style.display = 'none';
        $('smoothEdgeInput').value = 2;
        state.fixHscb = { hue: 0, sat: 0, con: 0, bri: 0 };
        setFixHscbUI();
        initGridLines(calcRows);
    }
    $('fixStats').style.display = 'grid';
    $('statSrc').textContent = asset.sourceImage.width + 'x' + asset.sourceImage.height;
    $('fixApplyBtn').disabled = false;
    updateFixPreview();
}

function restoreFixParams(p) {
    $('sourceRowCountInput').value = p.sourceRows;
    $('scaleInput').value = p.scale; $('offsetXInput').value = p.offsetX; $('offsetYInput').value = p.offsetY;
    $('removeBgCheck').checked = p.removeBg;
    $('smoothEdgeGroup').style.display = p.removeBg ? 'block' : 'none';
    $('smoothEdgeInput').value = p.erosion;
    $('zoomInput').value = p.zoom || 1;
    document.querySelectorAll('.column-offset-x').forEach((el, i) => el.value = p.colOffsetX[i] || 0);
    document.querySelectorAll('.column-offset-y').forEach((el, i) => el.value = p.colOffsetY[i] || 0);
    state.rowYPos = [...p.rowPositions];
    state.colXPos = p.colPositions ? [...p.colPositions] : buildDefaultColPositions();
    state.fixScale = p.zoom || 1;
    state.fixHscb = p.hscb ? { ...p.hscb } : { hue:0, sat:0, con:0, bri:0 };
    setFixHscbUI();
    drawSourceCanvas();
    updateFixPreview();
}

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
    const rs = state.fixImage.height / rows;
    for (let i = 1; i < rows; i++) state.rowYPos.push(Math.round(i * rs));
    state.rowYPos.push(state.fixImage.height);
    state.colXPos = buildDefaultColPositions();
    drawSourceCanvas();
    updateFixPreview();
}

export function drawSourceCanvas() {
    if (!state.fixImage) return;
    const sc = $('sourceCanvas'), sctx = sc.getContext('2d');
    sc.width = state.fixImage.width;
    sc.height = state.fixImage.height;
    state.fixScale = parseFloat($('zoomInput').value) || 1;
    sc.style.transform = `scale(${state.fixScale})`;
    sc.style.transformOrigin = 'top left';
    sctx.imageSmoothingEnabled = false;
    sctx.clearRect(0, 0, sc.width, sc.height);
    sctx.drawImage(state.fixImage, 0, 0);
    for (let i = 1; i < state.rowYPos.length - 1; i++) {
        const y = state.rowYPos[i], hot = state.activeDragLine === i;
        sctx.strokeStyle = hot ? 'rgba(255,255,0,1)' : 'rgba(255,60,60,.9)';
        sctx.lineWidth = hot ? 4 : 2;
        sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(state.fixImage.width, y); sctx.stroke();
        sctx.fillStyle = hot ? '#ffff00' : '#ff5050';
        sctx.font = 'bold 16px sans-serif'; sctx.textAlign = 'left';
        sctx.fillText('R' + i, 4, y - 4);
    }
    for (let i = 1; i < state.colXPos.length - 1; i++) {
        const x = state.colXPos[i], hot = state.activeDragLine === -i;
        sctx.strokeStyle = hot ? 'rgba(255,255,0,1)' : 'rgba(60,255,60,.9)';
        sctx.lineWidth = hot ? 4 : 2;
        sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, state.fixImage.height); sctx.stroke();
        sctx.fillStyle = hot ? '#ffff00' : '#50ff50';
        sctx.font = 'bold 16px sans-serif'; sctx.textAlign = 'left';
        sctx.fillText('C' + i, x + 3, 18);
    }
}

export function setupFixMouseEvents() {
    const sc = $('sourceCanvas');
    sc.addEventListener('mousedown', e => {
        if (!state.fixImage) return;
        const { x, y } = fixMouse(e);
        const HIT = 8 / state.fixScale;
        for (let i = 1; i < state.rowYPos.length - 1; i++)
            if (Math.abs(y - state.rowYPos[i]) < HIT) { state.activeDragLine = i; drawSourceCanvas(); return; }
        for (let i = 1; i < state.colXPos.length - 1; i++)
            if (Math.abs(x - state.colXPos[i]) < HIT) { state.activeDragLine = -i; drawSourceCanvas(); return; }
    });
    sc.addEventListener('mousemove', e => {
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
            sc.style.cursor = cur;
            return;
        }
        if (state.activeDragLine > 0) {
            const i = state.activeDragLine;
            const ny = Math.round(y);
            const fin = Math.max(state.rowYPos[i - 1] + 1, Math.min(state.rowYPos[i + 1] - 1, Math.min(state.fixImage.height - 1, ny)));
            if (state.rowYPos[i] !== fin) { state.rowYPos[i] = fin; drawSourceCanvas(); updateFixPreview(); }
        } else {
            const i = -state.activeDragLine;
            const nx = Math.round(x);
            const fin = Math.max(state.colXPos[i - 1] + 1, Math.min(state.colXPos[i + 1] - 1, Math.min(state.fixImage.width - 1, nx)));
            if (state.colXPos[i] !== fin) { state.colXPos[i] = fin; drawSourceCanvas(); updateFixPreview(); }
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

export function getFixParams() {
    const coX = [], coY = [];
    document.querySelectorAll('.column-offset-x').forEach(el => coX.push(parseInt(el.value) || 0));
    document.querySelectorAll('.column-offset-y').forEach(el => coY.push(parseInt(el.value) || 0));
    return {
        scale: parseFloat($('scaleInput').value),
        offsetX: parseInt($('offsetXInput').value) || 0, offsetY: parseInt($('offsetYInput').value) || 0,
        removeBg: $('removeBgCheck').checked, erosion: parseInt($('smoothEdgeInput').value) || 0,
        zoom: parseFloat($('zoomInput').value) || 1,
        sourceRows: parseInt($('sourceRowCountInput').value) || 1,
        rowPositions: [...state.rowYPos], colPositions: [...state.colXPos],
        colOffsetX: coX, colOffsetY: coY,
        hscb: { ...state.fixHscb },
    };
}

function updateFixPreview() {
    if (!state.fixImage || state.rowYPos.length < 2 || state.colXPos.length < 2) return;
    const p = getFixParams();
    const nR = state.rowYPos.length - 1, nC = state.colXPos.length - 1;
    $('statOut').textContent = (FINAL_W * nC) + 'x' + (FINAL_H * nR);
    $('statGrid').textContent = nC + 'x' + nR;
    const sc = getScaledImage(state.fixImage, getFixParams, state.fixHscb, applyHSCB);
    if (!sc) return;
    const grid = $('previewGrid');
    grid.innerHTML = '';
    for (let r = 0; r < nR; r++) {
        const sy0 = state.rowYPos[r] * p.scale, sh = (state.rowYPos[r+1] - state.rowYPos[r]) * p.scale, va = FINAL_H - sh;
        for (let c = 0; c < nC; c++) {
            const sx0 = state.colXPos[c] * p.scale, sw = (state.colXPos[c+1] - state.colXPos[c]) * p.scale, hc = (FINAL_W - sw) / 2;
            const dx = hc + p.offsetX + (p.colOffsetX[c] || 0), dy = va + p.offsetY + (p.colOffsetY[c] || 0);
            const pc = document.createElement('canvas');
            pc.width = FINAL_W; pc.height = FINAL_H;
            const pctx = pc.getContext('2d');
            pctx.imageSmoothingEnabled = false;
            pctx.drawImage(sc, sx0, sy0, sw, sh, dx, dy, sw, sh);
            if ($('showTilesCheckFix').checked) drawIsoTileF(pctx, 0, 0, FINAL_W, FINAL_H);
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            cell.appendChild(pc);
            grid.appendChild(cell);
        }
    }
}

export function validateFix() {
    const asset = getAsset();
    if (!asset) return;
    asset.fix.params = getFixParams();
    asset.fix.canvas = bakeFix(asset.sourceImage, asset.fix.params);
    asset.fix.validated = true;
    // Invalidate downstream
    asset.rows.validated = false;
    asset.compose.validated = false;
    asset.mask.validated = false;
}

export function setFixHscbUI() {
    $('fixHue').value = $('fixHueN').value = state.fixHscb.hue;
    $('fixSat').value = $('fixSatN').value = state.fixHscb.sat;
    $('fixCon').value = $('fixConN').value = state.fixHscb.con;
    $('fixBri').value = $('fixBriN').value = state.fixHscb.bri;
    const a = state.fixHscb.hue!==0||state.fixHscb.sat!==0||state.fixHscb.con!==0||state.fixHscb.bri!==0;
    $('fixHscbWrap').classList.toggle('hscb-active', a);
}

export function bindFixEvents() {
    $('zoomInput').addEventListener('input', () => { state.fixScale = parseFloat($('zoomInput').value)||1; drawSourceCanvas(); });
    [$('scaleInput'),$('offsetXInput'),$('offsetYInput'),$('smoothEdgeInput')].forEach(el => el.addEventListener('input', updateFixPreview));
    $('showTilesCheckFix').addEventListener('change', updateFixPreview);
    document.querySelectorAll('.column-offset-x,.column-offset-y').forEach(el => el.addEventListener('input', updateFixPreview));
    $('sourceRowCountInput').addEventListener('change', () => initGridLines(parseInt($('sourceRowCountInput').value)||1));
    $('removeBgCheck').addEventListener('change', () => {
        $('smoothEdgeGroup').style.display = $('removeBgCheck').checked ? 'block' : 'none';
        updateFixPreview();
    });
    $('fixApplyBtn').addEventListener('click', () => {
        validateFix();
        $('fixApplyBtn').textContent = '✅ Validé !';
        setTimeout(() => $('fixApplyBtn').textContent = '✅ Valider', 1500);
    });
    [['fixHue','fixHueN','hue'],['fixSat','fixSatN','sat'],['fixCon','fixConN','con'],['fixBri','fixBriN','bri']].forEach(([r,n,k]) => {
        const onChange = e => {
            const v = parseInt(e.target.value)||0; state.fixHscb[k]=v; $(r).value=v; $(n).value=v;
            const a=state.fixHscb.hue!==0||state.fixHscb.sat!==0||state.fixHscb.con!==0||state.fixHscb.bri!==0;
            $('fixHscbWrap').classList.toggle('hscb-active',a);
            updateFixPreview();
        };
        $(r).addEventListener('input',onChange); $(n).addEventListener('input',onChange);
    });
    $('fixHscbResetBtn').addEventListener('click',()=>{state.fixHscb={hue:0,sat:0,con:0,bri:0};setFixHscbUI();updateFixPreview();});
    $('fixNextBtn').addEventListener('click',()=>{if(state.currentAssetIdx<state.assets.length-1) selectAsset(state.currentAssetIdx+1);});
}