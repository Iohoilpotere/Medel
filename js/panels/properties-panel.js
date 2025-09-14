
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
