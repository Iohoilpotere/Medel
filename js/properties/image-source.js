
import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class ImageSourceProperty extends BaseProperty{
  constructor(){ super('imageSource', 'Sorgente', 'Contenuto'); }
  static appliesTo(el){ try{ return typeof el.getProp==='function' && typeof el.getProp('url')!=='undefined'; }catch(e){ return false; } }
  render(_value, _onChange, {targets, app}){
    const target = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Sorgente'; wrap.appendChild(h);
    const row = document.createElement('div'); row.className='prop-row';
    const lab = document.createElement('label'); lab.textContent='URL'; row.appendChild(lab);
    const inp = document.createElement('input'); inp.type='text'; inp.value = target.getProp('url') || '';
    inp.placeholder = 'https://...';
    inp.addEventListener('change', ()=>{
      const prev = [target.getProp('url')];
      app.cmd.execute(new UpdatePropertyCommand([target], 'url', inp.value.trim(), prev));
    });
    row.appendChild(inp);
    wrap.appendChild(row);
    return wrap;
  }
}
ImageSourceProperty.type='image-source';
registry.registerProperty(ImageSourceProperty.type, ImageSourceProperty);
