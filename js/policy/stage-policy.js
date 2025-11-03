// StagePolicy centralizes lock/view guards
export function applyStagePolicy(stage, bus){
  if(!stage || !bus || !bus.on) return;
  // Single registration guard (idempotent)
  if(stage.__policyApplied) return;
  stage.__policyApplied = true;
  // Example: reflect confirmed state to inputs dataset.locked (no business logic change)
  bus.on('step-state', (st)=>{
    const confirmed = !!(st && st.confirmed);
    const root = stage?.root || document;
    root.querySelectorAll('input[type=checkbox],input[type=radio]').forEach(inp=>{
      if(confirmed && inp.checked) inp.dataset.locked = '1';
    });
  });
}
