/**
 * Unified lock-on-confirm behavior for single checkbox-like inputs.
 * - Never locks at selection time.
 * - Locks selected inputs only after the step is confirmed.
 * - Prevents any attempt to uncheck while locked.
 */
export function applyLockSingleCheckbox(input, instance){
  if(!input || !instance) return;

  // Guard: block pointer if this input is locked & currently on
  const guard = (e)=>{
    const active = !!instance.getProp('lockOnSelect');
    if(!active) return;
    if(input.checked && input.dataset && input.dataset.locked === '1'){
      e.preventDefault(); e.stopPropagation();
    }
  };
  input.addEventListener('mousedown', guard, true);
  input.addEventListener('keydown', (e)=>{
    const k = e.key || e.code;
    if(k===' '||k==='Space'||k==='Enter') guard(e);
  });

  // Init flag
  if(!input.dataset) input.dataset = {};
  input.dataset.locked = '0';

  // Observe step state via stage bus to lock after confirm
  try{
    const bus = instance && instance.stage && instance.stage.bus;
    if(bus){
      // On step-state: reflect whether current step is already confirmed
      bus.on('step-state', (st)=>{
        const active = !!instance.getProp('lockOnSelect');
        if(!active) return;
        const confirmed = !!(st && st.confirmed);
        input.dataset.locked = (confirmed && input.checked) ? '1' : '0';
      });
      // On explicit confirmation click
      bus.on('step-confirmed', (_)=>{
        const active = !!instance.getProp('lockOnSelect');
        if(!active) return;
        if(input.checked) input.dataset.locked = '1';
      });
    }
  }catch(_e){ /* noop */ }
}
