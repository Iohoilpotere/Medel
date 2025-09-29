
import { ConditionBuilder } from './condition-builder.js';
import { ConditionGroup } from './model.js';
export class NextBuilder{
  constructor(ctx){ this.ctx=ctx; }
  mount(container, value){
    container.innerHTML=''; const root=document.createElement('div'); root.className='next-builder'; container.appendChild(root);
    const typeSel=document.createElement('select'); typeSel.innerHTML='<option value="sequential">Prosegui al successivo</option><option value="goto">Vai a…</option><option value="switch">Instradamento condizionato</option>';
    const section=document.createElement('div'); section.className='next-section'; root.appendChild(typeSel); root.appendChild(section);
    const state=Object.assign({type:'sequential'}, value||{}); typeSel.value=state.type;
    const renderSequential=()=>{ section.innerHTML='<div class="muted">Il prossimo step sarà il successivo disponibile.</div>'; };
    const renderGoto=()=>{ section.innerHTML=''; const sel=document.createElement('select'); (this.ctx.getSteps?.()||[]).forEach(s=>{ const o=document.createElement('option'); o.value=s.id; o.textContent=s.title||s.id; sel.appendChild(o); }); sel.value=state.target||(this.ctx.getSteps?.()[0]?.id||''); sel.addEventListener('change',()=> state.target=sel.value); section.appendChild(sel); state.target=sel.value; };
    const renderSwitch=()=>{ section.innerHTML=''; const casesWrap=document.createElement('div'); section.appendChild(casesWrap); const add=document.createElement('button'); add.className='btn sm'; add.textContent='+ Caso'; section.appendChild(add); const fbLab=document.createElement('div'); fbLab.textContent='Altrimenti:'; fbLab.style.marginTop='6px'; section.appendChild(fbLab); const fb=document.createElement('select'); section.appendChild(fb); const steps=(this.ctx.getSteps?.()||[]); steps.forEach(s=>{ const o=document.createElement('option'); o.value=s.id; o.textContent=s.title||s.id; fb.appendChild(o); }); fb.value=state.fallback||'sequential'; fb.addEventListener('change',()=> state.fallback=fb.value); state.cases=Array.isArray(state.cases)? state.cases:[];
      const redraw=()=>{ casesWrap.innerHTML=''; state.cases.forEach((c,idx)=>{ const row=document.createElement('div'); row.className='case-row'; const tgt=document.createElement('select'); steps.forEach(s=>{ const o=document.createElement('option'); o.value=s.id; o.textContent=s.title||s.id; tgt.appendChild(o); }); tgt.value=c.goto||steps[0]?.id||''; tgt.addEventListener('change',()=> c.goto=tgt.value); const condHost=document.createElement('div'); condHost.className='case-cond'; row.appendChild(condHost); const del=document.createElement('button'); del.className='btn sm danger'; del.textContent='✕'; del.addEventListener('click',()=>{ state.cases.splice(idx,1); redraw(); }); const builder=new ConditionBuilder(this.ctx); const api=builder.mount(condHost, c.if || new ConditionGroup('all',[])); c.if=api.getValue(); row.appendChild(tgt); row.appendChild(del); casesWrap.appendChild(row); }); };
      add.addEventListener('click',()=>{ state.cases.push({if:new ConditionGroup('all',[]), goto: steps[0]?.id || ''}); redraw(); }); redraw(); };
    const rerender=()=>{ if(typeSel.value==='sequential') renderSequential(); else if(typeSel.value==='goto') renderGoto(); else renderSwitch(); state.type=typeSel.value; };
    typeSel.addEventListener('change', rerender); rerender();
    return { getValue(){ return state; }, setValue(v){ Object.assign(state, v||{type:'sequential'}); rerender(); } };
  }
}
