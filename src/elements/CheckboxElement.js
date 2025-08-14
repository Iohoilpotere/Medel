import BaseElement from '../core/base-element.js';
export default class CheckboxElement extends BaseElement {
  constructor() { super('checkbox', 12, 50, 25, 5); this.label = 'Voce'; this.name = 'chk1'; this.checked = false; }
  createDom() { const el = document.createElement('div'); el.className = 'el el-checkbox'; el.dataset.type = 'checkbox'; el.id = this.id; el.innerHTML = `<div class="form-check"><input class="form-check-input" type="checkbox" id="${this.id}-in" name="${this.name}"><label class="form-check-label" for="${this.id}-in">${this.label}</label></div>`; this.dom = el; this.readProps(); return el; }
  getPropSchema() { return [...super.getPropSchema(), { key: 'name', label: 'Name', type: 'text' }, { key: 'label', label: 'Etichetta', type: 'text' }, { key: 'checked', label: 'Selezionato', type: 'checkbox' }]; }
  readProps() { const i = this.dom.querySelector('input'); const l = this.dom.querySelector('label'); i.name = this.name; i.checked = this.checked; l.textContent = this.label; l.setAttribute('for', `${this.id}-in`); }
}