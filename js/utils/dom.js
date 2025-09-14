
export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
export function h(tag, props={}, ...children){
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k,v])=>{
    if(k==='class') el.className = v;
    else if(k.startsWith('on') && typeof v==='function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if(v!==undefined && v!==null) el.setAttribute(k, v);
  });
  for(const c of children){ el.append(c instanceof Node ? c : document.createTextNode(String(c))); }
  return el;
}
export function download(filename, text){
  const a = document.createElement('a');
  const type = filename.endsWith('.json') ? 'application/json' : (filename.endsWith('.html') ? 'text/html' : 'text/plain');
  a.href = URL.createObjectURL(new Blob([text], {type:type}));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}
