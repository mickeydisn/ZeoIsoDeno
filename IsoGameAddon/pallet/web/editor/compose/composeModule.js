// ════════════════════════════════════════════════════════
//  COMPOSE MODULE — Étape 3 : Composition
//  Per-cell transforms (offset, scale, flip, mirror, HSCB)
//  Validating bakes compose output into asset.compose.canvas
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { SP_W, SP_H, TILE_W, TILE_H } from '../constants.js';
import { drawIsoTileC } from '../utils/iso.js';
import { selectAsset, getAsset } from '../app.js';
import { bakeCompose } from '../pipeline/pipelineRenderer.js';
import { applyHSCB } from '../utils/hscb.js';

const $ = id => document.getElementById(id);

export function loadComposer(asset) {
    if (!asset || !asset.rows.canvas) {
        $('mainCanvas').style.display = 'none';
        $('composeEmpty').style.display = 'flex';
        $('composeApplyBtn').disabled = true;
        return;
    }
    $('composeEmpty').style.display = 'none';
    $('mainCanvas').style.display = 'block';

    const p = asset.fix.params;
    const nR = p.rowPositions.length - 1, nC = p.colPositions.length - 1;

    if (asset.compose.params) {
        state.workspace = asset.compose.params.workspace.map(s => ({ ...s }));
        state.compRows = asset.compose.params.compRows;
        state.compCols = asset.compose.params.compCols;
    } else {
        state.compCols = nC;
        state.compRows = nR;
        state.workspace = [];
        for (let r = 0; r < nR; r++) {
            for (let c = 0; c < nC; c++) {
                state.workspace.push({ row: r, col: c, offsetX:0, offsetY:0, scale:1, flipH:false, mirrorSide:0, hue:0, sat:0, con:0, bri:0, hasContent: true });
            }
        }
    }
    resizeMC();
    render();
    $('composeApplyBtn').disabled = false;
    $('composeNextBtn').disabled = state.currentAssetIdx >= state.assets.length - 1;
}

function resizeMC() {
    $('mainCanvas').width = SP_W * state.compCols;
    $('mainCanvas').height = SP_H * state.compRows;
}

export function render() {
    const mCtx = $('mainCanvas').getContext('2d');
    mCtx.clearRect(0, 0, $('mainCanvas').width, $('mainCanvas').height);

    const a = state.currentAssetIdx >= 0 ? state.assets[state.currentAssetIdx] : null;
    const inputCanvas = a ? (a.rows.canvas || a.fix.canvas) : null;

    if (inputCanvas) mCtx.drawImage(inputCanvas, 0, 0);

    // Apply per-cell transforms
    state.workspace.forEach(sp => {
        if (!sp.hasContent) return;
        const cell = document.createElement('canvas');
        cell.width = SP_W; cell.height = SP_H;
        const ci = cell.getContext('2d');
        ci.imageSmoothingEnabled = false;
        if (inputCanvas) ci.drawImage(inputCanvas, sp.col * SP_W, sp.row * SP_H, SP_W, SP_H, 0, 0, SP_W, SP_H);

        const mc = document.createElement('canvas');
        mc.width = SP_W; mc.height = SP_H;
        const mctx = mc.getContext('2d');
        mctx.imageSmoothingEnabled = false;
        mctx.save();
        mctx.translate(SP_W / 2 + (sp.offsetX || 0), SP_H / 2 + (sp.offsetY || 0));
        mctx.scale((sp.scale || 1) * (sp.flipH ? -1 : 1), sp.scale || 1);
        mctx.drawImage(cell, -SP_W / 2, -SP_H / 2, SP_W, SP_H);
        mctx.restore();

        applyHSCB(mc, sp.hue || 0, sp.sat || 0, sp.con || 0, sp.bri || 0);

        if (sp.mirrorSide) {
            const fc = document.createElement('canvas');
            fc.width = SP_W; fc.height = SP_H;
            const fctx = fc.getContext('2d');
            fctx.imageSmoothingEnabled = false;
            if (sp.mirrorSide === 1) {
                fctx.drawImage(mc, 0, 0, SP_W/2, SP_H, 0, 0, SP_W/2, SP_H);
                fctx.save(); fctx.translate(SP_W, 0); fctx.scale(-1, 1);
                fctx.drawImage(mc, 0, 0, SP_W/2, SP_H, 0, 0, SP_W/2, SP_H);
                fctx.restore();
            } else {
                fctx.drawImage(mc, SP_W/2, 0, SP_W/2, SP_H, SP_W/2, 0, SP_W/2, SP_H);
                fctx.save(); fctx.translate(SP_W, 0); fctx.scale(-1, 1);
                fctx.drawImage(mc, SP_W/2, 0, SP_W/2, SP_H, SP_W/2, 0, SP_W/2, SP_H);
                fctx.restore();
            }
            mCtx.drawImage(fc, sp.col * SP_W, sp.row * SP_H);
        } else {
            mCtx.drawImage(mc, sp.col * SP_W, sp.row * SP_H);
        }
    });

    if ($('showGridCheck').checked) {
        mCtx.strokeStyle = 'rgba(102,126,234,.45)';
        mCtx.lineWidth = 1;
        for (let r = 0; r <= state.compRows; r++) { mCtx.beginPath(); mCtx.moveTo(0, r*SP_H); mCtx.lineTo($('mainCanvas').width, r*SP_H); mCtx.stroke(); }
        for (let c = 0; c <= state.compCols; c++) { mCtx.beginPath(); mCtx.moveTo(c*SP_W, 0); mCtx.lineTo(c*SP_W, $('mainCanvas').height); mCtx.stroke(); }
    }
    if ($('showTilesCheck').checked) state.workspace.forEach(sp => drawIsoTileC(mCtx, sp.col * SP_W, sp.row * SP_H));
    if (state.selectedCell) { mCtx.strokeStyle = '#667eea'; mCtx.lineWidth = 3; mCtx.strokeRect(state.selectedCell.col*SP_W+1, state.selectedCell.row*SP_H+1, SP_W-2, SP_H-2); }
}

function getWS(r, c) { return state.workspace.find(s => s.row === r && s.col === c) || null; }

function canvasCell(e) {
    const rect = $('mainCanvas').getBoundingClientRect();
    return { row: Math.floor((e.clientY - rect.top) / SP_H), col: Math.floor((e.clientX - rect.left) / SP_W) };
}

export function setupComposeMouseEvents() {
    const mc = $('mainCanvas');
    mc.addEventListener('mousedown', e => {
        const {row, col} = canvasCell(e);
        const sp = getWS(row, col);
        state.selectedCell = sp || null;
        $('spriteControls').style.display = sp ? 'block' : 'none';
        if (sp) {
            $('selectedInfo').textContent = `R${row+1} C${col+1}`;
            $('spriteXSlider').value = $('spriteXInput').value = sp.offsetX;
            $('spriteYSlider').value = $('spriteYInput').value = sp.offsetY;
            $('spriteScaleSlider').value = $('spriteScaleInput').value = sp.scale;
            setHscbUI(sp);
        }
        if (sp) {
            const rect = mc.getBoundingClientRect();
            state.normalDrag = { sp, sx: e.clientX - rect.left, sy: e.clientY - rect.top, ox: sp.offsetX, oy: sp.offsetY };
            mc.style.cursor = 'grabbing';
        }
        render();
    });
    mc.addEventListener('mousemove', e => {
        if (!state.normalDrag) return;
        const rect = mc.getBoundingClientRect();
        state.normalDrag.sp.offsetX = Math.round(state.normalDrag.ox + (e.clientX - rect.left - state.normalDrag.sx));
        state.normalDrag.sp.offsetY = Math.round(state.normalDrag.oy + (e.clientY - rect.top - state.normalDrag.sy));
        $('spriteXSlider').value = $('spriteXInput').value = state.normalDrag.sp.offsetX;
        $('spriteYSlider').value = $('spriteYInput').value = state.normalDrag.sp.offsetY;
        render();
    });
    mc.addEventListener('mouseup', () => { if (state.normalDrag) { state.normalDrag = null; mc.style.cursor = 'default'; } });
    mc.addEventListener('mouseleave', () => { if (state.normalDrag) { state.normalDrag = null; mc.style.cursor = 'default'; } });
}

export function validateCompose() {
    const a = getAsset();
    if (!a) return;
    const inputCanvas = a.rows.canvas || a.fix.canvas;
    a.compose.params = {
        compRows: state.compRows, compCols: state.compCols,
        workspace: state.workspace.map(sp => ({
            row: sp.row, col: sp.col, offsetX: sp.offsetX, offsetY: sp.offsetY,
            scale: sp.scale, flipH: sp.flipH, mirrorSide: sp.mirrorSide || 0,
            hue: sp.hue||0, sat: sp.sat||0, con: sp.con||0, bri: sp.bri||0,
            hasContent: sp.hasContent !== false,
        })),
    };
    a.compose.canvas = bakeCompose(inputCanvas, a.compose.params.workspace, a.compose.params.compRows, a.compose.params.compCols);
    a.compose.validated = true;
    a.mask.validated = false;
}

function setHscbUI(sp) {
    if (!sp) return;
    $('cmpHue').value = $('cmpHueN').value = sp.hue||0;
    $('cmpSat').value = $('cmpSatN').value = sp.sat||0;
    $('cmpCon').value = $('cmpConN').value = sp.con||0;
    $('cmpBri').value = $('cmpBriN').value = sp.bri||0;
    $('cmpHscbWrap').classList.toggle('hscb-active', (sp.hue||0)!==0||(sp.sat||0)!==0||(sp.con||0)!==0||(sp.bri||0)!==0);
}

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

export function bindComposeEvents() {
    $('showGridCheck').addEventListener('change', render);
    $('showTilesCheck').addEventListener('change', render);
    syncSliders($('spriteXSlider'), $('spriteXInput'), updateSel);
    syncSliders($('spriteYSlider'), $('spriteYInput'), updateSel);
    syncSliders($('spriteScaleSlider'), $('spriteScaleInput'), updateSel);
    $('flipHBtn').addEventListener('click', () => { if (state.selectedCell) { state.selectedCell.flipH = !state.selectedCell.flipH; render(); } });
    $('mirrorLBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.mirrorSide = state.selectedCell.mirrorSide===1?0:1; render(); });
    $('mirrorRBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.mirrorSide = state.selectedCell.mirrorSide===2?0:2; render(); });
    $('resetSprScaleBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.scale = 1; $('spriteScaleSlider').value = $('spriteScaleInput').value = 1; render(); });
    [['cmpHue','cmpHueN','hue'],['cmpSat','cmpSatN','sat'],['cmpCon','cmpConN','con'],['cmpBri','cmpBriN','bri']].forEach(([r,n,k]) => {
        const cb = e => { if (!state.selectedCell) return; const v = parseInt(e.target.value)||0; state.selectedCell[k]=v; $(r).value=v; $(n).value=v; $('cmpHscbWrap').classList.toggle('hscb-active',(state.selectedCell.hue||0)!==0||(state.selectedCell.sat||0)!==0||(state.selectedCell.con||0)!==0||(state.selectedCell.bri||0)!==0); render(); };
        $(r).addEventListener('input',cb); $(n).addEventListener('input',cb);
    });
    $('cmpHscbResetBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.hue=0;state.selectedCell.sat=0;state.selectedCell.con=0;state.selectedCell.bri=0; setHscbUI(state.selectedCell); render(); });
    $('clearSpriteBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.hasContent=false; state.selectedCell.offsetX=0;state.selectedCell.offsetY=0;state.selectedCell.scale=1;state.selectedCell.flipH=false;state.selectedCell.mirrorSide=0;state.selectedCell.hue=0;state.selectedCell.sat=0;state.selectedCell.con=0;state.selectedCell.bri=0; setHscbUI(state.selectedCell); render(); });
    $('resetSpriteBtn').addEventListener('click', () => { if (!state.selectedCell) return; state.selectedCell.offsetX=0;state.selectedCell.offsetY=0;state.selectedCell.scale=1;state.selectedCell.flipH=false;state.selectedCell.mirrorSide=0;state.selectedCell.hue=0;state.selectedCell.sat=0;state.selectedCell.con=0;state.selectedCell.bri=0; $('spriteXSlider').value=$('spriteXInput').value=0; $('spriteYSlider').value=$('spriteYInput').value=0; $('spriteScaleSlider').value=$('spriteScaleInput').value=1; setHscbUI(state.selectedCell); render(); });
    $('composeApplyBtn').addEventListener('click', () => { validateCompose(); $('composeApplyBtn').textContent='✅ Validé !'; setTimeout(()=>$('composeApplyBtn').textContent='✅ Valider composition',1500); });
    $('composeNextBtn').addEventListener('click', () => { if (state.currentAssetIdx < state.assets.length-1) selectAsset(state.currentAssetIdx+1); });
}