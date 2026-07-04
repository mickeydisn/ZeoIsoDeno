// ════════════════════════════════════════════════════════
//  PIPELINE — Stage rendering utilities
//  Each step applies its transforms to the previous
//  stage's canvas and produces a new canvas.
// ════════════════════════════════════════════════════════
import { FINAL_W, FINAL_H, SP_W, SP_H, TILE_W, TILE_H, TILE_PAD_C } from '../constants.js';
import { applyHSCB } from '../utils/hscb.js';
import { applyRemoveBg, getBgColor } from '../utils/canvas.js';

// ─── Stage 0: Fix embed (crop source image into grid cells) ───
export function bakeFix(sourceImage, params) {
    const nR = params.rowPositions.length - 1;
    const nC = params.colPositions.length - 1;
    if (nR < 1 || nC < 1) return null;

    // scaled version of source
    const scaled = document.createElement('canvas');
    scaled.width = sourceImage.width * params.scale;
    scaled.height = sourceImage.height * params.scale;
    const sctx = scaled.getContext('2d');
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(sourceImage, 0, 0, scaled.width, scaled.height);

    if (params.removeBg) applyRemoveBg(scaled, getBgColor(sourceImage), params.erosion);
    applyHSCB(scaled, params.hscb.hue, params.hscb.sat, params.hscb.con, params.hscb.bri);

    const out = document.createElement('canvas');
    out.width = FINAL_W * nC;
    out.height = FINAL_H * nR;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < nR; r++) {
        const sy0 = params.rowPositions[r] * params.scale;
        const sh = (params.rowPositions[r + 1] - params.rowPositions[r]) * params.scale;
        const va = FINAL_H - sh;
        for (let c = 0; c < nC; c++) {
            const sx0 = params.colPositions[c] * params.scale;
            const sw = (params.colPositions[c + 1] - params.colPositions[c]) * params.scale;
            const hc = (FINAL_W - sw) / 2;
            const dx = c * FINAL_W + hc + params.offsetX + (params.colOffsetX[c] || 0);
            const dy = r * FINAL_H + va + params.offsetY + (params.colOffsetY[c] || 0);
            ctx.drawImage(scaled, sx0, sy0, sw, sh, dx, dy, sw, sh);
        }
    }
    return out;
}

// ─── Stage 1: Apply row transforms ───
export function bakeRows(inputCanvas, rowsParams, nR, nC) {
    if (!inputCanvas) return null;
    const out = document.createElement('canvas');
    out.width = inputCanvas.width;
    out.height = inputCanvas.height;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < nR; r++) {
        const rs = rowsParams[r] || { scale:1, offsetX:0, offsetY:0, hue:0, sat:0, con:0, bri:0 };
        for (let c = 0; c < nC; c++) {
            const sx = c * FINAL_W, sy = r * FINAL_H;

            const cell = document.createElement('canvas');
            cell.width = FINAL_W; cell.height = FINAL_H;
            const cc = cell.getContext('2d');
            cc.imageSmoothingEnabled = false;
            cc.drawImage(inputCanvas, sx, sy, FINAL_W, FINAL_H, 0, 0, FINAL_W, FINAL_H);

            const tmp = document.createElement('canvas');
            tmp.width = FINAL_W; tmp.height = FINAL_H;
            const tc = tmp.getContext('2d');
            tc.imageSmoothingEnabled = false;
            tc.translate(FINAL_W / 2 + (rs.offsetX || 0), FINAL_H / 2 + (rs.offsetY || 0));
            tc.scale(rs.scale, rs.scale);
            tc.drawImage(cell, -FINAL_W / 2, -FINAL_H / 2, FINAL_W, FINAL_H);
            applyHSCB(tmp, rs.hue || 0, rs.sat || 0, rs.con || 0, rs.bri || 0);

            ctx.drawImage(tmp, sx, sy);
        }
    }
    return out;
}

// ─── Stage 2: Apply per-cell compose transforms ───
function renderCellWithTransforms(sp, baseCellCanvas) {
    const out = document.createElement('canvas');
    out.width = SP_W; out.height = SP_H;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Draw base cell
    ctx.drawImage(baseCellCanvas, 0, 0);

    if (!sp.hasContent) return out;

    // Extract what's currently in the cell (base from rows stage)
    const cell = document.createElement('canvas');
    cell.width = SP_W; cell.height = SP_H;
    const ci = cell.getContext('2d');
    ci.imageSmoothingEnabled = false;
    ci.drawImage(baseCellCanvas, 0, 0);

    // Apply per-cell transforms
    let transformed;
    if (sp.mirrorSide) {
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

        const fc = document.createElement('canvas');
        fc.width = SP_W; fc.height = SP_H;
        const fctx = fc.getContext('2d');
        fctx.imageSmoothingEnabled = false;
        if (sp.mirrorSide === 1) {
            fctx.drawImage(mc, 0, 0, SP_W / 2, SP_H, 0, 0, SP_W / 2, SP_H);
            fctx.save(); fctx.translate(SP_W, 0); fctx.scale(-1, 1);
            fctx.drawImage(mc, 0, 0, SP_W / 2, SP_H, 0, 0, SP_W / 2, SP_H);
            fctx.restore();
        } else {
            fctx.drawImage(mc, SP_W / 2, 0, SP_W / 2, SP_H, SP_W / 2, 0, SP_W / 2, SP_H);
            fctx.save(); fctx.translate(SP_W, 0); fctx.scale(-1, 1);
            fctx.drawImage(mc, SP_W / 2, 0, SP_W / 2, SP_H, SP_W / 2, 0, SP_W / 2, SP_H);
            fctx.restore();
        }
        transformed = fc;
    } else {
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
        transformed = mc;
    }

    ctx.clearRect(0, 0, SP_W, SP_H);
    ctx.drawImage(transformed, 0, 0);
    return out;
}

export function bakeCompose(inputCanvas, workspace, compRows, compCols) {
    if (!inputCanvas) return null;
    const out = document.createElement('canvas');
    out.width = SP_W * compCols;
    out.height = SP_H * compRows;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Extract cells from input and apply per-cell transforms
    for (let r = 0; r < compRows; r++) {
        for (let c = 0; c < compCols; c++) {
            const sp = workspace.find(s => s.row === r && s.col === c) || { hasContent: false, offsetX:0, offsetY:0, scale:1, flipH:false, mirrorSide:0, hue:0, sat:0, con:0, bri:0 };

            const cellCanvas = document.createElement('canvas');
            cellCanvas.width = SP_W; cellCanvas.height = SP_H;
            const ci = cellCanvas.getContext('2d');
            ci.imageSmoothingEnabled = false;
            ci.drawImage(inputCanvas, c * SP_W, r * SP_H, SP_W, SP_H, 0, 0, SP_W, SP_H);

            const result = renderCellWithTransforms(sp, cellCanvas);
            ctx.drawImage(result, c * SP_W, r * SP_H);
        }
    }
    return out;
}

// ─── Stage 3: Apply masks ───
function buildMaskPath(ctx, type, ox, oy) {
    const cx = SP_W / 2 + ox;
    const tipB = SP_H - TILE_PAD_C + oy;
    const tipT = tipB - TILE_H;
    const tipL = cx - TILE_W / 2;
    const tipR = cx + TILE_W / 2;
    ctx.beginPath();
    if (type === 'bottom') {
        ctx.moveTo(0, 0); ctx.lineTo(SP_W, 0); ctx.lineTo(SP_W, tipB - TILE_H / 2);
        ctx.lineTo(tipR, tipB - TILE_H / 2); ctx.lineTo(cx, tipB); ctx.lineTo(tipL, tipB - TILE_H / 2);
        ctx.lineTo(0, tipB - TILE_H / 2); ctx.lineTo(0, 0); ctx.closePath();
    } else if (type === 'top') {
        ctx.moveTo(0, SP_H); ctx.lineTo(SP_W, SP_H); ctx.lineTo(SP_W, tipT + TILE_H / 2);
        ctx.lineTo(tipR, tipT + TILE_H / 2); ctx.lineTo(cx, tipT); ctx.lineTo(tipL, tipT + TILE_H / 2);
        ctx.lineTo(0, tipT + TILE_H / 2); ctx.lineTo(0, SP_H); ctx.closePath();
    } else if (type === 'left') ctx.rect(tipL, 0, SP_W - tipL, SP_H);
    else if (type === 'right') ctx.rect(0, 0, tipR, SP_H);
}

export function bakeMask(inputCanvas, maskState) {
    if (!inputCanvas) return null;
    const w = inputCanvas.width, h = inputCanvas.height;
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
            cctx.drawImage(inputCanvas, dx, dy, SP_W, SP_H, 0, 0, SP_W, SP_H);

            ['bottom', 'top', 'left', 'right'].forEach(type => {
                if (!maskState[type] || !maskState[type].on) return;
                const ox = maskState[type].x || 0, oy = maskState[type].y || 0;
                const tmp = document.createElement('canvas');
                tmp.width = SP_W; tmp.height = SP_H;
                const tctx = tmp.getContext('2d');
                tctx.imageSmoothingEnabled = false;
                tctx.drawImage(cell, 0, 0);
                const mc = document.createElement('canvas');
                mc.width = SP_W; mc.height = SP_H;
                const mctx2 = mc.getContext('2d');
                mctx2.fillStyle = '#fff';
                buildMaskPath(mctx2, type, ox, oy);
                mctx2.fill();
                tctx.globalCompositeOperation = 'destination-in';
                tctx.drawImage(mc, 0, 0);
                tctx.globalCompositeOperation = 'source-over';
                cctx.clearRect(0, 0, SP_W, SP_H);
                cctx.drawImage(tmp, 0, 0);
            });
            octx.drawImage(cell, dx, dy);
        }
    }
    return out;
}