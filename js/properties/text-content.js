
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';


export class TextContentProperty extends BaseProperty{
  constructor(){ super('value', 'Contenuto', 'Contenuto'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='textbox' || t==='label';
  }
  render(_value, _onChange, {targets, app}){
    const t0 = targets[0];
    const t = t0 && (t0.type || (t0.constructor && t0.constructor.type));
    const key = (t==='label') ? 'text' : 'value';

    // Group
    const wrap = document.createElement('div'); wrap.className='prop-group';

    // Header: NOT "Contenuto", make it explicit for clarity
    const h = document.createElement('h4'); h.textContent = (t==='label') ? 'Testo (rich)' : 'Contenuto';
    wrap.appendChild(h);

    if(t==='label'){
      // Vertical stack: toolbar + editor + apply button (full width)
      const col = document.createElement('div');
      col.style.display='flex'; col.style.flexDirection='column'; col.style.gap='6px';
      // toolbar
      const bar = document.createElement('div'); bar.style.display='flex'; bar.style.gap='6px';
      const mkBtn = (txt, cmd)=>{ const b=document.createElement('button'); b.type='button'; b.textContent=txt; b.addEventListener('click',()=> document.execCommand(cmd,false,null)); return b; };
      bar.appendChild(mkBtn('B','bold')); bar.appendChild(mkBtn('I','italic')); bar.appendChild(mkBtn('U','underline'));
      // editor
      const ed = document.createElement('div'); ed.contentEditable='true'; ed.className='rt-editor';
      ed.style.minHeight='120px'; ed.style.border='1px solid var(--border)'; ed.style.padding='6px'; ed.style.borderRadius='6px';
      ed.style.maxHeight='240px'; ed.style.overflow='auto';
      ed.innerHTML = String(t0.getProp(key) ?? '');
      // Apply button
      const apply = document.createElement('button'); apply.type='button'; apply.textContent='Applica formattazione';
      apply.addEventListener('click', ()=>{
        const prev = [t0.getProp(key)];
        app.cmd.execute(new UpdatePropertyCommand([t0], key, ed.innerHTML, prev)); if(app?.propertiesPanel?.render) app.propertiesPanel.render();
      });
      col.appendChild(bar); col.appendChild(ed); col.appendChild(apply);
      wrap.appendChild(col);
    }else{
      // Simple one-line input for textbox/others
      const row = document.createElement('div'); row.className='prop-row'; row.style.alignItems='stretch';
      const lab = document.createElement('label'); lab.textContent = 'Testo';
      const inp = document.createElement('input'); inp.type='text'; inp.value = t0.getProp(key) ?? ''; inp.placeholder = 'Digita testo...'; inp.style.flex='1';
      inp.addEventListener('change', ()=>{
        const prev = [t0.getProp(key)];
        app.cmd.execute(new UpdatePropertyCommand([t0], key, inp.value, prev));
      });
      row.appendChild(lab); row.appendChild(inp);
      wrap.appendChild(row);
    }
    return wrap;
  }
}
TextContentProperty.type='text-content';
registry.registerProperty(TextContentProperty.type, TextContentProperty);

