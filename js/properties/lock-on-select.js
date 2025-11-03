import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';

export class LockOnSelectProperty extends BaseProperty{
  constructor(){ super('lockOnSelect','Blocca dopo selezione','Comportamento'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='checkbox' || t==='checkboxgroup' || t==='tablecheck' || t==='radiogroup';
  }
  render(value, onChange){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent = 'Irreversibile'; row.appendChild(lab);
    const input = document.createElement('input'); input.type='checkbox'; input.checked = !!value;
    input.addEventListener('change', ()=> onChange(!!input.checked));
    row.appendChild(input); wrap.appendChild(row);
    return wrap;
  }
}
LockOnSelectProperty.type='lock-on-select';
registry.registerProperty(LockOnSelectProperty.type, LockOnSelectProperty);