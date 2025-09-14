import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';

export class ItemsEditorProperty extends BaseProperty{
  constructor(){ super('items','Voci','Contenuto'); }
  static appliesTo(el){ return el && (el.type==='radiogroup' || el.type==='checkboxgroup'); }
  render(value, onChange, {targets}){
    const target = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const title = document.createElement('h4'); title.textContent = 'Voci'; wrap.appendChild(title);

    const items = Array.isArray(target.getProp('items')) ? [...target.getProp('items')] : (Array.isArray(value)? [...value] : ['Opzione A','Opzione B']);
    const list = document.createElement('ul'); list.className='items-list'; list.style.listStyle='none'; list.style.padding='0'; list.style.margin='0';

    let dragIndex = null;
    const commit = ()=>{ onChange([...items]); };

    const mkRow = (i)=>{
      const li = document.createElement('li');
      li.draggable = true;
      li.style.display='flex'; li.style.alignItems='center'; li.style.gap='8px'; li.style.margin='4px 0';

      const handle = document.createElement('span'); handle.textContent='⋮⋮'; handle.style.cursor='grab'; handle.title='Trascina per riordinare';

      const text = document.createElement('span'); text.textContent = items[i]; text.style.flex='1'; text.style.cursor='text';
      text.addEventListener('click', ()=>{
        const input = document.createElement('input'); input.type='text'; input.value = items[i]; input.style.flex='1';
        const end = (commitChange)=>{ if(commitChange!==false){ items[i] = input.value; text.textContent = items[i]; commit(); } li.replaceChild(text, input); };
        input.addEventListener('blur', ()=> end(true));
        input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); end(true);} if(e.key==='Escape'){ e.preventDefault(); end(false);} });
        li.replaceChild(input, text); input.focus(); input.select();
      });

      const del = document.createElement('button'); del.textContent='✕'; del.title='Rimuovi';
      del.addEventListener('click', ()=>{ items.splice(i,1); rebuild(); commit(); });

      li.addEventListener('dragstart', (e)=>{ dragIndex = i; e.dataTransfer.effectAllowed='move'; li.style.opacity='0.5'; });
      li.addEventListener('dragend', ()=>{ dragIndex = null; li.style.opacity='1'; });
      li.addEventListener('dragover', (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; });
      li.addEventListener('drop', (e)=>{ e.preventDefault(); if(dragIndex===null || dragIndex===i) return; const [moved]=items.splice(dragIndex,1); items.splice(i,0,moved); rebuild(); commit(); });

      li.appendChild(handle); li.appendChild(text); li.appendChild(del);
      return li;
    };

    const rebuild = ()=>{ list.innerHTML=''; items.forEach((_,i)=> list.appendChild(mkRow(i))); };
    rebuild();

    const addBtn = document.createElement('button'); addBtn.textContent='+ Aggiungi';
    addBtn.addEventListener('click', ()=>{ items.push('Voce'); rebuild(); commit(); });

    wrap.appendChild(list); wrap.appendChild(addBtn);
    return wrap;
  }
}
ItemsEditorProperty.type='items-editor';
registry.registerProperty(ItemsEditorProperty.type, ItemsEditorProperty);
