
import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class TableRowsContentProperty extends BaseProperty{
  constructor(){ super('rowsContent','Contenuti righe','Tabella'); }
  static appliesTo(el){ const t = el && (el.type || (el.constructor && el.constructor.type)); return t==='tablecheck'; }
  render(_value, _onChange, {targets, app}){
    const t = targets[0];
    const items = Array.isArray(t.getProp('items')) ? t.getProp('items') : [];
    let rc = Object.assign({}, t.getProp('rowsContent')||{});
    const wrap = document.createElement('div'); wrap.className='prop-group';

    const head = document.createElement('div'); head.style.display='flex'; head.style.alignItems='center'; head.style.gap='8px';
    const title = document.createElement('h4'); title.textContent='Contenuti righe'; title.style.margin='0';
    const sel = document.createElement('select'); sel.style.marginLeft='auto';
    items.forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=k; sel.appendChild(o); });
    head.appendChild(title); head.appendChild(sel); wrap.appendChild(head);

    const area = document.createElement('div'); area.className='prop-subgroup'; area.style.marginTop='8px'; wrap.appendChild(area);

    const commit = ()=>{
      const prev = [t.getProp('rowsContent')];
      app.cmd.execute(new UpdatePropertyCommand([t], 'rowsContent', Object.assign({}, rc), prev));
    };

    const rebuild = ()=>{
      area.innerHTML='';
      if(!items.length){ const p=document.createElement('p'); p.textContent='Aggiungi righe (proprietà “Righe”).'; p.style.opacity='0.8'; area.appendChild(p); return; }
      const key = sel.value || items[0];
      const ta = document.createElement('textarea'); ta.value = rc[key] || ''; ta.placeholder='HTML: testo e <img src="..."> supportati';
      ta.style.minHeight='120px'; ta.style.width='100%';
      ta.addEventListener('change', ()=>{ rc[key]=ta.value; commit(); });
      area.appendChild(ta);
    };

    sel.addEventListener('change', rebuild);
    if(items.length) sel.value = items[0];
    rebuild();
    return wrap;
  }
}
TableRowsContentProperty.type='table-rows-content';
registry.registerProperty(TableRowsContentProperty.type, TableRowsContentProperty);
