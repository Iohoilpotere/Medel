// src/core/base-element.js
import { $, $$, clamp, snapTo, pxToPct, pctToPx, clientToStage } from './utils.js';
import Editor from '../editor/editor.js';
import { MoveElementsCommand, ResizeElementsCommand } from '../commands/element-commands.js';

export default class BaseElement {
  constructor(type, x = 10, y = 10, w = 20, h = 10) {
    this.id = Editor.uid(type);
    this.type = type;

    // Geometria / livello
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.rotation = 0;
    this.z = 1;
    this.lockRatio = false;
    this._ratio = w / h;

    // DOM / stato
    this.dom = null;
    this.selected = false;

    // Proprietà generali comuni a tutti gli elementi
    this.tooltip = '';
  }

  createDom() {
    throw new Error('createDom must be implemented');
  }

  mount(parent) {
    if (!this.dom) this.createDom();
    parent.appendChild(this.dom);
    this.applyTransform();
    this.attachInteractivity();
    this.readProps(); // assicura che il tooltip (e altro) sia applicato
  }

  unmount() {
    if (this.dom?.parentElement) {
      this.dom.parentElement.removeChild(this.dom);
    }
  }

  applyTransform() {
    if (!this.dom) return;

    this.z = Math.max(0, this.z | 0);
    Object.assign(this.dom.style, {
      position: 'absolute',
      left: this.x + '%',
      top: this.y + '%',
      width: this.w + '%',
      height: this.h + '%',
      zIndex: this.z
    });

    Editor.instance?.onElementChanged();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      rotation: this.rotation,
      z: this.z,
      lockRatio: this.lockRatio,
      tooltip: this.tooltip
    };
  }

  setSelected(sel) {
    this.selected = sel;
    if (!this.dom) return;
    this.dom.classList.toggle('selected', sel);
    if (sel) this.ensureHandles();
    else this.removeHandles();
  }

  ensureHandles() {
    if ($('.handles', this.dom)) return;
    const box = document.createElement('div');
    box.className = 'handles';
    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(d => {
      const h = document.createElement('div');
      h.dataset.dir = d;
      h.className = `handle ${d}`;
      h.dataset.editorUi = '1';
      box.appendChild(h);
    });
    this.dom.appendChild(box);
  }

  removeHandles() {
    $$('.handles', this.dom).forEach(n => n.remove());
  }

  attachInteractivity() {
    // === Drag (singolo/multiplo) ===
    this.dom.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('handle')) return; // esclude i resize handle

      const wasSelected = this.selected;

      // Ctrl/Cmd: toggle selezione e non avviare il drag
      if (e.ctrlKey || e.metaKey) {
        Editor.instance.toggleSelect(this);
        return;
      }

      // Se non era selezionato: selezione singola
      if (!wasSelected) {
        Editor.instance.selectOnly(this);
      }

      const stage = Editor.instance.stageEl;
      const startPx = clientToStage(e, stage);
      const selected = [...Editor.instance.selected];

      // Snapshot posizioni iniziali
      const starts = selected.map(s => ({ s, x: s.x, y: s.y, w: s.w, h: s.h }));

      // Elemento ancora (quello cliccato o il primo selezionato)
      const anchorStart = starts.find(o => o.s === this) || starts[0];

      // Snap alla griglia: attivo se grid>0 e Shift NON premuto
      const grid = Editor.instance.gridPct();
      const stepX = grid.x || 0;
      const stepY = grid.y || 0;
      const snapEnabled = (Editor.instance.grid || 0) > 0 && !e.shiftKey;

      // Limiti di gruppo (delta ammesso)
      const dxMin = Math.max(...starts.map(o => -o.x));
      const dxMax = Math.min(...starts.map(o => 100 - o.w - o.x));
      const dyMin = Math.max(...starts.map(o => -o.y));
      const dyMax = Math.min(...starts.map(o => 100 - o.h - o.y));

      // Snap “dentro i limiti” su una griglia (snappa il target assoluto)
      const snapInside = (target, step, minV, maxV) => {
        if (!snapEnabled || step <= 0) {
          return Math.min(maxV, Math.max(minV, target));
        }
        let v = Math.round(target / step) * step;
        if (v < minV) v = Math.ceil(minV / step) * step;
        if (v > maxV) v = Math.floor(maxV / step) * step;
        return Math.min(maxV, Math.max(minV, v));
      };

      let moved = false;

      const onMove = (ev) => {
        ev.preventDefault();

        const p = clientToStage(ev, stage);
        const dx = pxToPct(p.x - startPx.x, stage.clientWidth);
        const dy = pxToPct(p.y - startPx.y, stage.clientHeight);

        // Target dell’ancora (snap + clamp)
        let targetAx = anchorStart.x + dx;
        let targetAy = anchorStart.y + dy;

        targetAx = snapInside(targetAx, stepX, anchorStart.x + dxMin, anchorStart.x + dxMax);
        targetAy = snapInside(targetAy, stepY, anchorStart.y + dyMin, anchorStart.y + dyMax);

        const commonDx = targetAx - anchorStart.x;
        const commonDy = targetAy - anchorStart.y;

        // Preview: stesso delta per tutti
        starts.forEach(({ s, x, y, w, h }) => {
          let nx = x + commonDx;
          let ny = y + commonDy;
          nx = clamp(nx, 0, 100 - w);
          ny = clamp(ny, 0, 100 - h);
          s.x = nx;
          s.y = ny;
          s.applyTransform();
        });

        Editor.instance.reflectSelection();
        moved = true;
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);

        if (!moved) return;

        // Delta finale rispetto all’ancora
        const anchorNow = selected.find(s => s === this) || selected[0];
        const finalDx = anchorNow.x - anchorStart.x;
        const finalDy = anchorNow.y - anchorStart.y;
        if (Math.abs(finalDx) < 1e-6 && Math.abs(finalDy) < 1e-6) return;

        // Ripristina preview e committa come comando
        starts.forEach(({ s, x, y }) => { s.x = x; s.y = y; s.applyTransform(); });

        const cmd = new MoveElementsCommand(Editor.instance, selected, finalDx, finalDy, 'Sposta elementi');
        Editor.instance.commandMgr.executeCommand(cmd);
        Editor.instance.stepMgr.scheduleThumb(Editor.instance.stepMgr.activeStep);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    // === Resize (singolo con snap/ratio, multi con bordo comune) ===
    this.dom.addEventListener('mousedown', (e) => {
      const h = e.target.closest('.handle');
      if (!h) return;

      e.stopPropagation();
      e.preventDefault();

      // assicurati che l'elemento sia nella selezione
      if (!Editor.instance.selected.includes(this)) {
        Editor.instance.selectInclude(this);
      }

      const dir = h.dataset.dir; // 'n','s','e','w','ne','se','sw','nw'
      const stage = Editor.instance.stageEl;
      const start = clientToStage(e, stage);

      const grid = Editor.instance.gridPct();
      const snapEnabled = (Editor.instance.grid || 0) > 0;
      const stepX = grid.x || 0;
      const stepY = grid.y || 0;

      const selected = [...Editor.instance.selected];
      const multi = selected.length > 1;
      const isCorner = ['ne', 'se', 'sw', 'nw'].includes(dir);

      const MIN_W = 1, MIN_H = 1;

      const clampBox = (L, T, R, B) => {
        // min size
        if (R - L < MIN_W) { if (dir.includes('w')) L = R - MIN_W; else R = L + MIN_W; }
        if (B - T < MIN_H) { if (dir.includes('n')) T = B - MIN_H; else B = T + MIN_H; }

        // limiti canvas
        L = Math.max(0, Math.min(L, 99));
        T = Math.max(0, Math.min(T, 99));
        R = Math.max(1, Math.min(R, 100));
        B = Math.max(1, Math.min(B, 100));

        // ricontrollo minimi
        if (R - L < MIN_W) R = L + MIN_W;
        if (B - T < MIN_H) B = T + MIN_H;
        return [L, T, R, B];
      };

      const snapInside = (v, step, minV, maxV) => {
        if (!snapEnabled || step <= 0) return Math.min(maxV, Math.max(minV, v));
        let s = Math.round(v / step) * step;
        if (s < minV) s = Math.ceil(minV / step) * step;
        if (s > maxV) s = Math.floor(maxV / step) * step;
        return Math.min(maxV, Math.max(minV, s));
      };

      let hasResized = false;

      // === Multi-selezione: bordo allineato (niente corner) ===
      if (multi) {
        if (isCorner) return;

        const starts = selected.map(s => ({ s, L: s.x, T: s.y, R: s.x + s.w, B: s.y + s.h }));
        const anchor = { L: this.x, T: this.y, R: this.x + this.w, B: this.y + this.h };

        const lim = {
          e: { min: Math.max(...starts.map(o => o.L + MIN_W)), max: 100, step: stepX },
          w: { min: 0, max: Math.min(...starts.map(o => o.R - MIN_W)), step: stepX },
          s: { min: Math.max(...starts.map(o => o.T + MIN_H)), max: 100, step: stepY },
          n: { min: 0, max: Math.min(...starts.map(o => o.B - MIN_H)), step: stepY },
        };

        const onMove = (ev) => {
          hasResized = true;
          const p = clientToStage(ev, stage);
          const dx = pxToPct(p.x - start.x, stage.clientWidth);
          const dy = pxToPct(p.y - start.y, stage.clientHeight);

          let target;
          if (dir === 'e') {
            target = snapInside(anchor.R + dx, lim.e.step, lim.e.min, lim.e.max);
            starts.forEach(o => {
              const L = o.L, R = target;
              const w = Math.max(MIN_W, Math.min(R - L, 100 - L));
              o.s.x = L; o.s.w = w; o.s.applyTransform();
            });
          } else if (dir === 'w') {
            target = snapInside(anchor.L + dx, lim.w.step, lim.w.min, lim.w.max);
            starts.forEach(o => {
              let L = Math.min(target, o.R - MIN_W);
              L = Math.max(0, L);
              const R = o.R;
              o.s.x = L; o.s.w = R - L; o.s.applyTransform();
            });
          } else if (dir === 's') {
            target = snapInside(anchor.B + dy, lim.s.step, lim.s.min, lim.s.max);
            starts.forEach(o => {
              const T = o.T, B = target;
              const h = Math.max(MIN_H, Math.min(B - T, 100 - T));
              o.s.y = T; o.s.h = h; o.s.applyTransform();
            });
          } else if (dir === 'n') {
            target = snapInside(anchor.T + dy, lim.n.step, lim.n.min, lim.n.max);
            starts.forEach(o => {
              let T = Math.min(target, o.B - MIN_H);
              T = Math.max(0, T);
              const B = o.B;
              o.s.y = T; o.s.h = B - T; o.s.applyTransform();
            });
          }

          Editor.instance.reflectSelection();
        };

        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          if (!hasResized) return;

          const newBounds = selected.map(s => ({ x: s.x, y: s.y, w: s.w, h: s.h }));

          // ripristina preview
          starts.forEach(o => {
            o.s.x = o.L;
            o.s.y = o.T;
            o.s.w = o.R - o.L;
            o.s.h = o.B - o.T;
            o.s.applyTransform();
          });

          const cmd = new ResizeElementsCommand(Editor.instance, selected, newBounds, 'Ridimensiona selezione (bordo allineato)');
          Editor.instance.commandMgr.executeCommand(cmd);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return;
      }

      // === Singolo elemento: snap/ratio ===
      const L0 = this.x, T0 = this.y, R0 = this.x + this.w, B0 = this.y + this.h;
      const aspect = this.w / this.h;

      const onMoveSingle = (ev) => {
        hasResized = true;

        const p = clientToStage(ev, stage);
        const dx = pxToPct(p.x - start.x, stage.clientWidth);
        const dy = pxToPct(p.y - start.y, stage.clientHeight);

        let L = L0, T = T0, R = R0, B = B0;

        if (dir.includes('e')) R = R0 + dx;
        if (dir.includes('s')) B = B0 + dy;
        if (dir.includes('w')) L = L0 + dx;
        if (dir.includes('n')) T = T0 + dy;

        // lockRatio o Shift = mantieni proporzioni
        const keepRatio = this.lockRatio || ev.shiftKey;
        if (keepRatio) {
          let w = R - L, h = B - T;
          if (dir === 'e' || dir === 'w') {
            h = w / aspect;
            if (dir.includes('n')) T = B - h; else B = T + h;
          } else if (dir === 'n' || dir === 's') {
            w = h * aspect;
            if (dir.includes('w')) L = R - w; else R = L + w;
          } else {
            const hFromW = w / aspect;
            const wFromH = h * aspect;
            if (Math.abs(hFromW - h) < Math.abs(wFromH - w)) {
              if (dir.includes('n')) T = B - hFromW; else B = T + hFromW;
            } else {
              if (dir.includes('w')) L = R - wFromH; else R = L + wFromH;
            }
          }
        }

        // clamp + snap sui bordi
        [L, T, R, B] = clampBox(L, T, R, B);
        if (snapEnabled) {
          L = snapInside(L, stepX, 0, 99);
          R = snapInside(R, stepX, L + MIN_W, 100);
          T = snapInside(T, stepY, 0, 99);
          B = snapInside(B, stepY, T + MIN_H, 100);
          [L, T, R, B] = clampBox(L, T, R, B);
        }

        this.x = L;
        this.y = T;
        this.w = R - L;
        this.h = B - T;
        this.applyTransform();
        Editor.instance.reflectSelection();
      };

      const onUpSingle = () => {
        window.removeEventListener('mousemove', onMoveSingle);
        window.removeEventListener('mouseup', onUpSingle);
        if (!hasResized) return;

        const nb = [{ x: this.x, y: this.y, w: this.w, h: this.h }];
        this.x = L0;
        this.y = T0;
        this.w = R0 - L0;
        this.h = B0 - T0;
        this.applyTransform();

        const cmd = new ResizeElementsCommand(Editor.instance, [this], nb, 'Ridimensiona elemento');
        Editor.instance.commandMgr.executeCommand(cmd);
      };

      window.addEventListener('mousemove', onMoveSingle);
      window.addEventListener('mouseup', onUpSingle);
    });
  }

  // Proprietà comuni (mostrate come sezione "Generale")
  getPropSchema() {
    return [
      { section: 'Generale', key: 'x',         label: 'X %',                type: 'number',  min: 0 },
      { section: 'Generale', key: 'y',         label: 'Y %',                type: 'number',  min: 0 },
      { section: 'Generale', key: 'w',         label: 'Larghezza %',        type: 'number',  min: 1 },
      { section: 'Generale', key: 'h',         label: 'Altezza %',          type: 'number',  min: 1 },
      { section: 'Generale', key: 'z',         label: 'Z-index',            type: 'number',  min: 0 },
      { section: 'Generale', key: 'lockRatio', label: 'Blocca proporzioni', type: 'checkbox' },
      { section: 'Generale', key: 'tooltip',   label: 'Tooltip',            type: 'text' }
    ];
  }

  // Applica le proprietà comuni; le sottoclassi dovrebbero chiamare super.readProps()
  readProps() {
    if (this.dom) {
      this.dom.title = this.tooltip || '';
    }
  }
}
