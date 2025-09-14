import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { colorPicker } from './common-controls.js';

export class BackgroundBorderProperty extends BaseProperty{
  constructor(){ super('backgroundBorder','Sfondo & Bordo','Stile'); }
  static appliesTo(el){
    const t = el && el.type;
    if(t==='radiogroup' || t==='checkboxgroup') return false;
    return t==='label' || t==='textbox' || t==='checkbox';
  }
  render(value,onChange,{targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Sfondo & Bordo'; wrap.appendChild(h);

    const rowBG=document.createElement('div'); rowBG.className='prop-row';
    const labBG=document.createElement('label'); labBG.textContent='Colore sfondo'; rowBG.appendChild(labBG);
    const bg=colorPicker(targets[0].getProp('backgroundColor')||'rgba(0,0,0,0)', v=> targets.forEach(t=> t.setProp('backgroundColor', v)));
    rowBG.appendChild(bg); wrap.appendChild(rowBG);

    const rowBC=document.createElement('div'); rowBC.className='prop-row';
    const labBC=document.createElement('label'); labBC.textContent='Colore bordo'; rowBC.appendChild(labBC);
    const bc=colorPicker(targets[0].getProp('borderColor')||'rgba(0,0,0,0)', v=> targets.forEach(t=> t.setProp('borderColor', v)));
    rowBC.appendChild(bc); wrap.appendChild(rowBC);

    const mkNum=(label, key, step=1)=>{
      const row=document.createElement('div'); row.className='prop-row';
      const lab=document.createElement('label'); lab.textContent=label; row.appendChild(lab);
      const inp=document.createElement('input'); inp.type='number'; inp.step=String(step); inp.value=targets[0].getProp(key) ?? 0;
      inp.addEventListener('input', ()=> targets.forEach(t=> t.setProp(key, parseFloat(inp.value))));
      row.appendChild(inp);
      return row;
    };
    wrap.appendChild(mkNum('Spessore bordo (px)','borderWidth',1));

    const rowBS=document.createElement('div'); rowBS.className='prop-row';
    const labBS=document.createElement('label'); labBS.textContent='Stile bordo'; rowBS.appendChild(labBS);
    const bs=document.createElement('select'); ['solid','dashed','dotted'].forEach(o=>{ const opt=document.createElement('option'); opt.value=o; opt.textContent=o; if((targets[0].getProp('borderStyle')||'solid')===o) opt.selected=true; bs.appendChild(opt); });
    bs.addEventListener('change', ()=> targets.forEach(t=> t.setProp('borderStyle', bs.value)));
    rowBS.appendChild(bs); wrap.appendChild(rowBS);

    wrap.appendChild(mkNum('Raggio (px)','borderRadius',1));

    return wrap;
  }
}
BackgroundBorderProperty.type='backgroundBorder';
registry.registerProperty(BackgroundBorderProperty.type, BackgroundBorderProperty);
