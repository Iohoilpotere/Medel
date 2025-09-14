
import { BaseProperty } from './base-property.js';
import { colorPicker } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }

export class StrokeProperty extends BaseProperty{
  constructor(){ super('stroke','Traccia','Stile'); }
  render(value,onChange,{targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Traccia'; wrap.appendChild(h);
    const rowC=document.createElement('div'); rowC.className='prop-row';
    const labC=document.createElement('label'); labC.textContent='Colore'; rowC.appendChild(labC);
    rowC.appendChild(colorPicker(targets[0].getProp('strokeColor')||'rgba(0,0,0,1)', v=> targets.forEach(t=> t.setProp('strokeColor', v))));
    wrap.appendChild(rowC);
    const rowW=document.createElement('div'); rowW.className='prop-row';
    const labW=document.createElement('label'); labW.textContent='Spessore (px)'; rowW.appendChild(labW);
    const w=document.createElement('input'); w.type='number'; w.step='0.5'; w.value=targets[0].getProp('strokeWidth') ?? 0;
    w.addEventListener('input', ()=> onChange({__key:'strokeWidth', value: parseFloat(w.value)}));
    rowW.appendChild(w); wrap.appendChild(rowW);
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
StrokeProperty.type='stroke'; registry.registerProperty(StrokeProperty.type, StrokeProperty);
