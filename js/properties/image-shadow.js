
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

class ImageShadowProperty extends BaseProperty{
  constructor(){ super('imgShadowGroup', 'Stile', 'Ombra'); }
  static appliesTo(el){ return (el && (el.type||el.constructor.type))==='image'; }
  render(_v,_onChange,{targets,app}){
    const el=targets[0]; const wrap=document.createElement('div'); wrap.className='prop-group';
    const addRow=(label,editor)=>{ const r=document.createElement('div'); r.className='prop-row'; const lab=document.createElement('label'); lab.textContent=label; r.appendChild(lab); r.appendChild(editor); wrap.appendChild(r); };
    // enable
    const on=document.createElement('input'); on.type='checkbox'; on.checked=!!el.getProp('imgShadow'); on.addEventListener('change',()=> app.cmd.execute(new UpdatePropertyCommand([el],'imgShadow', on.checked, [!!el.getProp('imgShadow')])));
    // color
    const col=document.createElement('input'); col.type='color'; col.value=el.getProp('imgShadowColor')||'#000000'; col.addEventListener('input',()=> app.cmd.execute(new UpdatePropertyCommand([el],'imgShadowColor', col.value, [el.getProp('imgShadowColor')])));
    // dx dy blur
    const dx=document.createElement('input'); dx.type='number'; dx.step='1'; dx.value=el.getProp('imgShadowDx')||0; dx.addEventListener('change',()=> app.cmd.execute(new UpdatePropertyCommand([el],'imgShadowDx', Number(dx.value), [el.getProp('imgShadowDx')])));
    const dy=document.createElement('input'); dy.type='number'; dy.step='1'; dy.value=el.getProp('imgShadowDy')||0; dy.addEventListener('change',()=> app.cmd.execute(new UpdatePropertyCommand([el],'imgShadowDy', Number(dy.value), [el.getProp('imgShadowDy')])));
    const blur=document.createElement('input'); blur.type='number'; blur.step='1'; blur.value=el.getProp('imgShadowBlur')||6; blur.addEventListener('change',()=> app.cmd.execute(new UpdatePropertyCommand([el],'imgShadowBlur', Number(blur.value), [el.getProp('imgShadowBlur')])));
    addRow('Abilita', on); addRow('Colore', col); addRow('Offset X', dx); addRow('Offset Y', dy); addRow('Sfocatura', blur);
    return wrap;
  }
}
ImageShadowProperty.type='image-shadow'; registry.registerProperty(ImageShadowProperty.type, ImageShadowProperty);
