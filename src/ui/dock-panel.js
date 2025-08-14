export default class DockPanel{
  constructor(root, manager){
    this.root=root; this.manager=manager; this.root.classList.add('dock-panel');
    this.side = root.dataset.side || 'left';
    this.title = root.dataset.title || (root.querySelector('h6')?.textContent?.trim() || 'Pannello');
    this.root.dataset.side=this.side;
    if(!this.root.hasAttribute('data-collapsed')) this.root.dataset.collapsed='0';
    this.handle=document.createElement('button');
    this.handle.type='button'; this.handle.className='panel-handle';
    this.handle.innerHTML=`<span class="label">${this.title}</span>`;
    this.handle.setAttribute('aria-expanded', this.root.dataset.collapsed==='0' ? 'true' : 'false');
    this.root.appendChild(this.handle);
    this.handle.addEventListener('click', ()=> this.toggle());
  }
  toggle(force){
    const collapsed = this.root.dataset.collapsed==='1';
    const next = force==null ? !collapsed : !!force;
    this.root.dataset.collapsed = next ? '1' : '0';
    this.handle.setAttribute('aria-expanded', (!next).toString());
    if(this.manager) this.manager.ensureExclusive(this);
    window.dispatchEvent(new Event('resize'));
  }
}