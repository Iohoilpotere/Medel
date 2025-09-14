
import { BaseProperty } from './base-property.js';
import { selectInput } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }

export class FontFamilyProperty extends BaseProperty{
  constructor(){ super('fontFamily','Font','Stile'); }
  render(value,onChange,{targets}){
    const opts = ['System','Inter','Roboto','Arial','Georgia','Times New Roman','Courier New'];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Font'; wrap.appendChild(h);
    wrap.appendChild(selectInput(value ?? (targets[0].getProp('fontFamily')||'System'), opts, onChange));
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
FontFamilyProperty.type='fontFamily'; registry.registerProperty(FontFamilyProperty.type, FontFamilyProperty);
