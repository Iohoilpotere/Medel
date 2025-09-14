import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';

export class ItemsAlignProperty extends BaseProperty{
  constructor(){ super('itemsAlign', 'Allineamento elementi', 'Contenuto'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='radiogroup' || t==='checkboxgroup';
  }
  render(_value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Allineamento elementi'; wrap.appendChild(h);
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent = 'Allineamento'; row.appendChild(lab);
    const sel = document.createElement('select');
    [['start','Inizio'],['center','Centro'],['end','Fine']].forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; sel.appendChild(o); });
    const curr = targets[0].getProp('itemsAlign') || 'start';
    sel.value = curr;
    sel.addEventListener('change', ()=> onChange(sel.value));
    row.appendChild(lab); row.appendChild(sel); wrap.appendChild(row);
    return wrap;
  }
}
ItemsAlignProperty.type='items-align';
registry.registerProperty(ItemsAlignProperty.type, ItemsAlignProperty);