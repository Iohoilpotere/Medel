import { registry } from '../core/registry.js';
import { BaseElement } from './base-element.js';

export class ImageElement extends BaseElement{
  constructor(opts={}){
    super(opts);
    this.setProp('url', opts.url ?? 'https://cdn.britannica.com/79/191679-050-C7114D2B/Adult-capybara.jpg');
    this.setProp('alt', opts.alt ?? '');

    // Normalize legacy fit values
    let _fit = (opts.fit ?? 'resize');
    if(_fit === 'contain') _fit = 'scale-down';
    if(_fit === 'stretch') _fit = 'none';
    this.setProp('fit', _fit);

    // Initial crop region (percentages on natural image)
    if(opts.srcRect){
      this.setProp('srcRect', opts.srcRect);
    } else if(typeof this.getProp('srcRect')==='undefined'){
      this.setProp('srcRect', {x:0,y:0,w:100,h:100});
    }
  }
  attach(stage){
    super.attach(stage);
    this._onZoom = ()=>{ requestAnimationFrame(()=> this.updateDom()); };
    this.stage?.bus?.on('zoom-changed', this._onZoom);
  }
  detach(){
    try{ this.stage?.bus?.off?.('zoom-changed', this._onZoom); }catch(e){}
    super.detach();
  }


  updateDom(){
    super.updateDom();
    // Ensure any temporary cropping classes are cleared
    try{ this.dom?.classList?.remove('cropping-locked','cropping-hide-current'); }catch(e){}
    if(!this.content) return;
    this.content.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'img-viewport';

    const img = document.createElement('img');
    img.className = 'img';
    img.src = this.getProp('url') || '';
    img.alt = this.getProp('alt') || '';

    wrap.appendChild(img);
    this.content.appendChild(wrap);

    if (img.complete && img.naturalWidth){
      this._applyFit();
    } else {
      img.addEventListener('load', () => this._applyFit(), { once: true });
    }
    queueMicrotask(() => this._applyFit());
    this.applyFrameStyle();
  }

  setProp(key, val, {silent=false}={}){
    const out = super.setProp(key, val, {silent});
    if(key === 'url'){
      if(!silent) this.updateDom();
    } else if(key === 'fit' || key === 'srcRect'){
      if(this.dom && !(key==='srcRect' && (this._suppressLiveSrcRectApply || silent))){
        this._applyFit();
      }
    }
    return out;
  }

  _applyFit(){
    const wrap = this.dom?.querySelector('.img-viewport');
    const imgEl  = this.dom?.querySelector('img.img');
    if(!wrap || !imgEl) return;
    const vw = wrap.clientWidth || this.w;
    const vh = wrap.clientHeight || this.h;
    const nW = imgEl.naturalWidth  || 0;
    const nH = imgEl.naturalHeight || 0;
    if(!vw || !vh || !nW || !nH) return;

    let fit = (this.getProp('fit') || 'resize').toLowerCase(); if(fit==='scale-down' || fit==='none') fit='resize';
    const r = this.getProp('srcRect') || {x:0,y:0,w:100,h:100};
    const cw = Math.max(1, nW * (r.w/100));
    const ch = Math.max(1, nH * (r.h/100));

    let outW, outH, left, top;
    if(fit === 'fill'){
      // Non-uniform: la porzione croppata riempie il viewport
      const sx = vw / cw;
      const sy = vh / ch;
      outW = nW * sx; outH = nH * sy;
      left = - (r.x/100) * outW;
      top  = - (r.y/100) * outH;
    } else {
      // Uniforme: cover / resize
      let s;
      if(fit === 'cover'){
        s = Math.max(vw / cw, vh / ch);
      } else { // 'resize' (fit inside, keep aspect, up or down)
        s = Math.min(vw / cw, vh / ch);
      }
      outW = nW * s; outH = nH * s;
      const outCW = outW * (r.w/100);
      const outCH = outH * (r.h/100);
      left = (vw - outCW)/2 - (r.x/100) * outW;
      top  = (vh - outCH)/2 - (r.y/100) * outH;
    }

    // For non-fill, ensure nothing outside il crop è visibile (resize/cover)
    let clip;
    if(fit==='fill'){
      clip = 'none';
    } else {
      // percentage-based inset so it scales perfectly with zoom
      const lPct = Math.max(0, Math.min(100, r.x));
      const tPct = Math.max(0, Math.min(100, r.y));
      const rPct = Math.max(0, Math.min(100, 100 - (r.x + r.w)));
      const bPct = Math.max(0, Math.min(100, 100 - (r.y + r.h)));
      clip = `inset(${tPct}% ${rPct}% ${bPct}% ${lPct}%)`;
    }

    Object.assign(imgEl.style, {
      position:'absolute',
      width: Math.round(outW)+'px',
      height: Math.round(outH)+'px',
      left: Math.round(left)+'px',
      top: Math.round(top)+'px',
      maxWidth:'none',
      maxHeight:'none',
      clipPath: clip
    });
  }

  applyFrameStyle(){
    const shOn = !!(this.getProp('imgShadow')||false);
    const shCol = this.getProp('imgShadowColor')||'rgba(0,0,0,0.5)';
    const shDx = Number(this.getProp('imgShadowDx')||0);
    const shDy = Number(this.getProp('imgShadowDy')||0);
    const shBlur = Number(this.getProp('imgShadowBlur')||6);
    const img = this.content.querySelector('img');
    if(!img) return;
    const bw = Number(this.getProp('borderWidth')||0);
    const bcol = this.getProp('borderColor') || 'rgba(255,255,255,0.6)';
    const bstyle = this.getProp('borderStyle') || 'solid';
    img.style.border = bw>0 ? `${bw}px ${bstyle} ${bcol}` : 'none';
    // Outline following alpha: simulate with drop-shadows
    const sw = Number(this.getProp('strokeWidth')||0);
    const scol = this.getProp('strokeColor') || 'rgba(0,0,0,0.8)';
    const sstyle = this.getProp('strokeStyle') || 'line';
    if(sw>0){
      // base outline using multiple drop-shadows to get thicker line
      const parts=[]; const rays=24; const R=sw; for(let k=0;k<rays;k++){ const a=2*Math.PI*k/rays; const x=Math.round(Math.cos(a)*R); const y=Math.round(Math.sin(a)*R); parts.push(`${x}px ${y}px 0 ${scol}`);}
      let filter = `drop-shadow(${parts.join(') drop-shadow(')})`;
      if(shOn){ filter += ` drop-shadow(${shDx}px ${shDy}px ${shBlur}px ${shCol})`; }
      img.style.filter = filter;
    }else{
      img.style.filter = shOn ? `drop-shadow(${shDx}px ${shDy}px ${shBlur}px ${shCol})` : '';
    }
  }
}

ImageElement.type = 'image';
registry.registerElement(ImageElement.type, ImageElement)
