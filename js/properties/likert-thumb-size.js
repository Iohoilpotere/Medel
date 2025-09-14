import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { numberInput } from './common-controls.js';

export class LikertThumbSizeProperty extends BaseProperty{
  constructor(){ super('likertThumbSize','Likert – maniglia','Sfondo'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    if(t!=='radiogroup') return false;
    const sel = el.getProp('selectionStyle') || 'standard';
    return sel === 'likert';
  }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Likert – maniglia'; wrap.appendChild(h);
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent='Dimensione maniglia (px)'; row.appendChild(lab);
    const curr = value ?? (targets[0].getProp('likertThumbSize') || 0);
    const ctrl = numberInput(curr, 1, v=> onChange(Number(v)||0)); // 0 = auto (usa logica esistente)
    const inputEl = ctrl.querySelector ? (ctrl.querySelector('input')||ctrl) : ctrl;
    row.appendChild(inputEl);
    wrap.appendChild(row);
    return wrap;
  }
}
LikertThumbSizeProperty.type='likert-thumb-size';
registry.registerProperty(LikertThumbSizeProperty.type, LikertThumbSizeProperty);