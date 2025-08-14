export function approx(a,b,tol=0.06){ return Math.abs(a-b) <= tol; }
export function runTests(ed){
  try{
    console.group('%cMedel Editor – Tests','color:#0d6efd');
    const stage = ed.stageEl; const outer = stage.parentElement;
    ed.changeOrientation('landscape', {syncToolbar:true});
    console.assert(stage.offsetWidth <= outer.clientWidth + 1 && stage.offsetHeight <= outer.clientHeight + 1, 'Stage fits in landscape');
    console.assert(approx(stage.offsetWidth/stage.offsetHeight, 16/9, 0.08), 'Aspect ~ 16/9');
    ed.changeOrientation('portrait', {syncToolbar:true});
    console.assert(stage.offsetWidth <= outer.clientWidth + 1 && stage.offsetHeight <= outer.clientHeight + 1, 'Stage fits in portrait');
    console.assert(approx(stage.offsetWidth/stage.offsetHeight, 9/16, 0.08), 'Aspect ~ 9/16');
    const sm=ed.stepMgr; const cat0=sm.categories[0]; const s2=sm.addStep(cat0, 'Step 2'); sm.setActive(s2);
    console.assert(sm.activeStep===s2, 'Active step is Step 2');
    sm.setActive(cat0.steps[0]); console.assert(sm.activeStep===cat0.steps[0], 'Back to Step 1');
    const Klass = ed.registry.get('label').klass;
    const testEl = new Klass();
    const beforeX = testEl.x; ed.nudge(1,0,{snap:false});
    console.assert(Math.abs(testEl.x - (beforeX+1)) < 0.01, 'Nudge moves element by ~1% X');
    testEl.dom.remove(); ed.elements = ed.elements.filter(e=>e!==testEl); ed.clearSelection();
    console.groupEnd();
  }catch(err){ console.error('Test harness error:', err); }
}