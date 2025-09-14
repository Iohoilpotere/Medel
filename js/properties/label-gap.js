import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

class LabelGapProperty extends BaseProperty{
  constructor(){ super('labelGap', 'Layout', 'Distanza etichetta (px)'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='checkbox' || t==='checkboxgroup' || t==='radiogroup';
  }
  render(_v, _onChange, {targets, app}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent = 'Distanza (px)';
    const input = document.createElement('input'); input.type='number'; input.min='0'; input.step='1';
    input.value = Number(el.getProp('labelGap') ?? 0);
    input.addEventListener('change', ()=>{
      const prev=[el.getProp('labelGap')];
      app.cmd.execute(new UpdatePropertyCommand([el], 'labelGap', Number(input.value), prev));
    });
    row.appendChild(lab); row.appendChild(input); wrap.appendChild(row);
    return wrap;
  }
}
LabelGapProperty.type='label-gap';
registry.registerProperty(LabelGapProperty.type, LabelGapProperty);