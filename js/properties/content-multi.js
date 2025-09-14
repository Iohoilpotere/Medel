import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

// Proprietà "Contenuto multiplo" per RadioGroup e CheckboxGroup
export class MultiContentProperty extends BaseProperty{
  constructor(){ super('items','Contenuto multiplo','Contenuto'); }
  static appliesTo(el){ const t=el && (el.type || (el.constructor && el.constructor.type)); return t==='radiogroup' || t==='checkboxgroup'; }

  render(value, onChange, {targets, app}){
    const target = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const title = document.createElement('h4'); title.textContent = 'Contenuto multiplo'; wrap.appendChild(title);

    // Stato iniziale
    let items = Array.isArray(target.getProp('items')) ? [...target.getProp('items')] : (Array.isArray(value) ? [...value] : ['Opzione A','Opzione B']);
    let isRadio = target.type === 'radiogroup';
    let selIndex = isRadio ? (Number.isInteger(target.getProp('value')) ? target.getProp('value') : -1) : -1;
    let selFlags = !isRadio ? (()=>{
      const vals = Array.isArray(target.getProp('values')) ? target.getProp('values') : [];
      const flags = items.map((_,i)=> vals.includes(i));
      return flags;
    })() : null;

    const list = document.createElement('ul'); list.className='items-list'; list.style.listStyle='none'; list.style.padding='0'; list.style.margin='0';

    let dragIndex = null;

    const commitAll = ()=>{
      // 1) aggiorna items
      app.cmd.execute(new UpdatePropertyCommand([target], 'items', [...items], [JSON.stringify(target.getProp('items')||[]) ]));
      // 2) aggiorna selection in base al tipo
      if(isRadio){
        const prev = [target.getProp('value')];
        app.cmd.execute(new UpdatePropertyCommand([target], 'value', selIndex, prev));
      }else{
        const newValues = selFlags.map((f,i)=> f? i : -1).filter(i=> i>=0);
        const prev = [JSON.stringify(target.getProp('values')||[])];
        app.cmd.execute(new UpdatePropertyCommand([target], 'values', newValues, prev));
      }
    };

    const rebuild = ()=>{
      list.innerHTML='';
      items.forEach((txt,i)=>{
        const li = document.createElement('li');
        li.draggable = true;
        li.style.display='flex'; li.style.alignItems='center'; li.style.gap='8px'; li.style.margin='4px 0';

        // Drag handle
        const handle = document.createElement('span'); handle.textContent='⋮⋮'; handle.style.cursor='grab'; handle.title='Trascina per riordinare';
        li.appendChild(handle);

        // Selettore stato (radio/checkbox)
        if(isRadio){
          const r = document.createElement('input'); r.type='radio'; r.name='mc_radio_'+Math.random().toString(36).slice(2);
          r.checked = (selIndex===i);
          r.addEventListener('change', ()=>{ selIndex=i; commitAll(); });
          li.appendChild(r);
        }else{
          if(!selFlags) selFlags = items.map(()=>false);
          const c = document.createElement('input'); c.type='checkbox'; c.checked = !!selFlags[i];
          c.addEventListener('change', ()=>{ selFlags[i] = !!c.checked; commitAll(); });
          li.appendChild(c);
        }

        // Testo (click-to-rename)
        const text = document.createElement('span'); text.textContent = txt; text.style.flex='1'; text.style.cursor='text';
        text.addEventListener('click', ()=>{
          const input = document.createElement('input'); input.type='text'; input.value = items[i]; input.style.flex='1';
          const end = (commit)=>{ if(commit!==false){ items[i] = input.value; text.textContent = items[i]; commitAll(); if(app?.propertiesPanel?.render) app.propertiesPanel.render(); } li.replaceChild(text, input); };
          input.addEventListener('blur', ()=> end(true));
          input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); end(true);} if(e.key==='Escape'){ e.preventDefault(); end(false);} });
          li.replaceChild(input, text); input.focus(); input.select();
        });
        li.appendChild(text);

        // Elimina
        const del = document.createElement('button'); del.type='button'; del.textContent='✕'; del.title='Rimuovi';
        del.addEventListener('click', ()=>{
          items.splice(i,1);
          // delete style for removed index and shift following
          try{
            const styles = Object.assign({}, target.getProp('itemStyles')||{});
            const arr = [];
            const maxLen = Math.max(items.length+1, Object.keys(styles).length);
            for(let k=0;k<maxLen;k++){ arr[k] = styles[k] ? Object.assign({}, styles[k]) : undefined; }
            arr.splice(i,1);
            const newStyles = {};
            arr.forEach((st,idx)=>{ if(st && Object.keys(st).length) newStyles[idx]=st; });
            const prev = [JSON.stringify(target.getProp('itemStyles')||{})];
            app.cmd.execute(new UpdatePropertyCommand([target], 'itemStyles', newStyles, prev));
          }catch(e){ /* ignore */ }
          if(isRadio){
            if(selIndex===i) selIndex = Math.min(i, items.length-1);
            else if(i<selIndex) selIndex -= 1;
          }else{
            if(selFlags){ selFlags.splice(i,1); }
          }
          rebuild(); commitAll(); if(app?.propertiesPanel?.render) app.propertiesPanel.render();
        });
        li.appendChild(del);

        // Drag & drop
        li.addEventListener('dragstart', (e)=>{ dragIndex = i; e.dataTransfer.effectAllowed='move'; li.style.opacity='0.5'; });
        li.addEventListener('dragend', ()=>{ dragIndex = null; li.style.opacity='1'; });
        li.addEventListener('dragover', (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; });
        li.addEventListener('drop', (e)=>{
          e.preventDefault();
          if(dragIndex===null || dragIndex===i) return;
          const [moved] = items.splice(dragIndex,1);
          items.splice(i,0,moved);
          // reorder itemStyles accordingly
          try{
            const styles = Object.assign({}, target.getProp('itemStyles')||{});
            const arr = [];
            const maxLen = Math.max(items.length, Object.keys(styles).length);
            for(let k=0;k<maxLen;k++){ arr[k] = styles[k] ? Object.assign({}, styles[k]) : undefined; }
            const movedStyle = arr.splice(dragIndex,1)[0];
            arr.splice(i,0,movedStyle);
            const newStyles = {};
            arr.forEach((st,idx)=>{ if(st && Object.keys(st).length) newStyles[idx]=st; });
            const prev = [JSON.stringify(target.getProp('itemStyles')||{})];
            app.cmd.execute(new UpdatePropertyCommand([target], 'itemStyles', newStyles, prev));
          }catch(e){ /* ignore */ }
          if(isRadio){
            // ri-mappa indice selezionato
            if(selIndex===dragIndex) selIndex = i;
            else if(dragIndex<selIndex && i>=selIndex) selIndex -= 1;
            else if(dragIndex>selIndex && i<=selIndex) selIndex += 1;
          }else if(selFlags){
            const [selMoved] = selFlags.splice(dragIndex,1);
            selFlags.splice(i,0,selMoved);
          }
          rebuild(); commitAll(); if(app?.propertiesPanel?.render) app.propertiesPanel.render();
        });

        list.appendChild(li);
      });
    };

    rebuild();

    const addBtn = document.createElement('button'); addBtn.type='button'; addBtn.textContent = '+ Aggiungi';
    addBtn.addEventListener('click', ()=>{
      items.push('Voce');
      if(!isRadio && selFlags) selFlags.push(false);
      rebuild(); commitAll(); if(app?.propertiesPanel?.render) app.propertiesPanel.render();
    });

    wrap.appendChild(list);
    wrap.appendChild(addBtn);
    return wrap;
  }
}
MultiContentProperty.type='content-multi';
registry.registerProperty(MultiContentProperty.type, MultiContentProperty);
