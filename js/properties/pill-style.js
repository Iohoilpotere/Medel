import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { colorPicker, numberInput } from './common-controls.js';

export class PillStyleProperty extends BaseProperty{
  constructor(){ super('pillStyle', 'Sfondo / Pillole', 'Sfondo'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    if(t!=='checkboxgroup') return false;
    const sel = el.getProp('selectionStyle') || 'standard';
    return sel === 'pills';
  }
  render(_value, onChange, {targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Pillole'; wrap.appendChild(h);

    const makeColor = (label,key,def)=>{
      const row=document.createElement('div'); row.className='prop-row';
      const lab=document.createElement('label'); lab.textContent=label; row.appendChild(lab);
      row.appendChild(colorPicker(el.getProp(key) ?? def, v=> onChange({__key:key, value:v})));
      return row;
    };
    const makeNum = (label,key,def,step=1)=>{
      const row=document.createElement('div'); row.className='prop-row';
      const lab=document.createElement('label'); lab.textContent=label; row.appendChild(lab);
      row.appendChild(numberInput(Number.isFinite(el.getProp(key))? el.getProp(key): def, step, v=> onChange({__key:key, value:v})).firstChild);
      return row;
    };

    wrap.appendChild(makeColor('Colore ON','pillBgColor','#4ade80'));
    wrap.appendChild(makeColor('Colore OFF','pillBgOff','transparent'));
    wrap.appendChild(makeColor('Bordo colore','pillBorderColor','rgba(255,255,255,0.3)'));
    wrap.appendChild(makeNum('Bordo spessore','pillBorderWidth',1,1));
    wrap.appendChild(makeNum('Raggio','pillRadius',999,1));
    wrap.appendChild(makeColor('Ombra colore','pillShadowColor',''));
    wrap.appendChild(makeNum('Ombra dx','pillShadowDx',0,1));
    wrap.appendChild(makeNum('Ombra dy','pillShadowDy',0,1));
    wrap.appendChild(makeNum('Ombra blur','pillShadowBlur',0,0.5));
    wrap.appendChild(makeColor('Testo ON','pillTextOnColor','#000000'));
    wrap.appendChild(makeColor('Testo OFF','pillTextOffColor','inherit'));
    wrap.appendChild(makeNum('Padding Y','pillPadY',6,1));
    wrap.appendChild(makeNum('Padding X','pillPadX',10,1));

    const note=document.createElement('div');
    note.className='muted';
    note.textContent = 'Se le ombre non sono impostate, viene usata l\'ombra testo come fallback.';
    wrap.appendChild(note);

    return wrap;
  }
}
PillStyleProperty.type='pill-style';
registry.registerProperty(PillStyleProperty.type, PillStyleProperty);