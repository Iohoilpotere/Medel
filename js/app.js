
import { $, download } from './utils/dom.js';
import { EventBus } from './core/eventbus.js';
import { registry, loadModules } from './core/registry.js';
import { CommandManager } from './core/command-manager.js';
import { AddElementCommand } from './core/commands/add-element.js';
import { ThemeFactory } from './themes/factory.js';
import { Stage } from './stage/stage.js';
import { exportProject } from './export/exporter.js';
import { ElementsPanel } from './panels/elements-panel.js';
import { StepsPanel } from './panels/steps-panel.js';
import { PropertiesPanel } from './panels/properties-panel.js';
import { InteractivityPanel } from './panels/interactivity-panel.js';
import { IndicatorsPanel } from './panels/indicators-panel.js';
import { PresetsPanel } from './panels/presets-panel.js';
import { IndicatorsStore } from './models/indicators-store.js';
import { FlagsStore } from './models/flags-store.js';
import { UpdateStageBgCommand } from './core/commands/update-stage-bg.js';
import { PositionSizeBatchCommand } from './core/commands/position-size-batch.js';
import { CropTool } from './tools/crop-tool.js';

export class App{
  constructor(){
    this.bus = new EventBus();
    this.cmd = new CommandManager();
    this.theme = new ThemeFactory();
    // Root can contain steps and categories
    this.project = { steps:[{type:'step', title:'Step 1', aspect:'16:9', bgUrl:'', elements:[]}], indicators:[] };
    this.currentStepPath = [0];
    this.clipboard = null;
    this.counters = {};
    this._loadingStep = false;
  }

  get currentStep(){
    let n = {children:this.project.steps};
    for(const i of this.currentStepPath){
      if(!n) return null;
      const arr = (n.children||n.steps);
      if(!arr || i<0 || i>=arr.length) return null;
      n = arr[i];
    }
    return (n && n.type==='step') ? n : null;
  }
  _getNodeByPath(path){
    let n={children:this.project.steps};
    for(const i of path){ if(!n) return null; const arr=(n.children||n.steps); if(!arr||i<0||i>=arr.length) return null; n = arr[i]; }
    return n;
  }
  _getParentByPath(path){
    let n={children:this.project.steps};
    for(const i of path.slice(0,-1)){ if(!n) return null; const arr=(n.children||n.steps); if(!arr||i<0||i>=arr.length) return null; n = arr[i]; }
    return n;
  }

  _getElementCtor(type){ return registry.elements.get(type); }
  _makeName(type){ this.counters[type]=(this.counters[type]||0)+1; return `${type}${this.counters[type]}`; }

  async init(){
    await loadModules();
    this.theme.set('dark');
    const host = $('#stageHost');
    this.stage = new Stage(host, {gridSize:16, aspect:'16:9'});
    this.stage.bus.on('elements-changed', ()=>{ this._captureState(); this.propertiesPanel?.render(); this.stepsPanel?.render(); });
    this.stage.bus.on('selection-changed', ()=> { this.propertiesPanel.render(); this.interactivityPanel?.render(); });
    this.stage.bus.on('interaction', (evt)=>{ this.cmd.execute(new PositionSizeBatchCommand(evt.before, evt.after)); this._renderHistory(); });
    this.cmd.onChange(()=>{ this._captureState(); this._renderHistory(); this.stepsPanel?.render(); });
    this._wireUi();
    this.elementsPanel = new ElementsPanel(this);
    this.stepsPanel = new StepsPanel(this);
    this.flags = new FlagsStore(this.project);
    this.indicators = new IndicatorsStore(this.project);
    this.indicatorsPanel = new IndicatorsPanel(this);
    this.presetsPanel = new PresetsPanel(this);
    this.propertiesPanel = new PropertiesPanel(this);
    this.interactivityPanel = new InteractivityPanel(this);
    this.cropTool = new CropTool(this);
    this._seedSample();
    this._renderHistory();
  }

  
  _loadProject(data){
    try{
      if(!data || !Array.isArray(data.steps)) throw new Error('JSON mancante della chiave "steps"');
    }catch(err){
      alert('File JSON non valido: '+err.message);
      return;
    }
    // Reset history
    this.cmd = new CommandManager();
    this.cmd.onChange(()=>{ this._captureState(); this._renderHistory(); this.stepsPanel?.render(); });
    // Apply project and open first step
    this.project = Object.assign({indicators:[], flags:[], indicatorsVisible:true, flagsVisible:true}, data);
    this.flags = new FlagsStore(this.project);
    this.indicators = new IndicatorsStore(this.project);
    this.indicatorsPanel?.render();
    this.currentStepPath = [];
    this._ensureValidCurrentStep();
    this.stepsPanel?.render();
    this.propertiesPanel?.render();
  }

_seedSample(){
    const label = registry.createElement('label', {x:120,y:160,text:'Etichetta',fontSize:32,color:'#ff0000'});
    label.name = this._makeName('label');
    this.cmd.execute(new AddElementCommand(this.stage,label));
    this._captureState();
  }

  _wireUi(){
    // Left tabs
    const leftTabs = document.querySelectorAll('.leftpanes .tabstrip button');
    const leftBodies = document.querySelectorAll('.leftpanes .pane-body');
    this.activeLeftTab = this.activeLeftTab || 'elements';
    leftTabs.forEach(btn=> btn.addEventListener('click', ()=>{
      leftTabs.forEach(b=>b.classList.remove('active'));
      leftBodies.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      this.activeLeftTab = btn.dataset.tab;
      const id = '#'+btn.dataset.tab+'Pane';
      const pane = document.querySelector(id);
      if(pane) pane.classList.add('active');
      this.propertiesPanel?.render();
    }));
// Right tabs
    const rightTabs = document.querySelectorAll('#rightTabs button');
    const rightBodies = document.querySelectorAll('aside.rightpane .pane-body');
    rightTabs.forEach(btn=> btn.addEventListener('click', ()=>{
      rightTabs.forEach(b=>b.classList.remove('active'));
      rightBodies.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      let id = '#propsPane';
      if(btn.dataset.tab==='history') id = '#historyPane';
      else if(btn.dataset.tab==='interactivity') id = '#interactivityPane';
      document.querySelector(id).classList.add('active');
      if(id==='#interactivityPane'){ this.interactivityPanel?.render(); }
    }));

    const aspectSel = $('#aspectSelect');
    aspectSel.addEventListener('change', ()=> this.stage.setAspect(aspectSel.value));
    const themeSel = $('#themeSelect'); themeSel.addEventListener('change',()=> this.theme.set(themeSel.value));
    const gridSize = $('#gridSize'); const gridLabel = $('#gridSizeLabel');
    const gridFine = $('#gridFine');
    const bg = $('#bgUrl'), bgBtn = $('#setBgBtn');
    const exportBtn = $('#exportBtn');
    const undoBtn = $('#undoBtn'), redoBtn = $('#redoBtn');

    const zoomHud = document.getElementById('zoomHud');
    const zoomRange = document.getElementById('zoomRange');
    const updateHud = ()=>{ zoomHud.textContent = Math.round(this.stage.zoom*100)+'%'; zoomRange.value = Math.round(this.stage.zoom*100); };
    this.stage.bus.on('zoom-changed', updateHud); updateHud();
    zoomRange.addEventListener('input', ()=>{ this.stage.setZoom(parseInt(zoomRange.value)/100); });

    gridSize.addEventListener('input', ()=>{ this.stage.setGrid(parseInt(gridSize.value)); gridLabel.textContent = gridSize.value + 'px'; });
    gridFine.addEventListener('change', ()=> this.stage.setFineGrid(gridFine.checked));
    bgBtn.addEventListener('click', ()=> this.cmd.execute(new UpdateStageBgCommand(this.stage, bg.value.trim())));
    exportBtn.addEventListener('click', ()=>{ this._captureState(); exportProject(this.project); });
    const saveJsonBtn = $('#saveJsonBtn');
    const importJsonBtn = $('#importJsonBtn');
    const importJsonFile = $('#importJsonFile');
    if(saveJsonBtn){ saveJsonBtn.addEventListener('click', ()=>{ this._captureState(); const name = (this.project.title||'progetto')+'.json'; download(name, JSON.stringify(this.project, null, 2)); }); }
    if(importJsonBtn && importJsonFile){
      importJsonBtn.addEventListener('click', ()=> importJsonFile.click());
      importJsonFile.addEventListener('change', (e)=>{
        const file = e.target.files && e.target.files[0]; if(!file) return;
        const fr = new FileReader();
        fr.onload = ()=>{
          try{
            const data = JSON.parse(fr.result);
            this._loadProject(data);
          }catch(err){ alert('File JSON non valido: '+err.message); }
        };
        fr.readAsText(file);
        importJsonFile.value = '';
      });
    }
    undoBtn.addEventListener('click', ()=> this.cmd.undo());
    redoBtn.addEventListener('click', ()=> this.cmd.redo());
    this.stage.onElementDelete = (el)=>{ this.stage.removeElement(el); this.stage.clearSelection(); };

    window.addEventListener('keydown', async (e)=>{
      const tag = (document.activeElement?.tagName||'').toUpperCase();
      const inField = /(INPUT|TEXTAREA|SELECT)/.test(tag) || (document.activeElement?.isContentEditable===true);
      // Undo/Redo: allow native inside fields; use ours only when not typing in fields
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z' && !inField){ e.preventDefault(); this.cmd.undo(); return; }
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='y' && !inField){ e.preventDefault(); this.cmd.redo(); return; }
      // Clipboard shortcuts only when NOT in a field
      if(inField) return;
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='c'){ e.preventDefault(); this._captureState(); this.clipboard = this.stage.selected.map(el=>el.toJSON()); return; }
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='x'){ e.preventDefault(); this._captureState(); this.clipboard = this.stage.selected.map(el=>el.toJSON()); for(const el of this.stage.selected) this.stage.removeElement(el); this.stage.clearSelection(); return; }
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='v'){ e.preventDefault(); if(this.clipboard){ const created=[]; for(const data of this.clipboard){ const Cls = this._getElementCtor(data.type); if(Cls){ const el = Cls.fromJSON({...data, x:data.x+10, y:data.y+10}); el.name = this._makeName(el.constructor.type); this.stage.addElement(el); created.push(el);} } if(created.length) this.stage.setSelection(created); } return; }
      if(e.key==='Delete' && !inField){ for(const el of this.stage.selected) this.stage.removeElement(el); this.stage.clearSelection(); }
    });

    // drag-drop new element
    this.stage.el.addEventListener('dragover', e=> e.preventDefault());
    this.stage.el.addEventListener('drop', (e)=>{
      e.preventDefault();
      const type = e.dataTransfer.getData('text/element-type');
      if(!type) return;
      const rect = this.stage.el.getBoundingClientRect();
      const x = (e.clientX - rect.left)/this.stage.zoom;
      const y = (e.clientY - rect.top)/this.stage.zoom;
      this.createElement(type, {x,y});
    });

    document.getElementById('alignToolbar').addEventListener('click',(e)=>{
      if(e.target.tagName!=='BUTTON') return;
      const cmd = e.target.dataset.cmd; this._doAlign(cmd);
    });
  }

  _renderHistory(){
    const {list, cursor} = this.cmd.getTimeline();
    const ul = document.getElementById('historyList');
    ul.innerHTML = '';
    list.forEach((cmd, idx)=>{
      const li = document.createElement('li');
      li.className='history-item' + (idx===cursor ? ' active' : '');
      const label = (cmd.label?cmd.label():cmd.constructor.name);
      li.innerHTML = '<div class="title"><span class="badge">'+(idx===cursor?'●':'○')+'</span><span>'+label+'</span></div>';
      li.addEventListener('click', ()=>{ this.cmd.jumpTo(idx); this._captureState(); this.propertiesPanel?.render(); this.stepsPanel.render(); this.stepsPanel.render(); });
      ul.appendChild(li);
    });
  }

  _captureState(){
    if(this._loadingStep) return;
    const step = this.currentStep;
    if(!step) return;
    step.elements = this.stage.elements.map(e => e.toJSON());
    step.aspect = this.stage.aspect;
    step.bgUrl = this.stage.bgUrl;
  }


  _doAlign(cmd){
    const sel = this.stage.selected.slice();
    if(sel.length<2) return;
    // Snapshot before
    const before = sel.map(el => ({el, x:el.x, y:el.y, w:el.w, h:el.h}));
    // Compute after positions (apply on clones)
    const bounds = sel.map(s=> ({x:s.x, y:s.y, w:s.w, h:s.h}) );
    const minX = Math.min(...bounds.map(b=>b.x));
    const maxX = Math.max(...bounds.map(b=>b.x + b.w));
    const midX = (minX+maxX)/2;
    const minY = Math.min(...bounds.map(b=>b.y));
    const maxY = Math.max(...bounds.map(b=>b.y + b.h));
    const midY = (minY+maxY)/2;
    // Build map for results
    const res = new Map();
    sel.forEach((s)=>{ res.set(s, {x:s.x, y:s.y, w:s.w, h:s.h}); });
    const applyXY = (s, x, y)=>{ const it = res.get(s); it.x = x; it.y = y; };

    if(cmd==='align-left') sel.forEach(s=> applyXY(s, minX, s.y));
    if(cmd==='align-right') sel.forEach(s=> applyXY(s, maxX - s.w, s.y));
    if(cmd==='align-center-x') sel.forEach(s=> applyXY(s, midX - s.w/2, s.y));
    if(cmd==='align-top') sel.forEach(s=> applyXY(s, s.x, minY));
    if(cmd==='align-bottom') sel.forEach(s=> applyXY(s, s.x, maxY - s.h));
    if(cmd==='align-center-y') sel.forEach(s=> applyXY(s, s.x, midY - s.h/2));

    if(cmd==='distribute-h'){
      const sorted = sel.slice().sort((a,b)=>a.x-b.x);
      const totalW = sorted.reduce((sum,s)=>sum+s.w,0);
      const space = (maxX-minX-totalW)/(sorted.length-1);
      let x = minX;
      for(const s of sorted){ applyXY(s, x, s.y); x += s.w + space; }
    }

    if(cmd==='distribute-v'){
      const sorted = sel.slice().sort((a,b)=>a.y-b.y);
      const totalH = sorted.reduce((sum,s)=>sum+s.h,0);
      const space = (maxY-minY-totalH)/(sorted.length-1);
      let y = minY;
      for(const s of sorted){ applyXY(s, s.x, y); y += s.h + space; }
    }

    const after = sel.map(el => ({el, ...(res.get(el))}));
    this.cmd.execute(new PositionSizeBatchCommand(before, after, cmd.includes('align')?'move':'edit'));
  }


  createElement(type, pos={}){
    const snap = (v)=>{ const g=this.stage.gridSize; return g>0? Math.round((v||0)/g)*g : (v||0); };
    const el = registry.createElement(type, {...pos}); el.name = this._makeName(type);
    el.x = snap(el.x); el.y = snap(el.y); el.w = Math.max(this.stage.gridSize, snap(el.w||180)); el.h = Math.max(this.stage.gridSize, snap(el.h||40));
    this.cmd.execute(new AddElementCommand(this.stage, el));
    this.stage.setSelection([el]);
    this._captureState();
  }

  addStep(){ 
    (this.project.steps||(this.project.steps=[])).push({type:'step', title:'Nuovo step', aspect:'16:9', bgUrl:'', elements:[]}); 
    this.stepsPanel.render(); 
  }
  addCategory(){ 
    (this.project.steps||(this.project.steps=[])).push({type:'category', title:'Categoria', children:[], collapsed:false}); 
    this.stepsPanel.render(); 
  }
  removeStep(index){ 
    // backwards-compat (not used by nested UI)
    this.project.steps.splice(index,1); 
    this.stepsPanel.render(); 
  }
  setCurrentStep(i){ this.setCurrentStepByPath([i]); }

  setCurrentStepByPath(path){
    this._loadingStep = true;
    this.currentStepPath = path ? path.slice() : [];
    let step = this._getNodeByPath(this.currentStepPath);
    if(!step || step.type!=='step'){
      this._ensureValidCurrentStep();
      step = this.currentStep;
      if(!step) return;
    }
    this.stage.setAspect(step.aspect || '16:9');
    this.stage.setBackground(step.bgUrl || '');
    [...this.stage.elements].forEach(e=> this.stage.removeElement(e));
    for(const e of step.elements || []){
      const Cls = registry.elements.get(e.type);
      if(Cls){ const el = Cls.fromJSON(e); el.name = this._makeName(el.constructor.type); this.stage.addElement(el); }
    }
    this.propertiesPanel?.render(); this.stepsPanel.render();
    this._loadingStep = false;
  }

  _ensureValidCurrentStep(){
    // Find first step in tree (root or nested)
    function findFirstStep(nodes, path=[]){
      for(let i=0;i<nodes.length;i++){
        const n = nodes[i];
        const p = path.concat(i);
        if(n.type==='step') return {node:n, path:p};
        if(n.type==='category' && n.children){ const r = findFirstStep(n.children, p); if(r) return r; }
      }
      return null;
    }
    const root = this.project.steps || [];
    const found = findFirstStep(root, []);
    if(found){ this.setCurrentStepByPath(found.path); }
    else{
      // clear stage
      [...this.stage.elements].forEach(e=> this.stage.removeElement(e));
      this.propertiesPanel?.render(); this.stepsPanel.render();
    this._loadingStep = false;
    }
  }

  removeStepByPath(path){
    const parent = this._getParentByPath(path);
    if(!parent) return;
    const arr = (parent.children||parent.steps);
    arr.splice(path[path.length-1],1);
    this.stepsPanel.render();
    // if removed current step
    if(JSON.stringify(this.currentStepPath)===JSON.stringify(path)){ this._ensureValidCurrentStep(); }
  }


  addElementFromPreset(data){
    const Cls = registry.elements.get(data?.type);
    if(!Cls) throw new Error('Tipo elemento sconosciuto: '+data?.type);
    const clone = JSON.parse(JSON.stringify(data));
    const el = Cls.fromJSON(clone);
    el.name = this._makeName(el.constructor.type);
    this.cmd.execute(new AddElementCommand(this.stage, el));
    this.stage.setSelection([el]);
    this._captureState();
  }

  addStepFromPreset(stepData, presetName){
    if(!stepData || stepData.type !== 'step') throw new Error('Preset step non valido');
    const newStep = JSON.parse(JSON.stringify(stepData));
    newStep.title = presetName || newStep.title || 'Nuovo step';
    // Insert after current step path
    const parent = this._getParentByPath(this.currentStepPath);
    const arr = (parent.children || parent.steps);
    if(!Array.isArray(arr)) throw new Error('Struttura steps non valida');
    const curIdx = this.currentStepPath[this.currentStepPath.length-1] ?? -1;
    const insertIdx = (curIdx>=0 ? curIdx+1 : arr.length);
    arr.splice(insertIdx, 0, newStep);
    // Select it
    const newPath = this.currentStepPath.slice(0, -1).concat(insertIdx);
    this.setCurrentStepByPath(newPath);
    this.stepsPanel.render();
  }
}
