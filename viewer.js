
import { registry, loadModules } from './js/core/registry.js';
import { Stage } from './js/stage/stage.js';
import { evalGroup } from './js/logic/eval.js';

const qs = (k) => new URLSearchParams(location.search).get(k);

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
  bar.innerHTML='';
  const indicators = Array.isArray(project.indicators)? project.indicators : [];
  for(const ind of indicators){
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
  const nextBtn = document.getElementById('nextBtn');
  const canvasHost = document.getElementById('viewerStage');

  const { list: flatAll } = buildFlatSteps(project);
  const flatSteps = flatAll.filter(n=>n.step);
  let idx = 0; const state={values:{},indicators:{},stepsState:{},unlocked:new Set([0])};
  let unlockedCount = Math.max(1, flatSteps.length ? 1 : 0); // unlock first step by default


  // initial stage
  const stage = new Stage(canvasHost, { gridSize:16, aspect: (flatSteps?.[0]?.step?.aspect)||'16:9' });
  stage.el.classList.add('stageHost');
  neutralizeEditor(stage);
  fitStageWidth(stage, canvasHost);
  window.addEventListener('resize', ()=> fitStageWidth(stage, canvasHost));
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>fitStageWidth(stage, canvasHost)); ro.observe(canvasHost);}
  fitStageWidth(stage, canvasHost);
  window.addEventListener('resize', ()=> fitStageWidth(stage, canvasHost));
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>fitStageWidth(stage, canvasHost)); ro.observe(canvasHost);}

  renderIndicators(indicatorsBar, project);
  renderStepsList(list, project, idx, (i)=>{ idx=i; refresh(); }, unlockedCount);
  collapseBtn.addEventListener('click', ()=>{ 
    left.classList.toggle('collapsed');
    rootViewer.classList.toggle('collapsed-left');
    collapseBtn.textContent = left.classList.contains('collapsed') ? '≫' : '≪';
    setTimeout(()=>window.dispatchEvent(new Event('resize')), 0);
  });

  function refresh(){
    canvasHost.innerHTML='';
    const s2 = new Stage(canvasHost, { gridSize:16, aspect: (flatSteps?.[idx]?.step?.aspect)||'16:9' });
    s2.el.classList.add('stageHost');
    neutralizeEditor(s2);
    setStageStep(s2, flatSteps[idx].step);
    fitStageWidth(s2, canvasHost);
    window.addEventListener('resize', ()=> fitStageWidth(s2, canvasHost));
    if(window.ResizeObserver){ const ro2=new ResizeObserver(()=>fitStageWidth(s2, canvasHost)); ro2.observe(canvasHost);}
    renderStepsList(list, project, idx, (i)=>{ idx=i; refresh(); }, unlockedCount);
    nextBtn.disabled = !canAdvance(flatSteps[idx].step, state);
  }

  nextBtn.addEventListener('click', ()=>{
    if(idx < flatSteps.length-1){ idx++; unlockedCount = Math.max(unlockedCount, idx+1); refresh(); }
    else{
      showResults();
    }
  });

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
  nextBtn.disabled = (flatSteps?.length<=1);
}

main().catch(err=>{
  console.error(err);
  const pre = document.createElement('pre'); pre.textContent = err?.stack || String(err);
  pre.style.whiteSpace='pre-wrap'; pre.style.padding='12px'; pre.style.color='#ffb4b4';
  document.body.appendChild(pre);
});