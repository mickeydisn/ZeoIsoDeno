// ════════════════════════════════════════════════════════
//  CANVAS UTILITIES
// ════════════════════════════════════════════════════════
import { SP_W, SP_H, FINAL_W, FINAL_H } from '../constants.js';

export function cloneCanvas(src) {
    if (!src) return null;
    const c=document.createElement('canvas');
    c.width=src.width; c.height=src.height;
    c.getContext('2d').drawImage(src,0,0);
    return c;
}

export function extractCell(img, row, col, nC, nR) {
    const cw=Math.round(img.width/nC), ch=Math.round(img.height/nR);
    const c2=document.createElement('canvas');
    c2.width=SP_W; c2.height=SP_H;
    const cx=c2.getContext('2d');
    cx.imageSmoothingEnabled=false;
    cx.drawImage(img, col*cw, row*ch, cw, ch, 0, 0, SP_W, SP_H);
    return c2;
}

export function getBgColor(img) {
    const t=document.createElement('canvas');
    t.width=img.width; t.height=img.height;
    t.getContext('2d').drawImage(img,0,0);
    const d=t.getContext('2d').getImageData(0,0,1,1).data;
    return {r:d[0],g:d[1],b:d[2]};
}

export function applyRemoveBg(canvas, bg, erosion) {
    const w=canvas.width, h=canvas.height, tc=canvas.getContext('2d');
    const id=tc.getImageData(0,0,w,h); const D=id.data; const tol=40;
    for (let i=0;i<D.length;i+=4) {
        D[i+3] = (Math.abs(D[i]-bg.r)+Math.abs(D[i+1]-bg.g)+Math.abs(D[i+2]-bg.b))<tol?0:255;
    }
    if (erosion>0) {
        const orig=new Uint8ClampedArray(D), na=new Uint8Array(w*h);
        for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
            if (orig[(y*w+x)*4+3]===0){na[y*w+x]=0;continue;}
            let near=false;
            outer: for (let dy=-erosion;dy<=erosion;dy++) for (let dx=-erosion;dx<=erosion;dx++){
                const cy=y+dy,cx2=x+dx;
                if (cy>=0&&cy<h&&cx2>=0&&cx2<w&&orig[(cy*w+cx2)*4+3]===0&&Math.sqrt(dx*dx+dy*dy)<=erosion){near=true;break outer;}
            }
            na[y*w+x]=near?0:255;
        }
        for (let i=0;i<D.length;i+=4) D[i+3]=na[i/4];
    }
    tc.putImageData(id,0,0);
}

/**
 * Get the scaled image (fix step) with scale, offset, removeBg, and HSCB applied.
 */
export function getScaledImage(fixImage, getFixParamsFn, fixHscb, applyHSCB) {
    if (!fixImage) return null;
    const p = getFixParamsFn();
    const tmp = document.createElement('canvas');
    tmp.width = fixImage.width*p.scale;
    tmp.height = fixImage.height*p.scale;
    const tc = tmp.getContext('2d');
    tc.imageSmoothingEnabled = false;
    tc.drawImage(fixImage, 0, 0, tmp.width, tmp.height);
    if (p.removeBg) applyRemoveBg(tmp, getBgColor(fixImage), p.erosion);
    applyHSCB(tmp, fixHscb.hue, fixHscb.sat, fixHscb.con, fixHscb.bri);
    return tmp;
}