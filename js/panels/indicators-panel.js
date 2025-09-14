import { h, $ } from '../utils/dom.js';
export class IndicatorsPanel{
  constructor(app){
    this.app = app;
    this.list = $('#indicatorsList');
    this.addBtn = $('#addIndicatorBtn');
    this.delBtn = $('#delIndicatorBtn');
    this._wired=false;
    this._wire();
    this.render();
  }
  _wire(){
    if(this._wired) return; this._wired = true;
    this.addBtn?.addEventListener('click', ()=>{
      const ind = this.app.indicators.add({ name:'Indicatore '+(this.app.indicators.items.length+1) });
      this.render(); this.app.propertiesPanel?.render();
    });
    this.delBtn?.addEventListener('click', ()=>{
      const sel = this.app.indicators.selected; if(!sel) return;
      this.app.indicators.remove(sel.id); this.render(); this.app.propertiesPanel?.render();
    });
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

      btn.addEventListener('click', ()=>{ store.select(ind.id); this.render(); this.app.propertiesPanel?.render(); });

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
  }
}
