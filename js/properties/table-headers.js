
import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class TableHeadersProperty extends BaseProperty{
  constructor(){ super('tableHeaders','Intestazioni','Tabella'); }
  static appliesTo(el){ const t = el && (el.type || (el.constructor && el.constructor.type)); return t==='tablecheck'; }
  render(_value, _onChange, {targets, app}){
    const t = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const title = document.createElement('h4'); title.textContent='Intestazioni'; wrap.appendChild(title);

    const mkRow = (lab, key, def)=>{
      const row = document.createElement('div'); row.className='prop-row';
      const l = document.createElement('label'); l.textContent = lab; row.appendChild(l);
      const inp = document.createElement('input'); inp.type='text'; inp.value = (t.getProp(key) ?? def); inp.style.marginLeft='auto';
      inp.addEventListener('change', ()=> app.cmd.execute(new UpdatePropertyCommand([t], key, inp.value, [t.getProp(key)])) );
      row.appendChild(inp);
      wrap.appendChild(row);
    };

    mkRow('Colonna chiavi','headerKeys','Seleziona');
    mkRow('Colonna valori','headerValues','Dettagli');
    return wrap;
  }
}
TableHeadersProperty.type='table-headers';
registry.registerProperty(TableHeadersProperty.type, TableHeadersProperty);
