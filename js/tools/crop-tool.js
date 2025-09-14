import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

/**
 * CropTool — WYSIWYG crop overlay for ImageElement.
 * - Single target (current selection) of type ImageElement.
 * - Drag handles + move to adjust srcRect (percent-based).
 * - Enter = confirm (commit command); Esc = cancel.
 * - Reacts to zoom / geometry preview to keep overlay aligned.
 */
export class CropTool {
  constructor(app){
    this.app = app;
    this.active = false;
    this.target = null;      // ImageElement
    this._initial = null;    // initial srcRect
    this._overlay = null;
    this._backdrop = null;
    this._fore = null;
    this._box = null;
    this._mask = [];
    this._handles = {};
    this._drag = null;

    this._onZoom = this._onZoom.bind(this);
    this._onGeom = this._onGeom.bind(this);
    this._onSelChange = this._onSelChange.bind(this);
    this._keydown = this._keydown.bind(this);
  }

  _onZoom(){ if(this.active) this._layout(); }
  _onGeom(){ if(this.active) this._layout(); }
  _onSelChange(){
    if(!this.active) return;
    const sel = this.app.stage.selected[0];
    if(sel !== this.target){ this.deactivate(false); }
  }
  _keydown(e){
    if(!this.active) return;
    if(e.key === 'Enter'){ e.preventDefault(); this.confirm(); }
    if(e.key === 'Escape'){ e.preventDefault(); this.cancel(); }
  }

  isAvailable(){
    const sel = this.app.stage.selected;
    return sel.length===1 && typeof sel[0]?.getProp === 'function' && typeof sel[0].getProp('fit')!=='undefined';
  }

  toggle(){ if(this.active) this.deactivate(true); else this.activate(); }

  activate(){
    if(!this.isAvailable()) return;
    this.active = true;
    this.target = this.app.stage.selected[0];
    this._initial = { ...(this.target.getProp('srcRect') || {x:0,y:0,w:100,h:100}) };
    const r0=this._initial; const _isFull=(r0.x===0&&r0.y===0&&r0.w===100&&r0.h===100);
    if(!_isFull){ this.target.dom.classList.add('cropping-hide-current'); }
    const r=this._initial; const isFull=(r.x===0&&r.y===0&&r.w===100&&r.h===100);
    if(!isFull){ this.target.dom.classList.add('cropping-hide-current'); }

    this.target._suppressLiveSrcRectApply = true;
    // Lock element move/resize while cropping
    this._lockMouse = (e)=>{ if(this._overlay && this._overlay.contains(e.target)) return; e.preventDefault(); e.stopPropagation(); };
    this.target.dom.addEventListener('mousedown', this._lockMouse, true);
    this.target.dom.classList.add('cropping-locked');

    // overlay attached to the element
    const overlay = document.createElement('div');
    overlay.className = 'crop-overlay';
    this._overlay = overlay;
    this.target.dom.appendChild(overlay);

    // semi-transparent backdrop with the REAL image
    const realImg = this.target.dom.querySelector('img.img');
    const back = document.createElement('img');
    back.className = 'crop-backdrop';
    back.src = realImg?.src || '';
    back.draggable = false;
    back.style.opacity = '0.4';
    overlay.appendChild(back);
    this._backdrop = back;

    // Foreground image (only for re-crop) to show crop area opaque
    const fore = document.createElement('img');
    fore.className = 'crop-fore';
    fore.src = realImg?.src || '';
    fore.draggable = false;
    overlay.appendChild(fore);
    this._fore = fore;

    // masks (top, right, bottom, left)
    this._mask = [];
    for(let i=0;i<4;i++){
      const m = document.createElement('div');
      m.className = 'crop-mask';
      overlay.appendChild(m);
      this._mask.push(m);
    }

    // crop box
    const box = document.createElement('div');
    box.className = 'crop-box';
    overlay.appendChild(box);
    this._box = box;

    // handles
    const names = ['nw','n','ne','w','e','sw','s','se'];
    this._handles = {};
    for(const n of names){
      const h = document.createElement('div');
      h.className = 'crop-handle ' + n;
      box.appendChild(h);
      this._handles[n] = h;
      h.addEventListener('mousedown', (e)=> this._startDrag(e, n));
    }

    // move crop box
    box.addEventListener('mousedown', (e)=>{
      if(e.target.classList.contains('crop-handle')) return;
      this._startDrag(e, 'move');
    });

    // listeners
    this.app.stage.bus.on('zoom-changed', this._onZoom);
    this.app.stage.bus.on('geometry-preview', this._onGeom);
    this.app.stage.bus.on('elements-changed', this._onGeom);
    this.app.stage.bus.on('selection-changed', this._onSelChange);
    window.addEventListener('keydown', this._keydown, {capture:true});

    this._layout();
  }

  deactivate(commit){
    if(!this.active) return;
    if(this._overlay && this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay);
    this._overlay = null; this._backdrop = null;
    try{ this.target?.dom?.removeEventListener('mousedown', this._lockMouse, true); }catch(e){}

    this._fore = null; this._box = null; this._mask = []; this._handles = {}; this._drag = null;
    if(this.target?.dom) this.target.dom.classList.remove('cropping-hide-current');

    this.app.stage.bus.off?.('zoom-changed', this._onZoom);
    this.app.stage.bus.off?.('geometry-preview', this._onGeom);
    this.app.stage.bus.off?.('elements-changed', this._onGeom);
    this.app.stage.bus.off?.('selection-changed', this._onSelChange);
    window.removeEventListener('keydown', this._keydown, {capture:true});

    if(this.target){
      this.target._suppressLiveSrcRectApply = false;
      if(!commit){
        this.target.setProp('srcRect', this._initial, {silent:true});
        this.target.updateDom();
      }
      // notify stage that element visuals changed (refresh handles etc.)
      try{ this.app.stage.bus.emit('elements-changed', [this.target]); }catch(e){}
    }
    this.active = false;
    this.target = null;
  }

  confirm(){
    if(!this.active || !this.target) return;
    const current = {...(this.target.getProp('srcRect')||{x:0,y:0,w:100,h:100})};
    const prev = [this._initial];
    this.app.cmd.execute(new UpdatePropertyCommand([this.target], 'srcRect', current, prev));
    this.deactivate(true);
  }

  cancel(){ this.deactivate(false); }

  resetToFull(){
    if(!this.active || !this.target) return;
    this._setRect({x:0,y:0,w:100,h:100});
  }

  _layout(){
    if(!this.target || !this._overlay) return;
    const img = this.target.dom.querySelector('img.img');
    const viewport = this.target.dom.querySelector('.img-viewport');
    if(!img || !viewport) return;

    // Overlay covers the viewport
    const base = this.target.dom.getBoundingClientRect();
    const vr = viewport.getBoundingClientRect();
    const ox = vr.left - base.left;
    const oy = vr.top  - base.top;
    const ow = vr.width;
    const oh = vr.height;
    Object.assign(this._overlay.style, { left: ox+'px', top: oy+'px', width: ow+'px', height: oh+'px' });

    // Backdrop: FULL image with current fit as if srcRect was full
    const nW = img.naturalWidth || 0;
    const nH = img.naturalHeight || 0;
    let fit = (this.target.getProp('fit') || 'resize').toLowerCase(); if(fit==='scale-down' || fit==='none') fit='resize';
    let outW=0, outH=0, left=0, top=0;
    if(nW && nH){
      if(fit === 'fill'){
        const sx = ow / nW, sy = oh / nH;
        outW = nW * sx; outH = nH * sy;
        left = 0; top = 0;
      } else {
        let s;
        if(fit==='cover') s = Math.max(ow/nW, oh/nH);
        else if(fit==='none') s = 1;
        else s = Math.min(1, Math.min(ow/nW, oh/nH)); // scale-down
        outW = nW * s; outH = nH * s;
        left = (ow - outW)/2; top = (oh - outH)/2;
      }
    }
    if(this._backdrop){
      Object.assign(this._backdrop.style, {
        position:'absolute',
        width: Math.round(outW)+'px',
        height: Math.round(outH)+'px',
        left: Math.round(left)+'px',
        top: Math.round(top)+'px',
        maxWidth:'none',
        maxHeight:'none',
        opacity: '0.4'
      });
    }
        const r = this.target.getProp('srcRect') || {x:0,y:0,w:100,h:100};
if(this._fore){
      Object.assign(this._fore.style, {
        position:'absolute',
        width: Math.round(outW)+'px',
        height: Math.round(outH)+'px',
        left: Math.round(left)+'px',
        top: Math.round(top)+'px',
        maxWidth:'none',
        maxHeight:'none',
        opacity:'1'
      });
      // Clip the foreground to crop rect so area inside is opaque, outside stays semi-transparent from backdrop
      const lInset = Math.max(0, Math.round(( (r.x/100) * outW )));
      const tInset = Math.max(0, Math.round(( (r.y/100) * outH )));
      const rInset = Math.max(0, Math.round(outW - ((r.x + r.w)/100) * outW));
      const bInset = Math.max(0, Math.round(outH - ((r.y + r.h)/100) * outH));
      this._fore.style.clipPath = `inset(${tInset}px ${rInset}px ${bInset}px ${lInset}px)`;
      // Show foreground only during re-crop (i.e., when initial was not full)
      const r0 = this._initial || {x:0,y:0,w:100,h:100};
      const isFull0 = (r0.x===0&&r0.y===0&&r0.w===100&&r0.h===100);
      this._fore.style.display = isFull0 ? 'none' : 'block';
    }

    // Crop box from CURRENT srcRect using backdrop transform
    const bx = left + (r.x/100) * outW;
    const by = top  + (r.y/100) * outH;
    const bw = Math.max(outW * (r.w/100), 1);
    const bh = Math.max(outH * (r.h/100), 1);
    Object.assign(this._box.style, { left: bx+'px', top: by+'px', width: bw+'px', height: bh+'px' });

    // Masks relative to overlay (viewport)
    this._mask[0].style.cssText = `left:0px; top:0px; width:${ow}px; height:${by}px`;               // top
    this._mask[1].style.cssText = `left:${bx+bw}px; top:${by}px; width:${ow-(bx+bw)}px; height:${bh}px`;  // right
    this._mask[2].style.cssText = `left:0px; top:${by+bh}px; width:${ow}px; height:${oh-(by+bh)}px`;      // bottom
    this._mask[3].style.cssText = `left:0px; top:${by}px; width:${bx}px; height:${bh}px`;                 // left
  }

  _setRect(rect){
    // clamp within 0..100 and maintain at least 1% size
    let r = {...rect};
    r.x = Math.max(0, Math.min(100, r.x));
    r.y = Math.max(0, Math.min(100, r.y));
    r.w = Math.max(1, Math.min(100 - r.x, r.w));
    r.h = Math.max(1, Math.min(100 - r.y, r.h));
    this.target.setProp('srcRect', r, {silent:true});
    this._layout();
  }

  _startDrag(e, name){
    e.preventDefault(); e.stopPropagation();
    const m = this._imgMetrics();
    if(!m) return;
    const {imgRect} = m;
    const ow = imgRect.width;
    const oh = imgRect.height;
    const start = {x: e.clientX, y: e.clientY};
    const base = {...(this.target.getProp('srcRect')||{x:0,y:0,w:100,h:100})};

    const onMove = (ev)=>{
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      // convert to percentage of displayed image
      const px2pctX = (dx / ow) * 100;
      const px2pctY = (dy / oh) * 100;
      let r = {...base};
      if(name==='move'){
        r.x = base.x + px2pctX;
        r.y = base.y + px2pctY;
      } else {
        if(name.includes('n')){ r.y = base.y + px2pctY; r.h = base.h - px2pctY; }
        if(name.includes('s')){ r.h = base.h + px2pctY; }
        if(name.includes('w')){ r.x = base.x + px2pctX; r.w = base.w - px2pctX; }
        if(name.includes('e')){ r.w = base.w + px2pctX; }
      }
      this._setRect(r);
    };
    const onUp = ()=>{
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // keep silently; commit happens on confirm()
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  _imgMetrics(){
    const img = this.target?.dom?.querySelector('img.img');
    const viewport = this.target?.dom?.querySelector('.img-viewport');
    if(!img || !viewport) return null;
    const ir = img.getBoundingClientRect();
    const vr = viewport.getBoundingClientRect();
    return {imgRect: ir, viewportRect: vr};
  }
}
