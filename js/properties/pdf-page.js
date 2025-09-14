import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class PdfPageProperty extends BaseProperty{
  constructor(){ super('pdfPage','Pagina','Contenuto'); }
  static appliesTo(el){ try{ return typeof el.getProp==='function' && typeof el.getProp('page')!=='undefined'; }catch(e){ return false; } }
  render(_value, _onChange, {targets, app}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Pagina'; wrap.appendChild(h);
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent='Numero'; row.appendChild(lab);
    const inp = document.createElement('input'); inp.type='number'; inp.min='1'; inp.step='1'; inp.value = parseInt(el.getProp('page')||1,10);
    inp.addEventListener('change', ()=>{
      const prev = [el.getProp('page')];
      const val = Math.max(1, parseInt(inp.value||'1',10));
      app.cmd.execute(new UpdatePropertyCommand([el], 'page', val, prev));
    });
    row.appendChild(inp); wrap.appendChild(row);
    return wrap;
  }
}
PdfPageProperty.type='pdf-page';
registry.registerProperty(PdfPageProperty.type, PdfPageProperty);