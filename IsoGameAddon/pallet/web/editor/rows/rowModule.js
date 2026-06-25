// ════════════════════════════════════════════════════════
//  ROW MODULE — Étape 3 : Gestion des lignes
//  Drag & drop reorder, delete, scale/offset per row
// ════════════════════════════════════════════════════════
import { state, defaultRowState } from '../state.js';
import { SP_W, SP_H, TILE_W, TILE_H, TILE_PAD_C } from '../constants.js';
import { applyHSCB } from '../utils/hscb.js';
import { selectAsset } from '../app.js';
import { render } from '../compose/composeModule.js';

const $ = id => document.getElementById(id);

// ════════════════════════════════════════════════════════
//  BUILD row state from workspace
// ════════════════════════════════════════════════════════
export function syncRowsFromWorkspace() {
    const nR = state.compRows;
    while (state.rows.length < nR) state.rows.push(defaultRowState());
    while (state.rows.length > nR) state.rows.pop();
    if (state.selectedRowIdx >= state.rows.length) state.selectedRowIdx = -1;
}

export function applyRowToWorkspaceSingle(rowIdx) {
    const r = state.rows[rowIdx];
    if (!r) return;
    state.workspace.filter(sp => sp.row === rowIdx).forEach(sp => {
        sp.scale = r.scale;
        sp.offsetX = r.offsetX;
        sp.offsetY = r.offsetY;
        sp.hue = r.hue;
        sp.sat = r.sat;
        sp.con = r.con;
        sp.bri = r.bri;
        // Reset per-cell transforms that are now row-controlled
        sp.flipH = false;
        sp.mirrorSide = 0;
    });
}

// ════════════════════════════════════════════════════════
//  RENDER row canvas — preview with scale/offset applied
// ════════════════════════════════════════════════════════
export function renderRowPanel() {
    const rowCanvas = $('rowCanvas');
    const rowCtx = rowCanvas.getContext('2d');
    if (!state.workspace.length) {
        rowCanvas.style.display = 'none';
        $('rowEmpty').style.display = 'flex';
        return;
    }
    $('rowEmpty').style.display = 'none';
    rowCanvas.style.display = 'block';

    const nC = state.compCols;
    const nR = state.compRows;
    const cellW = Math.min(SP_W, 96);
    const cellH = Math.round(cellW * SP_H / SP_W);
    const padX = 6, padY = 4;
    const labelW = 60;
    const totalW = labelW + nC * (cellW + padX) + 20;
    const totalH = nR * (cellH + padY + 12) + 20;

    rowCanvas.width = totalW;
    rowCanvas.height = totalH;
    rowCtx.clearRect(0, 0, totalW, totalH);
    rowCtx.fillStyle = '#111';
    rowCtx.fillRect(0, 0, totalW, totalH);

    for (let r = 0; r < nR; r++) {
        const rowState = state.rows[r] || defaultRowState();
        const y0 = 10 + r * (cellH + padY + 12);
        const isSelected = r === state.selectedRowIdx;

        // Highlight selected row
        if (isSelected) {
            rowCtx.fillStyle = 'rgba(102,126,234,.18)';
            rowCtx.fillRect(0, y0 - 4, totalW, cellH + padY + 12);
        }

        // Drag handle + row label
        rowCtx.fillStyle = isSelected ? '#667eea' : '#8890a8';
        rowCtx.font = 'bold 11px sans-serif';
        rowCtx.textAlign = 'center';
        rowCtx.fillText('⡇≡ R' + (r+1) + ' ⡇', labelW / 2, y0 + cellH / 2 + 4);

        // Row separator
        rowCtx.strokeStyle = 'rgba(255,255,255,.06)';
        rowCtx.lineWidth = 1;
        rowCtx.beginPath();
        rowCtx.moveTo(0, y0 + cellH + padY + 6);
        rowCtx.lineTo(totalW, y0 + cellH + padY + 6);
        rowCtx.stroke();

        // Draw each cell in the row WITH row transforms applied
        for (let c = 0; c < nC; c++) {
            const sp = state.workspace.find(s => s.row === r && s.col === c);
            const x0 = labelW + 10 + c * (cellW + padX);

            // Cell background
            rowCtx.fillStyle = '#1a1a2e';
            rowCtx.fillRect(x0, y0, cellW, cellH);
            rowCtx.strokeStyle = 'rgba(255,255,255,.08)';
            rowCtx.lineWidth = 1;
            rowCtx.strokeRect(x0, y0, cellW, cellH);

            if (sp && sp.imgData) {
                // Render at full SP_W×SP_H resolution using the compose algorithm,
                // then downscale to cell size for the preview
                const full = document.createElement('canvas');
                full.width = SP_W; full.height = SP_H;
                const fc = full.getContext('2d');
                fc.imageSmoothingEnabled = false;

                // Compose-style rendering with row transforms
                fc.save();
                fc.translate(SP_W / 2 + (rowState.offsetX || 0), SP_H / 2 + (rowState.offsetY || 0));
                fc.scale(rowState.scale, rowState.scale);
                fc.drawImage(sp.imgData, -SP_W / 2, -SP_H / 2, SP_W, SP_H);
                fc.restore();

                // Row HSCB at full resolution
                applyHSCB(full, rowState.hue || 0, rowState.sat || 0, rowState.con || 0, rowState.bri || 0);

                // Downscale to cell size (same approach as compose)
                rowCtx.imageSmoothingEnabled = false;
                rowCtx.drawImage(full, x0, y0, cellW, cellH);

                // Apply per-cell transforms (flipH, mirrorSide, per-cell offset/scale/HSCB)
                // These are NOT handled at row level - they're applied in compose step
            }

            // Tile overlay thin
            if ($('rowShowTiles').checked) {
                const cx2 = x0 + cellW / 2;
                const by2 = y0 + cellH - 2;
                const tw = cellW * TILE_W / SP_W;
                const th = cellH * TILE_H / SP_H;
                rowCtx.strokeStyle = 'rgba(102,126,234,.25)';
                rowCtx.lineWidth = 1;
                rowCtx.beginPath();
                rowCtx.moveTo(cx2, by2 - th);
                rowCtx.lineTo(cx2 + tw / 2, by2 - th / 2);
                rowCtx.lineTo(cx2, by2);
                rowCtx.lineTo(cx2 - tw / 2, by2 - th / 2);
                rowCtx.closePath();
                rowCtx.stroke();
            }
        }
    }
}

// ════════════════════════════════════════════════════════
//  DRAG & DROP for row reordering
// ════════════════════════════════════════════════════════
let _dragRowSrc = -1;
let _dragRowDst = -1;

function getRowFromY(y) {
    const nR = state.compRows;
    const cellH = Math.round(Math.min(SP_W, 96) * SP_H / SP_W);
    const padY = 4;
    for (let r = 0; r < nR; r++) {
        const y0 = 10 + r * (cellH + padY + 12);
        if (y >= y0 - 4 && y < y0 + cellH + padY + 8) return r;
    }
    return -1;
}

export function setupRowMouseEvents() {
    const rowCanvas = $('rowCanvas');

    rowCanvas.addEventListener('mousedown', e => {
        const rect = rowCanvas.getBoundingClientRect();
        const y = (e.clientY - rect.top) * (rowCanvas.height / rect.height);
        const r = getRowFromY(y);
        if (r >= 0 && r < state.rows.length) {
            state.selectedRowIdx = r;
            updateRowUI(r);
            renderRowPanel();
            render();
        }
    });

    // Drag start on handle area (left 60px)
    rowCanvas.addEventListener('mousedown', e => {
        const rect = rowCanvas.getBoundingClientRect();
        const scaleY = rowCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * (rowCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * scaleY;
        if (x < 60) {
            const r = getRowFromY(y);
            if (r >= 0) {
                _dragRowSrc = r;
                _dragRowDst = -1;
                rowCanvas.style.cursor = 'grabbing';
            }
        }
    });

    rowCanvas.addEventListener('mousemove', e => {
        if (_dragRowSrc < 0) return;
        const rect = rowCanvas.getBoundingClientRect();
        const y = (e.clientY - rect.top) * (rowCanvas.height / rect.height);
        const r = getRowFromY(y);
        // Visual feedback: update cursor if over a row
        if (r >= 0 && r !== _dragRowSrc) {
            _dragRowDst = r;
        } else {
            _dragRowDst = -1;
        }
    });

    document.addEventListener('mouseup', () => {
        if (_dragRowSrc >= 0 && _dragRowDst >= 0 && _dragRowDst !== _dragRowSrc) {
            swapRows(_dragRowSrc, _dragRowDst);
        }
        _dragRowSrc = -1;
        _dragRowDst = -1;
        $('rowCanvas').style.cursor = 'default';
    });
}

function swapRows(a, b) {
    const tmp = state.rows[a];
    state.rows[a] = state.rows[b];
    state.rows[b] = tmp;

    state.workspace.forEach(sp => {
        if (sp.row === a) sp.row = b;
        else if (sp.row === b) sp.row = a;
    });

    state.selectedRowIdx = b;
    updateRowUI(b);
    renderRowPanel();
    render();
}

// ════════════════════════════════════════════════════════
//  DELETE ROW
// ════════════════════════════════════════════════════════
function deleteRow() {
    const idx = state.selectedRowIdx;
    if (idx < 0 || state.compRows <= 1) return;

    // Remove row from state
    state.rows.splice(idx, 1);
    state.compRows--;

    // Remove workspace items for this row, shift higher rows down
    state.workspace = state.workspace.filter(sp => sp.row !== idx);
    state.workspace.forEach(sp => {
        if (sp.row > idx) sp.row--;
    });

    state.selectedRowIdx = Math.min(idx, state.rows.length - 1);
    if (state.selectedRowIdx >= 0) updateRowUI(state.selectedRowIdx);
    else $('rowControls').style.display = 'none';

    renderRowPanel();
    render();
}

// ════════════════════════════════════════════════════════
//  ROW CONTROLS UI
// ════════════════════════════════════════════════════════
function updateRowUI(rowIdx) {
    const r = state.rows[rowIdx];
    if (!r) {
        $('rowControls').style.display = 'none';
        return;
    }
    $('rowControls').style.display = 'block';
    $('rowSelectedInfo').textContent = `Ligne ${rowIdx + 1}`;
    $('rowScaleSlider').value = $('rowScaleInput').value = r.scale;
    $('rowOffsetXSlider').value = $('rowOffsetXInput').value = r.offsetX;
    $('rowOffsetYSlider').value = $('rowOffsetYInput').value = r.offsetY;

    $('rowHue').value = $('rowHueN').value = r.hue;
    $('rowSat').value = $('rowSatN').value = r.sat;
    $('rowCon').value = $('rowConN').value = r.con;
    $('rowBri').value = $('rowBriN').value = r.bri;
    const active = r.hue !== 0 || r.sat !== 0 || r.con !== 0 || r.bri !== 0;
    $('rowHscbWrap').classList.toggle('hscb-active', active);
}

function applyAndRenderRow() {
    const idx = state.selectedRowIdx;
    if (idx < 0 || !state.rows[idx]) return;
    applyRowToWorkspaceSingle(idx);
    renderRowPanel();
    render();
}

// ════════════════════════════════════════════════════════
//  BAKE TRANSFORMS
// ════════════════════════════════════════════════════════
function bakeRowTransforms() {
    state.workspace.forEach(sp => {
        const r = state.rows[sp.row];
        if (!r || !sp.imgData) return;

        const out = document.createElement('canvas');
        out.width = SP_W; out.height = SP_H;
        const octx = out.getContext('2d');
        octx.imageSmoothingEnabled = false;

        octx.save();
        octx.translate(SP_W / 2 + (r.offsetX || 0), SP_H / 2 + (r.offsetY || 0));
        octx.scale(r.scale, r.scale);
        octx.drawImage(sp.imgData, -SP_W / 2, -SP_H / 2, SP_W, SP_H);
        octx.restore();
        applyHSCB(out, r.hue || 0, r.sat || 0, r.con || 0, r.bri || 0);

        sp.imgData = out;
        sp.imgDataURL = null;
        sp.scale = 1;
        sp.offsetX = 0; sp.offsetY = 0;
        sp.hue = 0; sp.sat = 0; sp.con = 0; sp.bri = 0;
    });

    for (let i = 0; i < state.rows.length; i++) {
        state.rows[i] = defaultRowState();
    }
    state.selectedRowIdx = -1;
    $('rowControls').style.display = 'none';
    renderRowPanel();
    render();
}

// ════════════════════════════════════════════════════════
//  BIND EVENTS
// ════════════════════════════════════════════════════════
export function bindRowEvents() {
    // Scale
    $('rowScaleSlider').addEventListener('input', () => {
        if (state.selectedRowIdx < 0) return;
        const v = parseFloat($('rowScaleSlider').value);
        state.rows[state.selectedRowIdx].scale = v;
        $('rowScaleInput').value = v;
        applyAndRenderRow();
    });
    $('rowScaleInput').addEventListener('input', () => {
        if (state.selectedRowIdx < 0) return;
        const v = parseFloat($('rowScaleInput').value);
        state.rows[state.selectedRowIdx].scale = v;
        $('rowScaleSlider').value = v;
        applyAndRenderRow();
    });

    // Offset X
    $('rowOffsetXSlider').addEventListener('input', () => {
        if (state.selectedRowIdx < 0) return;
        const v = parseInt($('rowOffsetXSlider').value);
        state.rows[state.selectedRowIdx].offsetX = v;
        $('rowOffsetXInput').value = v;
        applyAndRenderRow();
    });
    $('rowOffsetXInput').addEventListener('input', () => {
        if (state.selectedRowIdx < 0) return;
        const v = parseInt($('rowOffsetXInput').value);
        state.rows[state.selectedRowIdx].offsetX = v;
        $('rowOffsetXSlider').value = v;
        applyAndRenderRow();
    });

    // Offset Y
    $('rowOffsetYSlider').addEventListener('input', () => {
        if (state.selectedRowIdx < 0) return;
        const v = parseInt($('rowOffsetYSlider').value);
        state.rows[state.selectedRowIdx].offsetY = v;
        $('rowOffsetYInput').value = v;
        applyAndRenderRow();
    });
    $('rowOffsetYInput').addEventListener('input', () => {
        if (state.selectedRowIdx < 0) return;
        const v = parseInt($('rowOffsetYInput').value);
        state.rows[state.selectedRowIdx].offsetY = v;
        $('rowOffsetYSlider').value = v;
        applyAndRenderRow();
    });

    // HSCB
    [['rowHue', 'rowHueN', 'hue'], ['rowSat', 'rowSatN', 'sat'], ['rowCon', 'rowConN', 'con'], ['rowBri', 'rowBriN', 'bri']].forEach(([r, n, k]) => {
        const onChange = e => {
            if (state.selectedRowIdx < 0) return;
            const v = parseInt(e.target.value) || 0;
            state.rows[state.selectedRowIdx][k] = v;
            $(r).value = v;
            $(n).value = v;
            const active = state.rows[state.selectedRowIdx].hue !== 0 || state.rows[state.selectedRowIdx].sat !== 0 || state.rows[state.selectedRowIdx].con !== 0 || state.rows[state.selectedRowIdx].bri !== 0;
            $('rowHscbWrap').classList.toggle('hscb-active', active);
            applyAndRenderRow();
        };
        $(r).addEventListener('input', onChange);
        $(n).addEventListener('input', onChange);
    });

    $('rowHscbResetBtn').addEventListener('click', () => {
        if (state.selectedRowIdx < 0) return;
        const r = state.rows[state.selectedRowIdx];
        r.hue = 0; r.sat = 0; r.con = 0; r.bri = 0;
        updateRowUI(state.selectedRowIdx);
        applyAndRenderRow();
    });

    $('rowShowTiles').addEventListener('change', renderRowPanel);

    // Delete row
    $('rowDeleteBtn').addEventListener('click', deleteRow);

    // Bake
    $('rowApplyBtn').addEventListener('click', bakeRowTransforms);

    // Reset row
    $('rowResetBtn').addEventListener('click', () => {
        if (state.selectedRowIdx < 0) return;
        state.rows[state.selectedRowIdx] = defaultRowState();
        updateRowUI(state.selectedRowIdx);
        applyAndRenderRow();
    });

    // Next
    $('rowNextBtn').addEventListener('click', () => {
        if (state.currentAssetIdx < state.assets.length - 1) {
            selectAsset(state.currentAssetIdx + 1);
        }
    });
}