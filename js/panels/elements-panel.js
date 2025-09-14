import { h, $ } from '../utils/dom.js';
import { registry } from '../core/registry.js';

export class ElementsPanel{
  constructor(app){ this.app=app; this.list = $('#elementPalette'); this.render(); }
  render(){
    this.list.innerHTML='';
    const friendly = {
      label:'Etichetta',
      textbox:'Campo di testo',
      image:'Immagine',
      checkbox:'Checkbox',
      checkboxgroup:'Gruppo di checkbox',
      radiogroup:'Gruppo di opzioni',
      pairs:'Coppie',
      pdf:'PDF'
    };
    const icons = {
      label:'🏷️', textbox:'📝', image:'🖼️',
      checkbox:'☑️', checkboxgroup:'✅', radiogroup:'🔘', pairs:'🧾', pdf:'📄'
    };
    for(const t of registry.getElementTypes()){
      const li = h('li', {draggable:'true'});
      const row = h('div',{}); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px';
      row.appendChild(h('span',{}, icons[t]||'🔧'));
      row.appendChild(h('span',{}, friendly[t]||t));
      li.appendChild(row);
      li.appendChild(h('small',{}, 'drag'));
      li.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/element-type', t); });
      li.addEventListener('click', ()=> this.app.createElement(t));
      this.list.append(li);
    }
  }
}