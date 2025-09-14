import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

export class SelectionStyleProperty extends BaseProperty{
  constructor(){ super('selectionStyle', 'Selettore', 'Stile selezione'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='radiogroup' || t==='checkboxgroup' || t==='checkbox';
  }
  render(_value, _onChange, {targets, app}){
    const el = targets[0];
    const t = el && (el.type || (el.constructor && el.constructor.type));
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent = 'Stile selezione';
    const sel = document.createElement('select');
    const byType = {
      radiogroup: [['standard','Radio standard'], ['likert','Scala Likert']],
      checkbox: [['standard','Checkbox'], ['switch','Interruttore']],
      checkboxgroup: [['standard','Lista'], ['pills','Pill toggle']]
    };
    const opts = byType[t] || [['standard','Standard']];
    for(const [val, txt] of opts){ const o=document.createElement('option'); o.value=val; o.textContent=txt; sel.appendChild(o); }
    sel.value = el.getProp('selectionStyle') || 'standard';
    sel.addEventListener('change', ()=>{
      const prev=[el.getProp('selectionStyle')];
      app.cmd.execute(new UpdatePropertyCommand([el], 'selectionStyle', sel.value, prev));
    });
    row.appendChild(lab); row.appendChild(sel); wrap.appendChild(row);
    return wrap;
  }
}
SelectionStyleProperty.type='selection-style';
registry.registerProperty(SelectionStyleProperty.type, SelectionStyleProperty);