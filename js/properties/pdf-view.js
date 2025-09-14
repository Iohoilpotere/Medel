import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class PdfViewProperty extends BaseProperty{
  constructor(){ super('pdfView','Visualizzazione','Contenuto'); }
  static appliesTo(el){ try{ return typeof el.getProp==='function' && typeof el.getProp('viewMode')!=='undefined'; }catch(e){ return false; } }
  render(_value, _onChange, {targets, app}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Visualizzazione'; wrap.appendChild(h);
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent='Modo'; row.appendChild(lab);
    const sel = document.createElement('select');
    const opts = [['free','Libero'], ['page','Pagina'], ['book','Libro']];
    opts.forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; sel.appendChild(o); });
    sel.value = el.getProp('viewMode') || 'page';
    sel.addEventListener('change', ()=>{
      const prev = [el.getProp('viewMode')];
      app.cmd.execute(new UpdatePropertyCommand([el],'viewMode', sel.value, prev));
    });
    row.appendChild(sel);
    wrap.appendChild(row);
    return wrap;
  }
}
PdfViewProperty.type='pdf-view';
registry.registerProperty(PdfViewProperty.type, PdfViewProperty);