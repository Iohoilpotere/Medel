
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

class ImageBorderProperty extends BaseProperty{
  constructor(){ super('imageBorder', 'Stile', 'Bordo immagine'); }
  static appliesTo(el){ return (el && (el.type||el.constructor.type))==='image'; }
  render(_v, _onChange, {targets, app}){
    const el=targets[0];
    const wrap=document.createElement('div'); wrap.className='prop-group';
    const addRow=(label,editor)=>{ const r=document.createElement('div'); r.className='prop-row'; r.appendChild(Object.assign(document.createElement('label'),{textContent:label})); r.appendChild(editor); wrap.appendChild(r); };
    // width
    const wInp=document.createElement('input'); wInp.type='number'; wInp.value=el.getProp('borderWidth')||0; wInp.min='0'; wInp.step='1';
    wInp.addEventListener('change', ()=> app.cmd.execute(new UpdatePropertyCommand([el],'borderWidth', Number(wInp.value), [el.getProp('borderWidth')])));
    // style
    const styles=['solid','dashed','dotted','double','groove','ridge','inset','outset'];
    const sSel=document.createElement('select'); styles.forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; sSel.appendChild(o);}); sSel.value=el.getProp('borderStyle')||'solid';
    sSel.addEventListener('change', ()=> app.cmd.execute(new UpdatePropertyCommand([el],'borderStyle', sSel.value, [el.getProp('borderStyle')])));
    // color
    const col=document.createElement('input'); col.type='color'; col.value=el.getProp('borderColor')||'#ffffff';
    col.addEventListener('input', ()=> app.cmd.execute(new UpdatePropertyCommand([el],'borderColor', col.value, [el.getProp('borderColor')])));
    addRow('Spessore (px)', wInp); addRow('Stile', sSel); addRow('Colore', col);
    return wrap;
  }
}
ImageBorderProperty.type='image-border'; registry.registerProperty(ImageBorderProperty.type, ImageBorderProperty);
