
import { BaseProperty } from './base-property.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';
import { registry } from '../core/registry.js';

export class ImageCropProperty extends BaseProperty{
  constructor(){ super('imageCrop', 'Strumenti immagine', 'Stile'); }
  render(_value, _onChange, {targets, app}){
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent = 'Strumenti immagine'; wrap.appendChild(h);

    const btn = document.createElement('button'); btn.type='button';
    btn.className = 'btn';
    const enabled = (targets.length===1 && typeof targets[0].getProp('fit')!=='undefined');
    btn.disabled = !enabled;
    btn.textContent = (app?.cropTool?.active ? 'Conferma ritaglio' : 'Ritaglia immagine');
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      if(!app.cropTool.active){ app.cropTool.activate(); btn.textContent='Conferma ritaglio'; refreshSecondary(); }
      else { app.cropTool.confirm(); btn.textContent='Ritaglia immagine'; refreshSecondary(); }
    });
    const secondary = document.createElement('button');
    secondary.type='button'; secondary.className='btn'; secondary.style.marginLeft='8px';
    function refreshSecondary(){
      if(app.cropTool.active){
        secondary.textContent='Annulla';
        secondary.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); app.cropTool.cancel(); btn.textContent='Ritaglia immagine'; refreshSecondary(); };
      }else{
        secondary.textContent='Reimposta crop';
        secondary.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); const prev = targets.map(x=> x.getProp('srcRect')||{x:0,y:0,w:100,h:100}); const val = {x:0,y:0,w:100,h:100}; app.cmd.execute(new UpdatePropertyCommand(targets, 'srcRect', val, prev)); };
      }
    }
    refreshSecondary();
    wrap.appendChild(btn);
    wrap.appendChild(secondary);
    return wrap;
  }
  static appliesTo(el){ return typeof el.getProp==='function' && typeof el.getProp('fit')!=='undefined'; }
}
ImageCropProperty.type='image-crop';
registry.registerProperty(ImageCropProperty.type, ImageCropProperty);
