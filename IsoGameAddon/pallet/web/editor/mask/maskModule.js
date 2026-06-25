// ════════════════════════════════════════════════════════
//  MASK MODULE — Étape 3 : Masques
// ════════════════════════════════════════════════════════
import { state, defaultMaskState } from '../state.js';
import { SP_W, SP_H, TILE_W, TILE_H, TILE_PAD_C } from '../constants.js';
import { selectAsset } from '../app.js';

const $ = id => document.getElementById(id);

// ════════════════════════════════════════════════════════
//  MASK — ENGINE
// ════════════════════════════════════════════════════════

function buildMaskPath(ctx, type, ox, oy, w, h) {
    const cx    = w / 2 + ox;
    const tipB  = h - TILE_PAD_C + oy;
    const tipT  = tipB - TILE_H;
    const tipL  = cx - TILE_W / 2;
    const tipR  = cx + TILE_W / 2;

    ctx.beginPath();
    if (type === 'bottom') {
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, tipB - TILE_H / 2);
        ctx.lineTo(tipR, tipB - TILE_H / 2);
        ctx.lineTo(cx, tipB);
        ctx.lineTo(tipL, tipB - TILE_H / 2);
        ctx.lineTo(0, tipB - TILE_H / 2);
        ctx.lineTo(0, 0);
        ctx.closePath();
    } else if (type === 'top') {
        ctx.moveTo(0, h);
        ctx.lineTo(w, h);
        ctx.lineTo(w, tipT + TILE_H / 2);
        ctx.lineTo(tipR, tipT + TILE_H / 2);
        ctx.lineTo(cx, tipT);
        ctx.lineTo(tipL, tipT + TILE_H / 2);
        ctx.lineTo(0, tipT + TILE_H / 2);
        ctx.lineTo(0, h);
        ctx.closePath();
    } else if (type === 'left') {
        ctx.rect(tipL, 0, w - tipL, h);
    } else if (type === 'right') {
        ctx.rect(0, 0, tipR, h);
    }
}

export function applyMasks(srcCanvas, ms) {
    const w = srcCanvas.width, h = srcCanvas.height;
    const nC = Math.round(w / SP_W), nR = Math.round(h / SP_H);

    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;

    for (let r = 0; r < nR; r++) {
        for (let c = 0; c < nC; c++) {
            const dx = c * SP_W, dy = r * SP_H;
            const cell = document.createElement('canvas');
            cell.width = SP_W; cell.height = SP_H;
            const cctx = cell.getContext('2d');
            cctx.imageSmoothingEnabled = false;
            cctx.drawImage(srcCanvas, dx, dy, SP_W, SP_H, 0, 0, SP_W, SP_H);

            ['bottom', 'top', 'left', 'right'].forEach(type => {
                if (!ms[type] || !ms[type].on) return;
                const ox = ms[type].x || 0, oy = ms[type].y || 0;
                const tmp = document.createElement('canvas');
                tmp.width = SP_W; tmp.height = SP_H;
                const tctx = tmp.getContext('2d');
                tctx.imageSmoothingEnabled = false;
                tctx.drawImage(cell, 0, 0);

                const maskC = document.createElement('canvas');
                maskC.width = SP_W; maskC.height = SP_H;
                const mctx2 = maskC.getContext('2d');
                mctx2.fillStyle = '#fff';
                buildMaskPath(mctx2, type, ox, oy, SP_W, SP_H);
                mctx2.fill();

                tctx.globalCompositeOperation = 'destination-in';
                tctx.drawImage(maskC, 0, 0);
                tctx.globalCompositeOperation = 'source-over';

                cctx.clearRect(0, 0, SP_W, SP_H);
                cctx.drawImage(tmp, 0, 0);
            });

            octx.drawImage(cell, dx, dy);
        }
    }
    return out;
}

// ════════════════════════════════════════════════════════
//  MASK — RENDER
// ════════════════════════════════════════════════════════
export function renderMaskCanvas() {
    if (!state.maskSourceImg) return;
    const w = state.maskSourceImg.width, h = state.maskSourceImg.height;
    const maskCanvas = $('maskCanvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = w;
    maskCanvas.height = h;

    maskCtx.imageSmoothingEnabled = false;
    maskCtx.clearRect(0, 0, w, h);
    maskCtx.drawImage(state.maskSourceImg, 0, 0);

    const showOverlay = $('maskShowMaskOverlay').checked;
    const showTiles   = $('maskShowTiles').checked;
    const nC = Math.round(w / SP_W), nR = Math.round(h / SP_H);

    for (let r = 0; r < nR; r++) {
        for (let c = 0; c < nC; c++) {
            const dx = c * SP_W, dy = r * SP_H;

            if (showTiles) {
                const cx = dx + SP_W / 2, by = dy + SP_H - TILE_PAD_C;
                maskCtx.fillStyle = 'rgba(102,126,234,.12)';
                maskCtx.strokeStyle = 'rgba(102,126,234,.5)';
                maskCtx.lineWidth = 1;
                maskCtx.beginPath();
                maskCtx.moveTo(cx, by - TILE_H);
                maskCtx.lineTo(cx + TILE_W / 2, by - TILE_H / 2);
                maskCtx.lineTo(cx, by);
                maskCtx.lineTo(cx - TILE_W / 2, by - TILE_H / 2);
                maskCtx.closePath();
                maskCtx.fill();
                maskCtx.stroke();
            }

            if (!showOverlay) continue;

            const maskColors = { bottom: 'rgba(245,87,108,.35)', top: 'rgba(255,200,0,.35)', left: 'rgba(0,220,100,.35)', right: 'rgba(102,126,234,.35)' };
            ['bottom', 'top', 'left', 'right'].forEach(type => {
                if (!state.maskState[type] || !state.maskState[type].on) return;
                const ox = state.maskState[type].x, oy = state.maskState[type].y;
                maskCtx.save();
                maskCtx.translate(dx, dy);
                maskCtx.beginPath();
                maskCtx.rect(0, 0, SP_W, SP_H);
                buildMaskPath(maskCtx, type, ox, oy, SP_W, SP_H);
                maskCtx.fillStyle = maskColors[type];
                maskCtx.fillRect(0, 0, SP_W, SP_H);
                maskCtx.globalCompositeOperation = 'destination-out';
                maskCtx.beginPath();
                buildMaskPath(maskCtx, type, ox, oy, SP_W, SP_H);
                maskCtx.fill();
                maskCtx.globalCompositeOperation = 'source-over';
                maskCtx.restore();
            });
        }
    }
    updateMaskPreviewStrip();
}

function updateMaskPreviewStrip() {
    const strip = $('maskPreviewStrip');
    strip.innerHTML = '';
    if (!state.maskSourceImg) return;
    const nC = Math.round(state.maskSourceImg.width / SP_W);
    const nR = Math.round(state.maskSourceImg.height / SP_H);
    const masked = applyMasks(state.maskSourceImg, state.maskState);
    for (let r = 0; r < nR; r++) {
        for (let c = 0; c < nC; c++) {
            const pc = document.createElement('canvas');
            pc.width = SP_W; pc.height = SP_H;
            pc.getContext('2d').drawImage(masked, c * SP_W, r * SP_H, SP_W, SP_H, 0, 0, SP_W, SP_H);
            const cell = document.createElement('div');
            cell.className = 'mask-preview-cell';
            cell.appendChild(pc);
            strip.appendChild(cell);
        }
    }
}

// ════════════════════════════════════════════════════════
//  MASK — UI SYNC
// ════════════════════════════════════════════════════════
function syncMaskSlider(rangeId, numId, stateKey, axis) {
    const onChange = e => {
        const v = parseInt(e.target.value) || 0;
        state.maskState[stateKey][axis] = v;
        $(rangeId).value = v;
        $(numId).value = v;
        renderMaskCanvas();
    };
    $(rangeId).addEventListener('input', onChange);
    $(numId).addEventListener('input', onChange);
}

export function setMaskUI() {
    ['bottom', 'top', 'left', 'right'].forEach(id => {
        const cap = id[0].toUpperCase() + id.slice(1);
        const ms = state.maskState[id];
        $('mask' + cap + 'On').checked = ms.on;
        $('maskCard' + cap).classList.toggle('active-mask', ms.on);
        $('mask' + cap + 'X').value = $('mask' + cap + 'XN').value = ms.x;
        $('mask' + cap + 'Y').value = $('mask' + cap + 'YN').value = ms.y;
    });
}

// ════════════════════════════════════════════════════════
//  MASK — PANEL REFRESH
// ════════════════════════════════════════════════════════
export function refreshMaskPanel() {
    const a = state.currentAssetIdx >= 0 ? state.assets[state.currentAssetIdx] : null;
    const src = a ? (a.composerCanvasDataURL || a.fixCanvasDataURL) : null;
    if (!src) {
        $('maskCanvas').style.display = 'none';
        $('maskEmpty').style.display = 'flex';
        $('maskApplyBtn').disabled = true;
        $('maskNextBtn').disabled = true;
        return;
    }
    $('maskEmpty').style.display = 'none';
    $('maskCanvas').style.display = 'block';
    $('maskApplyBtn').disabled = false;
    $('maskNextBtn').disabled = state.currentAssetIdx >= state.assets.length - 1;

    if (a.maskParams) {
        state.maskState = JSON.parse(JSON.stringify(a.maskParams));
        setMaskUI();
    }

    const img = new Image();
    img.onload = () => { state.maskSourceImg = img; renderMaskCanvas(); };
    img.src = src;
}

// ════════════════════════════════════════════════════════
//  MASK — BIND EVENTS
// ════════════════════════════════════════════════════════
export function bindMaskEvents() {
    syncMaskSlider('maskBottomX', 'maskBottomXN', 'bottom', 'x');
    syncMaskSlider('maskBottomY', 'maskBottomYN', 'bottom', 'y');
    syncMaskSlider('maskTopX', 'maskTopXN', 'top', 'x');
    syncMaskSlider('maskTopY', 'maskTopYN', 'top', 'y');
    syncMaskSlider('maskLeftX', 'maskLeftXN', 'left', 'x');
    syncMaskSlider('maskLeftY', 'maskLeftYN', 'left', 'y');
    syncMaskSlider('maskRightX', 'maskRightXN', 'right', 'x');
    syncMaskSlider('maskRightY', 'maskRightYN', 'right', 'y');

    ['bottom', 'top', 'left', 'right'].forEach(id => {
        $('mask' + id[0].toUpperCase() + id.slice(1) + 'On').addEventListener('change', e => {
            state.maskState[id].on = e.target.checked;
            $('maskCard' + id[0].toUpperCase() + id.slice(1)).classList.toggle('active-mask', e.target.checked);
            renderMaskCanvas();
        });
    });

    $('maskShowTiles').addEventListener('change', renderMaskCanvas);
    $('maskShowMaskOverlay').addEventListener('change', renderMaskCanvas);

    $('maskResetBtn').addEventListener('click', () => {
        state.maskState = defaultMaskState();
        setMaskUI();
        renderMaskCanvas();
    });

    $('maskApplyBtn').addEventListener('click', () => {
        if (!state.maskSourceImg) return;
        const a = state.assets[state.currentAssetIdx];
        const masked = applyMasks(state.maskSourceImg, state.maskState);
        a.maskedCanvasDataURL = masked.toDataURL('image/png');
        a.maskParams = JSON.parse(JSON.stringify(state.maskState));
        $('maskApplyBtn').textContent = '✅ Validé !';
        setTimeout(() => $('maskApplyBtn').textContent = '✅ Valider masques', 1500);
    });

    $('maskNextBtn').addEventListener('click', () => {
        if (state.currentAssetIdx < state.assets.length - 1) {
            selectAsset(state.currentAssetIdx + 1);
        }
    });
}