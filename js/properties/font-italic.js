
import { BaseProperty } from './base-property.js';
import { checkboxInput } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }

export class FontItalicProperty extends BaseProperty{
  constructor(){ super('italic','Corsivo','Stile'); }
  render(value,onChange,{targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Corsivo'; wrap.appendChild(h);
    wrap.appendChild(checkboxInput(!!(value ?? targets[0].getProp('italic')), onChange));
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
FontItalicProperty.type='italic'; registry.registerProperty(FontItalicProperty.type, FontItalicProperty);
