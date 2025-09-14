
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';

export class PairsAlignmentProperty extends BaseProperty{
  constructor(){ super('pairsAlign','Allineamento colonne','Stile'); }
  static appliesTo(el){ const t=el && (el.type || el.constructor?.type); return t==='pairs'; }
  render(_value, onChange, {targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Allineamento colonne'; wrap.appendChild(h);

    const mkSel = (label, key)=>{
      const row = document.createElement('div'); row.className='prop-row';
      const lab = document.createElement('label'); lab.textContent=label; row.appendChild(lab);
      const sel = document.createElement('select');
      [['left','Sinistra'],['center','Centro'],['right','Destra']].forEach(([v,txt])=>{
        const o=document.createElement('option'); o.value=v; o.textContent=txt; sel.appendChild(o);
      });
      sel.value = el.getProp(key) || 'left';
      sel.addEventListener('change', ()=> onChange({__key:key, value: sel.value}));
      row.appendChild(sel); wrap.appendChild(row);
    };
    mkSel('Chiave', 'keyAlign');
    mkSel('Valore', 'valueAlign');
    return wrap;
  }
}
PairsAlignmentProperty.type='pairs-align';
registry.registerProperty(PairsAlignmentProperty.type, PairsAlignmentProperty);
