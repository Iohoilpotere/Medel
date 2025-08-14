import BaseElement from '../core/base-element.js';
export default class ImageElement extends BaseElement {
  constructor() { super('image', 20, 25, 35, 25); this.src = ''; this.alt = ''; this.fit = 'cover'; }
  createDom() { const el = document.createElement('div'); el.className = 'el el-image'; el.dataset.type = 'image'; el.id = this.id; el.innerHTML = `<img class="w-100 h-100" style="object-fit:${this.fit};" alt="">`; this.dom = el; this.readProps(); return el; }
  getPropSchema() { return [...super.getPropSchema(), { key: 'src', label: 'Sorgente (URL)', type: 'text' }, { key: 'alt', label: 'Alt', type: 'text' }, { key: 'fit', label: 'Adattamento', type: 'select', options: [['cover', 'cover'], ['contain', 'contain'], ['fill', 'fill'], ['none', 'none'], ['scale-down', 'scale-down']] }]; }
  readProps() { const img = this.dom.querySelector('img'); img.src = this.src; img.alt = this.alt; img.style.objectFit = this.fit; }
}