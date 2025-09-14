
import { BaseProperty } from './base-property.js';
import { checkboxInput } from './common-controls.js';
import { registry } from '../core/registry.js';

export class ShadowProperty extends BaseProperty{
  constructor(){ super('shadow', 'Ombra testo', 'Stile'); }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Ombra testo'; wrap.appendChild(h);
    wrap.appendChild(checkboxInput(value ?? !!targets[0].getProp('shadow'), onChange));
    return wrap;
  }
  static appliesTo(el){ return typeof el.getProp('shadow')!=='undefined'; }
}
ShadowProperty.type='shadow'; registry.registerProperty(ShadowProperty.type, ShadowProperty);
