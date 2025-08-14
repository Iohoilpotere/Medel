import { $, $$, clamp, uid, snapTo, pxToPct, pctToPx, clientToStage } from '../core/utils.js';
import PanelManager from '../ui/panel-manager.js';
import CaseExporter from './exporter.js';
import StepManager from '../steps/step-manager.js';
import LabelElement from '../elements/LabelElement.js';
import ImageElement from '../elements/ImageElement.js';
import TextBoxElement from '../elements/TextBoxElement.js';
import CheckboxElement from '../elements/CheckboxElement.js';
import RadioGroupElement from '../elements/RadioGroupElement.js';

export default class Editor{
  static instance;
  static uid = (p)=> uid(p);
  constructor(){
    if(Editor.instance) return Editor.instance; Editor.instance=this;
    this.palette=$('#palette'); this.stageEl=$('#stage'); this.stageSize=$('.stage-size'); this.canvas=$('#stepCanvas'); this.propForm=$('#propForm');
    this.elements=[]; this.selected=[]; this.grid=16; this.subgrid=false; this._thumbDebounce=null;
    this.initUI(); this.initKeyboard(); this.seedPalette(); this.layoutStage(); window.addEventListener('resize', ()=>this.layoutStage());
    this.stepMgr=new StepManager(this);
    this.panelMgr=new PanelManager();
    this.caseExporter = new CaseExporter(this);
    window.__editor__ = this;
  }
  layoutStage(){
    const outer = this.stageEl.parentElement;
    const cs = getComputedStyle(outer);
    const pt = parseFloat(cs.paddingTop)||0, pb = parseFloat(cs.paddingBottom)||0;
    const pl = parseFloat(cs.paddingLeft)||0, pr = parseFloat(cs.paddingRight)||0;
    const cw = outer.clientWidth - pl - pr; const ch = outer.clientHeight - pt - pb;
    const orient = this.stageEl.dataset.orient || 'landscape';
    const R = (orient==='portrait') ? (9/16) : (16/9);
    let w = Math.min(cw, Math.floor(ch * R)); let h = Math.floor(w / R);
    if(h > ch){ h = ch; w = Math.floor(h * R); } if(w > cw){ w = cw; h = Math.floor(w / R); }
    Object.assign(this.stageEl.style, { width: w + 'px', height: h + 'px' });
  }
  gridPct(){ const sx=this.stageEl.clientWidth, sy=this.stageEl.clientHeight; const g=this.grid; if(!g) return {x:0,y:0}; return { x: pxToPct(g, sx), y: pxToPct(g, sy) }; }
  initUI(){
    this.propForm.addEventListener('submit', (e)=> e.preventDefault()); this.propForm.setAttribute('novalidate','novalidate');
    $('#orientLandscape').addEventListener('change', ()=>{ if($('#orientLandscape').checked){ this.changeOrientation('landscape'); }});
    $('#orientPortrait').addEventListener('change', ()=>{ if($('#orientPortrait').checked){ this.changeOrientation('portrait'); }});
    const range=$('#gridRange'), val=$('#gridVal');
    const setGrid=(g)=>{ this.grid=Number(g); val.textContent = g==0?'off': g+"px"; this.stageEl.style.setProperty('--grid', (g||8)+"px"); this.stageEl.dataset.grid = g==0? 'off':'on'; };
    range.addEventListener('input', e=> setGrid(e.target.value)); setGrid(range.value);
    $('#subgridSwitch').addEventListener('change', e=>{ this.subgrid=e.target.checked; this.stageEl.dataset.subgrid = this.subgrid? 'on':'off'; });
    $('#setBg').addEventListener('click', ()=>{ const url=$('#bgUrl').value.trim(); this.setBackground(url); });
    this.stageEl.addEventListener('dragover', (e)=>{ e.preventDefault(); });
    this.stageEl.addEventListener('drop', (e)=>{ e.preventDefault(); const type=e.dataTransfer.getData('text/plain'); const el=this.createElementByType(type); if(!el) return; const p=clientToStage(e,this.stageEl); el.x = clamp(pxToPct(p.x - pctToPx(el.w, this.stageEl.clientWidth)/2, this.stageEl.clientWidth),0,100-el.w); el.y = clamp(pxToPct(p.y - pctToPx(el.h, this.stageEl.clientHeight)/2, this.stageEl.clientHeight),0,100-el.h); el.mount(this.canvas); this.elements.push(el); this.selectOnly(el); this.stepMgr.scheduleThumb(this.stepMgr.activeStep); });
    this.stageEl.addEventListener('mousedown', (e)=>{ if(e.target===this.stageEl || e.target===this.canvas || e.target.classList.contains('stage-size')){ if(!e.shiftKey&&!e.ctrlKey) this.clearSelection();
        const start=clientToStage(e,this.stageEl); const mq=$('#marquee'); mq.classList.remove('d-none'); Object.assign(mq.style,{left:start.x+'px',top:start.y+'px',width:0,height:0});
        const onMove=(ev)=>{ const p=clientToStage(ev,this.stageEl); const x=Math.min(start.x,p.x), y=Math.min(start.y,p.y), w=Math.abs(p.x-start.x), h=Math.abs(p.y-start.y); Object.assign(mq.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
          const rx={l:pxToPct(x,this.stageEl.clientWidth), t:pxToPct(y,this.stageEl.clientHeight), r:pxToPct(x+w,this.stageEl.clientWidth), b:pxToPct(y+h,this.stageEl.clientHeight)};
          this.elements.forEach(el=>{ const ex={l:el.x, t:el.y, r:el.x+el.w, b:el.y+el.h}; const hit= !(ex.l>rx.r||ex.r<rx.l||ex.t>rx.b||ex.b<rx.t); el.setSelected(hit); if(hit && !this.selected.includes(el)) this.selected.push(el); }); };
        const onUp=()=>{ mq.classList.add('d-none'); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)};
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      }});
    $('#btnExportHtml').addEventListener('click', ()=> this.caseExporter.exportCaseHTML());
    $$('[data-cmd]').forEach(b=> b.addEventListener('click', ()=> this.execCommand(b.dataset.cmd)) );
  }
  initKeyboard(){
    window.addEventListener('keydown',(e)=>{
      if(!this.selected.length) return;
      const isArrow=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key);
      if(isArrow || e.key==='Delete') e.preventDefault();
      const stepX = e.shiftKey ? (this.gridPct().x || pxToPct(8,this.stageEl.clientWidth)) : pxToPct(1, this.stageEl.clientWidth);
      const stepY = e.shiftKey ? (this.gridPct().y || pxToPct(8,this.stageEl.clientHeight)) : pxToPct(1, this.stageEl.clientHeight);
      const useSnap = e.shiftKey;
      switch(e.key){
        case 'Delete': this.deleteSelected(); break;
        case 'ArrowLeft':  this.nudge(-stepX, 0, {snap:useSnap}); break;
        case 'ArrowRight': this.nudge( stepX, 0, {snap:useSnap}); break;
        case 'ArrowUp':    this.nudge( 0, -stepY, {snap:useSnap}); break;
        case 'ArrowDown':  this.nudge( 0,  stepY, {snap:useSnap}); break;
      }
    }, true);
  }
  onElementChanged(){ if(!this.stepMgr?.activeStep) return; clearTimeout(this._thumbDebounce); this._thumbDebounce=setTimeout(()=> this.stepMgr.scheduleThumb(this.stepMgr.activeStep), 200); }
  nudge(dx,dy,opts={snap:false}){
    const grid=this.gridPct();
    this.selected.forEach(el=>{
      let nx=el.x+dx, ny=el.y+dy;
      if(opts.snap){ nx = snapTo(nx, grid.x); ny = snapTo(ny, grid.y); }
      nx = Math.max(0, Math.min(100-el.w, nx));
      ny = Math.max(0, Math.min(100-el.h, ny));
      el.x=nx; el.y=ny; el.applyTransform();
    });
    this.reflectSelection();
  }
  seedPalette(){
    const items=[ 
      {type:'label',title:'Etichetta di testo',klass:LabelElement}, 
      {type:'image',title:'Immagine',klass:ImageElement}, 
      {type:'textbox',title:'Casella di testo',klass:TextBoxElement}, 
      {type:'checkbox',title:'Checkbox',klass:CheckboxElement}, 
      {type:'radiogroup',title:'Opzioni (radio)',klass:RadioGroupElement} 
    ];
    this.registry=new Map(items.map(i=>[i.type,i]));
    items.forEach(i=>{ const b=document.createElement('button'); b.type='button'; b.className='btn btn-outline-light btn-sm w-100 text-start palette-item'; b.draggable=true; b.dataset.type=i.type; b.innerHTML=`<strong>${i.title}</strong><div class="small text-secondary">${i.type}</div>`; b.addEventListener('dragstart',(e)=> e.dataTransfer.setData('text/plain', i.type)); b.addEventListener('click', ()=>{ const el=this.createElementByType(i.type); el.mount(this.canvas); this.elements.push(el); this.selectOnly(el); this.stepMgr.scheduleThumb(this.stepMgr.activeStep); }); this.palette.appendChild(b); });
  }
  createElementByType(type){ const meta=this.registry.get(type); return meta? new meta.klass():null; }
  clearSelection(){ this.selected.forEach(e=>e.setSelected(false)); this.selected=[]; this.renderPropPanel(); }
  toggleSelect(el){ const i=this.selected.indexOf(el); if(i>=0){ this.selected.splice(i,1); el.setSelected(false);} else { this.selected.push(el); el.setSelected(true);} this.renderPropPanel(); }
  selectOnly(el){ this.clearSelection(); if(el){ this.selected=[el]; el.setSelected(true);} this.renderPropPanel(); }
  selectInclude(el){ if(!this.selected.includes(el)) this.selected.push(el); el.setSelected(true); this.renderPropPanel(); }
  reflectSelection(){ if(this.selected.length!==1) { this.renderPropPanel(); return; } const sel=this.selected[0]; $$('#propForm [data-prop]').forEach(inp=>{ const k=inp.dataset.prop; if(['x','y','w','h','z','fontSize'].includes(k)) inp.value= sel[k]; if(k==='lockRatio') inp.checked=!!sel.lockRatio; }); }
  deleteSelected(){ this.selected.forEach(s=>{ s.dom.remove(); this.elements=this.elements.filter(e=>e!==s); }); this.clearSelection(); this.stepMgr.scheduleThumb(this.stepMgr.activeStep); }
  renderPropPanel(){ const f=this.propForm; f.innerHTML='';
    if(!this.selected.length){
      const step=this.stepMgr?.activeStep; if(!step){ f.innerHTML='<div class="text-secondary small">Nessuno step attivo</div>'; return; }
      const wrap=document.createElement('div');
      wrap.innerHTML=`<div class="mb-2"><label class="form-label small">Titolo step</label><input id="stepName" class="form-control form-control-sm" type="text" value="${step.name}"></div>
      <div class="mb-2"><label class="form-label small">Orientamento</label><select id="stepOrient" class="form-select form-select-sm"><option value="landscape">16:9</option><option value="portrait">9:16</option></select></div>
      <div class="mb-2"><label class="form-label small">Sfondo (URL)</label><input id="stepBg" class="form-control form-control-sm" type="url" value="${step.bgUrl||''}" placeholder="https://…/img.jpg"></div>`;
      f.appendChild(wrap);
      $('#stepOrient',wrap).value = step.orient;
      $('#stepName',wrap).addEventListener('input', e=>{ step.name=e.target.value||step.name; this.stepMgr.render(); });
      $('#stepOrient',wrap).addEventListener('change', e=>{ step.orient=e.target.value; this.changeOrientation(step.orient); this.stepMgr.render(); });
      $('#stepBg',wrap).addEventListener('change', e=>{ step.bgUrl=e.target.value.trim(); this.setBackground(step.bgUrl); this.stepMgr.scheduleThumb(step); });
      return;
    }
    if(this.selected.length>1){ f.innerHTML='<div class="text-secondary small">Selezionati: '+this.selected.length+' elementi</div>'; return; }
    const el=this.selected[0]; const schema=el.getPropSchema();
    const header=document.createElement('div'); header.className='d-flex justify-content-between align-items-center mb-1'; header.innerHTML=`<div><span class="badge text-bg-primary">${el.type}</span> <span class="code text-secondary">#${el.id}</span></div>
    <div class="btn-group btn-group-sm"><button type="button" class="btn btn-outline-danger" id="btnDelete">Elimina</button></div>`; f.appendChild(header); $('#btnDelete',header).addEventListener('click',(e)=>{ e.preventDefault(); this.selectOnly(el); this.deleteSelected(); });
    schema.forEach(def=>{ const row=document.createElement('div'); row.className='mb-2'; const id=Editor.uid('prop'); const label=document.createElement('label'); label.className='form-label small'; label.htmlFor=id; label.textContent=def.label; let input;
      if(def.type==='textarea'){ input=document.createElement('textarea'); input.className='form-control form-control-sm'; input.rows=2; }
      else if(def.type==='select'){ input=document.createElement('select'); input.className='form-select form-select-sm'; def.options.forEach(([v,lab])=>{ const o=document.createElement('option'); o.value=v; o.textContent=lab; input.appendChild(o); }); }
      else if(def.type==='checkbox'){ input=document.createElement('input'); input.type='checkbox'; input.className='form-check-input ms-1'; label.appendChild(input); row.appendChild(label); input.id=id; input.dataset.prop=def.key; input.checked=!!el[def.key]; input.addEventListener('input', ()=>{ el[def.key]=input.checked; el.readProps?.(); this.stepMgr.scheduleThumb(this.stepMgr.activeStep); }); f.appendChild(row); return; }
      else{ input=document.createElement('input'); input.type=def.type||'text'; input.className='form-control form-control-sm'; if(def.min!=null) input.min=def.min; }
      input.id=id; input.dataset.prop=def.key; let v=el[def.key]; if(def.key==='options') v=el.options.join(';'); if(def.type!=='checkbox') input.value = v ?? '';
      input.addEventListener('input', ()=>{ let val=input.value; if(['x','y','w','h','fontSize','z'].includes(def.key)) val=Number(val||0); if(def.key==='options') val=val.split(';').map(s=>s.trim()).filter(Boolean); if(def.key==='z') val=Math.max(0,val); el[def.key]=val; if(['x','y','w','h','z'].includes(def.key)) el.applyTransform(); else el.readProps?.(); this.stepMgr.scheduleThumb(this.stepMgr.activeStep); });
      row.appendChild(label); row.appendChild(input); f.appendChild(row); });
  }
  execCommand(cmd){ const sel=[...this.selected]; if(sel.length<1) return; const bbox={ minX:Math.min(...sel.map(e=>e.x)), maxX:Math.max(...sel.map(e=>e.x+e.w)), minY:Math.min(...sel.map(e=>e.y)), maxY:Math.max(...sel.map(e=>e.y+e.h)) };
    const centerX=(bbox.minX+bbox.maxX)/2, centerY=(bbox.minY+bbox.maxY)/2;
    switch(cmd){
      case 'align-left': sel.forEach(e=>{ e.x=bbox.minX; e.applyTransform();}); break;
      case 'align-right': sel.forEach(e=>{ e.x=bbox.maxX - e.w; e.applyTransform();}); break;
      case 'align-hcenter': sel.forEach(e=>{ e.x = centerX - e.w/2; e.applyTransform();}); break;
      case 'align-top': sel.forEach(e=>{ e.y=bbox.minY; e.applyTransform();}); break;
      case 'align-bottom': sel.forEach(e=>{ e.y=bbox.maxY - e.h; e.applyTransform();}); break;
      case 'align-vcenter': sel.forEach(e=>{ e.y = centerY - e.h/2; e.applyTransform();}); break;
      case 'dist-h': this.distribute(sel,'x','w'); break;
      case 'dist-v': this.distribute(sel,'y','h'); break;
      case 'front': sel.forEach(e=>{ e.z = Math.max(...this.elements.map(x=>x.z))+1; e.applyTransform();}); break;
      case 'back': sel.forEach(e=>{ e.z = Math.max(0, (e.z|0) - 1); e.applyTransform();}); break;
    }
    this.reflectSelection(); this.stepMgr.scheduleThumb(this.stepMgr.activeStep);
  }
  distribute(sel, axis, sizeKey){ sel.sort((a,b)=> a[axis]-b[axis]); const first=sel[0], last=sel[sel.length-1]; const start=first[axis], end=last[axis] + last[sizeKey]; const total=sel.reduce((s,e)=> s+e[sizeKey], 0); const gaps=sel.length-1; const space=(end-start-total)/gaps; let pos=start; sel.forEach((e,i)=>{ if(i===0) { pos=e[axis]+e[sizeKey]; return; } e[axis]=pos; e.applyTransform(); pos += e[sizeKey] + space; }); }
  exportHTML(){
    const orient=this.stageEl.dataset.orient; const clone=this.canvas.cloneNode(true);
    $$('.el', clone).forEach(n=>{ n.classList.remove('selected'); $$('.handles',n).forEach(h=>h.remove()); n.removeAttribute('data-type'); });
    const wrapper=document.createElement('div'); wrapper.style.position='relative'; wrapper.style.width='100%'; wrapper.style.aspectRatio = orient==='portrait'? '9/16':'16/9'; wrapper.appendChild(clone);
    const html = wrapper.outerHTML.trim(); const blob=new Blob([html],{type:'text/html;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='step.html'; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }
  loadStep(step){
    this.elements.forEach(e=> e.unmount()); this.clearSelection();
    this.elements = step.items;
    this.changeOrientation(step.orient, {syncToolbar:true, suppressRender:true});
    this.setBackground(step.bgUrl, {suppressThumb:true});
    this.canvas.innerHTML='';
    this.elements.forEach(e=> e.mount(this.canvas));
    this.layoutStage();
    this.renderPropPanel();
  }
  changeOrientation(orient, opts={}){
    this.stageEl.dataset.orient = orient==='portrait' ? 'portrait' : 'landscape';
    if(opts.syncToolbar){ $('#orientLandscape').checked = orient!=='portrait'; $('#orientPortrait').checked = orient==='portrait'; }
    this.layoutStage();
    if(this.stepMgr?.activeStep){ this.stepMgr.activeStep.orient=this.stageEl.dataset.orient; if(!opts.suppressRender) this.stepMgr.render(); }
  }
  setBackground(url, opts={}){
    this.canvas.style.background = url? `center/cover no-repeat url('${url}')` : '';
    if(this.stepMgr?.activeStep){ this.stepMgr.activeStep.bgUrl=url||''; if(!opts.suppressThumb) this.stepMgr.scheduleThumb(this.stepMgr.activeStep); }
  }
}