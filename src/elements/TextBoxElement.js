import BaseElement from '../core/base-element.js';
export default class TextBoxElement extends BaseElement{
  constructor(){ super('textbox', 12,40,35,6); this.placeholder='Inserisci testo…'; this.name='campo'; this.align='left'; }
  createDom(){ const el=document.createElement('div'); el.className='el el-textbox p-2'; el.dataset.type='textbox'; el.id=this.id; el.innerHTML = `<input class="form-control form-control-sm h-100" type="text" name="${this.name}" placeholder="${this.placeholder}" />`; this.dom=el; this.readProps(); return el; }
  getPropSchema(){ return [ ...super.getPropSchema(), {key:'name',label:'Name',type:'text'}, {key:'placeholder',label:'Placeholder',type:'text'}, {key:'align',label:'Allineamento testo',type:'select',options:[['left','Sinistra'],['center','Centro'],['right','Destra']]} ]; }
  readProps(){ const i=this.dom.querySelector('input'); i.name=this.name; i.placeholder=this.placeholder; i.style.textAlign=this.align; }
}