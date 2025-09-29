
import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class TableLabelStyleProperty extends BaseProperty{
  constructor(){ super('labelStyles','Stile etichetta riga','Tabella'); }
  static appliesTo(el){ const t = el && (el.type || (el.constructor && el.constructor.type)); return t==='tablecheck'; }
  render(_value, _onChange, {targets, app}){
    const t = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const head = document.createElement('div'); head.style.display='flex'; head.style.alignItems='center'; head.style.gap='8px';
    const title = document.createElement('h4'); title.textContent='Stile etichetta riga'; title.style.margin='0';
    const sel = document.createElement('select'); sel.style.marginLeft='auto';
    const items = t.getProp('items')||[];
    for(const k of items){ const o=document.createElement('option'); o.value=k; o.textContent=k; sel.appendChild(o); }
    head.appendChild(title); head.appendChild(sel);
    wrap.appendChild(head);

    const panel = document.createElement('div'); panel.className='prop-subgroup'; panel.style.marginTop='8px'; wrap.appendChild(panel);

    const getLS = ()=> Object.assign({}, t.getProp('labelStyles')||{});
    const controls = [
      {key:'color', label:'Colore', render:(v)=>{ const inp=document.createElement('input'); inp.type='color'; inp.value=v||'#ffffff'; return inp; }},
      {key:'fontSize', label:'Dimensione (px)', render:(v)=>{ const inp=document.createElement('input'); inp.type='number'; inp.min='8'; inp.max='128'; inp.step='1'; inp.value=(v??16); return inp; }},
      {key:'fontWeight', label:'Peso', render:(v)=>{ const sel=document.createElement('select'); ['300','400','500','600','700','800','900'].forEach(w=>{ const o=document.createElement('option'); o.value=w; o.textContent=w; if(String(v||'400')===w) o.selected=true; sel.appendChild(o); }); return sel; }},
      {key:'italic', label:'Corsivo', render:(v)=>{ const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!v; return cb; }},
      {key:'letterSpacing', label:'Spaziatura (px)', render:(v)=>{ const inp=document.createElement('input'); inp.type='number'; inp.step='0.1'; inp.value=(v??0); return inp; }},
    ];

    const build = ()=>{
      panel.innerHTML='';
      const key = sel.value || items[0];
      if(!key){ panel.textContent='Aggiungi righe per configurare lo stile.'; return; }
      const ls = getLS(); const cur = Object.assign({},{...(ls[key]||{})});
      controls.forEach(cfg=>{
        const row=document.createElement('div'); row.className='prop-row'; 
        const lab=document.createElement('label'); lab.textContent=cfg.label; row.appendChild(lab);
        const input=cfg.render(cur[cfg.key]); input.style.marginLeft='auto';
        input.addEventListener('change', ()=>{ 
          const v = (input.type==='checkbox')? input.checked : (input.type==='number'? Number(input.value) : input.value);
          const next = getLS(); next[key] = Object.assign({}, next[key]||{}, {[cfg.key]: v});
          app.cmd.execute(new UpdatePropertyCommand([t], 'labelStyles', next, [t.getProp('labelStyles')]));
        });
        row.appendChild(input); panel.appendChild(row);
      });
    };

    sel.addEventListener('change', build);
    build();
    return wrap;
  }
}
TableLabelStyleProperty.type='table-label-style';
registry.registerProperty(TableLabelStyleProperty.type, TableLabelStyleProperty);
