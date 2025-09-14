
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

export class TextPlaceholderProperty extends BaseProperty{
  constructor(){ super('placeholder', 'Placeholder', 'Contenuto'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='textbox';
  }
  render(value, _onChange, {targets, app}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Placeholder'; wrap.appendChild(h);
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent='Testo'; row.appendChild(lab);
    const inp = document.createElement('input'); inp.type='text'; inp.value = value ?? targets[0].getProp('placeholder') ?? '';
    inp.placeholder = 'Digita placeholder...';
    inp.addEventListener('change', ()=>{
      const prev = [targets[0].getProp('placeholder')];
      app.cmd.execute(new UpdatePropertyCommand([targets[0]], 'placeholder', inp.value, prev));
    });
    row.appendChild(inp); wrap.appendChild(row); return wrap;
  }
}
TextPlaceholderProperty.type='text-placeholder';
registry.registerProperty(TextPlaceholderProperty.type, TextPlaceholderProperty);
