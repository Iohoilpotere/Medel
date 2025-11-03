import { registry } from '../core/registry.js';
import { BaseElement } from './base-element.js';
import { applyTextStyleToAll } from '../utils/text-style.js';
import { applyLockSingleCheckbox } from '../behaviors/lockable.js';

export class CheckboxElement extends BaseElement {
  constructor(opts = {}) {
    super(opts);
    this._stepConfirmed = false;
    this.setProp('text', opts.text ?? 'Checkbox');
    // text style defaults
    this.setProp('fontFamily', opts.fontFamily ?? 'System');
    this.setProp('fontWeight', Number.isFinite(opts.fontWeight) ? opts.fontWeight : 400);
    this.setProp('italic', !!opts.italic);
    this.setProp('fontSize', Number.isFinite(opts.fontSize) ? opts.fontSize : 16);
    this.setProp('fontSizeUnit', opts.fontSizeUnit ?? 'px');
    this.setProp('letterSpacing', Number.isFinite(opts.letterSpacing) ? opts.letterSpacing : 0);
    this.setProp('lineHeight', Number.isFinite(opts.lineHeight) ? opts.lineHeight : 1.2);
    this.setProp('shadowColor', opts.shadowColor ?? 'rgba(0,0,0,0.5)');
    this.setProp('shadowDx', Number.isFinite(opts.shadowDx) ? opts.shadowDx : 0);
    this.setProp('shadowDy', Number.isFinite(opts.shadowDy) ? opts.shadowDy : 0);
    this.setProp('shadowBlur', Number.isFinite(opts.shadowBlur) ? opts.shadowBlur : 6);
    this.setProp('strokeColor', opts.strokeColor ?? null);
    this.setProp('strokeWidth', Number.isFinite(opts.strokeWidth) ? opts.strokeWidth : 0);
  }
  updateDom() {
    super.updateDom();
    if (!this.content) return;
    this.content.innerHTML = '';
    const label = document.createElement('label');
    const ctl = document.createElement('div'); ctl.className = 'ui-ctl'; label.appendChild(ctl); label.style.display = 'block'; label.style.width = '100%'; label.style.boxSizing = 'border-box'; label.style.whiteSpace = 'nowrap';
    label.style.userSelect = 'none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    if (!input.dataset) input.dataset = {}; if (!('locked' in input.dataset)) input.dataset.locked = '0';
    try { const __bus = this.stage && this.stage.bus; if (__bus) { __bus.on('step-state', (st) => { this._stepConfirmed = !!(st && st.confirmed); }); __bus.on('step-confirmed', () => { this._stepConfirmed = true; }); } } catch (_e) { }
    input.addEventListener('change', () => { const _active = !!this.getProp('lockOnSelect'); if (_active && input.dataset && input.dataset.locked === '1' && !input.checked) { input.checked = true; } });

    // auto: lock-on-select behavior
    try { applyLockSingleCheckbox(input, this); } catch (_e) { }

    // lock-on-select guards (single checkbox)
    input.addEventListener('mousedown', (e) => {
      const _lock = !!this.getProp('lockOnSelect');
      if (_lock && input.checked && input.dataset && input.dataset.locked === '1') {
        e.preventDefault(); e.stopPropagation();
      }
    }, true);
    input.addEventListener('keydown', (e) => {
      const _lock = !!this.getProp('lockOnSelect');
      const key = e.key || e.code;
      if (_lock && input.checked && input.dataset && input.dataset.locked === '1' && (key === ' ' || key === 'Space' || key === 'Enter' || key === 'Spacebar')) {
        e.preventDefault(); e.stopPropagation();
      }
    });

    if (input.dataset && input.dataset.locked === '1' && !input.checked) {
      input.checked = true;
      return;
    }

    label.appendChild(input);
    const txt = document.createElement('span');
    txt.textContent = ' ' + String(this.getProp('text') ?? '');
    label.appendChild(txt);
    label.appendChild(ctl);
    this.content.appendChild(label);
    // post-layout adjust for single checkbox
    (() => {
      const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      const inp = label.querySelector('input[type=checkbox]');
      if (!inp) return;
      label.style.position = 'relative';
      inp.style.position = 'absolute';
      inp.style.left = String(4 * zoom2) + 'px';
      inp.style.top = '0px';
      inp.style.transformOrigin = 'left top';
      inp.style.transform = `scale(${zoom2})`;
      const padBase = (inp.offsetWidth || 16) + (Number(this.getProp('labelGap') || 6));
      label.style.paddingLeft = String(padBase * zoom2) + 'px';
    })();

    // Prevent deselect via label when locked (standard checkbox only)
    if ((this.getProp('selectionStyle') || 'standard') !== 'switch') {
      label.addEventListener('click', (e) => {
        const _active = !!this.getProp('lockOnSelect');
        if (!_active) return;
        const confirmed = !!this._stepConfirmed;
        if (confirmed && input.dataset && input.dataset.locked === '1' && input.checked) {
          e.preventDefault(); e.stopPropagation();
        }
      }, true);
    }

    // Switch style rendering (if enabled)
    if ((this.getProp('selectionStyle') || 'standard') === 'switch') {
      const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      input.style.opacity = '0';
      input.style.position = 'absolute'; input.style.left = '0'; input.style.top = '0';
      label.style.position = 'relative';
      const track = document.createElement('div');
      const knob = document.createElement('div');
      const w = 34 * zoom, h = 18 * zoom;
      const rBase = Number.isFinite(this.getProp('switchRadius')) ? this.getProp('switchRadius') : 9;
      const r = rBase * zoom;
      track.style.position = 'absolute'; track.style.left = '0'; track.style.top = '50%'; track.style.transform = 'translateY(-50%)';
      track.style.width = w + 'px'; track.style.height = h + 'px';
      const swOn = this.getProp('switchBgOn') || '#4ade80';
      const swOff = this.getProp('switchBgOff') || '#666';
      track.style.background = input.checked ? swOn : swOff;
      track.style.borderRadius = r + 'px';
      const sbw = Number.isFinite(this.getProp('switchBorderWidth')) ? this.getProp('switchBorderWidth') : 1;
      const sbc = this.getProp('switchBorderColor') || 'rgba(255,255,255,0.3)';
      track.style.border = String(sbw * zoom) + 'px solid ' + sbc; label.style.minHeight = (h + 2 * (sbw * zoom)) + 'px';

      const ssc = this.getProp('switchShadowColor') || '';
      const sdx = Number(this.getProp('switchShadowDx') || 0);
      const sdy = Number(this.getProp('switchShadowDy') || 0);
      const sblur = Number(this.getProp('switchShadowBlur') || 0);
      if (ssc) { track.style.boxShadow = `${sdx}px ${sdy}px ${sblur}px ${ssc}`; }
      else { track.style.boxShadow = ''; }

      track.appendChild(knob);
      label.appendChild(track);

      const kSize = Math.max(10 * zoom, h - 2 * (sbw * zoom));
      knob.style.position = 'absolute';
      knob.style.top = '50%'; knob.style.transform = 'translateY(-50%)';
      knob.style.left = input.checked ? (w - (sbw * zoom) - kSize) + 'px' : (sbw * zoom) + 'px';
      knob.style.width = kSize + 'px';
      knob.style.height = kSize + 'px';
      knob.style.borderRadius = (kSize / 2) + 'px';
      knob.style.background = this.getProp('switchKnobColor') || '#fff';

      const updateSwitch = () => {
        track.style.background = input.checked ? swOn : swOff;
        knob.style.left = input.checked ? (w - (sbw * zoom) - kSize) + 'px' : (sbw * zoom) + 'px';
      };
      input.addEventListener('input', updateSwitch);
      input.addEventListener('change', updateSwitch);
      label.addEventListener('click', (e) => {
        if (e.target === input) return;
        const _lock = !!this.getProp('lockOnSelect');
        if (!_lock || !this._stepConfirmed) {
          input.checked = !input.checked;
          if (!input.dataset) input.dataset = {};
          input.dataset.locked = '0';
          updateSwitch();
          e.preventDefault(); e.stopPropagation();
          if (typeof input.onchange === 'function') input.onchange(e);
          return;
        }
        if (_lock && input.dataset && input.dataset.locked === '1' && input.checked) {
          e.preventDefault(); e.stopPropagation();
          return;
        }
        input.checked = !input.checked;
        updateSwitch();
        e.preventDefault(); e.stopPropagation();
        if (typeof input.onchange === 'function') input.onchange(e);
      });
      updateSwitch();
    }

    // layout: absolute-position the checkbox input and scale indent with zoom (do after creation)
    const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
    label.style.position = 'relative'; label.style.display = 'flex'; label.style.alignItems = 'center'; label.style.gap = '0.5em';
    input.style.position = 'absolute';
    input.style.left = (4 * zoom2) + 'px';
    input.style.top = '0.2em';
    const padBase2 = (input.offsetWidth || 16) + (Number(this.getProp('labelGap') || 6));
    const __alignH = this.getProp('alignH') || 'left';
    this.__applyCheckboxAlignment(label, input, txt, __alignH, zoom2, padBase2);
    // vertical alignment (ported from working version)
    (() => {
      const zoomV = zoom2;
      const inp = label.querySelector('input[type=checkbox]');
      if (!inp) return;
      // skip vertical override for switch skin
      if ((this.getProp('selectionStyle') || 'standard') === 'switch') return;

      const alignH = this.getProp('alignH') || 'left';
      const alignV = this.getProp('alignV') || 'middle';
      const rawGap = Number(this.getProp('labelGap'));
      const gap = (Number.isFinite(rawGap) ? rawGap : 2) * zoomV;

      // container becomes flex column to place checkbox vertically in the element space
      if (this.content) {
        this.content.style.display = 'flex';
        this.content.style.flexDirection = 'column';
        this.content.style.height = '100%';
        this.content.style.justifyContent =
          (alignV === 'top') ? 'flex-start' :
          (alignV === 'bottom') ? 'flex-end' : 'center';
        // horizontal text align on container as in working code
        const h = (alignH === 'right') ? 'right' : ((alignH === 'center' || alignH === 'justify') ? 'center' : 'left');
        this.content.style.textAlign = h;
      }

      // label as inline-flex wrapper
      label.style.display = 'inline-flex';
      label.style.whiteSpace = 'normal';
      label.style.alignItems = 'center';

      // reset absolute layout on input (we want flow layout here)
      inp.style.position = 'static';
      inp.style.left = '';
      inp.style.top = '';
      inp.style.transformOrigin = 'center center';
      inp.style.transform = '';

      const spanTxt = label.querySelector('span') || txt;

      // reset spacing
      spanTxt.style.marginLeft = '0px';
      spanTxt.style.marginRight = '0px';
      spanTxt.style.marginTop = '0px';

      if (alignH === 'left') {
        // [checkbox][text]
        if (label.firstElementChild !== inp) {
          label.insertBefore(inp, spanTxt);
        }
        label.style.flexDirection = 'row';
        spanTxt.style.marginLeft = gap + 'px';
      } else if (alignH === 'right') {
        // [text][checkbox]
        if (label.firstElementChild !== spanTxt) {
          label.insertBefore(spanTxt, inp);
        }
        label.style.flexDirection = 'row';
        spanTxt.style.marginRight = gap + 'px';
      } else {
        // center: checkbox on top, text below
        if (label.firstElementChild !== inp) {
          label.insertBefore(inp, spanTxt);
        }
        label.style.flexDirection = 'column';
        label.style.alignItems = 'center';
        spanTxt.style.marginTop = gap + 'px';
      }

      // adapt checkbox box to font size (like working code)
      try {
        const fsPx = parseFloat(window.getComputedStyle(label).fontSize) || (16 * zoomV);
        inp.style.width = fsPx + 'px';
        inp.style.height = fsPx + 'px';
      } catch (_e) {}
    })();

    // apply text styles to label
    const fam = this.getProp('fontFamily') || 'System';
    const fontMap = {
      'System': 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Inter': 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Roboto': 'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
      'Arial': 'Arial, Helvetica, sans-serif',
      'Georgia': 'Georgia, serif',
      'Times New Roman': '"Times New Roman", Times, serif',
      'Courier New': '"Courier New", monospace'
    };
    label.style.fontFamily = fontMap[fam] || fam;
    label.style.fontWeight = String(this.getProp('fontWeight') || 400);
    label.style.fontStyle = (this.getProp('italic') ? 'italic' : 'normal');
    const fs = this.getProp('fontSize') ?? 16;
    const unit = this.getProp('fontSizeUnit') || 'px';
    const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
    label.style.fontSize = (unit === 'px' ? String(fs * zoom) + 'px' : String(fs) + unit);
    label.style.textDecorationColor = 'currentColor'; label.style.color = this.getProp('color') || '#ffffff';
    const ls = this.getProp('letterSpacing'); label.style.letterSpacing = (Number.isFinite(ls) ? ls : 0) + 'px';
    const lh = this.getProp('lineHeight'); label.style.lineHeight = Number.isFinite(lh) ? String(lh) : '1.2';
    const sw = Number(this.getProp('strokeWidth') || 0), sc = this.getProp('strokeColor');
    if (sw > 0 && sc) { label.style.webkitTextStroke = `${sw}px ${sc}`; try { label.style.textStroke = `${sw}px ${sc}`; } catch (e) { } } else { label.style.webkitTextStroke = ''; try { label.style.textStroke = ''; } catch (e) { } }
    const col = this.getProp('shadowColor') || 'rgba(0,0,0,0.5)'; const dx = Number(this.getProp('shadowDx') || 0), dy = Number(this.getProp('shadowDy') || 0), blur = Number(this.getProp('shadowBlur') || 6);
    label.style.textShadow = `${dx}px ${dy}px ${blur}px ${col}`;

    if (this.content) { try { applyTextStyleToAll(this.content, this); } catch (_e) { } }
  }

  __applyCheckboxAlignment(label, input, txt, alignH, zoom2, padBase2) {
    const mode = (alignH === 'justify') ? 'left' : (alignH || 'left');

    // base
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '0.5em';
    label.style.textAlign = 'left';

    input.style.position = 'absolute';
    input.style.top = '0.2em';
    input.style.left = (4 * zoom2) + 'px';

    txt.style.display = 'inline-block';
    txt.style.paddingLeft = (padBase2) + 'px';
    txt.style.paddingRight = '0px';
    txt.style.textAlign = 'left';

    if (mode === 'left') {
      return;
    }

    if (mode === 'right') {
      // push everything to the right
      label.style.justifyContent = 'flex-end';
      label.style.textAlign = 'right';
      input.style.left = '';
      input.style.right = (4 * zoom2) + 'px';
      txt.style.paddingLeft = '0px';
      txt.style.paddingRight = (padBase2) + 'px';
      txt.style.textAlign = 'right';
      return;
    }

    if (mode === 'center') {
      label.style.flexDirection = 'column';
      label.style.alignItems = 'center';
      label.style.textAlign = 'center';
      input.style.position = 'static';
      input.style.left = '';
      input.style.right = '';
      input.style.top = '';
      txt.style.paddingLeft = '0px';
      txt.style.paddingRight = '0px';
      txt.style.textAlign = 'center';
      return;
    }
  }
}
CheckboxElement.type = 'checkbox';
registry.registerElement(CheckboxElement.type, CheckboxElement);
