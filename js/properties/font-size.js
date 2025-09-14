
import { BaseProperty } from './base-property.js';
import { numberInput } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }

export class FontSizeProperty extends BaseProperty{
  constructor(){ super('fontSize','Dimensione testo','Stile'); }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Dimensione testo'; wrap.appendChild(h);
    {
      const row = document.createElement('div'); row.className='prop-row';
      const num = document.createElement('input'); num.type='number';
      const cur = value ?? targets[0].getProp('fontSize') ?? 16;
      num.value = String(cur); num.step='1'; num.style.width='90px';
      const unit = document.createElement('select');
      ['px','vw','%'].forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; if((targets[0].getProp('fontSizeUnit')||'px')===u) o.selected=true; unit.appendChild(o); });
      num.addEventListener('input', ()=> onChange(parseFloat(num.value)));
      unit.addEventListener('change', ()=> { targets.forEach(t=> t.setProp('fontSizeUnit', unit.value)); });
      row.appendChild(num); row.appendChild(unit);
      wrap.appendChild(row);
    }
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
FontSizeProperty.type='fontSize'; registry.registerProperty(FontSizeProperty.type, FontSizeProperty);
