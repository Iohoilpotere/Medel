
import { ConditionGroup, ConditionRule } from './model.js';

export class ConditionBuilder{
  constructor({getElements, getIndicators, getSteps}){
    this.getElements = getElements;
    this.getIndicators = getIndicators;
    this.getSteps = getSteps;
  }

  mount(container, value){
    container.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'cond-builder';
    container.appendChild(root);

    const group = value ? ConditionGroup.fromJSON(value) : new ConditionGroup('all', []);

    const rebuild = ()=>{
      root.innerHTML='';
      root.appendChild(renderGroup(group, 0, null));
    };

    const renderGroup = (g, level=0, parent=null)=>{
      const wrap = document.createElement('div');
      wrap.className = 'cond-group';
      wrap.style.marginLeft = (level*12)+'px';

      const header = document.createElement('div');
      header.className = 'cond-group-header';

      const opSel = document.createElement('select');
      opSel.innerHTML = '<option value="all">Tutte (AND)</option><option value="any">Almeno una (OR)</option>';
      opSel.value = g.op;
      opSel.addEventListener('change', ()=> g.op = opSel.value);

      const addRule = document.createElement('button'); addRule.className='btn sm'; addRule.textContent='+ Condizione';
      const addGrp  = document.createElement('button'); addGrp.className ='btn sm'; addGrp.textContent = '+ Gruppo';

      header.appendChild(opSel);
      header.appendChild(addRule);
      header.appendChild(addGrp);

      if(level>0){
        const delGrp = document.createElement('button');
        delGrp.className='btn sm danger';
        delGrp.textContent='✕';
        delGrp.title='Rimuovi gruppo';
        delGrp.addEventListener('click', ()=>{
          if(parent){
            const i = parent.rules.indexOf(g);
            if(i>=0){ parent.rules.splice(i,1); rebuild(); }
          }
        });
        header.appendChild(delGrp);
      }

      wrap.appendChild(header);

      const list = document.createElement('div');
      list.className='cond-list';
      wrap.appendChild(list);

      const getEls  = ()=> (this.getElements?.()||[]);
      const getInds = ()=> (this.getIndicators?.()||[]);
      const getStps = ()=> (this.getSteps?.()||[]);

      const renderRule = (r)=>{
        const row = document.createElement('div'); row.className='cond-row';

        // sorgente
        const srcSel = document.createElement('select');
        srcSel.innerHTML = '<option value="element">Elemento</option><option value="indicator">Indicatore</option><option value="step">Step</option>';
        srcSel.value = r.type || 'element';
        row.appendChild(srcSel);

        // ref
        const refSel = document.createElement('select');
        row.appendChild(refSel);

        // operatore
        const opSel2 = document.createElement('select');
        row.appendChild(opSel2);

        // valore contestuale (se serve)
        const valWrap = document.createElement('span');
        row.appendChild(valWrap);

        // elimina regola
        const del = document.createElement('button'); del.className='btn sm danger'; del.textContent='✕';
        row.appendChild(del);

        del.addEventListener('click', ()=>{
          const idx = g.rules.indexOf(r);
          if(idx>=0){ g.rules.splice(idx,1); rebuild(); }
        });

        
        const refreshRef = ()=>{
          refSel.innerHTML='';
          let items = [];
          if(srcSel.value==='element'){
            const els = (this.getElements?.()||[]);
            items = els.map((e, idx)=>{
              const id = (e && (e.id || e.name)) ? (e.id || e.name) : ('idx:'+idx);
              const name = (e && (e.name || e.type)) ? (e.name || e.type) : ('element '+idx);
              const type = (e && (e.type || (e.constructor && e.constructor.name))) 
                            ? ((e.type) || (e.constructor.name.replace(/Element$/,'').toLowerCase()))
                            : 'element';
              return { id, name, type, _idx: idx };
            });
          } else if(srcSel.value==='indicator'){
            items = (this.getIndicators?.()||[]).map(i=>({id:i.id, name:(i.name||i.id), type:'indicator'}));
          } else {
            items = (this.getSteps?.()||[]).map(s=>({id:s.id, name:(s.title||s.id), type:'step'}));
          }
          if(items.length===0){
            const o=document.createElement('option'); o.value=''; o.textContent='—'; refSel.appendChild(o);
          }else{
            for(const it of items){
              const o=document.createElement('option'); o.value=it.id; o.textContent=it.name; refSel.appendChild(o);
            }
          }
          refSel.value = r.ref || (items[0]?.id || '');
          r.ref = refSel.value;
          refreshOps();
        };
const addValueInput = (type)=>{
          const i=document.createElement('input');
          i.type = type;
          i.style.minWidth='160px';
          i.value = (r.pred?.value ?? '');
          i.addEventListener('input', ()=>{
            r.pred.value = (type==='number' ? Number(i.value) : i.value);
          });
          valWrap.appendChild(i);
        };

        const addValueSelect = (opts)=>{
          const s=document.createElement('select');
          for(const opt of (opts||[])){
            const o=document.createElement('option'); o.value=String(opt); o.textContent=String(opt); s.appendChild(o);
          }
          s.value = String(r.pred?.value ?? (opts?.[0] ?? ''));
          s.addEventListener('change', ()=>{ r.pred.value = s.value; });
          valWrap.appendChild(s);
        };

        const syncPred = ()=>{
          const k = opSel2.value;
          r.type = srcSel.value;
          r.ref = refSel.value;
          r.pred = r.pred || {kind:k, value:null};
          r.pred.kind = k;
        };

        const refreshOps = ()=>{
          opSel2.innerHTML='';
          valWrap.innerHTML='';
          const kind = srcSel.value;

          const addOps = (pairs)=>{
            for(const [v,lab] of pairs){
              const o=document.createElement('option'); o.value=v; o.textContent=lab; opSel2.appendChild(o);
            }
          };

          if(kind==='element'){
            let found = getEls().find(e=> e.id===refSel.value);
          if(!found){ const i = (refSel.value||'').startsWith('idx:') ? Number((refSel.value||'').split(':')[1]||0) : -1; if(i>=0) found = getEls()[i]; }
            const t = found?.type;
            // SOLO "Interagito" e "Uguale" come richiesto
            addOps([['interacted','Interagito'], ['equals','Uguale']]);
            const current = r.pred?.kind || 'interacted';
            opSel2.value = current;
            if(current==='equals'){
              if(t==='radiogroup' || t==='checkboxgroup'){
                addValueSelect(((typeof found.getProp==='function')?found.getProp('items'):found.items) || []);
              }else if(t==='textbox' || t==='label'){
                addValueInput('text');
              }else{
                addValueInput('text');
              }
            }
          }else if(kind==='indicator'){
            addOps([['gt','>'],['gte','≥'],['equals','='],['lte','≤'],['lt','<'],['notEquals','≠']]);
            opSel2.value = r.pred?.kind || 'equals';
            addValueInput('number');
          }else{ // step
            addOps([['visited','visitato'],['completed','completato'],['readonly','in sola lettura']]);
            opSel2.value = r.pred?.kind || 'visited';
          }
          syncPred();
        };

        srcSel.addEventListener('change', ()=>{ r.type=srcSel.value; refreshRef(); });
        refSel.addEventListener('change', ()=>{ r.ref=refSel.value; refreshOps(); });
        opSel2.addEventListener('change', ()=>{ syncPred(); refreshOps(); });

        // defaults
        if(!r.type) r.type = 'element';
        if(!r.pred) r.pred = { kind:'interacted', value:null };

        refreshRef();
        return row;
      };

      const redraw = ()=>{
        list.innerHTML='';
        for(const rule of g.rules){
          if(rule && rule.op){ list.appendChild(renderGroup(rule, level+1, g)); }
          else { list.appendChild(renderRule(rule)); }
        }
      };

      addRule.addEventListener('click', ()=>{
        g.rules.push(new ConditionRule('element', '', {kind:'interacted', value:null}));
        redraw();
      });
      addGrp.addEventListener('click', ()=>{
        g.rules.push(new ConditionGroup('all', []));
        redraw();
      });

      redraw();
      return wrap;
    };

    rebuild();

    return {
      getValue(){ return group; },
      setValue(v){
        const g = ConditionGroup.fromJSON(v);
        container.innerHTML='';
        const r = document.createElement('div'); r.className='cond-builder'; container.appendChild(r);
        const mount = (gg)=> r.appendChild(renderGroup(gg || new ConditionGroup('all',[]), 0, null));
        mount(g);
      }
    };
  }
}
