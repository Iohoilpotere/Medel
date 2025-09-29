
import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class TableItemsProperty extends BaseProperty{
  constructor(){ super('items', 'Righe', 'Tabella'); }
  static appliesTo(el){ const t = el && (el.type || (el.constructor && el.constructor.type)); return t==='tablecheck'; }
  render(_value, _onChange, {targets, app}){
    const t = targets[0];
    let items = Array.isArray(t.getProp('items')) ? [...t.getProp('items')] : ['Voce A','Voce B'];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Righe'; wrap.appendChild(h);

    const list = document.createElement('div'); list.style.display='flex'; list.style.flexDirection='column'; list.style.gap='6px';

    const commit = ()=>{
      const prev = [t.getProp('items')];
      app.cmd.execute(new UpdatePropertyCommand([t], 'items', [...items], prev));
      // ensure rowsContent has keys
      const rc = Object.assign({}, t.getProp('rowsContent')||{});
      for(const k of items){ if(!(k in rc)) rc[k]=''; }
      Object.keys(rc).forEach(k=>{ if(!items.includes(k)) delete rc[k]; });
      app.cmd.execute(new UpdatePropertyCommand([t], 'rowsContent', rc, [t.getProp('rowsContent')]));
    };

    const rebuild = ()=>{
      list.innerHTML='';
      items.forEach((key, idx)=>{
        const row = document.createElement('div'); row.className='prop-row'; row.style.alignItems='center'; row.style.gap='8px';
        const inp = document.createElement('input'); inp.type='text'; inp.value=key; inp.style.flex='1';
        inp.addEventListener('change', ()=>{ items[idx]=inp.value; commit(); rebuild(); });
        const up = document.createElement('button'); up.type='button'; up.textContent='↑'; up.addEventListener('click', ()=>{ if(idx>0){ const tmp=items[idx-1]; items[idx-1]=items[idx]; items[idx]=tmp; commit(); rebuild(); } });
        const down = document.createElement('button'); down.type='button'; down.textContent='↓'; down.addEventListener('click', ()=>{ if(idx<items.length-1){ const tmp=items[idx+1]; items[idx+1]=items[idx]; items[idx]=tmp; commit(); rebuild(); } });
        const del = document.createElement('button'); del.type='button'; del.textContent='✕'; del.className='danger'; del.addEventListener('click', ()=>{ items.splice(idx,1); commit(); rebuild(); });

        row.appendChild(inp); row.appendChild(up); row.appendChild(down); row.appendChild(del);
        list.appendChild(row);
      });
    };
    rebuild();

    const add = document.createElement('button'); add.type='button'; add.textContent='+ Aggiungi riga';
    add.addEventListener('click', ()=>{ items.push('Voce'); commit(); rebuild(); });

    wrap.appendChild(list);
    wrap.appendChild(add);
    return wrap;
  }
}
TableItemsProperty.type='table-items';
registry.registerProperty(TableItemsProperty.type, TableItemsProperty);
