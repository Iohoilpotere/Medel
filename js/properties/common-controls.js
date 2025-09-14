// Basic UI controls used by properties panel

export function numberInput(value, step=1, onChange){
  const wrap = document.createElement('div'); wrap.className='prop-row';
  const input = document.createElement('input');
  input.type = 'number';
  input.value = (value ?? 0);
  input.step = String(step ?? 1);
  input.addEventListener('input', ()=> {
    const v = parseFloat(input.value);
    onChange(Number.isFinite(v) ? v : 0);
  });
  wrap.appendChild(input);
  return wrap;
}

export function textInput(value, onChange){
  const wrap = document.createElement('div'); wrap.className='prop-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = (value ?? '');
  input.addEventListener('input', ()=> onChange(input.value));
  wrap.appendChild(input);
  return wrap;
}

export function textarea(value, onChange){
  const wrap = document.createElement('div'); wrap.className='prop-row';
  const ta = document.createElement('textarea');
  ta.value = (value ?? '');
  ta.addEventListener('input', ()=> onChange(ta.value));
  wrap.appendChild(ta);
  return wrap;
}

// Tiny color picker with alpha channel (0..1) rendered as a numeric input
export function colorPicker(rgbaValue, onChange){
  const wrap = document.createElement('div'); wrap.className='prop-row';
  const parsed = parseRgba(rgbaValue);
  const color = document.createElement('input');
  color.type = 'color';
  color.value = (parsed.hex || '#ffffff');
  const alpha = document.createElement('input');
  alpha.type = 'number';
  alpha.min = '0'; alpha.max = '1'; alpha.step = '0.01';
  alpha.value = String(parsed.a ?? 1);
  alpha.style.width = '72px';
  alpha.title = 'Alpha (0–1)';
  const emit = ()=> onChange(rgbaString(color.value, alpha.value));
  color.addEventListener('input', emit);
  alpha.addEventListener('input', emit);
  wrap.appendChild(color);
  wrap.appendChild(alpha);
  return wrap;
}

function parseRgba(rgba){
  if(typeof rgba === 'string'){
    const m = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
    if(m){
      const r = Math.max(0, Math.min(255, parseInt(m[1],10)));
      const g = Math.max(0, Math.min(255, parseInt(m[2],10)));
      const b = Math.max(0, Math.min(255, parseInt(m[3],10)));
      let a = 1;
      if(m[4]!=null) a = Math.max(0, Math.min(1, parseFloat(m[4])));
      const toHex = (n)=> ('0'+n.toString(16)).slice(-2);
      return {hex:'#'+toHex(r)+toHex(g)+toHex(b), a};
    }
  }
  // Fallback if we get a hex or invalid string: keep alpha = 1
  const hex = (typeof rgba==='string' && /^#([0-9a-f]{6})$/i.test(rgba)) ? rgba : '#ffffff';
  return {hex, a:1};
}

function rgbaString(hex, a){
  const clean = /^#([0-9a-f]{6})$/i.test(hex) ? hex : '#ffffff';
  const r = parseInt(clean.slice(1,3),16);
  const g = parseInt(clean.slice(3,5),16);
  const b = parseInt(clean.slice(5,7),16);
  const alpha = Math.max(0, Math.min(1, parseFloat(a||1)));
  return `rgba(${r},${g},${b},${alpha})`;
}

export function selectInput(value, options, onChange){
  const wrap = document.createElement('div'); wrap.className='prop-row';
  const select = document.createElement('select');
  for(const opt of options){
    const option = document.createElement('option');
    option.value = String(opt);
    option.textContent = String(opt);
    if(String(value) === String(opt)) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener('change', ()=> onChange(select.value));
  wrap.appendChild(select);
  return wrap;
}

export function checkboxInput(checked, onChange){
  const wrap = document.createElement('div'); 
  wrap.className='prop-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!checked;
  input.addEventListener('change', ()=> onChange(!!input.checked));
  wrap.appendChild(input);
  return wrap;
}
