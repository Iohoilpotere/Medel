
// New computeUnlockedCount using Strategy
function computeUnlockedCount(flatSteps, state, project){
  return computeUnlockedCountWithStrategy(flatSteps, state, project, createUnlockStrategy);
}

import { computeUnlockedCountWithStrategy, createUnlockStrategy } from './js/strategies/unlock-strategies.js';
import { saveSession, applySession } from './js/persistence/session-store.js';
import CONFIG from './js/config/app-config.js';
import { registry, loadModules } from './js/core/registry.js';
import { Stage } from './js/stage/stage.js';
const qs = (k) => new URLSearchParams(location.search).get(k);

// Minimal global updater for viewer buttons (labels + visibility + disabled)
function applyButtons(step){
  const nextBtn = document.getElementById('btnNext');
  const confirmBtn = document.getElementById('btnConfirm');
  const btns = (step && step.buttons) || {};
  const showConfirm = !!btns.showConfirm;
  const nextLabel = btns.nextLabel || 'Avanti';
  const confirmLabel = btns.confirmLabel || 'Conferma';
  if(nextBtn){ nextBtn.textContent = nextLabel; nextBtn.disabled = !!showConfirm; }
  if(confirmBtn){
    confirmBtn.textContent = confirmLabel;
    confirmBtn.style.display = showConfirm ? '' : 'none';
  }
}
// --- Unlock helpers ---
function getIndicatorValue(project){
  try{
    const indicators = Array.isArray(project.indicators) ? project.indicators : [];
    // If present, prefer the indicator named 'value' (case-insensitive), else first numeric value.
    const named = indicators.find(i => String(i.name||'').toLowerCase() === 'value');
    const cand = named || indicators.find(i => typeof i.value === 'number');
    const v = cand && typeof cand.value === 'number' ? cand.value : 0;
    return v;
  }catch(e){ return 0; }
}

function computeUnlockedCount_legacy(flatSteps, state, project){
  // First step always unlocked
  let unlocked = 1;
  const total = flatSteps.length;
  const indVal = getIndicatorValue(project);
  for(let i=1; i<total; i++){
    const step = flatSteps[i].step || {};
    const unlock = (step.unlock||{});
    const mode = unlock.mode || 'viewPrev';
    const val = Number(unlock.threshold)||0;
    const prev = state.stepsState?.[i-1] || {};
    let ok = false;
    if(mode === 'confirmPrev') ok = !!prev.confirmed;
    else if(mode === 'viewPrev') ok = !!prev.viewed;
    else if(mode === 'indicatorGte') ok = (indVal >= val);
    else if(mode === 'indicatorLte') ok = (indVal <= val);
    else ok = !!prev.viewed;
    if(ok) unlocked = Math.max(unlocked, i+1);
    else break; // stop contiguous chain
  }
  return unlocked;
}

function resolveUrl(p){
  try{
    if(/^https?:\/\//i.test(p)) return p;
    return new URL(p, location.href).toString();
  }catch(e){ return null; }
}

async function loadProject(){
  const src = qs('project') || qs('src') || './project.json';
  const url = resolveUrl(src);
  const res = await fetch(url, { cache:'no-store' });
  if(!res.ok){
    const t = await res.text();
    throw new Error('Impossibile caricare il progetto: '+url+'\n'+t.slice(0,200));
  }
  return await res.json();
}

function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }

function baseSizeForAspect(aspect){
  const map = {'16:9':[1280,720], '9:16':[720,1280], '4:3':[1200,900]};
  return map[aspect] || map['16:9'];
}
function fitStageWidth(stage, host){
  const apply = ()=>{
    const rect = host.getBoundingClientRect();
    const availW = rect.width;
    const availH = rect.height;
    const [bw,bh] = baseSizeForAspect(stage.aspect || '16:9');
    const zW = availW / bw;
    const zH = availH / bh;
    const z = Math.max(0.1, Math.min(zW, zH)); // contain
    stage.setZoom(z);
  };
  apply();
  requestAnimationFrame(apply);
}



function renderIndicators(bar, project){
  if(project && project.indicatorsVisible === false) return;
  bar.innerHTML='';
  const indicators = Array.isArray(project.indicators)? project.indicators : [];
  for(const ind of indicators){
    if(ind && ind.visible===false) continue;
    const item = el('div','indicator tooltip');
    const avatar = el('div','avatar');
    if(ind.image) avatar.style.backgroundImage = `url("${ind.image}")`;
    const val = el('div','val');
    const pref = el('span','pref'); pref.textContent = ind.prefix||'';
    const value = el('span','value'); value.textContent = (ind.value!=null? ind.value : '-');
    const suf = el('span','suf'); suf.textContent = ind.suffix||'';
    const tip = el('div','tip'); tip.textContent = ind.name||'';
    item.appendChild(avatar); val.appendChild(pref); val.appendChild(value); val.appendChild(suf);
    item.appendChild(val); item.appendChild(tip);
    bar.appendChild(item);
  }
}
function renderFlags(bar, project){
  if(!project || project.flagsVisible === false) return; // guarded by visibility flag
  const flags = Array.isArray(project.flags)? project.flags : [];
  for(const fl of flags){
    if(fl && fl.visible===false) continue;
    const item = el('div','indicator flag tooltip');
    const avatar = el('div','avatar');
    if(fl.image) avatar.style.backgroundImage = `url("${fl.image}")`;
    // grayscale when false
    if(!fl.value){ avatar.style.filter = 'grayscale(1) opacity(0.6)'; }
    const val = el('div','val');
    const nameInline = el('span','name-inline'); nameInline.textContent = fl.name||'';
    const tip = el('div','tip'); tip.textContent = fl.name||'';
    item.appendChild(avatar); item.appendChild(nameInline); item.appendChild(tip);
    bar.appendChild(item);
  }
}



function buildFlatSteps(project){
  const out = [];
  const src = Array.isArray(project.steps)? project.steps : [];
  const walk = (arr, depth=0)=>{
    for(const node of arr){
      if(node.type==='category' && Array.isArray(node.children)){
        out.push({ category: true, title: node.title || 'Categoria', depth });
        walk(node.children, depth+1);
      }else if(node.type==='step'){
        out.push({ step: node, depth });
      }
    }
  };
  walk(src, 0);
  return { list: out };
}


function renderStepsList(listEl, project, currentIndex, onSelect, unlockedCount=1){
  const { list } = buildFlatSteps(project);
  listEl.innerHTML = '';
  let stepIdx = -1;
  list.forEach(node => {
    if(node.category){
      const h = document.createElement('div');
      h.textContent = node.title;
      h.style.opacity = .8;
      h.style.padding = '10px 8px 4px';
      h.style.fontWeight = '700';
      h.style.paddingLeft = (8 + node.depth*14) + 'px';
      listEl.appendChild(h);
    }else if(node.step){
      stepIdx += 1;
      const idx = stepIdx;
      const b = document.createElement('button');
      b.className = 'step' + (idx===currentIndex ? ' active' : '');
      const label = node.step.title || ('Step ' + (idx+1));
      const locked = idx >= unlockedCount;
      b.style.marginLeft = (8 + node.depth*14) + 'px';
      b.innerHTML = (locked ? '🔒 ' : '') + label;
      if(locked){ b.disabled = true; }
      b.addEventListener('click', () => { if(!locked) onSelect(idx); });
      listEl.appendChild(b);
    }
  });
}

function neutralizeEditor(stage){
  stage.el.addEventListener('mousedown', (e)=>{
    if(!e.target.closest('.element')){
      e.stopPropagation();
    }
  }, true);
  stage.el.addEventListener('dblclick', (e)=>{ e.stopPropagation(); }, true);
  const sel = stage.el.querySelector('.selection, .selRect, .sel-rect');
  if(sel) sel.style.display='none';
}
function hydrateElementForView(elmt){
  try{
    elmt.dom.querySelectorAll('.handles, .delete').forEach(n=> n.remove());
    elmt.dom.addEventListener('mousedown', (e)=>{ e.stopPropagation(); }, true);
    elmt.dom.addEventListener('touchstart', (e)=>{ e.stopPropagation(); }, {capture:true, passive:true});
    elmt.dom.style.cursor = 'auto';
    elmt.dom.querySelectorAll('input,select,textarea,button,label,a').forEach(n=>{
      n.addEventListener('mousedown', (e)=> e.stopPropagation(), true);
    });
  }catch{}
}
function setStageStep(stage, step){
  try{ applyButtons(step); }catch(e){}
  stage.aspect = step.aspect || stage.aspect;
  stage.bgUrl = step.bgUrl || '';
  stage._applyAspect?.();
  stage._updateBg?.();

  for(const e of (step.elements||[])){
    const Cls = registry.elements.get(e.type);
    if(!Cls) continue;
    const elmt = Cls.fromJSON(e);
    stage.addElement(elmt);
    elmt.setSelected(false);
    hydrateElementForView(elmt);
  }
}

async function main(){
  await loadModules();
  let project=null; try{const s=sessionStorage.getItem('viewer_project'); if(s){project=JSON.parse(s); sessionStorage.removeItem('viewer_project');}}catch(e){}
  if(!project){ const tmp = await loadProject(); project=tmp; }

  const left = document.querySelector('.viewer .left');
  const rootViewer = document.querySelector('.viewer');
  const list = document.querySelector('.viewer .steps');
  const collapseBtn = document.getElementById('collapseSteps');
  const indicatorsBar = document.getElementById('indicatorsBar');
  const canvasHost = document.getElementById('viewerStage');
  const nextBtn = document.getElementById('btnNext');
  const confirmBtn = document.getElementById('btnConfirm');
  let confirmedForStep = false;
  let curStage = null;


  const { list: flatAll } = buildFlatSteps(project);
  const flatSteps = flatAll.filter(n=>n.step);
  let idx = 0; const state={values:{},indicators:{},stepsState:{},unlocked:new Set([0])};

  if(nextBtn){
    nextBtn.addEventListener('click', ()=>{
      const unlockedCount = computeUnlockedCount(flatSteps, state, project);
      if(idx+1 < unlockedCount){ idx += 1; refresh(); }
      else if(idx < flatSteps.length-1){ /* locked: ignore click */ }
      else { try{ showResults(); }catch(e){} }
    });
  }
  if(confirmBtn){
    confirmBtn.addEventListener('click', ()=>{
      confirmedForStep = true;
            // MEDEL PERSIST v3: save values for this step
      try{ MedelPersistence && MedelPersistence.saveOnConfirm && MedelPersistence.saveOnConfirm(project, idx, (curStage || stage)); }catch(e){ console.error('[MEDEL][PERSIST][v3] save error', e); }
state.stepsState[idx] = Object.assign({}, state.stepsState[idx], { confirmed:true });
      try{ (curStage?.bus||stage.bus).emit('step-confirmed', { index: idx }); }catch(_e){}
      // lock whole step if configured
      try{
        const stp = flatSteps[idx].step || {};
        if(stp.lockOnConfirmStep && curStage && curStage.el){ curStage.el.dataset.locked='1'; (curStage.bus||stage.bus).emit('step-locked', { index: idx }); }
      }catch(_e){}
      if(nextBtn) nextBtn.disabled = false;
      renderStepsList(list, project, idx, (i)=>{ idx=i; refresh(); }, computeUnlockedCount(flatSteps, state, project));
    });
  }



  // initial stage
  const stage = new Stage(canvasHost, { gridSize:16, aspect: (flatSteps?.[0]?.step?.aspect)||'16:9' });
  curStage = stage;
  stage.el.classList.add('stageHost');
  neutralizeEditor(stage);
  fitStageWidth(stage, canvasHost);
  window.addEventListener('resize', ()=> fitStageWidth(stage, canvasHost));
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>fitStageWidth(stage, canvasHost)); ro.observe(canvasHost);}
  fitStageWidth(stage, canvasHost);
  window.addEventListener('resize', ()=> fitStageWidth(stage, canvasHost));
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>fitStageWidth(stage, canvasHost)); ro.observe(canvasHost);}

  renderIndicators(indicatorsBar, project);
  renderFlags(indicatorsBar, project);
  state.stepsState[idx] = Object.assign({}, state.stepsState[idx], { viewed:true });
  try{ stage.bus.emit('step-state', { confirmed: !!(state.stepsState[idx] && state.stepsState[idx].confirmed), lockOnConfirm: !!(flatSteps[idx].step && flatSteps[idx].step.lockOnConfirmStep) }); }catch(_e){}
  setTimeout(()=>{ try{ (curStage?.bus||stage.bus).emit('step-state', { confirmed: !!(state.stepsState[idx]?.confirmed), lockStep: !!(flatSteps[idx]?.step && flatSteps[idx].step.lockOnConfirmStep) }); }catch(_e){} }, 50);
  renderStepsList(list, project, idx, (i)=>{ idx=i; refresh(); }, computeUnlockedCount(flatSteps, state, project));
  collapseBtn.addEventListener('click', ()=>{ 
    left.classList.toggle('collapsed');
    rootViewer.classList.toggle('collapsed-left');
    collapseBtn.textContent = left.classList.contains('collapsed') ? '≫' : '≪';
    setTimeout(()=>window.dispatchEvent(new Event('resize')), 0);
  });

  function refresh(){
    canvasHost.innerHTML='';
    const s2 = new Stage(canvasHost, { gridSize:16, aspect: (flatSteps?.[idx]?.step?.aspect)||'16:9' });
    curStage = s2;
    s2.el.classList.add('stageHost');
    neutralizeEditor(s2);
    setStageStep(s2, flatSteps[idx].step);
        // MEDEL PERSIST v3: apply saved values for this step
    try{ MedelPersistence && MedelPersistence.applyForStep && MedelPersistence.applyForStep(project, idx, s2); }catch(e){ console.error('[MEDEL][PERSIST][v3] apply (refresh) error', e); }
state.stepsState[idx] = Object.assign({}, state.stepsState[idx], { viewed:true });
    try{ (curStage?.bus||s2.bus).emit('step-state', { confirmed: !!(state.stepsState[idx] && state.stepsState[idx].confirmed), lockOnConfirm: !!(flatSteps[idx].step && flatSteps[idx].step.lockOnConfirmStep) }); }catch(_e){}
    setTimeout(()=>{ try{ (curStage?.bus||stage.bus).emit('step-state', { confirmed: !!(state.stepsState[idx]?.confirmed), lockStep: !!(flatSteps[idx]?.step && flatSteps[idx].step.lockOnConfirmStep) }); }catch(_e){} }, 50);
    fitStageWidth(s2, canvasHost);
    window.addEventListener('resize', ()=> fitStageWidth(s2, canvasHost));
    if(window.ResizeObserver){ const ro2=new ResizeObserver(()=>fitStageWidth(s2, canvasHost)); ro2.observe(canvasHost);}
    renderStepsList(list, project, idx, (i)=>{ idx=i; refresh(); }, computeUnlockedCount(flatSteps, state, project));
  }
  function showResults(){
    const overlay = el('div');
    overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.background='rgba(0,0,0,0.6)'; overlay.style.backdropFilter='blur(2px)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
    const card = el('div');
    card.style.background='#111'; card.style.border='1px solid rgba(255,255,255,.15)'; card.style.borderRadius='12px'; card.style.padding='16px'; card.style.width='min(900px,92vw)'; card.style.maxHeight='80vh'; card.style.overflow='auto';
    const h = el('h2'); h.textContent='Risultati'; h.style.margin='0 0 12px 0';
    const ul = el('ul'); ul.style.listStyle='none'; ul.style.padding='0';
    (project.steps||[]).forEach((st,i)=>{ const li=el('li'); li.style.padding='8px 0'; li.textContent = `Step ${i+1}: ${st.title||''}`; ul.appendChild(li); });
    const close = el('button'); close.textContent='Chiudi'; close.className='btn'; close.style.marginTop='12px';
    close.addEventListener('click', ()=> overlay.remove());
    card.appendChild(h); card.appendChild(ul); card.appendChild(close);
    overlay.appendChild(card); document.body.appendChild(overlay);
  }

  setStageStep(stage, flatSteps?.[idx]?.step || {elements:[]});
  try{ MedelPersistence && MedelPersistence.applyForStep && MedelPersistence.applyForStep(project, idx, stage); }catch(e){ console.error('[MEDEL][PERSIST][v3] apply (init) error', e); }
  state.stepsState[idx] = Object.assign({}, state.stepsState[idx], { viewed:true });
  try{ (curStage?.bus||stage.bus).emit('step-state', { confirmed: !!(state.stepsState[idx] && state.stepsState[idx].confirmed), lockOnConfirm: !!(flatSteps[idx].step && flatSteps[idx].step.lockOnConfirmStep) }); }catch(_e){}
  setTimeout(()=>{ try{ (curStage?.bus||stage.bus).emit('step-state', { confirmed: !!(state.stepsState[idx]?.confirmed), lockStep: !!(flatSteps[idx]?.step && flatSteps[idx].step.lockOnConfirmStep) }); }catch(_e){} }, 50);
  renderStepsList(list, project, idx, (i)=>{ idx=i; refresh(); }, computeUnlockedCount(flatSteps, state, project));
}

main().catch(err=>{
  console.error(err);
  const pre = document.createElement('pre'); pre.textContent = err?.stack || String(err);
  pre.style.whiteSpace='pre-wrap'; pre.style.padding='12px'; pre.style.color='#ffb4b4';
  document.body.appendChild(pre);
});



// ===== MEDEL PERSISTENCE MODULE (v5 — MODEL-BASED, SESSION ONLY) =====
/* Usa Stage.elements invece del solo DOM scanning.
 * Tipi gestiti:
 *  - checkboxgroup (values: indici)  -> salva boolean[] (cg:<id>)
 *  - checkbox (singola/switch, via DOM) -> salva boolean (chk:<id>)
 *  - radiogroup (value: indice)      -> salva int (rg:<id>)
 *  - tablecheck (values: keys)       -> salva boolean[] sull'ordine di items (tbl:<id>)
 *  - textbox (value: string)         -> salva string (txt:<id>)
 */
(function initMedelPersistenceV5(global){
  const NS = 'medel:viewer:session:v1';

  const hasStage = (x)=> !!(x && Array.isArray(x.elements));
  const $$ = (root,sel)=> Array.from(root.querySelectorAll(sel));
  const keyOfEl = (el, prefix)=> `${prefix}${el.getProp && el.getProp('id') || el.getProp && el.getProp('name') || el.dom && (el.dom.id||'')}`;

  function getProjectKey(project){
    const p = project || {};
    const id = p.uid || p.id || p.title || p.name || (typeof location !== 'undefined' ? location.pathname : 'default');
    return `${NS}:${String(id)}`;
  }
  function loadAll(project){
    try{
      const raw = sessionStorage.getItem(getProjectKey(project));
      return raw ? JSON.parse(raw) : { steps: {} };
    }catch(e){
      console.error('[MEDEL][PERSIST][v5] loadAll error', e);
      return { steps: {} };
    }
  }
  function saveAll(project, data){
    try{
      sessionStorage.setItem(getProjectKey(project), JSON.stringify(data));
      return true;
    }catch(e){
      console.error('[MEDEL][PERSIST][v5] saveAll error', e);
      return false;
    }
  }

  function collectValues(stageOrRoot){
    const elements = {};
    if(hasStage(stageOrRoot)){
      const stage = stageOrRoot;
      for(const el of stage.elements){
        const type = (el.constructor && el.constructor.type) || el.type;
        if(!type) continue;

        if(type === 'checkboxgroup'){
          const items = Array.isArray(el.getProp('items'))? el.getProp('items'):[];
          const selectedIdx = new Set(Array.isArray(el.getProp('values'))? el.getProp('values'):[]);
          const arr = items.map((_,i)=> selectedIdx.has(i));
          elements[keyOfEl(el,'cg:')] = { t:'checkboxgroup', v: arr };
        }
        else if(type === 'checkbox'){
          // via DOM: single input checkbox
          const chk = el.content && el.content.querySelector ? el.content.querySelector('input[type=checkbox]') : null;
          if(chk){
            elements[keyOfEl(el,'chk:')] = { t:'checkbox', v: !!chk.checked };
          }
        }
        else if(type === 'radiogroup'){
          const idx = Number.isInteger(el.getProp('value')) ? el.getProp('value') : -1;
          elements[keyOfEl(el,'rg:')] = { t:'radiogroup', v: idx };
        }
        else if(type === 'tablecheck'){
          const items = Array.isArray(el.getProp('items'))? el.getProp('items'):[];
          const selectedKeys = new Set(Array.isArray(el.getProp('values'))? el.getProp('values'):[]);
          const arr = items.map(k=> selectedKeys.has(k));
          elements[keyOfEl(el,'tbl:')] = { t:'tablecheck', v: arr };
        }
        else if(type === 'textbox'){
          const txt = (el.getProp && el.getProp('value')) ?? '';
          elements[keyOfEl(el,'txt:')] = { t:'textbox', v: String(txt ?? '') };
        }
      }
    } else {
      // Fallback DOM (rare)
      const root = stageOrRoot;
      $$ (root, 'input[type=checkbox]').forEach((n,i)=>{
        const k = n.id || n.name || `chk#${i}`;
        elements[k] = { t:'checkbox', v: !!n.checked };
      });
    }
    return elements;
  }

  function dispatchChanged(el){
  try{ el.dispatchEvent(new Event('input', { bubbles:true })); }catch(e){}
  try{ el.dispatchEvent(new Event('change', { bubbles:true })); }catch(e){}
}


  function applyValues(stageOrRoot, elements){
    if(hasStage(stageOrRoot)){
      const stage = stageOrRoot;
      for(const el of stage.elements){
        const type = (el.constructor && el.constructor.type) || el.type;
        if(!type) continue;
        const k = keyOfEl(el, (type==='checkboxgroup'?'cg:': type==='checkbox'?'chk:': type==='radiogroup'?'rg:': type==='tablecheck'?'tbl:': type==='textbox'?'txt:':''));
        const rec = elements[k];
        if(!rec) continue;

        if(type === 'checkboxgroup' && Array.isArray(rec.v)){
          // convert boolean[] -> indices
          const idxs = rec.v.map((b,i)=> !!b ? i : -1).filter(i=> i>=0);
          el.setProp && el.setProp('values', idxs, {silent:true});
          // sync DOM
          const boxes = el.content ? el.content.querySelectorAll('input[type=checkbox]') : [];
          if(boxes && boxes.forEach){
            boxes.forEach((bx,i)=>{
              const want = !!rec.v[i];
              if(!!bx.checked !== want){ bx.checked = want; dispatchChanged(bx); }
            });
          }
        }
        else if(type === 'checkbox' && typeof rec.v === 'boolean'){
          const chk = el.content && el.content.querySelector ? el.content.querySelector('input[type=checkbox]') : null;
          if(chk && !!chk.checked !== !!rec.v){ chk.checked = !!rec.v; dispatchChanged(chk); }
        }
        else if(type === 'radiogroup' && Number.isInteger(rec.v)){
          el.setProp && el.setProp('value', rec.v, {silent:true});
          const radios = el.content ? el.content.querySelectorAll('input[type=radio]') : [];
          if(radios && radios.forEach){
            radios.forEach((r,i)=>{ const want = i===rec.v; if(!!r.checked !== want){ r.checked = want; dispatchChanged(r); } });
          }
        }
        else if(type === 'tablecheck' && Array.isArray(rec.v)){
          // boolean[] -> keys
          const items = Array.isArray(el.getProp('items'))? el.getProp('items'):[];
          const keys = items.filter((_,i)=> !!rec.v[i]);
          el.setProp && el.setProp('values', keys, {silent:true});
          const boxes = el.content ? el.content.querySelectorAll('input[type=checkbox]') : [];
          if(boxes && boxes.forEach){
            boxes.forEach((bx,i)=>{ const want = !!rec.v[i]; if(!!bx.checked !== want){ bx.checked = want; dispatchChanged(bx); } });
          }
          // fire specialized event (if someone listens)
          try{ el.dom && el.dom.dispatchEvent(new CustomEvent('tablecheck:restored', {bubbles:true, detail:{ key:k, values: rec.v }})); }catch{}
        }
        else if(type === 'textbox'){
          el.setProp && el.setProp('value', rec.v, {silent:true});
          const inp = el.content ? el.content.querySelector('input[type=text],input[type=search],input[type=number],textarea') : null;
          if(inp && String(inp.value ?? '') !== String(rec.v ?? '')){ inp.value = String(rec.v ?? ''); dispatchChanged(inp); }
        }
      }
    } else {
      // fallback DOM (rare)
      const root = stageOrRoot;
      Object.entries(elements).forEach(([k,rec])=>{
        if(rec.t==='checkbox'){
          const n = root.querySelector(`#${CSS.escape(k)}, [name="${CSS.escape(k)}"]`);
          if(n){ const want = !!rec.v; if(!!n.checked !== want){ n.checked = want; dispatchChanged(n); } }
        }
      });
    }
  }

  function saveOnConfirm(project, stepIndex, stageOrRoot){
    const store = loadAll(project);
    const key = String(stepIndex);
    const elements = collectValues(stageOrRoot);
    store.steps[key] = { confirmed:true, ts: Date.now(), elements };
    saveAll(project, store);
    try{
      console.debug('[MEDEL][PERSIST][v5][SAVE][SESSION]', { step: key, confirmed: true });
      console.debug('[MEDEL][PERSIST][v5][JSON][SESSION]\\n' + JSON.stringify(store, null, 2));
    }catch{}
    return store;
  }

  function applyForStep(project, stepIndex, stageOrRoot){
  try{
    const store = loadAll(project);
    const key = String(stepIndex);
    const rec = store.steps[key];
    if(rec && rec.elements){
      // Immediate apply
      applyValues(stageOrRoot, rec.elements);
      // Deferred kicks to beat rendering races
      const root = hasStage(stageOrRoot) ? (stageOrRoot.el || stageOrRoot.stageEl || stageOrRoot) : stageOrRoot;
      const kicks = [0, 16, 60, 120, 240];
      kicks.forEach(ms => setTimeout(()=>{
        try{
          applyValues(stageOrRoot, rec.elements);
          if(root && root.querySelectorAll){
            const inputs = root.querySelectorAll('input[type=checkbox],input[type=radio]');
            inputs.forEach(inp => {
              try{ inp.dispatchEvent(new Event('input', { bubbles:true })); }catch(_){}
              try{ inp.dispatchEvent(new Event('change', { bubbles:true })); }catch(_){}
            });
          }
        }catch(_){}
      }, ms));
    }
    return rec || null;
  }catch(_){
    return null;
  }
}
global.MedelPersistence = { saveOnConfirm, applyForStep, _collect: collectValues, _apply: applyValues, _load: loadAll, _save: saveAll };
})(window);
// ===== END MEDEL PERSISTENCE MODULE =====
// NOTE: integrate saveSession/applySession at step load/confirm handlers.
