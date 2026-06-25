// ════════════════════════════════════════════════════════
//  ISOMETRIC TILE DRAWING
// ════════════════════════════════════════════════════════
import { TILE_W, TILE_H, TILE_PAD_F, TILE_PAD_C, SP_W, SP_H } from '../constants.js';

/**
 * Draw an isometric tile outline (fix panel style — bottom pad TILE_PAD_F).
 */
export function drawIsoTileF(tc, x, y, w, h) {
    const cx = x + w / 2, by = y + h - TILE_PAD_F;
    tc.fillStyle = 'rgba(100,200,255,.22)';
    tc.strokeStyle = 'rgba(100,200,255,.7)';
    tc.lineWidth = 2;
    tc.beginPath();
    tc.moveTo(cx, by - TILE_H);
    tc.lineTo(cx + TILE_W / 2, by - TILE_H / 2);
    tc.lineTo(cx, by);
    tc.lineTo(cx - TILE_W / 2, by - TILE_H / 2);
    tc.closePath();
    tc.fill();
    tc.stroke();
}

/**
 * Draw an isometric tile outline (composer panel style — bottom pad TILE_PAD_C).
 */
export function drawIsoTileC(tc, x, y) {
    const cx = x + SP_W / 2 - 2, by = y + SP_H - TILE_PAD_C;
    tc.fillStyle = 'rgba(102,126,234,.16)';
    tc.strokeStyle = 'rgba(102,126,234,.5)';
    tc.lineWidth = 2;
    tc.beginPath();
    tc.moveTo(cx, by - TILE_H);
    tc.lineTo(cx + TILE_W / 2, by - TILE_H / 2);
    tc.lineTo(cx, by);
    tc.lineTo(cx - TILE_W / 2, by - TILE_H / 2);
    tc.closePath();
    tc.fill();
    tc.stroke();
}