
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

class StrokeStyleProperty extends BaseProperty{
  constructor(){ super('strokeStyle', 'Stile', 'Stile traccia'); }
  static appliesTo(el){ const t=el&&(el.type||el.constructor.type); return ['image','label','pairs'].includes(t); }
  render(_v,_onChange,{targets,app}){
    const el=targets[0];
    const wrap=document.createElement('div'); wrap.className='prop-group';
    const row=document.createElement('div'); row.className='prop-row';
    const lab=document.createElement('label'); lab.textContent='Stile';
    const sel=document.createElement('select');
    ['line','dash','dot','dashdot','double','glow'].forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=k; sel.appendChild(o); });
    sel.value = el.getProp('strokeStyle') || 'line';
    sel.addEventListener('change', ()=> app.cmd.execute(new UpdatePropertyCommand([el],'strokeStyle', sel.value, [el.getProp('strokeStyle')])));
    row.appendChild(lab); row.appendChild(sel); wrap.appendChild(row); return wrap;
  }
}
StrokeStyleProperty.type='stroke-style'; registry.registerProperty(StrokeStyleProperty.type, StrokeStyleProperty);
