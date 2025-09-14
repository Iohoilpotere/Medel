import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { numberInput } from './common-controls.js';

export class ItemsGapProperty extends BaseProperty{
  constructor(){ super('itemsGap', 'Spaziatura elementi', 'Contenuto'); }
  static appliesTo(el){
  try{ const t = el && (el.type || (el.constructor && el.constructor.type)); if(t==='checkboxgroup') return false; }catch(e){}

    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='radiogroup' || t==='checkboxgroup';
  }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Spaziatura elementi'; wrap.appendChild(h);
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent = 'Gap (px)'; row.appendChild(lab);
    const curr = Number.isFinite(value) ? value : Number(targets[0].getProp('itemsGap')||6);
    row.appendChild(numberInput(curr, 1, v=> onChange(v)).firstChild);
    wrap.appendChild(row);
    return wrap;
  }
}
ItemsGapProperty.type='items-gap';
registry.registerProperty(ItemsGapProperty.type, ItemsGapProperty);