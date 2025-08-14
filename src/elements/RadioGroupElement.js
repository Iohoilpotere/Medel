import BaseElement from '../core/base-element.js';
export default class RadioGroupElement extends BaseElement{
  constructor(){ super('radiogroup', 12,58,35,10); this.name='opt'; this.options=['A','B','C']; this.inline=false; }
  createDom(){ const el=document.createElement('div'); el.className='el el-radio'; el.dataset.type='radiogroup'; el.id=this.id; el.innerHTML = `<div class="rg"></div>`; this.dom=el; this.readProps(); return el; }
  getPropSchema(){ return [ ...super.getPropSchema(), {key:'name',label:'Name',type:'text'}, {key:'options',label:'Opzioni (separate da ;)',type:'text'}, {key:'inline',label:'Inline',type:'checkbox'} ]; }
  readProps(){ const rg=this.dom.querySelector('.rg'); rg.innerHTML=''; this.options.forEach((opt,idx)=>{ const id=`${this.id}-r${idx}`; rg.insertAdjacentHTML('beforeend', `<div class="form-check ${this.inline?'form-check-inline':''}"><input class="form-check-input" type="radio" name="${this.name}" id="${id}" value="${opt}"><label class="form-check-label" for="${id}">${opt}</label></div>`); }); }
}