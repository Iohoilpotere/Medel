// src/editor/exporter.js
import { $, $$ } from '../core/utils.js';

export default class CaseExporter {
  constructor(editor){
    this.ed = editor;
  }

  async exportCaseHTML(){
    const cats = this.ed.stepMgr.categories;
    // 1) Raccogli asset (bg step + <img> di ogni step)
    const urlSet = new Set();
    for (const cat of cats){
      for (const step of cat.steps){
        if (step.bgUrl) urlSet.add(step.bgUrl);
        for (const el of step.items){
          if (el.type === 'image' && el.src) urlSet.add(el.src);
        }
      }
    }
    // 2) Converte in data URL (best effort: se fallisce, resta l’URL originale)
    const urlMap = {};
    await Promise.all([...urlSet].map(async (u)=>{
      try{
        const dataUrl = await this.toDataURL(u);
        urlMap[u] = dataUrl;
      }catch(e){
        console.warn('Embed fallito (uso URL originale):', u, e);
        urlMap[u] = u;
      }
    }));

    // 3) Costruisci markup per ogni step
    const stepSections = [];
    for (const cat of cats){
      for (const step of cat.steps){
        stepSections.push(this.serializeStep(step, urlMap));
      }
    }

    // 4) Documento completo (CSS+JS inline) + download
    const html = this.buildDocument(cats, stepSections.join('\n'));
    const blob = new Blob([html], {type:'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caso-clinico.html';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  // -- util

  async toDataURL(url){
    const res = await fetch(url, {mode:'cors'}); // se CORS blocca, andrà in catch
    const blob = await res.blob();
    return await new Promise((resolve, reject)=>{
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = ()=> resolve(fr.result);
      fr.readAsDataURL(blob);
    });
  }

  // serializza UNO step in HTML (stesso layout/stile dell’editor)
  serializeStep(step, urlMap){
    const bg = step.bgUrl ? (urlMap[step.bgUrl] || step.bgUrl) : '';
    // canvas dello step
    const canvasInner = step.items.map(el=>{
      const baseStyle = `left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;z-index:${Math.max(0, el.z|0)};position:absolute;`;
      switch(el.type){
        case 'label': {
          const justify = el.align==='left' ? 'flex-start' : el.align==='center' ? 'center' : 'flex-end';
          return `<div class="el el-label p-2" style="${baseStyle}color:${el.color};font-size:${el.fontSize}vw;">
                    <div class="content w-100 h-100 d-flex align-items-center" style="justify-content:${justify}">${this.escape(el.text)}</div>
                  </div>`;
        }
        case 'image': {
          const src = el.src ? (urlMap[el.src] || el.src) : '';
          return `<div class="el el-image" style="${baseStyle}">
                    <img class="w-100 h-100" alt="${this.escape(el.alt||'')}" style="object-fit:${el.fit||'cover'}" src="${src}">
                  </div>`;
        }
        case 'textbox': {
          // Di default mantengo gli input interattivi; dimmi se li vuoi in sola lettura.
          return `<div class="el el-textbox p-2" style="${baseStyle}">
                    <input class="form-control form-control-sm h-100" type="text"
                           name="${this.escape(el.name||'')}"
                           placeholder="${this.escape(el.placeholder||'')}"
                           style="text-align:${el.align||'left'}" />
                  </div>`;
        }
        case 'checkbox': {
          const checked = el.checked ? 'checked' : '';
          const id = `${step.id}-${el.id}-in`;
          return `<div class="el el-checkbox" style="${baseStyle}">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="${id}" name="${this.escape(el.name||'')}" ${checked}>
                      <label class="form-check-label" for="${id}">${this.escape(el.label||'')}</label>
                    </div>
                  </div>`;
        }
        case 'radiogroup': {
          const opts = (el.options||[]).map((opt,i)=>{
            const id = `${step.id}-${el.id}-r${i}`;
            const klass = el.inline ? 'form-check form-check-inline' : 'form-check';
            return `<div class="${klass}">
                      <input class="form-check-input" type="radio" name="${this.escape(el.name||'opt')}" id="${id}" value="${this.escape(opt)}">
                      <label class="form-check-label" for="${id}">${this.escape(opt)}</label>
                    </div>`;
          }).join('');
          return `<div class="el el-radio" style="${baseStyle}"><div class="rg">${opts}</div></div>`;
        }
      }
      return '';
    }).join('\n');

    return `
<section class="step" data-step-id="${step.id}" data-orient="${step.orient==='portrait'?'portrait':'landscape'}" style="display:none;">
  <div class="stage-outer">
    <div class="stage" data-orient="${step.orient==='portrait'?'portrait':'landscape'}">
      <div class="stage-size">
        <div class="step-canvas" style="${bg ? `background: center/cover no-repeat url('${bg}')` : ''}">
          ${canvasInner}
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  escape(s){ return (s??'').toString().replace(/[&<>"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m] )); }

  // documento finale
  buildDocument(categories, sectionsHtml){
    const catsHtml = categories.map(cat=>{
      const steps = cat.steps.map((s, i)=>`
        <button class="nav-step" data-goto="${s.id}" title="${this.escape(s.name)}">
          <span class="num">${i+1}</span><span class="nm">${this.escape(s.name)}</span>
        </button>`).join('');
      return `
      <div class="nav-cat" data-cat="${cat.id}">
        <div class="nav-cat-head">
          <button class="toggle" type="button" aria-label="Espandi/Collassa">▼</button>
          <div class="title">${this.escape(cat.name)}</div>
        </div>
        <div class="nav-cat-body">${steps}</div>
      </div>`;
    }).join('');

    const css = `
/* ==== Exported Case (single-file) ==== */
:root{
  --canvas-bg:#0b0c10; --thumb-border:rgba(255,255,255,.14);
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0; background:#0e0f13; color:#e9ecef; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;}
.app{display:flex; height:100vh; overflow:hidden}

/* Sidebar */
.sidebar{position:relative; width:280px; border-right:1px solid rgba(255,255,255,.12); background:#21252b; transition: transform .2s ease;}
.sidebar.collapsed{ transform: translateX(calc(-100% + 42px)); }
.sidebar .collapse-handle{
  position:absolute; top:50%; right:-1px; transform:translate(100%,-50%);
  background:#1c1f24; border:1px solid rgba(255,255,255,.15); border-left:none; color:#e9ecef;
  padding:.35rem .45rem; border-radius:0 .4rem .4rem 0; cursor:pointer;
}
.nav-wrap{height:100%; overflow:auto; padding:.75rem}
.nav-cat{border-top:1px dashed rgba(255,255,255,.2); padding-top:.5rem; margin-top:.5rem}
.nav-cat:first-child{border-top:none; padding-top:0; margin-top:0}
.nav-cat-head{display:flex; align-items:center; gap:.5rem}
.nav-cat-head .toggle{background:transparent; color:#e9ecef; border:1px solid rgba(255,255,255,.2); border-radius:.35rem; padding:.1rem .35rem; cursor:pointer}
.nav-cat-body{margin:.5rem 0 .25rem; display:grid; gap:.35rem}
.nav-step{display:flex; align-items:center; gap:.4rem; width:100%; text-align:left; border:1px solid rgba(255,255,255,.15); background:transparent; color:#e9ecef; padding:.35rem .5rem; border-radius:.4rem; cursor:pointer}
.nav-step:hover{background:rgba(255,255,255,.06)}
.nav-step.active{outline:2px solid #0d6efd}
.nav-step .num{font-weight:700; padding:.1rem .35rem; border:1px solid rgba(255,255,255,.15); border-radius:.35rem; font-size:.8rem}

/* Content */
.content{flex:1; display:flex; align-items:center; justify-content:center; padding:16px}
.stage-outer{position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center}
.stage{position:relative; background:var(--canvas-bg); border-radius:10px;
  box-shadow:0 0 0 1px rgba(255,255,255,.08) inset, 0 12px 30px rgba(0,0,0,.35); overflow:hidden}
.stage[data-orient="landscape"]{aspect-ratio:16/9}
.stage[data-orient="portrait"]{aspect-ratio:9/16}
.stage-size{position:relative; width:100%; height:100%}
.step-canvas{position:absolute; inset:0}

/* Elements (stesse classi base dell’editor) */
.el{position:absolute; user-select:none}
.el-label .content{display:flex; align-items:center}
.el-image img{display:block; width:100%; height:100%}

/* Toolbar (optional): solo pulsanti next/prev */
.topbar{position:fixed; right:16px; top:12px; display:flex; gap:.4rem; z-index:10}
.topbar .btn{border:1px solid rgba(255,255,255,.25); background:#1c1f24; color:#e9ecef; padding:.3rem .6rem; border-radius:.35rem; cursor:pointer}
.topbar .btn:hover{background:#2a2f36}
`;

    const js = `
(function(){
  const qs = (s,c=document)=>c.querySelector(s);
  const qsa= (s,c=document)=>Array.from(c.querySelectorAll(s));

  const sidebar = qs('.sidebar');
  const steps = qsa('.step');
  const links = qsa('.nav-step');
  const cats  = qsa('.nav-cat');

  function layout(){
    // fit by both dims (uguale all’editor)
    qsa('.step').forEach(sec=>{
      const stage = qs('.stage', sec);
      const outer = qs('.stage-outer', sec);
      const cs = getComputedStyle(outer);
      const pt = parseFloat(cs.paddingTop)||0, pb = parseFloat(cs.paddingBottom)||0;
      const pl = parseFloat(cs.paddingLeft)||0, pr = parseFloat(cs.paddingRight)||0;
      const cw = outer.clientWidth - pl - pr; const ch = outer.clientHeight - pt - pb;
      const orient = stage.dataset.orient || 'landscape';
      const R = (orient==='portrait') ? (9/16) : (16/9);
      let w = Math.min(cw, Math.floor(ch * R)); let h = Math.floor(w / R);
      if(h > ch){ h = ch; w = Math.floor(h * R); } if(w > cw){ w = cw; h = Math.floor(w / R); }
      Object.assign(stage.style, { width: w + 'px', height: h + 'px' });
    });
  }

  function showStep(id){
    steps.forEach(s=> s.style.display = (s.dataset.stepId===id)?'block':'none');
    links.forEach(a=> a.classList.toggle('active', a.dataset.goto===id));
    layout();
    history.replaceState(null,'','#'+id); // deep-link
  }

  // nav
  links.forEach(btn=> btn.addEventListener('click', ()=> showStep(btn.dataset.goto)));

  // categorie collassabili
  qsa('.nav-cat .toggle').forEach(t=>{
    t.addEventListener('click', ()=>{
      const body = t.closest('.nav-cat').querySelector('.nav-cat-body');
      const collapsed = body.style.display==='none';
      body.style.display = collapsed ? 'grid':'none';
      t.textContent = collapsed ? '▼' : '▶';
    });
  });

  // collapse sidebar
  qs('.collapse-handle').addEventListener('click', ()=>{
    sidebar.classList.toggle('collapsed');
    setTimeout(layout, 210);
  });

  // next/prev
  qs('#btnNext').addEventListener('click', ()=>{
    const idx = links.findIndex(x=> x.classList.contains('active'));
    if(idx>=0 && idx < links.length-1) links[idx+1].click();
  });
  qs('#btnPrev').addEventListener('click', ()=>{
    const idx = links.findIndex(x=> x.classList.contains('active'));
    if(idx>0) links[idx-1].click();
  });

  window.addEventListener('resize', layout);

  const start = location.hash ? location.hash.slice(1) : (steps[0]?.dataset.stepId);
  if(start){ showStep(start); } else { layout(); }
})();`;

    return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Caso clinico</title>
<style>${css}</style>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <button class="collapse-handle" type="button" title="Apri/chiudi">☰</button>
      <div class="nav-wrap">
        ${catsHtml}
      </div>
    </aside>
    <div class="content">
      <div class="topbar">
        <button id="btnPrev" class="btn" type="button">◀ Prev</button>
        <button id="btnNext" class="btn" type="button">Next ▶</button>
      </div>
      ${sectionsHtml}
    </div>
  </div>
<script>${js}</script>
</body>
</html>`;
  }
}
