
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

export class PairsContentProperty extends BaseProperty{
  constructor(){ super('pairs','Coppie (chiave → valore)','Contenuto'); }
  static appliesTo(el){ const t=el && (el.type || el.constructor?.type); return t==='pairs'; }
  render(_value, _onChange, {targets, app}){
    const el = targets[0];
    let pairs = Array.isArray(el.getProp('pairs')) ? el.getProp('pairs').map(p=>({label:String(p.label||''), value:String(p.value||'')})) : [];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Coppie (chiave → valore)'; wrap.appendChild(h);
    const list = document.createElement('ul'); list.style.listStyle='none'; list.style.padding='0'; list.style.margin='0';

    const rebuild = ()=>{
      list.innerHTML='';
      pairs.forEach((p, i)=>{
        const li = document.createElement('li');
        li.style.display='grid'; li.style.gridTemplateColumns='20px 1fr 1fr 24px'; li.style.gap='8px'; li.style.alignItems='center'; li.style.margin='4px 0';
        // drag handle
        const drag = document.createElement('span'); drag.textContent='↕'; drag.style.cursor='grab'; drag.title='Trascina per riordinare';
        drag.draggable=true; drag.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', String(i)); });
        li.appendChild(drag);
        // label input
        const inLab = document.createElement('input'); inLab.type='text'; inLab.value=p.label; inLab.placeholder='Chiave';
        inLab.addEventListener('input', ()=>{ pairs[i].label=inLab.value; commit(); });
        li.appendChild(inLab);
        // value input
        const inVal = document.createElement('input'); inVal.type='text'; inVal.value=p.value; inVal.placeholder='Valore';
        inVal.addEventListener('input', ()=>{ pairs[i].value=inVal.value; commit(); });
        li.appendChild(inVal);
        // delete
        const del = document.createElement('button'); del.type='button'; del.textContent='🗑';
        del.addEventListener('click', ()=>{ pairs.splice(i,1); commit(true); });
        li.appendChild(del);

        li.addEventListener('dragover', e=>{ e.preventDefault(); });
        li.addEventListener('drop', e=>{
          e.preventDefault();
          const from = parseInt(e.dataTransfer.getData('text/plain')||'-1',10);
          if(from<0 || from===i) return;
          const [moved] = pairs.splice(from,1);
          pairs.splice(i,0,moved);
          // remap itemStyles order
          try{
            const styles = Object.assign({}, el.getProp('itemStyles')||{});
            const arr = [];
            const maxLen = Math.max(pairs.length, Object.keys(styles).length);
            for(let k=0;k<maxLen;k++){ arr[k] = styles[k] ? Object.assign({}, styles[k]) : undefined; }
            const movedStyle = arr.splice(from,1)[0];
            arr.splice(i,0,movedStyle);
            const newStyles = {};
            arr.forEach((st,idx)=>{ if(st && Object.keys(st).length) newStyles[idx]=st; });
            app.cmd.execute(new UpdatePropertyCommand([el], 'itemStyles', newStyles, [JSON.stringify(el.getProp('itemStyles')||{})]));
          }catch(_e){}
          commit(true);
        });

        list.appendChild(li);
      });
    };

    const commit = (full=false)=>{
      const prev = [JSON.stringify(el.getProp('pairs')||[])];
      app.cmd.execute(new UpdatePropertyCommand([el], 'pairs', pairs.map(p=>({label:p.label,value:p.value})), prev));
      // also update items (for style-scope UI)
      const itemsPrev = [JSON.stringify(el.getProp('items')||[])];
      app.cmd.execute(new UpdatePropertyCommand([el], 'items', pairs.map(p=>p.label), itemsPrev));
      if(full) rebuild();
    };

    rebuild();

    const add = document.createElement('button'); add.type='button'; add.textContent='+ Aggiungi';
    add.addEventListener('click', ()=>{ pairs.push({label:'Chiave', value:'Valore'}); commit(true); });
    wrap.appendChild(list); wrap.appendChild(add);
    return wrap;
  }
}
PairsContentProperty.type='pairs-content';
registry.registerProperty(PairsContentProperty.type, PairsContentProperty);
