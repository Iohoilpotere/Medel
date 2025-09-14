import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

class GroupDirectionProperty extends BaseProperty{
  constructor(){ super('itemsDirection', 'Contenuto', 'Allineamento'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    return t==='radiogroup' || t==='checkboxgroup';
  }
  render(_v,_onChange,{targets,app}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent = 'Disposizione';
    const sel = document.createElement('select');
    [['vertical','Verticale'],['horizontal','Orizzontale']].forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; sel.appendChild(o); });
    sel.value = el.getProp('itemsDirection') || 'vertical';
    sel.addEventListener('change', ()=>{
      const prev = [el.getProp('itemsDirection')];
      app.cmd.execute(new UpdatePropertyCommand([el],'itemsDirection', sel.value, prev));
    });
    row.appendChild(lab); row.appendChild(sel); wrap.appendChild(row);
    return wrap;
  }
}
GroupDirectionProperty.type='group-direction';
registry.registerProperty(GroupDirectionProperty.type, GroupDirectionProperty);