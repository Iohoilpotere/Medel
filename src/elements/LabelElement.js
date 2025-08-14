import BaseElement from '../core/base-element.js';
export default class LabelElement extends BaseElement{
  constructor(){ super('label', 10,10,30,10); this.text='Etichetta'; this.fontSize=2.2; this.color='#ffffff'; this.align='left'; }
  createDom(){ const el=document.createElement('div'); el.className='el el-label p-2'; el.dataset.type='label'; el.id=this.id; el.innerHTML = `<div class="content w-100 h-100 d-flex align-items-center">${this.text}</div>`; this.dom=el; this.readProps(); return el; }
  getPropSchema(){ return [ ...super.getPropSchema(), {key:'text',label:'Testo',type:'textarea'}, {key:'fontSize',label:'Dimensione (vw)',type:'number',min:.5}, {key:'color',label:'Colore',type:'color'}, {key:'align',label:'Allineamento',type:'select',options:[['left','Sinistra'],['center','Centro'],['right','Destra']] } ]; }
  readProps(){ const c=this.dom.querySelector('.content'); c.textContent=this.text; this.dom.style.color=this.color; this.dom.style.fontSize=this.fontSize+'vw'; c.style.justifyContent = this.align==='left'? 'flex-start' : this.align==='center'? 'center':'flex-end'; }
}