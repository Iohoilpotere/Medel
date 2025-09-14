
import { BaseProperty } from './base-property.js';
import { selectInput } from './common-controls.js';
import { registry } from '../core/registry.js';

export class FitProperty extends BaseProperty{
  constructor(){ super('fit', 'Adattamento immagine', 'Stile'); }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Adattamento immagine'; wrap.appendChild(h);
    const opts = ['cover','fill','resize'];
    wrap.appendChild(selectInput(value ?? targets[0].getProp('fit') ?? 'resize', opts, onChange));
    return wrap;
  }
  static appliesTo(el){ return typeof el.getProp('fit')!=='undefined'; }
}
FitProperty.type='fit'; registry.registerProperty(FitProperty.type, FitProperty);
