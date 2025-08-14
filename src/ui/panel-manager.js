import DockPanel from './dock-panel.js';
export default class PanelManager{
  constructor(){ this.panels=[]; document.querySelectorAll('.dock-panel').forEach(el=> this.panels.push(new DockPanel(el, this))); }
  ensureExclusive(changed){
    if(changed.side!=='left') return;
    if(changed.root.dataset.collapsed==='0'){
      this.panels.forEach(p=>{ if(p!==changed && p.side==='left'){ p.root.dataset.collapsed='1'; p.handle.setAttribute('aria-expanded','false'); } });
    } else {
      const anyOpen=this.panels.some(p=>p.side==='left' && p.root.dataset.collapsed==='0');
      if(!anyOpen){ const firstLeft=this.panels.find(p=>p.side==='left'); if(firstLeft){ firstLeft.root.dataset.collapsed='0'; firstLeft.handle.setAttribute('aria-expanded','true'); } }
    }
  }
}