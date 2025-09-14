
import { BaseProperty } from './base-property.js';
import { textarea } from './common-controls.js';
import { registry } from '../core/registry.js';

export class TextProperty extends BaseProperty{
  constructor(){ super('text', 'Testo', 'Contenuto'); }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Testo'; wrap.appendChild(h);
    wrap.appendChild(textarea(value ?? targets[0].getProp('text') ?? '', onChange));
    return wrap;
  }
  static appliesTo(el){ const t = el && (el.type || (el.constructor && el.constructor.type)); return typeof el.getProp('text')!=='undefined' && t!=='label'; }
}
TextProperty.type='text'; registry.registerProperty(TextProperty.type, TextProperty);
