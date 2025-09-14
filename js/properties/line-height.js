
import { BaseProperty } from './base-property.js';
import { numberInput } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }

export class LineHeightProperty extends BaseProperty{
  constructor(){ super('lineHeight','Interlinea','Stile'); }
  render(value,onChange,{targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Interlinea (unitless)'; wrap.appendChild(h);
    wrap.appendChild(numberInput(value ?? targets[0].getProp('lineHeight') ?? 1.2, 0.1, onChange));
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
LineHeightProperty.type='lineHeight'; registry.registerProperty(LineHeightProperty.type, LineHeightProperty);
