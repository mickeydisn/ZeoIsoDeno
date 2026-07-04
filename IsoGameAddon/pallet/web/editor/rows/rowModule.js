// ════════════════════════════════════════════════════════
//  ROW MODULE — Étape 2 : Lignes
//  Per-row scale/offset/HSCB transforms.
//  Validating bakes row output into asset.rows.canvas.
// ════════════════════════════════════════════════════════
import { state, defaultRowState } from '../state.js';
import { FINAL_W, FINAL_H, SP_W, SP_H, TILE_W, TILE_H } from '../constants.js';
import { applyHSCB } from '../utils/hscb.js';
import { selectAsset, getAsset } from '../app.js';
import { bakeRows } from '../pipeline/pipelineRenderer.js';

const $ = id => document.getElementById(id);

export function syncRowsFromWorkspace() {
    const a = getAsset();
    if (!a || !a.fix.params) return;
    const nR = a.fix.params.rowPositions.length - 1;
    while (state.rows.length < nR) state.rows.push(defaultRowState());
    while (state.rows.length > nR) state.rows.pop();
    if (state.selectedRowIdx >= state.rows.length) state.selectedRowIdx = -1;
}

export function renderRowPanel() {
    const canvas = $('rowCanvas'), ctx = canvas.getContext('2d');
    const a = getAsset();
    if (!a || !a.fix.canvas) {
        canvas.style.display = 'none';
        $('rowEmpty').style.display = 'flex';
        return;
    }
    $('rowEmpty').style.display = 'none';
    canvas.style.display = 'block';

    const nR = a.fix.params.rowPositions.length - 1;
    const nC = a.fix.params.colPositions.length - 1;
    if (nR < 1 || nC < 1) return;

    const cw = Math.min(SP_W, 96), ch = Math.round(cw * SP_H / SP_W);
    const px = 6, py = 4, lw = 60;
    const tw = lw + nC * (cw + px) + 20, th = nR * (ch + py + 12) + 20;
    canvas.width = tw; canvas.height = th;
    ctx.clearRect(0, 0, tw, th);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, tw, th);

    // Use fix canvas for base, render row transforms on each cell
    const fixCanvas = a.fix.canvas;

    for (let r = 0; r < nR; r++) {
        const rs = state.rows[r] || defaultRowState();
        const y0 = 10 + r * (ch + py + 12);
        const sel = r === state.selectedRowIdx;

        if (sel) { ctx.fillStyle = 'rgba(102,126,234,.18)'; ctx.fillRect(0, y0 - 4, tw, ch + py + 12); }

        ctx.fillStyle = sel ? '#667eea' : '#8890a8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⡇≡ R' + (r+1) + ' ⡇', lw / 2, y0 + ch / 2 + 4);

        ctx.strokeStyle = 'rgba(255,255,255,.06)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y0 + ch + py + 6); ctx.lineTo(tw, y0 + ch + py + 6); ctx.stroke();

        for (let c = 0; c < nC; c++) {
            const x0 = lw + 10 + c * (cw + px);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(x0, y0, cw, ch);
            ctx.strokeStyle = 'rgba(255,255,255,.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x0, y0, cw, ch);

            // Render cell: extract from fix canvas, apply row transforms
            const cell = document.createElement('canvas');
            cell.width = FINAL_W; cell.height = FINAL_H;
            const cc = cell.getContext('2d');
            cc.imageSmoothingEnabled = false;
            cc.drawImage(fixCanvas, c * FINAL_W, r * FINAL_H, FINAL_W, FINAL_H, 0, 0, FINAL_W, FINAL_H);

            const full = document.createElement('canvas');
            full.width = FINAL_W; full.height = FINAL_H;
            const fc = full.getContext('2d');
            fc.imageSmoothingEnabled = false;
            fc.translate(FINAL_W / 2 + (rs.offsetX || 0), FINAL_H / 2 + (rs.offsetY || 0));
            fc.scale(rs.scale, rs.scale);
            fc.drawImage(cell, -FINAL_W / 2, -FINAL_H / 2, FINAL_W, FINAL_H);
            applyHSCB(full, rs.hue || 0, rs.sat || 0, rs.con || 0, rs.bri || 0);

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(full, x0, y0, cw, ch);

            // Tile overlay
            if ($('rowShowTiles').checked) {
                const cx2 = x0 + cw / 2, by2 = y0 + ch - 2;
                const tw2 = cw * TILE_W / SP_W, th2 = ch * TILE_H / SP_H;
                ctx.strokeStyle = 'rgba(102,126,234,.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx2, by2 - th2);
                ctx.lineTo(cx2 + tw2 / 2, by2 - th2 / 2);
                ctx.lineTo(cx2, by2);
                ctx.lineTo(cx2 - tw2 / 2, by2 - th2 / 2);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }
}

// Drag & drop
let _dragSrc = -1, _dragDst = -1;
function getRowY(y) {
    const nR = state.rows.length, ch = Math.round(Math.min(SP_W, 96) * SP_H / SP_W), py = 4;
    for (let r = 0; r < nR; r++) {
        const y0 = 10 + r * (ch + py + 12);
        if (y >= y0 - 4 && y < y0 + ch + py + 8) return r;
    }
    return -1;
}

export function setupRowMouseEvents() {
    const canvas = $('rowCanvas');
    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const r = getRowY(y);
        if (r >= 0 && r < state.rows.length) { state.selectedRowIdx = r; updateRowUI(r); renderRowPanel(); }
    });
    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        if (x < 60) { const r = getRowY(y); if (r >= 0) { _dragSrc = r; _dragDst = -1; canvas.style.cursor = 'grabbing'; } }
    });
    canvas.addEventListener('mousemove', e => {
        if (_dragSrc < 0) return;
        const rect = canvas.getBoundingClientRect();
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const r = getRowY(y);
        _dragDst = (r >= 0 && r !== _dragSrc) ? r : -1;
    });
    document.addEventListener('mouseup', () => {
        if (_dragSrc >= 0 && _dragDst >= 0 && _dragDst !== _dragSrc) swapRows(_dragSrc, _dragDst);
        _dragSrc = -1; _dragDst = -1;
        $('rowCanvas').style.cursor = 'default';
    });
}

function swapRows(a, b) {
    [state.rows[a], state.rows[b]] = [state.rows[b], state.rows[a]];
    state.workspace.forEach(sp => { if (sp.row === a) sp.row = b; else if (sp.row === b) sp.row = a; });
    state.selectedRowIdx = b;
    updateRowUI(b);
    renderRowPanel();
}

function deleteRow() {
    const idx = state.selectedRowIdx;
    if (idx < 0 || state.rows.length <= 1) return;
    state.rows.splice(idx, 1);
    state.workspace = state.workspace.filter(sp => sp.row !== idx);
    state.workspace.forEach(sp => { if (sp.row > idx) sp.row--; });
    state.selectedRowIdx = Math.min(idx, state.rows.length - 1);
    if (state.selectedRowIdx >= 0) updateRowUI(state.selectedRowIdx);
    else $('rowControls').style.display = 'none';
    renderRowPanel();
}

function updateRowUI(idx) {
    const r = state.rows[idx];
    if (!r) { $('rowControls').style.display = 'none'; return; }
    $('rowControls').style.display = 'block';
    $('rowSelectedInfo').textContent = `Ligne ${idx + 1}`;
    $('rowScaleSlider').value = $('rowScaleInput').value = r.scale;
    $('rowOffsetXSlider').value = $('rowOffsetXInput').value = r.offsetX;
    $('rowOffsetYSlider').value = $('rowOffsetYInput').value = r.offsetY;
    $('rowHue').value = $('rowHueN').value = r.hue;
    $('rowSat').value = $('rowSatN').value = r.sat;
    $('rowCon').value = $('rowConN').value = r.con;
    $('rowBri').value = $('rowBriN').value = r.bri;
    $('rowHscbWrap').classList.toggle('hscb-active', r.hue!==0||r.sat!==0||r.con!==0||r.bri!==0);
}

export function validateRows() {
    const a = getAsset();
    if (!a) return;
    a.rows.params = state.rows.map(r => ({ ...r }));
    a.rows.canvas = bakeRows(a.fix.canvas, a.rows.params, a.fix.params.rowPositions.length - 1, a.fix.params.colPositions.length - 1);
    a.rows.validated = true;
    a.compose.validated = false;
    a.mask.validated = false;
}

export function bindRowEvents() {
    const use = (sl, inp, k) => {
        sl.addEventListener('input', () => { if (state.selectedRowIdx<0) return; const v = parseFloat(sl.value); state.rows[state.selectedRowIdx][k]=v; inp.value=v; renderRowPanel(); });
        inp.addEventListener('input', () => { if (state.selectedRowIdx<0) return; const v = parseFloat(inp.value); state.rows[state.selectedRowIdx][k]=v; sl.value=v; renderRowPanel(); });
    };
    use($('rowScaleSlider'),$('rowScaleInput'),'scale');
    use($('rowOffsetXSlider'),$('rowOffsetXInput'),'offsetX');
    use($('rowOffsetYSlider'),$('rowOffsetYInput'),'offsetY');
    [['rowHue','rowHueN','hue'],['rowSat','rowSatN','sat'],['rowCon','rowConN','con'],['rowBri','rowBriN','bri']].forEach(([r,n,k]) => {
        const cb = e => {
            if (state.selectedRowIdx<0) return;
            const v = parseInt(e.target.value)||0;
            state.rows[state.selectedRowIdx][k]=v; $(r).value=v; $(n).value=v;
            $('rowHscbWrap').classList.toggle('hscb-active',state.rows[state.selectedRowIdx].hue!==0||state.rows[state.selectedRowIdx].sat!==0||state.rows[state.selectedRowIdx].con!==0||state.rows[state.selectedRowIdx].bri!==0);
            renderRowPanel();
        };
        $(r).addEventListener('input',cb); $(n).addEventListener('input',cb);
    });
    $('rowHscbResetBtn').addEventListener('click',()=>{if(state.selectedRowIdx<0) return; const r=state.rows[state.selectedRowIdx]; r.hue=0;r.sat=0;r.con=0;r.bri=0; updateRowUI(state.selectedRowIdx); renderRowPanel();});
    $('rowShowTiles').addEventListener('change', renderRowPanel);
    $('rowDeleteBtn').addEventListener('click', deleteRow);
    $('rowApplyBtn').addEventListener('click', validateRows);
    $('rowResetBtn').addEventListener('click',()=>{if(state.selectedRowIdx<0) return; state.rows[state.selectedRowIdx]=defaultRowState(); updateRowUI(state.selectedRowIdx); renderRowPanel();});
    $('rowNextBtn').addEventListener('click',()=>{if(state.currentAssetIdx<state.assets.length-1) selectAsset(state.currentAssetIdx+1);});
}