import { h, $ } from '../utils/dom.js';
export class IndicatorsPanel{
  constructor(app){
    this.app = app;
    this.list = $('#indicatorsList');
    this.addBtn = $('#addIndicatorBtn');
    this.delBtn = $('#delIndicatorBtn');
    this._wired=false;
    // Flags UI refs
    this.flagsList = $('#flagsList');
    this.addFlagBtn = $('#addFlagBtn');
    this.delFlagBtn = $('#delFlagBtn');
    this.flagsVisibleToggle = $('#flagsVisibleToggle');
    this._wire();
    this.render();
  }
  _wire(){
    if(this._wired) return; this._wired = true;
    // Indicators add/remove
    this.addBtn?.addEventListener('click', ()=>{
      const ind = this.app.indicators.add({ name:'Indicatore '+(this.app.indicators.items.length+1) });
      this.render(); this.app.propertiesPanel?.render();
    });
    this.delBtn?.addEventListener('click', ()=>{
      const sel = this.app.indicators.selected; if(!sel) return;
      this.app.indicators.remove(sel.id); this.render(); this.app.propertiesPanel?.render();
    });
    // Flags add/remove
    this.addFlagBtn?.addEventListener('click', ()=>{
      const f = this.app.flags.add({ name:'Flag '+(this.app.flags.items.length+1) });
      this.render(); this.app.propertiesPanel?.render();
      // Keep visibility toggle in sync
      if(this.flagsVisibleToggle) this.flagsVisibleToggle.checked = this.app.flags.visible;
    });
    this.delFlagBtn?.addEventListener('click', ()=>{
      const sel = this.app.flags.selected;
      if(sel){ this.app.flags.remove(sel.id); this.render(); this.app.propertiesPanel?.render(); }
    });
    if(this.flagsVisibleToggle){
      this.flagsVisibleToggle.checked = this.app.flags.visible;
      this.flagsVisibleToggle.addEventListener('change', ()=>{
        this.app.flags.setVisible(!!this.flagsVisibleToggle.checked);
      });
    }
  }
  render(){
    if(!this.list) return;
    const store = this.app.indicators; const items = store.items;
    this.list.innerHTML = '';
    items.forEach(ind=>{
      const li = document.createElement('li');
      li.className = 'indicator-card' + (store.selected && store.selected.id===ind.id ? ' active':'');

      const btn = document.createElement('button');
      btn.type='button';
      btn.className='indicator-card-btn' + (store.selected && store.selected.id===ind.id ? ' active':'');

      btn.addEventListener('click', ()=>{ store.select(ind.id); this.app.flags?.select(null); this.render(); this.app.propertiesPanel?.render(); });

      const avatar = document.createElement('div');
      avatar.className='indicator-avatar';
      if(ind.image){ avatar.style.backgroundImage = `url("${ind.image}")`; }
      else {
        const initial = document.createElement('span'); initial.className='indicator-avatar-initial';
        initial.textContent = (ind.name||'?').trim().charAt(0).toUpperCase() || '?';
        avatar.appendChild(initial);
      }

      const name = document.createElement('div');
      name.className='indicator-name';
      name.textContent = ind.name || '(senza nome)';

      btn.appendChild(avatar); btn.appendChild(name);
      li.appendChild(btn); this.list.appendChild(li);
    });
    // Render flags list
    if(this.flagsList){
      this.flagsList.innerHTML='';
      const items = this.app.flags?.items || [];
      const selectedId = (this.app.flags && this.app.flags.selectedId) || null;
      items.forEach(f => {
        const li = document.createElement('li');
        li.className = 'indicator-card' + (selectedId===f.id?' active':'');
        const btn = document.createElement('button');
        btn.type='button';
        btn.className = 'indicator-card-btn' + (selectedId===f.id?' active':'');
        btn.addEventListener('click', ()=>{ this.app.flags.select(f.id); this.app.indicators?.select(null); this.render(); this.app.propertiesPanel?.render(); });

        const avatar = document.createElement('div'); avatar.className='indicator-avatar';
        if(f.image){ avatar.style.backgroundImage = `url("${f.image}")`; }
        else{
          const initial = document.createElement('span'); initial.className='indicator-avatar-initial';
          initial.textContent = (f.name||'?').trim().charAt(0).toUpperCase() || '?';
          avatar.appendChild(initial);
        }

        const name = document.createElement('div'); name.className='indicator-name';
        name.textContent = f.name || '(senza nome)';

        btn.appendChild(avatar); btn.appendChild(name);
        li.appendChild(btn); this.flagsList.appendChild(li);
      });
    }
  }
}
