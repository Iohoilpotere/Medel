
import { $ } from '../utils/dom.js';

function makePreviewCanvas(step, size=[320,180]){
  const [W,H] = size;
  const c = document.createElement('canvas'); c.width=W; c.height=H;
  const g = c.getContext('2d');
  g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--stage-bg').trim() || '#fff';
  g.fillRect(0,0,W,H);
  const els = step.elements || [];
  const mapAspect = {'16:9':[1280,720],'9:16':[720,1280],'4:3':[1200,900]};
  const [sw,sh] = mapAspect[step.aspect || '16:9'] || mapAspect['16:9'];
  const sx = W/sw, sy = H/sh;
  els.forEach(e=>{
    const x=e.x*sx, y=e.y*sy, w=e.w*sx, h=e.h*sy;
    g.strokeStyle = '#55aaff'; g.lineWidth=1; g.strokeRect(x,y,w,h);
    if(e.type==='label'){ g.fillStyle='#111'; g.font='12px sans-serif'; g.fillText((e.props?.text||'Label').slice(0,24), x+3, y+14); }
  });
  return c;
}
function cloneNode(n){ return JSON.parse(JSON.stringify(n)); }
function compact(nodes){
  if(!Array.isArray(nodes)) return [];
  const out=[]; for(const n of nodes){ if(!n) continue; if(n.type==='category'){ n.children = compact(n.children||[]); } out.push(n); } return out;
}
const ICONS = {
  up: '<svg viewBox="0 0 24 24"><path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dup: '<svg viewBox="0 0 24 24"><path d="M8 8h10v10H8z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 6h10v10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  del: '<svg viewBox="0 0 24 24"><path d="M3 6h18" stroke="currentColor" stroke-width="2"/><path d="M8 6l1-2h6l1 2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="2" fill="none"/></svg>'
};

export class StepsPanel{
  constructor(app){
    this.app=app;
    this.list = $('#stepsList');
    this.addStepBtn = $('#addStepBtn');
    this.addCatBtn = $('#addCategoryBtn');
    this._ensureDropLine();
    this._bind();
    this._pendingDrop = null;
    this._dragging = false;
    this._autoScrollRAF = null;
    this._lastMouse = {x:0,y:0};
    this._bindGlobalDnD();

    // Root hover to drop at end (outside any card)
    const scrollEl = this._scrollEl();
    scrollEl.addEventListener('dragover', (e)=>{
      if(!this._dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      if(!hit || !hit.closest('#stepsList li')){
        const rect = scrollEl.getBoundingClientRect();
        this._showDropLineForRect({left:rect.left+8, width:rect.width-16, bottom:rect.bottom-8});
        this._pendingDrop = { targetPath: [], kind:'end-of-root' };
      }
    });
    scrollEl.addEventListener('drop', (e)=>{ if(!this._dragging) return; e.preventDefault(); this._onDrop(e); });
    this.render();
  }
  _ensureDropLine(){
    if(this.dropLine) return;
    this.dropLine = document.createElement('div');
    this.dropLine.className='sp-dropline';
    const host = this.list.parentElement || this.list;
    host.style.position='relative';
    host.appendChild(this.dropLine);
  }
  _bind(){
    this.addStepBtn.addEventListener('click', ()=> this.app.addStep());
    this.addCatBtn.addEventListener('click', ()=> this.app.addCategory());
  }
  _pathParent(nodes, path){
    let parent = {children:nodes};
    for(let i=0;i<path.length-1;i++){ const arr=(parent?.children||parent?.steps); if(!arr) return null; parent = arr[path[i]]; }
    return parent;
  }
  _getByPath(nodes, path){
    let n={children:nodes};
    for(const i of path){ const arr=(n?.children||n?.steps); if(!arr) return null; n = arr[i]; }
    return n;
  }
  _isAncestor(a,b){ if(a.length>=b.length) return false; for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return false; } return true; }
  _showDropLineForRect(rect){
    const hostRect = (this.list.parentElement||this.list).getBoundingClientRect();
    this.dropLine.style.display='block';
    this.dropLine.style.left = (rect.left - hostRect.left) + 'px';
    this.dropLine.style.width = rect.width + 'px';
    this.dropLine.style.top = (rect.bottom - hostRect.top) + 'px';
  }
  _hideDropLine(){ this.dropLine.style.display='none'; }
  _autoScrollTick(e){
    const scrollEl = this._scrollEl();
    const rect = scrollEl.getBoundingClientRect();
    const margin = 32, maxSpeed = 20;
    const y = (e && e.clientY!=null) ? e.clientY : this._lastMouse.y;
    let dy = 0;
    if(y < rect.top + margin){ dy = -Math.ceil((rect.top + margin - y)/margin * maxSpeed); }
    else if(y > rect.bottom - margin){ dy = Math.ceil((y - (rect.bottom - margin))/margin * maxSpeed); }
    if(dy!==0) scrollEl.scrollTop += dy;
  }

  _scrollEl(){
    const paneBody = this.list.closest('.pane-body');
    return paneBody || this.list;
  }
  _bindGlobalDnD(){
    const scrollEl = this._scrollEl();
    const onMove = (e)=>{
      this._lastMouse = {x:e.clientX||0, y:e.clientY||0};
      if(!this._dragging) return;
      if(this._autoScrollRAF) return;
      const step = ()=>{
        this._autoScrollRAF = null;
        const rect = scrollEl.getBoundingClientRect();
        const margin = 32;
        const maxSpeed = 20;
        let dy = 0;
        if(this._lastMouse.y < rect.top + margin){
          dy = -Math.ceil((rect.top + margin - this._lastMouse.y)/margin * maxSpeed);
        } else if(this._lastMouse.y > rect.bottom - margin){
          dy = Math.ceil((this._lastMouse.y - (rect.bottom - margin))/margin * maxSpeed);
        }
        if(dy!==0){ scrollEl.scrollTop += dy; }
        if(this._dragging){ this._autoScrollRAF = requestAnimationFrame(step); }
      };
      this._autoScrollRAF = requestAnimationFrame(step);
    };
    document.addEventListener('dragover', onMove, {passive:true, capture:true});
    document.addEventListener('dragend', ()=>{ this._dragging=false; if(this._autoScrollRAF){ cancelAnimationFrame(this._autoScrollRAF); this._autoScrollRAF=null; } this._hideDropLine(); this._pendingDrop=null; }, {passive:true});
    const wheelScrollWhileDrag = (e)=>{
      if(!this._dragging) return;
      // Normalize delta across browsers
      let dy = 0;
      if (e.deltaY != null) dy = e.deltaY;
      else if (e.wheelDelta != null) dy = -e.wheelDelta;
      else if (e.detail != null) dy = e.detail * 16;
      const el = this._scrollEl();
      el.scrollTop += dy;
      e.preventDefault();
      this._autoScrollTick(e);
    };
    window.addEventListener('wheel', wheelScrollWhileDrag, {passive:false, capture:true});
    window.addEventListener('mousewheel', wheelScrollWhileDrag, {passive:false, capture:true});
    window.addEventListener('DOMMouseScroll', wheelScrollWhileDrag, {passive:false, capture:true});

    

  }


  _remapPathForSwap(parentPath, i, j, path){
    if(!Array.isArray(path)) return path;
    if(path.length < parentPath.length+1) return path;
    for(let k=0;k<parentPath.length;k++){ if(path[k]!==parentPath[k]) return path; }
    const idx = parentPath.length;
    if(path[idx]===i){ const np = path.slice(); np[idx]=j; return np; }
    if(path[idx]===j){ const np = path.slice(); np[idx]=i; return np; }
    return path;
  }
  _arrAndIndexByPath(path){
    const parent = this._pathParent(this.app.project.steps, path);
    const arr = parent ? (parent.children||parent.steps) : this.app.project.steps;
    const idx = path[path.length-1];
    return {parent, arr, idx};
  }
  _moveNode(fromPath, toParentPath, toIndex){
    if(this._isAncestor(fromPath, toParentPath)) return null;
    const {arr: fromArr, idx: fromIdx} = this._arrAndIndexByPath(fromPath);
    if(!fromArr || fromIdx<0 || fromIdx>=fromArr.length) return null;
    const parentNode = toParentPath.length>0 ? this._getByPath(this.app.project.steps, toParentPath) : {children:this.app.project.steps};
    if(!parentNode) return null;
    if(!parentNode.children && !parentNode.steps){ parentNode.children = []; }
    const toArr = (parentNode.children||parentNode.steps);
    let insertIndex = Math.max(0, Math.min(toIndex, toArr.length));
    if(toArr===fromArr && insertIndex > fromIdx) insertIndex--;
    const node = fromArr[fromIdx];
    if(!node) return null;
    fromArr.splice(fromIdx,1);
    toArr.splice(insertIndex,0,node);
    return toParentPath.concat(insertIndex);
  }

  _renderNodes(container, nodes, path=[]){
    nodes = compact(nodes);
    nodes.forEach((node, idx)=>{
      const p = path.concat(idx);
      const li = document.createElement('li');
      li.dataset.path = JSON.stringify(p);
      const card = document.createElement('div'); card.className='sp-card';
      try{ if(node.type==='step' && JSON.stringify(this.app.currentStepPath)===JSON.stringify(p)) card.classList.add('current'); }catch(e){}
      const depth = p.length; if(depth>1){ card.classList.add('nested'); card.dataset.depth = String(depth-1); } else { card.classList.add('root'); card.dataset.depth='0'; }

      // Header
      const header = document.createElement('div'); header.className='sp-header';
      if(node.type==='category'){
        const caret = document.createElement('button'); caret.className='sp-caret'; caret.textContent = node.collapsed?'►':'▼';
        caret.addEventListener('click', (e)=>{ e.stopPropagation(); node.collapsed=!node.collapsed; this.render(); });
        header.appendChild(caret);
      }
      const title = document.createElement('span'); title.className='sp-title'; title.textContent = node.title || (node.type==='step'?'Step':'Categoria');
      header.appendChild(title);
      title.addEventListener('click', ()=>{
        const input = document.createElement('input'); input.type='text'; input.value = title.textContent; input.className='rename';
        title.replaceWith(input); input.focus(); input.select();
        const commit = ()=>{ node.title = input.value.trim() || node.title; if(node.type==='step' && this.app.currentStep===node){ this.app.propertiesPanel.render(); } this.render(); };
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', ev=>{ if(ev.key==='Enter') commit(); if(ev.key==='Escape') this.render(); });
      });
      card.appendChild(header);

      // Body
      const body = document.createElement('div'); body.className='sp-body';
      if(node.type==='category'){
        const childrenWrap = document.createElement('ul'); childrenWrap.className='children'; childrenWrap.dataset.depth = String(p.length); childrenWrap.classList.add('depth-'+String(p.length));
        if(!node.collapsed){ this._renderNodes(childrenWrap, node.children||[], p); }
        body.appendChild(childrenWrap);
      }else{
        const canvas = makePreviewCanvas(node, [320,180]); canvas.className='sp-thumb';
        body.appendChild(canvas);
      }
      card.appendChild(body);

      // Footer (icons only)
      const footer = document.createElement('div'); footer.className='sp-footer';
      const mkBtn = (key, title)=>{ const b=document.createElement('button'); b.className='icon-btn'; b.innerHTML=ICONS[key]; b.title=title; return b; };
      const btnUp = mkBtn('up','Muovi su');
      const btnDown = mkBtn('down','Muovi giù');
      const btnDup = mkBtn('dup','Duplica');
      const btnDel = mkBtn('del','Elimina');
      footer.append(btnUp, btnDown, btnDup, btnDel);
      card.appendChild(footer);


      // Actions
      const moveWithin = (delta)=>{
        try{ this.app._captureState(); }catch(e){}
        const parent = this._pathParent(this.app.project.steps, p);
        const arr = (parent?.children||parent?.steps||this.app.project.steps);
        const i = p[p.length-1], j=i+delta;
        if(j<0 || j>=arr.length) return;
        const tmp = arr[i]; arr[i]=arr[j]; arr[j]=tmp;
        const parentPath = p.slice(0,-1);
        const oldPath = this.app.currentStepPath ? this.app.currentStepPath.slice() : [];
        const newPath = this._remapPathForSwap(parentPath, i, j, oldPath);
        this.render();
        if(newPath && JSON.stringify(newPath)!==JSON.stringify(oldPath)) this.app.setCurrentStepByPath(newPath);
      };
      btnUp.addEventListener('click', (e)=>{ e.stopPropagation(); moveWithin(-1); });
      btnDown.addEventListener('click', (e)=>{ e.stopPropagation(); moveWithin(1); });
      btnDup.addEventListener('click', (e)=>{ 
        e.stopPropagation(); 
        try{ this.app._captureState(); }catch(ex){}
        const parent = this._pathParent(this.app.project.steps, p);
        const arr = (parent?.children||parent?.steps||this.app.project.steps);
        const node = this._getByPath(this.app.project.steps, p);
        if(!node) return;
        const copy = JSON.parse(JSON.stringify(node));
        copy.title = (copy.title || (copy.type==='step'?'Step':'Categoria')) + ' (copia)';
        arr.splice(p[p.length-1]+1, 0, copy);
        this.render();
      });
      btnDel.addEventListener('click', (e)=>{ 
        e.stopPropagation(); 
        try{ this.app._captureState(); }catch(ex){}
        const parent = this._pathParent(this.app.project.steps, p);
        const arr = (parent?.children||parent?.steps||this.app.project.steps);
        arr.splice(p[p.length-1],1); 
        this.render(); 
        this.app._ensureValidCurrentStep(); 
      });

      // Click to select step
      card.addEventListener('click', (e)=>{ if(node.type==='step' && !e.target.closest('.icon-btn')){ this.app.setCurrentStepByPath(p); } });

      // DnD with drop-line (no highlight)
      card.draggable = true;
      card.addEventListener('dragstart', e=>{ this._dragging=true; e.stopPropagation(); e.dataTransfer.setData('text/step-path', JSON.stringify(p)); e.dataTransfer.effectAllowed='move'; });
      card.addEventListener('dragover', e=>{ 
        e.preventDefault(); e.stopPropagation();
        const rect = card.getBoundingClientRect();
        if(node.type==='step'){ 
          const mid = rect.top + rect.height/2;
          const before = e.clientY < mid;
          this._showDropLineForRect(before ? {left:rect.left, width:rect.width, bottom:rect.top} : rect);
          this._pendingDrop = {targetPath: p.slice(), kind: (before ? 'before-step' : 'after-step')}; 
        } else {
          const children = card.querySelector('.children');
          const hit = document.elementFromPoint(e.clientX, e.clientY);
          let li = hit ? hit.closest('li') : null;
          let childPath = null;
          if(li && li.dataset.path){
            try{
              const path = JSON.parse(li.dataset.path);
              const isImmediateChild = path.length===p.length+1 && path.slice(0,p.length).every((v,i)=>v===p[i]);
              const childNode = this._getByPath(this.app.project.steps, path);
              if(isImmediateChild && childNode && childNode.type==='step'){
                childPath = path;
                const stepCard = li.querySelector('.sp-card');
                const r2 = stepCard.getBoundingClientRect();
                const mid2 = r2.top + r2.height/2;
                const before2 = e.clientY < mid2;
                this._showDropLineForRect(before2 ? {left:r2.left, width:r2.width, bottom:r2.top} : r2);
                this._pendingDrop = {targetPath: childPath, kind: (before2 ? 'before-step' : 'after-step')};
              }
            }catch(err){}
          }
          if(!childPath){
            const r = (children||card).getBoundingClientRect();
            this._showDropLineForRect({left:r.left, width:r.width, bottom:r.bottom});
            this._pendingDrop = {targetPath: p.slice(), kind:'end-of-category'};
          }
        }
      });
      card.addEventListener('drop', (e)=>{ e.preventDefault(); e.stopPropagation(); this._onDrop(e); });
      card.addEventListener('dragend', ()=>{ this._dragging=false; this._hideDropLine(); this._pendingDrop=null; });

      li.appendChild(card);
      container.appendChild(li);
    });
  }

  _onDrop(e){
    try{ this.app._captureState(); }catch(ex){}
    const data = e.dataTransfer.getData('text/step-path');
    const pd = this._pendingDrop;
    this._pendingDrop = null;
    this._hideDropLine();
    if(!data || !pd) return this.render();
    const fromPath = JSON.parse(data);

    let toParentPath, toIndex;
    if(pd.kind==='before-step' && pd.targetPath){
      toParentPath = pd.targetPath.slice(0,-1);
      toIndex = pd.targetPath[pd.targetPath.length-1];
    } else if(pd.kind==='after-step' && pd.targetPath){
      toParentPath = pd.targetPath.slice(0,-1);
      toIndex = pd.targetPath[pd.targetPath.length-1] + 1;
    } else if(pd.kind==='end-of-category' && pd.targetPath){
      toParentPath = pd.targetPath.slice();
      const parentNode = this._getByPath(this.app.project.steps, toParentPath);
      const toArr = (parentNode.children||parentNode.steps);
      toIndex = (toArr ? toArr.length : 0);
    } else if(pd.kind==='end-of-root'){
      toParentPath = [];
      const rootArr = this.app.project.steps;
      toIndex = rootArr.length;
    } else {
      return this.render();
    }
    // Guard: no-op if dropping into same parent & same effective index
    const fromMeta = this._arrAndIndexByPath(fromPath);
    const sameParent = JSON.stringify(toParentPath)===JSON.stringify(fromPath.slice(0,-1));
    if(sameParent){
      const effectiveTo = (toIndex>fromMeta.idx ? toIndex-1 : toIndex);
      if(effectiveTo===fromMeta.idx){ this.render(); return; }
    }
    const wasCurrent = JSON.stringify(fromPath) === JSON.stringify(this.app.currentStepPath);
    const newPath = this._moveNode(fromPath, toParentPath, toIndex);
    this.render();
    if(newPath){
      if(wasCurrent){
        this.app.setCurrentStepByPath(newPath);
      } else {
        // If we moved an ancestor of the current step, remap the path
        const cur = this.app.currentStepPath ? this.app.currentStepPath.slice() : [];
        const isDesc = (cur.length>fromPath.length && fromPath.every((v,i)=>v===cur[i]));
        if(isDesc){
          const suffix = cur.slice(fromPath.length);
          const mapped = newPath.concat(suffix);
          this.app.setCurrentStepByPath(mapped);
        }
      }
    }
  }

  render(){
    this.app.project.steps = compact(this.app.project.steps || []);
    this.list.innerHTML='';
    const ul = document.createElement('ul'); ul.className='tree';
    this.list.appendChild(ul);
    this._renderNodes(ul, this.app.project.steps, []);
  }
}
