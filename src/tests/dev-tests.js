export function approx(a, b, tol = 0.06) { 
  return Math.abs(a - b) <= tol; 
}

export function runTests(ed) {
  try {
    console.group('%cMedel Editor – Tests', 'color:#0d6efd');

    const { stage, stageOuter: outer } = ed.view?.getStageElements() || {};
    if (!stage || !outer) {
      console.error('Stage elements not found');
      return;
    }

    // Salva orientamento corrente per ripristino
    const prevOrient = ed.metricsService?.getOrientation() || 'landscape';

    // Test proporzioni/orientamenti (non tocca gli step)
    ed.metricsService?.setOrientation('landscape');
    ed.view?.syncOrientationControls('landscape');
    console.assert(stage.offsetWidth <= outer.clientWidth + 1 && stage.offsetHeight <= outer.clientHeight + 1, 'Stage fits in landscape');
    console.assert(approx(stage.offsetWidth / stage.offsetHeight, 16 / 9, 0.08), 'Aspect ~ 16/9');

    ed.metricsService?.setOrientation('portrait');
    ed.view?.syncOrientationControls('portrait');
    console.assert(stage.offsetWidth <= outer.clientWidth + 1 && stage.offsetHeight <= outer.clientHeight + 1, 'Stage fits in portrait');
    console.assert(approx(stage.offsetWidth / stage.offsetHeight, 9 / 16, 0.08), 'Aspect ~ 9/16');

    // Ripristina orientamento originale
    ed.metricsService?.setOrientation(prevOrient);
    ed.view?.syncOrientationControls(prevOrient);

    // ====== ISOLAMENTO: usa uno STEP TEMPORANEO ======
    const sm = ed.stepManager;
    if (!sm) {
      console.error('Step manager not found');
      return;
    }

    // Step/categoria precedenti (per ripristino)
    const prevStep = sm.activeStep;
    const prevCat = sm.categories.find(c => c.steps.includes(prevStep)) || sm.categories[0];

    // Crea step temporaneo (senza command history) e attivalo
    const testStep = sm.addStep(prevCat, 'Test Step (auto)');
    sm.setActive(testStep);

    // ---- Test NUDGE su elemento reale ma temporaneo ----
    const Klass = ed.elementRegistry?.get('label')?.klass;
    if (!Klass) {
      console.error('Label element class not found');
      return;
    }
    
    const testEl = new Klass();
    const canvas = ed.view?.getStageElements()?.canvas;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    testEl.mount(canvas);          // crea DOM e listener
    testStep.items.push(testEl);         // registra nello step attivo (testStep)
    ed.selectOnly(testEl);            // selezione attiva

    const beforeX = testEl.x;
    ed.nudgeSelected(1, 0, { snap: false });  // sposta di ~1% X
    console.assert(Math.abs(testEl.x - (beforeX + 1)) < 0.01, 'Nudge moves element by ~1% X');

    // ====== CLEANUP ROBUSTO ======
    // rimuovi elemento temporaneo
    testEl.unmount();
    testStep.items = testStep.items.filter(e => e !== testEl);
    ed.selectionManager?.clearSelection();

    // rimuovi lo step temporaneo dalla categoria
    const idx = prevCat.steps.indexOf(testStep);
    if (idx >= 0) prevCat.steps.splice(idx, 1);

    // ripristina lo step precedente (se esiste ancora), altrimenti primo disponibile
    if (prevStep && sm.categories.some(c => c.steps.includes(prevStep))) {
      sm.setActive(prevStep);
    } else {
      const anyCat = sm.categories.find(c => c.steps.length);
      if (anyCat) sm.setActive(anyCat.steps[0]);
      else sm.render();
    }

    console.groupEnd();
  } catch (err) {
    console.error('Test harness error:', err);
  }
}
