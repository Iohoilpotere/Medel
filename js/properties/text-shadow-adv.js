
import { BaseProperty } from './base-property.js';
import { colorPicker } from './common-controls.js';
import { registry } from '../core/registry.js';
function __isTextElement(el){ const t = el && (el.type || (el.constructor && el.constructor.type)); return ['label','checkbox','checkboxgroup','radiogroup','textbox','pairs'].includes(t); }
export class TextShadowAdvProperty extends BaseProperty{
  constructor(){ super('textShadowAdv','Ombra','Stile'); }
  render(value,onChange,{targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h=document.createElement('h4'); h.textContent='Ombra'; wrap.appendChild(h);
    const getScoped=(key,def)=>{ try{ const s=el.getProp('styleScope'); if(Number.isInteger(s)&&s>=0){ const st=el.getProp('itemStyles')||{}; if(st[s]&&Object.prototype.hasOwnProperty.call(st[s],key)) return st[s][key]; } }catch(e){} const v=el.getProp(key); return (v!==undefined? v: def); };
    const enRow=document.createElement('div'); enRow.className='prop-row';
    const enLab=document.createElement('label'); enLab.textContent='Abilita'; enRow.appendChild(enLab);
    const en=document.createElement('input'); en.type='checkbox'; en.checked=!!(getScoped('shadow', true));
    en.addEventListener('change', ()=> onChange({__key:'shadow', value:!!en.checked}));
    enRow.appendChild(en); wrap.appendChild(enRow);
    const rowC=document.createElement('div'); rowC.className='prop-row';
    const labC=document.createElement('label'); labC.textContent='Colore'; rowC.appendChild(labC);
    rowC.appendChild(colorPicker(getScoped('shadowColor','rgba(0,0,0,0.5)'), v=> onChange({__key:'shadowColor', value:v})));
    wrap.appendChild(rowC);
    const mkNum=(label,key,def=0,step=1)=>{ const r=document.createElement('div'); r.className='prop-row'; const lab=document.createElement('label'); lab.textContent=label; r.appendChild(lab); const inp=document.createElement('input'); inp.type='number'; inp.step=String(step); inp.value=getScoped(key,def); inp.addEventListener('input', ()=> onChange({__key:key, value: parseFloat(inp.value)})); r.appendChild(inp); return r; };
    wrap.appendChild(mkNum('Offset X','shadowDx',0,1));
    wrap.appendChild(mkNum('Offset Y','shadowDy',0,1));
    wrap.appendChild(mkNum('Sfocatura','shadowBlur',6,0.5));
    return wrap;
  }
  static appliesTo(el){ return __isTextElement(el); }
}
TextShadowAdvProperty.type='textShadowAdv'; registry.registerProperty(TextShadowAdvProperty.type, TextShadowAdvProperty);
