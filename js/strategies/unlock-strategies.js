// Unlock strategies for step navigation (ESM)
export class UnlockStrategy { canUnlock(_ctx){ return false; } }
export class ViewedPrevStrategy extends UnlockStrategy {
  canUnlock({ index, state }){ if(index===0) return true; const prev = (state?.stepsState?.[index-1])||{}; return !!prev.viewed; }
}
export class ConfirmPrevStrategy extends UnlockStrategy {
  canUnlock({ index, state }){ if(index===0) return true; const prev = (state?.stepsState?.[index-1])||{}; return !!prev.confirmed; }
}
export class IndicatorGteStrategy extends UnlockStrategy {
  constructor(threshold=0){ super(); this.threshold=Number(threshold)||0; }
  canUnlock({ indicatorValue }){ return (Number(indicatorValue)||0) >= this.threshold; }
}
export class IndicatorLteStrategy extends UnlockStrategy {
  constructor(threshold=0){ super(); this.threshold=Number(threshold)||0; }
  canUnlock({ indicatorValue }){ return (Number(indicatorValue)||0) <= this.threshold; }
}
export function createUnlockStrategy(mode, threshold){
  switch(mode){
    case 'confirmPrev': return new ConfirmPrevStrategy();
    case 'indicatorGte': return new IndicatorGteStrategy(threshold);
    case 'indicatorLte': return new IndicatorLteStrategy(threshold);
    case 'viewPrev':
    default: return new ViewedPrevStrategy();
  }
}
export function getIndicatorValue(project){
  try{
    const arr = Array.isArray(project?.indicators)? project.indicators : [];
    const named = arr.find(i => String(i.name||'').toLowerCase()==='value');
    const cand = named || arr.find(i => typeof i.value==='number');
    const v = cand && typeof cand.value==='number' ? cand.value : 0;
    return v;
  } catch { return 0; }
}
export function computeUnlockedCountWithStrategy(flatSteps, state, project, factory=createUnlockStrategy){
  let unlocked=1; const total = Array.isArray(flatSteps)? flatSteps.length : 0;
  const indVal = getIndicatorValue(project);
  for(let i=1;i<total;i++){
    const step = flatSteps[i]?.step || {};
    const unlock = step.unlock || {};
    const mode = unlock.mode || 'viewPrev';
    const thr = Number(unlock.threshold) || 0;
    const strategy = factory(mode, thr);
    const ok = strategy.canUnlock({ index:i, state, project, indicatorValue: indVal });
    if(ok) unlocked = Math.max(unlocked, i+1); else break;
  }
  return unlocked;
}
