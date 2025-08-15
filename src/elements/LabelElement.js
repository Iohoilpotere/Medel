import BaseElement from '../core/base-element.js';
import { FONT_FAMILIES } from '../config/fonts.js';

export default class LabelElement extends BaseElement {
  static FONTS = FONT_FAMILIES;

  getPropSchema() {
    return [
      ...super.getPropSchema(),

      // ===== Tipografia =====
      { section: 'Tipografia', key: 'text', label: 'Testo', type: 'textarea' },

      // Font family → select (niente doppia label)
      {
        section: 'Tipografia', 
        key: 'style.fontFamily', 
        label: 'Font', 
        type: 'select',
        options: FONT_FAMILIES.map(([v, l]) => [v, l])
      },

      // Dimensione + Unità (una riga sola: il gruppo porta la label "Dimensione")
      { section: 'Tipografia', group: 'font-size', key: 'style.fontSize', label: '', type: 'number', min: 0.1, step: 0.1 },
      {
        section: 'Tipografia', group: 'font-size', key: 'style.fontSizeUnit', label: '', type: 'select',
        options: [['vw', 'vw'], ['px', 'px'], ['%', '%']]
      },

      // Peso (solo slider: 100..900)
      { section: 'Tipografia', group: 'font-weight', key: 'style.fontWeight', label: '', type: 'range', min: 100, max: 900, step: 100 },


      // Stile (italic)
      {
        section: 'Tipografia', key: 'style.fontStyle', label: 'Stile', type: 'select',
        options: [['normal', 'Normale'], ['italic', 'Corsivo']]
      },

      { section: 'Tipografia', key: 'style.letterSpacing', label: 'Spaziatura (px)', type: 'number' },
      { section: 'Tipografia', key: 'style.lineHeight', label: 'Interlinea', type: 'number', step: 0.1 },
      {
        section: 'Tipografia', key: 'style.textTransform', label: 'Trasformazione', type: 'select',
        options: [['none', 'Nessuna'], ['uppercase', 'Maiuscolo'], ['lowercase', 'Minuscolo'], ['capitalize', 'Iniz. maiuscola']]
      },

      // ===== Colori & Effetti =====
      { section: 'Colori & Effetti', key: 'style.textColor', label: 'Colore testo', type: 'color-alpha' },

      { section: 'Colori & Effetti', key: 'style.textStrokeWidth', label: 'Bordo testo (px)', type: 'number', min: 0 },
      { section: 'Colori & Effetti', key: 'style.textStrokeColor', label: 'Colore bordo testo', type: 'color-alpha' },

      // OMBRA (niente parola "Colore", rinomina "Sfocatura" in "Blurr")
      { section: 'Colori & Effetti', group: 'shadow', key: 'style.textShadow.x', label: '↔', type: 'number' },
      { section: 'Colori & Effetti', group: 'shadow', key: 'style.textShadow.y', label: '↕', type: 'number' },
      { section: 'Colori & Effetti', group: 'shadow', key: 'style.textShadow.color', label: '', type: 'color-alpha' },
      { section: 'Colori & Effetti', group: 'shadow', key: 'style.textShadow.blur', label: 'Blurr', type: 'number', min: 0 },


      // ===== Allineamenti =====
      {
        section: 'Allineamenti', key: 'style.hAlign', label: 'Allineamento orizz.', type: 'select',
        options: [['left', 'Sinistra'], ['center', 'Centro'], ['right', 'Destra']]
      },
      {
        section: 'Allineamenti', key: 'style.vAlign', label: 'Allineamento vert.', type: 'select',
        options: [['top', 'Alto'], ['middle', 'Centro'], ['bottom', 'Basso']]
      },

      // ===== Background & Bordo =====
      { section: 'Background & Bordo', key: 'style.backgroundColor', label: 'Sfondo', type: 'color-alpha' },

      // Bordo (Spessore, Colore) sotto la stessa etichetta “Bordo”
      { section: 'Background & Bordo', group: 'border', key: 'style.border.width', label: 'px', type: 'number', min: 0 },
      { section: 'Background & Bordo', group: 'border', key: 'style.border.color', label: '', type: 'color-alpha' },


      // Dettagli bordo extra (righe singole)
      {
        section: 'Background & Bordo', key: 'style.border.style', label: 'Stile bordo', type: 'select',
        options: [['solid', 'Solido'], ['dashed', 'Tratteggio'], ['dotted', 'Punteggiato']]
      },
      { section: 'Background & Bordo', key: 'style.border.radius', label: 'Raggio (px)', type: 'number', min: 0 },

      // ===== Box & Misc =====
      { section: 'Box & Misc', group: 'padding', key: 'style.padding.top', label: '↑', type: 'number', min: 0 },
      { section: 'Box & Misc', group: 'padding', key: 'style.padding.bottom', label: '↓', type: 'number', min: 0 },
      { section: 'Box & Misc', group: 'padding', key: 'style.padding.right', label: '→', type: 'number', min: 0 },
      { section: 'Box & Misc', group: 'padding', key: 'style.padding.left', label: '←', type: 'number', min: 0 },


      { section: 'Box & Misc', key: 'style.opacity', label: 'Opacità', type: 'number', min: 0, max: 1, step: 0.1 },
    ];
  }


  constructor() {
    super('label', 10, 10, 30, 10);

    this.text = 'Etichetta';

    // LabelStyle (default)
    this.style = {
      // tipografia
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: 2.2,
      fontSizeUnit: 'vw', // 'vw' | 'px' | '%'
      fontWeight: 500,
      fontStyle: 'normal', // 'normal' | 'italic'
      letterSpacing: 0,    // px (puoi interpretare anche 'em' se vorrai)
      lineHeight: 1.2,     // unitless
      textTransform: 'none', // 'none'|'uppercase'|'lowercase'|'capitalize'

      // colori & effetti
      textColor: '#ffffff',
      textStrokeWidth: 0,      // px
      textStrokeColor: '#000000',
      textShadow: { x: 0, y: 0, blur: 0, color: 'rgba(0,0,0,0)' },

      // allineamenti
      hAlign: 'left',   // 'left'|'center'|'right'
      vAlign: 'middle', // 'top'|'middle'|'bottom'

      // background & bordo & padding
      backgroundColor: 'transparent',
      border: { color: 'rgba(255,255,255,.0)', width: 0, style: 'solid', radius: 0 },
      padding: { top: 8, right: 8, bottom: 8, left: 8 }, // px

      // misc
      opacity: 1
    };

    // layout testo
    this.wrap = 'normal';       // 'normal'|'nowrap'|'balance'
    this.maxLines = null;       // number | null
  }

  createDom() {
    const el = document.createElement('div');
    el.className = 'el el-label';
    el.dataset.type = 'label';
    el.id = this.id;
    // .content = flex box per hAlign/vAlign, .text = contenitore testuale (line-clamp)
    el.innerHTML = `
      <div class="content w-100 h-100 d-flex">
        <span class="text"></span>
      </div>`;
    this.dom = el;
    this.readProps();
    return el;
  }
  readProps() {
    super.readProps();
    if (!this.dom) return;

    const c = this.dom.querySelector('.content');
    const tx = this.dom.querySelector('.text');
    const s = this.style || {};

    // testo
    tx.textContent = this.text ?? '';

    // dimensionamento & font
    const unit = s.fontSizeUnit || 'vw';
    tx.style.fontFamily = s.fontFamily || '';
    tx.style.fontWeight = String(s.fontWeight ?? 400);
    tx.style.fontStyle = s.fontStyle || 'normal';
    tx.style.fontSize = `${Number(s.fontSize ?? 1)}${unit}`;
    tx.style.letterSpacing = (s.letterSpacing ?? 0) + 'px';
    tx.style.lineHeight = String(s.lineHeight ?? 1.2);
    tx.style.textTransform = s.textTransform || 'none';
    tx.style.color = s.textColor || '#000';

    // stroke (webkit) + fallback
    const sw = Number(s.textStrokeWidth ?? 0);
    const sc = s.textStrokeColor || '#000';
    tx.style.webkitTextStrokeWidth = sw ? `${sw}px` : '0';
    tx.style.webkitTextStrokeColor = sc;

    // ombra
    if (s.textShadow) {
      const { x = 0, y = 0, blur = 0, color = 'rgba(0,0,0,0)' } = s.textShadow || {};
      tx.style.textShadow = `${x}px ${y}px ${blur}px ${color}`;
    } else {
      tx.style.textShadow = 'none';
    }

    // allineamenti (flex sulla .content)
    const hMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
    const vMap = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };
    c.style.justifyContent = hMap[s.hAlign || 'left'];
    c.style.alignItems = vMap[s.vAlign || 'middle'];

    // background/border/padding sul contenitore esterno (this.dom)
    const box = this.dom;
    box.style.background = s.backgroundColor || 'transparent';

    const bw = Number(s.border?.width ?? 0);
    const bs = s.border?.style || 'solid';
    const bc = s.border?.color || 'transparent';
    box.style.border = bw > 0 ? `${bw}px ${bs} ${bc}` : 'none';
    box.style.borderRadius = (s.border?.radius ?? 0) + 'px';

    const p = s.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    box.style.padding = `${p.top || 0}px ${p.right || 0}px ${p.bottom || 0}px ${p.left || 0}px`;

    // opacità
    box.style.opacity = String(s.opacity ?? 1);

    // wrapping & clamping sul nodo testuale
    // wrap
    if (this.wrap === 'nowrap') {
      tx.style.whiteSpace = 'nowrap';
      tx.style.setProperty('text-wrap', 'initial');
    } else if (this.wrap === 'balance') {
      tx.style.whiteSpace = 'normal';
      tx.style.setProperty('text-wrap', 'balance'); // supporto variabile
    } else {
      tx.style.whiteSpace = 'normal';
      tx.style.setProperty('text-wrap', 'initial');
    }
    // clamp
    const ml = Number(this.maxLines || 0);
    if (ml && this.wrap !== 'nowrap') {
      tx.style.display = '-webkit-box';
      tx.style.webkitLineClamp = String(ml);
      tx.style.webkitBoxOrient = 'vertical';
      tx.style.overflow = 'hidden';
    } else {
      tx.style.display = '';
      tx.style.webkitLineClamp = '';
      tx.style.webkitBoxOrient = '';
      tx.style.overflow = '';
    }
  }
}
