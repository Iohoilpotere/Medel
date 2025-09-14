import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';

export class AlignmentProperty extends BaseProperty{
  constructor(){ super('alignment','Allineamento','Allineamento'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    if(t==='radiogroup' || t==='checkboxgroup') return false;
    return t==='label' || t==='textbox' || t==='checkbox';
  }
  render(value,onChange,{targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Allineamento'; wrap.appendChild(h);
    const rowH=document.createElement('div'); rowH.className='prop-row';
    const labH=document.createElement('label'); labH.textContent='Orizzontale'; rowH.appendChild(labH);
    const selH=document.createElement('select');
    ['left','center','right','justify'].forEach(o=>{ const opt=document.createElement('option'); opt.value=o; opt.textContent=o; if((targets[0].getProp('alignH')||'left')===o) opt.selected=true; selH.appendChild(opt); });
    selH.addEventListener('change', ()=> targets.forEach(t=> t.setProp('alignH', selH.value)));
    rowH.appendChild(selH); wrap.appendChild(rowH);
    const rowV=document.createElement('div'); rowV.className='prop-row';
    const labV=document.createElement('label'); labV.textContent='Verticale'; rowV.appendChild(labV);
    const selV=document.createElement('select');
    ['top','middle','bottom'].forEach(o=>{ const opt=document.createElement('option'); opt.value=o; opt.textContent=o; if((targets[0].getProp('alignV')||'middle')===o) opt.selected=true; selV.appendChild(opt); });
    selV.addEventListener('change', ()=> targets.forEach(t=> t.setProp('alignV', selV.value)));
    rowV.appendChild(selV); wrap.appendChild(rowV);
    return wrap;
  }
}
AlignmentProperty.type='alignment';
registry.registerProperty(AlignmentProperty.type, AlignmentProperty);
