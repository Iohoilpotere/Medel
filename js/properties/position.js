
import { BaseProperty } from './base-property.js';
import { numberInput } from './common-controls.js';
import { registry } from '../core/registry.js';

export class PositionProperty extends BaseProperty{
  constructor(){ super('position', 'Posizione', 'Layout'); }
  render(value, onChange, {targets}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Posizione'; wrap.appendChild(h);
    const rowX = document.createElement('div'); rowX.className='prop-row'; const labX=document.createElement('label'); labX.textContent='X'; rowX.appendChild(labX);
    rowX.appendChild(numberInput(value?.x ?? targets[0].x, 1, v=>onChange({...value, x:v})).firstChild);
    const rowY = document.createElement('div'); rowY.className='prop-row'; const labY=document.createElement('label'); labY.textContent='Y'; rowY.appendChild(labY);
    rowY.appendChild(numberInput(value?.y ?? targets[0].y, 1, v=>onChange({...value, y:v})).firstChild);
    wrap.append(rowX,rowY);
    return wrap;
  }
  static appliesTo(){ return true; }
}
PositionProperty.type='position'; registry.registerProperty(PositionProperty.type, PositionProperty);
