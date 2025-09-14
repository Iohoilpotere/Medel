import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';

export class StyleScopeProperty extends BaseProperty{
  constructor(){ super('styleScope','Applica a','Stile'); }
  static appliesTo(el){ const t=el&&(el.type||(el.constructor&&el.constructor.type)); return ['radiogroup','checkboxgroup','pairs'].includes(t); }
  render(value, onChange, {targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Applica a'; wrap.appendChild(h);
    const sel = document.createElement('select');
    const items = Array.isArray(el.getProp('items')) ? el.getProp('items') : [];
    const choices = [{v:-1, t:'Tutti gli elementi'}].concat(items.map((_,i)=>({v:i, t:`Elemento ${i+1}`})));
    (choices).forEach(o=>{ const opt=document.createElement('option'); opt.value=String(o.v); opt.textContent=o.t; if(String(value??-1)===String(o.v)) opt.selected=true; sel.appendChild(opt); });
    sel.addEventListener('change', ()=> onChange(parseInt(sel.value,10)));
    wrap.appendChild(sel);
    return wrap;
  }
}
StyleScopeProperty.type='style-scope'; registry.registerProperty(StyleScopeProperty.type, StyleScopeProperty);
