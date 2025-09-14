
export function addHandles(container, onDrag){
  const names = ['nw','n','ne','w','e','sw','s','se'];
  const handles = {};
  for(const n of names){
    const h = document.createElement('div');
    h.className = 'handle ' + n;
    container.appendChild(h);
    handles[n] = h;
  }
  function startDrag(e, name){
    e.preventDefault(); e.stopPropagation();
    onDrag('start', {name, start:{x:e.clientX,y:e.clientY}});
    const move = (ev)=> onDrag('move', {name, dx:ev.clientX-e.clientX, dy:ev.clientY-e.clientY});
    const up = ()=>{ onDrag('end', {name}); window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
  }
  for(const [n,h] of Object.entries(handles)){ h.addEventListener('mousedown', e=>{ e.stopPropagation(); startDrag(e,n); }); }
  return handles;
}
