
import { $ } from '../utils/dom.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class PropertiesPanel{
  renderIndicatorProperties(ind){
    const store = this.app && this.app.indicators;
    this.form.innerHTML = '';
    const grp = document.createElement('div'); grp.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Indicatore'; grp.appendChild(h);
    const content = document.createElement('div'); content.className='prop-group-content'; grp.appendChild(content);
    const addRow = (label, value, onChange, type='text')=>{
      const r=document.createElement('div'); r.className='prop-row';
      const l=document.createElement('label'); l.textContent=label; r.appendChild(l);
      const i=document.createElement('input'); i.type=type; i.value=value||''; i.addEventListener('input', ()=> onChange(i.value)); r.appendChild(i);
      content.appendChild(r);
    };
    addRow('Nome', ind.name||'', v=>{ store.update(ind.id,{name:v}); this.app.indicatorsPanel?.render(); });
    addRow('Immagine (URL)', ind.image||'', v=>{ store.update(ind.id,{image:v}); this.app.indicatorsPanel?.render(); });
    addRow('Prefisso', ind.prefix||'', v=> store.update(ind.id,{prefix:v}));
    addRow('Suffisso', ind.suffix||'', v=> store.update(ind.id,{suffix:v}));
    this.form.appendChild(grp);
  }

  constructor(app){ this.app=app; this.form = $('#propForm'); this._liveInputs=null; this._bindLiveGeometry(); this.form?.addEventListener('submit',(e)=>e.preventDefault()); }
  _bindLiveGeometry(){ if(this._liveBound) return; this._liveBound=true; this.app.stage.bus.on('geometry-preview',()=>{ if(!this._liveInputs) return; const t=this.app.stage.selected[0]; if(!t) return; this._liveInputs.inX.value = Math.round(t.x); this._liveInputs.inY.value = Math.round(t.y); this._liveInputs.inW.value = Math.round(t.w); this._liveInputs.inH.value = Math.round(t.h); }); this.app.stage.bus.on('selection-changed',()=>{ this._liveInputs=null; }); }
  render(){ const step = this.app.currentStep; this.form.innerHTML=''; if(!step){ this.form.innerHTML='<div class="muted">Nessuno step selezionato</div>'; return; }
    const stage = this.app.stage;
    const targets = stage.selected.length? stage.selected : [];
    this.form.innerHTML='';
    if(targets.length===0){
      const left = this.app && this.app.activeLeftTab;
      if(left==='indicators'){
        const selInd = this.app && this.app.indicators && this.app.indicators.selected;
        if(selInd){ this.renderIndicatorProperties(selInd); } else { this.form.innerHTML=''; }
        return;
      } else if(left==='elements'){
        this.form.innerHTML='';
        return;
      } else {
        const g = document.createElement('div'); g.className='prop-group';
      const h = document.createElement('h4'); h.textContent='Step'; g.appendChild(h);
      const b1 = document.createElement('div'); b1.className='prop-row'; const lab=document.createElement('label'); lab.textContent='Titolo'; b1.appendChild(lab);
      const inp = document.createElement('input'); inp.value = this.app.currentStep.title; inp.addEventListener('input',()=>{ this.app.currentStep.title = inp.value; this.app.stepsPanel.render(); }); b1.appendChild(inp);
      g.appendChild(b1);
      this.form.appendChild(g);

      // === LOGICA STEP (compact) ===
      const gl = document.createElement('div'); gl.className='prop-group';
      const hl = document.createElement('h4'); hl.textContent='Logica step'; gl.appendChild(hl);
      const contentL = document.createElement('div'); contentL.className='prop-group-content'; gl.appendChild(contentL);

      const summary = document.createElement('div'); summary.className='summary-kv';
      const btnOpen = document.createElement('button'); btnOpen.className='btn'; btnOpen.textContent='Configura…';
      const renderSummary = ()=>{
        summary.innerHTML='';
        const step = this.app.currentStep;
        const L = step.logic || {};
        const pill = (label)=>{ const s=document.createElement('span'); s.textContent=label; return s; };
        summary.appendChild(pill('Avanti: ' + (L.nextEnabledIf? 'Condiz.' : 'Sempre')));
        const next = (L.next && L.next.type)||'sequential';
        summary.appendChild(pill('Next: ' + (next==='sequential'?'Successivo':next==='goto'?'Vai a':'Switch')));
        summary.appendChild(pill('Sola lettura: ' + (!!L.readOnlyAfterAdvance ? 'Sì':'No')));
        summary.appendChild(pill('Esclusivo: ' + (L.exclusiveGroup||'—')));
        summary.appendChild(pill('Sblocco: ' + (L.unlockedIf? 'Condiz.':'Nessuno')));
      };
      renderSummary();

      const rowTop = document.createElement('div'); rowTop.className='prop-row';
      const label = document.createElement('label'); label.textContent='Configurazione'; label.style.minWidth='220px';
      rowTop.appendChild(label); rowTop.appendChild(btnOpen);
      contentL.appendChild(rowTop);
      contentL.appendChild(summary);

      // Modal open handler
      btnOpen.addEventListener('click', async ()=>{
        const [{ConditionGroup}, {ConditionBuilder}, {NextBuilder}] = await Promise.all([
          import('../logic/model.js'),
          import('../logic/condition-builder.js'),
          import('../logic/next-builder.js'),
        ]);
        const overlay = document.createElement('div'); overlay.className='modal-overlay';
        const modal = document.createElement('div'); modal.className='modal'; overlay.appendChild(modal);
        const H = document.createElement('header'); const h3=document.createElement('h3'); h3.textContent='Logica step'; H.appendChild(h3);
        const closeBtn=document.createElement('button'); closeBtn.className='btn ghost'; closeBtn.textContent='✕'; H.appendChild(closeBtn); modal.appendChild(H);
        const B = document.createElement('div'); B.className='body'; modal.appendChild(B);
        const F = document.createElement('footer'); modal.appendChild(F);
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Annulla';
        const save = document.createElement('button'); save.className='btn primary'; save.textContent='Applica';
        F.appendChild(cancel); F.appendChild(save);
        document.body.appendChild(overlay);

        const step = this.app.currentStep;
        const state = step.logic ? JSON.parse(JSON.stringify(step.logic)) : null;
        // Liste robuste per Step/Indicatori (con ID garantiti)
        const flatSteps = ()=>{
          const proj = this.app?.project || {};
          const root = Array.isArray(proj.steps) ? proj.steps : [];
          // Assicura un id stabile ai passi che ne sono privi
          let seq = 0;
          const ensureIds = (arr)=>{
            (arr||[]).forEach(n=>{
              if(n && n.type==='step'){
                if(!n.id){ 
                  // id persistente nella sessione/progetto
                  n.id = 'step_' + Date.now().toString(36) + '_' + (seq++);
                }
              }
              const kids = n && (n.children || n.steps);
              if(Array.isArray(kids)) ensureIds(kids);
            });
          };
          ensureIds(root);
          const out = [];
          const walk = (arr)=> (arr||[]).forEach(n=>{
            if(!n) return;
            if(n.type==='step'){
              out.push({ id: n.id, title: n.title || n.name || n.id });
            }
            const kids = n.children || n.steps;
            if(Array.isArray(kids)) walk(kids);
          });
          walk(root);
          return out;
        };
        const listIndicators = ()=>{
          const store = this.app?.indicators;
          const arr = store?.list || store?.items || [];
          return arr.map(i=>({id:i.id, name:i.name||i.label||i.id}));
        };
const section = (title)=>{ const w=document.createElement('div'); const t=document.createElement('div'); t.textContent=title; t.style.opacity='.8'; t.style.marginBottom='6px'; w.appendChild(t); return w; };

        // 1) Abilitazione "Avanti"
        const s1=section('Avanti abilitato quando'); B.appendChild(s1);
        const enableSel=document.createElement('select'); enableSel.innerHTML='<option value="always">Sempre</option><option value="cond">Se…</option>';
        enableSel.value=(state && state.nextEnabledIf)?'cond':'always'; s1.appendChild(enableSel);
        const enableHost=document.createElement('div'); s1.appendChild(enableHost);
        let enableAPI=null;
        const renderEnable=()=>{ enableHost.innerHTML=''; if(enableSel.value==='cond'){ const builder = new ConditionBuilder({ getElements:()=> { const arr=(step.elements||[]); let i=0; for(const el of arr){ if(!el.id){ el.id = el.props?.get?.('name') || ('el_'+(i++)) } } return arr; }, getIndicators:()=> listIndicators(), getSteps:()=> flatSteps() }); enableAPI=builder.mount(enableHost, state?.nextEnabledIf || new ConditionGroup('all',[])); } else enableAPI=null; };
        renderEnable(); enableSel.addEventListener('change', renderEnable);

        // 2) Destinazione Avanti
        const s2=section('Alla pressione di Avanti'); B.appendChild(s2);
        const nb = new NextBuilder({ getElements:()=> { const arr=(step.elements||[]); let i=0; for(const el of arr){ if(!el.id){ el.id = el.props?.get?.('name') || ('el_'+(i++)) } } return arr; }, getIndicators:()=> listIndicators(), getSteps:()=> flatSteps() });
        const nextAPI = nb.mount(s2, state?.next || {type:'sequential'});

        // 3) Sblocco step
        const s3=section('Sblocco step'); B.appendChild(s3);
        const unlockSel=document.createElement('select'); unlockSel.innerHTML='<option value="none">Nessuno</option><option value="cond">Sblocca quando…</option>';
        unlockSel.value=(state && state.unlockedIf)?'cond':'none'; s3.appendChild(unlockSel);
        const unlockHost=document.createElement('div'); s3.appendChild(unlockHost);
        let unlockAPI=null;
        const renderUnlock=()=>{ unlockHost.innerHTML=''; if(unlockSel.value==='cond'){ const builder=new ConditionBuilder({ getElements:()=> { const arr=(step.elements||[]); let i=0; for(const el of arr){ if(!el.id){ el.id = el.props?.get?.('name') || ('el_'+(i++)) } } return arr; }, getIndicators:()=> listIndicators(), getSteps:()=> flatSteps() }); unlockAPI=builder.mount(unlockHost, state?.unlockedIf || new ConditionGroup('all',[])); } else unlockAPI=null; };
        renderUnlock(); unlockSel.addEventListener('change', renderUnlock);

        // 4) Opzioni post-avanzamento
        const s4=section('Dopo avanzamento'); B.appendChild(s4);
        const ro=document.createElement('input'); ro.type='checkbox'; ro.checked=!!(state && state.readOnlyAfterAdvance);
        const roLab=document.createElement('label'); roLab.textContent='Sola lettura se completato'; roLab.style.marginLeft='8px';
        s4.appendChild(ro); s4.appendChild(roLab);

        const s5=section('Percorso esclusivo'); B.appendChild(s5);
        const ex=document.createElement('input'); ex.placeholder='es. branch-A'; ex.value=(state && state.exclusiveGroup)||''; s5.appendChild(ex);

        const close = ()=>{ overlay.remove(); };
        cancel.addEventListener('click', close); closeBtn.addEventListener('click', close); overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });

        save.addEventListener('click', ()=>{
          const logic = {
            nextEnabledIf: (enableSel.value==='cond' && enableAPI) ? enableAPI.getValue() : null,
            next: nextAPI.getValue(),
            readOnlyAfterAdvance: !!ro.checked,
            exclusiveGroup: ex.value||null,
            unlockedIf: (unlockSel.value==='cond' && unlockAPI) ? unlockAPI.getValue() : null
          };
          import('../core/commands/update-step-logic.js').then(({UpdateStepLogicCommand})=>{
            this.app.cmd.execute(new UpdateStepLogicCommand(step, logic));
            renderSummary();
            close();
          }).catch(err=>{
            console.warn('UpdateStepLogicCommand non disponibile, salvo direttamente.', err);
            step.logic = logic;
            this.app.requestRender && this.app.requestRender();
            renderSummary();
            close();
          });
        });
      });

      this.form.appendChild(gl);

        return;
      }
    }
    const keys = new Set(); for(const t of targets){ for(const k of t.props.keys()) keys.add(k); }
    const common = Array.from(keys).filter(k => targets.every(t => typeof t.getProp(k)!=='undefined'));
    
const addGroup = (title)=>{ 
  const wrap=document.createElement('div'); wrap.className='prop-group';
  const h=document.createElement('h4'); h.textContent=title; h.style.cursor='pointer';
  const content=document.createElement('div'); content.className='prop-group-content';
  // restore collapsed state
  const key='propGroup:'+title;
  const isCollapsed = (localStorage.getItem(key)==='1');
  content.style.display = isCollapsed? 'none':'block';
  const ico=document.createElement('span'); ico.textContent = isCollapsed? '▸':'▾'; ico.style.marginRight='6px';
  h.prepend(ico);
  h.addEventListener('click', ()=>{ 
    const collapsed = content.style.display!=='none' ;
    content.style.display = collapsed? 'none':'block';
    localStorage.setItem(key, collapsed? '1':'0');
    ico.textContent = collapsed? '▸':'▾';
  });
  wrap.appendChild(h); wrap.appendChild(content); this.form.appendChild(wrap);
  // helper for rows will append into content
  wrap._content = content;
  return wrap; 
}
const layout = addGroup('Layout');
    const addRow = (name, value, onChange)=>{ const r=document.createElement('div'); r.className='prop-row'; const lab=document.createElement('label'); lab.textContent=name; r.appendChild(lab); const i=document.createElement('input'); i.type='number'; i.step='any'; i.value=value; i.addEventListener('input',()=>onChange(parseFloat(i.value))); r.appendChild(i); layout.appendChild(r); };
    addRow('X %', Math.round((targets[0].x / (this.app.stage.el.clientWidth/this.app.stage.zoom))*10000)/100,
      v=>{ const sceneW = this.app.stage.el.clientWidth/this.app.stage.zoom; targets.forEach(t=>{ t.setXY(sceneW*(v/100), t.y); t.updateDom(); }); });
    addRow('Y %', Math.round((targets[0].y / (this.app.stage.el.clientHeight/this.app.stage.zoom))*10000)/100,
      v=>{ const sceneH = this.app.stage.el.clientHeight/this.app.stage.zoom; targets.forEach(t=>{ t.setXY(t.x, sceneH*(v/100)); t.updateDom(); }); });
    addRow('Larghezza %', Math.round((targets[0].w / (this.app.stage.el.clientWidth/this.app.stage.zoom))*10000)/100,
      v=>{ const sceneW = this.app.stage.el.clientWidth/this.app.stage.zoom; targets.forEach(t=>{ t.setSize(sceneW*(v/100), t.h); t.updateDom(); }); });
    addRow('Altezza %', Math.round((targets[0].h / (this.app.stage.el.clientHeight/this.app.stage.zoom))*10000)/100,
      v=>{ const sceneH = this.app.stage.el.clientHeight/this.app.stage.zoom; targets.forEach(t=>{ t.setSize(t.w, sceneH*(v/100)); t.updateDom(); }); });
    addRow('Z-Order', targets[0].getProp('z') ?? 0, v=>{ const val=Number(v)||0; this.app.cmd.execute(new UpdatePropertyCommand(targets,'z',val)); });

    // Proprietà per categoria (da moduli)
    // Raccogli proprietà applicabili dal registry
    const groups = {};
    const types = registry.getPropertyTypes ? registry.getPropertyTypes() : [];
    types.forEach(t=>{
      try{
        const P = registry.properties.get ? registry.properties.get(t) : null;
        if(!P) return;
        const inst = new P();
        if(inst.constructor && typeof inst.constructor.appliesTo==='function'){
          if(!inst.constructor.appliesTo(targets[0])) return;
        }else if(typeof P.appliesTo==='function'){
          if(!P.appliesTo(targets[0])) return;
        }
        const key = inst.category || inst.group || 'Generale';
        (groups[key]||(groups[key]=[])).push(inst);
      }catch(e){/*ignore*/}
    });
    const order = ['Contenuto','Stile'];
      const orderedKeys = Object.keys(groups).sort((a,b)=>{
        const ra = order.indexOf(a); const rb = order.indexOf(b);
        return (ra<0?99:ra) - (rb<0?99:rb);
      });
      orderedKeys.forEach(groupName=>{
      const section = addGroup(groupName.charAt(0).toUpperCase()+groupName.slice(1));
      // --- Style scope dropdown injected into 'Stile' header ---
      if(groupName==='Stile'){
        try{
          const t0 = targets[0];
          const ttype = t0 && (t0.type || (t0.constructor && t0.constructor.type));
          if(ttype==='radiogroup' || ttype==='checkboxgroup' || ttype==='pairs'){
            const header = (function(){ const h = section.querySelector && section.querySelector('h4'); return h || section; })();
            const sel = document.createElement('select'); sel.setAttribute('data-style-scope','1');
            sel.style.cssText = 'float:right;max-width:60%;margin-left:8px;';
            const items = Array.isArray(t0.getProp('items')) ? t0.getProp('items') : [];
            const scope = (Number.isInteger(t0.getProp('styleScope')) ? t0.getProp('styleScope') : -1);
            const addOpt = (v, label)=>{ const o=document.createElement('option'); o.value=String(v); o.textContent=label; if(v===scope) o.selected=true; return o; };
            sel.appendChild(addOpt(-1, 'Tutto'));
            if(ttype==='pairs'){ sel.appendChild(addOpt(-2,'Chiavi')); sel.appendChild(addOpt(-3,'Valori')); }
            items.forEach((txt,i)=> sel.appendChild(addOpt(i, String(txt||('Opzione '+(i+1))))));
            header && header.appendChild(sel);
            sel.addEventListener('change', ()=>{
              const prev = [ t0.getProp('styleScope') ];
              const val = parseInt(sel.value,10);
              this.app.cmd.execute(new UpdatePropertyCommand([t0], 'styleScope', val, prev));
              this.render();
            });
          }
        }catch(e){ /* no-op */ }
      }
      groups[groupName].filter(p=>p.key!=='styleScope').forEach(prop=>{
      const apply = (v)=>{
        const target = targets[0];
        const type = target && (target.type || (target.constructor && target.constructor.type));
        const scoped = (groupName==='Stile') && (type==='radiogroup' || type==='checkboxgroup' || type==='pairs') && Number.isInteger(target.getProp('styleScope')) && target.getProp('styleScope')>=0;

        
        const doSet = (key, val) => {
          const type = target && (target.type || (target.constructor && target.constructor.type));
          const scopeVal = target.getProp('styleScope');
          const mapPairKey = (baseKey, which)=>{
            // Map generic text style keys to pairs-specific prefixed keys
            const map = {
              color: 'Color',
              fontSize: 'FontSize',
              fontFamily: 'FontFamily',
              fontWeight: 'FontWeight',
              italic: 'Italic',
              lineHeight: 'LineHeight',
              letterSpacing: 'LetterSpacing',
              shadow: 'Shadow',
              shadowColor: 'ShadowColor',
              shadowDx: 'ShadowDx',
              shadowDy: 'ShadowDy',
              shadowBlur: 'ShadowBlur',
              strokeWidth: 'StrokeWidth',
              strokeColor: 'StrokeColor',
              strokeStyle: 'StrokeStyle'
            };
            const suf = map[baseKey] || (baseKey.charAt(0).toUpperCase()+baseKey.slice(1));
            return (which==='key' ? ('key'+suf) : ('value'+suf));
          };

          if(scoped){
            const idx = scopeVal;
            const styles = Object.assign({}, target.getProp('itemStyles')||{});
            const cur = Object.assign({}, styles[idx]||{});
            if(type==='pairs'){
              // apply to both key & value for the selected row
              cur[ mapPairKey(key,'key') ] = val;
              cur[ mapPairKey(key,'value') ] = val;
            }else{
              cur[key] = val;
            }
            styles[idx] = cur;
            const prev = [JSON.stringify(target.getProp('itemStyles')||{})];
            this.app.cmd.execute(new UpdatePropertyCommand([target], 'itemStyles', styles, prev));
          }else{
            if(type==='pairs'){
              // global scope for pairs: support special scopes -2 (keys) and -3 (values)
              if(scopeVal===-2){
                const k = mapPairKey(key,'key');
                const prev = targets.map(t=> t.getProp(k));
                this.app.cmd.execute(new UpdatePropertyCommand(targets, k, val, prev));
              }else if(scopeVal===-3){
                const k = mapPairKey(key,'value');
                const prev = targets.map(t=> t.getProp(k));
                this.app.cmd.execute(new UpdatePropertyCommand(targets, k, val, prev));
              }else{
                // 'Tutto' → set generic key (affects both as fallback)
                const prev = targets.map(t=> t.getProp(key));
                this.app.cmd.execute(new UpdatePropertyCommand(targets, key, val, prev));
              }
            }else{
              const prev = targets.map(t=> t.getProp(key));
              this.app.cmd.execute(new UpdatePropertyCommand(targets, key, val, prev));
            }
          }
        };


        if(v && typeof v==='object'){
          if(Object.prototype.hasOwnProperty.call(v,'__key')){ doSet(v.__key, v.value); return; }
          if(Array.isArray(v.__kv)){ v.__kv.forEach(({key,value})=> doSet(key,value)); return; }
        }

        doSet(prop.key, v);
      };
      const control = prop.render(
        (function(){
          const curTarget = targets[0];
          let initialVal = curTarget.getProp(prop.key);
          const type = curTarget && (curTarget.type || (curTarget.constructor && curTarget.constructor.type));
          if(groupName==='Stile' && (type==='radiogroup' || type==='checkboxgroup' || type==='pairs')){
            const scope = curTarget.getProp('styleScope');
            if(Number.isInteger(scope) && scope>=0){
              const styles = curTarget.getProp('itemStyles')||{};
              const ov = Object.assign({}, styles[scope]||{});
              if(Object.prototype.hasOwnProperty.call(ov, prop.key)) initialVal = ov[prop.key];
            }
          }
          return initialVal;
        })(),
        (v)=> apply(v),
        {targets, app: this.app}
      );
      if(control) section.appendChild(control);
    });
  });
    // Image tools property (crop) — unified secondary button
    (function(){
      try{
        const stage = this.app.stage;
        const targets = stage.selected.length? stage.selected : [];
        const imgSelected = targets.length===1 && typeof targets[0].getProp==='function' && typeof targets[0].getProp('fit')!=='undefined';
        if(false && imgSelected && this.app?.cropTool){
          const grp = document.createElement('div'); grp.className='prop-group';
          const h2 = document.createElement('h4'); h2.textContent='Strumenti immagine'; grp.appendChild(h2);

          const action = document.createElement('button'); action.type='button'; action.className='btn';
          action.textContent = (this.app.cropTool.active ? 'Conferma ritaglio' : 'Ritaglia immagine');
          action.addEventListener('click', (e)=>{
            e.preventDefault(); e.stopPropagation();
            if(!this.app.cropTool.active){ this.app.cropTool.activate(); action.textContent = 'Conferma ritaglio'; refreshSecondary(); }
            else { this.app.cropTool.confirm(); action.textContent = 'Ritaglia immagine'; refreshSecondary(); }
          });

          const secondary = document.createElement('button'); secondary.type='button'; secondary.className='btn'; secondary.style.marginLeft='8px';

          const refreshSecondary = ()=>{
            if(this.app.cropTool.active){
              secondary.textContent = 'Annulla';
              secondary.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); this.app.cropTool.cancel(); action.textContent='Ritaglia immagine'; refreshSecondary(); };
            } else {
              secondary.textContent = 'Reimposta crop';
              secondary.onclick = (e)=>{
                e.preventDefault(); e.stopPropagation();
                if(!targets.length) return;
                const prev = targets.map(x=> x.getProp('srcRect')||{x:0,y:0,w:100,h:100});
                const val = {x:0,y:0,w:100,h:100};
                this.app.cmd.execute(new UpdatePropertyCommand(targets, 'srcRect', val, prev));
              };
            }
          };
          refreshSecondary();

          grp.appendChild(action); grp.appendChild(secondary);
          this.form.appendChild(grp);
        }
      }catch(e){ /* no-op */ }
    }).call(this);
}
}