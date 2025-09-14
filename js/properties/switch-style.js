import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { colorPicker, numberInput } from './common-controls.js';

export class SwitchStyleProperty extends BaseProperty{
  constructor(){ super('switchStyle', 'Sfondo / Interruttore', 'Sfondo'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    if(t!=='checkbox') return false;
    const sel = el.getProp('selectionStyle') || 'standard';
    return sel === 'switch';
  }
  render(_value, onChange, {targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Interruttore'; wrap.appendChild(h);
    const mkColor = (lab,key,def)=>{ const r=document.createElement('div'); r.className='prop-row'; const l=document.createElement('label'); l.textContent=lab; r.appendChild(l); r.appendChild(colorPicker(el.getProp(key) ?? def, v=> onChange({__key:key, value:v}))); return r; };
    const mkNum = (lab,key,def,step=1)=>{ const r=document.createElement('div'); r.className='prop-row'; const l=document.createElement('label'); l.textContent=lab; r.appendChild(l); r.appendChild(numberInput(Number.isFinite(el.getProp(key))? el.getProp(key) : def, step, v=> onChange({__key:key, value:v})).firstChild); return r; };
    wrap.appendChild(mkColor('Colore ON','switchBgOn','#4ade80'));
    wrap.appendChild(mkColor('Colore OFF','switchBgOff','#666'));
    wrap.appendChild(mkColor('Bordo colore','switchBorderColor','rgba(255,255,255,0.3)'));
    wrap.appendChild(mkNum('Bordo spessore','switchBorderWidth',1,1));
    wrap.appendChild(mkNum('Raggio','switchRadius',9,1));
    wrap.appendChild(mkColor('Ombra colore','switchShadowColor',''));
    wrap.appendChild(mkNum('Ombra dx','switchShadowDx',0,1));
    wrap.appendChild(mkNum('Ombra dy','switchShadowDy',0,1));
    wrap.appendChild(mkNum('Ombra blur','switchShadowBlur',0,0.5));
    wrap.appendChild(mkColor('Knob colore','switchKnobColor','#ffffff'));
    return wrap;
  }
}
SwitchStyleProperty.type='switch-style';
registry.registerProperty(SwitchStyleProperty.type, SwitchStyleProperty);