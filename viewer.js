
import { computeUnlockedCountWithStrategy, createUnlockStrategy } from './js/strategies/unlock-strategies.js';
import { saveSession, applySession } from './js/persistence/session-store.js';
import CONFIG from './js/config/app-config.js';
import { registry, loadModules } from './js/core/registry.js';
import { Stage } from './js/stage/stage.js';

// New computeUnlockedCount using Strategy
function computeUnlockedCount(flatSteps, state, project){
  return computeUnlockedCountWithStrategy(flatSteps, state, project, createUnlockStrategy);
}
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
      const effectiveStage = (curStage || stage);

      // Persist current step selections for MedelPersistence v5
      try{
        if(typeof MedelPersistence !== 'undefined' &&
           MedelPersistence &&
           typeof MedelPersistence.saveOnConfirm === 'function'){
          MedelPersistence.saveOnConfirm(project, idx, effectiveStage);
        }
      }catch(e){
        try{ console.error('[MEDEL][PERSIST][v5] saveOnConfirm error', e); }catch(_e){}
      }

      confirmedForStep = true;
      state.stepsState[idx] = Object.assign({}, state.stepsState[idx], { confirmed:true });

      // Recompute indicators & flags based on ALL steps (last-write-wins for flags)
      try{
        applyInteractivityOnConfirm(project, effectiveStage);
      }catch(e){
        try{ console.error('[MEDEL][INTERACTIVITY] applyOnConfirm error', e); }catch(_e){}
      }

      // Notify listeners
      try{
        (curStage?.bus || stage.bus).emit('step-confirmed', { index: idx });
      }catch(_e){}

      // Optionally lock step contents
      try{
        const stp = flatSteps[idx].step || {};
        if(stp.lockOnConfirmStep && effectiveStage && effectiveStage.el){
          effectiveStage.el.dataset.locked = '1';
          (effectiveStage.bus || stage.bus).emit('step-locked', { index: idx });
        }
      }catch(_e){}

      if(nextBtn) nextBtn.disabled = false;

      // Refresh sidebar unlock state based on updated indicators/flags
      renderStepsList(
        list,
        project,
        idx,
        (i)=>{ idx = i; refresh(); },
        computeUnlockedCount(flatSteps, state, project)
      );
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
    try{
      const canvasHost = document.getElementById('viewerStage');
      if(!canvasHost){ return; }

      // Prova a salvare lo stato corrente dell'ultimo step (anche se non confermato)
      try{
        if(typeof MedelPersistence !== 'undefined' &&
           MedelPersistence &&
           typeof MedelPersistence.saveOnConfirm === 'function' &&
           curStage){
          MedelPersistence.saveOnConfirm(project, idx, curStage);
        }
      }catch(e){
        try{ console.error('[MEDEL][SUMMARY] saveOnConfirm before summary failed', e); }catch(_e){}
      }

      const store = (typeof MedelPersistence !== 'undefined' &&
                     MedelPersistence &&
                     typeof MedelPersistence._load === 'function')
        ? (MedelPersistence._load(project) || { steps: {} })
        : { steps: {} };

      const labelsById = buildLabelMap(project);
      const { list } = buildFlatSteps(project);
      let stepIndex = -1;
      const items = [];

      list.forEach(node => {
        if(!node.step){ return; }
        stepIndex += 1;
        const step = node.step;
        const stepKey = String(stepIndex);
        const saved = (store.steps && store.steps[stepKey]) || {};
        const elValues = saved.elements || {};
        const elements = Array.isArray(step.elements) ? step.elements : [];

        elements.forEach(elDef => {
          if(!elDef || !elDef.type){ return; }
          const t = String(elDef.type);
          if(t !== 'checkbox' && t !== 'checkboxgroup' && t !== 'radiogroup' && t !== 'tablecheck'){
            return;
          }
          const summary = buildSummaryItemForElement(project, labelsById, elDef, elValues);
          if(summary && Array.isArray(summary.options) && summary.options.length){
            items.push(summary);
          }
        });
      });

      // Nascondi eventuale stage corrente
      if(curStage && curStage.el){
        curStage.el.style.display = 'none';
      }

      // Rimuovi eventuale riepilogo precedente
      const old = document.getElementById('medelSummarySlide');
      if(old && old.parentNode){
        old.parentNode.removeChild(old);
      }

      const wrap = document.createElement('div');
      wrap.id = 'medelSummarySlide';
      wrap.style.position = 'absolute';
      wrap.style.inset = '0';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.padding = '18px 18px 14px';
      wrap.style.boxSizing = 'border-box';
      wrap.style.background = 'radial-gradient(circle at top left, rgba(62,108,255,0.16), transparent), radial-gradient(circle at bottom right, rgba(45,212,191,0.10), #020817)';
      wrap.style.color = '#f9fafb';
      wrap.style.overflow = 'hidden';
      wrap.style.gap = '12px';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'baseline';
      header.style.gap = '12px';

      const title = document.createElement('h1');
      title.textContent = (project && project.title) ? String(project.title) : 'Riepilogo risposte';
      title.style.fontSize = '20px';
      title.style.margin = '0';
      title.style.fontWeight = '600';

      const subtitle = document.createElement('div');
      subtitle.textContent = 'Panoramica delle scelte effettuate nel caso clinico';
      subtitle.style.opacity = '0.75';
      subtitle.style.fontSize = '11px';

      header.appendChild(title);
      header.appendChild(subtitle);
      wrap.appendChild(header);

      const grid = document.createElement('div');
      grid.style.flex = '1 1 auto';
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
      grid.style.gap = '10px';
      grid.style.alignItems = 'flex-start';
      grid.style.paddingRight = '4px';
      grid.style.paddingBottom = '4px';
      grid.style.overflowY = 'auto';

      if(!items.length){
        const empty = document.createElement('div');
        empty.textContent = 'Nessuna risposta registrata.';
        empty.style.fontSize = '13px';
        empty.style.opacity = '0.8';
        empty.style.marginTop = '8px';
        wrap.appendChild(empty);
      }else{
        items.forEach(function(item){
          const card = document.createElement('div');
          card.style.background = 'rgba(10,12,19,0.98)';
          card.style.borderRadius = '12px';
          card.style.border = '1px solid rgba(148,163,253,0.18)';
          card.style.padding = '10px 9px 8px';
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.gap = '4px';
          card.style.boxShadow = '0 10px 30px rgba(15,23,42,0.55)';

          const q = document.createElement('div');
          q.textContent = item.title;
          q.style.fontSize = '12px';
          q.style.fontWeight = '600';
          q.style.margin = '0 0 2px 0';
          q.style.color = '#e5e7eb';

          const meta = document.createElement('div');
          meta.textContent = item.meta || '';
          meta.style.fontSize = '9px';
          meta.style.opacity = '0.55';

          const list = document.createElement('div');
          list.style.display = 'flex';
          list.style.flexWrap = 'wrap';
          list.style.gap = '3px';

          item.options.forEach(function(opt){
            const tag = document.createElement('div');
            tag.textContent = opt.label;
            tag.style.fontSize = '10px';
            tag.style.padding = '3px 6px 3px';
            tag.style.borderRadius = '999px';
            tag.style.border = '1px solid rgba(148,163,253,0.25)';
            tag.style.whiteSpace = 'nowrap';
            tag.style.maxWidth = '100%';
            tag.style.overflow = 'hidden';
            tag.style.textOverflow = 'ellipsis';

            if(opt.selected){
              tag.style.background = 'rgba(79,70,229,0.26)';
              tag.style.color = '#e5e7eb';
              tag.style.borderColor = 'rgba(129,140,248,0.9)';
              tag.style.fontWeight = '600';
            }else{
              tag.style.background = 'rgba(15,23,42,0.9)';
              tag.style.color = '#9ca3af';
              tag.style.opacity = '0.45';
            }

            list.appendChild(tag);
          });

          card.appendChild(q);
          if(item.meta){ card.appendChild(meta); }
          card.appendChild(list);
          grid.appendChild(card);
        });
        wrap.appendChild(grid);
      }

      canvasHost.appendChild(wrap);

      // Disattiva i pulsanti di navigazione nel riepilogo finale
      try{
        const nextBtn = document.getElementById('btnNext');
        const confirmBtn = document.getElementById('btnConfirm');
        if(nextBtn){ nextBtn.disabled = true; nextBtn.classList.add('disabled'); }
        if(confirmBtn){ confirmBtn.style.display = 'none'; }
      }catch(ignore){}
    }catch(e){
      try{ console.error('[MEDEL][SUMMARY] render error', e); }catch(ignore2){}
    }

    // Helpers locali al riepilogo

    function buildLabelMap(project){
      const out = {};
      if(!project || !Array.isArray(project.steps)){ return out; }

      function walk(nodes){
        nodes.forEach(function(node){
          if(!node){ return; }
          if(node.type === 'step'){
            const els = Array.isArray(node.elements) ? node.elements : [];
            els.forEach(function(ed){
              if(ed && ed.type === 'label'){
                const id = (ed.id) ||
                           (ed.props && (ed.props.id || ed.props.name)) ||
                           '';
                const text = (ed.props && (ed.props.text || ed.props.label)) || '';
                if(id && text && !out[id]){
                  out[id] = String(text);
                }
              }
            });
          }else if(node.type === 'category' && Array.isArray(node.children)){
            walk(node.children);
          }
        });
      }

      walk(project.steps);
      return out;
    }

    function resolveQuestionTitle(project, labelsById, elDef){
      const props = (elDef && elDef.props) ? elDef.props : {};
      const inter = props.interactivity || {};
      const q = inter.question || {};

      if(q.mode === 'manual' && typeof q.text === 'string' && q.text.trim()){
        return q.text.trim();
      }
      if(q.mode === 'label' && q.labelId && labelsById[q.labelId]){
        return labelsById[q.labelId];
      }
      if(q.labelId && labelsById[q.labelId]){
        return labelsById[q.labelId];
      }

      if(typeof props.label === 'string' && props.label.trim()){
        return props.label.trim();
      }
      if(typeof props.text === 'string' && props.text.trim()){
        return props.text.trim();
      }
      if(typeof props.placeholder === 'string' && props.placeholder.trim()){
        return props.placeholder.trim();
      }

      const base = elDef.type ? String(elDef.type) : 'Elemento';
      const id = (elDef.id) || (props.id) || '';
      return id ? (base + ' (' + id + ')') : base;
    }

    function buildSummaryItemForElement(project, labelsById, elDef, elValues){
      const type = String(elDef.type);
      const props = elDef.props || {};
      const id = (elDef.id) ||
                 (props.id) ||
                 (props.name) ||
                 '';
      if(!id){ return null; }

      const title = resolveQuestionTitle(project, labelsById, elDef);
      const meta = (type === 'checkboxgroup')
        ? 'Risposta multipla'
        : (type === 'radiogroup')
          ? 'Risposta singola'
          : (type === 'tablecheck')
            ? 'Selezione tabellare'
            : 'Checkbox';

      if(type === 'checkbox'){
        const key = 'chk:' + id;
        const entry = elValues[key];
        const selected = !!(entry && entry.t === 'checkbox' && entry.v);
        const label = (props.text && String(props.text)) || title || 'Selezionato';
        return {
          type: type,
          title: title,
          meta: meta,
          options: [
            { label: label, selected: selected }
          ]
        };
      }

      if(type === 'checkboxgroup'){
        const key = 'cg:' + id;
        const entry = elValues[key];
        const srcItems = Array.isArray(props.items) ? props.items : [];
        const values = (entry && entry.t === 'checkboxgroup' && Array.isArray(entry.v)) ? entry.v : [];
        const options = srcItems.map(function(lbl, i){
          return {
            label: String(lbl),
            selected: !!values[i]
          };
        });
        return { type: type, title: title, meta: meta, options: options };
      }

      if(type === 'radiogroup'){
        const key = 'rg:' + id;
        const entry = elValues[key];
        const srcItems = Array.isArray(props.items) ? props.items : [];
        const selIndex = (entry && entry.t === 'radiogroup' && typeof entry.v === 'number') ? entry.v : -1;
        const options = srcItems.map(function(lbl, i){
          return {
            label: String(lbl),
            selected: (i === selIndex)
          };
        });
        return { type: type, title: title, meta: meta, options: options };
      }

      if(type === 'tablecheck'){
        const key = 'tbl:' + id;
        const entry = elValues[key];
        const items = Array.isArray(props.items) ? props.items : [];
        const rowsContent = props.rowsContent || {};
        const flags = (entry && entry.t === 'tablecheck' && Array.isArray(entry.v)) ? entry.v : [];
        const options = items.map(function(k, i){
          var rawLabel = (rowsContent && rowsContent[k]) ? rowsContent[k] : k;
          return {
            label: String(rawLabel),
            selected: !!flags[i]
          };
        });
        return { type: type, title: title, meta: meta, options: options };
      }

      return null;
    }
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




// === Interactivity apply on Confirm ===

/**
 * Apply interactivity rules at CONFIRM, recomputing indicators and flags
 * from scratch based on ALL saved user choices.
 *
 * Rules:
 * - Each Indicator starts from its project default value (or 0 if invalid).
 * - Each Flag starts from its project default (or false).
 * - For every step in order, for every element with interactivity:
 *     - checkbox: if checked -> apply its checkbox.actions.
 *     - checkboxgroup: for each checked index -> apply options[index].
 *     - radiogroup: for selected index -> apply options[index].
 *     - tablecheck: for each checked cell -> apply options[index].
 * - Indicator actions sum their delta (base + sum of all deltas).
 * - Flag actions are last-write-wins: the last step that sets it wins,
 *   even if the user later changes previous steps.
 *
 * This function expects that MedelPersistence.saveOnConfirm has already
 * persisted the current step before being called.
 */
function applyInteractivityOnConfirm(project, currentStage){
  if(!project) return;

  const hasPersistence =
    typeof MedelPersistence !== 'undefined' &&
    MedelPersistence &&
    typeof MedelPersistence._load === 'function';

  // If we don't have the v5 persistence, gracefully fall back to legacy
  // behaviour limited to the current stage.
  if(!hasPersistence){
    if(currentStage && Array.isArray(currentStage.elements)){
      const indicators = Array.isArray(project.indicators) ? project.indicators : [];
      const flags = Array.isArray(project.flags) ? project.flags : [];
      const byId = (arr,id)=> arr.find(x=> x.id===id);
      const applyActions = (actions)=>{
        (actions||[]).forEach(a=>{
          if(!a || !a.id) return;
          if(a.type === 'indicator'){
            const ind = byId(indicators, a.id);
            if(ind){
              const cur = (typeof ind.value === 'number') ? ind.value : 0;
              const delta = Number(a.delta || 0);
              ind.value = cur + delta;
            }
          }else if(a.type === 'flag'){
            const f = byId(flags, a.id);
            if(f){ f.value = !!a.set; }
          }
        });
      };
      currentStage.elements.forEach(el=>{
        if(!el || !el.props) return;
        const inter = el.props.interactivity || null;
        if(!inter) return;
        const type = (el.constructor && el.constructor.type) || el.type;
        if(type === 'checkbox' && inter.checkbox && Array.isArray(inter.checkbox.actions)){
          const chk = el.content && el.content.querySelector
            ? el.content.querySelector('input[type=checkbox]')
            : null;
          if(chk && chk.checked){ applyActions(inter.checkbox.actions); }
        }else if((type === 'checkboxgroup' || type === 'radiogroup' || type === 'tablecheck') && inter.options){
          const value = el.getProp && el.getProp('value');
          const optActions = inter.options[String(value)];
          if(optActions) applyActions(optActions);
        }
      });
      try{
        const bar = document.getElementById('indicatorsBar');
        if(bar){
          renderIndicators(bar, project);
          renderFlags(bar, project);
        }
      }catch(_e){}
    }
    return;
  }

  // Ensure base maps (id -> default value) are cached on project
  if(!project.__baseIndicatorsMap){
    const inds = Array.isArray(project.indicators) ? project.indicators : [];
    const map = {};
    for(const ind of inds){
      if(ind && ind.id){
        const base = (typeof ind.value === 'number') ? ind.value : 0;
        map[ind.id] = base;
      }
    }
    project.__baseIndicatorsMap = map;
  }
  if(!project.__baseFlagsMap){
    const fls = Array.isArray(project.flags) ? project.flags : [];
    const map = {};
    for(const fl of fls){
      if(fl && fl.id){
        const base = !!fl.value;
        map[fl.id] = base;
      }
    }
    project.__baseFlagsMap = map;
  }

  // Load all persisted step values
  let store;
  try{
    store = MedelPersistence._load(project) || { steps:{} };
  }catch(_e){
    store = { steps:{} };
  }
  const stepsStore = store.steps || {};

  // Start from defaults
  const indicatorsMap = Object.assign({}, project.__baseIndicatorsMap);
  const flagsMap = Object.assign({}, project.__baseFlagsMap);

  function applyActions(actions){
    if(!actions) return;
    for(const a of actions){
      if(!a || !a.id || !a.type) continue;
      if(a.type === 'indicator'){
        const cur = Number.isFinite(indicatorsMap[a.id]) ? indicatorsMap[a.id] : 0;
        const delta = Number(a.delta || 0);
        indicatorsMap[a.id] = cur + delta;
      }else if(a.type === 'flag'){
        // last write wins
        flagsMap[a.id] = !!a.set;
      }
    }
  }

  // Build flat step list (only steps, no categories)
  const flat = buildFlatSteps(project);
  const flatSteps = Array.isArray(flat.list)
    ? flat.list.filter(n => n && n.step)
    : [];

  // Build index of element definitions per step (id -> definition)
  const stepElementIndex = {};
  for(let idx = 0; idx < flatSteps.length; idx++){
    const stepNode = flatSteps[idx];
    const step = stepNode.step;
    if(!step || !Array.isArray(step.elements)) continue;
    const map = {};
    for(const elDef of step.elements){
      if(!elDef) continue;
      const p = elDef.props || {};
      const id = p.id || p.name || elDef.id || null;
      if(id){
        map[String(id)] = elDef;
      }
    }
    stepElementIndex[idx] = map;
  }

  // Iterate steps in order and apply interactivity according to saved values
  for(let idx = 0; idx < flatSteps.length; idx++){
    const stepMap = stepElementIndex[idx];
    if(!stepMap) continue;

    const rec = Object.prototype.hasOwnProperty.call(stepsStore, idx)
      ? stepsStore[idx]
      : stepsStore[String(idx)];
    if(!rec || !rec.elements) continue;
    const elementsStore = rec.elements;

    for(const key in elementsStore){
      if(!Object.prototype.hasOwnProperty.call(elementsStore, key)) continue;
      const recEl = elementsStore[key];
      if(!recEl) continue;

      let prefix = '';
      if(key.startsWith('chk:')) prefix = 'chk:';
      else if(key.startsWith('cg:')) prefix = 'cg:';
      else if(key.startsWith('rg:')) prefix = 'rg:';
      else if(key.startsWith('tbl:')) prefix = 'tbl:';
      else if(key.startsWith('txt:')) prefix = 'txt:';
      if(!prefix) continue;

      const id = key.slice(prefix.length);
      const elDef = stepMap[id];
      if(!elDef || !elDef.props) continue;
      const inter = elDef.props.interactivity || null;
      if(!inter) continue;

      const type = elDef.type || recEl.t || '';

      // Checkbox: apply when checked
      if(prefix === 'chk:' || type === 'checkbox'){
        const isChecked = !!(recEl.v === true || recEl.v === 'true' || recEl.v === 1 || recEl.v === '1');
        if(isChecked && inter.checkbox && Array.isArray(inter.checkbox.actions)){
          applyActions(inter.checkbox.actions);
        }
      }
      // Checkbox group: v is boolean[]
      else if(prefix === 'cg:' || type === 'checkboxgroup'){
        const values = Array.isArray(recEl.v) ? recEl.v : [];
        const optActions = inter.options || {};
        for(let i = 0; i < values.length; i++){
          if(values[i]){
            const acts = optActions[String(i)];
            if(acts) applyActions(acts);
          }
        }
      }
      // Radiogroup: v is selected index
      else if(prefix === 'rg:' || type === 'radiogroup'){
        const raw = recEl.v;
        const sel = (typeof raw === 'number')
          ? raw
          : parseInt(raw, 10);
        if(Number.isFinite(sel) && sel >= 0){
          const optActions = inter.options || {};
          const acts = optActions[String(sel)];
          if(acts) applyActions(acts);
        }
      }
      // Tablecheck: boolean[] for each row/column
      else if(prefix === 'tbl:' || type === 'tablecheck'){
        const values = Array.isArray(recEl.v) ? recEl.v : [];
        const optActions = inter.options || {};
        for(let i = 0; i < values.length; i++){
          if(values[i]){
            const acts = optActions[String(i)];
            if(acts) applyActions(acts);
          }
        }
      }
      // Textbox or other types can be extended here if needed
    }
  }

  // Write results back to project for rendering
  if(Array.isArray(project.indicators)){
    for(const ind of project.indicators){
      if(ind && ind.id && Object.prototype.hasOwnProperty.call(indicatorsMap, ind.id)){
        ind.value = indicatorsMap[ind.id];
      }
    }
  }
  if(Array.isArray(project.flags)){
    for(const f of project.flags){
      if(f && f.id && Object.prototype.hasOwnProperty.call(flagsMap, f.id)){
        f.value = !!flagsMap[f.id];
      }
    }
  }

  // Re-render visual bar
  try{
    const bar = document.getElementById('indicatorsBar');
    if(bar){
      renderIndicators(bar, project);
      renderFlags(bar, project);
    }
  }catch(_e){}
}

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
