// ════════════════════════════════════════════════════════
//  HSCB — Hue, Saturation, Contrast, Brightness
// ════════════════════════════════════════════════════════

/**
 * Apply HSCB adjustment to a canvas in-place.
 * hue: -180..180 degrees
 * sat: -100..100
 * con: -100..100
 * bri: -100..100
 */
export function applyHSCB(canvas, hue, sat, con, bri) {
    if (hue===0 && sat===0 && con===0 && bri===0) return;
    const tc=canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
    const id=tc.getImageData(0,0,w,h); const D=id.data;
    const hRad=hue*(Math.PI/180);
    const satF=1+sat/100;
    const conF=con===0?1:(con>0?(1+con/100*3):(1+con/100));
    const briF=bri/100;

    for (let i=0;i<D.length;i+=4) {
        if (D[i+3]===0) continue; // skip transparent
        let r=D[i]/255, g=D[i+1]/255, b=D[i+2]/255;

        // ── Brightness ──
        r = Math.min(1, Math.max(0, r+briF));
        g = Math.min(1, Math.max(0, g+briF));
        b = Math.min(1, Math.max(0, b+briF));

        // ── Contrast (around 0.5) ──
        r = Math.min(1, Math.max(0, (r-0.5)*conF+0.5));
        g = Math.min(1, Math.max(0, (g-0.5)*conF+0.5));
        b = Math.min(1, Math.max(0, (b-0.5)*conF+0.5));

        // ── RGB→HSL ──
        const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
        let hl=0, sl=0, ll=(mx+mn)/2;
        if (d>0) {
            sl=ll>0.5?d/(2-mx-mn):d/(mx+mn);
            if (mx===r) hl=((g-b)/d+(g<b?6:0))/6;
            else if (mx===g) hl=((b-r)/d+2)/6;
            else hl=((r-g)/d+4)/6;
        }

        // ── Hue shift ──
        hl=(hl+(hue/360)+2)%1;

        // ── Saturation ──
        sl=Math.min(1,Math.max(0,sl*satF));

        // ── HSL→RGB ──
        let nr,ng,nb;
        if (sl===0) { nr=ng=nb=ll; }
        else {
            const q=ll<0.5?ll*(1+sl):ll+sl-ll*sl;
            const p=2*ll-q;
            const hue2rgb=(p,q,t)=>{ if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
            nr=hue2rgb(p,q,hl+1/3); ng=hue2rgb(p,q,hl); nb=hue2rgb(p,q,hl-1/3);
        }
        D[i]=Math.round(nr*255); D[i+1]=Math.round(ng*255); D[i+2]=Math.round(nb*255);
    }
    tc.putImageData(id,0,0);
}