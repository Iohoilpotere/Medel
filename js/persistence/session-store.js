// Facade di persistenza per MEDEL (ESM)
import CONFIG from '../config/app-config.js';
const NS = CONFIG.STORAGE_NAMESPACE;

function keyFor(project){ const pid = (project?.meta?.id) || 'project'; return `${NS}/${pid}`; }
function loadAll(project){
  try{ const raw = localStorage.getItem(keyFor(project)); if(!raw) return {version:1, steps:{}};
    const obj = JSON.parse(raw); return (obj && obj.version===1)? obj : {version:1, steps:{}};
  }catch{ return {version:1, steps:{}}; }
}
function saveAll(project, store){ localStorage.setItem(keyFor(project), JSON.stringify(store)); }

function collectValues(root){
  const res={}; if(!root) return res;
  root.querySelectorAll('input,select,textarea').forEach((inp, idx)=>{
    const id = inp.getAttribute('data-id') || inp.name || `${idx}`;
    if(inp.type==='checkbox') res[id]=!!inp.checked;
    else if(inp.type==='radio'){ if(inp.checked) res[id]=inp.value; }
    else res[id]=inp.value;
  }); return res;
}
function applyValues(root, values){
  if(!root || !values) return;
  const set=(inp, v)=>{
    if(inp.type==='checkbox') inp.checked=!!v;
    else if(inp.type==='radio') inp.checked=(inp.value===v);
    else inp.value = v ?? '';
    inp.dispatchEvent(new Event('input', {bubbles:true}));
    inp.dispatchEvent(new Event('change', {bubbles:true}));
  };
  Object.entries(values).forEach(([id,v])=>{
    root.querySelectorAll(`[data-id="${id}"],[name="${id}"]`).forEach(inp=>set(inp, v));
  });
}
export async function saveSession(project, stepIndex, stageRoot){
  const store = loadAll(project); const key = String(stepIndex);
  store.steps[key] = { confirmed:true, ts: Date.now(), elements: collectValues(stageRoot) };
  saveAll(project, store); return store;
}
export async function applySession(project, stepIndex, stageRoot){
  const store = loadAll(project); const key = String(stepIndex);
  const rec = store.steps[key]; if(rec?.elements) applyValues(stageRoot, rec.elements);
  return rec || null;
}
