import { BaseElement } from './base-element.js';
import { registry } from '../core/registry.js';

const DEFAULT_PDF = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

// Lazy load pdf.js
function ensurePdfJs(){
  return new Promise((resolve, reject)=>{
    if(window.pdfjsLib){ resolve(window.pdfjsLib); return; }
    const ver = "3.11.174";
    const sources = [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${ver}/build/pdf.min.js`,
      `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.min.js`,
      `./libs/pdfjs/pdf.min.js`
    ];
    let idx = 0;
    const tryNext = ()=>{
      if(idx >= sources.length){
        reject(new Error('pdf.js load failed'));
        return;
      }
      const src = sources[idx++];
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ()=>{ if(window.pdfjsLib) resolve(window.pdfjsLib); else tryNext(); };
      s.onerror = ()=>{ tryNext(); };
      (document.head||document.body).appendChild(s);
    };
    tryNext();
  });
}

export class PdfElement extends BaseElement{
  constructor(opts={}){
    super(Object.assign({w:420,h:300}, opts));
    if(!this.getProp('url')) this.props.set('url', DEFAULT_PDF);
    if(!this.getProp('page')) this.props.set('page', 1);
    if(!this.getProp('viewMode')) this.props.set('viewMode', 'page'); // 'free' | 'page' | 'book'
    // internals
    this._doc = null;
    this._renderReq = 0;
    this._lastKey = '';
    this._loadingId = 0;
    this._pageCount = 1;
  }
  attach(stage){
    super.attach(stage);
    this.dom.dataset.type = 'pdf';
    this.dom.style.overflow='visible';
    // containers
    this.content = document.createElement('div');
    this.content.className='pdf-content';
    Object.assign(this.content.style,{position:'absolute', left:'0', top:'0', right:'0', bottom:'0', overflow:'hidden'});
    this.dom.appendChild(this.content);

    // single-page canvas (for 'page' and 'book')
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pdf-canvas';
    Object.assign(this.canvas.style, {position:'absolute', left:'0', top:'0'});
    this.ctx = this.canvas.getContext('2d');

    // multi-page scroll container (for 'free')
    this.scroll = document.createElement('div');
    this.scroll.className = 'pdf-scroll';
    Object.assign(this.scroll.style, {position:'absolute', left:'0', top:'0', right:'0', bottom:'0', overflow:'auto'});

    // error overlay
    this.err = document.createElement('div');
    Object.assign(this.err.style, {position:'absolute', left:'0', top:'0', right:'0', bottom:'0', display:'none', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.04)', color:'#c00', font:'12px system-ui'});
    this.err.textContent = 'PDF non disponibile (controlla URL o CORS)';
    this.content.appendChild(this.err);

    // input policy
    this._applyInputPolicy();

    // react to zoom
    this._onZoom = ()=> this.updateDom();
    this.stage.bus.on('zoom-changed', this._onZoom);

    this._scheduleRender(true);
  }
  detach(){
    try{ this.stage?.bus?.off && this.stage.bus.off('zoom-changed', this._onZoom); }catch(_){}
    super.detach?.();
  }

  resolveUrl(){
    const raw = this.getProp('url') || DEFAULT_PDF;
    const s = String(raw||'').trim();
    if(!/^https?:\/\//i.test(s)) return '';
    return s.split('#')[0];
  }

  _mode(){ return (this.getProp('viewMode')||'page'); }

  _key(){
    const url = this.resolveUrl();
    const page = Math.max(1, parseInt(this.getProp('page'),10)||1);
    const z = this.stage?.zoom || 1;
    return `${url}|mode=${this._mode()}|p=${page}|z=${z}|w=${this.w}|h=${this.h}`;
  }

  async _ensureDoc(url){
    if(!url){ return null; }
    try{
      const myId = ++this._loadingId;
      const pdfjsLib = await ensurePdfJs();
      if(myId !== this._loadingId) return null;
      if(this._doc){ try{ await this._doc.destroy(); }catch(_){ } this._doc=null; }
      const task = pdfjsLib.getDocument({url});
      const doc = await task.promise;
      if(myId !== this._loadingId){ try{ await doc.destroy(); }catch(_){ } return null; }
      this._doc = doc; this._pageCount = doc.numPages||1;
      return doc;
    }catch(e){
      // fallback path: use iframe viewer
      this._doc = null; this._pageCount = 9999; // unknown, will rely on user
      this._renderFallback();
      return null;
    }
  }

  _setError(on){
    if(this.err) this.err.style.display = 'none'; // niente messaggio, solo grigio
    if(on){
      try{ if(this.canvas && this.canvas.parentNode) this.canvas.remove(); }catch(_){ }
      try{ if(this.scroll && this.scroll.parentNode) this.scroll.remove(); }catch(_){ }
      if(this.content) this.content.style.overflow='hidden';
      if(this.dom) this.dom.style.background = '#e0e0e0';
    }else{
      const bg = this.getProp && (this.getProp('bg')||'#ffffff');
      if(this.dom) this.dom.style.background = bg;
    }
  }

  async _render(){
    if(!this.content){ return; }
    const key = this._key();
    if(key===this._lastKey) return; this._lastKey = key;
    const url = this.resolveUrl();
    // If we can render via pdf.js
    let doc = this._doc;
    if(!doc || (doc && doc._transport && doc._transport.params?.url !== url)){
      doc = await this._ensureDoc(url);
    }
    if(!doc){ this._renderFallback(); return; }
    const mode = this._mode();
    if(mode==='free'){
      await this._renderFree();
    }else{
      const pageNum = Math.max(1, Math.min(this._pageCount, parseInt(this.getProp('page'),10)||1));
      await this._renderSingle(pageNum, mode==='page');
    }
  }

  // fit-contain single page into element box and center (no stretch)
  async _renderSingle(pageNum, blockWheel){
    // setup containers
    this._useCanvas();
    // input
    this._bindBookGestures(!blockWheel);

    const page = await this._doc.getPage(pageNum);
    const z = this.stage?.zoom || 1;
    const elW = this.w * z, elH = this.h * z;
    const vp1 = page.getViewport({scale:1});
    const scaleContain = Math.max(0.01, Math.min(elW/vp1.width, elH/vp1.height));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rScale = scaleContain * dpr;
    const renderVp = page.getViewport({scale:rScale});

    // canvas backing store
    this.canvas.width = Math.max(1, Math.round(renderVp.width));
    this.canvas.height = Math.max(1, Math.round(renderVp.height));

    // CSS placement (centered)
    const cssW = Math.round(vp1.width * scaleContain);
    const cssH = Math.round(vp1.height * scaleContain);
    Object.assign(this.canvas.style, {
      width: cssW+'px',
      height: cssH+'px',
      left: ((elW-cssW)/2)+'px',
      top: ((elH-cssH)/2)+'px'
    });

    const ctx = this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    await page.render({canvasContext: ctx, viewport: renderVp}).promise;
  }

  // render a vertically scrollable document ('free' mode)
  async _renderFree(){
    this._useScroll();
    // clear if URL changed (rebuild all)
    this.scroll.innerHTML='';
    const z = self?.stage?.zoom || this.stage?.zoom || 1;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const elW = this.w * z;
    for(let i=1;i<=this._pageCount;i++){
      const holder = document.createElement('div');
      holder.style.position='relative';
      holder.style.margin='0 auto 12px auto';
      const canvas = document.createElement('canvas');
      canvas.style.display='block';
      holder.appendChild(canvas);
      this.scroll.appendChild(holder);

      // render each page fit to width
      try{
        const page = await this._doc.getPage(i);
        const vp1 = page.getViewport({scale:1});
        const scale = Math.max(0.01, elW / vp1.width);
        const renderVp = page.getViewport({scale: scale * dpr});
        canvas.width = Math.max(1, Math.round(renderVp.width));
        canvas.height = Math.max(1, Math.round(renderVp.height));
        // CSS size
        canvas.style.width = Math.round(vp1.width*scale)+'px';
        canvas.style.height = Math.round(vp1.height*scale)+'px';
        const ctx = canvas.getContext('2d');
        await page.render({canvasContext: ctx, viewport: renderVp}).promise;
      }catch(e){
        // skip failed pages
      }
    }
  }

  _useCanvas(){
    // show canvas, hide scroll
    if(!this.canvas.parentNode){ this.content.appendChild(this.canvas); }
    if(this.scroll.parentNode){ this.scroll.remove(); }
    this.content.style.overflow='hidden';
  }
  _useScroll(){
    // show scroll, hide canvas
    if(!this.scroll.parentNode){ this.content.appendChild(this.scroll); }
    if(this.canvas.parentNode){ this.canvas.remove(); }
    this.content.style.overflow='auto';
  }

  _bindBookGestures(enableSwipe){
    // wheel policy
    this.content.onwheel = (e)=>{ e.preventDefault(); };
    // swipe for 'book'
    if(enableSwipe){
      let sx=0, sy=0, active=false;
      this.content.onpointerdown = (e)=>{ active=true; sx=e.clientX; sy=e.clientY; };
      window.addEventListener('pointerup', (e)=>{
        if(!active) return;
        active=false;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){
          const cur = Math.max(1, Math.min(this._pageCount, parseInt(this.getProp('page'),10)||1));
          if(dx<0 && cur < this._pageCount){ this.setProp('page', cur+1); }
          if(dx>0 && cur > 1){ this.setProp('page', cur-1); }
        }
      }, {once:false});
    }else{
      this.content.onpointerdown=null;
    }
  }

  _applyInputPolicy(){
    // free: allow scroll; others: block wheel
    const m = this._mode();
    if(m==='free'){
      this.content.onwheel = null;
    }else{
      this.content.onwheel = (e)=>{ e.preventDefault(); };
    }
  }

  _scheduleRender(force=false){
    const reqId = ++this._renderReq;
    const go = async()=>{
      if(!force){ await new Promise(r=> requestAnimationFrame(()=> requestAnimationFrame(r))); }
      if(reqId!==this._renderReq) return;
      try{ await this._render(); }catch(e){ /* noop */ }
    };
    go();
  }

  updateDom(){
    if(!this.dom){ return; }
    super.updateDom?.();
    const bg = this.getProp('bg')||'#ffffff';
    const br = this.getProp('border')||'1px solid rgba(0,0,0,0.1)';
    this.dom.style.background=bg; this.dom.style.border=br; this.dom.style.borderRadius='6px';
    this._applyInputPolicy();
    this._scheduleRender();
  }

  setProp(k,v,{silent=false}={}){
    super.setProp(k,v,{silent});
    if(['url','page','viewMode'].includes(k) && !silent){
      this._lastKey='';
      if(k==='url'){ this._doc && this._doc.destroy && this._doc.destroy(); this._doc=null; }
      this._scheduleRender(true);
    }
  }
}
PdfElement.type='pdf';
registry.registerElement(PdfElement.type, PdfElement);
