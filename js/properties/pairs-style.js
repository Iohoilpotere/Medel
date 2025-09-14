
import { BaseProperty } from './base-property.js';
import { registry } from '../core/registry.js';
import { colorPicker } from './common-controls.js';

export class PairsStyleProperty extends BaseProperty{
  constructor(){ super('pairsStyle','Stile coppie','Stile'); }
  static appliesTo(el){ const t=el && (el.type || el.constructor?.type); return t==='pairs'; }
  render(_value, onChange, {targets}){
    const el = targets[0];
    const wrap = document.createElement('div'); wrap.className='prop-group';
    const h = document.createElement('h4'); h.textContent='Stile coppie'; wrap.appendChild(h);

    const section = (title, prefix)=>{
      const box = document.createElement('div'); box.style.border='1px solid rgba(255,255,255,0.1)'; box.style.padding='8px'; box.style.borderRadius='6px'; box.style.margin='6px 0';
      const t = document.createElement('div'); t.textContent=title; t.style.fontWeight='600'; t.style.marginBottom='6px'; box.appendChild(t);

      const mkNum=(label,key,def,step=1)=>{
        const row=document.createElement('div'); row.className='prop-row';
        const lab=document.createElement('label'); lab.textContent=label; row.appendChild(lab);
        const inp=document.createElement('input'); inp.type='number'; inp.step=String(step); inp.value = String(el.getProp(prefix+key) ?? def);
        inp.addEventListener('input', ()=> onChange({__key: prefix+key, value: parseFloat(inp.value)}));
        row.appendChild(inp); return row;
      };

      // colore
      const rowC = document.createElement('div'); rowC.className='prop-row';
      const labC = document.createElement('label'); labC.textContent='Colore'; rowC.appendChild(labC);
      rowC.appendChild(colorPicker(el.getProp(prefix+'Color') || el.getProp('color') || '#ffffff', v=> onChange({__key: prefix+'Color', value: v})));
      box.appendChild(rowC);

      // font size
      box.appendChild(mkNum('Dimensione','FontSize',16,1));

      // grassetto
      const rowB = document.createElement('div'); rowB.className='prop-row';
      const labB = document.createElement('label'); labB.textContent='Grassetto'; rowB.appendChild(labB);
      const chkB = document.createElement('input'); chkB.type='checkbox'; chkB.checked = !!el.getProp(prefix+'Bold');
      chkB.addEventListener('change', ()=> onChange({__key: prefix+'Bold', value: !!chkB.checked}));
      rowB.appendChild(chkB); box.appendChild(rowB);

      // corsivo
      const rowI = document.createElement('div'); rowI.className='prop-row';
      const labI = document.createElement('label'); labI.textContent='Corsivo'; rowI.appendChild(labI);
      const chkI = document.createElement('input'); chkI.type='checkbox'; chkI.checked = !!el.getProp(prefix+'Italic');
      chkI.addEventListener('change', ()=> onChange({__key: prefix+'Italic', value: !!chkI.checked}));
      rowI.appendChild(chkI); box.appendChild(rowI);

      // line-height
      box.appendChild(mkNum('Interlinea','LineHeight',1.25,0.05));

      // letter spacing
      box.appendChild(mkNum('Spaziatura lettere','LetterSpacing',0,0.5));

      return box;
    };

    wrap.appendChild(section('Colonna chiave', 'key'));
    wrap.appendChild(section('Colonna valore', 'value'));
    return wrap;
  }
}
PairsStyleProperty.type='pairs-style';
registry.registerProperty(PairsStyleProperty.type, PairsStyleProperty);
