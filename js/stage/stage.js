
import { applyStagePolicy } from '../policy/stage-policy.js';
import CONFIG from '../config/app-config.js';
import { $ } from '../utils/dom.js';
import { EventBus } from '../core/eventbus.js';

export class Stage {
  constructor(host, options={}){
    this.host = host; this.hostId = Math.random().toString(36).slice(2);
    this.bus = new EventBus();
    this.zoom = 1;
    this.gridSize = options.gridSize ?? 16;
    this.aspect = options.aspect ?? '16:9';
    this.bgUrl = '';
    this.elements = [];
    this.selected = [];
    this._build();
  }
  _build(){
    this.el = document.createElement('div');
    this.el.className = 'stage';
    this.el.tabIndex = 0;
    this._applyAspect();
    this.gridEl = document.createElement('div'); this.gridEl.className='grid'; this.el.appendChild(this.gridEl);
    this.host.innerHTML=''; this.host.appendChild(this.el);

    this._setupMultiBox();
    this._bindPan();
    this._bindEvents();
    // Block interactions when step locked
    const blockIfLocked = (e)=>{ try{ if(this.el && this.el.dataset && this.el.dataset.locked==='1'){ e.preventDefault(); e.stopPropagation(); } }catch(_e){} };
    this.el.addEventListener('beforeinput', blockIfLocked, true);
    this.el.addEventListener('click', blockIfLocked, true);
    this.el.addEventListener('pointerdown', blockIfLocked, true);
    this.el.addEventListener('keydown', blockIfLocked, true);
    // prevent interactions when step locked
    this.el.addEventListener('beforeinput', (e)=>{ if(this.el && this.el.dataset && this.el.dataset.locked==='1'){ e.preventDefault(); e.stopPropagation(); } }, true);
    this.el.addEventListener('click', (e)=>{ const t=e.target; if(this.el && this.el.dataset && this.el.dataset.locked==='1'){ if(t && (t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='TEXTAREA'||t.tagName==='BUTTON')){ e.preventDefault(); e.stopPropagation(); } } }, true);
    this.el.addEventListener('contextmenu', e=> e.preventDefault());

    this.updateGridCss();
  }
  _setupMultiBox(){
    this.selRect = document.createElement('div');
    this.selRect.className = 'selection-rect';
    this.selRect.style.display = 'none';
    this.el.appendChild(this.selRect);

    this.multiBox = document.createElement('div');
    this.multiBox.className = 'selection-rect';
    this.multiBox.style.display = 'none';
    this.el.appendChild(this.multiBox);

    const names = ['nw','n','ne','w','e','sw','s','se'];
    this.multiHandles = {};
    for(const n of names){
      const h = document.createElement('div'); h.className = 'handle ' + n;
      this.multiBox.appendChild(h); this.multiHandles[n]=h;
      h.addEventListener('mousedown', (e)=> this._startGroupResize(e, n));
    }
  }
  _bindPan(){
    const host = this.host;
    let panning = null;
    host.addEventListener('contextmenu', (e)=>{ if(panning){ e.preventDefault(); } });
    host.addEventListener('mousedown', (e)=>{
      if(e.button===2){ panning = {x:e.clientX, y:e.clientY, sx:host.scrollLeft, sy:host.scrollTop}; host.classList.add('panning'); e.preventDefault(); }
    });
    window.addEventListener('mousemove', (e)=>{
      if(!panning) return;
      host.scrollLeft = panning.sx - (e.clientX - panning.x);
      host.scrollTop  = panning.sy - (e.clientY - panning.y);
    });
    window.addEventListener('mouseup', ()=>{ panning=null; host.classList.remove('panning'); });
  }
  _bindEvents(){
    let dragStart = null;
    this.el.addEventListener('mousedown', (e)=>{
      if(e.button!==0) return;
      if(e.target===this.el || e.target===this.gridEl){
        const rect = this.el.getBoundingClientRect();
        dragStart = {x:(e.clientX-rect.left), y:(e.clientY-rect.top)};
        this.selRect.style.display='block';
        Object.assign(this.selRect.style, {left:dragStart.x+'px',top:dragStart.y+'px',width:'0px',height:'0px'});
        e.preventDefault();
      }
    });
    window.addEventListener('mousemove', (e)=>{
      if(!dragStart) return;
      const rect = this.el.getBoundingClientRect();
      const x = (e.clientX-rect.left), y = (e.clientY-rect.top);
      const left = Math.min(dragStart.x,x), top = Math.min(dragStart.y,y);
      const w = Math.abs(x-dragStart.x), h = Math.abs(y-dragStart.y);
      Object.assign(this.selRect.style, {left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
      this._updateSelectionFromRect({left,top,width:w,height:h});
    });
    window.addEventListener('mouseup', ()=>{
      if(dragStart){ dragStart=null; this.selRect.style.display='none'; this.bus.emit('selection-changed', this.selected); }
    });
    // Zoom (ctrl-wheel) anchored on cursor; normal wheel scroll delegates to host
    this.el.addEventListener('wheel', (e)=>{
      if(e.ctrlKey){ e.preventDefault();
        const rect = this.el.getBoundingClientRect();
        const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
        const sceneX = cx / this.zoom, sceneY = cy / this.zoom;
        const nz = Math.max(.2, Math.min(3, this.zoom + (e.deltaY<0? .1 : -.1)));
        this.setZoom(nz);
        const nx = sceneX * this.zoom, ny = sceneY * this.zoom;
        const dx = nx - cx, dy = ny - cy;
        this.host.scrollLeft += dx; this.host.scrollTop += dy;
      }
    }, {passive:false});
    // Horizontal scroll helper: Shift + wheel
    this.el.addEventListener('wheel', (e)=>{ if(!e.ctrlKey && e.shiftKey){ this.host.scrollLeft += e.deltaY; } }, {passive:true});
  }
  _updateSelectionFromRect(r){
    const hits = this.elements.filter(el => {
      const b = el.bounds();
      const z = this.zoom;
      const px = {left:b.x*z, top:b.y*z, right:(b.x+b.w)*z, bottom:(b.y+b.h)*z};
      return !(px.left > r.left + r.width || px.right < r.left || px.top > r.top + r.height || px.bottom < r.top);
    });
    this.setSelection(hits);
  }
  updateGridCss(){ const size = (this.gridSize || 1) * this.zoom; this.el.style.setProperty('--gridSize', size+'px'); }
  setAspect(aspect){ this.aspect=aspect; this._applyAspect(); }
  _applyAspect(){
    const map = {'16:9':[1280,720], '9:16':[720,1280], '4:3':[1200,900]};
    const [w,h] = map[this.aspect] || map['16:9'];
    this.el.style.width = w*this.zoom + 'px';
    this.el.style.height = h*this.zoom + 'px';
    this.el.style.backgroundImage = this.bgUrl ? `url("${this.bgUrl}")` : 'none';
    this.el.style.backgroundSize = 'cover';
  }
  setZoom(z){
    this.zoom=z; this._applyAspect(); this.updateGridCss();
    for(const el of this.elements){ el.updateDom(); }
    if(this.multiBox) this._updateMultiBox();
      this.bus.emit('geometry-preview',{el:this.selected[0]});
    this.bus.emit('zoom-changed', {now:this.zoom});
  }
  setGrid(size){ this.gridSize = size; this.updateGridCss(); }
  setFineGrid(on){ this.el.style.setProperty('--gridMinorAlpha', on? 0.25 : 0); this.updateGridCss(); }
  setBackground(url){ this.bgUrl = url; this._applyAspect(); }
  addElement(el, index=null){ el.attach(this); if(index===null) this.elements.push(el); else this.elements.splice(index,0,el); el.updateDom(); this.bus.emit('elements-changed'); }
  removeElement(el){ const i=this.elements.indexOf(el); if(i>=0) this.elements.splice(i,1); el.detach(); this.setSelection(this.selected.filter(s=>s!==el)); this.bus.emit('elements-changed'); }
  setSelection(arr){ this.selected.forEach(s=>s.setSelected(false)); this.selected = arr; this.selected.forEach(s=>s.setSelected(true)); this.bus.emit('selection-changed', this.selected); if(this.multiBox) this._updateMultiBox();
      this.bus.emit('geometry-preview',{el:this.selected[0]}); }
  clearSelection(){ this.setSelection([]); }
  _updateMultiBox(){
    if(!this.multiBox) return;
    if(this.selected.length<=1){ this.multiBox.style.display='none'; return; }
    const z=this.zoom;
    const xs=this.selected.map(s=>s.x), ys=this.selected.map(s=>s.y);
    const xe=this.selected.map(s=>s.x+s.w), ye=this.selected.map(s=>s.y+s.h);
    const left=Math.min(...xs)*z, top=Math.min(...ys)*z;
    const right=Math.max(...xe)*z, bottom=Math.max(...ye)*z;
    Object.assign(this.multiBox.style,{display:'block',left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px'});
  }
  _startGroupResize(e, edge){
    e.preventDefault(); e.stopPropagation();
    const z=this.zoom;
    const start = {x:e.clientX,y:e.clientY};
    const xs=this.selected.map(s=>s.x), ys=this.selected.map(s=>s.y);
    const xe=this.selected.map(s=>s.x+s.w), ye=this.selected.map(s=>s.y+s.h);
    const box={x:Math.min(...xs), y:Math.min(...ys), w:Math.max(...xe)-Math.min(...xs), h:Math.max(...ye)-Math.min(...ys)};
    const before = this.selected.map(s=>({el:s, x:s.x, y:s.y, w:s.w, h:s.h}));
    const onMove = (ev)=>{
      const dx=(ev.clientX-start.x)/z, dy=(ev.clientY-start.y)/z;
      let scaleX=1, scaleY=1, bx=box.x, by=box.y, bw=box.w, bh=box.h;
      if(edge.includes('e')){ scaleX=(bw+dx)/bw; }
      if(edge.includes('w')){ scaleX=(bw-dx)/bw; bx=box.x+dx; }
      if(edge.includes('s')){ scaleY=(bh+dy)/bh; }
      if(edge.includes('n')){ scaleY=(bh-dy)/bh; by=box.y+dy; }
      const gs=this.gridSize;
      for(const s of this.selected){
        const rx=(s.x - box.x)/box.w, ry=(s.y - box.y)/box.h;
        const rw=s.w/box.w, rh=s.h/box.h;
        let nx=bx + rx*(bw*scaleX), ny=by + ry*(bh*scaleY);
        let nw=rw*(bw*scaleX), nh=rh*(bh*scaleY);
        if(gs>0){ nx=Math.round(nx/gs)*gs; ny=Math.round(ny/gs)*gs; nw=Math.round(nw/gs)*gs; nh=Math.round(nh/gs)*gs; }
        s.setXY(nx,ny,{silent:true}); s.setSize(nw,nh,{silent:true}); s.updateDom();
      }
      this._updateMultiBox();
      this.bus.emit('geometry-preview',{el:this.selected[0]});
    };
    const onUp = ()=>{
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      const after = this.selected.map(s=>({el:s, x:s.x, y:s.y, w:s.w, h:s.h}));
      this.bus.emit('interaction', {type:'group-resize', before, after});
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}

// NOTE: Call applyStagePolicy(this, this.bus) at the end of Stage constructor.
