
import { registry } from '../core/registry.js';
import { BaseElement } from './base-element.js';

export class TableCheckElement extends BaseElement{
  constructor(opts={}){
    super(opts);
    this.type = 'tablecheck';
    // data
    this.setProp('items', Array.isArray(opts.items)? opts.items : ['Voce A','Voce B','Voce C']);
    this.setProp('rowsContent', opts.rowsContent || {});
    this.setProp('labelStyles', opts.labelStyles || {});
    this.setProp('values', Array.isArray(opts.values)? opts.values : []); // selected keys
    // style
    this.setProp('fontFamily', opts.fontFamily ?? 'System');
    this.setProp('fontSize', Number.isFinite(opts.fontSize)? opts.fontSize : 16);
    this.setProp('padding', Number.isFinite(opts.padding)? opts.padding : 11);
    this.setProp('rowBg', opts.rowBg ?? 'transparent');
    this.setProp('keyColWidth', Number.isFinite(opts.keyColWidth)? opts.keyColWidth : 38);
    // headers
    this.setProp('headerKeys', opts.headerKeys ?? 'Seleziona');
    this.setProp('headerValues', opts.headerValues ?? 'Dettagli');
  }

  updateDom(){
    super.updateDom();
    if(!this.content) return;
    // render once inside base content
    this.content.innerHTML='';
    const wrap = document.createElement('div');
    wrap.style.position='absolute'; wrap.style.inset='0'; wrap.style.overflow='hidden auto'; wrap.style.padding=(this.getProp('padding')||11)+'px';
    this.content.appendChild(wrap);

    const table = document.createElement('table');
    table.style.borderCollapse='collapse'; table.style.width='100%';
    table.style.fontFamily=this.getProp('fontFamily')||'System';
    table.style.fontSize=(this.getProp('fontSize')||16)+'px';
    table.style.lineHeight='1.2';
    table.style.tableLayout='fixed';
    wrap.appendChild(table);

    const colgroup = document.createElement('colgroup');
    const c1 = document.createElement('col'); c1.style.width = (this.getProp('keyColWidth')||38)+'%';
    const c2 = document.createElement('col'); c2.style.width = (100-(this.getProp('keyColWidth')||38))+'%';
    colgroup.appendChild(c1); colgroup.appendChild(c2); table.appendChild(colgroup);

    const thead = document.createElement('thead');
    const trh = document.createElement('tr'); thead.appendChild(trh);
    const th1 = document.createElement('th'); const th2 = document.createElement('th');
    const headBg = '#0e0e0e'; // opaque header background to mask rows while scrolling
    for(const th of [th1,th2]){
      th.style.position='sticky'; th.style.top='0'; th.style.zIndex='1';
      th.style.textAlign='left'; th.style.padding=(this.getProp('padding')*0.75||8)+'px';
      th.style.borderBottom='1px solid rgba(255,255,255,0.15)';
      th.style.background=headBg;
    }
    th1.textContent = this.getProp('headerKeys') || 'Seleziona';
    th2.textContent = this.getProp('headerValues') || 'Dettagli';
    trh.appendChild(th1); trh.appendChild(th2); table.appendChild(thead);

    const tbody = document.createElement('tbody'); table.appendChild(tbody);
    const items = Array.isArray(this.getProp('items'))? this.getProp('items'):[];
    const values = new Set(Array.isArray(this.getProp('values'))? this.getProp('values'):[]);
    const labelStyles = this.getProp('labelStyles')||{};
    const rowsContent = this.getProp('rowsContent')||{};

    const updateValues = (newVals)=>{ this.setProp('values', newVals, {silent:true}); };

    items.forEach(key=>{
      const tr = document.createElement('tr');
      tr.style.background = this.getProp('rowBg')||'transparent';

      const td1 = document.createElement('td');
      // lock-on-select: prevent deselect of already selected rows (capture)
      td1.addEventListener('click', (e)=>{
        const _lockOn = !!this.getProp('lockOnSelect');
        if(!_lockOn) return;
        const cur = new Set(Array.isArray(this.getProp('values'))? this.getProp('values'):[]);
        if(cur.has(key)) { e.preventDefault(); e.stopPropagation(); return; }
      }, true);
      td1.style.verticalAlign='top';
      td1.style.padding=(this.getProp('padding')||11)+'px';
      td1.style.borderBottom='1px solid rgba(255,255,255,0.15)';
      const lab = document.createElement('label'); lab.style.display='flex'; lab.style.alignItems='flex-start'; lab.style.gap=(this.getProp('padding')||11)+'px';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = values.has(key);
      cb.addEventListener('click', (e)=>{
        e.stopPropagation();
        const _lockOn = !!this.getProp('lockOnSelect');
        if(_lockOn && values.has(key) && cb.checked === false){
          cb.checked = true;
          return;
        }
        const cur = new Set(Array.from(values));
        if(cb.checked) cur.add(key); else cur.delete(key);
        updateValues(Array.from(cur));
        details.style.display = cb.checked ? 'block' : 'none';
      });
      const sp = document.createElement('span'); sp.textContent = key;
      const st = labelStyles[key]||{};
      if(st.color) sp.style.color=st.color;
      if(st.fontSize) sp.style.fontSize=st.fontSize+'px';
      if(st.fontWeight) sp.style.fontWeight=st.fontWeight;
      if(st.italic) sp.style.fontStyle='italic';
      if(st.letterSpacing!=null) sp.style.letterSpacing=st.letterSpacing+'px';
      lab.appendChild(cb); lab.appendChild(sp);
      td1.appendChild(lab);

      const td2 = document.createElement('td');
      td2.style.verticalAlign='top';
      td2.style.padding=(this.getProp('padding')||11)+'px';
      td2.style.borderBottom='1px solid rgba(255,255,255,0.15)';
      const details = document.createElement('div');
      details.style.display = values.has(key)? 'block':'none';
      details.style.whiteSpace='normal';
      details.style.wordBreak='break-word';
      details.style.overflowWrap='anywhere';
      const html = rowsContent[key] || '';
      details.innerHTML = String(html);
      details.addEventListener('mousedown', (e)=> e.stopPropagation());
      details.addEventListener('click', (e)=> e.stopPropagation());
      td2.appendChild(details);

      tr.appendChild(td1); tr.appendChild(td2);
      tbody.appendChild(tr);
    });
  }
}
TableCheckElement.type='tablecheck';
registry.registerElement(TableCheckElement.type, TableCheckElement);
