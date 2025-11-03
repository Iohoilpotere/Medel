// Decorators for element behaviors (ESM)
export function decorate(instance, ...decorators){ for(const d of decorators) if(typeof d==='function') d(instance); return instance; }

export function LockOnConfirm(bus){
  return (instance)=>{
    try{
      const root = instance?.dom || instance?.element || instance || null;
      if(!root || !root.querySelector) return;
      const input = root.querySelector('input[type=checkbox],input[type=radio]');
      if(!input || !bus) return;
      const guard=(e)=>{
        if(input.checked && input.dataset && input.dataset.locked==='1'){ e.preventDefault(); e.stopPropagation(); }
      };
      input.addEventListener('click', guard, true);
      input.addEventListener('pointerdown', guard, true);
      bus.on && bus.on('step-confirmed', ()=>{ if(input.checked) input.dataset.locked='1'; });
      bus.on && bus.on('step-state', (st)=>{
        const confirmed = !!(st && st.confirmed);
        input.dataset.locked = (confirmed && input.checked) ? '1' : '0';
      });
    }catch{}
  }
}

export function PersistOnConfirm(store){
  return (instance)=>{
    try{
      const root = instance?.dom || instance?.element || instance || null;
      if(!root || !root.querySelectorAll) return;
      const collect=()=>{
        const values={};
        root.querySelectorAll('input,select,textarea').forEach((inp, idx)=>{
          const k = inp.name || inp.getAttribute('data-id') || `${instance.constructor?.type||'el'}:${idx}`;
          let v=null;
          if(inp.type==='checkbox') v=!!inp.checked;
          else if(inp.type==='radio'){ if(inp.checked) v=inp.value; }
          else v=inp.value;
          values[k]=v;
        });
        return values;
      };
      store?.onConfirm && store.onConfirm(collect);
    }catch{}
  }
}
