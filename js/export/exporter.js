
import { download } from '../utils/dom.js';
export function exportProject(project){
  const data = JSON.stringify(project, null, 2);
  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Case Player</title>
  <style>
  body{margin:0;background:#0d1117;color:#e8edf2;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}
  .stage{position:relative;width:960px;height:540px;margin:20px auto;background:#111;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.4);overflow:hidden}
  .el{position:absolute}
  .label{padding:4px 8px;border-radius:4px}
  </style></head><body>
  <div id="app"></div>
  <script id="case-data" type="application/json">${data.replace(/</g,'&lt;')}</script>
  <script>
  const data = JSON.parse(document.getElementById('case-data').textContent);
  const app = document.getElementById('app');
  function renderStep(step){
    const st = document.createElement('div'); st.className='stage';
    if(step.bgUrl){ st.style.backgroundImage = 'url('+step.bgUrl+')'; st.style.backgroundSize='cover'; }
    (step.elements||[]).forEach(e=>{
      const el = document.createElement('div'); el.className='el'; el.style.left=e.x+'px'; el.style.top=e.y+'px'; el.style.width=e.w+'px'; el.style.height=e.h+'px';
      if(e.type==='label'){
        const span=document.createElement('span'); span.className='label'; span.textContent = e.props.text||''; span.style.color=e.props.color||'#fff'; span.style.fontSize=(e.props.fontSize||16)+'px';
        if(e.props.shadow) span.style.textShadow='0 0 6px rgba(0,0,0,.5)';
        el.appendChild(span);
      }else if(e.type==='textbox'){
        const input=document.createElement('input'); input.type='text'; input.value=e.props.value||''; input.placeholder=e.props.placeholder||''; input.style.width='100%'; input.style.height='100%'; el.appendChild(input);
      }else if(e.type==='checkbox'){
        const lab=document.createElement('label'); const i=document.createElement('input'); i.type='checkbox'; i.checked=!!e.props.checked; lab.appendChild(i); lab.append(' '+(e.props.label||'')); el.appendChild(lab);
      }else if(e.type==='image'){
        const img=new Image(); img.src=e.props.url||''; img.style.width='100%'; img.style.height='100%'; let __fit=e.props.fit; if(__fit==='contain') __fit='scale-down'; if(__fit==='stretch') __fit='none'; img.style.objectFit=__fit||'scale-down'; el.appendChild(img);
      }else if(e.type==='radiogroup'){
        const wrap=document.createElement('div'); wrap.style.display='flex'; wrap.style.flexDirection='column'; (e.props.items||[]).forEach((txt,i)=>{ const lab=document.createElement('label'); const r=document.createElement('input'); r.type='radio'; r.name='g'+Math.random(); r.checked=e.props.value===i; lab.appendChild(r); lab.append(' '+txt); wrap.appendChild(lab); }); el.appendChild(wrap);
      
      }else if(e.type==='checkboxgroup'){
        const wrap=document.createElement('div'); wrap.style.display='flex'; wrap.style.flexDirection=(e.props.groupDirection||'column');
        const items = Array.isArray(e.props.items)? e.props.items: [];
        items.forEach((txt,i)=>{
          const lab=document.createElement('label'); lab.style.display='flex'; lab.style.alignItems='center'; lab.style.gap='6px';
          const c=document.createElement('input'); c.type='checkbox';
          lab.appendChild(c); lab.append(' '+txt); wrap.appendChild(lab);
        });
        el.appendChild(wrap);
      }else if(e.type==='pdf'){
        const iframe=document.createElement('iframe');
        const base = (e.props.url||''); const page = Math.max(1, parseInt(e.props.page||1,10));
        iframe.src = base.split('#')[0] + '#page='+page;
        iframe.style.width='100%'; iframe.style.height='100%'; iframe.style.border='0'; iframe.style.background='#fff';
        el.appendChild(iframe);
        const flip=(dir)=>{
          el.style.transition='transform .18s ease';
          el.style.transform = dir>0? 'perspective(600px) rotateY(-8deg)' : 'perspective(600px) rotateY(8deg)';
          setTimeout(()=>{ el.style.transform='none'; }, 180);
        };
        let sx=0,sy=0,drag=false;
        const next=()=>{ const p = Math.max(1, parseInt(e.props.page||1,10))+1; e.props.page=p; iframe.src = base.split('#')[0] + '#page='+p; flip(1); };
        const prev=()=>{ const p = Math.max(1, parseInt(e.props.page||1,10))-1; e.props.page=Math.max(1,p); iframe.src = base.split('#')[0] + '#page='+e.props.page; flip(-1); };
        el.addEventListener('wheel', (ev)=>{ ev.preventDefault(); if((ev.deltaY||0)>0) next(); else prev(); }, {passive:false});
        el.addEventListener('click', (ev)=>{ const r=el.getBoundingClientRect(); const x=ev.clientX-r.left; if(x>r.width/2) next(); else prev(); });
        el.addEventListener('pointerdown', (ev)=>{ sx=ev.clientX; sy=ev.clientY; drag=true; });
        window.addEventListener('pointerup', (ev)=>{ if(!drag) return; drag=false; const dx=ev.clientX-sx, dy=ev.clientY-sy; if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){ if(dx<0) next(); else prev(); } });
      }else if(e.type==='pairs'){
        const wrap=document.createElement('div');
        wrap.style.position='absolute'; wrap.style.inset='0'; wrap.style.overflow='auto';
        const grid=document.createElement('div');
        grid.style.display='grid';
        const labelWidth = e.props.labelWidth||40;
        grid.style.gridTemplateColumns = labelWidth+'% 1fr';
        grid.style.gap = (e.props.itemsGap||8)+'px 12px';
        wrap.appendChild(grid);
        const pairs = Array.isArray(e.props.pairs)? e.props.pairs: [];
        const styles = e.props.itemStyles||{};
        const keyAlign = e.props.keyAlign||'left';
        const valueAlign = e.props.valueAlign||'left';
        const defColor = e.props.color||'#ffffff'; const defSize = e.props.fontSize||16;
        pairs.forEach((p,i)=>{
          const st = Object.assign({
            keyAlign, valueAlign,
            keyColor:defColor, valueColor:defColor,
            keyFontSize:defSize, valueFontSize:defSize,
            keyBold:false, valueBold:false,
            keyItalic:false, valueItalic:false,
            keyLineHeight:1.25, valueLineHeight:1.25
          }, styles[i]||{});
          const L=document.createElement('div'); const R=document.createElement('div');
          L.textContent = String((p&&p.label)||''); R.textContent = String((p&&p.value)||'');
          L.style.textAlign=st.keyAlign; R.style.textAlign=st.valueAlign;
          L.style.color=st.keyColor; R.style.color=st.valueColor;
          L.style.fontSize=st.keyFontSize+'px'; R.style.fontSize=st.valueFontSize+'px';
          L.style.fontWeight=st.keyBold?'700':'400'; R.style.fontWeight=st.valueBold?'700':'400';
          L.style.fontStyle=st.keyItalic?'italic':'normal'; R.style.fontStyle=st.valueItalic?'italic':'normal';
          L.style.lineHeight=String(st.keyLineHeight); R.style.lineHeight=String(st.valueLineHeight);
          grid.appendChild(L); grid.appendChild(R);
        });
        el.appendChild(wrap);

        const wrap=document.createElement('div'); wrap.style.display='flex'; wrap.style.flexDirection='column'; const set=new Set(e.props.values||[]); (e.props.items||[]).forEach((txt,i)=>{ const lab=document.createElement('label'); const c=document.createElement('input'); c.type='checkbox'; c.checked=set.has(i); lab.appendChild(c); lab.append(' '+txt); wrap.appendChild(lab); }); el.appendChild(wrap);
      }
      st.appendChild(el);
    });
    app.innerHTML=''; app.appendChild(st);
  }
  renderStep(data.steps[0] || {elements:[]});
  </script></body></html>`;
  download('case.html', html);
}
