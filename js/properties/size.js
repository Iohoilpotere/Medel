
import { BaseProperty } from './base-property.js';
import { numberInput } from './common-controls.js';
import { registry } from '../core/registry.js';

export class SizeProperty extends BaseProperty{
  constructor(){ super('size', 'Dimensioni', 'Layout'); }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Dimensioni'; wrap.appendChild(h);
    const r1 = document.createElement('div'); r1.className='prop-row'; const l1=document.createElement('label'); l1.textContent='Larghezza'; r1.appendChild(l1);
    r1.appendChild(numberInput(value?.w ?? targets[0].w, 1, v=>onChange({...value, w:v})).firstChild);
    const r2 = document.createElement('div'); r2.className='prop-row'; const l2=document.createElement('label'); l2.textContent='Altezza'; r2.appendChild(l2);
    r2.appendChild(numberInput(value?.h ?? targets[0].h, 1, v=>onChange({...value, h:v})).firstChild);
    wrap.append(r1,r2);
    return wrap;
  }
  static appliesTo(){ return true; }
}
SizeProperty.type='size'; registry.registerProperty(SizeProperty.type, SizeProperty);
