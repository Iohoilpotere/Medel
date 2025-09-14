
import { BaseProperty } from './base-property.js';
import { colorPicker } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el.type || (el.constructor && el.constructor.type); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }

export class ColorProperty extends BaseProperty{
  constructor(){ super('color','Colore testo','Stile'); }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Colore testo'; wrap.appendChild(h);
    wrap.appendChild(colorPicker(value ?? targets[0].getProp('color') ?? '#ffffff', onChange));
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
ColorProperty.type='color'; registry.registerProperty(ColorProperty.type, ColorProperty);
