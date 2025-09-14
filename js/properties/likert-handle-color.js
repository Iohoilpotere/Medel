import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { colorPicker } from './common-controls.js';

export class LikertHandleColorProperty extends BaseProperty{
  constructor(){ super('likertHandleColor','Colore maniglia Likert','Contenuto'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    if(t!=='radiogroup') return false;
    const sel = el.getProp('selectionStyle') || 'standard';
    return false;
  }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Likert – maniglia'; wrap.appendChild(h);
    const row=document.createElement('div'); row.className='prop-row';
    const lab=document.createElement('label'); lab.textContent='Colore'; row.appendChild(lab);
    const curr = value ?? (targets[0].getProp('likertHandleColor') || '#22c55e');
    row.appendChild(colorPicker(curr, v=> onChange(v)));
    wrap.appendChild(row);
    return wrap;
  }
}
LikertHandleColorProperty.type='likert-handle-color';
registry.registerProperty(LikertHandleColorProperty.type, LikertHandleColorProperty);