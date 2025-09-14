
import { BaseProperty } from './base-property.js';
import { numberInput } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox'].includes(t); }

export class LetterSpacingProperty extends BaseProperty{
  constructor(){ super('letterSpacing','Spaziatura caratteri','Stile'); }
  render(value,onChange,{targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Spaziatura caratteri (px)'; wrap.appendChild(h);
    wrap.appendChild(numberInput(value ?? targets[0].getProp('letterSpacing') ?? 0, 0.1, onChange));
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
LetterSpacingProperty.type='letterSpacing'; registry.registerProperty(LetterSpacingProperty.type, LetterSpacingProperty);
