
import { BaseProperty } from './base-property.js';
import { selectInput } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }

export class FontWeightProperty extends BaseProperty{
  constructor(){ super('fontWeight','Peso','Stile'); }
  render(value,onChange,{targets}){
    const opts = ['100','200','300','400','500','600','700','800','900'];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Peso'; wrap.appendChild(h);
    wrap.appendChild(selectInput(String(value ?? (targets[0].getProp('fontWeight')||'400')), opts, v=> onChange(parseInt(v))));
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
FontWeightProperty.type='fontWeight'; registry.registerProperty(FontWeightProperty.type, FontWeightProperty);
