import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';

export class NameIdProperty extends BaseProperty{
  constructor(){ super('id', 'Nome (univoco)', 'Identificatore'); }

  static appliesTo(el){
    // Show for any canvas element (has getProp/setProp)
    return el && typeof el.getProp==='function' && typeof el.setProp==='function';
  }

  render(value, onChange, {targets, app}){
    const t = targets && targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Identificatore'; wrap.appendChild(h);
    const content = document.createElement('div'); content.className='prop-group-content'; wrap.appendChild(content);

    const row = document.createElement('div'); row.className='prop-row'; content.appendChild(row);
    const lab = document.createElement('label'); lab.textContent='Nome (univoco)'; row.appendChild(lab);
    const inp = document.createElement('input'); inp.type='text'; inp.value = String(value ?? (t?.getProp('id') ?? '')); row.appendChild(inp);

    const help = document.createElement('div'); help.className='prop-help'; help.style.fontSize='12px'; help.style.opacity='0.75';
    help.textContent='Usato come chiave univoca nel progetto. Cambiandolo rinomini anche l\'id.';
    content.appendChild(help);

    function collectIds(){
      const proj = app && app.project;
      const set = new Set();
      if(!proj) return set;
      const steps = Array.isArray(proj.steps) ? proj.steps : [];
      const visit = (node)=>{
        if(!node) return;
        const p = node.props || {};
        const id = p.id != null ? String(p.id) : null;
        if(id) set.add(id);
        const kids = node.children || node.elements || [];
        for(const k of kids) visit(k);
      };
      for(const s of steps){
        const kids = s.children || s.elements || [];
        for(const k of kids) visit(k);
      }
      return set;
    }

    function apply(val){
      const v = String(val||'').trim();
      if(!v){ alert('Il Nome non può essere vuoto.'); inp.value = String(t?.getProp('id') ?? ''); return; }
      // allow same as current
      const current = String(t?.getProp('id') ?? '');
      if(v !== current){
        const ids = collectIds();
        if(ids.has(v)){
          alert(`Il Nome "${v}" è già in uso in questo progetto.`);
          inp.value = current;
          return;
        }
      }
      // Set both id and name using multi-key patch supported by PropertiesPanel
      onChange(v); try{ if(t) t.name = v; }catch(e){}
    }

    inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter') apply(inp.value); });
    inp.addEventListener('blur', ()=> apply(inp.value));

    return wrap;
  }
}
NameIdProperty.type = 'name-id';
registry.registerProperty(NameIdProperty.type, NameIdProperty);
