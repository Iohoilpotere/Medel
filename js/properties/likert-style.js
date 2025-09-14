import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { colorPicker, numberInput } from './common-controls.js';

export class LikertStyleProperty extends BaseProperty{
  constructor(){ super('likertStyle', 'Likert – maniglia', 'Sfondo'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    if(t!=='radiogroup') return false;
    const sel = el.getProp('selectionStyle') || 'standard';
    return sel === 'likert';
  }
  render(_value, onChange, {targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Likert – maniglia'; wrap.appendChild(h);
    const mkColor = (lab,key,def)=>{ const r=document.createElement('div'); r.className='prop-row'; const l=document.createElement('label'); l.textContent=lab; r.appendChild(l); r.appendChild(colorPicker(el.getProp(key) ?? def, v=> onChange({__key:key, value:v}))); return r; };
    const mkNum = (lab,key,def,step=1)=>{ const r=document.createElement('div'); r.className='prop-row'; const l=document.createElement('label'); l.textContent=lab; r.appendChild(l); r.appendChild(numberInput(Number.isFinite(el.getProp(key))? el.getProp(key) : def, step, v=> onChange({__key:key, value:v})).firstChild); return r; };

    wrap.appendChild(mkColor('Colore maniglia','likertThumbColor','#22c55e'));
    wrap.appendChild(mkColor('Colore track','likertTrackColor','rgba(255,255,255,0.25)'));
    wrap.appendChild(mkColor('Bordo colore','likertBorderColor','transparent'));
    wrap.appendChild(mkNum('Bordo spessore','likertBorderWidth',0,1));
    wrap.appendChild(mkNum('Raggio track','likertRadius',6,1));
    wrap.appendChild(mkNum('Altezza track','likertHeight',6,1));
    wrap.appendChild(mkColor('Ombra colore','likertShadowColor',''));
    wrap.appendChild(mkNum('Ombra dx','likertShadowDx',0,1));
    wrap.appendChild(mkNum('Ombra dy','likertShadowDy',0,1));
    wrap.appendChild(mkNum('Ombra blur','likertShadowBlur',0,0.5));
    return wrap;
  }
}
LikertStyleProperty.type='likert-style';
registry.registerProperty(LikertStyleProperty.type, LikertStyleProperty);