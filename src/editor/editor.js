import { $, $$, clamp, uid, snapTo, pxToPct, pctToPx, clientToStage, getByPath } from '../core/utils.js';
import PanelManager from '../ui/panel-manager.js';
import CaseExporter from './exporter.js';
import StepManager from '../steps/step-manager.js';
import CommandManager from '../commands/command-manager.js';
import { AddElementCommand, DeleteElementsCommand, MoveElementsCommand, ChangePropertyCommand, AddElementsCommand } from '../commands/element-commands.js';
import LabelElement from '../elements/LabelElement.js';
import ImageElement from '../elements/ImageElement.js';
import TextBoxElement from '../elements/TextBoxElement.js';
import CheckboxElement from '../elements/CheckboxElement.js';
import RadioGroupElement from '../elements/RadioGroupElement.js';
import { ThemeFactory } from '../ui/themes/theme-factory.js';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const is8 = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = is8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}
function rgbToHex(r, g, b) {
  const to2 = v => v.toString(16).padStart(2, '0');
  return '#' + to2(r) + to2(g) + to2(b);
}
function parseColorToHexAlpha(str) {
  if (!str) return { hex: '#000000', a: 1 };
  str = String(str).trim().toLowerCase();
  if (str.startsWith('rgba')) {
    const m = str.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
    if (m) { const r = +m[1], g = +m[2], b = +m[3], a = +m[4]; return { hex: rgbToHex(r, g, b), a }; }
  }
  if (str.startsWith('rgb')) {
    const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) { const r = +m[1], g = +m[2], b = +m[3]; return { hex: rgbToHex(r, g, b), a: 1 }; }
  }
  if (str.startsWith('#')) {
    const h = str.slice(1);
    if (h.length === 6) { return { hex: str, a: 1 }; }
    if (h.length === 8) { const { r, g, b, a } = hexToRgb(str); return { hex: rgbToHex(r, g, b), a }; }
  }
  return { hex: '#000000', a: 1 };
}
function composeColor(hex, a) {
  const { r, g, b } = hexToRgb(hex + 'ff');
  if (a >= 0.999) return hexToRgb(hex + 'ff') && hex; // puro hex senza alpha
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
}

export default class Editor {
  static instance;
  static uid = (p) => uid(p);
  constructor() {
    if (Editor.instance) return Editor.instance;
    Editor.instance = this;

    this.palette = $('#palette');
    this.stageEl = $('#stage');
    this.stageSize = $('.stage-size');
    this.canvas = $('#stepCanvas');
    this.propForm = $('#propForm');
    this.elements = [];
    this.selected = [];
    this.grid = 16;
    this.subgrid = false;
    this._thumbDebounce = null;
    this.clipboard = null;                 // { items:[...], source:'internal'|'system' }
    this._lastPasteOffset = { x: 0, y: 0 };// bump incrementale tra paste consecutivi 
    this.zoom = 1;          // 1 = 100%
    this.minZoom = 0.25;    // 25%
    this.maxZoom = 4;       // 400%

    // Temi
    ThemeFactory.init('dark'); // carica da localStorage se presente, altrimenti 'dark'

    // 1) Costruisci UI e bottoni undo/redo
    this.initUI();

    // 2) CommandManager PRIMA di StepManager
    this.commandMgr = new CommandManager(this);

    // 3) StepManager DOPO, e poi init()
    this.stepMgr = new StepManager(this);
    this.stepMgr.init();

    // 4) Il resto
    this.panelMgr = new PanelManager();
    this.caseExporter = new CaseExporter(this);

    // (facoltativo) ora keyboard e palette, così i listener vedono già commandMgr/stepMgr
    this.initKeyboard();
    this.seedPalette();

    this.layoutStage();
    window.addEventListener('resize', () => this.layoutStage());

    window.__editor__ = this;
  }

  serializeElement(el) {
    const base = {
      type: el.type, x: el.x, y: el.y, w: el.w, h: el.h,
      z: el.z | 0, rotation: el.rotation || 0, lockRatio: !!el.lockRatio,
      tooltip: el.tooltip || ''
    };
    switch (el.type) {
      case 'label':
        Object.assign(base, {
          text: el.text,
          style: JSON.parse(JSON.stringify(el.style || {})),
          wrap: el.wrap ?? 'normal',
          maxLines: el.maxLines ?? null
        });
        break;
      case 'image':
        Object.assign(base, { src: el.src, alt: el.alt, fit: el.fit });
        break;
      case 'textbox':
        Object.assign(base, {
          name: el.name,
          placeholder: el.placeholder,
          align: el.align,
          isPassword: !!el.isPassword,
          multiline: !!el.multiline,
          maxLength: el.maxLength ?? null,
          pattern: el.pattern || '',
          label: JSON.parse(JSON.stringify(el.label || {})),
          inputStyle: JSON.parse(JSON.stringify(el.inputStyle || {})),
        });
        break;
      case 'checkbox':
        Object.assign(base, { label: el.label, name: el.name, checked: !!el.checked });
        break;
      case 'radiogroup':
        Object.assign(base, { name: el.name, options: [...(el.options || [])], inline: !!el.inline });
        break;
    }
    return base;
  }

  deserializeElement(obj, offset = { x: 0, y: 0 }) {
    const el = this.createElementByType(obj.type);
    // base
    el.x = clamp((obj.x || 0) + (offset.x || 0), 0, 100 - (obj.w || 1));
    el.y = clamp((obj.y || 0) + (offset.y || 0), 0, 100 - (obj.h || 1));
    el.w = Math.max(1, obj.w || 1);
    el.h = Math.max(1, obj.h || 1);
    el.z = obj.z | 0;
    el.rotation = obj.rotation || 0;
    el.lockRatio = !!obj.lockRatio;
    el.tooltip = obj.tooltip || '';
    
    // specifici
    switch (obj.type) {
      case 'label':
        el.text = obj.text ?? el.text;
        if (obj.style && typeof obj.style === 'object') {
          // merge superficiale (se vuoi, profondo)
          el.style = Object.assign({}, el.style, obj.style);
        }
        el.wrap = obj.wrap ?? el.wrap;
        el.maxLines = obj.maxLines ?? el.maxLines;
        break;
      case 'image':
        el.src = obj.src || el.src; el.alt = obj.alt || el.alt; el.fit = obj.fit || el.fit;
        break;
      case 'textbox':
        el.name = obj.name ?? el.name;
        el.placeholder = obj.placeholder ?? el.placeholder;
        el.align = obj.align ?? el.align;
        el.isPassword = !!(obj.isPassword ?? el.isPassword);
        el.multiline = !!(obj.multiline ?? el.multiline);
        el.maxLength = (obj.maxLength == null ? el.maxLength : obj.maxLength);
        el.pattern = obj.pattern ?? el.pattern;

        if (obj.label && typeof obj.label === 'object') {
          el.label = Object.assign({}, el.label, obj.label);
          // merge shallow di style
          if (obj.label.style && typeof obj.label.style === 'object') {
            el.label.style = Object.assign({}, el.label.style, obj.label.style);
          }
        }
        if (obj.inputStyle && typeof obj.inputStyle === 'object') {
          el.inputStyle = Object.assign({}, el.inputStyle, obj.inputStyle);
          if (obj.inputStyle.border && typeof obj.inputStyle.border === 'object') {
            el.inputStyle.border = Object.assign({}, el.inputStyle.border, obj.inputStyle.border);
          }
        }
        break;

      case 'checkbox':
        el.label = obj.label || el.label; el.name = obj.name || el.name; el.checked = !!obj.checked;
        break;
      case 'radiogroup':
        el.name = obj.name || el.name; el.options = [...(obj.options || el.options || [])]; el.inline = !!obj.inline;
        break;
    }
    return el;
  }

  serializeSelection() {
    return this.selected.map(el => this.serializeElement(el));
  }
  copySelected() {
    if (!this.selected.length) return;
    this.clipboard = { items: this.serializeSelection(), source: 'internal' };
    // opzionale: prova a mettere anche nel system clipboard come testo JSON (non necessario al funzionamento)
    try {
      const txt = JSON.stringify(this.clipboard.items);
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).catch(() => { });
    } catch { }
  }

  cutSelected() {
    if (!this.selected.length) return;
    // salva clipboard
    this.copySelected();
    // elimina come comando (undo/redo)
    const cmd = new DeleteElementsCommand(this, [...this.selected], 'Taglia elementi');
    this.commandMgr.executeCommand(cmd);
  }

  pasteFromClipboard() {
    // fonte primaria: in-memory
    let items = this.clipboard?.items;
    // se non abbiamo in-memory, prova dal system clipboard (best-effort)
    const useSystem = async () => {
      try {
        const txt = await navigator.clipboard.readText();
        const arr = JSON.parse(txt);
        if (Array.isArray(arr)) return arr;
      } catch { }
      return null;
    };

    const proceed = (arr) => {
      if (!arr || !arr.length) return;

      // calcola offset: “bump” coerente con la griglia
      const g = this.gridPct();
      const bump = {
        x: (g.x || 1), // se griglia off, 1%
        y: (g.y || 1)
      };
      // accumula per paste consecutivi
      this._lastPasteOffset.x = (this._lastPasteOffset.x + bump.x) % 100;
      this._lastPasteOffset.y = (this._lastPasteOffset.y + bump.y) % 100;

      const offset = { x: this._lastPasteOffset.x, y: this._lastPasteOffset.y };

      // crea istanze nuove
      const newEls = arr.map(obj => this.deserializeElement(obj, offset));
      // commit come comando unico
      const cmd = new AddElementsCommand(this, newEls, 'Incolla elementi');
      this.commandMgr.executeCommand(cmd);
    };

    if (items && items.length) {
      proceed(items);
    } else {
      // async best-effort dal system clipboard
      useSystem().then(proceed);
    }
  }

  startGroupDrag(el, e) {
    if (e.button !== 0) return;                    // solo sinistro
    if (e.target.closest('.handles')) return;      // evita i resize handle

    // se non è già selezionato, gestisci la selezione
    if (!this.selected.includes(el)) {
      if (e.ctrlKey || e.shiftKey) this.selectInclude(el);
      else this.selectOnly(el);
    }

    const start = clientToStage(e, this.stageEl);
    const starts = this.selected.map(s => ({ s, x: s.x, y: s.y }));
    const grid = this.gridPct();
    const snapIt = e.shiftKey;                     // SHIFT = snap (coerente col resto)

    const onMove = (ev) => {
      ev.preventDefault();
      const p = clientToStage(ev, this.stageEl);
      let dx = pxToPct(p.x - start.x, this.stageEl.clientWidth);
      let dy = pxToPct(p.y - start.y, this.stageEl.clientHeight);
      if (snapIt) { dx = snapTo(dx, grid.x); dy = snapTo(dy, grid.y); }

      // anteprima: muove tutti i selezionati con clamp ai bordi
      starts.forEach(({ s, x, y }) => {
        let nx = clamp(x + dx, 0, 100 - s.w);
        let ny = clamp(y + dy, 0, 100 - s.h);
        s.x = nx; s.y = ny; s.applyTransform();
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('mouseup', onUp, true);

      // delta finale (uguale per tutti) rispetto alle posizioni originali
      const dx = this.selected[0].x - starts[0].x;
      const dy = this.selected[0].y - starts[0].y;
      if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;

      // ripristina preview e committa come unico comando
      starts.forEach(({ s, x, y }) => { s.x = x; s.y = y; s.applyTransform(); });
      const cmd = new MoveElementsCommand(this, this.selected, dx, dy, 'Sposta elementi');
      this.commandMgr.executeCommand(cmd);
      this.stepMgr.scheduleThumb(this.stepMgr.activeStep);
    };

    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
  }
  layoutStage() {
    const outer = this.stageEl.parentElement;
    const cs = getComputedStyle(outer);
    const pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
    const pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;

    const cw = outer.clientWidth - pl - pr;
    const ch = outer.clientHeight - pt - pb;

    const orient = this.stageEl.dataset.orient || 'landscape';
    const R = (orient === 'portrait') ? (9 / 16) : (16 / 9);

    // dimensioni "base" che fanno FIT nel contenitore (senza zoom)
    let baseW = Math.min(cw, Math.floor(ch * R));
    let baseH = Math.floor(baseW / R);
    if (baseH > ch) { baseH = ch; baseW = Math.floor(baseH * R); }
    if (baseW > cw) { baseW = cw; baseH = Math.floor(baseW / R); }

    // 1) imposta lo zoom come CSS var (usato da .stage-size)
    this.stageEl.style.setProperty('--zoom', String(this.zoom));

    // 2) la dimensione REALE di #stage cresce con lo zoom -> abilita le scrollbar
    const w = Math.max(1, Math.floor(baseW * this.zoom));
    const h = Math.max(1, Math.floor(baseH * this.zoom));
    Object.assign(this.stageEl.style, { width: w + 'px', height: h + 'px' });
  }

  setZoom(z) {
    // clamp tra minZoom e maxZoom
    const nz = Math.max(this.minZoom, Math.min(this.maxZoom, z));
    if (Math.abs(nz - this.zoom) < 1e-4) return; // niente da fare

    this.zoom = nz;

    // aggiorna la CSS var usata da .stage-size (se la usi)
    this.stageEl.style.setProperty('--zoom', String(this.zoom));

    // rilayoutta per aggiornare width/height reali dello stage (scrollbar)
    this.layoutStage();
  }

  zoomBy(factor) {
    this.setZoom(this.zoom * factor);
  }

  gridPct() { const sx = this.stageEl.clientWidth, sy = this.stageEl.clientHeight; const g = this.grid; if (!g) return { x: 0, y: 0 }; return { x: pxToPct(g, sx), y: pxToPct(g, sy) }; }
  initUI() {
    this.propForm.addEventListener('submit', (e) => e.preventDefault()); this.propForm.setAttribute('novalidate', 'novalidate');
    $('#orientLandscape').addEventListener('change', () => { if ($('#orientLandscape').checked) { this.changeOrientation('landscape'); } });
    $('#orientPortrait').addEventListener('change', () => { if ($('#orientPortrait').checked) { this.changeOrientation('portrait'); } });
    const range = $('#gridRange'), val = $('#gridVal');
    const setGrid = (g) => { this.grid = Number(g); val.textContent = g == 0 ? 'off' : g + "px"; this.stageEl.style.setProperty('--grid', (g || 8) + "px"); this.stageEl.dataset.grid = g == 0 ? 'off' : 'on'; };
    range.addEventListener('input', e => setGrid(e.target.value)); setGrid(range.value);
    $('#subgridSwitch').addEventListener('change', e => { this.subgrid = e.target.checked; this.stageEl.dataset.subgrid = this.subgrid ? 'on' : 'off'; });
    $('#setBg').addEventListener('click', () => { const url = $('#bgUrl').value.trim(); this.setBackground(url); });

    // Add undo/redo buttons to toolbar
    const undoRedoGroup = document.createElement('div');
    undoRedoGroup.className = 'btn-group btn-group-sm me-2';
    undoRedoGroup.innerHTML = `
      <button id="btnUndo" type="button" class="btn btn-outline-light" title="Annulla (Ctrl+Z)" disabled>↶</button>
      <button id="btnRedo" type="button" class="btn btn-outline-light" title="Ripeti (Ctrl+Y)" disabled>↷</button>
    `;

    // Insert after the align buttons
    const alignGroup = document.querySelector('.btn-group[aria-label="Align"]');
    alignGroup.parentNode.insertBefore(undoRedoGroup, alignGroup.nextSibling);

    $('#btnUndo').addEventListener('click', () => this.commandMgr.undo());
    $('#btnRedo').addEventListener('click', () => this.commandMgr.redo());

    this.stageEl.addEventListener('dragover', (e) => { e.preventDefault(); });
    this.stageEl.addEventListener('drop', (e) => { e.preventDefault(); const type = e.dataTransfer.getData('text/plain'); const el = this.createElementByType(type); if (!el) return; const p = clientToStage(e, this.stageEl); el.x = clamp(pxToPct(p.x - pctToPx(el.w, this.stageEl.clientWidth) / 2, this.stageEl.clientWidth), 0, 100 - el.w); el.y = clamp(pxToPct(p.y - pctToPx(el.h, this.stageEl.clientHeight) / 2, this.stageEl.clientHeight), 0, 100 - el.h); const cmd = new AddElementCommand(this, el, `Aggiungi ${type}`); this.commandMgr.executeCommand(cmd); });
    this.stageEl.addEventListener('mousedown', (e) => {
      if (e.target === this.stageEl || e.target === this.canvas || e.target.classList.contains('stage-size')) {
        if (!e.shiftKey && !e.ctrlKey) this.clearSelection();
        const start = clientToStage(e, this.stageEl); const mq = $('#marquee'); mq.classList.remove('d-none'); Object.assign(mq.style, { left: start.x + 'px', top: start.y + 'px', width: 0, height: 0 });
        const onMove = (ev) => {
          const p = clientToStage(ev, this.stageEl); const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); Object.assign(mq.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
          const rx = { l: pxToPct(x, this.stageEl.clientWidth), t: pxToPct(y, this.stageEl.clientHeight), r: pxToPct(x + w, this.stageEl.clientWidth), b: pxToPct(y + h, this.stageEl.clientHeight) };
          this.elements.forEach(el => { const ex = { l: el.x, t: el.y, r: el.x + el.w, b: el.y + el.h }; const hit = !(ex.l > rx.r || ex.r < rx.l || ex.t > rx.b || ex.b < rx.t); el.setSelected(hit); if (hit && !this.selected.includes(el)) this.selected.push(el); });
        };
        const onUp = () => { mq.classList.add('d-none'); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) };
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      }
    });
    $('#btnExportHtml').addEventListener('click', () => this.caseExporter.exportCaseHTML());
    $$('[data-cmd]').forEach(b => b.addEventListener('click', () => this.execCommand(b.dataset.cmd)));
    // Zoom con rotellina sul contenitore scrollabile + ancora sotto al cursore
    const outer = this.stageEl.parentElement; // .stage-outer
    outer.addEventListener('wheel', (e) => {

      e.preventDefault();

      const outerRect = outer.getBoundingClientRect();
      const stageRect = this.stageEl.getBoundingClientRect();

      // coordinate del mouse nel "sistema" di #stage considerando lo scroll attuale
      const mouseXInStageScroll = (e.clientX - stageRect.left) + outer.scrollLeft;
      const mouseYInStageScroll = (e.clientY - stageRect.top) + outer.scrollTop;

      // frazioni relative (0..1) del punto ancora
      const relX = mouseXInStageScroll / this.stageEl.clientWidth;
      const relY = mouseYInStageScroll / this.stageEl.clientHeight;

      // deltaY>0 => out, <0 => in
      const factor = Math.pow(1.0015, e.deltaY);
      this.zoomBy(1 / factor);              // aggiorna this.zoom e rilayoutta

      // dopo il layout, ricalcola scroll per mantenere il punto sotto al mouse
      const newW = this.stageEl.clientWidth;
      const newH = this.stageEl.clientHeight;

      const targetScrollLeft = (relX * newW) - (e.clientX - outerRect.left);
      const targetScrollTop = (relY * newH) - (e.clientY - outerRect.top);

      outer.scrollLeft = Math.max(0, targetScrollLeft);
      outer.scrollTop = Math.max(0, targetScrollTop);
    }, { passive: false });
    // --- Dropdown Tema (ThemeFactory) ---
    const orientGroup = document.querySelector('[role="group"][aria-label="Orientamento"]');

    const themeWrap = document.createElement('div');
    themeWrap.className = 'ms-2 d-flex align-items-center gap-1';

    const themeLabel = document.createElement('span');
    themeLabel.className = 'small text-secondary';
    themeLabel.textContent = 'Tema';

    const sel = document.createElement('select');
    sel.id = 'themeSelect';
    sel.className = 'form-select form-select-sm';

    // Popola con i temi disponibili
    ThemeFactory.list().forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;         // "dark" | "light"
      opt.textContent = t.label; // "Scuro" | "Chiaro"
      sel.appendChild(opt);
    });

    // Seleziona quello corrente
    sel.value = ThemeFactory.currentTheme.id;

    // Cambia tema on-change
    sel.addEventListener('change', (e) => {
      ThemeFactory.apply(e.target.value);
    });

    themeWrap.appendChild(themeLabel);
    themeWrap.appendChild(sel);
    orientGroup.parentNode.insertBefore(themeWrap, orientGroup.nextSibling);

    // --- Resize pannelli laterali ---
    const installResizer = (panel) => {
      if (panel.querySelector('.resize-handle')) return;
      const side = panel.dataset.side; // 'left' | 'right'
      if (!side) return;

      const h = document.createElement('div');
      h.className = 'resize-handle';
      panel.appendChild(h);

      const min = 160, max = 600;

      const onDown = (e) => {
        if (panel.getAttribute('data-collapsed') === '1') return;
        e.preventDefault();
        const startX = e.clientX;
        const startW = panel.getBoundingClientRect().width;

        const onMove = (ev) => {
          const dx = ev.clientX - startX;
          let newW = startW;
          if (side === 'left') newW = startW + dx;
          if (side === 'right') newW = startW - dx;
          newW = Math.max(min, Math.min(max, newW));
          // imposta larghezza come CSS var usata dal pannello
          panel.style.setProperty('--panel-expanded-w', `${newW}px`);
          panel.style.width = `${newW}px`;
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          document.body.style.userSelect = '';
        };

        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };

      h.addEventListener('mousedown', onDown);
    };

    // installa su tutti i dock-panel a sinistra e a destra
    document.querySelectorAll('.dock-panel[data-side]').forEach(installResizer);

    // se il tuo PanelManager collassa/espande, potresti richiamare installResizer dopo il render

  }
  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+') { e.preventDefault(); this.zoomBy(1.1); return; }
        if (e.key === '-') { e.preventDefault(); this.zoomBy(1 / 1.1); return; }
        if (e.key === '0') { e.preventDefault(); this.setZoom(1); return; }
        const k = e.key.toLowerCase();
        if (k === 'c') { e.preventDefault(); this.copySelected(); return; }
        if (k === 'x') { e.preventDefault(); this.cutSelected(); return; }
        if (k === 'v') { e.preventDefault(); this.pasteFromClipboard(); return; }
      }
      // Skip if command manager handles it (Ctrl+Z, etc.)
      if ((e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase())) {
        return; // Let CommandManager handle these
      }

      if (!this.selected.length) return;
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
      if (isArrow || e.key === 'Delete') e.preventDefault();
      const stepX = e.shiftKey ? (this.gridPct().x || pxToPct(8, this.stageEl.clientWidth)) : pxToPct(1, this.stageEl.clientWidth);
      const stepY = e.shiftKey ? (this.gridPct().y || pxToPct(8, this.stageEl.clientHeight)) : pxToPct(1, this.stageEl.clientHeight);
      const useSnap = e.shiftKey;
      switch (e.key) {
        case 'Delete': this.deleteSelectedWithCommand(); break;
        case 'ArrowLeft': this.nudge(-stepX, 0, { snap: useSnap }); break;
        case 'ArrowRight': this.nudge(stepX, 0, { snap: useSnap }); break;
        case 'ArrowUp': this.nudge(0, -stepY, { snap: useSnap }); break;
        case 'ArrowDown': this.nudge(0, stepY, { snap: useSnap }); break;
      }
    }, true);
  }
  onElementChanged() { if (!this.stepMgr?.activeStep) return; clearTimeout(this._thumbDebounce); this._thumbDebounce = setTimeout(() => this.stepMgr.scheduleThumb(this.stepMgr.activeStep), 200); }
  nudge(dx, dy, opts = { snap: false }) {
    // Bersagli: selezione se presente, altrimenti il top-most (ultimo aggiunto)
    const targets = this.selected.length
      ? [...this.selected]
      : (this.elements.length ? [this.elements[this.elements.length - 1]] : []);

    if (!targets.length) return;

    const grid = this.gridPct();
    const snapEnabled = !!opts.snap && (this.grid || 0) > 0;

    const finalDx = dx;   // dx,dy sono in PUNTI PERCENTUALI
    const finalDy = dy;

    // Verifica che tutti possano muoversi senza clamp (evita movimenti "a metà")
    let canMove = true;
    for (const el of targets) {
      let nx = el.x + finalDx;
      let ny = el.y + finalDy;

      if (snapEnabled) {
        nx = snapTo(nx, grid.x);
        ny = snapTo(ny, grid.y);
      }

      // limiti canvas
      const clampedX = Math.max(0, Math.min(100 - el.w, nx));
      const clampedY = Math.max(0, Math.min(100 - el.h, ny));

      // se servirebbe clampare, annulliamo il nudge di gruppo
      if (Math.abs(clampedX - nx) > 0.01 || Math.abs(clampedY - ny) > 0.01) {
        canMove = false;
        break;
      }
    }

    if (!canMove) return;

    // Esegui come UNICO comando (copre 1 o N elementi)
    const cmd = new MoveElementsCommand(this, targets, finalDx, finalDy, 'Sposta elementi (nudge)');
    this.commandMgr.executeCommand(cmd);

    // Se non c'era selezione, metti in selezione il target di default per coerenza con i test
    if (!this.selected.length && targets.length === 1) {
      this.selectOnly(targets[0]);
    }
  }

  seedPalette() {
    const items = [
      { type: 'label', title: 'Etichetta di testo', klass: LabelElement },
      { type: 'image', title: 'Immagine', klass: ImageElement },
      { type: 'textbox', title: 'Casella di testo', klass: TextBoxElement },
      { type: 'checkbox', title: 'Checkbox', klass: CheckboxElement },
      { type: 'radiogroup', title: 'Opzioni (radio)', klass: RadioGroupElement }
    ];
    this.registry = new Map(items.map(i => [i.type, i]));
    items.forEach(i => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline-light btn-sm w-100 text-start palette-item'; b.draggable = true; b.dataset.type = i.type; b.innerHTML = `<strong>${i.title}</strong><div class="small text-secondary">${i.type}</div>`; b.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i.type)); b.addEventListener('click', () => { const el = this.createElementByType(i.type); const cmd = new AddElementCommand(this, el, `Aggiungi ${i.type}`); this.commandMgr.executeCommand(cmd); }); this.palette.appendChild(b); });
  }
  createElementByType(type) { const meta = this.registry.get(type); return meta ? new meta.klass() : null; }
  clearSelection() { this.selected.forEach(e => e.setSelected(false)); this.selected = []; this.renderPropPanel(); }
  toggleSelect(el) { const i = this.selected.indexOf(el); if (i >= 0) { this.selected.splice(i, 1); el.setSelected(false); } else { this.selected.push(el); el.setSelected(true); } this.renderPropPanel(); }
  selectOnly(el) { this.clearSelection(); if (el) { this.selected = [el]; el.setSelected(true); } this.renderPropPanel(); }
  selectInclude(el) { if (!this.selected.includes(el)) this.selected.push(el); el.setSelected(true); this.renderPropPanel(); }
  reflectSelection() { if (this.selected.length !== 1) { this.renderPropPanel(); return; } const sel = this.selected[0]; $$('#propForm [data-prop]').forEach(inp => { const k = inp.dataset.prop; if (['x', 'y', 'w', 'h', 'z', 'fontSize'].includes(k)) inp.value = sel[k]; if (k === 'lockRatio') inp.checked = !!sel.lockRatio; }); }
  deleteSelected() { this.selected.forEach(s => { s.dom.remove(); this.elements = this.elements.filter(e => e !== s); }); this.clearSelection(); this.stepMgr.scheduleThumb(this.stepMgr.activeStep); }
  deleteSelectedWithCommand() {
    if (!this.selected.length) return;
    const cmd = new DeleteElementsCommand(this, this.selected, 'Elimina elementi');
    this.commandMgr.executeCommand(cmd);
  }
  renderPropPanel() {
    const f = this.propForm;
    f.innerHTML = '';

    // --- STEP PROPERTIES (quando non c'è selezione elementi) ---
    if (!this.selected.length) {
      const step = this.stepMgr?.activeStep;
      if (!step) {
        f.innerHTML = '<div class="text-secondary small">Nessuno step attivo</div>';
        return;
      }

      const wrap = document.createElement('div');
      // Campi inline usando .prop-row (CSS visto sopra)
      wrap.innerHTML = `
      <div class="prop-row">
        <label class="form-label small mb-0" for="stepName">Titolo step</label>
        <input id="stepName" class="form-control form-control-sm prop-input" type="text" value="${step.name}">
      </div>

      <div class="prop-row">
        <label class="form-label small mb-0" for="stepOrient">Orientamento</label>
        <select id="stepOrient" class="form-select form-select-sm prop-input">
          <option value="landscape">16:9</option>
          <option value="portrait">9:16</option>
        </select>
      </div>

      <div class="prop-row">
        <label class="form-label small mb-0" for="stepBg">Sfondo (URL)</label>
        <input id="stepBg" class="form-control form-control-sm prop-input" type="url"
               value="${step.bgUrl || ''}" placeholder="https://…/img.jpg">
      </div>
    `;
      f.appendChild(wrap);

      // sync + listeners
      $('#stepOrient', wrap).value = step.orient;

      $('#stepName', wrap).addEventListener('input', e => {
        step.name = e.target.value || step.name;
        this.stepMgr.render();
      });

      $('#stepOrient', wrap).addEventListener('change', e => {
        step.orient = e.target.value;
        this.changeOrientation(step.orient);
        this.stepMgr.render();
      });

      $('#stepBg', wrap).addEventListener('change', e => {
        step.bgUrl = e.target.value.trim();
        this.setBackground(step.bgUrl);
        this.stepMgr.scheduleThumb(step);
      });
      return;
    }
    if (this.selected.length > 1) {
      f.innerHTML = '<div class="text-secondary small">Selezionati: ' + this.selected.length + ' elementi</div>';
      return;
    }

    const el = this.selected[0];
    const schema = el.getPropSchema();

    // raggruppa per section
    const sections = new Map();
    for (const def of schema) {
      const sec = def.section || 'Generale';
      if (!sections.has(sec)) sections.set(sec, []);
      sections.get(sec).push(def);
    }

    // builder sezione collassabile
    const buildSection = (title, defs) => {
      const sec = document.createElement('div');
      sec.className = 'prop-section';
      sec.dataset.collapsed = '0';

      const head = document.createElement('div');
      head.className = 'prop-head';
      head.innerHTML = `<div class="title">${title}</div><button type="button" class="btn btn-outline-light btn-sm _toggle">▼</button>`;
      const body = document.createElement('div');
      body.className = 'prop-body';

      head.querySelector('._toggle').addEventListener('click', () => {
        const c = sec.getAttribute('data-collapsed') === '1' ? '0' : '1';
        sec.setAttribute('data-collapsed', c);
        head.querySelector('._toggle').textContent = (c === '1' ? '▶' : '▼');
      });

      // raggruppa per group per righe inline
      const groups = new Map();
      const singles = [];
      defs.forEach(d => {
        if (d.group) {
          if (!groups.has(d.group)) groups.set(d.group, []);
          groups.get(d.group).push(d);
        } else {
          singles.push(d);
        }
      });

      // render helper: un input
      const renderInput = (def) => {
        const id = Editor.uid('prop');
        const row = document.createElement('div');
        row.className = 'prop-row';

        const label = document.createElement('label');
        label.className = 'form-label small mb-0';
        label.htmlFor = id;
        label.textContent = def.label || '';

        // valore iniziale (supporto path annidato)
        const pathGet = def.key && def.key.includes('.') ? getByPath : (o, k) => o[k];
        const pathSet = def.key && def.key.includes('.') ? (o, k, v) => setByPath(o, k, v) : (o, k, v) => { o[k] = v; };
        let v = def.key ? pathGet(el, def.key) : null;

        // contenitore input
        const wrap = document.createElement('div');
        wrap.className = 'prop-inline';

        const makeNumber = () => {
          const inp = document.createElement('input');
          inp.type = 'number';
          inp.className = 'form-control form-control-sm';
          inp.id = id;
          if (def.min != null) inp.min = def.min;
          if (def.max != null) inp.max = def.max;
          if (def.step != null) inp.step = def.step;
          if (v != null) inp.value = v;
          inp.addEventListener('input', () => {
            let val = Number(inp.value || 0);
            if (def.min != null) val = Math.max(def.min, val);
            if (def.max != null) val = Math.min(def.max, val);
            const oldVal = v;
            v = val;
            const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
            this.commandMgr.executeCommand(cmd);
          });
          return inp;
        };

        const makeText = () => {
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'form-control form-control-sm';
          inp.id = id;
          if (v != null) inp.value = v;
          inp.addEventListener('input', () => {
            const oldVal = v; v = inp.value;
            const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
            this.commandMgr.executeCommand(cmd);
          });
          return inp;
        };

        const makeTextarea = () => {
          const ta = document.createElement('textarea');
          ta.className = 'form-control form-control-sm'; ta.rows = 2; ta.id = id;
          if (v != null) ta.value = v;
          ta.addEventListener('input', () => {
            const oldVal = v; v = ta.value;
            const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
            this.commandMgr.executeCommand(cmd);
          });
          return ta;
        };

        const makeSelect = () => {
          const sel = document.createElement('select');
          sel.className = 'form-select form-select-sm';
          sel.id = id;
          (def.options || []).forEach(([val, lab]) => {
            const o = document.createElement('option');
            o.value = val; o.textContent = lab; sel.appendChild(o);
          });
          if (v != null) sel.value = v;
          sel.addEventListener('change', () => {
            const oldVal = v; v = sel.value;
            const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
            this.commandMgr.executeCommand(cmd);
          });
          return sel;
        };

        const makeCheckbox = () => {
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.className = 'form-check-input';
          inp.id = id;
          inp.checked = !!v;
          inp.addEventListener('input', () => {
            const oldVal = v; v = !!inp.checked;
            const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
            this.commandMgr.executeCommand(cmd);
          });
          return inp;
        };

        const makeRange = () => {
          const box = document.createElement('div');
          box.className = 'range-wrap';

          const range = document.createElement('input');
          range.type = 'range';
          range.className = 'form-range';
          if (def.min != null) range.min = def.min;
          if (def.max != null) range.max = def.max;
          range.step = def.step ?? 1;
          range.value = v ?? def.min ?? 100;

          const out = document.createElement('span');
          out.className = 'small-label';
          out.textContent = range.value;

          range.addEventListener('input', () => {
            let val = Number(range.value);
            if (def.min != null) val = Math.max(def.min, val);
            if (def.max != null) val = Math.min(def.max, val);
            range.value = String(val);
            out.textContent = String(val);
          });
          range.addEventListener('change', () => {
            const oldVal = v; v = Number(range.value);
            const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
            this.commandMgr.executeCommand(cmd);
          });

          box.appendChild(range);
          box.appendChild(out);
          return box;
        };


        const makeColorAlpha = () => {
          const box = document.createElement('div');
          box.className = 'color-alpha';

          // valore iniziale
          const { hex, a } = parseColorToHexAlpha(v);

          // color well
          const color = document.createElement('input');
          color.type = 'color';
          color.className = 'form-control form-control-color';
          color.value = hex;

          // input testo (hex/rgba)
          const text = document.createElement('input');
          text.type = 'text';
          text.className = 'form-control form-control-sm';
          text.value = (a >= 0.999 ? hex : `rgba(${hexToRgb(hex + 'ff').r}, ${hexToRgb(hex + 'ff').g}, ${hexToRgb(hex + 'ff').b}, ${a})`);

          // alpha number
          const alpha = document.createElement('input');
          alpha.type = 'number';
          alpha.className = 'form-control form-control-sm';
          alpha.min = '0'; alpha.max = '1'; alpha.step = '0.01';
          alpha.value = String(a);

          const commit = (newHex, newA) => {
            const newVal = composeColor(newHex, newA);
            const oldVal = v; v = newVal;
            // aggiorna text coerentemente
            text.value = (newA >= 0.999) ? newHex : `rgba(${hexToRgb(newHex + 'ff').r}, ${hexToRgb(newHex + 'ff').g}, ${hexToRgb(newHex + 'ff').b}, ${newA})`;
            const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
            this.commandMgr.executeCommand(cmd);
          };

          color.addEventListener('input', () => {
            commit(color.value, Number(alpha.value));
          });

          alpha.addEventListener('input', () => {
            let av = Number(alpha.value || 0); if (av < 0) av = 0; if (av > 1) av = 1;
            alpha.value = String(av);
            commit(color.value, av);
          });

          text.addEventListener('change', () => {
            // accetta #rrggbb o rgba(r,g,b,a)
            const t = text.value.trim();
            const parsed = parseColorToHexAlpha(t);
            // se parsing fallisce, non committare
            if (!parsed) return;
            color.value = parsed.hex;
            alpha.value = String(parsed.a);
            commit(parsed.hex, parsed.a);
          });

          // α label compatta
          const aWrap = document.createElement('div');
          aWrap.className = 'prop-two';
          const aLab = document.createElement('span'); aLab.className = 'small-label'; aLab.textContent = 'α';
          aWrap.appendChild(aLab); aWrap.appendChild(alpha);

          box.appendChild(color);
          box.appendChild(text);
          box.appendChild(aWrap);
          return box;
        };


        const makeBoldToggle = () => {
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.className = 'form-check-input';
          inp.id = id;
          const current = getByPath(el, 'style.fontWeight') ?? 400;
          inp.checked = current >= 700;
          inp.addEventListener('input', () => {
            const oldVal = getByPath(el, 'style.fontWeight') ?? 400;
            const newVal = inp.checked ? 700 : 400;
            const cmd = new ChangePropertyCommand(this, el, 'style.fontWeight', newVal, oldVal, 'Modifica grassetto');
            this.commandMgr.executeCommand(cmd);
          });
          return inp;
        };


        // crea l’input in base al tipo
        let inputEl;
        switch (def.type) {
          case 'number': inputEl = makeNumber(); break;
          case 'text': inputEl = makeText(); break;
          case 'textarea': inputEl = makeTextarea(); break;
          case 'select': inputEl = makeSelect(); break;
          case 'checkbox': inputEl = makeCheckbox(); break;
          case 'range': inputEl = makeRange(); break;
          case 'color-alpha': inputEl = makeColorAlpha(); break;
          case 'bold-toggle': inputEl = makeBoldToggle(); break;
          case 'color': // fallback: usa lo stesso controllo con alpha
          case 'color-alpha': inputEl = makeColorAlpha(); break;
          case 'regex': {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'form-control form-control-sm';
            inp.id = id;
            if (v != null) inp.value = v;
            const baseBorder = () => {
              inp.style.borderColor = '';
              inp.style.boxShadow = '';
            };
            const markBad = () => {
              inp.style.borderColor = '#dc3545';
              inp.style.boxShadow = '0 0 0 .12rem rgba(220,53,69,.25)';
            };
            const tryCompile = (raw) => {
              if (!raw) return true;
              let body = raw.trim(), flags = '';
              if (body[0] === '/' && body.lastIndexOf('/') > 0) {
                const last = body.lastIndexOf('/');
                flags = body.slice(last + 1);
                body = body.slice(1, last);
              }
              try { new RegExp(body, flags.replace(/[^gimsuy]/g, '')); return true; }
              catch { return false; }
            };
            const onChange = () => {
              const raw = inp.value;
              const ok = tryCompile(raw);
              if (ok) baseBorder(); else markBad();
              const oldVal = v; v = raw;
              const cmd = new ChangePropertyCommand(this, el, def.key, v, oldVal, `Modifica ${def.label.toLowerCase()}`);
              this.commandMgr.executeCommand(cmd);
            };
            inp.addEventListener('input', onChange);
            // prima validazione
            if (!tryCompile(inp.value)) markBad();

            inputEl = inp;
            break;
          }
          default: inputEl = makeText(); break;
        }

        // assembla riga
        row.appendChild(label);
        wrap.appendChild(inputEl);
        row.appendChild(wrap);
        return row;
      };
      const iconSet = new Set(['↔', '↕', '↑', '↓', '→', '←', 'px']);
      // render gruppi inline
      const renderGroup = (labelText, defs) => {
        const row = document.createElement('div');
        row.className = 'prop-row';

        const label = document.createElement('label');
        label.className = 'form-label small mb-0';
        label.textContent = labelText || '';

        const group = document.createElement('div');
        group.className = 'prop-group';

        defs.forEach(d => {
          // mini blocco con eventuale mini-label (es. frecce o ↔/↕)
          const mini = document.createElement('div');
          mini.className = 'mini';

          if (d.label) {
            const sl = document.createElement('span');
            sl.className = 'small-label';
            sl.textContent = d.label;
            if (iconSet.has(d.label)) sl.classList.add('icon');
            mini.appendChild(sl);
          }
          // sfrutta renderInput ma senza label grande
          const tmp = Object.assign({}, d, { label: '' });
          const cell = renderInput(tmp);
          // prendi SOLO l’input (secondo figlio .prop-inline)
          mini.appendChild(cell.querySelector('.prop-inline').firstChild);
          group.appendChild(mini);
        });

        row.appendChild(label);
        row.appendChild(group);
        return row;
      };
      // Render "a blocco": un'unica label a sinistra, a destra una colonna di righe
      const renderBlock = (title, rowsOfDefs) => {
        const row = document.createElement('div');
        row.className = 'prop-row';

        const label = document.createElement('label');
        label.className = 'form-label small mb-0';
        label.textContent = title || '';

        const vwrap = document.createElement('div');
        vwrap.className = 'vstack gap-2 flex-grow-1';

        rowsOfDefs.forEach(defs => {
          const line = document.createElement('div');   // ogni riga del blocco
          line.className = 'prop-group';                // usa il layout orizzontale per quella riga

          defs.forEach(d => {
            const mini = document.createElement('div');
            mini.className = 'mini';

            if (d.label) {
              const sl = document.createElement('span');
              sl.className = 'small-label';
              sl.textContent = d.label;
              if (iconSet.has(d.label)) sl.classList.add('icon');
              mini.appendChild(sl);
            }

            const tmp = Object.assign({}, d, { label: '' }); // nessuna seconda label
            const cell = renderInput(tmp);
            mini.appendChild(cell.querySelector('.prop-inline').firstChild);
            line.appendChild(mini);
          });

          vwrap.appendChild(line);
        });

        row.appendChild(label);
        row.appendChild(vwrap);
        return row;
      };

      // prima i gruppi
      // font-size → "Dimensione" su UNA riga (numero + unità)
      if (groups.has('font-size')) {
        body.appendChild(renderGroup('Dimensione', groups.get('font-size')));
        groups.delete('font-size');
      }

      // font-weight → "Peso" su UNA riga (slider + valore)
      if (groups.has('font-weight')) {
        body.appendChild(renderGroup('Peso', groups.get('font-weight')));
        groups.delete('font-weight');
      }

      // Ombra → blocco: 4 righe (X, Y, Colore, Sfocatura)
      // Ombra → 4 righe: ↔ / ↕ / (picker) / Blurr
      if (groups.has('shadow')) {
        const defs = groups.get('shadow');
        const X = defs.find(d => d.key.endsWith('.x'));
        const Y = defs.find(d => d.key.endsWith('.y'));
        const C = defs.find(d => d.key.endsWith('.color'));
        const B = defs.find(d => d.key.endsWith('.blur'));
        const rows = [[X], [Y], [C], [B]].map(r => r.filter(Boolean));
        body.appendChild(renderBlock('Ombra', rows));
        groups.delete('shadow');
      }

      // Bordo → 2 righe: px / (picker)
      if (groups.has('border')) {
        const defs = groups.get('border');
        const W = defs.find(d => d.key.includes('.width'));
        const C = defs.find(d => d.key.includes('.color'));
        const rows = [[W], [C]].map(r => r.filter(Boolean));
        body.appendChild(renderBlock('Bordo', rows));
        groups.delete('border');
      }

      // Padding → 2 righe: ↑ ↓  /  → ←
      if (groups.has('padding')) {
        const defs = groups.get('padding');
        const T = defs.find(d => d.key.endsWith('.top'));
        const B = defs.find(d => d.key.endsWith('.bottom'));
        const R = defs.find(d => d.key.endsWith('.right'));
        const L = defs.find(d => d.key.endsWith('.left'));
        const rows = [[T, B], [R, L]].map(r => r.filter(Boolean));
        body.appendChild(renderBlock('Padding', rows));
        groups.delete('padding');
      }


      // ora i singoli non raggruppati
      singles.forEach(def => body.appendChild(renderInput(def)));
      // eventuali gruppi rimasti (se ne aggiungerai in futuro)
      groups.forEach((defs, name) => body.appendChild(renderGroup(name, defs)));

      sec.appendChild(head);
      sec.appendChild(body);
      return sec;
    };

    // render sezioni nell’ordine
    sections.forEach((defs, title) => {
      f.appendChild(buildSection(title, defs));
    });
  }
  execCommand(cmd) {
    const sel = [...this.selected]; if (sel.length < 1) return; const bbox = { minX: Math.min(...sel.map(e => e.x)), maxX: Math.max(...sel.map(e => e.x + e.w)), minY: Math.min(...sel.map(e => e.y)), maxY: Math.max(...sel.map(e => e.y + e.h)) };
    const centerX = (bbox.minX + bbox.maxX) / 2, centerY = (bbox.minY + bbox.maxY) / 2;
    switch (cmd) {
      case 'align-left': sel.forEach(e => { e.x = bbox.minX; e.applyTransform(); }); break;
      case 'align-right': sel.forEach(e => { e.x = bbox.maxX - e.w; e.applyTransform(); }); break;
      case 'align-hcenter': sel.forEach(e => { e.x = centerX - e.w / 2; e.applyTransform(); }); break;
      case 'align-top': sel.forEach(e => { e.y = bbox.minY; e.applyTransform(); }); break;
      case 'align-bottom': sel.forEach(e => { e.y = bbox.maxY - e.h; e.applyTransform(); }); break;
      case 'align-vcenter': sel.forEach(e => { e.y = centerY - e.h / 2; e.applyTransform(); }); break;
      case 'dist-h': this.distribute(sel, 'x', 'w'); break;
      case 'dist-v': this.distribute(sel, 'y', 'h'); break;
      case 'front': sel.forEach(e => { e.z = Math.max(...this.elements.map(x => x.z)) + 1; e.applyTransform(); }); break;
      case 'back': sel.forEach(e => { e.z = Math.max(0, (e.z | 0) - 1); e.applyTransform(); }); break;
    }
    this.reflectSelection(); this.stepMgr.scheduleThumb(this.stepMgr.activeStep);
  }
  distribute(sel, axis, sizeKey) { sel.sort((a, b) => a[axis] - b[axis]); const first = sel[0], last = sel[sel.length - 1]; const start = first[axis], end = last[axis] + last[sizeKey]; const total = sel.reduce((s, e) => s + e[sizeKey], 0); const gaps = sel.length - 1; const space = (end - start - total) / gaps; let pos = start; sel.forEach((e, i) => { if (i === 0) { pos = e[axis] + e[sizeKey]; return; } e[axis] = pos; e.applyTransform(); pos += e[sizeKey] + space; }); }
  exportHTML() {
    const orient = this.stageEl.dataset.orient; const clone = this.canvas.cloneNode(true);
    $$('.el', clone).forEach(n => { n.classList.remove('selected'); $$('.handles', n).forEach(h => h.remove()); n.removeAttribute('data-type'); });
    const wrapper = document.createElement('div'); wrapper.style.position = 'relative'; wrapper.style.width = '100%'; wrapper.style.aspectRatio = orient === 'portrait' ? '9/16' : '16/9'; wrapper.appendChild(clone);
    const html = wrapper.outerHTML.trim(); const blob = new Blob([html], { type: 'text/html;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'step.html'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  loadStep(step) {
    this.elements.forEach(e => e.unmount()); this.clearSelection();
    this.elements = step.items;
    this.changeOrientation(step.orient, { syncToolbar: true, suppressRender: true });
    this.setBackground(step.bgUrl, { suppressThumb: true });
    this.canvas.innerHTML = '';
    this.elements.forEach(e => e.mount(this.canvas));
    this.layoutStage();
    this.renderPropPanel();
  }
  changeOrientation(orient, opts = {}) {
    this.stageEl.dataset.orient = orient === 'portrait' ? 'portrait' : 'landscape';
    if (opts.syncToolbar) { $('#orientLandscape').checked = orient !== 'portrait'; $('#orientPortrait').checked = orient === 'portrait'; }
    this.layoutStage();
    if (this.stepMgr?.activeStep) { this.stepMgr.activeStep.orient = this.stageEl.dataset.orient; if (!opts.suppressRender) this.stepMgr.render(); }
  }
  setBackground(url, opts = {}) {
    this.canvas.style.background = url ? `center/cover no-repeat url('${url}')` : '';
    if (this.stepMgr?.activeStep) { this.stepMgr.activeStep.bgUrl = url || ''; if (!opts.suppressThumb) this.stepMgr.scheduleThumb(this.stepMgr.activeStep); }
  }
}