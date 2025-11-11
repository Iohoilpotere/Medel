
import { h, $ } from '../utils/dom.js';
import { registry } from '../core/registry.js';

const ICONS = {
  label:'🔤', textbox:'✏️', image:'🖼️',
  checkbox:'☑️', checkboxgroup:'✅', radiogroup:'🔘',
  pairs:'🧾', pdf:'📄'
};


const LS_STEPS = 'medel_presets_steps';
const LS_ELEMS = 'medel_presets_elements';

function readPresets(key){
  try{ return JSON.parse(localStorage.getItem(key)||'[]') || []; }catch(_){ return []; }
}
function writePresets(key, arr){
  try{ localStorage.setItem(key, JSON.stringify(arr)); }catch(_){ /* ignore quota errors */ }
}
function makeId(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function deepClone(o){ return JSON.parse(JSON.stringify(o)); }

export class PresetsPanel{
  constructor(app){
    this.app = app;
    this.root = $('#presetsPane');
    this.state = { qSteps:'', qElems:'' };
    this._build();
    this._bind();
    this.render();
  }

  _build(){
    this.root.innerHTML = '';

    const inner = h('div', {class:'presets-inner'});
    this.root.append(inner);

    // STEPS category
    const stepsWrap = h('div', {class:'preset-group'});
    const stepsHeader = h('div', {class:'preset-header'},
      h('strong', {}, 'Steps'),
      (this.saveStepBtn = h('button', {id:'saveStepPresetBtn', title:'Salva preset step'}, 'Salva'))
    );
    const stepsSearch = h('input', {type:'search', placeholder:'Cerca preset step...', id:'stepsSearch'});
    this.stepsList = h('ul', {class:'presets-list'});
    const stepsSearchWrap = h('div', {class:'search'});
    stepsSearchWrap.append(stepsSearch, h('span', {class:'icon', 'aria-hidden':'true'}, '🔍'));
    stepsWrap.append(stepsHeader, stepsSearchWrap, this.stepsList);

    // ELEMENTS category
    const elemsWrap = h('div', {class:'preset-group'});
    const elemsHeader = h('div', {class:'preset-header'},
      h('strong', {}, 'Elementi'),
      (this.saveElemBtn = h('button', {id:'saveElemPresetBtn', title:'Salva preset elemento'}, 'Salva'))
    );
    const elemsSearch = h('input', {type:'search', placeholder:'Cerca preset elemento...', id:'elemsSearch'});
    this.elemsList = h('ul', {class:'presets-list'});
    const elemsSearchWrap = h('div', {class:'search'});
    elemsSearchWrap.append(elemsSearch, h('span', {class:'icon', 'aria-hidden':'true'}, '🔍'));
    elemsWrap.append(elemsHeader, elemsSearchWrap, this.elemsList);

    inner.append(stepsWrap, h('hr', {class:'divider'}), elemsWrap);
  }

  _bind(){
    // Save step preset
    this.saveStepBtn.addEventListener('click', ()=>{
      const name = (prompt('Nome del preset step:')||'').trim();
      if(!name) return;
      // ensure current step snapshot is up-to-date
      this.app._captureState();
      const step = this.app.currentStep || {type:'step', title:name, aspect:'16:9', bgUrl:'', elements:[]};
      // clone only required fields
      const data = {
        type:'step',
        title: step.title,
        aspect: step.aspect || '16:9',
        bgUrl: step.bgUrl || '',
        elements: deepClone(step.elements||[])
      };
      const list = readPresets(LS_STEPS);
      list.push({ id: makeId(), name, data, createdAt: Date.now() });
      writePresets(LS_STEPS, list);
      this.render();
    });

    // Save element preset (only if one is selected)
    const updateElemBtn = ()=>{
      const hasSel = Array.isArray(this.app.stage?.selected) && this.app.stage.selected.length>0;
      this.saveElemBtn.disabled = !hasSel;
      this.saveElemBtn.title = hasSel ? 'Salva preset elemento selezionato' : 'Seleziona un elemento per salvare il preset';
    };
    updateElemBtn();
    this.app.stage?.bus.on('selection-changed', updateElemBtn);
    this.app.stage?.bus.on('elements-changed', updateElemBtn);

    this.saveElemBtn.addEventListener('click', ()=>{
      if(!this.app.stage?.selected?.length) return;
      const name = (prompt('Nome del preset elemento:')||'').trim();
      if(!name) return;
      const el = this.app.stage.selected[0];
      const data = el.toJSON();
      const list = readPresets(LS_ELEMS);
      list.push({ id: makeId(), name, data, createdAt: Date.now() });
      writePresets(LS_ELEMS, list);
      this.render();
    });

    // searches
    $('#stepsSearch').addEventListener('input', (e)=>{ this.state.qSteps = (e.target.value||'').toLowerCase(); this.render(); });
    $('#elemsSearch').addEventListener('input', (e)=>{ this.state.qElems = (e.target.value||'').toLowerCase(); this.render(); });
  }

  
  _renderList(container, items, onUse, onDelete, kind){
    container.innerHTML='';
    if(!items.length){
      container.append(h('li', {class:'muted'}, 'Nessun preset salvato'));
      return;
    }
    for(const it of items){
      const li = h('li', {class:'preset-row'});

      // Left column: name (with icon for elements) + date
      const nameRow = h('div', {class:'preset-name'});
      if(kind==='element'){
        const icon = (it && it.data && it.data.type) ? (ICONS[it.data.type] || '🔧') : '🔧';
        nameRow.append(
          h('span', {class:'el-icon'}, icon),
          document.createTextNode(' '),
          document.createTextNode(it.name||'')
        );
      }else{
        nameRow.append(document.createTextNode(it.name||''));
      }
      const dateSmall = h('small', {class:'preset-date'}, new Date(it.createdAt||Date.now()).toLocaleString());
      const left = h('div', {class:'preset-left'}, nameRow, dateSmall);

      // Right column: actions
      const right = h('div', {class:'preset-actions'});
      const useBtn = h('button', {class:'use'}, 'Richiama');
      const delBtn = h('button', {class:'danger'}, 'Elimina');
      useBtn.addEventListener('click', ()=> onUse(it));
      delBtn.addEventListener('click', ()=>{
        if(confirm(`Eliminare il preset "${it.name}"?`)){
          onDelete(it);
        }
      });
      right.append(useBtn, delBtn);

      li.append(left, right);
      container.append(li);
    }
  }

render(){
    // Read and filter
    const steps = readPresets(LS_STEPS).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const elems = readPresets(LS_ELEMS).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const qS = (this.state.qSteps||'').toLowerCase();
    const qE = (this.state.qElems||'').toLowerCase();
    const stepsF = steps.filter(p => !qS || (p.name||'').toLowerCase().includes(qS));
    const elemsF = elems.filter(p => !qE || (p.name||'').toLowerCase().includes(qE));

    // Bind list renderers
    this._renderList(this.stepsList, stepsF, (preset)=>{
      // Use step: insert after current step and select it
      const src = preset.data || {type:'step', title:preset.name, aspect:'16:9', bgUrl:'', elements:[]};
      const clone = deepClone(src);
      try{ this.app.addStepFromPreset(clone, preset.name); }catch(err){ alert('Errore nell\'inserimento dello step: '+err.message); }
    }, (preset)=>{
      const arr = readPresets(LS_STEPS).filter(p => p.id!==preset.id);
      writePresets(LS_STEPS, arr);
      this.render();
    }, 'step');

    this._renderList(this.elemsList, elemsF, (preset)=>{
      // Use element: add to current step
      const data = deepClone(preset.data||{});
      try{ this.app.addElementFromPreset(data); }catch(err){ alert('Errore nell\'inserimento dell\'elemento: '+err.message); }
    }, (preset)=>{
      const arr = readPresets(LS_ELEMS).filter(p => p.id!==preset.id);
      writePresets(LS_ELEMS, arr);
      this.render();
    }, 'element');
  }
}
