// src/elements/TextBoxElement.js
import BaseElement from '../core/base-element.js';
import { FONT_FAMILIES } from '../config/fonts.js';

export default class TextBoxElement extends BaseElement {
  static FONTS = FONT_FAMILIES;

  constructor() {
    super('textbox', 12, 40, 35, 8);

    // Core
    this.name = 'campo';
    this.placeholder = 'Inserisci testo…';
    this.align = 'left';      // 'left'|'center'|'right'
    this.isPassword = false;
    this.multiline = false;
    this.maxLength = null;        // null = senza limite
    this.pattern = '';          // regex opzionale

    // Etichetta (riuso LabelStyle semplificata)
    this.label = {
      text: '',
      position: 'top',              // 'left'|'top'|'inline'
      gap: 6,                       // px tra label e campo
      style: {
        fontFamily: FONT_FAMILIES[0][0],
        fontSize: 1.2,
        fontSizeUnit: 'vw',         // 'vw'|'px'|'%'
        fontWeight: 500,
        fontStyle: 'normal',
        letterSpacing: 0,
        lineHeight: 1.2,
        textTransform: 'none',
        textColor: '#e9ecef',
      }
    };

    // Stile del CAMPO (input/textarea)
    this.inputStyle = {
      fontFamily: FONT_FAMILIES[0][0],
      fontSize: 1.2,
      fontSizeUnit: 'vw',
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      textColor: '#e9ecef',
      backgroundColor: 'rgba(255,255,255,0.06)',
      border: { width: 1, style: 'solid', color: 'rgba(255,255,255,.25)', radius: 6 },
    };
  }

  createDom() {
    const el = document.createElement('div');
    el.className = 'el el-textbox';
    el.dataset.type = 'textbox';
    el.id = this.id;
    el.innerHTML = `
      <div class="tb-wrap" style="display:flex; width:100%; height:100%;">
        <label class="tb-label"></label>
        <div class="tb-input-wrap" style="flex:1 1 auto; min-width:0;"></div>
      </div>`;
    this.dom = el;
    this.readProps();
    return el;
  }

  // assicurati che il nodo campo sia del tipo giusto (input|textarea)
  _ensureFieldEl() {
    const wrap = this.dom.querySelector('.tb-input-wrap');
    let field = wrap.firstElementChild;
    const wantTextarea = !!this.multiline;

    if (!field || (wantTextarea && field.tagName !== 'TEXTAREA') || (!wantTextarea && field.tagName !== 'INPUT')) {
      wrap.innerHTML = '';
      field = document.createElement(wantTextarea ? 'textarea' : 'input');
      if (!wantTextarea) field.type = this.isPassword ? 'password' : 'text';
      field.className = 'w-100 h-100'; // niente bootstrap qui: stile lo mettiamo noi
      if (wantTextarea) field.rows = 3;
      wrap.appendChild(field);
    }
    return field;
  }

  readProps() {
    super.readProps();
    if (!this.dom) return;

    const wrap = this.dom.querySelector('.tb-wrap');
    const labEl = this.dom.querySelector('.tb-label');
    const field = this._ensureFieldEl();

    // --- layout label+campo ---
    const pos = this.label?.position || 'top';
    wrap.style.gap = (this.label?.gap ?? 6) + 'px';
    wrap.style.flexDirection = (pos === 'top') ? 'column' : 'row';
    wrap.style.alignItems = (pos === 'inline') ? 'center' : 'stretch';

    // mostra/nascondi label (stringa vuota = nascondi)
    const hasLabel = !!(this.label?.text || '').trim();
    labEl.style.display = hasLabel ? '' : 'none';
    labEl.textContent = this.label?.text ?? '';

    // --- stile LABEL (subset di LabelStyle) ---
    const ls = this.label?.style || {};
    labEl.style.fontFamily = ls.fontFamily || '';
    labEl.style.fontWeight = String(ls.fontWeight ?? 500);
    labEl.style.fontStyle = ls.fontStyle || 'normal';
    labEl.style.fontSize = `${Number(ls.fontSize ?? 1.2)}${ls.fontSizeUnit || 'vw'}`;
    labEl.style.letterSpacing = (ls.letterSpacing ?? 0) + 'px';
    labEl.style.lineHeight = String(ls.lineHeight ?? 1.2);
    labEl.style.textTransform = ls.textTransform || 'none';
    labEl.style.color = ls.textColor || '#e9ecef';

    // --- CAMPO: attributi base ---
    field.name = this.name || '';
    field.placeholder = this.placeholder || '';
    // type solo per input
    if (field.tagName === 'INPUT') {
      field.type = this.isPassword ? 'password' : 'text';
    }
    // validazione
    field.removeAttribute('maxlength');
    if (this.maxLength != null && this.maxLength > 0) field.maxLength = this.maxLength;
    if (this.pattern) field.setAttribute('pattern', this.pattern); else field.removeAttribute('pattern');

    // allineamento testo
    field.style.textAlign = this.align || 'left';

    // --- CAMPO: tipografia/colore/bordo ---
    const fs = this.inputStyle || {};
    const unit = fs.fontSizeUnit || 'vw';
    field.style.fontFamily = fs.fontFamily || '';
    field.style.fontWeight = String(fs.fontWeight ?? 400);
    field.style.fontStyle = fs.fontStyle || 'normal';
    field.style.fontSize = `${Number(fs.fontSize ?? 1.2)}${unit}`;
    field.style.letterSpacing = (fs.letterSpacing ?? 0) + 'px';
    field.style.lineHeight = String(fs.lineHeight ?? 1.2);
    field.style.textTransform = fs.textTransform || 'none';
    field.style.color = fs.textColor || '#e9ecef';
    field.style.background = fs.backgroundColor || 'transparent';

    const bw = Number(fs.border?.width ?? 0);
    const bs = fs.border?.style || 'solid';
    const bc = fs.border?.color || 'transparent';
    field.style.border = bw > 0 ? `${bw}px ${bs} ${bc}` : 'none';
    field.style.borderRadius = (fs.border?.radius ?? 0) + 'px';

    // per sicurezza, rimuovi eventuali padding/outline di default
    field.style.outline = 'none';
    field.style.padding = '6px 8px';
    field.style.boxSizing = 'border-box';

    // --- Pattern: compila in sicurezza e imposta l'attributo solo se valido ---
    const rawPattern = (this.pattern || '').trim();
    let body = '', flags = '', compiled = null;

    if (rawPattern) {
      if (rawPattern[0] === '/' && rawPattern.lastIndexOf('/') > 0) {
        const last = rawPattern.lastIndexOf('/');
        body = rawPattern.slice(1, last);
        flags = rawPattern.slice(last + 1);
      } else {
        body = rawPattern;
      }
      try {
        compiled = new RegExp(body, flags.replace(/[^gimsuy]/g, ''));
      } catch {
        compiled = null;
      }
    }

    // HTML pattern NON accetta flag: lo settiamo solo se la regex è valida e senza flag
    if (compiled && !flags) {
      try { field.setAttribute('pattern', body); }
      catch { field.removeAttribute('pattern'); }
    } else {
      field.removeAttribute('pattern');
    }

    // --- Validazione live (solo feedback visivo; vuoto = ok) ---
    const baseBorderColor = (this.inputStyle?.border?.color || 'transparent');
    const baseBorderWidth = +((this.inputStyle?.border?.width ?? 0));
    const baseBorderStyle = (this.inputStyle?.border?.style || 'solid');

    const setInvalid = (bad) => {
      if (bad) {
        field.style.border = `${Math.max(1, baseBorderWidth)}px ${baseBorderStyle} #dc3545`;
        field.style.boxShadow = '0 0 0 .12rem rgba(220,53,69,.25)';
      } else {
        field.style.border = baseBorderWidth > 0
          ? `${baseBorderWidth}px ${baseBorderStyle} ${baseBorderColor}`
          : 'none';
        field.style.boxShadow = '';
      }
    };

    const runValidation = () => {
      if (!compiled) { setInvalid(false); field.setCustomValidity(''); return; }
      const v = field.value ?? '';
      const ok = (v === '') || compiled.test(v);
      setInvalid(!ok);
      field.setCustomValidity(ok ? '' : 'Formato non valido');
    };

    if (!field._medelBoundValidation) {
      field.addEventListener('input', runValidation);
      field.addEventListener('blur', runValidation);
      field._medelBoundValidation = true;
    }
    runValidation();

  }

  // === UI schema ===
  getPropSchema() {
    return [
      ...super.getPropSchema(),

      // ---------- ETICHETTA ----------
      { section: 'Etichetta', key: 'label.text', label: 'Testo etichetta', type: 'text' },
      {
        section: 'Etichetta', key: 'label.position', label: 'Posizione', type: 'select',
        options: [['left', 'Sinistra'], ['top', 'Sopra'], ['inline', 'Inline']]
      },
      { section: 'Etichetta', key: 'label.gap', label: 'Spazio (px)', type: 'number', min: 0 },
      

      // Tipografia etichetta
      {
        section: 'Etichetta', 
        key: 'label.style.fontFamily', 
        label: 'Font', 
        type: 'select',
        options: FONT_FAMILIES.map(([v, l]) => [v, l])
      },

      { section: 'Etichetta', group: 'font-size', key: 'label.style.fontSize', label: '', type: 'number', min: 0.1, step: 0.1 },
      {
        section: 'Etichetta', group: 'font-size', key: 'label.style.fontSizeUnit', label: '', type: 'select',
        options: [['vw', 'vw'], ['px', 'px'], ['%', '%']]
      },

      { section: 'Etichetta', key: 'label.style.fontWeight', label: 'Peso', type: 'range', min: 100, max: 900, step: 100 },
      { section: 'Etichetta', key: 'label.style.fontStyle', label: 'Stile', type: 'select', options: [['normal', 'Normale'], ['italic', 'Corsivo']] },
      { section: 'Etichetta', key: 'label.style.textColor', label: 'Colore', type: 'color-alpha' },

      // ---------- CAMPO (logica) ----------
      { section: 'Campo', key: 'name', label: 'Name', type: 'text' },
      { section: 'Campo', key: 'placeholder', label: 'Placeholder', type: 'text' },
      {
        section: 'Campo', key: 'align', label: 'Allineamento', type: 'select',
        options: [['left', 'Sinistra'], ['center', 'Centro'], ['right', 'Destra']]
      },
      { section: 'Campo', key: 'isPassword', label: 'Password', type: 'checkbox' },
      { section: 'Campo', key: 'multiline', label: 'Multilinea', type: 'checkbox' },
      { section: 'Campo', key: 'maxLength', label: 'Lunghezza max', type: 'number', min: 1 },
      { section: 'Campo', key: 'pattern', label: 'Pattern (regex)', type: 'text' },

      // ---------- Tipografia CAMPO ----------
      {
        section: 'Tipografia campo', 
        key: 'inputStyle.fontFamily', 
        label: 'Font', 
        type: 'select',
        options: FONT_FAMILIES.map(([v, l]) => [v, l])
      },

      { section: 'Tipografia campo', group: 'font-size', key: 'inputStyle.fontSize', label: '', type: 'number', min: 0.1, step: 0.1 },
      {
        section: 'Tipografia campo', group: 'font-size', key: 'inputStyle.fontSizeUnit', label: '', type: 'select',
        options: [['vw', 'vw'], ['px', 'px'], ['%', '%']]
      },

      { section: 'Tipografia campo', key: 'inputStyle.fontWeight', label: 'Peso', type: 'range', min: 100, max: 900, step: 100 },
      { section: 'Tipografia campo', key: 'inputStyle.fontStyle', label: 'Stile', type: 'select', options: [['normal', 'Normale'], ['italic', 'Corsivo']] },
      { section: 'Tipografia campo', key: 'inputStyle.letterSpacing', label: 'Spaziatura (px)', type: 'number' },
      { section: 'Tipografia campo', key: 'inputStyle.lineHeight', label: 'Interlinea', type: 'number', step: 0.1 },
      {
        section: 'Tipografia campo', key: 'inputStyle.textTransform', label: 'Trasformazione', type: 'select',
        options: [['none', 'Nessuna'], ['uppercase', 'Maiuscolo'], ['lowercase', 'Minuscolo'], ['capitalize', 'Iniz. maiuscola']]
      },

      // ---------- Colori & Bordo CAMPO ----------
      { section: 'Colori & Bordo campo', key: 'inputStyle.textColor', label: 'Testo', type: 'color-alpha' },
      { section: 'Colori & Bordo campo', key: 'inputStyle.backgroundColor', label: 'Sfondo', type: 'color-alpha' },

      { section: 'Colori & Bordo campo', group: 'border', key: 'inputStyle.border.width', label: 'px', type: 'number', min: 0 },
      { section: 'Colori & Bordo campo', group: 'border', key: 'inputStyle.border.color', label: '', type: 'color-alpha' },

      {
        section: 'Colori & Bordo campo', key: 'inputStyle.border.style', label: 'Stile bordo', type: 'select',
        options: [['solid', 'Solido'], ['dashed', 'Tratteggio'], ['dotted', 'Punteggiato']]
      },
      { section: 'Colori & Bordo campo', key: 'inputStyle.border.radius', label: 'Raggio (px)', type: 'number', min: 0 },
    ];
  }
}