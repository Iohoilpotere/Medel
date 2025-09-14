import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { colorPicker, numberInput } from './common-controls.js';

export class PillItemBackgroundProperty extends BaseProperty{
  constructor(){ super('pillItemBackground','Pill singola – Sfondo','Sfondo'); }
  static appliesTo(el){
    const t = el && (el.type || (el.constructor && el.constructor.type));
    if(t!=='checkboxgroup') return false;
    return (el.getProp('selectionStyle')||'standard')==='pills';
  }
  render(_value, onChange, {targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Pill singola – Sfondo'; wrap.appendChild(h);

    const items = Array.isArray(el.getProp('items')) ? el.getProp('items') : [];
    const rowSel = document.createElement('div'); rowSel.className='prop-row';
    const lab = document.createElement('label'); lab.textContent='Elemento'; rowSel.appendChild(lab);
    const sel = document.createElement('select');
    items.forEach((t,i)=>{ const o=document.createElement('option'); o.value=String(i); o.textContent=`${i+1}. ${t}`; sel.appendChild(o); });
    rowSel.appendChild(sel); wrap.appendChild(rowSel);

    const fields=document.createElement('div'); wrap.appendChild(fields);
    const mkRow=(l,ctrl)=>{ const r=document.createElement('div'); r.className='prop-row'; const ll=document.createElement('label'); ll.textContent=l; r.appendChild(ll); r.appendChild(ctrl); fields.appendChild(r); };

    const render=(idx)=>{
      fields.innerHTML='';
      const st=(el.getProp('itemStyles')||{})[idx] || {};
      mkRow('Colore ON', colorPicker(st.pillBgColor ?? (el.getProp('pillBgColor')||'rgba(76,222,128,1)'), v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillBgColor:v}}})));
      mkRow('Colore OFF', colorPicker(st.pillBgOff ?? (el.getProp('pillBgOff')||'transparent'), v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillBgOff:v}}})));
      mkRow('Bordo colore', colorPicker(st.pillBorderColor ?? (el.getProp('pillBorderColor')||'rgba(255,255,255,0.3)'), v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillBorderColor:v}}})));
      mkRow('Bordo spessore', numberInput(Number.isFinite(st.pillBorderWidth)? st.pillBorderWidth : (el.getProp('pillBorderWidth')||1), 1, v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillBorderWidth:v}}})).firstChild);
      mkRow('Raggio', numberInput(Number.isFinite(st.pillRadius)? st.pillRadius : (el.getProp('pillRadius')||999), 1, v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillRadius:v}}})).firstChild);
      mkRow('Ombra colore', colorPicker(st.pillShadowColor ?? (el.getProp('pillShadowColor')||''), v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillShadowColor:v}}})));
      mkRow('Ombra dx', numberInput(Number.isFinite(st.pillShadowDx)? st.pillShadowDx : (el.getProp('pillShadowDx')||0), 1, v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillShadowDx:v}}})).firstChild);
      mkRow('Ombra dy', numberInput(Number.isFinite(st.pillShadowDy)? st.pillShadowDy : (el.getProp('pillShadowDy')||0), 1, v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillShadowDy:v}}})).firstChild);
      mkRow('Ombra blur', numberInput(Number.isFinite(st.pillShadowBlur)? st.pillShadowBlur : (el.getProp('pillShadowBlur')||0), 0.5, v=> onChange({__key:'itemStyles', value:{__index:idx, __merge:{pillShadowBlur:v}}})).firstChild);
    };
    sel.addEventListener('change', ()=> render(parseInt(sel.value,10)||0));
    render(0);
    return wrap;
  }
}
PillItemBackgroundProperty.type='pill-item-background';
registry.registerProperty(PillItemBackgroundProperty.type, PillItemBackgroundProperty);