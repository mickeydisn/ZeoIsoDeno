// ════════════════════════════════════════════════════════
//  MASK MODULE — Étape 4 : Masques
//  Isometric V-mask clipping per cell.
//  Validating bakes mask output into asset.mask.canvas
// ════════════════════════════════════════════════════════
import { state } from '../state.js';
import { SP_W, SP_H, TILE_W, TILE_H, TILE_PAD_C } from '../constants.js';
import { selectAsset, getAsset } from '../app.js';
import { bakeMask } from '../pipeline/pipelineRenderer.js';

const $ = id => document.getElementById(id);

export function renderMaskCanvas() {
    const a = getAsset();
    const input = a ? (a.compose.canvas || a.rows.canvas || a.fix.canvas) : null;
    if (!input) {
        $('maskCanvas').style.display = 'none';
        $('maskEmpty').style.display = 'flex';
        return;
    }
    $('maskEmpty').style.display = 'none';
    $('maskCanvas').style.display = 'block';

    const canvas = $('maskCanvas'), ctx = canvas.getContext('2d');
    canvas.width = input.width; canvas.height = input.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, input.width, input.height);
    ctx.drawImage(input, 0, 0);

    const nC = Math.round(input.width / SP_W), nR = Math.round(input.height / SP_H);
    for (let r = 0; r < nR; r++) {
        for (let c = 0; c < nC; c++) {
            const dx = c * SP_W, dy = r * SP_H;
            if ($('maskShowTiles').checked) {
                const cx = dx + SP_W/2, by = dy + SP_H - TILE_PAD_C;
                ctx.fillStyle = 'rgba(102,126,234,.12)';
                ctx.strokeStyle = 'rgba(102,126,234,.5)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(cx, by - TILE_H); ctx.lineTo(cx + TILE_W/2, by - TILE_H/2); ctx.lineTo(cx, by); ctx.lineTo(cx - TILE_W/2, by - TILE_H/2); ctx.closePath();
                ctx.fill(); ctx.stroke();
            }
            if (!$('maskShowMaskOverlay').checked) continue;
            const cols = { bottom:'rgba(245,87,108,.35)', top:'rgba(255,200,0,.35)', left:'rgba(0,220,100,.35)', right:'rgba(102,126,234,.35)' };
            ['bottom','top','left','right'].forEach(type => {
                if (!state.maskState[type] || !state.maskState[type].on) return;
                const ox = state.maskState[type].x, oy = state.maskState[type].y;
                ctx.save();
                ctx.translate(dx, dy);
                buildPath(ctx, type, ox, oy);
                ctx.fillStyle = cols[type];
                ctx.fillRect(0, 0, SP_W, SP_H);
                ctx.globalCompositeOperation = 'destination-out';
                buildPath(ctx, type, ox, oy);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            });
        }
    }
    updatePreview();
}

function buildPath(ctx, type, ox, oy) {
    const cx = SP_W/2 + ox, tipB = SP_H - TILE_PAD_C + oy, tipT = tipB - TILE_H;
    const tipL = cx - TILE_W/2, tipR = cx + TILE_W/2;
    ctx.beginPath();
    if (type === 'bottom') { ctx.moveTo(0,0); ctx.lineTo(SP_W,0); ctx.lineTo(SP_W,tipB-TILE_H/2); ctx.lineTo(tipR,tipB-TILE_H/2); ctx.lineTo(cx,tipB); ctx.lineTo(tipL,tipB-TILE_H/2); ctx.lineTo(0,tipB-TILE_H/2); ctx.closePath(); }
    else if (type === 'top') { ctx.moveTo(0,SP_H); ctx.lineTo(SP_W,SP_H); ctx.lineTo(SP_W,tipT+TILE_H/2); ctx.lineTo(tipR,tipT+TILE_H/2); ctx.lineTo(cx,tipT); ctx.lineTo(tipL,tipT+TILE_H/2); ctx.lineTo(0,tipT+TILE_H/2); ctx.closePath(); }
    else if (type === 'left') ctx.rect(tipL, 0, SP_W - tipL, SP_H);
    else if (type === 'right') ctx.rect(0, 0, tipR, SP_H);
}

function updatePreview() {
    const strip = $('maskPreviewStrip');
    strip.innerHTML = '';
    const a = getAsset();
    const input = a ? (a.compose.canvas || a.rows.canvas || a.fix.canvas) : null;
    if (!input) return;
    const masked = bakeMask(input, state.maskState);
    if (!masked) return;
    const nC = Math.round(masked.width / SP_W), nR = Math.round(masked.height / SP_H);
    for (let r = 0; r < nR; r++) {
        for (let c = 0; c < nC; c++) {
            const pc = document.createElement('canvas');
            pc.width = SP_W; pc.height = SP_H;
            pc.getContext('2d').drawImage(masked, c*SP_W, r*SP_H, SP_W, SP_H, 0, 0, SP_W, SP_H);
            const cell = document.createElement('div');
            cell.className = 'mask-preview-cell';
            cell.appendChild(pc);
            strip.appendChild(cell);
        }
    }
}

function syncSlider(rangeId, numId, sk, axis) {
    const cb = e => { const v = parseInt(e.target.value)||0; state.maskState[sk][axis]=v; $(rangeId).value=v; $(numId).value=v; renderMaskCanvas(); };
    $(rangeId).addEventListener('input', cb); $(numId).addEventListener('input', cb);
}

export function setMaskUI() {
    ['bottom','top','left','right'].forEach(id => {
        const cap = id[0].toUpperCase() + id.slice(1);
        $('mask'+cap+'On').checked = state.maskState[id].on;
        $('maskCard'+cap).classList.toggle('active-mask', state.maskState[id].on);
        $('mask'+cap+'X').value = $('mask'+cap+'XN').value = state.maskState[id].x;
        $('mask'+cap+'Y').value = $('mask'+cap+'YN').value = state.maskState[id].y;
    });
}

export function refreshMaskPanel() {
    const a = getAsset();
    if (!a || !a.fix.canvas) {
        $('maskCanvas').style.display = 'none';
        $('maskEmpty').style.display = 'flex';
        $('maskApplyBtn').disabled = true;
        return;
    }
    $('maskEmpty').style.display = 'none';
    $('maskCanvas').style.display = 'block';
    $('maskApplyBtn').disabled = false;
    if (a.mask.params) { state.maskState = JSON.parse(JSON.stringify(a.mask.params)); setMaskUI(); }
    renderMaskCanvas();
}

export function validateMask() {
    const a = getAsset();
    if (!a) return;
    a.mask.params = JSON.parse(JSON.stringify(state.maskState));
    const input = a.compose.canvas || a.rows.canvas || a.fix.canvas;
    a.mask.canvas = bakeMask(input, state.maskState);
    a.mask.validated = true;
}

export function bindMaskEvents() {
    syncSlider('maskBottomX','maskBottomXN','bottom','x');
    syncSlider('maskBottomY','maskBottomYN','bottom','y');
    syncSlider('maskTopX','maskTopXN','top','x');
    syncSlider('maskTopY','maskTopYN','top','y');
    syncSlider('maskLeftX','maskLeftXN','left','x');
    syncSlider('maskLeftY','maskLeftYN','left','y');
    syncSlider('maskRightX','maskRightXN','right','x');
    syncSlider('maskRightY','maskRightYN','right','y');
    ['bottom','top','left','right'].forEach(id => {
        $('mask'+(id[0].toUpperCase()+id.slice(1))+'On').addEventListener('change', e => {
            state.maskState[id].on = e.target.checked;
            $('maskCard'+(id[0].toUpperCase()+id.slice(1))).classList.toggle('active-mask', e.target.checked);
            renderMaskCanvas();
        });
    });
    $('maskShowTiles').addEventListener('change', renderMaskCanvas);
    $('maskShowMaskOverlay').addEventListener('change', renderMaskCanvas);
    $('maskResetBtn').addEventListener('click', () => { state.maskState = { bottom:{on:false,x:0,y:0}, top:{on:false,x:0,y:0}, left:{on:false,x:0,y:0}, right:{on:false,x:0,y:0} }; setMaskUI(); renderMaskCanvas(); });
    $('maskApplyBtn').addEventListener('click', () => { validateMask(); $('maskApplyBtn').textContent='✅ Validé !'; setTimeout(()=>$('maskApplyBtn').textContent='✅ Valider masques',1500); });
    $('maskNextBtn').addEventListener('click', () => { if (state.currentAssetIdx < state.assets.length-1) selectAsset(state.currentAssetIdx+1); });
}