
export function evalGroup(group, ctx){
  if(!group) return true;
  const op = group.op || 'all';
  const results = (group.rules||[]).map(r => r && r.op ? evalGroup(r, ctx) : evalRule(r, ctx));
  return op==='all' ? results.every(Boolean) : results.some(Boolean);
}
export function evalRule(rule, ctx){
  if(!rule) return true;
  const {type, ref, pred={}} = rule;
  if(type==='indicator'){ const v = Number((ctx.indicators||{})[ref]); return cmp(v, pred.kind, pred.value); }
  if(type==='step'){ const st = (ctx.stepsState||{})[ref]||{}; if(pred.kind==='visited') return !!st.visited; if(pred.kind==='completed') return !!st.completed; if(pred.kind==='readonly') return !!st.readOnly; return false; }
  const v = (ctx.values||{})[ref];
  if(pred.kind==='interacted') return Object.prototype.hasOwnProperty.call((ctx.values||{}), ref);
  const k = pred.kind;
  if(k==='checked:true') return !!v===true;
  if(k==='checked:false') return !!v===false;
  if(k==='notEmpty') return v!=null && String(v).trim()!=='';
  if(k==='equals') return v==pred.value;
  if(k==='notEquals') return v!=pred.value;
  if(k==='includes') return Array.isArray(v) && v.includes(pred.value);
  if(k==='notIncludes') return Array.isArray(v) && !v.includes(pred.value);
  if(k==='atLeast') return Array.isArray(v) && v.length>=Number(pred.value||0);
  if(k==='exactly') return Array.isArray(v) && v.length===Number(pred.value||0);
  return cmp(Number(v), k, Number(pred.value));
}
function cmp(v, op, rhs){ if(Number.isNaN(v) || v==null) return false;
  if(op==='gt') return v>rhs; if(op==='gte') return v>=rhs; if(op==='lt') return v<rhs; if(op==='lte') return v<=rhs; if(op==='equals') return v==rhs; if(op==='notEquals') return v!=rhs; return false; }
