import { $, $$, clamp, snapTo, pxToPct, pctToPx, clientToStage } from './utils.js';
import Editor from '../editor/editor.js';
import { MoveElementsCommand, ResizeElementsCommand } from '../commands/element-commands.js';
import { MoveElementsCommand, ResizeElementsCommand } from '../commands/element-commands.js';

export default class BaseElement {
  constructor(type, x=10, y=10, w=20, h=10){
    this.id = Editor.uid(type); this.type = type;
    this.x=x; this.y=y; this.w=w; this.h=h;
    this.rotation=0; this.z=1; this.lockRatio=false; this._ratio=w/h;
    this.dom=null; this.selected=false;
  }
  createDom(){ throw new Error('createDom must be implemented'); }
  mount(parent){ if(!this.dom) this.createDom(); parent.appendChild(this.dom); this.applyTransform(); this.attachInteractivity(); }
  unmount(){ if(this.dom?.parentElement){ this.dom.parentElement.removeChild(this.dom); } }
  applyTransform(){ if(!this.dom) return; this.z=Math.max(0, this.z|0); Object.assign(this.dom.style, { left:this.x+'%', top:this.y+'%', width:this.w+'%', height:this.h+'%', zIndex:this.z, position:'absolute' }); Editor.instance?.onElementChanged(); }
  toJSON(){ return { id:this.id,type:this.type,x:this.x,y:this.y,w:this.w,h:this.h,rotation:this.rotation,z:this.z,lockRatio:this.lockRatio }; }
  setSelected(sel){ this.selected=sel; if(!this.dom) return; this.dom.classList.toggle('selected',sel); if(sel){ this.ensureHandles(); } else { this.removeHandles(); } }
  ensureHandles(){ if($('.handles',this.dom)) return; const box=document.createElement('div'); box.className='handles'; ['nw','n','ne','e','se','s','sw','w'].forEach(d=>{ const h=document.createElement('div'); h.dataset.dir=d; h.className=`handle ${d}`; h.dataset.editorUi='1'; box.appendChild(h);}); this.dom.appendChild(box);}    
  removeHandles(){ $$('.handles',this.dom).forEach(n=>n.remove()); }
  attachInteractivity(){
    this.dom.addEventListener('mousedown',(e)=>{
      if(e.target.classList.contains('handle')) return;
      if(e.ctrlKey||e.metaKey||e.shiftKey) Editor.instance.toggleSelect(this); else Editor.instance.selectOnly(this);
      const stage=Editor.instance.stageEl; const start=clientToStage(e, stage);
      const {x:sx,y:sy}=this; const grid=Editor.instance.gridPct();
      let hasMoved = false;
      
      const onMove=(ev)=>{ const p=clientToStage(ev, stage); const dx=pxToPct(p.x-start.x, stage.clientWidth); const dy=pxToPct(p.y-start.y, stage.clientHeight);
        let nx=sx+dx, ny=sy+dy; nx=clamp(snapTo(nx,grid.x),0,100-this.w); ny=clamp(snapTo(ny,grid.y),0,100-this.h); this.x=nx; this.y=ny; this.applyTransform(); Editor.instance.reflectSelection();
        hasMoved = true;
      };
      const onUp=()=>{ 
        window.removeEventListener('mousemove', onMove); 
        window.removeEventListener('mouseup', onUp);
        
        if (hasMoved) {
          // Create command for the completed move
          const finalDx = this.x - sx;
          const finalDy = this.y - sy;
          
          // Reset to original position
          this.x = sx;
          this.y = sy;
          this.applyTransform();
          
          // Execute command
          const cmd = new MoveElementsCommand(Editor.instance, Editor.instance.selected, finalDx, finalDy, 'Sposta elementi');
          Editor.instance.commandMgr.executeCommand(cmd);
        }
      };
        hasMoved = true;
      };
      const onUp=()=>{ 
        window.removeEventListener('mousemove', onMove); 
        window.removeEventListener('mouseup', onUp);
        
        if (hasMoved) {
          // Create command for the completed move
          const finalDx = this.x - sx;
          const finalDy = this.y - sy;
          
          // Reset to original position
          this.x = sx;
          this.y = sy;
          this.applyTransform();
          
          // Execute command
          const cmd = new MoveElementsCommand(Editor.instance, Editor.instance.selected, finalDx, finalDy, 'Sposta elementi');
          Editor.instance.commandMgr.executeCommand(cmd);
        }
      };
      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    });
    this.dom.addEventListener('mousedown',(e)=>{
      const h=e.target.closest('.handle'); if(!h) return; e.stopPropagation();
      Editor.instance.selectInclude(this);
      const dir=h.dataset.dir; const stage=Editor.instance.stageEl; const start=clientToStage(e, stage);
      const sx=this.x, sy=this.y, sw=this.w, sh=this.h; const aspect=sw/sh; const grid=Editor.instance.gridPct();
      let hasResized = false;
      const sx=this.x, sy=this.y, sw=this.w, sh=this.h; const aspect=sw/sh; const grid=Editor.instance.gridPct();
      let hasResized = false;
      
      const onMove=(ev)=>{
        hasResized = true;
        hasResized = true;
        const p=clientToStage(ev, stage); const dx=pxToPct(p.x-start.x, stage.clientWidth); const dy=pxToPct(p.y-start.y, stage.clientHeight);
        let nx=sx, ny=sy, nw=sw, nh=sh;
        if(dir.includes('e')) nw = sw + dx;
        if(dir.includes('s')) nh = sh + dy;
        if(dir.includes('w')) { nx = sx + dx; nw = sw - dx; }
        if(dir.includes('n')) { ny = sy + dy; nh = sh - dy; }
        if(this.lockRatio){ if(dir==='e'||dir==='w') nh = nw / aspect; else if(dir==='n'||dir==='s') nw = nh * aspect; else { if(Math.abs(dx)>Math.abs(dy)){ nh = nw / aspect; } else { nw = nh * aspect; } } }
        nw = Math.max(1, nw); nh = Math.max(1, nh);
        nx = Math.max(0, Math.min(100-1, nx)); ny = Math.max(0, Math.min(100-1, ny));
        if(nx+nw>100) nw = 100-nx; if(ny+nh>100) nh = 100-ny;
        nx = snapTo(nx, grid.x); ny = snapTo(ny, grid.y); nw = snapTo(nw, grid.x); nh = snapTo(nh, grid.y);
        Object.assign(this,{x:nx,y:ny,w:nw,h:nh}); this.applyTransform(); Editor.instance.reflectSelection(); };
      const onUp=()=>{ 
        window.removeEventListener('mousemove', onMove); 
        window.removeEventListener('mouseup', onUp);
        
        if (hasResized) {
          // Create command for the completed resize
          const newBounds = [{ x: this.x, y: this.y, w: this.w, h: this.h }];
          
          // Reset to original bounds
          Object.assign(this, { x: sx, y: sy, w: sw, h: sh });
          this.applyTransform();
          
          // Execute command
          const cmd = new ResizeElementsCommand(Editor.instance, [this], newBounds, 'Ridimensiona elemento');
          Editor.instance.commandMgr.executeCommand(cmd);
        }
      };
        window.removeEventListener('mousemove', onMove); 
        window.removeEventListener('mouseup', onUp);
        
        if (hasResized) {
          // Create command for the completed resize
          const newBounds = [{ x: this.x, y: this.y, w: this.w, h: this.h }];
          
          // Reset to original bounds
          Object.assign(this, { x: sx, y: sy, w: sw, h: sh });
          this.applyTransform();
          
          // Execute command
          const cmd = new ResizeElementsCommand(Editor.instance, [this], newBounds, 'Ridimensiona elemento');
          Editor.instance.commandMgr.executeCommand(cmd);
        }
      };
      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    });
  }
  getPropSchema(){
    return [
      { key:'x', label:'X %', type:'number', min:0 },
      { key:'y', label:'Y %', type:'number', min:0 },
      { key:'w', label:'Larghezza %', type:'number', min:1 },
      { key:'h', label:'Altezza %', type:'number', min:1 },
      { key:'z', label:'Z-index', type:'number', min:0 },
      { key:'lockRatio', label:'Blocca proporzioni', type:'checkbox' }
    ];
  }
  readProps(){}
}