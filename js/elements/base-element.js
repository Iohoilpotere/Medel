
import { addHandles } from '../stage/handles.js';

export class BaseElement{
  constructor(opts={}){
    const {x=100,y=100,w=180,h=40,z=0} = opts;
    this.x=x; this.y=y; this.w=w; this.h=h;
    this.props = new Map();
    this.props.set('z', Number(z)||0);
    // Ensure default id/name props exist for export and uniqueness handling
    (function(_self){
      try{
        // Generate a short random id
        const rnd = Math.random().toString(36).slice(2,8);
        const type = (_self.constructor && _self.constructor.type) || 'el';
        const curId = _self.props.get('id');
        const curName = _self.props.get('name');
        if(!curId){
          _self.props.set('id', `${type}-${rnd}`);
        }
        if(!curName){
          _self.props.set('name', _self.props.get('id'));
        }
      }catch(e){ /* ignore */ }
    })(this);
    // Coerce broken id values (e.g., arrays/objects) into a valid string id
    try{
      const cur = this.props.get('id');
      if(typeof cur !== 'string'){ 
        const rnd = Math.random().toString(36).slice(2,8);
        const type = (this.constructor && this.constructor.type) || 'el';
        this.props.set('id', `${type}-${rnd}`);
      }
    }catch(e){ /* ignore */ }
// relative ratios (initialized on attach)
    this._rx=null; this._ry=null; this._rw=null; this._rh=null;
  }
  attach(stage){
    this.stage = stage;
    this.dom = document.createElement('div');
    this.dom.className = 'element';
    this.content = document.createElement('div');
    this.content.className = 'content';
    this.dom.appendChild(this.content);
    this.deleteBtn = document.createElement('button');
    this.deleteBtn.className='delete-btn'; this.deleteBtn.textContent='🗑'; this.deleteBtn.title='Elimina (Del)';
    this.deleteBtn.addEventListener('click', (e)=>{ e.stopPropagation(); this.stage?.onElementDelete?.(this); });
    this.dom.appendChild(this.deleteBtn);
    this.stage.el.appendChild(this.dom);
    this._bindMouse();
    this.handles = addHandles(this.dom, (type, payload)=>this._onHandleDrag(type,payload));
    this.updateDom(); if(this.stage && this.stage.bus && this.dom){ this.stage.bus.emit('geometry-preview',{el:this}); }
  }
  detach(){ if(this.dom) this.dom.remove(); this.dom=null; this.stage=null; }
  bounds(){ return {x:this.x, y:this.y, w:this.w, h:this.h}; }
  setXY(x,y, {silent=false}={}){ this.x=x; this.y=y; if(!silent) this.updateDom(); if(this.stage && this.stage.bus && this.dom){ this.stage.bus.emit('geometry-preview',{el:this}); } }
  setSize(w,h, {silent=false}={}){ this.w=Math.max(10,w); this.h=Math.max(10,h); if(!silent) this.updateDom(); if(this.stage && this.stage.bus && this.dom){ this.stage.bus.emit('geometry-preview',{el:this}); } }
  setZ(z,{silent=false}={}){ this.props.set('z', Number(z)||0); if(!silent) this.updateDom(); }
  setProp(k,v,{silent=false}={}){ this.props.set(k,v); if(!silent) this.updateDom(); if(this.stage && this.stage.bus && this.dom){ this.stage.bus.emit('geometry-preview',{el:this}); } }
  getProp(k){ return this.props.get(k); }
  setSelected(on){ if(this.dom) this.dom.classList.toggle('selected', !!on); }
  _sceneSize(){
    if(!this.stage || !this.stage.el) return {w:1,h:1,z:1};
    const z = this.stage.zoom || 1;
    const w = this.stage.el.clientWidth / z;
    const h = this.stage.el.clientHeight / z;
    return {w,h,z};
  }
  _ensureRatios(){
    const {w:SW,h:SH} = this._sceneSize();
    if(this._rx==null){ this._rx = this.x / SW; }
    if(this._ry==null){ this._ry = this.y / SH; }
    if(this._rw==null){ this._rw = this.w / SW; }
    if(this._rh==null){ this._rh = this.h / SH; }
  }
  updateDom(){
    if(!this.dom) return;
    const z = this.stage.zoom;
    this.dom.style.left = (Math.round(this.x*z))+'px';
    this.dom.style.top = (Math.round(this.y*z))+'px';
    this.dom.style.width = (Math.round(this.w*z))+'px';
    this.dom.style.height = (Math.round(this.h*z))+'px';
  this.dom.style.zIndex = String(this.getProp('z') ?? 0);
}
  _bindMouse(){
    let start=null;
    this.dom.addEventListener('mousedown', (e)=>{
      if(e.button!==0) return;
      const alreadySelected = this.stage.selected.includes(this);
      if(e.ctrlKey || e.shiftKey){
        const sel = new Set(this.stage.selected);
        if(sel.has(this)) sel.delete(this); else sel.add(this);
        this.stage.setSelection(Array.from(sel));
      }else{
        if(!alreadySelected){
          this.stage.setSelection([this]);
        } // if already selected, keep multi-selection as-is
      }
      const targets = this.stage.selected.includes(this) ? this.stage.selected.slice() : [this];
      const initial = new Map(targets.map(t=>[t,{x:t.x,y:t.y}]));
      const before = targets.map(t=>({el:t, x:t.x, y:t.y}));
      const start = {x:e.clientX,y:e.clientY};
      const move = (ev)=>{
        const dx = (ev.clientX-start.x)/this.stage.zoom;
        const dy = (ev.clientY-start.y)/this.stage.zoom;
        const gs = this.stage.gridSize;
        for(const t of targets){
          const s0 = initial.get(t);
          let nx = s0.x + dx;
          let ny = s0.y + dy;
          if(gs>0){ nx = Math.round(nx/gs)*gs; ny = Math.round(ny/gs)*gs; }
          t.setXY(nx, ny, {silent:true});
          t.updateDom();
        }
        this.stage._updateMultiBox();
        this.stage.bus.emit('geometry-preview',{el:this});
      };
      const up = ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up);
        const after = targets.map(t=>({el:t, x:t.x, y:t.y}));
        this.stage.bus.emit('interaction', {type:'move', before, after});
      };
      window.addEventListener('mousemove',move);
      window.addEventListener('mouseup',up);
      e.stopPropagation();
      e.preventDefault();
    });
  }
  
  
  
  _onHandleDrag(type, payload){
    if(type==='start'){
      const { name } = payload;
      this._resizeHandleName = (name||'').toLowerCase();
      // Store initial edges so the opposite side remains anchored
      this._dragStartEdges = { L:this.x, T:this.y, R:this.x + this.w, B:this.y + this.h };
      this._dragStartState = { x:this.x, y:this.y, w:this.w, h:this.h };
      return;
    }
    if(type==='move'){
      if(!this._dragStartState || !this._dragStartEdges) return;
      const z = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      const gs = (this.stage && this.stage.gridSize!=null) ? this.stage.gridSize : 1;
      const snap = v => gs>0 ? Math.round(v/gs)*gs : v;
      const minW = Math.max(gs, 5);
      const minH = Math.max(gs, 5);
      const n = this._resizeHandleName;

      // Normalize mouse delta by zoom
      const sdx = (payload.dx || 0) / z;
      const sdy = (payload.dy || 0) / z;

      // Start from anchored edges
      let L = this._dragStartEdges.L;
      let R = this._dragStartEdges.R;
      let T = this._dragStartEdges.T;
      let B = this._dragStartEdges.B;

      // Move only the edges implied by the handle
      if(n.includes('w')){ L = snap(this._dragStartEdges.L + sdx); }
      if(n.includes('e')){ R = snap(this._dragStartEdges.R + sdx); }
      if(n.includes('n')){ T = snap(this._dragStartEdges.T + sdy); }
      if(n.includes('s')){ B = snap(this._dragStartEdges.B + sdy); }

      // Enforce minimum width by pushing back the moved edge, keeping the opposite fixed
      let width = R - L;
      if(width < minW){
        if(n.includes('w') && !n.includes('e')){
          L = R - minW;
        }else{
          R = L + minW;
        }
        width = R - L;
      }
      // Enforce minimum height
      let height = B - T;
      if(height < minH){
        if(n.includes('n') && !n.includes('s')){
          T = B - minH;
        }else{
          B = T + minH;
        }
        height = B - T;
      }

      // Apply: x,y come from top-left corner; w,h positive
      this.x = L;
      this.y = T;
      this.w = width;
      this.h = height;

      this.updateDom();
      if(this.stage && this.stage.bus){ this.stage.bus.emit('geometry-preview',{el:this}); }
      return;
    }
    if(type==='end'){
      if(!this._dragStartState) return;
      const before=[{el:this, x:this._dragStartState.x, y:this._dragStartState.y, w:this._dragStartState.w, h:this._dragStartState.h}];
      const after=[{el:this, x:this.x, y:this.y, w:this.w, h:this.h}];
      if(this.stage && this.stage.bus){ this.stage.bus.emit('interaction',{type:'resize', before, after}); }
      this._dragStartState = null;
      this._dragStartEdges = null;
      this._resizeHandleName = null;
      return;
    }
  }



  toJSON(){ return {type:this.constructor.type, x:this.x,y:this.y,w:this.w,h:this.h, props:Object.fromEntries(this.props)}; }
  static fromJSON(data){ const el = new this(data); if(data.props) for(const [k,v] of Object.entries(data.props)) el.setProp(k,v); return el; }
}
